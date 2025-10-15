-- Phase 4: NPC & Faction Directory System

-- Create locations table (referenced by npcs)
CREATE TABLE IF NOT EXISTS public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  location_type text,
  parent_location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view locations"
ON public.locations FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage locations"
ON public.locations FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- Enhance existing npcs table with new fields
ALTER TABLE public.npcs 
  ADD COLUMN IF NOT EXISTS pronouns text,
  ADD COLUMN IF NOT EXISTS role_title text,
  ADD COLUMN IF NOT EXISTS public_bio text,
  ADD COLUMN IF NOT EXISTS gm_notes text,
  ADD COLUMN IF NOT EXISTS secrets text,
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS faction_id uuid,
  ADD COLUMN IF NOT EXISTS statblock_ref text,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Factions table
CREATE TABLE public.factions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  motto text,
  banner_url text,
  influence_score integer DEFAULT 0,
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.factions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view factions"
ON public.factions FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage factions"
ON public.factions FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- Now add the foreign key to npcs
ALTER TABLE public.npcs 
  ADD CONSTRAINT fk_npcs_faction 
  FOREIGN KEY (faction_id) 
  REFERENCES public.factions(id) 
  ON DELETE SET NULL;

-- Faction reputation tracking
CREATE TABLE public.faction_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  faction_id uuid REFERENCES public.factions(id) ON DELETE CASCADE NOT NULL,
  score integer DEFAULT 0 CHECK (score >= -100 AND score <= 100),
  last_changed_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(campaign_id, faction_id)
);

ALTER TABLE public.faction_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view faction reputation"
ON public.faction_reputation FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage faction reputation"
ON public.faction_reputation FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- NPC relationships
CREATE TABLE public.npc_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  source_type text CHECK (source_type IN ('NPC', 'FACTION')) NOT NULL,
  source_id uuid NOT NULL,
  target_type text CHECK (target_type IN ('NPC', 'FACTION', 'PLAYER')) NOT NULL,
  target_id uuid NOT NULL,
  relation text NOT NULL,
  intensity integer DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 5),
  notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.npc_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view relationships"
ON public.npc_relationships FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage relationships"
ON public.npc_relationships FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- NPC appearances/sightings
CREATE TABLE public.npc_appearances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  npc_id uuid REFERENCES public.npcs(id) ON DELETE CASCADE NOT NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  summary text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.npc_appearances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view appearances"
ON public.npc_appearances FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns 
    WHERE dm_user_id = auth.uid() 
    OR id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
  )
);

CREATE POLICY "DMs can manage appearances"
ON public.npc_appearances FOR ALL
USING (
  campaign_id IN (SELECT id FROM campaigns WHERE dm_user_id = auth.uid())
);

-- Indexes for performance
CREATE INDEX idx_npcs_location ON public.npcs(location_id);
CREATE INDEX idx_npcs_faction ON public.npcs(faction_id);
CREATE INDEX idx_npcs_tags ON public.npcs USING GIN(tags);
CREATE INDEX idx_factions_campaign ON public.factions(campaign_id);
CREATE INDEX idx_factions_tags ON public.factions USING GIN(tags);
CREATE INDEX idx_faction_reputation_campaign_faction ON public.faction_reputation(campaign_id, faction_id);
CREATE INDEX idx_npc_relationships_source ON public.npc_relationships(source_type, source_id);
CREATE INDEX idx_npc_relationships_target ON public.npc_relationships(target_type, target_id);
CREATE INDEX idx_npc_appearances_npc ON public.npc_appearances(npc_id);
CREATE INDEX idx_npc_appearances_session ON public.npc_appearances(session_id);
CREATE INDEX idx_locations_campaign ON public.locations(campaign_id);
CREATE INDEX idx_locations_parent ON public.locations(parent_location_id);

-- Triggers for updated_at
CREATE TRIGGER update_npcs_updated_at
  BEFORE UPDATE ON public.npcs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_factions_updated_at
  BEFORE UPDATE ON public.factions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_npc_relationships_updated_at
  BEFORE UPDATE ON public.npc_relationships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();