-- Add exhaustion_level to characters (0-6, default 0)
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS exhaustion_level integer NOT NULL DEFAULT 0 CHECK (exhaustion_level >= 0 AND exhaustion_level <= 6);

-- Add legendary actions and resistances to encounter_monsters
ALTER TABLE public.encounter_monsters 
ADD COLUMN IF NOT EXISTS legendary_actions_max integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legendary_actions_remaining integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legendary_resistances_max integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS legendary_resistances_remaining integer DEFAULT 0;