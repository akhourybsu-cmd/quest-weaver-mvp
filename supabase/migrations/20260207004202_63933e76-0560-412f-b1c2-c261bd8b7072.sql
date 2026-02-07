-- Fix lore_pages SELECT policy to also check campaign_members
DROP POLICY "Campaign members can view lore pages" ON public.lore_pages;

CREATE POLICY "Campaign members can view lore pages"
ON public.lore_pages
FOR SELECT
USING (
  campaign_id IN (
    SELECT campaigns.id FROM campaigns WHERE campaigns.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM campaign_members WHERE campaign_members.user_id = auth.uid()
  )
);

-- Fix session_notes SELECT policy to also check campaign_members
DROP POLICY "Campaign members can view appropriate notes" ON public.session_notes;

CREATE POLICY "Campaign members can view appropriate notes"
ON public.session_notes
FOR SELECT
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c WHERE c.dm_user_id = auth.uid()
    UNION
    SELECT characters.campaign_id FROM characters WHERE characters.user_id = auth.uid()
    UNION
    SELECT campaign_members.campaign_id FROM campaign_members WHERE campaign_members.user_id = auth.uid()
  )
  AND (
    visibility = 'SHARED'
    OR (visibility = 'DM_ONLY' AND campaign_id IN (SELECT campaigns.id FROM campaigns WHERE campaigns.dm_user_id = auth.uid()))
    OR (visibility = 'PRIVATE' AND author_id = auth.uid())
  )
);