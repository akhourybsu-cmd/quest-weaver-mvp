-- Add 'api' to monster_source_type enum (must be committed before use)
ALTER TYPE public.monster_source_type ADD VALUE IF NOT EXISTS 'api';

-- Add source metadata columns to encounter_monsters for API-imported monsters
ALTER TABLE public.encounter_monsters
  ADD COLUMN IF NOT EXISTS source_api text,
  ADD COLUMN IF NOT EXISTS source_key text,
  ADD COLUMN IF NOT EXISTS source_slug text,
  ADD COLUMN IF NOT EXISTS source_document text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS imported_from_rules_api boolean NOT NULL DEFAULT false;

-- Allow source_monster_id to be NULL for API imports (no row in catalog/homebrew)
ALTER TABLE public.encounter_monsters
  ALTER COLUMN source_monster_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_encounter_monsters_source_key
  ON public.encounter_monsters (source_key)
  WHERE source_key IS NOT NULL;