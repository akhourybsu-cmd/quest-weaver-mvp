-- Create campaign_sessions table for tracking live sessions
CREATE TABLE IF NOT EXISTS public.campaign_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('preparing', 'live', 'paused', 'ended')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  active_encounter_id UUID REFERENCES public.encounters(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add live_session_id to campaigns table
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS live_session_id UUID REFERENCES public.campaign_sessions(id);

-- Enable RLS
ALTER TABLE public.campaign_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaign_sessions
CREATE POLICY "DMs can view their campaign sessions"
  ON public.campaign_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_sessions.campaign_id 
      AND campaigns.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can create campaign sessions"
  ON public.campaign_sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_sessions.campaign_id 
      AND campaigns.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can update their campaign sessions"
  ON public.campaign_sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_sessions.campaign_id 
      AND campaigns.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can delete their campaign sessions"
  ON public.campaign_sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = campaign_sessions.campaign_id 
      AND campaigns.dm_user_id = auth.uid()
    )
  );

-- Players can view sessions for campaigns they're part of
CREATE POLICY "Players can view sessions for their campaigns"
  ON public.campaign_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.characters 
      WHERE characters.campaign_id = campaign_sessions.campaign_id 
      AND characters.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_campaign_sessions_updated_at
  BEFORE UPDATE ON public.campaign_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Enable realtime for campaign_sessions
ALTER PUBLICATION supabase_realtime ADD TABLE public.campaign_sessions;