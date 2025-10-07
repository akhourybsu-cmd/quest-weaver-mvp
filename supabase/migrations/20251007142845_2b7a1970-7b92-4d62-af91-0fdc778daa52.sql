-- Sprint 1: Combat & Effects Polish Database Schema

-- Enum for damage types (SRD-compliant)
CREATE TYPE damage_type AS ENUM (
  'acid', 'bludgeoning', 'cold', 'fire', 'force', 
  'lightning', 'necrotic', 'piercing', 'poison', 
  'psychic', 'radiant', 'slashing', 'thunder'
);

-- Enum for effect tick timing
CREATE TYPE effect_tick_timing AS ENUM ('start', 'end', 'round');

-- Enum for ability scores (for saves)
CREATE TYPE ability_score AS ENUM ('STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA');

-- Campaigns table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  dm_user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Characters table
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  max_hp INTEGER NOT NULL,
  current_hp INTEGER NOT NULL,
  temp_hp INTEGER DEFAULT 0,
  ac INTEGER NOT NULL,
  speed INTEGER DEFAULT 30,
  proficiency_bonus INTEGER NOT NULL,
  passive_perception INTEGER DEFAULT 10,
  
  -- Ability scores for saves
  str_save INTEGER DEFAULT 0,
  dex_save INTEGER DEFAULT 0,
  con_save INTEGER DEFAULT 0,
  int_save INTEGER DEFAULT 0,
  wis_save INTEGER DEFAULT 0,
  cha_save INTEGER DEFAULT 0,
  
  -- Resistances/Vulnerabilities/Immunities (stored as arrays)
  resistances damage_type[] DEFAULT '{}',
  vulnerabilities damage_type[] DEFAULT '{}',
  immunities damage_type[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Encounters table (for combat sessions)
CREATE TABLE encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  current_round INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Initiative tracking
CREATE TABLE initiative (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  initiative_roll INTEGER NOT NULL,
  is_current_turn BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Effects table (concentration, conditions, buffs/debuffs)
CREATE TABLE effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  source TEXT, -- who/what caused this effect
  requires_concentration BOOLEAN DEFAULT false,
  concentrating_character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  start_round INTEGER NOT NULL,
  end_round INTEGER, -- null = indefinite
  ticks_at effect_tick_timing DEFAULT 'end',
  damage_per_tick INTEGER,
  damage_type_per_tick damage_type,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Combat log for damage, saves, effects
CREATE TABLE combat_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'damage', 'save', 'effect_applied', 'effect_expired', etc.
  message TEXT NOT NULL,
  details JSONB, -- structured data for damage type, amount, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Save prompts (DM initiates saves)
CREATE TABLE save_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
  ability ability_score NOT NULL,
  dc INTEGER NOT NULL,
  description TEXT NOT NULL,
  target_character_ids UUID[], -- null = all
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Save results
CREATE TABLE save_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  save_prompt_id UUID REFERENCES save_prompts(id) ON DELETE CASCADE,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  roll INTEGER NOT NULL,
  modifier INTEGER NOT NULL,
  total INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiative ENABLE ROW LEVEL SECURITY;
ALTER TABLE effects ENABLE ROW LEVEL SECURITY;
ALTER TABLE combat_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE save_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Campaign members can read
CREATE POLICY "Campaign members can view campaigns"
  ON campaigns FOR SELECT
  USING (dm_user_id = auth.uid() OR id IN (
    SELECT campaign_id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can insert campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (dm_user_id = auth.uid());

CREATE POLICY "DMs can update their campaigns"
  ON campaigns FOR UPDATE
  USING (dm_user_id = auth.uid());

-- Characters - visible to campaign members
CREATE POLICY "Campaign members can view characters"
  ON characters FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ) OR user_id = auth.uid());

CREATE POLICY "Players can insert their own characters"
  ON characters FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Players can update their own characters"
  ON characters FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "DMs can update campaign characters"
  ON characters FOR UPDATE
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ));

-- Encounters - campaign members can view
CREATE POLICY "Campaign members can view encounters"
  ON encounters FOR SELECT
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage encounters"
  ON encounters FOR ALL
  USING (campaign_id IN (
    SELECT id FROM campaigns WHERE dm_user_id = auth.uid()
  ));

-- Initiative - campaign members can view
CREATE POLICY "Campaign members can view initiative"
  ON initiative FOR SELECT
  USING (encounter_id IN (
    SELECT id FROM encounters WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage initiative"
  ON initiative FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  ));

-- Effects - campaign members can view
CREATE POLICY "Campaign members can view effects"
  ON effects FOR SELECT
  USING (encounter_id IN (
    SELECT id FROM encounters WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage effects"
  ON effects FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  ));

-- Combat log - campaign members can view
CREATE POLICY "Campaign members can view combat log"
  ON combat_log FOR SELECT
  USING (encounter_id IN (
    SELECT id FROM encounters WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can insert combat log"
  ON combat_log FOR INSERT
  WITH CHECK (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  ));

-- Save prompts - campaign members can view
CREATE POLICY "Campaign members can view save prompts"
  ON save_prompts FOR SELECT
  USING (encounter_id IN (
    SELECT id FROM encounters WHERE campaign_id IN (
      SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
        SELECT campaign_id FROM characters WHERE user_id = auth.uid()
      )
    )
  ));

CREATE POLICY "DMs can manage save prompts"
  ON save_prompts FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  ));

-- Save results - users can insert their own, all can view
CREATE POLICY "Campaign members can view save results"
  ON save_results FOR SELECT
  USING (save_prompt_id IN (
    SELECT id FROM save_prompts WHERE encounter_id IN (
      SELECT id FROM encounters WHERE campaign_id IN (
        SELECT id FROM campaigns WHERE dm_user_id = auth.uid() OR id IN (
          SELECT campaign_id FROM characters WHERE user_id = auth.uid()
        )
      )
    )
  ));

CREATE POLICY "Players can insert their save results"
  ON save_results FOR INSERT
  WITH CHECK (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE characters;
ALTER PUBLICATION supabase_realtime ADD TABLE encounters;
ALTER PUBLICATION supabase_realtime ADD TABLE initiative;
ALTER PUBLICATION supabase_realtime ADD TABLE effects;
ALTER PUBLICATION supabase_realtime ADD TABLE combat_log;
ALTER PUBLICATION supabase_realtime ADD TABLE save_prompts;
ALTER PUBLICATION supabase_realtime ADD TABLE save_results;

-- Indexes for performance
CREATE INDEX idx_characters_campaign ON characters(campaign_id);
CREATE INDEX idx_characters_user ON characters(user_id);
CREATE INDEX idx_encounters_campaign ON encounters(campaign_id);
CREATE INDEX idx_initiative_encounter ON initiative(encounter_id);
CREATE INDEX idx_effects_encounter ON effects(encounter_id);
CREATE INDEX idx_effects_character ON effects(character_id);
CREATE INDEX idx_combat_log_encounter ON combat_log(encounter_id);
CREATE INDEX idx_save_prompts_encounter ON save_prompts(encounter_id);