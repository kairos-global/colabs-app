import { notFound } from "next/navigation";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getProfileMedia, getPublishedCollabsForProfile } from "@/lib/profile";
import type { Profile, ProfileMedia, PublishedCollab } from "@/lib/profile";
import { PublicProfileView } from "./PublicProfileView";

const BUCKET = "profile-media";

export type PublicProfileMediaWithUrl = ProfileMedia & { publicUrl: string };

export type PublicProfilePageData = {
  profile: Profile;
  profileMedia: PublicProfileMediaWithUrl[];
  publishedCollabs: PublishedCollab[];
};

async function getPublicProfileData(profileId: string): Promise<PublicProfilePageData | null> {
  const supabase = getServerSupabaseClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, clerk_user_id, display_name, bio, avatar_url, url, plan_tier, created_at, updated_at")
    .eq("id", profileId)
    .single();

  if (error || !profile) return null;

  const [profileMediaRows, publishedCollabs] = await Promise.all([
    getProfileMedia(supabase, profile.id),
    getPublishedCollabsForProfile(supabase, profile.id),
  ]);

  const profileMedia: PublicProfileMediaWithUrl[] = profileMediaRows.map((row) => ({
    ...row,
    publicUrl: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
  }));

  return { profile: profile as Profile, profileMedia, publishedCollabs };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getServerSupabaseClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, bio")
    .eq("id", id)
    .single();
  const name = data?.display_name?.trim() || "CoLabs Profile";
  const bio = data?.bio?.trim() || "View this creator's portfolio on CoLabs.";
  return {
    title: `${name} — CoLabs`,
    description: bio,
  };
}

export default async function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getPublicProfileData(id);
  if (!data) notFound();
  return <PublicProfileView data={data} />;
}
