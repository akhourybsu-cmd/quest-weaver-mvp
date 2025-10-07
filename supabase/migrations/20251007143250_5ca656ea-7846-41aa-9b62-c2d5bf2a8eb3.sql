-- Sprint 2: Maps & Spatial Tools Database Schema

-- Maps table
CREATE TABLE maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  width INTEGER NOT NULL, -- in pixels
  height INTEGER NOT NULL, -- in pixels
  grid_enabled BOOLEAN DEFAULT false,
  grid_size INTEGER DEFAULT 50, -- pixels per grid square
  scale_feet_per_square INTEGER DEFAULT 5, -- 5 feet = 1 square
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tokens table (character/monster positions on map)
CREATE TABLE tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE NOT NULL,
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- for monsters/NPCs without character records
  x REAL NOT NULL,
  y REAL NOT NULL,
  size INTEGER DEFAULT 1, -- grid squares (1=medium, 2=large, 3=huge, etc.)
  color TEXT DEFAULT '#3b82f6',
  is_visible BOOLEAN DEFAULT true, -- visible to players
  facing REAL DEFAULT 0, -- degrees
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Fog regions (DM can hide/reveal areas)
CREATE TABLE fog_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE NOT NULL,
  shape TEXT NOT NULL, -- 'rect', 'polygon', 'circle'
  path JSONB NOT NULL, -- coordinates array
  is_hidden BOOLEAN DEFAULT true, -- true = fogged, false = revealed
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AoE templates (temporary overlays for spells/abilities)
CREATE TABLE aoe_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE NOT NULL,
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  shape TEXT NOT NULL, -- 'circle', 'cone', 'line', 'cube'
  x REAL NOT NULL,
  y REAL NOT NULL,
  radius REAL, -- for circles
  width REAL, -- for lines/cubes
  length REAL, -- for lines/cones
  rotation REAL DEFAULT 0, -- degrees
  color TEXT DEFAULT '#ef4444',
  opacity REAL DEFAULT 0.5,
  label TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE fog_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE aoe_templates ENABLE ROW LEVEL SECURITY;

-- Maps policies
CREATE POLICY "Campaign members can view maps"
  ON maps FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage maps"
  ON maps FOR ALL
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ));

-- Tokens policies
CREATE POLICY "Campaign members can view visible tokens"
  ON tokens FOR SELECT
  USING (
    is_visible = true AND map_id IN (
      SELECT id FROM maps WHERE campaign_id IN (
        SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
          SELECT campaign_id FROM characters WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "DMs can view all tokens"
  ON tokens FOR SELECT
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage tokens"
  ON tokens FOR ALL
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

-- Fog regions policies (DM only)
CREATE POLICY "DMs can view fog regions"
  ON fog_regions FOR SELECT
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage fog regions"
  ON fog_regions FOR ALL
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

-- AoE templates policies
CREATE POLICY "Campaign members can view AoE templates"
  ON aoe_templates FOR SELECT
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage AoE templates"
  ON aoe_templates FOR ALL
  USING (map_id IN (
    SELECT id FROM maps WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
    )
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE maps;
ALTER PUBLICATION supabase_realtime ADD TABLE tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE fog_regions;
ALTER PUBLICATION supabase_realtime ADD TABLE aoe_templates;

-- Indexes
CREATE INDEX idx_maps_campaign ON maps(campaign_id);
CREATE INDEX idx_maps_encounter ON maps(encounter_id);
CREATE INDEX idx_tokens_map ON tokens(map_id);
CREATE INDEX idx_tokens_encounter ON tokens(encounter_id);
CREATE INDEX idx_tokens_character ON tokens(character_id);
CREATE INDEX idx_fog_regions_map ON fog_regions(map_id);
CREATE INDEX idx_aoe_templates_map ON aoe_templates(map_id);

-- Create storage bucket for map images
INSERT INTO storage.buckets (id, name, public)
VALUES ('maps', 'maps', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for maps bucket
CREATE POLICY "DMs can upload maps"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'maps' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM campaigns WHERE dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Campaign members can view maps"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'maps' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM campaigns WHERE dm_user_id = auth.uid()
      UNION
      SELECT campaign_id::text FROM characters WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "DMs can delete their campaign maps"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'maps' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM campaigns WHERE dm_user_id = auth.uid()
    )
  );