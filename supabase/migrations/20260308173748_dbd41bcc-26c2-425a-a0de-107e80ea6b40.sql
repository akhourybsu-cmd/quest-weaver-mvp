
create table public.beta_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null,
  name text not null,
  data jsonb not null default '{}',
  tags text[] default '{}',
  status text not null default 'draft',
  is_favorite boolean default false,
  imported_to_campaign_id uuid references campaigns(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.beta_assets enable row level security;

create policy "Users manage own beta assets"
  on public.beta_assets for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create trigger beta_assets_updated_at
  before update on public.beta_assets
  for each row execute function update_updated_at();
