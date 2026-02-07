
-- Phase 1: Allow players to insert themselves into campaign_members
CREATE POLICY "Players can join campaigns"
ON public.campaign_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'PLAYER'
);

-- Phase 2: Backfill missing campaign_members rows from player_campaign_links
INSERT INTO public.campaign_members (campaign_id, user_id, role)
SELECT pcl.campaign_id, p.user_id, 'PLAYER'
FROM public.player_campaign_links pcl
JOIN public.players p ON p.id = pcl.player_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.campaign_members cm
  WHERE cm.campaign_id = pcl.campaign_id
  AND cm.user_id = p.user_id
);

-- Phase 3: Fix SELECT policies for 6 tables to include campaign_members check

-- NPCs
DROP POLICY IF EXISTS "Campaign members can view NPCs" ON public.npcs;
CREATE POLICY "Campaign members can view NPCs"
ON public.npcs
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Locations
DROP POLICY IF EXISTS "Campaign members can view locations" ON public.locations;
CREATE POLICY "Campaign members can view locations"
ON public.locations
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Quests
DROP POLICY IF EXISTS "Campaign members can view quests" ON public.quests;
CREATE POLICY "Campaign members can view quests"
ON public.quests
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Quest Steps
DROP POLICY IF EXISTS "Campaign members can view quest steps" ON public.quest_steps;
CREATE POLICY "Campaign members can view quest steps"
ON public.quest_steps
FOR SELECT
TO authenticated
USING (
  quest_id IN (
    SELECT q.id FROM public.quests q
    WHERE q.campaign_id IN (
      SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
      UNION
      SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
      UNION
      SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
    )
  )
);

-- Factions
DROP POLICY IF EXISTS "Campaign members can view factions" ON public.factions;
CREATE POLICY "Campaign members can view factions"
ON public.factions
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Timeline Events
DROP POLICY IF EXISTS "Campaign members can view timeline events" ON public.timeline_events;
CREATE POLICY "Campaign members can view timeline events"
ON public.timeline_events
FOR SELECT
TO authenticated
USING (
  campaign_id IN (
    SELECT campaigns.id FROM public.campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM public.characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM public.campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Phase 4: Enable realtime for factions and lore_pages
ALTER PUBLICATION supabase_realtime ADD TABLE public.factions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lore_pages;
