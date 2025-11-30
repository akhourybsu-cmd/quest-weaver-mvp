-- Create player_journals table for personal journal entries
CREATE TABLE IF NOT EXISTS public.player_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.campaign_sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_player_journals_campaign ON public.player_journals(campaign_id);
CREATE INDEX IF NOT EXISTS idx_player_journals_character ON public.player_journals(character_id);
CREATE INDEX IF NOT EXISTS idx_player_journals_session ON public.player_journals(session_id);

-- Enable RLS
ALTER TABLE public.player_journals ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Players can manage their own journal entries
CREATE POLICY "Players can view their own journal entries"
  ON public.player_journals
  FOR SELECT
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can create their own journal entries"
  ON public.player_journals
  FOR INSERT
  WITH CHECK (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can update their own journal entries"
  ON public.player_journals
  FOR UPDATE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Players can delete their own journal entries"
  ON public.player_journals
  FOR DELETE
  USING (
    character_id IN (
      SELECT id FROM public.characters WHERE user_id = auth.uid()
    )
  );

-- DMs can view all journal entries in their campaigns
CREATE POLICY "DMs can view campaign journal entries"
  ON public.player_journals
  FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns WHERE dm_user_id = auth.uid()
    )
  );

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_journals;