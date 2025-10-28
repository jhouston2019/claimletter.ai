create table if not exists public.cla_letters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  file_name text not null,
  file_path text not null,
  created_at timestamp default now()
);
