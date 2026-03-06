"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadProfileMediaAction } from "@/app/profile/actions";

type UploadProfileMediaModalProps = {
  onClose: () => void;
};

export function UploadProfileMediaModal({ onClose }: UploadProfileMediaModalProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("image");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fileInput = form.querySelector<HTMLInputElement>('input[name="file"]');
    const file = fileInput?.files?.[0];
    if (!file) {
      setError("Please choose a file");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("file", file);
    const caption = form.querySelector<HTMLInputElement>('input[name="caption"]')?.value?.trim();
    if (caption) formData.set("caption", caption);
    const result = await uploadProfileMediaAction(formData);
    setPending(false);
    if (result.ok) {
      router.refresh();
      onClose();
    } else {
      setError(result.error ?? "Upload failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">Upload media</h2>
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <div>
            <span className="block text-sm font-medium text-zinc-700">Type</span>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setType("image")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  type === "image"
                    ? "border-black bg-[#00cefc] text-black"
                    : "border-[color:var(--border-subtle)] hover:bg-zinc-100"
                }`}
              >
                Post (image)
              </button>
              <button
                type="button"
                onClick={() => setType("video")}
                className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                  type === "video"
                    ? "border-black bg-[#00cefc] text-black"
                    : "border-[color:var(--border-subtle)] hover:bg-zinc-100"
                }`}
              >
                Video
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="upload-file" className="block text-sm font-medium text-zinc-700">
              File
            </label>
            <input
              id="upload-file"
              name="file"
              type="file"
              accept={type === "image" ? "image/*" : "video/*"}
              required
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-2 file:rounded-full file:border file:border-black file:bg-background file:px-3 file:py-1 file:text-sm"
            />
          </div>
          <div>
            <label htmlFor="upload-caption" className="block text-sm font-medium text-zinc-700">
              Caption (optional)
            </label>
            <input
              id="upload-caption"
              name="caption"
              type="text"
              placeholder="Caption"
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
              {pending ? "Uploading…" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
