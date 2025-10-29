-- Add a wizard_state column to store incomplete character creation progress
ALTER TABLE characters 
ADD COLUMN IF NOT EXISTS wizard_state JSONB DEFAULT NULL;

COMMENT ON COLUMN characters.wizard_state IS 'Stores the complete wizard state for draft characters so progress is not lost';
