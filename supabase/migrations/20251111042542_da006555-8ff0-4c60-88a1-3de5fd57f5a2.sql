-- Add turn state tracking for action economy
ALTER TABLE initiative ADD COLUMN IF NOT EXISTS has_leveled_spell_this_turn boolean DEFAULT false;
ALTER TABLE initiative ADD COLUMN IF NOT EXISTS leveled_spell_was_bonus_action boolean DEFAULT false;

-- Add component tracking to character items
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_focus boolean DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_component_pouch boolean DEFAULT false;

-- Create function to reset turn state
CREATE OR REPLACE FUNCTION reset_turn_state()
RETURNS trigger AS $$
BEGIN
  -- Reset turn-based flags when turn advances
  UPDATE initiative 
  SET 
    has_leveled_spell_this_turn = false,
    leveled_spell_was_bonus_action = false
  WHERE encounter_id = NEW.encounter_id 
    AND id != NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to reset turn state when current turn changes
DROP TRIGGER IF EXISTS reset_turn_state_trigger ON initiative;
CREATE TRIGGER reset_turn_state_trigger
  AFTER UPDATE OF is_current_turn ON initiative
  FOR EACH ROW
  WHEN (NEW.is_current_turn = true AND OLD.is_current_turn = false)
  EXECUTE FUNCTION reset_turn_state();