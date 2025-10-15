-- Create analytics events table for telemetry
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES public.encounters(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}'::jsonb,
  latency_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for common queries
CREATE INDEX idx_analytics_events_campaign ON public.analytics_events(campaign_id, created_at DESC);
CREATE INDEX idx_analytics_events_encounter ON public.analytics_events(encounter_id, created_at DESC);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type, created_at DESC);
CREATE INDEX idx_analytics_events_user ON public.analytics_events(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- DMs can view analytics for their campaigns
CREATE POLICY "DMs can view campaign analytics"
ON public.analytics_events
FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
  )
);

-- Authenticated users can insert analytics events
CREATE POLICY "Authenticated users can insert analytics"
ON public.analytics_events
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Analytics are immutable
CREATE POLICY "Analytics are immutable"
ON public.analytics_events
FOR UPDATE
USING (false);

-- Only DMs can delete analytics
CREATE POLICY "Only DMs can delete analytics"
ON public.analytics_events
FOR DELETE
USING (
  campaign_id IN (
    SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
  )
);