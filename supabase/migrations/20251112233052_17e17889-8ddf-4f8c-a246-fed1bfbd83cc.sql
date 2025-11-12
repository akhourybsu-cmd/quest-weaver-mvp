-- Add location_id and quest_giver_id to quests table
-- Rename existing quest_giver to legacy_quest_giver for data preservation

-- Rename existing quest_giver column to legacy_quest_giver
ALTER TABLE quests RENAME COLUMN quest_giver TO legacy_quest_giver;

-- Add new foreign key columns
ALTER TABLE quests ADD COLUMN quest_giver_id UUID REFERENCES npcs(id) ON DELETE SET NULL;
ALTER TABLE quests ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX idx_quests_quest_giver_id ON quests(quest_giver_id);
CREATE INDEX idx_quests_location_id ON quests(location_id);

-- Optionally add location_id to quest_steps for individual objective locations
ALTER TABLE quest_steps ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;
CREATE INDEX idx_quest_steps_location_id ON quest_steps(location_id);