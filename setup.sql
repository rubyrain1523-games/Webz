-- ===== WEBZ DATABASE SETUP =====
-- Run this once in the Supabase SQL Editor.

-- 1. PROFILES TABLE (usernames, linked to Supabase's built-in auth users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now()
);

-- Usernames must be unique, ignoring case (so "Alex" and "alex" can't both exist)
create unique index if not exists profiles_username_unique_idx
  on profiles (lower(username));

-- 2. WEBSITES TABLE
create table if not exists websites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  creator_id uuid references profiles(id) on delete cascade,
  html_content text not null,
  published boolean default true,
  created_at timestamptz default now()
);

-- 3. ROW LEVEL SECURITY
-- This is what actually enforces "you can only edit your own stuff."
alter table profiles enable row level security;
alter table websites enable row level security;

-- Anyone (even logged out) can read profiles -- we need this so the
-- Browser can search by creator username.
create policy "Profiles are publicly readable"
  on profiles for select
  using (true);

-- Users can only create/update their OWN profile row.
create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

-- Anyone can read PUBLISHED websites, but a user can also see
-- their own unpublished drafts.
create policy "Published websites are publicly readable"
  on websites for select
  using (published = true or auth.uid() = creator_id);

-- Users can only create websites under their own account.
create policy "Users can insert their own websites"
  on websites for insert
  with check (auth.uid() = creator_id);

-- Users can only edit/delete their OWN websites -- this is the rule
-- that stops anyone from touching someone else's site.
create policy "Users can update their own websites"
  on websites for update
  using (auth.uid() = creator_id)
  with check (auth.uid() = creator_id);

create policy "Users can delete their own websites"
  on websites for delete
  using (auth.uid() = creator_id);
