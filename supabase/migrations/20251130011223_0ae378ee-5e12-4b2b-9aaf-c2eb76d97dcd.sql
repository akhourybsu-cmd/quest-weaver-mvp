-- Phase 1: Add player visibility fields

-- Add player_visible to quests table
ALTER TABLE quests ADD COLUMN IF NOT EXISTS player_visible BOOLEAN DEFAULT false;

-- Add player_visible to npcs table
ALTER TABLE npcs ADD COLUMN IF NOT EXISTS player_visible BOOLEAN DEFAULT false;

-- Add discovered field to locations table
ALTER TABLE locations ADD COLUMN IF NOT EXISTS discovered BOOLEAN DEFAULT false;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_quests_player_visible ON quests(campaign_id, player_visible);
CREATE INDEX IF NOT EXISTS idx_npcs_player_visible ON npcs(campaign_id, player_visible);
CREATE INDEX IF NOT EXISTS idx_locations_discovered ON locations(campaign_id, discovered);