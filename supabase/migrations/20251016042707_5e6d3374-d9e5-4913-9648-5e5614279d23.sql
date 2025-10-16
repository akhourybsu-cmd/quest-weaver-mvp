-- Add visibility flag to encounter_monsters for player view filtering
ALTER TABLE encounter_monsters ADD COLUMN is_visible_to_players BOOLEAN DEFAULT true;

-- Create player_turn_signals table for turn end notifications
CREATE TABLE player_turn_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE NOT NULL,
  signal_type TEXT CHECK (signal_type IN ('end_turn', 'need_ruling', 'ready_action')) NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  acknowledged_by_dm BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE player_turn_signals ENABLE ROW LEVEL SECURITY;

-- RLS: Campaign members can view turn signals
CREATE POLICY "Campaign members can view turn signals"
  ON player_turn_signals FOR SELECT
  USING (
    encounter_id IN (
      SELECT e.id FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE c.dm_user_id = auth.uid()
        OR c.id IN (SELECT campaign_id FROM characters WHERE user_id = auth.uid())
    )
  );

-- RLS: Players can insert their own turn signals
CREATE POLICY "Players can insert their own turn signals"
  ON player_turn_signals FOR INSERT
  WITH CHECK (
    character_id IN (SELECT id FROM characters WHERE user_id = auth.uid())
  );

-- RLS: DMs can update/delete turn signals
CREATE POLICY "DMs can manage turn signals"
  ON player_turn_signals FOR ALL
  USING (
    encounter_id IN (
      SELECT e.id FROM encounters e
      JOIN campaigns c ON c.id = e.campaign_id
      WHERE c.dm_user_id = auth.uid()
    )
  );