-- Add onboarding_completed flag to profiles
-- This tracks whether a user has completed the onboarding flow

alter table public.profiles
add column if not exists onboarding_completed boolean default false;

-- Set existing users as having completed onboarding (they're already using the app)
update public.profiles
set onboarding_completed = true
where onboarding_completed is null or onboarding_completed = false;

-- Comment for documentation
comment on column public.profiles.onboarding_completed is 'Whether the user has completed the onboarding flow';
