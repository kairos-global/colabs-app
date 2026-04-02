export default function PrivacyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Privacy Policy (Draft)</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        This is a product draft of the CoLabs Privacy Policy. It describes, at a high level, how we
        expect to handle data in the application.
      </p>
      <section className="space-y-3 text-sm leading-relaxed text-zinc-700">
        <p>
          CoLabs stores account and profile information, collaboration spaces, messages, media, and
          tasks to operate the platform. We use service providers such as Clerk for authentication
          and Supabase for database and storage.
        </p>
        <p>
          We do not sell user content. When we update the policy, we&apos;ll indicate the effective
          date and, where appropriate, notify active users about material changes.
        </p>
      </section>
    </main>
  );
}

