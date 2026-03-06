"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { uploadProfileMediaAction } from "@/app/profile/actions";

type UploadProfileMediaModalProps = {
  onClose: () => void;
};

export function UploadProfileMediaModal({ onClose }: UploadProfileMediaModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<"image" | "video">("image");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (isImage || isVideo) {
      setType(isImage ? "image" : "video");
      setSelectedFile(file);
      setError(null);
    } else {
      setError("Please drop an image or video file.");
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const file = selectedFile ?? fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a file or drop one in the area above.");
      return;
    }
    setPending(true);
    const formData = new FormData();
    formData.set("type", type);
    formData.set("file", file);
    if (caption.trim()) formData.set("caption", caption.trim());
    const result = await uploadProfileMediaAction(formData);
    setPending(false);
    if (result.ok) {
      router.refresh();
      onClose();
    } else {
      setError(result.error ?? "Upload failed");
    }
  }

  const accept = type === "image" ? "image/*" : "video/*";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
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

          <input
            ref={fileInputRef}
            name="file"
            type="file"
            accept={accept}
            className="sr-only"
            onChange={handleFileChange}
          />

          <div
            role="button"
            tabIndex={0}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={openFilePicker}
            onKeyDown={(e) => e.key === "Enter" && openFilePicker()}
            className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-colors ${
              dragActive
                ? "border-[#00cefc] bg-[#00cefc]/10"
                : "border-zinc-300 bg-zinc-50/80 hover:border-zinc-400 hover:bg-zinc-100/80"
            }`}
          >
            <div className="flex items-center justify-center gap-1 text-zinc-500">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </div>
            {selectedFile ? (
              <p className="text-center text-sm font-medium text-zinc-700">
                {selectedFile.name}
              </p>
            ) : (
              <p className="text-center text-sm text-zinc-600">
                Drop anything here to{" "}
                <span className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2">
                  upload
                </span>
              </p>
            )}
          </div>

          <div>
            <label htmlFor="upload-caption" className="block text-sm font-medium text-zinc-700">
              Caption (optional)
            </label>
            <input
              id="upload-caption"
              name="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
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
              {pending ? "Publishing…" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
