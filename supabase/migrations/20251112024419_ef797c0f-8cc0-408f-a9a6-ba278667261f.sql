-- Create players table linked to auth users
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B7355',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Players can view and manage their own profile
CREATE POLICY "Users can view their own player profile"
  ON public.players FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own player profile"
  ON public.players FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player profile"
  ON public.players FOR UPDATE
  USING (auth.uid() = user_id);

-- Drop ALL existing policies on player_campaign_links
DROP POLICY IF EXISTS "Anyone can create player campaign links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Anyone can delete player campaign links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Anyone can update player campaign links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Anyone can view player campaign links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Users can create their own links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Users can view their own links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Users can insert their own links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Users can update their own links" ON public.player_campaign_links;
DROP POLICY IF EXISTS "Users can delete their own links" ON public.player_campaign_links;

-- Recreate RLS policies for player_campaign_links
CREATE POLICY "Users can view their own links"
  ON public.player_campaign_links FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_campaign_links.player_id
      AND players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own links"
  ON public.player_campaign_links FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_campaign_links.player_id
      AND players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own links"
  ON public.player_campaign_links FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_campaign_links.player_id
      AND players.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own links"
  ON public.player_campaign_links FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.players
      WHERE players.id = player_campaign_links.player_id
      AND players.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();