-- Phase 2: Data Normalization
-- Changes:
--   1. srd_backgrounds.feature  TEXT → JSONB
--   2. characters               add gold INTEGER column
--   3. character_spell_slots    add is_pact_magic BOOLEAN, update UNIQUE constraint
--   4. character_features       deduplicate then add UNIQUE constraint

BEGIN;

-- ─── 1. srd_backgrounds.feature: TEXT → JSONB ────────────────────────────────
-- Existing plain-text values (feature names from the external API) are wrapped
-- as { "name": "<text>", "description": "" } so the application code can read
-- them as objects.  Values that are already valid JSON objects (start with '{')
-- are cast directly.
ALTER TABLE public.srd_backgrounds
  ALTER COLUMN feature TYPE JSONB
  USING CASE
    WHEN feature IS NULL  THEN NULL
    WHEN feature ~ '^\{' THEN feature::jsonb
    ELSE jsonb_build_object('name', feature, 'description', '')
  END;

-- ─── 2. characters: add gold column ─────────────────────────────────────────
-- Stub for the future currency system.  Default 0 so all existing characters
-- start with no gold recorded (matches the previous behaviour of no tracking).
ALTER TABLE public.characters
  ADD COLUMN IF NOT EXISTS gold INTEGER NOT NULL DEFAULT 0;

-- ─── 3. character_spell_slots: is_pact_magic + updated UNIQUE ────────────────
-- Warlocks store their pact-magic slots alongside shared multiclass slots.
-- Without a distinguishing flag a level-2 pact slot collides with a level-2
-- shared slot for a Warlock/Wizard multiclass.

ALTER TABLE public.character_spell_slots
  ADD COLUMN IF NOT EXISTS is_pact_magic BOOLEAN NOT NULL DEFAULT false;

-- The original UNIQUE(character_id, spell_level) does not account for the new
-- column.  Drop it and replace with a constraint that includes is_pact_magic so
-- a character can have both a shared level-2 slot and a pact level-2 slot.
ALTER TABLE public.character_spell_slots
  DROP CONSTRAINT IF EXISTS character_spell_slots_character_id_spell_level_key;

DO $$BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'character_spell_slots_char_level_pact_key'
      AND conrelid = 'public.character_spell_slots'::regclass
  ) THEN
    ALTER TABLE public.character_spell_slots
      ADD CONSTRAINT character_spell_slots_char_level_pact_key
      UNIQUE(character_id, spell_level, is_pact_magic);
  END IF;
END $$;

-- ─── 4. character_features: deduplicate then add UNIQUE constraint ────────────
-- character_features has no unique constraint, so retrying finalize duplicates
-- rows.  Phase 1 switched to delete-then-insert to avoid new duplicates; this
-- migration adds a constraint to prevent them at the DB level too.

-- Remove duplicates introduced before Phase 1: for any group sharing
-- (character_id, source, name, level), keep the row with the smallest ctid
-- (the physically earliest stored row) and delete the rest.
DELETE FROM public.character_features cf1
USING public.character_features cf2
WHERE cf1.character_id = cf2.character_id
  AND cf1.source       = cf2.source
  AND cf1.name         = cf2.name
  AND cf1.level        = cf2.level
  AND cf1.ctid         > cf2.ctid;

DO $$BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'character_features_unique_char_source_name_level'
      AND conrelid = 'public.character_features'::regclass
  ) THEN
    ALTER TABLE public.character_features
      ADD CONSTRAINT character_features_unique_char_source_name_level
      UNIQUE(character_id, source, name, level);
  END IF;
END $$;

COMMIT;
