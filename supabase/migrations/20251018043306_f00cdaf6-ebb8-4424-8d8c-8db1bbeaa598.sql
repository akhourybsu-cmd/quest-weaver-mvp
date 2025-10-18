-- Add player visibility column to combat_log
ALTER TABLE combat_log 
ADD COLUMN IF NOT EXISTS is_visible_to_players BOOLEAN DEFAULT true;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_combat_log_player_visible 
ON combat_log(encounter_id, is_visible_to_players);