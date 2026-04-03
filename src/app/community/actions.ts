"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getProfileByClerkId } from "@/lib/profile";
import {
  getMaxSpacesForPlan,
  getPlanTierForProfile,
} from "@/lib/billing/limits";

// Re-export types only (constants live in categories.ts to avoid "use server" object export error)
export type { ListingCategory } from "./categories";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateListingResult =
  | { ok: true; listingId: string; spaceId: string }
  | { ok: false; error: string };

export type CommunityListingSummary = {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  ownerName: string | null;
  ownerProfileId: string | null;
  categories: string[];
  rolesNeeded: string | null;
  status: string;
  createdAt: string | null;
  applicationCount: number;
};

export type ListingDetail = {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  ownerName: string | null;
  ownerProfileId: string | null;
  categories: string[];
  rolesNeeded: string | null;
  status: string;
  createdAt: string | null;
  isOwner: boolean;
};

export type CreateApplicationResult = { ok: true } | { ok: false; error: string };

export type DashboardApplications = {
  sent: {
    id: string;
    listingId: string;
    spaceId: string;
    title: string;
    status: string;
    createdAt: string | null;
  }[];
  received: {
    id: string;
    listingId: string;
    spaceId: string;
    applicantName: string | null;
    title: string;
    status: string;
    createdAt: string | null;
  }[];
};

export type CommunityPublishedCollab = {
  id: string;
  spaceId: string;
  publishedBy: string | null;
  publisherName: string | null;
  publisherProfileId: string | null;
  title: string;
  summary: string | null;
  publishedAt: string;
  updatedAt: string;
  memberCount: number;
};

export type PublishedCollabDetail = {
  id: string;
  spaceId: string;
  publisherName: string | null;
  publisherProfileId: string | null;
  title: string;
  summary: string | null;
  publishedAt: string;
  updatedAt: string;
  members: { id: string; displayName: string | null; avatarUrl: string | null }[];
  media: {
    id: string;
    type: string;
    title: string | null;
    publicUrl: string;
    description: string | null;
    mimeType: string | null;
    createdAt: string;
  }[];
  bulletins: {
    id: string;
    title: string;
    description: string | null;
    boardColumn: string;
    createdAt: string;
  }[];
  tasks: {
    id: string;
    title: string;
    description: string | null;
    status: string;
    assigneeName: string | null;
    dueDate: string | null;
    createdAt: string;
  }[];
};

export type PublishToCommunityResult =
  | { ok: true; collabId: string }
  | { ok: false; error: string };

export type RespondToApplicationResult = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// Collaboration listings
// ---------------------------------------------------------------------------

