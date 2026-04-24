-- 1) Replace the broad campaigns SELECT policy with an RPC-based code lookup

DROP POLICY IF EXISTS "Authenticated users can lookup campaigns by code" ON public.campaigns;

CREATE OR REPLACE FUNCTION public.find_campaign_by_code(p_code TEXT)
RETURNS TABLE(id UUID, name TEXT, code TEXT, live_session_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.code, c.live_session_id
  FROM public.campaigns c
  WHERE c.code = p_code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_campaign_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_campaign_by_code(TEXT) TO authenticated;

-- 2) Tighten analytics_events INSERT to require campaign membership when campaign_id is set
DROP POLICY IF EXISTS "Authenticated users can insert analytics" ON public.analytics_events;

CREATE POLICY "Users can insert analytics for their campaigns"
ON public.analytics_events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND (
    campaign_id IS NULL
    OR public.is_campaign_member(campaign_id, auth.uid())
  )
);
