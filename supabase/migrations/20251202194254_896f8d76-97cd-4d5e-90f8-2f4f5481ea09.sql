-- Create timeline_events table for campaign chronicle
CREATE TABLE public.timeline_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  session_id uuid REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  summary text,
  ref_type text,
  ref_id uuid,
  payload jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz DEFAULT now(),
  in_game_date text,
  player_visible boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for common queries
CREATE INDEX idx_timeline_events_campaign ON public.timeline_events(campaign_id);
CREATE INDEX idx_timeline_events_session ON public.timeline_events(session_id);
CREATE INDEX idx_timeline_events_kind ON public.timeline_events(kind);
CREATE INDEX idx_timeline_events_occurred_at ON public.timeline_events(occurred_at DESC);

-- Enable RLS
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;

-- Campaign members can view timeline events (respecting player_visible)
CREATE POLICY "Campaign members can view timeline events"
ON public.timeline_events
FOR SELECT
USING (
  campaign_id IN (
    SELECT c.id FROM campaigns c
    WHERE c.dm_user_id = auth.uid()
    OR c.id IN (
      SELECT characters.campaign_id FROM characters
      WHERE characters.user_id = auth.uid()
    )
  )
);

-- DMs can manage all timeline events
CREATE POLICY "DMs can manage timeline events"
ON public.timeline_events
FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_events;