-- ============================================================================
-- Phase 5c — allow library (rules_cache) spells on characters. Additive + idempotent.
--
-- Existing SRD spells (spell_id → srd_spells, NOT NULL) are UNAFFECTED. Library
-- spells are stored with spell_id = NULL and carry their data in library_json,
-- shaped like an srd_spells row so read paths can fall back to it. Readers that
-- use `srd_spells!inner` (SpellPreparationManager, RitualCastDialog) naturally
-- exclude null-spell_id rows — unchanged behavior for SRD prep/ritual flows.
-- ============================================================================

-- Relax the FK column so library rows can omit a srd_spells reference.
-- (The FK still applies to non-null values; NULL is permitted.)
ALTER TABLE public.character_spells ALTER COLUMN spell_id DROP NOT NULL;

ALTER TABLE public.character_spells ADD COLUMN IF NOT EXISTS library_json jsonb;
ALTER TABLE public.character_spells ADD COLUMN IF NOT EXISTS source_key  text;
ALTER TABLE public.character_spells ADD COLUMN IF NOT EXISTS source_api  text;

-- Every row must be either an SRD spell (spell_id) or a library spell (library_json).
-- NOT VALID: enforced for new/updated rows without scanning existing data.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'character_spells_source_chk') THEN
    ALTER TABLE public.character_spells
      ADD CONSTRAINT character_spells_source_chk
      CHECK (spell_id IS NOT NULL OR library_json IS NOT NULL) NOT VALID;
  END IF;
END $$;
