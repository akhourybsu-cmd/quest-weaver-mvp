-- ============================================================================
-- Phase 6 — per-campaign rules-source settings (idempotent)
--
-- Lets a campaign choose which registered rules sources are enabled. The app
-- treats "no rows for a campaign" as "all enabled" (so existing campaigns are
-- unaffected); once any row exists, only enabled=true sources are active.
--
-- Additive + idempotent; RLS mirrors the repo's campaign-scoped pattern:
--   read  → campaign members  (public.is_campaign_member)
--   write → the campaign's DM  (campaigns.dm_user_id)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.campaign_rules_sources (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  source_key  text NOT NULL,
  enabled     boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, source_key)
);

CREATE INDEX IF NOT EXISTS idx_campaign_rules_sources_campaign
  ON public.campaign_rules_sources (campaign_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_rules_sources TO authenticated;
GRANT ALL ON public.campaign_rules_sources TO service_role;

ALTER TABLE public.campaign_rules_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Campaign members can read source settings" ON public.campaign_rules_sources;
CREATE POLICY "Campaign members can read source settings"
  ON public.campaign_rules_sources FOR SELECT
  TO authenticated
  USING (public.is_campaign_member(campaign_id, auth.uid()));

DROP POLICY IF EXISTS "DMs can manage source settings" ON public.campaign_rules_sources;
CREATE POLICY "DMs can manage source settings"
  ON public.campaign_rules_sources FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.dm_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.dm_user_id = auth.uid()));

DROP TRIGGER IF EXISTS update_campaign_rules_sources_updated_at ON public.campaign_rules_sources;
CREATE TRIGGER update_campaign_rules_sources_updated_at
  BEFORE UPDATE ON public.campaign_rules_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
