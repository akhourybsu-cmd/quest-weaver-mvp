-- Create player_presence table
CREATE TABLE IF NOT EXISTS public.player_presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_online BOOLEAN DEFAULT true,
  needs_ruling BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(campaign_id, character_id)
);

-- Enable RLS
ALTER TABLE public.player_presence ENABLE ROW LEVEL SECURITY;

-- Player presence policies
CREATE POLICY "Campaign members can view presence"
  ON public.player_presence FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM public.campaigns 
      WHERE dm_user_id = auth.uid() 
      OR id IN (SELECT campaign_id FROM public.characters WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Players can manage their own presence"
  ON public.player_presence FOR ALL
  USING (user_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_presence;