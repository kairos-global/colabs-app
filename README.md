## CoLabs Web

CoLabs is an app for collaborating with other people in shared spaces. Each space brings together
conversation, files, and tasks so a project has one clear home.

### Stack

- **Framework**: Next.js App Router (TypeScript)
- **Styling**: Tailwind CSS v4, custom tokens inspired by the CoLabs marketing mock
- **Font**: Space Grotesk via `next/font/google`
- **Auth**: Clerk
- **Database/Storage**: Supabase (schema draft in `supabase/schema.sql`)

### App structure

- `src/app/layout.tsx` – global layout + Space Grotesk + theming
- `src/app/page.tsx` – landing page mirroring the CoLabs marketing hero
- `src/app/spaces/page.tsx` – spaces list + “New Space” entry point (stubbed)
- `src/app/spaces/[id]/page.tsx` – 4-panel space workspace shell (Chat, Media, Bulletins, Tasks)
- `src/app/terms|privacy|copyright|community-guidelines` – draft legal/policy pages
- `src/lib/supabase` – placeholders for Clerk-aware Supabase clients
- `supabase/schema.sql` – high-level database schema aligned with the product spec

### Running locally

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Environment variables

Set these in `.env.local` (the file is already created with placeholders):

- **Clerk**
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`
  - *(optional)* `CLERK_SIGN_IN_URL`, `CLERK_SIGN_UP_URL`, `CLERK_AFTER_SIGN_IN_URL`, `CLERK_AFTER_SIGN_UP_URL`
- **Supabase**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`


