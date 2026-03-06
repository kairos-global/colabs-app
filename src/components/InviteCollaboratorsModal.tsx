"use client";

type InviteCollaboratorsModalProps = {
  onClose: () => void;
};

export function InviteCollaboratorsModal({ onClose }: InviteCollaboratorsModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[color:var(--border-subtle)] bg-background p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold tracking-tight">Invite collaborators</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Invite people to join this space. More options coming soon.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            className="rounded-lg border border-[color:var(--border-subtle)] bg-zinc-50 px-4 py-2.5 text-left text-sm font-medium hover:bg-zinc-100"
          >
            Invite someone from the platform
          </button>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black bg-[#00cefc] px-4 py-1.5 text-sm font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
