import type { SupabaseClient } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  clerk_user_id: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  url: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ProfileMedia = {
  id: string;
  profile_id: string;
  type: "image" | "video";
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type PublishedCollab = {
  id: string;
  space_id: string;
  title: string;
  summary: string | null;
  published_at: string | null;
  space_title?: string;
};

export async function getProfileByClerkId(
  supabase: SupabaseClient,
  clerkUserId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("clerk_user_id", clerkUserId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data as Profile | null;
}

export async function getOrCreateProfile(
  supabase: SupabaseClient,
  clerkUserId: string,
  displayName?: string | null
): Promise<Profile> {
  const existing = await getProfileByClerkId(supabase, clerkUserId);
  if (existing) return existing;
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      clerk_user_id: clerkUserId,
      display_name: displayName ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function updateProfile(
  supabase: SupabaseClient,
  profileId: string,
  updates: {
    display_name?: string | null;
    bio?: string | null;
    url?: string | null;
    avatar_url?: string | null;
  }
): Promise<Profile> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select()
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function getProfileMedia(
  supabase: SupabaseClient,
  profileId: string,
  type?: "image" | "video"
): Promise<ProfileMedia[]> {
  let q = supabase
    .from("profile_media")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });
  if (type) q = q.eq("type", type);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ProfileMedia[];
}

export async function createProfileMedia(
  supabase: SupabaseClient,
  profileId: string,
  row: { type: "image" | "video"; storage_path: string; caption?: string | null }
): Promise<ProfileMedia> {
  const { data, error } = await supabase
    .from("profile_media")
    .insert({
      profile_id: profileId,
      type: row.type,
      storage_path: row.storage_path,
      caption: row.caption ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ProfileMedia;
}

export async function getPublishedCollabsForProfile(
  supabase: SupabaseClient,
  profileId: string
): Promise<PublishedCollab[]> {
  const memberRows = await supabase
    .from("space_members")
    .select("space_id")
    .eq("user_id", profileId);
  if (memberRows.error) throw memberRows.error;
  const memberSpaceIds = (memberRows.data ?? []).map((r) => r.space_id);
  if (memberSpaceIds.length === 0) return [];

  const { data, error } = await supabase
    .from("space_publications")
    .select("id, space_id, title, summary, published_at")
    .in("space_id", memberSpaceIds)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PublishedCollab[];
}
