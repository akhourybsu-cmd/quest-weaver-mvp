-- Fix 1: Create security definer function to break RLS recursion on campaign_members
create or replace function public.get_user_campaign_role(_campaign_id uuid)
returns table(has_access boolean, is_dm boolean)
language sql
stable
security definer
set search_path = public
as $$
  select 
    exists(select 1 from campaign_members where campaign_id = _campaign_id and user_id = auth.uid()) as has_access,
    exists(select 1 from campaign_members where campaign_id = _campaign_id and user_id = auth.uid() and role = 'DM') as is_dm;
$$;

-- Drop old recursive policies on campaign_members
drop policy if exists "Campaign members can view members" on campaign_members;
drop policy if exists "DMs can manage members" on campaign_members;

-- Create new non-recursive policies using security definer function
create policy "Campaign members can view members"
on campaign_members for select
using ((select has_access from get_user_campaign_role(campaign_id)));

create policy "DMs can manage members"
on campaign_members for all
using ((select is_dm from get_user_campaign_role(campaign_id)));

-- Fix 2: Create handouts storage bucket
insert into storage.buckets (id, name, public)
values ('handouts', 'handouts', true)
on conflict (id) do nothing;

-- Storage policies for handouts bucket
create policy "DMs can upload handouts"
  on storage.objects for insert
  with check (
    bucket_id = 'handouts' and
    (storage.foldername(name))[1] in (
      select id::text from campaigns where dm_user_id = auth.uid()
    )
  );

create policy "Campaign members can view handouts"
  on storage.objects for select
  using (
    bucket_id = 'handouts' and
    (storage.foldername(name))[1] in (
      select id::text from campaigns where dm_user_id = auth.uid()
      union
      select campaign_id::text from characters where user_id = auth.uid()
    )
  );

create policy "DMs can delete handouts"
  on storage.objects for delete
  using (
    bucket_id = 'handouts' and
    (storage.foldername(name))[1] in (
      select id::text from campaigns where dm_user_id = auth.uid()
    )
  );