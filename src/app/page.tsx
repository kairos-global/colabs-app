import Link from "next/link";
import { HomeAuthHeader } from "@/components/HomeAuthHeader";

export default function Home() {
  return (
    <>
      <HomeAuthHeader />
      <section className="flex flex-1 flex-col gap-12 px-6 py-10 md:px-16 md:py-16">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            CoLabs
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Collaborating has never been easier.
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-600">
            CoLabs is an app for working with others in shared spaces. Each space keeps your chat,
            files, bulletins, and tasks in one place so everyone knows what&apos;s going on.
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href="/spaces"
              className="rounded-full border border-black bg-[#00cefc] px-5 py-2 font-semibold text-black shadow-sm hover:bg-[#00b3dd]"
            >
              Create space
            </Link>
            <Link
              href="/community"
              className="rounded-full border border-black bg-background px-5 py-2 font-medium text-foreground hover:bg-zinc-100"
            >
              Browse community
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
