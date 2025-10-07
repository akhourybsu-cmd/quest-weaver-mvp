-- Sprint B: Conditions Engine Data Model

-- Create condition enum type
CREATE TYPE public.condition_type AS ENUM (
  'blinded',
  'charmed',
  'deafened',
  'frightened',
  'grappled',
  'incapacitated',
  'invisible',
  'paralyzed',
  'petrified',
  'poisoned',
  'prone',
  'restrained',
  'stunned',
  'unconscious',
  'exhaustion_1',
  'exhaustion_2',
  'exhaustion_3',
  'exhaustion_4',
  'exhaustion_5',
  'exhaustion_6'
);

-- Convert character_conditions.condition from text to enum
ALTER TABLE public.character_conditions 
  ADD COLUMN condition_temp condition_type;

-- Migrate existing data
UPDATE public.character_conditions 
SET condition_temp = condition::condition_type;

-- Drop old column
ALTER TABLE public.character_conditions 
  DROP COLUMN condition;

-- Rename new column
ALTER TABLE public.character_conditions 
  RENAME COLUMN condition_temp TO condition;

-- Make condition NOT NULL
ALTER TABLE public.character_conditions 
  ALTER COLUMN condition SET NOT NULL;

-- Add index for faster condition lookups
CREATE INDEX idx_character_conditions_encounter_character 
  ON public.character_conditions(encounter_id, character_id);

-- Add index for auto-expiration queries
CREATE INDEX idx_character_conditions_ends_at 
  ON public.character_conditions(encounter_id, ends_at_round) 
  WHERE ends_at_round IS NOT NULL;