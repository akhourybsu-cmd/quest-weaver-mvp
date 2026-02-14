
-- Add new columns to monster_homebrew for Phase 1 Bestiary system
ALTER TABLE public.monster_homebrew 
  ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS derived_from_monster_id uuid,
  ADD COLUMN IF NOT EXISTS derived_from_source text,
  ADD COLUMN IF NOT EXISTS bonus_actions jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS condition_immunities jsonb DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS spellcasting jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS subtype text,
  ADD COLUMN IF NOT EXISTS armor_description text;

-- Add check constraint for derived_from_source
ALTER TABLE public.monster_homebrew
  ADD CONSTRAINT chk_derived_from_source 
  CHECK (derived_from_source IS NULL OR derived_from_source IN ('catalog', 'homebrew'));
