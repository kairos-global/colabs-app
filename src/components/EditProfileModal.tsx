"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { updateProfileAction } from "@/app/profile/actions";
import type { Profile } from "@/lib/profile";

type EditProfileModalProps = {
  profile: Profile;
  onClose: () => void;
};

export function EditProfileModal({ profile, onClose }: EditProfileModalProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfileAction(formData);
    setPending(false);
    if (result.ok) {
      router.refresh();
      onClose();
    } else {
      setError(result.error ?? "Something went wrong");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">Edit profile</h2>
        <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <label htmlFor="edit-avatar" className="block text-sm font-medium text-zinc-700">
              Profile picture
            </label>
            <div className="mt-1 flex items-center gap-3">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-16 w-16 rounded-full border border-[color:var(--border-subtle)] object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color:var(--border-subtle)] bg-zinc-100 text-xs text-zinc-500">
                  No photo
                </div>
              )}
              <input
                id="edit-avatar"
                name="avatar"
                type="file"
                accept="image/*"
                className="block text-sm text-zinc-600 file:mr-2 file:rounded-full file:border file:border-black file:bg-background file:px-3 file:py-1 file:text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="edit-display_name" className="block text-sm font-medium text-zinc-700">
              Name
            </label>
            <input
              id="edit-display_name"
              name="display_name"
              type="text"
              defaultValue={profile.display_name ?? ""}
              placeholder="Name"
              className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="edit-bio" className="block text-sm font-medium text-zinc-700">
              Bio
            </label>
            <textarea
              id="edit-bio"
              name="bio"
              rows={3}
              defaultValue={profile.bio ?? ""}
              placeholder="Bio"
              className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="edit-url" className="block text-sm font-medium text-zinc-700">
              URL
            </label>
            <input
              id="edit-url"
              name="url"
              type="url"
              defaultValue={profile.url ?? ""}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-[color:var(--border-subtle)] bg-background px-3 py-2 text-sm"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-black px-4 py-1.5 text-sm font-medium hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd] disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
