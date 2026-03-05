export default function TermsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 bg-background px-6 py-12 text-foreground">
      <h1 className="text-2xl font-semibold tracking-tight">Terms of Service (Draft)</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        This is a product draft of the CoLabs Terms of Service. It is not legal advice. Final
        language will be prepared with counsel. Terms are
      </p>
      <section className="space-y-3 text-sm leading-relaxed text-zinc-700">
        <p>
          CoLabs is a collaboration infrastructure platform. You and your collaborators keep
          ownership of the content you create. By using CoLabs you grant us a limited,
          non-exclusive, worldwide, royalty-free license to host and display your content solely
          for operating the platform.
        </p>
        <p>
          CoLabs is not a party to collaboration agreements between users. We do not enforce
          payments, guarantee ownership splits, or resolve disputes between collaborators.
        </p>
      </section>
    </main>
  );
}

