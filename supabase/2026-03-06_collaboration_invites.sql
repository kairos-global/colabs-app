-- ============================================================================
-- Collaboration invites, applications, and listings
-- ============================================================================
-- Run this migration AFTER the main schema.sql has been applied.
-- This file is additive only: it does not drop or modify existing tables.
--
-- New tables:
--   - collaboration_listings
--   - collaboration_applications
--   - space_invites
--
-- It also enables row level security and adds policies that align with the
-- existing patterns in schema.sql and the current_clerk_user_id() helper.
-- ============================================================================

-- --------------------------------------------------------------------------
-- collaboration_listings
-- --------------------------------------------------------------------------

create table if not exists collaboration_listings (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  owner_profile_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  summary text,
  tags jsonb,
  status text not null default 'open' check (status in ('open', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table collaboration_listings enable row level security;

drop policy if exists "collaboration_listings_select" on collaboration_listings;
create policy "collaboration_listings_select"
  on collaboration_listings for select
  using (true);

drop policy if exists "collaboration_listings_insert" on collaboration_listings;
create policy "collaboration_listings_insert"
  on collaboration_listings for insert
  with check (
    owner_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "collaboration_listings_update" on collaboration_listings;
create policy "collaboration_listings_update"
  on collaboration_listings for update
  using (
    owner_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "collaboration_listings_delete" on collaboration_listings;
create policy "collaboration_listings_delete"
  on collaboration_listings for delete
  using (
    owner_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

-- --------------------------------------------------------------------------
-- collaboration_applications
-- --------------------------------------------------------------------------

create table if not exists collaboration_applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references collaboration_listings (id) on delete cascade,
  space_id uuid not null references spaces (id) on delete cascade,
  applicant_profile_id uuid not null references profiles (id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table collaboration_applications enable row level security;

-- Helpers used in policies below:
--   - current profile ids for the logged-in Clerk user
--   - listings owned by the current user

drop policy if exists "collaboration_applications_select" on collaboration_applications;
create policy "collaboration_applications_select"
  on collaboration_applications for select
  using (
    -- You are the applicant
    applicant_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    -- You own the underlying listing / space
    exists (
      select 1
      from collaboration_listings cl
      join profiles p on p.id = cl.owner_profile_id
      where cl.id = collaboration_applications.listing_id
        and p.clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "collaboration_applications_insert" on collaboration_applications;
create policy "collaboration_applications_insert"
  on collaboration_applications for insert
  with check (
    applicant_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "collaboration_applications_update" on collaboration_applications;
create policy "collaboration_applications_update"
  on collaboration_applications for update
  using (
    applicant_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    exists (
      select 1
      from collaboration_listings cl
      join profiles p on p.id = cl.owner_profile_id
      where cl.id = collaboration_applications.listing_id
        and p.clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "collaboration_applications_delete" on collaboration_applications;
create policy "collaboration_applications_delete"
  on collaboration_applications for delete
  using (
    applicant_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    exists (
      select 1
      from collaboration_listings cl
      join profiles p on p.id = cl.owner_profile_id
      where cl.id = collaboration_applications.listing_id
        and p.clerk_user_id = current_clerk_user_id()
    )
  );

-- --------------------------------------------------------------------------
-- space_invites
-- --------------------------------------------------------------------------

create table if not exists space_invites (
  id uuid primary key default gen_random_uuid(),
  space_id uuid not null references spaces (id) on delete cascade,
  inviter_profile_id uuid not null references profiles (id) on delete cascade,
  invitee_profile_id uuid references profiles (id) on delete set null,
  invitee_email text,
  token text unique not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz default now(),
  responded_at timestamptz
);

alter table space_invites enable row level security;

-- Reuse the common \"spaces you can access\" expression from other policies.

drop policy if exists "space_invites_select" on space_invites;
create policy "space_invites_select"
  on space_invites for select
  using (
    -- You own or are a member of the space
    space_id in (
      select id from spaces
      where owner_id in (
        select id from profiles where clerk_user_id = current_clerk_user_id()
      )
      union
      select space_id
      from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
    or
    -- You are the inviter
    inviter_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    -- You are the invitee (once resolved to a profile)
    invitee_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "space_invites_insert" on space_invites;
create policy "space_invites_insert"
  on space_invites for insert
  with check (
    -- Only users who can access the space (owner or member) may create invites.
    space_id in (
      select id from spaces
      where owner_id in (
        select id from profiles where clerk_user_id = current_clerk_user_id()
      )
      union
      select space_id
      from space_members sm
      join profiles p on p.id = sm.user_id and p.clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "space_invites_update" on space_invites;
create policy "space_invites_update"
  on space_invites for update
  using (
    -- Space owner or inviter can update (e.g., mark expired or resend).
    inviter_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    space_id in (
      select id from spaces
      where owner_id in (
        select id from profiles where clerk_user_id = current_clerk_user_id()
      )
    )
    or
    -- Invitee can mark accepted/declined.
    invitee_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
  );

drop policy if exists "space_invites_delete" on space_invites;
create policy "space_invites_delete"
  on space_invites for delete
  using (
    inviter_profile_id in (
      select id from profiles where clerk_user_id = current_clerk_user_id()
    )
    or
    space_id in (
      select id from spaces
      where owner_id in (
        select id from profiles where clerk_user_id = current_clerk_user_id()
      )
    )
  );

