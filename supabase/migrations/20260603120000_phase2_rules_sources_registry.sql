-- ============================================================================
-- Phase 2: Source-aware Rules Library foundation
-- ----------------------------------------------------------------------------
-- Non-breaking. Adds:
--   1. rules_sources       — canonical registry of legal/open rules sources
--   2. import_batches       — per-run import/sync log (status, counts, errors)
--   3. source metadata cols on the content srd_* tables (defaulted to SRD 5.1)
--   4. license_type on rules_cache (the durable, multi-source library store)
--
-- The character builder keeps reading srd_* exactly as before; the new columns
-- are nullable/defaulted so existing reads and SRDClient queries are unaffected.
-- Multi-source coexistence lives in rules_cache (UNIQUE per source+type+key),
-- NOT in srd_*, which remains the single-source canonical "SRD 5.1" default.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 1. rules_sources — registry of every source/ruleset we are legally allowed
--    to ingest. Acts as the allowlist: a source not listed (or disabled) here
--    must never be imported. Proprietary, non-SRD content is intentionally
--    absent.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rules_sources (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key          TEXT NOT NULL UNIQUE,                 -- stable id, e.g. 'srd-5.1'
  name         TEXT NOT NULL,                        -- display name
  ruleset      TEXT NOT NULL,                        -- '2014' | '2024' | 'a5e' | 'homebrew' | 'mixed'
  version      TEXT,                                 -- '5.1', '5.2.1', 'v2', ...
  license      TEXT NOT NULL,                        -- 'CC-BY-4.0', 'OGL-1.0a', 'user-owned', ...
  license_url  TEXT,
  attribution  TEXT NOT NULL,                        -- human-readable credit line
  upstream_url TEXT,                                 -- canonical source URL
  provider     TEXT NOT NULL,                        -- which provider class ingests it
  is_enabled   BOOLEAN NOT NULL DEFAULT true,        -- global legal kill-switch
  is_official  BOOLEAN NOT NULL DEFAULT false,       -- true = WotC SRD
  sort_order   INTEGER NOT NULL DEFAULT 100,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.rules_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read rules sources"
  ON public.rules_sources FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage rules sources"
  ON public.rules_sources FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

CREATE TRIGGER update_rules_sources_updated_at
  BEFORE UPDATE ON public.rules_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed the canonical open/legal sources only. No proprietary content.
INSERT INTO public.rules_sources
  (key, name, ruleset, version, license, license_url, attribution, upstream_url, provider, is_enabled, is_official, sort_order)
VALUES
  ('srd-5.1', 'D&D SRD 5.1', '2014', '5.1', 'CC-BY-4.0',
   'https://creativecommons.org/licenses/by/4.0/',
   'System Reference Document 5.1 © Wizards of the Coast LLC, licensed under CC BY 4.0',
   'https://dnd.wizards.com/resources/systems-reference-document', 'srd51', true, true, 10),

  ('srd-5.2.1', 'D&D SRD 5.2.1', '2024', '5.2.1', 'CC-BY-4.0',
   'https://creativecommons.org/licenses/by/4.0/',
   'System Reference Document 5.2.1 © Wizards of the Coast LLC, licensed under CC BY 4.0',
   'https://dnd.wizards.com/resources/systems-reference-document', 'srd521', true, true, 20),

  ('open5e', 'Open5e', 'mixed', 'v2', 'OGL-1.0a / CC-BY-4.0', NULL,
   'Open5e — community-maintained open 5e content, used per upstream OGL/CC-BY licenses',
   'https://open5e.com/', 'open5e', true, false, 30),

  ('dnd5eapi-2014', 'D&D 5e API (5e-bits)', '2014', '5.1', 'OGL-1.0a', NULL,
   '5e-bits D&D 5e API — SRD 5.1 content under the Open Game License 1.0a',
   'https://www.dnd5eapi.co/', 'dnd5eapi', true, false, 40),

  ('a5e', 'Level Up: Advanced 5e (A5E) SRD', 'a5e', 'a5e-srd', 'OGL-1.0a', NULL,
   'Level Up: Advanced 5th Edition SRD © EN Publishing, under the Open Game License 1.0a',
   'https://a5esrd.com/', 'a5e', false, false, 50),

  ('homebrew', 'Homebrew', 'homebrew', NULL, 'user-owned', NULL,
   'User-created content — owned by its author', NULL, 'homebrew', true, false, 60)
ON CONFLICT (key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────
-- 2. import_batches — one row per import/sync run, for admin sync status.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.import_batches (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_key   TEXT NOT NULL,                        -- references rules_sources.key (soft ref)
  provider     TEXT NOT NULL,
  content_type TEXT,                                 -- NULL = multi-type run
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'succeeded', 'partial', 'failed')),
  imported     INTEGER NOT NULL DEFAULT 0,
  skipped      INTEGER NOT NULL DEFAULT 0,
  error_count  INTEGER NOT NULL DEFAULT 0,
  errors       JSONB NOT NULL DEFAULT '[]'::jsonb,
  params       JSONB,
  triggered_by UUID,                                 -- auth.users id (soft ref)
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_source ON public.import_batches (source_key, content_type);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches (status);
CREATE INDEX IF NOT EXISTS idx_import_batches_started ON public.import_batches (started_at DESC);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read import batches"
  ON public.import_batches FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can manage import batches"
  ON public.import_batches FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Source metadata on the content srd_* tables.
--
--    POLICY (Phase 2): srd_* are canonical SRD 5.1-compatible BUILDER tables.
--    Only SRD 5.1 source documents may populate them. Broader Open5e/A5E/
--    third-party content belongs in the source-aware rules_cache / rules_entities
--    layer (Phase 4+), never mixed into srd_*.
--
--    Two groups:
--    (a) CANONICAL tables — historically imported with an SRD-only filter
--        (srd-2014 / wotc-srd) or seeded from SRD data. Safe to backfill the
--        DEFAULT 'srd-5.1' onto existing rows.
--    (b) REVIEW tables — srd_backgrounds and srd_feats. The PREVIOUS importer
--        fetched these from ALL Open5e documents (first-source-wins), so existing
--        rows MAY include non-SRD content. We deliberately do NOT default these
--        to 'srd-5.1' (that would launder non-SRD content as SRD). Columns are
--        added NULLABLE with NO default, so existing rows stay NULL = "unverified"
--        and remain reviewable. The fixed edge function writes 'srd-5.1' EXPLICITLY
--        only for rows it has confirmed are SRD 5.1 going forward. Nothing is
--        deleted or relabeled automatically — see supabase/diagnostics/phase2_source_audit.sql.
--
--    These columns are additive: SRDClient and the wizard never select them,
--    so existing behavior is unchanged.
-- ─────────────────────────────────────────────────────────────────────────

-- (a) Canonical SRD-only tables: backfill defaults onto existing rows.
DO $$
DECLARE
  t TEXT;
  canonical_tables TEXT[] := ARRAY[
    'srd_spells', 'srd_classes', 'srd_subclasses', 'srd_class_features',
    'srd_subclass_features', 'srd_ancestries', 'srd_subancestries',
    'srd_armor', 'srd_weapons', 'srd_equipment', 'srd_tools',
    'srd_languages', 'srd_conditions', 'srd_magic_items',
    'srd_planes', 'srd_sections'
  ];
BEGIN
  FOREACH t IN ARRAY canonical_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_key   TEXT NOT NULL DEFAULT ''srd-5.1'';', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ruleset      TEXT NOT NULL DEFAULT ''2014'';',    t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS license      TEXT NOT NULL DEFAULT ''CC-BY-4.0'';', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS upstream_url TEXT;', t);
    END IF;
  END LOOP;
END $$;

-- (b) Review tables: NULLABLE, NO default. Existing rows stay NULL for review.
DO $$
DECLARE
  t TEXT;
  review_tables TEXT[] := ARRAY['srd_backgrounds', 'srd_feats'];
BEGIN
  FOREACH t IN ARRAY review_tables
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = t
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS source_key   TEXT;', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS ruleset      TEXT;', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS license      TEXT;', t);
      EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS upstream_url TEXT;', t);
    END IF;
  END LOOP;
END $$;

-- ─────────────────────────────────────────────────────────────────────────
-- 4. license_type on rules_cache — the normalizer already computes a license
--    string; persist it so the durable library carries full attribution.
-- ─────────────────────────────────────────────────────────────────────────
ALTER TABLE public.rules_cache ADD COLUMN IF NOT EXISTS license_type TEXT;