export async function createCollaborationListing(input: {
  title: string;
  description?: string;
  categories?: string[];
  rolesNeeded?: string;
}): Promise<CreateListingResult> {
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
    const { count: spaceCount } = await supabase
      .from("space_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", profile.id);
    if ((spaceCount ?? 0) >= maxSpaces) {
      return {
        ok: false,
        error:
          tier === "starter"
            ? `Starter plan allows up to ${maxSpaces} spaces. Upgrade to Pro for unlimited.`
            : "Could not create listing.",
      };
    }

    const { data: space, error: spaceError } = await supabase
      .from("spaces")
      .insert({
        owner_id: profile.id,
        title: input.title.trim() || "Untitled",
      })
      .select("id")
      .single();
    if (spaceError || !space) {
      return { ok: false, error: spaceError?.message ?? "Failed to create space" };
    }

    const { error: memberError } = await supabase.from("space_members").insert({
      space_id: space.id,
      user_id: profile.id,
      role: "owner",
    });
    if (memberError) {
      return { ok: false, error: memberError.message };
    }

    const { data: listing, error: listingError } = await supabase
      .from("collaboration_listings")
      .insert({
        space_id: space.id,
        owner_profile_id: profile.id,
        title: input.title.trim() || "Untitled",
        description: input.description?.trim() || null,
        categories: input.categories ?? [],
        roles_needed: input.rolesNeeded?.trim() || null,
      })
      .select("id")
      .single();
    if (listingError || !listing) {
      return {
        ok: false,
        error: listingError?.message ?? "Failed to create collaboration listing",
      };
    }

    return { ok: true, listingId: listing.id as string, spaceId: space.id as string };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function getCommunityListings(): Promise<CommunityListingSummary[]> {
  try {
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from("collaboration_listings")
      .select(
        "id, space_id, title, description, status, created_at, owner_profile_id, categories, roles_needed, collaboration_applications(count)"
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const ownerIds = Array.from(
      new Set(
        (data as { owner_profile_id: string | null }[])
          .map((row) => row.owner_profile_id)
          .filter((id): id is string => !!id)
      )
    );

    let ownersById = new Map<string, { name: string | null }>();
    if (ownerIds.length > 0) {
      const { data: owners, error: ownersError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds);
      if (!ownersError && owners) {
        for (const row of owners as { id: string; display_name: string | null }[]) {
          ownersById.set(row.id, { name: row.display_name });
        }
      }
    }

    return (data as any[]).map((row) => ({
      id: row.id as string,
      spaceId: row.space_id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      ownerName: ownersById.get(row.owner_profile_id as string)?.name ?? null,
      ownerProfileId: (row.owner_profile_id as string | null) ?? null,
      categories: (row.categories as string[] | null) ?? [],
      rolesNeeded: (row.roles_needed as string | null) ?? null,
      status: (row.status as string) ?? "open",
      createdAt: (row.created_at as string | null) ?? null,
      applicationCount:
        (row.collaboration_applications && row.collaboration_applications[0]?.count) || 0,
    }));
  } catch {
    return [];
  }
}

export async function getListingDetail(id: string): Promise<ListingDetail | null> {
  try {
    const { userId } = await auth();
    const supabase = getServerSupabaseClient();

    const { data, error } = await supabase
      .from("collaboration_listings")
      .select(
        "id, space_id, title, description, status, created_at, owner_profile_id, categories, roles_needed"
      )
      .eq("id", id)
      .single();
    if (error || !data) return null;

    const listing = data as {
      id: string;
      space_id: string;
      title: string;
      description: string | null;
      status: string;
      created_at: string | null;
      owner_profile_id: string | null;
      categories: string[] | null;
      roles_needed: string | null;
    };

    let ownerName: string | null = null;
    if (listing.owner_profile_id) {
      const { data: owner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", listing.owner_profile_id)
        .single();
      ownerName = (owner?.display_name as string | null) ?? null;
    }

    let isOwner = false;
    if (userId && listing.owner_profile_id) {
      const profile = await getProfileByClerkId(supabase, userId);
      isOwner = !!profile && profile.id === listing.owner_profile_id;
    }

    return {
      id: listing.id,
      spaceId: listing.space_id,
      title: listing.title,
      description: listing.description,
      ownerName,
      ownerProfileId: listing.owner_profile_id,
      categories: listing.categories ?? [],
      rolesNeeded: listing.roles_needed,
      status: listing.status,
      createdAt: listing.created_at,
      isOwner,
    };
  } catch {
    return null;
  }
}

export async function createListingApplication(input: {
  listingId: string;
  message?: string;
}): Promise<CreateApplicationResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };

    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const { data: listing, error: listingError } = await supabase
      .from("collaboration_listings")
      .select("id, space_id, owner_profile_id, status")
      .eq("id", input.listingId)
      .single();
    if (listingError || !listing) {
      return { ok: false, error: "Listing not found" };
    }

    if (listing.owner_profile_id === profile.id) {
      return { ok: false, error: "You cannot apply to your own listing" };
    }

    if ((listing as { status?: string }).status !== "open") {
      return { ok: false, error: "This listing is no longer accepting applications" };
    }

    const { data: existing } = await supabase
      .from("collaboration_applications")
      .select("id")
      .eq("listing_id", input.listingId)
      .eq("applicant_profile_id", profile.id)
      .maybeSingle();
    if (existing) {
      return { ok: true };
    }

    const { error: insertError } = await supabase.from("collaboration_applications").insert({
      listing_id: input.listingId,
      space_id: listing.space_id,
      applicant_profile_id: profile.id,
      message: input.message?.trim() || null,
    });
    if (insertError) {
      return { ok: false, error: insertError.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function listApplicationsForDashboard(): Promise<DashboardApplications> {
  try {
    const { userId } = await auth();
    if (!userId) return { sent: [], received: [] };

    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { sent: [], received: [] };

    const { data: sentRows } = await supabase
      .from("collaboration_applications")
      .select("id, listing_id, space_id, status, created_at, collaboration_listings(title)")
      .eq("applicant_profile_id", profile.id)
      .order("created_at", { ascending: false });

    const sent =
      sentRows?.map((row: any) => ({
        id: row.id as string,
        listingId: row.listing_id as string,
        spaceId: row.space_id as string,
        title: (row.collaboration_listings?.title as string) ?? "Listing",
        status: (row.status as string) ?? "pending",
        createdAt: (row.created_at as string | null) ?? null,
      })) ?? [];

    const { data: receivedRows } = await supabase
      .from("collaboration_applications")
      .select(
        "id, listing_id, space_id, status, created_at, applicant_profile_id, collaboration_listings(title, owner_profile_id)"
      )
      .order("created_at", { ascending: false });

    const ownerListingIds =
      receivedRows
        ?.filter(
          (row: any) =>
            row.collaboration_listings &&
            row.collaboration_listings.owner_profile_id === profile.id
        )
        .map((row: any) => row.id as string) ?? [];
    if (!receivedRows || ownerListingIds.length === 0) {
      return { sent, received: [] };
    }

    const applicantIds = Array.from(
      new Set(
        receivedRows
          .filter((row: any) => ownerListingIds.includes(row.id as string))
          .map((row: any) => row.applicant_profile_id as string)
          .filter(Boolean)
      )
    );

    let applicantsById = new Map<string, string | null>();
    if (applicantIds.length > 0) {
      const { data: applicants } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", applicantIds);
      if (applicants) {
        for (const row of applicants as { id: string; display_name: string | null }[]) {
          applicantsById.set(row.id, row.display_name);
        }
      }
    }

    const received = receivedRows
      .filter((row: any) => ownerListingIds.includes(row.id as string))
      .map((row: any) => ({
        id: row.id as string,
        listingId: row.listing_id as string,
        spaceId: row.space_id as string,
        applicantName:
          applicantsById.get(row.applicant_profile_id as string) ?? "Unknown applicant",
        title: (row.collaboration_listings?.title as string) ?? "Listing",
        status: (row.status as string) ?? "pending",
        createdAt: (row.created_at as string | null) ?? null,
      }));

    return { sent, received };
  } catch {
    return { sent: [], received: [] };
  }
}

export async function searchCommunityListings(query: string): Promise<CommunityListingSummary[]> {
  const q = query.trim();
  if (!q) return [];
  const all = await getCommunityListings();
  const lower = q.toLowerCase();
  return all.filter((row) => {
    const title = row.title.toLowerCase();
    const desc = (row.description ?? "").toLowerCase();
    return title.includes(lower) || desc.includes(lower);
  });
}

export async function respondToListingApplication(
  applicationId: string,
  status: "accepted" | "rejected"
): Promise<RespondToApplicationResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const { data: appRow, error: appErr } = await supabase
      .from("collaboration_applications")
      .select("id, listing_id, space_id, applicant_profile_id, status")
      .eq("id", applicationId)
      .single();
    if (appErr || !appRow) return { ok: false, error: "Application not found" };

    const { data: listingRow } = await supabase
      .from("collaboration_listings")
      .select("owner_profile_id")
      .eq("id", appRow.listing_id)
      .single();
    const ownerId = (listingRow as { owner_profile_id: string } | null)?.owner_profile_id;
    if (!ownerId || ownerId !== profile.id) {
      return { ok: false, error: "Not allowed" };
    }

    const { error: updErr } = await supabase
      .from("collaboration_applications")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", applicationId);
    if (updErr) return { ok: false, error: updErr.message };

    if (status === "accepted") {
      const spaceId = (appRow as { space_id: string }).space_id;
      const applicantId = (appRow as { applicant_profile_id: string }).applicant_profile_id;
      const { data: existing } = await supabase
        .from("space_members")
        .select("id")
        .eq("space_id", spaceId)
        .eq("user_id", applicantId)
        .maybeSingle();
      if (!existing) {
        const { error: memErr } = await supabase.from("space_members").insert({
          space_id: spaceId,
          user_id: applicantId,
          role: "member",
          agreement_accepted: true,
          agreement_timestamp: new Date().toISOString(),
          agreement_version: "1.0",
        });
        if (memErr) return { ok: false, error: memErr.message };
      }
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

// ---------------------------------------------------------------------------
// Community published collabs
// ---------------------------------------------------------------------------

export async function publishToCommunity(input: {
  spaceId: string;
  title: string;
  summary?: string;
}): Promise<PublishToCommunityResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    // Verify user is owner of this space
    const { data: space } = await supabase
      .from("spaces")
      .select("id, owner_id")
      .eq("id", input.spaceId)
      .eq("owner_id", profile.id)
      .single();
    if (!space) return { ok: false, error: "Space not found or you are not the owner" };

    // Verify space has at least 2 members
    const { count } = await supabase
      .from("space_members")
      .select("*", { count: "exact", head: true })
      .eq("space_id", input.spaceId);
    if ((count ?? 0) < 2) {
      return { ok: false, error: "Space must have at least 2 members to publish to community" };
    }

    const now = new Date().toISOString();

    // Upsert: one published collab per space
    const { data: existing } = await supabase
      .from("community_published_collabs")
      .select("id")
      .eq("space_id", input.spaceId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("community_published_collabs")
        .update({
          title: input.title.trim() || "Untitled",
          summary: input.summary?.trim() || null,
          published_at: now,
          updated_at: now,
        })
        .eq("id", existing.id);
      if (error) return { ok: false, error: error.message };
      return { ok: true, collabId: existing.id };
    }

    const { data: inserted, error: insertErr } = await supabase
      .from("community_published_collabs")
      .insert({
        space_id: input.spaceId,
        published_by: profile.id,
        title: input.title.trim() || "Untitled",
        summary: input.summary?.trim() || null,
        published_at: now,
        updated_at: now,
      })
      .select("id")
      .single();
    if (insertErr || !inserted) return { ok: false, error: insertErr?.message ?? "Failed to publish" };
    return { ok: true, collabId: inserted.id as string };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function getCommunityPublishedCollabs(): Promise<CommunityPublishedCollab[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from("community_published_collabs")
      .select("id, space_id, published_by, title, summary, published_at, updated_at")
      .order("published_at", { ascending: false });
    if (error || !data) return [];

    const publisherIds = Array.from(
      new Set(
        (data as { published_by: string | null }[])
          .map((r) => r.published_by)
          .filter((id): id is string => !!id)
      )
    );

    let publishersById = new Map<string, string | null>();
    if (publisherIds.length > 0) {
      const { data: publishers } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", publisherIds);
      if (publishers) {
        for (const row of publishers as { id: string; display_name: string | null }[]) {
          publishersById.set(row.id, row.display_name);
        }
      }
    }

    // Get member counts per space
    const spaceIds = (data as { space_id: string }[]).map((r) => r.space_id);
    let memberCountBySpace = new Map<string, number>();
    if (spaceIds.length > 0) {
      const { data: memberRows } = await supabase
        .from("space_members")
        .select("space_id")
        .in("space_id", spaceIds);
      for (const row of memberRows ?? []) {
        const sid = (row as { space_id: string }).space_id;
        memberCountBySpace.set(sid, (memberCountBySpace.get(sid) ?? 0) + 1);
      }
    }

    return (data as any[]).map((row) => ({
      id: row.id as string,
      spaceId: row.space_id as string,
      publishedBy: (row.published_by as string | null) ?? null,
      publisherName: publishersById.get(row.published_by as string) ?? null,
      publisherProfileId: (row.published_by as string | null) ?? null,
      title: row.title as string,
      summary: (row.summary as string | null) ?? null,
      publishedAt: row.published_at as string,
      updatedAt: row.updated_at as string,
      memberCount: memberCountBySpace.get(row.space_id as string) ?? 0,
    }));
  } catch {
    return [];
  }
}

export async function getPublishedCollabDetail(id: string): Promise<PublishedCollabDetail | null> {
  try {
    const supabase = getServerSupabaseClient();

    const { data: collab, error } = await supabase
      .from("community_published_collabs")
      .select("id, space_id, published_by, title, summary, published_at, updated_at")
      .eq("id", id)
      .single();
    if (error || !collab) return null;

    const spaceId = (collab as any).space_id as string;
    const publishedBy = (collab as any).published_by as string | null;

    // Publisher name
    let publisherName: string | null = null;
    if (publishedBy) {
      const { data: pub } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", publishedBy)
        .single();
      publisherName = (pub?.display_name as string | null) ?? null;
    }

    // Members
    const { data: memberRows } = await supabase
      .from("space_members")
      .select("user_id")
      .eq("space_id", spaceId);
    const memberProfileIds = (memberRows ?? []).map((r: any) => r.user_id as string);
    let members: { id: string; displayName: string | null; avatarUrl: string | null }[] = [];
    if (memberProfileIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", memberProfileIds);
      members = (profiles ?? []).map((p: any) => ({
        id: p.id as string,
        displayName: (p.display_name as string | null) ?? null,
        avatarUrl: (p.avatar_url as string | null) ?? null,
      }));
    }

    // External media
    const SPACE_MEDIA_BUCKET = "space-media";
    const { data: mediaRows } = await supabase
      .from("space_media")
      .select("id, type, title, storage_path, description, mime_type, created_at")
      .eq("space_id", spaceId)
      .eq("visibility", "external")
      .order("created_at", { ascending: false });
    const media = (mediaRows ?? []).map((m: any) => ({
      id: m.id as string,
      type: m.type as string,
      title: (m.title as string | null) ?? null,
      publicUrl: supabase.storage.from(SPACE_MEDIA_BUCKET).getPublicUrl(m.storage_path as string).data.publicUrl,
      description: (m.description as string | null) ?? null,
      mimeType: (m.mime_type as string | null) ?? null,
      createdAt: m.created_at as string,
    }));

    // External bulletins
    const { data: bulletinRows } = await supabase
      .from("space_boards")
      .select("id, title, description, board_column, created_at")
      .eq("space_id", spaceId)
      .eq("visibility", "external")
      .order("created_at", { ascending: false });
    const bulletins = (bulletinRows ?? []).map((b: any) => ({
      id: b.id as string,
      title: b.title as string,
      description: (b.description as string | null) ?? null,
      boardColumn: (b.board_column as string) ?? "A",
      createdAt: b.created_at as string,
    }));

    // External tasks + assignee names
    const { data: taskRows } = await supabase
      .from("space_tasks")
      .select("id, title, description, status, assignee_id, due_date, created_at")
      .eq("space_id", spaceId)
      .eq("visibility", "external")
      .order("created_at", { ascending: false });

    const assigneeIds = Array.from(
      new Set(
        (taskRows ?? [])
          .map((t: any) => t.assignee_id as string | null)
          .filter((id): id is string => !!id)
      )
    );
    let assigneesById = new Map<string, string | null>();
    if (assigneeIds.length > 0) {
      const { data: assigneeProfiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", assigneeIds);
      for (const p of assigneeProfiles ?? []) {
        assigneesById.set((p as any).id, (p as any).display_name ?? null);
      }
    }

    const tasks = (taskRows ?? []).map((t: any) => ({
      id: t.id as string,
      title: t.title as string,
      description: (t.description as string | null) ?? null,
      status: t.status as string,
      assigneeName: t.assignee_id ? (assigneesById.get(t.assignee_id as string) ?? null) : null,
      dueDate: (t.due_date as string | null) ?? null,
      createdAt: t.created_at as string,
    }));

    return {
      id: (collab as any).id as string,
      spaceId,
      publisherName,
      publisherProfileId: publishedBy,
      title: (collab as any).title as string,
      summary: (collab as any).summary as string | null,
      publishedAt: (collab as any).published_at as string,
      updatedAt: (collab as any).updated_at as string,
      members,
      media,
      bulletins,
      tasks,
    };
  } catch {
    return null;
  }
}

export async function getCommunityPublishStatusForSpace(
  spaceId: string
): Promise<{ id: string; title: string } | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data } = await supabase
      .from("community_published_collabs")
      .select("id, title")
      .eq("space_id", spaceId)
      .maybeSingle();
    if (!data) return null;
    return { id: (data as any).id as string, title: (data as any).title as string };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// User search (for Search page)
// ---------------------------------------------------------------------------

export type UserSearchResult = {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
};

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const q = query.trim();
  if (q.length < 1) return [];
  try {
    const supabase = getServerSupabaseClient();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, bio, avatar_url")
      .ilike("display_name", `%${q}%`)
      .limit(30);
    return (data ?? []).map((row: any) => ({
      id: row.id as string,
      displayName: (row.display_name as string | null) ?? null,
      bio: (row.bio as string | null) ?? null,
      avatarUrl: (row.avatar_url as string | null) ?? null,
    }));
  } catch {
    return [];
  }
}
