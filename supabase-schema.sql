-- Claim Letter Help Database Schema
-- Run this in Supabase SQL Editor

-- Table to track the full lifecycle of each letter/response
create table if not exists public.cla_letters (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_email text,
  stripe_session_id text,
  stripe_payment_status text check (stripe_payment_status in ('unpaid','paid','refunded')) default 'unpaid',
  price_id text,
  letter_text text,
  analysis jsonb,           -- structured analysis from AI
  summary text,             -- plain text summary
  ai_response text,         -- final response letter
  status text check (status in ('uploaded','analyzed','responded','error')) default 'uploaded'
);

-- Helpful indexes
create index if not exists cla_letters_created_at_idx on public.cla_letters (created_at desc);
create index if not exists cla_letters_session_idx on public.cla_letters (stripe_session_id);

-- Enable RLS and lock down
alter table public.cla_letters enable row level security;

-- Only service role (server) can read/write by policy; anonymous gets nothing
create policy "deny all by default" on public.cla_letters
  as permissive for all
  to public
  using (false)
  with check (false);

-- Optional: allow anon insert if you later collect from client; for now we keep it locked.
