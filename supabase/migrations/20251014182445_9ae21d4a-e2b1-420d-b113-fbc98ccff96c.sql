-- Remove the foreign key constraint from initiative.character_id
ALTER TABLE public.initiative DROP CONSTRAINT IF EXISTS initiative_character_id_fkey;

-- Rename character_id to combatant_id for clarity
ALTER TABLE public.initiative RENAME COLUMN character_id TO combatant_id;

-- Update the index
DROP INDEX IF EXISTS idx_initiative_combatant;
CREATE INDEX idx_initiative_combatant ON public.initiative(encounter_id, combatant_type, combatant_id);