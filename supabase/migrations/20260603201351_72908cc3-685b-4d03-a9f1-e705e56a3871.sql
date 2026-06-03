-- Phase 2: Source-aware Rules Library foundation (idempotent)

CREATE TABLE IF NOT EXISTS public.rules_sources (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key          TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  ruleset      TEXT NOT NULL,
  version      TEXT,
  license      TEXT NOT NULL,
  license_url  TEXT,
  attribution  TEXT NOT NULL,
  upstream_url TEXT,
  provider     TEXT NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT true,
  is_official  BOOLEAN NOT NULL DEFAULT false,
  sort_order   INTEGER NOT NULL DEFAULT 100,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.rules_sources TO authenticated;
GRANT ALL ON public.rules_sources TO service_role;

ALTER TABLE public.rules_sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read rules sources" ON public.rules_sources;
CREATE POLICY "Authenticated users can read rules sources"
  ON public.rules_sources FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage rules sources" ON public.rules_sources;
CREATE POLICY "Admins can manage rules sources"
  ON public.rules_sources FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

DROP TRIGGER IF EXISTS update_rules_sources_updated_at ON public.rules_sources;
CREATE TRIGGER update_rules_sources_updated_at
  BEFORE UPDATE ON public.rules_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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

CREATE TABLE IF NOT EXISTS public.import_batches (
  id           UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_key   TEXT NOT NULL,
  provider     TEXT NOT NULL,
  content_type TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'running', 'succeeded', 'partial', 'failed')),
  imported     INTEGER NOT NULL DEFAULT 0,
  skipped      INTEGER NOT NULL DEFAULT 0,
  error_count  INTEGER NOT NULL DEFAULT 0,
  errors       JSONB NOT NULL DEFAULT '[]'::jsonb,
  params       JSONB,
  triggered_by UUID,
  started_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.import_batches TO authenticated;
GRANT ALL ON public.import_batches TO service_role;

CREATE INDEX IF NOT EXISTS idx_import_batches_source ON public.import_batches (source_key, content_type);
CREATE INDEX IF NOT EXISTS idx_import_batches_status ON public.import_batches (status);
CREATE INDEX IF NOT EXISTS idx_import_batches_started ON public.import_batches (started_at DESC);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read import batches" ON public.import_batches;
CREATE POLICY "Admins can read import batches"
  ON public.import_batches FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

DROP POLICY IF EXISTS "Admins can manage import batches" ON public.import_batches;
CREATE POLICY "Admins can manage import batches"
  ON public.import_batches FOR ALL
  TO authenticated
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

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

-- (b) Review tables: NULLABLE, NO default.
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

ALTER TABLE public.rules_cache ADD COLUMN IF NOT EXISTS license_type TEXT;