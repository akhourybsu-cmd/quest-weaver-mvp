-- Add opportunity attack tracking
CREATE TABLE IF NOT EXISTS opportunity_attacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id uuid NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  attacker_id uuid NOT NULL,
  attacker_type text NOT NULL CHECK (attacker_type IN ('character', 'monster')),
  target_id uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('character', 'monster')),
  triggered_at timestamptz DEFAULT now(),
  resolved boolean DEFAULT false,
  attack_result jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE opportunity_attacks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Campaign members can view opportunity attacks"
  ON opportunity_attacks FOR SELECT
  USING (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid() OR c.id IN (
      SELECT campaign_id FROM characters WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "DMs can manage opportunity attacks"
  ON opportunity_attacks FOR ALL
  USING (encounter_id IN (
    SELECT e.id FROM encounters e
    JOIN campaigns c ON e.campaign_id = c.id
    WHERE c.dm_user_id = auth.uid()
  ));

-- Add index
CREATE INDEX IF NOT EXISTS idx_opportunity_attacks_encounter ON opportunity_attacks(encounter_id);
CREATE INDEX IF NOT EXISTS idx_opportunity_attacks_resolved ON opportunity_attacks(resolved) WHERE resolved = false;

-- Add cover type to combat_modifiers
ALTER TABLE combat_modifiers ADD COLUMN IF NOT EXISTS cover_type text CHECK (cover_type IN ('half', 'three_quarters', 'full'));