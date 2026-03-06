"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import {
  getOrCreateProfile,
  getProfileByClerkId,
  getProfileMedia,
  getPublishedCollabsForProfile,
  updateProfile,
  createProfileMedia,
  type Profile,
  type ProfileMedia,
  type PublishedCollab,
} from "@/lib/profile";

const BUCKET = "profile-media";

export type ProfileMediaWithUrl = ProfileMedia & { publicUrl: string };

export type ProfilePageData = {
  profile: Profile | null;
  profileMedia: ProfileMediaWithUrl[];
  publishedCollabs: PublishedCollab[];
};

/** Platform profile for shell (avatar + display name). Returns null when not signed in. */
export async function getShellProfile(): Promise<{
  displayName: string | null;
  avatarUrl: string | null;
} | null> {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const supabase = getServerSupabaseClient();
    const user = await currentUser();
    const displayName =
      user?.firstName != null || user?.lastName != null
        ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null
        : null;
    const profile = await getOrCreateProfile(supabase, userId, displayName);
    return {
      displayName: profile.display_name ?? null,
      avatarUrl: profile.avatar_url ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("clerkMiddleware") ||
      message.includes("can't detect usage of clerkMiddleware") ||
      message.includes("Clerk can't detect usage")
    ) {
      // During build-time prerender there's no request for Clerk middleware to run.
      return null;
    }
    throw err;
  }
}

export async function getProfilePageData(): Promise<ProfilePageData> {
  const { userId } = await auth();
  const supabase = getServerSupabaseClient();
  if (!userId) {
    return { profile: null, profileMedia: [], publishedCollabs: [] };
  }
  const user = await currentUser();
  const displayName =
    user?.firstName != null || user?.lastName != null
      ? [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || null
      : null;
  const profile = await getOrCreateProfile(supabase, userId, displayName);
  const [profileMediaRows, publishedCollabs] = await Promise.all([
    getProfileMedia(supabase, profile.id),
    getPublishedCollabsForProfile(supabase, profile.id),
  ]);
  const profileMedia: ProfileMediaWithUrl[] = profileMediaRows.map((row) => ({
    ...row,
    publicUrl: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
  }));
  return { profile, profileMedia, publishedCollabs };
}

export async function updateProfileAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Not signed in" };
  const supabase = getServerSupabaseClient();
  const profile = await getProfileByClerkId(supabase, userId);
  if (!profile) return { ok: false, error: "Profile not found" };

  const display_name = (formData.get("display_name") as string)?.trim() || null;
  const bio = (formData.get("bio") as string)?.trim() || null;
  const url = (formData.get("url") as string)?.trim() || null;
  const avatarFile = formData.get("avatar") as File | null;

  let avatar_url: string | null = profile.avatar_url;
  if (avatarFile && avatarFile.size > 0) {
    const ext = avatarFile.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, avatarFile, {
      upsert: true,
      contentType: avatarFile.type,
    });
    if (uploadError) return { ok: false, error: uploadError.message };
    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    avatar_url = urlData.publicUrl;
  }
  await updateProfile(supabase, profile.id, { display_name, bio, url, avatar_url });
  return { ok: true };
}

export async function uploadProfileMediaAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Not signed in" };
    const supabase = getServerSupabaseClient();
    const profile = await getProfileByClerkId(supabase, userId);
    if (!profile) return { ok: false, error: "Profile not found" };

    const type = formData.get("type") as string;
    if (type !== "image" && type !== "video") return { ok: false, error: "Invalid type" };
    const file = formData.get("file") as File | null;
    if (!file) return { ok: false, error: "No file" };
    const size = typeof file.size === "number" ? file.size : 0;
    if (size === 0) return { ok: false, error: "File is empty" };
    const caption = (formData.get("caption") as string)?.trim() || null;

    const ext = (file.name && file.name.split(".").pop()) || (type === "video" ? "mp4" : "jpg");
    const path = `${userId}/media/${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || (type === "video" ? "video/mp4" : "image/jpeg"),
    });
    if (uploadError) return { ok: false, error: uploadError.message };

    await createProfileMedia(supabase, profile.id, { type: type as "image" | "video", storage_path: path, caption });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
