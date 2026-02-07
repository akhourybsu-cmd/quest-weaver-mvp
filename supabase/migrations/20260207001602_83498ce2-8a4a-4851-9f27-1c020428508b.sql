-- Allow any authenticated user to look up campaigns by their join code
-- This is needed for the "Join Campaign" flow where a player enters a code
-- but isn't a campaign member yet
CREATE POLICY "Authenticated users can lookup campaigns by code"
ON public.campaigns
FOR SELECT
USING (
  auth.uid() IS NOT NULL
);