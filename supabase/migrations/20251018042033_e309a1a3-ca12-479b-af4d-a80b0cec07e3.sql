-- Add HP visibility control for monsters
ALTER TABLE encounter_monsters 
ADD COLUMN IF NOT EXISTS is_hp_visible_to_players BOOLEAN DEFAULT false;

-- Enable realtime for encounter_monsters
ALTER PUBLICATION supabase_realtime ADD TABLE encounter_monsters;