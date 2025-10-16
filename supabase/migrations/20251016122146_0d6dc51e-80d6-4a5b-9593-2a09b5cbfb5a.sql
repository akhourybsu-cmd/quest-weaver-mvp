-- Allow users to delete their own characters
CREATE POLICY "Users can delete their own characters"
ON public.characters
FOR DELETE
USING (user_id = auth.uid());

-- Allow DMs to delete characters in their campaigns
CREATE POLICY "DMs can delete campaign characters"
ON public.characters
FOR DELETE
USING (campaign_id IN (
  SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
));