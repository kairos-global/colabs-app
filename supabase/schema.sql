-- High-level schema draft for CoLabs, aligned with the product spec.
-- This is intentionally minimal and will be refined as we hook up Supabase.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  bio text,
  created_at timestamptz default now()
);

create table if not exists spaces (
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

create table if not exists space_members (
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

create table if not exists space_media (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  uploader_id uuid references profiles (id),
  type text not null,
  storage_path text not null,
  title text,
  description text,
  attribution_user_id uuid references profiles (id),
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table if not exists space_tasks (
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

create table if not exists space_boards (
  id uuid primary key default gen_random_uuid(),
  space_id uuid references spaces (id),
  title text not null,
  description text,
  type text,
  visibility text default 'internal',
  created_at timestamptz default now()
);

create table if not exists space_publications (
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

