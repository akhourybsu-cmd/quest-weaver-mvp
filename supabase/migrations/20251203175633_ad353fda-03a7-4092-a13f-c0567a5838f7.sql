-- Add Warlock pact slots tracking (separate from regular spell slots)
ALTER TABLE public.characters 
ADD COLUMN IF NOT EXISTS pact_slots_max integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pact_slots_used integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS pact_slot_level integer DEFAULT 1;

-- Add Mystic Arcanum tracking (Warlock 6th-9th level spells, 1/day each)
ALTER TABLE public.characters
ADD COLUMN IF NOT EXISTS mystic_arcanum_6_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mystic_arcanum_7_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mystic_arcanum_8_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mystic_arcanum_9_used boolean DEFAULT false;

-- Add mystic arcanum spell selections
CREATE TABLE IF NOT EXISTS public.character_mystic_arcanum (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_level integer NOT NULL CHECK (spell_level >= 6 AND spell_level <= 9),
  spell_id uuid REFERENCES public.srd_spells(id),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(character_id, spell_level)
);

-- Enable RLS
ALTER TABLE public.character_mystic_arcanum ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their mystic arcanum"
ON public.character_mystic_arcanum FOR ALL
USING (character_id IN (SELECT id FROM characters WHERE user_id = auth.uid()));

CREATE POLICY "DMs can view campaign mystic arcanum"
ON public.character_mystic_arcanum FOR SELECT
USING (character_id IN (
  SELECT c.id FROM characters c
  JOIN campaigns camp ON c.campaign_id = camp.id
  WHERE camp.dm_user_id = auth.uid()
));