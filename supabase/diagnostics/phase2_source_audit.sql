-- ============================================================================
-- Phase 2 — Source Audit (READ-ONLY)
-- ----------------------------------------------------------------------------
-- Purpose: review what is currently in the builder-facing srd_* tables BEFORE
-- and AFTER applying migration 20260603120000_phase2_rules_sources_registry.sql.
--
-- This script ONLY runs SELECT statements. It never INSERTs, UPDATEs, DELETEs,
-- or ALTERs anything. Run it in the Supabase SQL editor and review the output.
--
-- Background: the previous import-srd-core fetched backgrounds and feats from
-- ALL Open5e documents (first-source-wins), so srd_backgrounds / srd_feats MAY
-- contain non-SRD rows. SRD 5.1 itself contains exactly ONE background (Acolyte)
-- and ONE feat (Grappler); everything else originates elsewhere (PHB/Open5e/etc.)
-- and should be reviewed before being treated as SRD.
-- ============================================================================


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ SECTION A — PRE-MIGRATION (run BEFORE applying the migration)             ║
-- ║ No source_key column exists yet, so we detect provenance by name + by the ║
-- ║ existing `document` column where present.                                 ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- A1. Backgrounds that are NOT SRD 5.1 (SRD 5.1 = "Acolyte" only) → review.
SELECT 'srd_backgrounds' AS table_name,
       name,
       'NOT SRD 5.1 (SRD 5.1 contains only Acolyte) — review provenance' AS note
FROM public.srd_backgrounds
WHERE lower(name) <> 'acolyte'
ORDER BY name;

-- A2. Feats that are NOT SRD 5.1 (SRD 5.1 = "Grappler" only) → review.
SELECT 'srd_feats' AS table_name,
       name,
       'NOT SRD 5.1 (SRD 5.1 contains only Grappler) — review provenance' AS note
FROM public.srd_feats
WHERE lower(name) <> 'grappler'
ORDER BY name;

-- A3. Summary counts for the two review tables.
SELECT 'srd_backgrounds' AS table_name,
       count(*)                                              AS total_rows,
       count(*) FILTER (WHERE lower(name) =  'acolyte')      AS srd51_named,
       count(*) FILTER (WHERE lower(name) <> 'acolyte')      AS review_named
FROM public.srd_backgrounds
UNION ALL
SELECT 'srd_feats',
       count(*),
       count(*) FILTER (WHERE lower(name) =  'grappler'),
       count(*) FILTER (WHERE lower(name) <> 'grappler')
FROM public.srd_feats;

-- A4. Tables that ALREADY have a `document` column: counts grouped by document.
-- (These were imported with SRD-only filters, but verify anyway.)
SELECT 'srd_conditions'  AS table_name, document, count(*) AS rows FROM public.srd_conditions  GROUP BY document
UNION ALL
SELECT 'srd_magic_items' AS table_name, document, count(*) AS rows FROM public.srd_magic_items GROUP BY document
ORDER BY table_name, rows DESC;


-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ SECTION B — POST-MIGRATION (run AFTER applying the migration)             ║
-- ║ The source_key column now exists on every content srd_* table. Review     ║
-- ║ tables (srd_backgrounds, srd_feats) were left NULL = "unverified".         ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- B1. Row counts by table and source_key across all content srd_* tables.
-- NULL source_key = needs manual review (only expected in backgrounds/feats).
SELECT tbl, coalesce(source_key, '(NULL — unverified)') AS source_key, count(*) AS rows
FROM (
  SELECT 'srd_spells'            AS tbl, source_key FROM public.srd_spells
  UNION ALL SELECT 'srd_classes',          source_key FROM public.srd_classes
  UNION ALL SELECT 'srd_subclasses',       source_key FROM public.srd_subclasses
  UNION ALL SELECT 'srd_class_features',   source_key FROM public.srd_class_features
  UNION ALL SELECT 'srd_subclass_features',source_key FROM public.srd_subclass_features
  UNION ALL SELECT 'srd_ancestries',       source_key FROM public.srd_ancestries
  UNION ALL SELECT 'srd_subancestries',    source_key FROM public.srd_subancestries
  UNION ALL SELECT 'srd_armor',            source_key FROM public.srd_armor
  UNION ALL SELECT 'srd_weapons',          source_key FROM public.srd_weapons
  UNION ALL SELECT 'srd_equipment',        source_key FROM public.srd_equipment
  UNION ALL SELECT 'srd_tools',            source_key FROM public.srd_tools
  UNION ALL SELECT 'srd_languages',        source_key FROM public.srd_languages
  UNION ALL SELECT 'srd_conditions',       source_key FROM public.srd_conditions
  UNION ALL SELECT 'srd_magic_items',      source_key FROM public.srd_magic_items
  UNION ALL SELECT 'srd_planes',           source_key FROM public.srd_planes
  UNION ALL SELECT 'srd_sections',         source_key FROM public.srd_sections
  UNION ALL SELECT 'srd_backgrounds',      source_key FROM public.srd_backgrounds
  UNION ALL SELECT 'srd_feats',            source_key FROM public.srd_feats
) x
GROUP BY tbl, source_key
ORDER BY tbl, rows DESC;

-- B2. The rows still needing review (unverified) after migration.
SELECT 'srd_backgrounds' AS table_name, name FROM public.srd_backgrounds WHERE source_key IS NULL
UNION ALL
SELECT 'srd_feats',       name FROM public.srd_feats       WHERE source_key IS NULL
ORDER BY table_name, name;

-- B3. Registry + last import batches (sanity check that Phase 2 seeded correctly).
SELECT key, name, ruleset, license, is_enabled, is_official FROM public.rules_sources ORDER BY sort_order;
SELECT source_key, provider, content_type, status, imported, skipped, error_count, started_at, finished_at
FROM public.import_batches ORDER BY started_at DESC LIMIT 20;

-- ----------------------------------------------------------------------------
-- SUGGESTED FOLLOW-UP (manual, NOT run automatically):
-- After reviewing B2, you can confirm the genuinely-SRD rows, e.g.:
--   UPDATE public.srd_backgrounds
--     SET source_key='srd-5.1', ruleset='2014', license='CC-BY-4.0'
--     WHERE lower(name)='acolyte';
--   UPDATE public.srd_feats
--     SET source_key='srd-5.1', ruleset='2014', license='CC-BY-4.0'
--     WHERE lower(name)='grappler';
-- Decide deliberately what to do with the remaining non-SRD rows (relabel to
-- their true source, move to the rules_cache/rules_entities layer, or remove).
-- Nothing here does that for you.
-- ----------------------------------------------------------------------------
