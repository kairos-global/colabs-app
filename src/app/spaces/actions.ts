"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateProfile, getProfileByClerkId } from "@/lib/profile";

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
        .select("id, type, storage_path, title, created_at")
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

    const mediaWithUrls: SpaceMedia[] = (mediaRes.data ?? []).map((row) => ({
      ...row,
      publicUrl: supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl,
    }));

    return {
      id: space.id,
      title: space.title ?? "Untitled",
      memberCount: count ?? 0,
      messages: (messagesRes.data ?? []) as SpaceMessage[],
      media: mediaWithUrls,
      bulletins: (boardsRes.data ?? []) as SpaceBulletin[],
      tasks: (tasksRes.data ?? []) as SpaceTask[],
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
    const type =
      formData.get("type") === "video" || file.type.startsWith("video/") ? "video" : "image";
    const ext = file.name.split(".").pop() || (type === "video" ? "mp4" : "jpg");
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
    });
    if (insertError) return { ok: false, error: insertError.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
