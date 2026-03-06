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
} | null;

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

    return {
      id: space.id,
      title: space.title ?? "Untitled",
      memberCount: count ?? 0,
    };
  } catch {
    return null;
  }
}
