-- Add DELETE policy for DMs on campaigns table
CREATE POLICY "DMs can delete their campaigns"
ON public.campaigns
FOR DELETE
USING (dm_user_id = auth.uid());