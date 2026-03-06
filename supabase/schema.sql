-- =============================================================================
-- CoLabs Supabase schema (final)
-- =============================================================================
--
-- Run this entire file in the Supabase SQL Editor on your project.
--
-- 1. RESET: Drops existing app tables (and the old portfolio_media if present)
--    so the DB matches this schema. Does NOT touch auth.users or other Supabase
--    system objects. Run only when you are ready to (re)create these tables.
-- 2. TABLES: Creates profiles (Clerk-linked), profile_media, spaces, and all
--    space-related tables. All user references go through profiles.id.
-- 3. RLS: Enables row-level security and policies keyed by Clerk user id (JWT
--    "sub" claim). Service role bypasses RLS; use it only server-side.
--
-- After running: create Storage bucket "profile-media" in Dashboard (public or
-- with RLS as needed). Paths: {clerk_user_id}/avatar.* and {clerk_user_id}/media/*
--
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Part 1: Reset (drop app-owned tables and helper in reverse dependency order)
-- ---------------------------------------------------------------------------

drop table if exists space_publications;
drop table if exists space_tasks;
drop table if exists space_boards;
drop table if exists space_media;
drop table if exists space_messages;
drop table if exists space_members;
drop table if exists spaces;
drop table if exists profile_media;
drop table if exists portfolio_media;
drop table if exists profiles;

drop function if exists current_clerk_user_id();

-- ---------------------------------------------------------------------------
-- Part 2: Tables
-- ---------------------------------------------------------------------------

create table profiles (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text unique,
  display_name text,
  bio text,
  avatar_url text,
  url text,
  -- optional future billing fields
  plan_tier text check (plan_tier in ('starter', 'pro')) default 'starter',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table profile_media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles (id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

create table spaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles (id),
  title text not null default 'Untitled',
  description text,
  ownership_type text,
  compensation_type text,
  license_type text,
  attribution_required boolean default false,
  ownership_splits jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table space_members (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  user_id uuid references profiles (id),
  role text not null,
  agreement_accepted boolean default false,
  agreement_timestamp timestamptz,
  agreement_version text,
  ip_address text,
  joined_at timestamptz default now()
);

create table if not exists space_messages (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  author_id uuid references profiles (id),
  content text not null,
  reply_to_id uuid references space_messages (id),
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table space_media (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  uploader_id uuid references profiles (id),
  type text not null,
  storage_path text not null,
  title text,
  size_bytes bigint,
  mime_type text,
  description text,
  attribution_user_id uuid references profiles (id),
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table space_tasks (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  board_id uuid,
  title text not null,
  description text,
  status text not null default 'todo',
  assignee_id uuid references profiles (id),
  due_date date,
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table space_boards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  title text not null,
  description text,
  type text,
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table space_publications (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  title text not null,
  summary text,
  published_at timestamptz,
  published_by uuid references profiles (id),
  visibility_scope text default 'unlisted',
  cover_media_id uuid references space_media (id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- Part 3: RLS (Row Level Security)
-- ---------------------------------------------------------------------------
-- These policies apply when using the anon key with a JWT. The service_role
-- key bypasses RLS (use it only server-side). To use RLS with Clerk, configure
-- Supabase to accept your Clerk JWT and pass it when calling Supabase from
-- the client; the helper below reads the "sub" claim (Clerk user id).
--
-- Storage bucket "profile-media": in Dashboard, create the bucket and add
-- policies so users can read/write only paths under their own clerk_user_id
-- (e.g. {clerk_user_id}/*). Public read is optional for profile avatars/media.
--
-- Helper: current user's Clerk id from JWT (when using anon key with Clerk JWT).
create or replace function current_clerk_user_id()
returns text
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text;
$$;

-- Profiles: anyone can read; only the owning user (by clerk_user_id) can insert/update/delete.
alter table profiles enable row level security;

create policy "profiles_select"
  on profiles for select
  using (true);

create policy "profiles_insert"
  on profiles for insert
  with check (clerk_user_id = current_clerk_user_id());

create policy "profiles_update"
  on profiles for update
  using (clerk_user_id = current_clerk_user_id())
  with check (clerk_user_id = current_clerk_user_id());

create policy "profiles_delete"
  on profiles for delete
  using (clerk_user_id = current_clerk_user_id());

-- Profile media: anyone can read; only the profile owner can insert/update/delete.
alter table profile_media enable row level security;

create policy "profile_media_select"
  on profile_media for select
  using (true);

create policy "profile_media_insert"
  on profile_media for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = profile_media.profile_id
        and profiles.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "profile_media_update"
  on profile_media for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = profile_media.profile_id
        and profiles.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "profile_media_delete"
  on profile_media for delete
  using (
    exists (
      select 1 from profiles
      where profiles.id = profile_media.profile_id
        and profiles.clerk_user_id = current_clerk_user_id()
    )
  );

-- Spaces: read if you are owner or a member; insert as owner; update/delete if owner.
alter table spaces enable row level security;

create policy "spaces_select"
  on spaces for select
  using (
    owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
    or exists (
      select 1 from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
      where sm.space_id = spaces.id
    )
  );

create policy "spaces_insert"
  on spaces for insert
  with check (
    owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
  );

create policy "spaces_update"
  on spaces for update
  using (
    owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
  );

create policy "spaces_delete"
  on spaces for delete
  using (
    owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
  );

-- Space members: read/insert/update/delete only for spaces you can access (owner or member).
alter table space_members enable row level security;

create policy "space_members_select"
  on space_members for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_members_insert"
  on space_members for insert
  with check (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

create policy "space_members_update"
  on space_members for update
  using (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

create policy "space_members_delete"
  on space_members for delete
  using (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

-- Space messages: same as spaces (read/write only inside spaces you belong to).
alter table space_messages enable row level security;

create policy "space_messages_select"
  on space_messages for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_messages_insert"
  on space_messages for insert
  with check (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_messages_update"
  on space_messages for update
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_messages_delete"
  on space_messages for delete
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

-- Space media: same as spaces.
alter table space_media enable row level security;

create policy "space_media_select"
  on space_media for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_media_insert"
  on space_media for insert
  with check (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_media_update"
  on space_media for update
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_media_delete"
  on space_media for delete
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

-- Space tasks: same as spaces.
alter table space_tasks enable row level security;

create policy "space_tasks_select"
  on space_tasks for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_tasks_insert"
  on space_tasks for insert
  with check (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_tasks_update"
  on space_tasks for update
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_tasks_delete"
  on space_tasks for delete
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

-- Space boards: same as spaces.
alter table space_boards enable row level security;

create policy "space_boards_select"
  on space_boards for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_boards_insert"
  on space_boards for insert
  with check (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_boards_update"
  on space_boards for update
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_boards_delete"
  on space_boards for delete
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

-- Space publications: read if space is yours or you're a member; write (insert/update/delete) only if space owner.
alter table space_publications enable row level security;

create policy "space_publications_select"
  on space_publications for select
  using (
    space_id in (
      select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id())
      union
      select space_id from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

create policy "space_publications_insert"
  on space_publications for insert
  with check (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

create policy "space_publications_update"
  on space_publications for update
  using (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

create policy "space_publications_delete"
  on space_publications for delete
  using (
    space_id in (select id from spaces where owner_id in (select id from profiles where clerk_user_id = current_clerk_user_id()))
  );

