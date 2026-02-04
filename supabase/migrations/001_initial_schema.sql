-- PRIZE BOARDS (MVP) — SUPABASE SCHEMA
-- Safe, clean naming. No gambling language.

-- Extensions
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.plan_t as enum ('payg', 'host_plus', 'pro_host');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.board_status_t as enum ('draft', 'open', 'locked', 'completed', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payout_type_t as enum ('standard', 'quarter', 'custom');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.square_status_t as enum ('available', 'reserved', 'claimed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_status_t as enum ('requires_action', 'processing', 'succeeded', 'failed', 'refunded', 'canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payout_status_t as enum ('pending', 'scheduled', 'paid', 'failed', 'canceled');
exception when duplicate_object then null; end $$;

-- Utility function for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- Profiles (linked to auth.users)
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create profile automatically when user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Host subscriptions / plan
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan public.plan_t not null default 'payg',
  -- Stripe subscription refs (optional for MVP)
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

drop trigger if exists trg_subscriptions_updated_at on public.subscriptions;
create trigger trg_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

-- Boards
create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,

  title text not null,
  event_name text not null,
  sport text, -- optional (NFL, NBA, etc.)
  square_price_cents integer not null check (square_price_cents > 0),

  status public.board_status_t not null default 'draft',
  payout_type public.payout_type_t not null default 'standard',

  -- payout rules JSONB
  -- Example quarter:
  -- [{"event":"Q1","percent":20},{"event":"HALF","percent":20},{"event":"Q3","percent":20},{"event":"FINAL","percent":40}]
  payout_rules jsonb not null default '[]'::jsonb,

  -- Host earnings: choose ONE (either percent or flat)
  host_fee_percent numeric(5,2),
  host_fee_flat_cents integer,
  host_fee_cap_percent numeric(5,2) not null default 20.00, -- enforce in app layer too

  -- Platform fee snapshot at time of board creation (so future pricing changes don't break old boards)
  platform_fee_percent numeric(5,2) not null default 7.50,

  -- Invite / access
  invite_code text not null unique, -- short code
  is_public boolean not null default false,

  -- Locking
  lock_at timestamptz, -- optional scheduled lock
  locked_at timestamptz,
  completed_at timestamptz,

  -- Digits assigned after lock
  row_digits int[] ,  -- length 10, values 0-9
  col_digits int[] ,  -- length 10, values 0-9

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check (
    (host_fee_percent is null and host_fee_flat_cents is not null)
    or (host_fee_percent is not null and host_fee_flat_cents is null)
    or (host_fee_percent is null and host_fee_flat_cents is null)
  )
);

create index if not exists idx_boards_host on public.boards(host_id);
create index if not exists idx_boards_status on public.boards(status);
create index if not exists idx_boards_invite on public.boards(invite_code);

drop trigger if exists trg_boards_updated_at on public.boards;
create trigger trg_boards_updated_at
before update on public.boards
for each row execute function public.set_updated_at();

-- Squares (10x10 = 100 per board)
create table if not exists public.squares (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,

  row_index int not null check (row_index between 0 and 9),
  col_index int not null check (col_index between 0 and 9),

  status public.square_status_t not null default 'available',
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,

  -- optional: snapshot of price in case board changes (usually fixed per board)
  price_cents integer,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(board_id, row_index, col_index)
);

create index if not exists idx_squares_board on public.squares(board_id);
create index if not exists idx_squares_claimed_by on public.squares(claimed_by);

drop trigger if exists trg_squares_updated_at on public.squares;
create trigger trg_squares_updated_at
before update on public.squares
for each row execute function public.set_updated_at();

-- Function to create 100 squares when a board is created
create or replace function public.create_board_squares()
returns trigger as $$
begin
  insert into public.squares (board_id, row_index, col_index, price_cents)
  select new.id, r, c, new.square_price_cents
  from generate_series(0, 9) as r
  cross join generate_series(0, 9) as c;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_board_created on public.boards;
create trigger on_board_created
  after insert on public.boards
  for each row execute function public.create_board_squares();

-- Entries: the act of a user joining/claiming a square (ties to payment)
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  square_id uuid not null references public.squares(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,

  amount_cents integer not null check (amount_cents > 0),

  -- Stripe checkout/payment intent refs
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  payment_status public.payment_status_t not null default 'processing',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(square_id),
  unique(board_id, square_id, user_id)
);

create index if not exists idx_entries_board on public.entries(board_id);
create index if not exists idx_entries_user on public.entries(user_id);
create index if not exists idx_entries_pi on public.entries(stripe_payment_intent_id);

drop trigger if exists trg_entries_updated_at on public.entries;
create trigger trg_entries_updated_at
before update on public.entries
for each row execute function public.set_updated_at();

-- Payout events: what gets paid (Q1, HALF, Q3, FINAL, custom events)
create table if not exists public.payout_events (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,

  event_key text not null,   -- e.g. Q1, HALF, Q3, FINAL, CUSTOM_1
  label text not null,       -- display label
  percent numeric(5,2) not null check (percent > 0 and percent <= 100),

  -- score digits that won (set when host enters scores)
  row_digit int check (row_digit between 0 and 9),
  col_digit int check (col_digit between 0 and 9),

  winning_square_id uuid references public.squares(id) on delete set null,
  winner_user_id uuid references auth.users(id) on delete set null,

  prize_amount_cents integer, -- computed when board is locked/entries final
  status public.payout_status_t not null default 'pending',

  -- Stripe payout/transfer refs (depends on your Stripe Connect approach)
  stripe_transfer_id text,
  stripe_payout_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(board_id, event_key)
);

create index if not exists idx_payout_events_board on public.payout_events(board_id);

drop trigger if exists trg_payout_events_updated_at on public.payout_events;
create trigger trg_payout_events_updated_at
before update on public.payout_events
for each row execute function public.set_updated_at();

-- Board scores: stores host-entered scores (MVP manual entry)
create table if not exists public.board_scores (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,

  event_key text not null, -- Q1, HALF, Q3, FINAL
  team_a_score int not null default 0,
  team_b_score int not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique(board_id, event_key)
);

drop trigger if exists trg_board_scores_updated_at on public.board_scores;
create trigger trg_board_scores_updated_at
before update on public.board_scores
for each row execute function public.set_updated_at();

-- -------------------------
-- RLS (Row Level Security)
-- -------------------------
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.boards enable row level security;
alter table public.squares enable row level security;
alter table public.entries enable row level security;
alter table public.payout_events enable row level security;
alter table public.board_scores enable row level security;

-- Profiles: user can read/write their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "profiles_upsert_own" on public.profiles;
create policy "profiles_upsert_own"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Allow reading other profiles for display purposes (e.g., host name)
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all"
on public.profiles for select
using (true);

-- Subscriptions: user can read own
drop policy if exists "subs_select_own" on public.subscriptions;
create policy "subs_select_own"
on public.subscriptions for select
using (auth.uid() = user_id);

-- Boards:
-- Only visible if explicitly public or you're the host
-- Invite-code access is handled at the app layer
drop policy if exists "boards_select_public" on public.boards;
create policy "boards_select_public"
on public.boards for select
using (
  is_public = true
  or host_id = auth.uid()
);

-- Host can manage their boards
drop policy if exists "boards_host_all" on public.boards;
create policy "boards_host_all"
on public.boards for all
using (auth.uid() = host_id)
with check (auth.uid() = host_id);

-- Squares:
-- Readable if board is public or you're the host
-- Invite-code access is handled at the app layer with service role
drop policy if exists "squares_select_visible" on public.squares;
create policy "squares_select_visible"
on public.squares for select
using (
  exists (
    select 1 from public.boards b
    where b.id = squares.board_id
      and (b.is_public = true or b.host_id = auth.uid())
  )
);

-- Users can claim available squares
drop policy if exists "squares_claim" on public.squares;
create policy "squares_claim"
on public.squares for update
using (
  status = 'available' or claimed_by = auth.uid()
)
with check (
  claimed_by = auth.uid()
);

-- Host can manage squares on their boards
drop policy if exists "squares_host_manage" on public.squares;
create policy "squares_host_manage"
on public.squares for update
using (
  exists (
    select 1 from public.boards b
    where b.id = squares.board_id and b.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = squares.board_id and b.host_id = auth.uid()
  )
);

-- Entries: user can read their own entries
drop policy if exists "entries_select_own" on public.entries;
create policy "entries_select_own"
on public.entries for select
using (auth.uid() = user_id);

-- Users can create entries
drop policy if exists "entries_insert" on public.entries;
create policy "entries_insert"
on public.entries for insert
with check (auth.uid() = user_id);

-- Host can read entries for their boards
drop policy if exists "entries_host_select" on public.entries;
create policy "entries_host_select"
on public.entries for select
using (
  exists (
    select 1 from public.boards b
    where b.id = entries.board_id and b.host_id = auth.uid()
  )
);

-- Payout events: anyone can read for their boards
drop policy if exists "payout_events_select" on public.payout_events;
create policy "payout_events_select"
on public.payout_events for select
using (
  exists (
    select 1 from public.boards b
    where b.id = payout_events.board_id
      and (b.host_id = auth.uid() or b.status in ('locked', 'completed'))
  )
);

-- Host can manage payout events
drop policy if exists "payout_events_host_all" on public.payout_events;
create policy "payout_events_host_all"
on public.payout_events for all
using (
  exists (
    select 1 from public.boards b
    where b.id = payout_events.board_id and b.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = payout_events.board_id and b.host_id = auth.uid()
  )
);

-- Scores: anyone can read scores for visible boards
drop policy if exists "board_scores_select" on public.board_scores;
create policy "board_scores_select"
on public.board_scores for select
using (
  exists (
    select 1 from public.boards b
    where b.id = board_scores.board_id
      and (b.host_id = auth.uid() or b.status in ('locked', 'completed'))
  )
);

-- Host can manage scores
drop policy if exists "board_scores_host_all" on public.board_scores;
create policy "board_scores_host_all"
on public.board_scores for all
using (
  exists (
    select 1 from public.boards b
    where b.id = board_scores.board_id and b.host_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.boards b
    where b.id = board_scores.board_id and b.host_id = auth.uid()
  )
);

-- -------------------------
-- Functions
-- -------------------------

-- Atomic square reservation function (for checkout flow)
create or replace function public.reserve_square(p_square_id uuid)
returns public.squares
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.squares;
begin
  update public.squares
  set status = 'reserved',
      claimed_by = auth.uid(),
      claimed_at = now()
  where id = p_square_id
    and status = 'available'
  returning * into s;

  if not found then
    raise exception 'Square is no longer available';
  end if;

  return s;
end $$;

-- Atomic square claiming function (for webhook/admin after payment)
create or replace function public.claim_square(p_square_id uuid)
returns public.squares
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.squares;
begin
  update public.squares
  set status = 'claimed',
      claimed_at = now()
  where id = p_square_id
    and (status = 'available' or status = 'reserved')
  returning * into s;

  if not found then
    raise exception 'Square is no longer available';
  end if;

  return s;
end $$;
