import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { JoinSpaceClient } from "../JoinSpaceClient";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinSpacePage({ params }: JoinPageProps) {
  const { token } = await params;
  const { userId } = await auth();

  if (!userId) {
    redirect(`/sign-in?redirect_url=/spaces/join/${token}`);
  }

  return <JoinSpaceClient token={token} />;
}
