-- Create player_campaign_links table for persistent campaign associations
CREATE TABLE IF NOT EXISTS public.player_campaign_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  join_code TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  nickname TEXT,
  last_joined_at TIMESTAMPTZ,
  pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(player_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.player_campaign_links ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read links (for device-local players)
CREATE POLICY "Anyone can view player campaign links"
  ON public.player_campaign_links
  FOR SELECT
  USING (true);

-- Policy: Anyone can create links (for device-local players joining campaigns)
CREATE POLICY "Anyone can create player campaign links"
  ON public.player_campaign_links
  FOR INSERT
  WITH CHECK (true);

-- Policy: Anyone can update their own links
CREATE POLICY "Anyone can update player campaign links"
  ON public.player_campaign_links
  FOR UPDATE
  USING (true);

-- Policy: Anyone can delete their own links
CREATE POLICY "Anyone can delete player campaign links"
  ON public.player_campaign_links
  FOR DELETE
  USING (true);

-- Add index for faster lookups
CREATE INDEX idx_player_campaign_links_player_id ON public.player_campaign_links(player_id);
CREATE INDEX idx_player_campaign_links_campaign_id ON public.player_campaign_links(campaign_id);
CREATE INDEX idx_player_campaign_links_join_code ON public.player_campaign_links(join_code);

-- Trigger for updated_at
CREATE TRIGGER update_player_campaign_links_updated_at
  BEFORE UPDATE ON public.player_campaign_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();