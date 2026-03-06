"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getProfileByClerkId } from "@/lib/profile";

export type CreateListingResult =
  | { ok: true; listingId: string; spaceId: string }
  | { ok: false; error: string };

export type CommunityListingSummary = {
  id: string;
  spaceId: string;
  title: string;
  description: string | null;
  ownerName: string | null;
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

export async function createCollaborationListing(input: {
  title: string;
  description?: string;
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

    // Create the underlying space owned by this profile.
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

    // Ensure the owner is a member of the space.
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
        "id, space_id, title, description, status, created_at, owner_profile_id, collaboration_applications(count)"
      )
      .order("created_at", { ascending: false });
    if (error || !data) return [];

    const ownerIds = Array.from(
      new Set(
        (data as { owner_profile_id: string | null }[])
          .map((row) => row.owner_profile_id)
          .filter((id): id is string => !!id)
      )
    );

    let ownersById = new Map<string, string | null>();
    if (ownerIds.length > 0) {
      const { data: owners, error: ownersError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", ownerIds);
      if (!ownersError && owners) {
        for (const row of owners as { id: string; display_name: string | null }[]) {
          ownersById.set(row.id, row.display_name);
        }
      }
    }

    return (data as any[]).map((row) => ({
      id: row.id as string,
      spaceId: row.space_id as string,
      title: row.title as string,
      description: (row.description as string | null) ?? null,
      ownerName: ownersById.get(row.owner_profile_id as string) ?? null,
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
      .select("id, space_id, title, description, status, created_at, owner_profile_id")
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
      .select("id, space_id, owner_profile_id")
      .eq("id", input.listingId)
      .single();
    if (listingError || !listing) {
      return { ok: false, error: "Listing not found" };
    }

    if (listing.owner_profile_id === profile.id) {
      return { ok: false, error: "You cannot apply to your own listing" };
    }

    // Prevent duplicate applications from the same profile.
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

    // Sent applications
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

    // Received applications (listings you own)
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

