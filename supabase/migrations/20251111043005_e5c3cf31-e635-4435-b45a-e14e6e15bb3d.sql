-- Add hit dice healing history table
CREATE TABLE IF NOT EXISTS hit_dice_rolls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  rest_type text NOT NULL CHECK (rest_type IN ('short', 'long')),
  dice_rolled integer NOT NULL,
  roll_result integer NOT NULL,
  con_modifier integer NOT NULL,
  total_healing integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE hit_dice_rolls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own hit dice rolls"
  ON hit_dice_rolls FOR SELECT
  USING (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert their own hit dice rolls"
  ON hit_dice_rolls FOR INSERT
  WITH CHECK (character_id IN (
    SELECT id FROM characters WHERE user_id = auth.uid()
  ));

CREATE POLICY "DMs can view campaign hit dice rolls"
  ON hit_dice_rolls FOR SELECT
  USING (character_id IN (
    SELECT c.id FROM characters c
    JOIN campaigns camp ON c.campaign_id = camp.id
    WHERE camp.dm_user_id = auth.uid()
  ));

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_hit_dice_rolls_character ON hit_dice_rolls(character_id);
CREATE INDEX IF NOT EXISTS idx_hit_dice_rolls_created ON hit_dice_rolls(created_at DESC);