"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getProfileByClerkId } from "@/lib/profile";
import { STARTER_SPACE_BYTES } from "@/lib/billing/limits";

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
  created_at: string;
  publicUrl: string;
};

export type SpaceBulletin = {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
};

export type SpaceTask = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
};

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

    const [messagesRes, mediaRes, boardsRes, tasksRes] = await Promise.all([
      supabase
        .from("space_messages")
        .select("id, content, author_id, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: true }),
      supabase
        .from("space_media")
        .select("id, type, storage_path, title, size_bytes, mime_type, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false }),
      supabase
        .from("space_boards")
        .select("id, title, description, created_at")
        .eq("space_id", spaceId)
        .eq("type", "bulletin")
        .order("created_at", { ascending: false }),
      supabase
        .from("space_tasks")
        .select("id, title, description, status, created_at")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false }),
    ]);

    const mediaRows = mediaRes.data ?? [];
    const mediaWithUrls: SpaceMedia[] = mediaRows.map((row) => ({
      ...row,
      publicUrl: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
    }));
    const usedBytes =
      mediaRows.reduce((sum, row) => sum + (row.size_bytes ?? 0), 0) ?? 0;

    return {
      id: space.id,
      title: space.title ?? "Untitled",
      memberCount: count ?? 0,
      messages: (messagesRes.data ?? []) as SpaceMessage[],
      media: mediaWithUrls,
      bulletins: (boardsRes.data ?? []) as SpaceBulletin[],
      tasks: (tasksRes.data ?? []) as SpaceTask[],
      storage: {
        usedBytes,
        maxBytes: STARTER_SPACE_BYTES,
      },
    };
  } catch {
    return null;
  }
}

const BUCKET = "profile-media";

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
  token: string
): Promise<{ ok: true; spaceId: string } | { ok: false; error: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };

    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const { data: invite, error: inviteError } = await supabase
      .from("space_invites")
      .select("id, space_id, status, invitee_profile_id")
      .eq("token", token)
      .single();
    if (inviteError || !invite) {
      return { ok: false, error: "Invite not found or expired" };
    }

    if (invite.status !== "pending") {
      return { ok: false, error: "Invite is no longer active" };
    }

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
      });
      if (memberError) {
        return { ok: false, error: memberError.message };
      }
    }

    const { error: updateError } = await supabase
      .from("space_invites")
      .update({
        status: "accepted",
        invitee_profile_id: profile.id,
        responded_at: new Date().toISOString(),
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

    const { data: inviteRows } = await supabase
      .from("space_invites")
      .select(
        "id, space_id, inviter_profile_id, invitee_profile_id, status, created_at, token, spaces(title)"
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

    const normalizeRow = (row: any): SpaceInvite => ({
      id: row.id as string,
      spaceId: row.space_id as string,
      spaceTitle: (row.spaces?.title as string) ?? "Untitled space",
      inviterName: profilesMap.get(row.inviter_profile_id as string) ?? null,
      inviteeName:
        (row.invitee_profile_id && profilesMap.get(row.invitee_profile_id as string)) ?? null,
      status: (row.status as string) ?? "pending",
      createdAt: (row.created_at as string | null) ?? null,
      token: row.token as string,
    });

    const sent = (inviteRows as any[])
      .filter((row) => row.inviter_profile_id === profile.id)
      .map(normalizeRow);

    const received = (inviteRows as any[])
      .filter((row) => row.invitee_profile_id === profile.id)
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
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function uploadSpaceMedia(spaceId: string, formData: FormData): Promise<UploadSpaceMediaResult> {
  try {
    const { profile, supabase } = await ensureSpaceAccess(spaceId);
    if (!profile || !supabase) return { ok: false, error: "Not allowed" };
    const file = formData.get("file") as File | null;
    if (!file || file.size === 0) return { ok: false, error: "No file" };
    const formType = formData.get("type");
    const type =
      formType === "video" || file.type.startsWith("video/")
        ? "video"
        : formType === "audio" || file.type.startsWith("audio/")
        ? "audio"
        : "image";
    const ext =
      file.name.split(".").pop() ||
      (type === "video" ? "mp4" : type === "audio" ? "mp3" : "jpg");
    // Enforce a simple per-space storage cap for now (Starter plan).
    if (file.size > STARTER_SPACE_BYTES) {
      return {
        ok: false,
        error: "This file is larger than your current 2 GB space limit.",
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
    if (estimated > STARTER_SPACE_BYTES) {
      return {
        ok: false,
        error: "Uploading this file would exceed your space's 2 GB storage limit.",
      };
    }

    const path = `spaces/${spaceId}/media/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type,
    });
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
    });
    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
