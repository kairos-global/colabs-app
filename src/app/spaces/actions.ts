"use server";

import { headers } from "next/headers";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getProfileByClerkId } from "@/lib/profile";
import {
  getMaxCollaboratorsPerSpaceForPlan,
  getMaxSpacesForPlan,
  getPlanTierForProfile,
  getSpaceByteLimitForPlan,
} from "@/lib/billing/limits";

/** Profile media bucket. Do not use for space media. */
const PROFILE_MEDIA_BUCKET = "profile-media";
/** Space uploads: `{spaceId}/images|video|audio/{uuid}.{ext}` */
const SPACE_MEDIA_BUCKET = "space-media";

export type CreateSpaceResult = { ok: true; spaceId: string } | { ok: false; error: string };
export type UpdateSpaceResult = { ok: true } | { ok: false; error: string };

export type SpacePageData = {
  id: string;
  title: string;
  memberCount: number;
  messages: SpaceMessage[];
  media: SpaceMedia[];
  bulletins: SpaceBulletin[];
  tasks: SpaceTask[];
  storage: {
    usedBytes: number;
    maxBytes: number;
  };
} | null;

export type SpaceMessage = {
  id: string;
  content: string;
  author_id: string;
  created_at: string;
};

export type SpaceMedia = {
  id: string;
  type: string;
  storage_path: string;
  title: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  visibility: string | null;
  created_at: string;
  publicUrl: string;
};

export type SpaceBulletin = {
  id: string;
  title: string;
  description: string | null;
  visibility: string | null;
  created_at: string;
};

export type SpaceTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  visibility: string | null;
  created_at: string;
};

function normalizeEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) return null;
  return email.trim().toLowerCase();
}

function clerkUserEmailSet(user: Awaited<ReturnType<typeof currentUser>>): Set<string> {
  const set = new Set<string>();
  if (!user) return set;
  const primary = user.primaryEmailAddress?.emailAddress;
  const p = normalizeEmail(primary ?? undefined);
  if (p) set.add(p);
  for (const e of user.emailAddresses ?? []) {
    const n = normalizeEmail(e.emailAddress);
    if (n) set.add(n);
  }
  return set;
}

async function countMembershipSpacesForUser(
  supabase: ReturnType<typeof getServerSupabaseClient>,
  profileId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("space_members")
    .select("*", { count: "exact", head: true })
    .eq("user_id", profileId);
  if (error) return 0;
  return count ?? 0;
}

