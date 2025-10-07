-- Create security definer function to check campaign membership
create or replace function public.is_campaign_member(_campaign_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from campaigns c
    where c.id = _campaign_id
      and (c.dm_user_id = _user_id
        or exists (
          select 1
          from characters ch
          where ch.campaign_id = c.id
            and ch.user_id = _user_id
        ))
  )
$$;

-- Drop existing recursive policies on campaigns
drop policy if exists "Campaign members can view campaigns" on campaigns;

-- Create new non-recursive policy for campaigns
create policy "Campaign members can view campaigns"
on campaigns
for select
to authenticated
using (dm_user_id = auth.uid() or public.is_campaign_member(id, auth.uid()));

-- Update characters policy to be simpler (no recursion needed)
drop policy if exists "Campaign members can view characters" on characters;

create policy "Campaign members can view characters"
on characters
for select
to authenticated
using (user_id = auth.uid() or public.is_campaign_member(campaign_id, auth.uid()));