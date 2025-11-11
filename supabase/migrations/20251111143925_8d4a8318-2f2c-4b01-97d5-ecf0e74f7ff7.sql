-- P0 Gap 5: Add surprise tracking to initiative
ALTER TABLE initiative ADD COLUMN IF NOT EXISTS is_surprised boolean DEFAULT false;

-- P1 Gap 6: Add expanded crit range support
ALTER TABLE characters ADD COLUMN IF NOT EXISTS crit_range_min integer DEFAULT 20;
COMMENT ON COLUMN characters.crit_range_min IS 'Minimum roll for critical hit (default 20, Champion 19 at L3, 18 at L15)';

-- P1 Gap 7: Add passive Investigation and Insight
ALTER TABLE characters ADD COLUMN IF NOT EXISTS passive_investigation integer DEFAULT 10;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS passive_insight integer DEFAULT 10;

-- P1 Gap 9: Add lingering injuries table
CREATE TABLE IF NOT EXISTS lingering_injuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE,
  injury_type text NOT NULL,
  description text NOT NULL,
  effects jsonb DEFAULT '{}',
  acquired_at timestamp with time zone DEFAULT now(),
  healed_at timestamp with time zone,
  is_permanent boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE lingering_injuries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view lingering injuries"
ON lingering_injuries FOR SELECT
USING (
  character_id IN (
    SELECT c.id FROM characters c
    JOIN campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid() 
    OR c.user_id = auth.uid()
  )
);

CREATE POLICY "DMs can manage lingering injuries"
ON lingering_injuries FOR ALL
USING (
  character_id IN (
    SELECT c.id FROM characters c
    JOIN campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  )
);

-- P1 Gap 10: Add suffocation tracking
ALTER TABLE characters ADD COLUMN IF NOT EXISTS breath_remaining_rounds integer;
COMMENT ON COLUMN characters.breath_remaining_rounds IS 'Rounds of breath remaining while suffocating (null = breathing normally)';

-- P2 Gap 11: Encumbrance already tracked via weight, no DB changes needed

-- P2 Gap 13: Add crafting and downtime system
CREATE TABLE IF NOT EXISTS downtime_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  character_id uuid REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  activity_type text NOT NULL CHECK (activity_type IN ('crafting', 'training', 'research', 'recuperating', 'other')),
  item_name text,
  item_type text,
  item_rarity text,
  total_cost_gp numeric DEFAULT 0,
  total_days_required integer DEFAULT 0,
  days_completed integer DEFAULT 0,
  materials_json jsonb DEFAULT '[]',
  description text,
  started_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE downtime_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view downtime activities"
ON downtime_activities FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE dm_user_id = auth.uid() OR is_campaign_member(id, auth.uid())
  )
);

CREATE POLICY "DMs and players can manage their downtime"
ON downtime_activities FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
  OR character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  )
);

-- P2 Gap 15: Add NPC attitude system
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS attitude text DEFAULT 'indifferent' CHECK (attitude IN ('hostile', 'indifferent', 'friendly'));
COMMENT ON COLUMN npcs.attitude IS 'NPC attitude toward party: hostile, indifferent, or friendly (DMG 244-245)';

-- P3 Gap 16: Add weather system
CREATE TABLE IF NOT EXISTS campaign_weather (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE NOT NULL,
  weather_type text NOT NULL CHECK (weather_type IN ('clear', 'rain', 'heavy_rain', 'snow', 'heavy_snow', 'fog', 'wind', 'storm')),
  temperature text CHECK (temperature IN ('extreme_cold', 'cold', 'moderate', 'hot', 'extreme_heat')),
  effects jsonb DEFAULT '{}',
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE campaign_weather ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view weather"
ON campaign_weather FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE dm_user_id = auth.uid() OR is_campaign_member(id, auth.uid())
  )
);

CREATE POLICY "DMs can manage weather"
ON campaign_weather FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
);

-- P3 Gap 18: Add luck points tracking (Lucky feat, Halfling Luck)
ALTER TABLE characters ADD COLUMN IF NOT EXISTS luck_points_total integer DEFAULT 0;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS luck_points_used integer DEFAULT 0;
COMMENT ON COLUMN characters.luck_points_total IS 'Total luck points from Lucky feat (3) or other sources';
COMMENT ON COLUMN characters.luck_points_used IS 'Luck points used this long rest';

-- P3 Gap 19: Add personality traits from backgrounds
ALTER TABLE characters ADD COLUMN IF NOT EXISTS personality_traits text;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS ideals text;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS bonds text;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS flaws text;

-- P3 Gap 20: Add session zero tools
CREATE TABLE IF NOT EXISTS campaign_pitch (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE UNIQUE NOT NULL,
  pitch_text text,
  tone text,
  themes text[],
  house_rules text,
  safety_tools jsonb DEFAULT '{"x_card": true, "lines": [], "veils": []}',
  player_expectations jsonb DEFAULT '[]',
  session_zero_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE campaign_pitch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campaign members can view pitch"
ON campaign_pitch FOR SELECT
USING (
  campaign_id IN (
    SELECT id FROM campaigns
    WHERE dm_user_id = auth.uid() OR is_campaign_member(id, auth.uid())
  )
);

CREATE POLICY "DMs can manage pitch"
ON campaign_pitch FOR ALL
USING (
  campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_lingering_injuries_character ON lingering_injuries(character_id);
CREATE INDEX IF NOT EXISTS idx_downtime_character ON downtime_activities(character_id);
CREATE INDEX IF NOT EXISTS idx_downtime_campaign ON downtime_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_weather_campaign ON campaign_weather(campaign_id);
CREATE INDEX IF NOT EXISTS idx_pitch_campaign ON campaign_pitch(campaign_id);