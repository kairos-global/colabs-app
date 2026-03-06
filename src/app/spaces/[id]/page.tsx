import { getSpacePageData } from "@/app/spaces/actions";
import { SpaceWorkspace } from "./SpaceWorkspace";

type SpaceWorkspacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function SpaceWorkspacePage({ params }: SpaceWorkspacePageProps) {
  const { id } = await params;
  const data = await getSpacePageData(id);

  if (!data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4">
        <p className="text-sm text-zinc-600">Space not found or you don’t have access.</p>
        <a
          href="/dashboard"
          className="rounded-full border border-black bg-[#00cefc] px-4 py-2 text-sm font-semibold text-black"
        >
          Back to dashboard
        </a>
      </div>
    );
  }

  return <SpaceWorkspace spaceId={id} initialData={data} />;
}