export async function createSpace(): Promise<CreateSpaceResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };
    const supabase = getServerSupabaseClient();
    const user = await currentUser();
    const displayName =
      user?.firstName != null || user?.lastName != null
        ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null
        : null;
    const profile = await getOrCreateProfile(supabase, userId, displayName);
    const tier = getPlanTierForProfile((profile as { plan_tier?: string | null }).plan_tier);
    const maxSpaces = getMaxSpacesForPlan(tier);
    const currentCount = await countMembershipSpacesForUser(supabase, profile.id);
    if (currentCount >= maxSpaces) {
      return {
        ok: false,
        error:
          tier === "starter"
            ? `Starter plan allows up to ${maxSpaces} spaces. Upgrade to Pro for unlimited spaces.`
            : "Could not create space.",
      };
    }

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .insert({ owner_id: profile.id, title: "Untitled" })
      .select("id")
      .single();
    if (spaceError) return { ok: false, error: spaceError.message };
    if (!space) return { ok: false, error: "Failed to create space" };

    const { error: memberError } = await supabase.from("space_members").insert({
      space_id: space.id,
      user_id: profile.id,
      role: "owner",
    });
    if (memberError) return { ok: false, error: memberError.message };

    return { ok: true, spaceId: space.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function updateSpace(
  spaceId: string,
  updates: { title?: string }
): Promise<UpdateSpaceResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const payload: { title?: string; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title;

    const { error } = await supabase
      .from("spaces")
      .update(payload)
      .eq("id", spaceId)
      .eq("owner_id", profile.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function getSpacePageData(spaceId: string): Promise<SpacePageData> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return null;

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .select("id, title, owner_id")
      .eq("id", spaceId)
      .single();
    if (spaceError || !space) return null;

    const isOwner = space.owner_id === profile.id;
    const { data: memberRow } = await supabase
      .from("space_members")
      .select("id")
      .eq("space_id", spaceId)
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!isOwner && !memberRow) return null;

    const { count, error: countError } = await supabase
      .from("space_members")
      .select("id", { count: "exact", head: true })
      .eq("space_id", spaceId);
    if (countError) return null;

    const tier = getPlanTierForProfile((profile as { plan_tier?: string | null }).plan_tier);
    const maxBytes = getSpaceByteLimitForPlan(tier);

    const [messagesRes, mediaRes, boardsRes, tasksRes] = await Promise.all([
      supabase
        .from("space_messages")
        .select("id, content, author_id, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true }),
      supabase
        .from("space_media")
        .select("id, type, storage_path, title, size_bytes, mime_type, visibility, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false }),
      supabase
        .from("space_boards")
        .select("id, title, description, visibility, created_at")
        .eq("space_id", spaceId)
        .eq("type", "bulletin")
        .order("created_at", { ascending: false }),
      supabase
        .from("space_tasks")
        .select("id, title, description, status, visibility, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false }),
    ]);

    const rawMessages = (messagesRes.data ?? []) as {
      id: string;
      content: string;
      author_id: string;
      created_at: string;
    }[];
    const authorIds = [...new Set(rawMessages.map((m) => m.author_id))];
    const authorNames = new Map<string, string | null>();
    if (authorIds.length > 0) {
      const { data: authorRows } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", authorIds);
      for (const row of authorRows ?? []) {
        authorNames.set((row as { id: string; display_name: string | null }).id, (row as { display_name: string | null }).display_name);
      }
    }
    const messagesWithAuthors: SpaceMessage[] = rawMessages.map((m) => ({
      id: m.id,
      content: m.content,
      author_id: m.author_id,
      author_display_name: authorNames.get(m.author_id) ?? null,
      created_at: m.created_at,
    }));

    const mediaRows = mediaRes.data ?? [];
    const mediaWithUrls: SpaceMedia[] = mediaRows.map((row) => {
      const bucket =
        row.storage_path.startsWith("spaces/")
          ? PROFILE_MEDIA_BUCKET
          : SPACE_MEDIA_BUCKET;
      return {
        ...row,
        publicUrl: supabase.storage.from(bucket).getPublicUrl(row.storage_path).data.publicUrl,
      };
    });
    const usedBytes =
      mediaRows.reduce((sum, row) => sum + (row.size_bytes ?? 0), 0) ?? 0;

    return {
      id: space.id,
      title: space.title ?? "Untitled",
      memberCount: count ?? 0,
      messages: messagesWithAuthors,
      media: mediaWithUrls,
      bulletins: (boardsRes.data ?? []) as SpaceBulletin[],
      tasks: (tasksRes.data ?? []) as SpaceTask[],
      storage: {
        usedBytes,
        maxBytes,
      },
    };
  } catch {
    return null;
  }
}

export type CreateMessageResult = { ok: true } | { ok: false; error: string };
export type CreateBulletinResult = { ok: true } | { ok: false; error: string };
export type CreateTaskResult = { ok: true } | { ok: false; error: string };
export type UploadSpaceMediaResult = { ok: true } | { ok: false; error: string };
export type SpaceSummary = {
  id: string;
  title: string;
  updatedAt: string | null;
  memberCount: number;
};

export type SpaceInvite = {
  id: string;
  spaceId: string;
  spaceTitle: string;
  inviterName: string | null;
  inviteeName: string | null;
  status: string;
  createdAt: string | null;
  token: string;
};

export type SpaceInvitesForDashboard = {
  sent: SpaceInvite[];
  received: SpaceInvite[];
};

async function ensureSpaceAccess(spaceId: string) {
  const { userId } = await auth();
  if (!userId) return { profile: null, supabase: null };
  const supabase = getServerSupabaseClient();
  const profile = await getProfileByClerkId(supabase, userId);
  if (!profile) return { profile: null, supabase: null };
  const { data: space } = await supabase.from("spaces").select("owner_id").eq("id", spaceId).single();
  if (!space) return { profile: null, supabase: null };
  const isOwner = space.owner_id === profile.id;
  const { data: memberRow } = await supabase
    .from("space_members")
    .select("id")
    .eq("space_id", spaceId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!isOwner && !memberRow) return { profile: null, supabase: null };
  return { profile, supabase };
}

export async function createSpaceMessage(spaceId: string, content: string): Promise<CreateMessageResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const trimmed = content?.trim();
    if (!trimmed) return { ok: false, error: "Message is required" };
    const { error } = await supabase.from("space_messages").insert({
      space_id: spaceId,
      author_id: profile.id,
      content: trimmed,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function createSpaceInvite(input: {
  spaceId: string;
  inviteeProfileId?: string;
  inviteeEmail?: string;
}): Promise<{ ok: true; joinUrl: string } | { ok: false; error: string }> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(input.spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };

    if (!input.inviteeProfileId && !input.inviteeEmail) {
      return { ok: false, error: "Invitee is required" };
    }

    const tier = getPlanTierForProfile((profile as { plan_tier?: string | null }).plan_tier);
    const maxMembers = getMaxCollaboratorsPerSpaceForPlan(tier);
    const { count: memberCount } = await supabase
      .from("space_members")
      .select("*", { count: "exact", head: true })
      .eq("space_id", input.spaceId);
    if ((memberCount ?? 0) >= maxMembers) {
      return {
        ok: false,
        error:
          tier === "starter"
            ? `Starter plan allows up to ${maxMembers} collaborators per space (including you). Upgrade to Pro for unlimited.`
            : "This space has reached the collaborator limit.",
      };
    }

    const token = crypto.randomUUID();

    const { error } = await supabase.from("space_invites").insert({
      space_id: input.spaceId,
      inviter_profile_id: profile.id,
      invitee_profile_id: input.inviteeProfileId ?? null,
      invitee_email: input.inviteeEmail ?? null,
      token,
    });
    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, joinUrl: `/spaces/join/${token}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function acceptSpaceInviteByToken(
  token: string,
  options?: {
    agreementAccepted?: boolean;
    agreementVersion?: string;
    clientIp?: string | null;
  }
): Promise<{ ok: true; spaceId: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };

    const supabase = getServerSupabaseClient();
    const user = await currentUser();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const { data: invite, error: inviteError } = await supabase
      .from("space_invites")
      .select("id, space_id, status, invitee_profile_id, invitee_email")
      .eq("token", token)
      .single();
    if (inviteError || !invite) {
      return { ok: false, error: "Invite not found or expired" };
    }

    if (invite.status !== "pending") {
      return { ok: false, error: "Invite is no longer active" };
    }

    const inviteEmail = (invite as { invitee_email?: string | null }).invitee_email;
    if (inviteEmail?.trim()) {
      const allowed = clerkUserEmailSet(user);
      const normalized = normalizeEmail(inviteEmail);
      if (normalized && !allowed.has(normalized)) {
        return {
          ok: false,
          error: "This invite was sent to a different email address. Sign in with that account.",
        };
      }
    }

    const agreementOk =
      options?.agreementAccepted === undefined ? true : options.agreementAccepted === true;
    if (!agreementOk) {
      return { ok: false, error: "You must accept the collaboration terms to join." };
    }

    const now = new Date().toISOString();
    const agreementVersion = options?.agreementVersion?.trim() || "1.0";
    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const clientIp =
      options?.clientIp?.trim() ||
      (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
      null;

    // Add the user as a member if they aren't already.
    const { data: existingMember } = await supabase
      .from("space_members")
      .select("id")
      .eq("space_id", invite.space_id)
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!existingMember) {
      const { error: memberError } = await supabase.from("space_members").insert({
        space_id: invite.space_id,
        user_id: profile.id,
        role: "member",
        agreement_accepted: agreementOk,
        agreement_timestamp: now,
        agreement_version: agreementVersion,
        ip_address: clientIp,
      });
      if (memberError) {
        return { ok: false, error: memberError.message };
      }
    } else {
      const { error: patchError } = await supabase
        .from("space_members")
        .update({
          agreement_accepted: agreementOk,
          agreement_timestamp: now,
          agreement_version: agreementVersion,
          ip_address: clientIp,
        })
        .eq("space_id", invite.space_id)
        .eq("user_id", profile.id);
      if (patchError) {
        return { ok: false, error: patchError.message };
      }
    }

    const { error: updateError } = await supabase
      .from("space_invites")
      .update({
        status: "accepted",
        invitee_profile_id: profile.id,
        responded_at: now,
      })
      .eq("id", invite.id);
    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    return { ok: true, spaceId: invite.space_id as string };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function listSpaceInvitesForDashboard(): Promise<SpaceInvitesForDashboard> {
  try {
    const { userId } = await auth();
    if (!userId) return { sent: [], received: [] };
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { sent: [], received: [] };

    const clerkUser = await currentUser();
    const myEmails = clerkUserEmailSet(clerkUser);

    const { data: inviteRows } = await supabase
      .from("space_invites")
      .select(
        "id, space_id, inviter_profile_id, invitee_profile_id, invitee_email, status, created_at, token, spaces(title)"
      )
      .order("created_at", { ascending: false });
    if (!inviteRows) return { sent: [], received: [] };

    const profileIds = new Set<string>();
    for (const row of inviteRows as any[]) {
      if (row.inviter_profile_id) profileIds.add(row.inviter_profile_id as string);
      if (row.invitee_profile_id) profileIds.add(row.invitee_profile_id as string);
    }

    const profilesMap = new Map<string, string | null>();
    if (profileIds.size > 0) {
      const { data: profilesRows } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", Array.from(profileIds));
      if (profilesRows) {
        for (const row of profilesRows as { id: string; display_name: string | null }[]) {
          profilesMap.set(row.id, row.display_name);
        }
      }
    }

    const normalizeRow = (row: any): SpaceInvite => {
      const inviteeEmail = row.invitee_email as string | null | undefined;
      const inviteeFromProfile =
        row.invitee_profile_id && profilesMap.get(row.invitee_profile_id as string);
      const inviteeLabel =
        inviteeFromProfile?.trim() ||
        (inviteeEmail?.trim() ? inviteeEmail.trim() : null);
      return {
        id: row.id as string,
        spaceId: row.space_id as string,
        spaceTitle: (row.spaces?.title as string) ?? "Untitled space",
        inviterName: profilesMap.get(row.inviter_profile_id as string) ?? null,
        inviteeName: inviteeLabel,
        status: (row.status as string) ?? "pending",
        createdAt: (row.created_at as string | null) ?? null,
        token: row.token as string,
      };
    };

    const sent = (inviteRows as any[])
      .filter((row) => row.inviter_profile_id === profile.id)
      .map(normalizeRow);

    const received = (inviteRows as any[])
      .filter((row) => {
        if (row.invitee_profile_id === profile.id) return true;
        const em = normalizeEmail(row.invitee_email as string | null | undefined);
        return em !== null && myEmails.has(em);
      })
      .map(normalizeRow);

    return { sent, received };
  } catch {
    return { sent: [], received: [] };
  }
}

export async function getUserSpaces(): Promise<SpaceSummary[]> {
  try {
    const { userId } = await auth();
    if (!userId) return [];
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return [];

    const { data: memberships, error: membershipsError } = await supabase
      .from("space_members")
      .select("space_id")
      .eq("user_id", profile.id);
    if (membershipsError || !memberships || memberships.length === 0) return [];

    const spaceIds = memberships.map((row: { space_id: string }) => row.space_id);

    const { data: spaces, error: spacesError } = await supabase
      .from("spaces")
      .select("id, title, updated_at, created_at")
      .in("id", spaceIds)
      .order("updated_at", { ascending: false });
    if (spacesError || !spaces) return [];

    const { data: memberRows, error: memberError } = await supabase
      .from("space_members")
      .select("space_id")
      .in("space_id", spaceIds);

    const countsBySpace = new Map<string, number>();
    if (!memberError && memberRows) {
      for (const row of memberRows as { space_id: string }[]) {
        const id = row.space_id;
        countsBySpace.set(id, (countsBySpace.get(id) ?? 0) + 1);
      }
    }

    return (spaces as { id: string; title: string | null; updated_at: string | null; created_at: string | null }[]).map(
      (space) => ({
        id: space.id,
        title: space.title?.trim() || "Untitled",
        updatedAt: space.updated_at ?? space.created_at,
        memberCount: countsBySpace.get(space.id) ?? 1,
      })
    );
  } catch {
    return [];
  }
}

export async function createSpaceBulletin(spaceId: string, title: string, description?: string | null): Promise<CreateBulletinResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) return { ok: false, error: "Title is required" };
    const { error } = await supabase.from("space_boards").insert({
      space_id: spaceId,
      title: trimmedTitle,
      description: description?.trim() || null,
      type: "bulletin",
      visibility: "internal",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function createSpaceTask(spaceId: string, title: string, description?: string | null): Promise<CreateTaskResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) return { ok: false, error: "Title is required" };
    const { error } = await supabase.from("space_tasks").insert({
      space_id: spaceId,
      title: trimmedTitle,
      description: description?.trim() || null,
      status: "todo",
      visibility: "internal",
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

const TASK_STATUSES = ["todo", "in_progress", "review", "done"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export type UpdateTaskStatusResult = { ok: true } | { ok: false; error: string };

export async function updateSpaceTaskStatus(
  spaceId: string,
  taskId: string,
  status: string
): Promise<UpdateTaskStatusResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const trimmed = status.trim();
    if (!TASK_STATUSES.includes(trimmed as TaskStatus)) {
      return { ok: false, error: "Invalid status" };
    }
    const { error } = await supabase
      .from("space_tasks")
      .update({ status: trimmed })
      .eq("id", taskId)
      .eq("space_id", spaceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type VisibilityToggleResult = { ok: true } | { ok: false; error: string };

export async function setSpaceMediaVisibility(
  spaceId: string,
  mediaId: string,
  visibility: "internal" | "external"
): Promise<VisibilityToggleResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const { error } = await supabase
      .from("space_media")
      .update({ visibility })
      .eq("id", mediaId)
      .eq("space_id", spaceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setSpaceTaskVisibility(
  spaceId: string,
  taskId: string,
  visibility: "internal" | "external"
): Promise<VisibilityToggleResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const { error } = await supabase
      .from("space_tasks")
      .update({ visibility })
      .eq("id", taskId)
      .eq("space_id", spaceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function setSpaceBulletinVisibility(
  spaceId: string,
  bulletinId: string,
  visibility: "internal" | "external"
): Promise<VisibilityToggleResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const { error } = await supabase
      .from("space_boards")
      .update({ visibility })
      .eq("id", bulletinId)
      .eq("space_id", spaceId)
      .eq("type", "bulletin");
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type PublishSpaceResult =
  | { ok: true; publicationId: string }
  | { ok: false; error: string };

export async function publishSpace(
  spaceId: string,
  input: {
    title: string;
    summary?: string | null;
    visibilityScope?: "public" | "unlisted" | "private";
    coverMediaId?: string | null;
  }
): Promise<PublishSpaceResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };

    const { count } = await supabase
      .from("space_members")
      .select("*", { count: "exact", head: true })
      .eq("space_id", spaceId);
    if ((count ?? 0) < 2) {
      return { ok: false, error: "Add at least one collaborator before publishing." };
    }

    const title = input.title?.trim() || "Untitled";
    const summary = input.summary?.trim() || null;
    const visibility_scope = input.visibilityScope ?? "unlisted";
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("space_publications")
      .select("id")
      .eq("space_id", spaceId)
      .maybeSingle();

    if (existing?.id) {
      const { error } = await supabase
        .from("space_publications")
        .update({
          title,
          summary,
          published_at: now,
          published_by: profile.id,
          visibility_scope,
          cover_media_id: input.coverMediaId ?? null,
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, publicationId: existing.id as string };
    }

    const { data: inserted, error } = await supabase
      .from("space_publications")
      .insert({
        space_id: spaceId,
        title,
        summary,
        published_at: now,
        published_by: profile.id,
        visibility_scope,
        cover_media_id: input.coverMediaId ?? null,
      })
      .select("id")
      .single();
    if (error || !inserted) return { ok: false, error: error?.message ?? "Failed to publish" };
    return { ok: true, publicationId: inserted.id as string };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type UnpublishSpaceResult = { ok: true } | { ok: false; error: string };

export async function getSpacePublicationSummary(spaceId: string): Promise<{
  id: string;
  published_at: string | null;
  visibility_scope: string | null;
  title: string | null;
} | null> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return null;
    const { data } = await supabase
      .from("space_publications")
      .select("id, published_at, visibility_scope, title")
      .eq("space_id", spaceId)
      .maybeSingle();
    return data as {
      id: string;
      published_at: string | null;
      visibility_scope: string | null;
      title: string | null;
    } | null;
  } catch {
    return null;
  }
}

export async function unpublishSpace(spaceId: string): Promise<UnpublishSpaceResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const { error } = await supabase
      .from("space_publications")
      .update({ published_at: null })
      .eq("space_id", spaceId);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export type PublicPublicationRow = {
  id: string;
  space_id: string;
  title: string;
  summary: string | null;
  published_at: string;
  visibility_scope: string | null;
  space_title: string | null;
  cover_public_url: string | null;
  media: { id: string; type: string; title: string | null; publicUrl: string }[];
  bulletins: { id: string; title: string; description: string | null }[];
  tasks: { id: string; title: string; description: string | null; status: string }[];
};

/** Public read for published pages (no auth). Unlisted + public by link; private hidden. */
export async function getPublicationPageDataById(publicationId: string): Promise<PublicPublicationRow | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data: pub, error } = await supabase
      .from("space_publications")
      .select("id, space_id, title, summary, published_at, visibility_scope, cover_media_id")
      .eq("id", publicationId)
      .not("published_at", "is", null)
      .maybeSingle();
    if (error || !pub) return null;
    const scope = (pub as { visibility_scope?: string }).visibility_scope;
    if (scope === "private") return null;
    return await loadPublicationBundle(supabase, pub as Record<string, unknown>);
  } catch {
    return null;
  }
}

async function loadPublicationBundle(
  supabase: ReturnType<typeof getServerSupabaseClient>,
  pub: Record<string, unknown>
): Promise<PublicPublicationRow | null> {
  const spaceId = pub.space_id as string;
  const publicationId = pub.id as string;
  const coverId = pub.cover_media_id as string | null;

  const { data: space } = await supabase.from("spaces").select("title").eq("id", spaceId).single();
  let cover_public_url: string | null = null;
  if (coverId) {
    const { data: cm } = await supabase
      .from("space_media")
      .select("storage_path")
      .eq("id", coverId)
      .eq("space_id", spaceId)
      .maybeSingle();
    if (cm?.storage_path) {
      const path = cm.storage_path as string;
      const bucket = path.startsWith("spaces/") ? PROFILE_MEDIA_BUCKET : SPACE_MEDIA_BUCKET;
      cover_public_url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    }
  }

  const [mediaRes, boardRes, taskRes] = await Promise.all([
    supabase
      .from("space_media")
      .select("id, type, storage_path, title, visibility")
      .eq("space_id", spaceId)
      .eq("visibility", "external"),
    supabase
      .from("space_boards")
      .select("id, title, description, visibility")
      .eq("space_id", spaceId)
      .eq("type", "bulletin")
      .eq("visibility", "external"),
    supabase
      .from("space_tasks")
      .select("id, title, description, status, visibility")
      .eq("space_id", spaceId)
      .eq("visibility", "external"),
  ]);

  const media =
    (mediaRes.data ?? []).map((row: Record<string, unknown>) => {
      const path = row.storage_path as string;
      const bucket = path.startsWith("spaces/") ? PROFILE_MEDIA_BUCKET : SPACE_MEDIA_BUCKET;
      return {
        id: row.id as string,
        type: row.type as string,
        title: (row.title as string) ?? null,
        publicUrl: supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl,
      };
    }) ?? [];

  return {
    id: publicationId,
    space_id: spaceId,
    title: (pub.title as string) ?? "Untitled",
    summary: (pub.summary as string) ?? null,
    published_at: pub.published_at as string,
    visibility_scope: (pub.visibility_scope as string) ?? null,
    space_title: space?.title ?? null,
    cover_public_url,
    media,
    bulletins: (boardRes.data ?? []) as { id: string; title: string; description: string | null }[],
    tasks: (taskRes.data ?? []) as { id: string; title: string; description: string | null; status: string }[],
  };
}

function toErrorString(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
    return (err as { message: string }).message;
  }
  return String(err);
}

export async function uploadSpaceMedia(spaceId: string, formData: FormData): Promise<UploadSpaceMediaResult> {
  try {
    let profile: Awaited<ReturnType<typeof ensureSpaceAccess>>["profile"];
    let supabase: Awaited<ReturnType<typeof ensureSpaceAccess>>["supabase"];
    try {
      const access = await ensureSpaceAccess(spaceId);
      profile = access.profile;
      supabase = access.supabase;
    } catch (e) {
      return { ok: false, error: toErrorString(e) };
    }
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };

    const tier = getPlanTierForProfile((profile as { plan_tier?: string | null }).plan_tier);
    const spaceLimit = getSpaceByteLimitForPlan(tier);

    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "No file" };
    const formType = formData.get("type");
    const type: "image" | "video" | "audio" =
      formType === "video" || file.type.startsWith("video/")
        ? "video"
        : formType === "audio" || file.type.startsWith("audio/")
        ? "audio"
        : "image";
    const ext =
      file.name.split(".").pop() ||
      (type === "video" ? "mp4" : type === "audio" ? "mp3" : "jpg");
    const safeExt = /^[a-z0-9]+$/i.test(ext ?? "") ? ext : type === "video" ? "mp4" : type === "audio" ? "mp3" : "jpg";
    if (file.size > spaceLimit) {
      return {
        ok: false,
        error: `This file is larger than your current per-file limit (${tier === "pro" ? "50 GB" : "2 GB"}).`,
      };
    }
    const { data: currentMedia, error: usageError } = await supabase
      .from("space_media")
      .select("size_bytes")
      .eq("space_id", spaceId);
    if (usageError) return { ok: false, error: usageError.message };
    const usedBytes =
      currentMedia?.reduce((sum, row) => sum + (row.size_bytes ?? 0), 0) ?? 0;
    const estimated = usedBytes + file.size;
    if (estimated > spaceLimit) {
      return {
        ok: false,
        error: `Uploading this file would exceed this space's storage limit (${tier === "pro" ? "50 GB" : "2 GB"}).`,
      };
    }

    // space-media bucket: {spaceId}/images|video|audio/{uuid}.{ext}
    const folder = type === "image" ? "images" : type;
    const path = `${spaceId}/${folder}/${crypto.randomUUID()}.${safeExt}`;
    const { error: uploadError } = await supabase.storage
      .from(SPACE_MEDIA_BUCKET)
      .upload(path, file, { contentType: file.type });
    if (uploadError) return { ok: false, error: uploadError.message };

    const title = (formData.get("title") as string)?.trim() || null;
    const { error: insertError } = await supabase.from("space_media").insert({
      space_id: spaceId,
      uploader_id: profile.id,
      type,
      storage_path: path,
      title,
      size_bytes: file.size,
      mime_type: file.type || null,
      visibility: "internal",
    });
    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: toErrorString(err) };
  }
}
