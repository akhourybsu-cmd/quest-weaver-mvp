-- ============================================================================
-- Phase 5 — rules_cache namespace cleanup PREVIEW (READ-ONLY)
-- ----------------------------------------------------------------------------
-- Purpose: preview the impact of normalizing rules_cache to the canonical scheme
--   - content_type : singular (spell, creature, magic_item, condition, ...)
--   - content_key  : raw slug (content_slug), never "type:slug" prefixed
-- BEFORE writing any migration that rewrites rows. Run this in the Lovable Cloud
-- SQL editor. It ONLY runs SELECTs — it never updates, deletes, or alters anything.
--
-- Context: rules_cache currently holds rows from two writers:
--   * rules-api (on-demand cache)   — already singular type + raw-slug key
--   * sync-rules-source (Phase 4)   — plural type ("spells") + "type:slug" key
-- The Phase 5 read adapter (src/lib/rules/cacheAdapter.ts) already reads BOTH
-- via a compatibility mapper, so nothing is broken today. This preview shows what
-- a future in-place normalization WOULD change, so we can approve it first.
-- ============================================================================

-- Canonical mapping, mirrored from cacheAdapter.ts (single source of truth in code).
WITH canon AS (
  SELECT
    id,
    source_api,
    content_type,
    content_key,
    content_slug,
    content_name,
    CASE lower(content_type)
      WHEN 'spells' THEN 'spell'        WHEN 'spell' THEN 'spell'
      WHEN 'monsters' THEN 'creature'   WHEN 'creature' THEN 'creature'
      WHEN 'magic-items' THEN 'magic_item' WHEN 'magicitems' THEN 'magic_item' WHEN 'magic_item' THEN 'magic_item'
      WHEN 'conditions' THEN 'condition' WHEN 'condition' THEN 'condition'
      WHEN 'backgrounds' THEN 'background' WHEN 'background' THEN 'background'
      WHEN 'feats' THEN 'feat'          WHEN 'feat' THEN 'feat'
      WHEN 'races' THEN 'species'        WHEN 'species' THEN 'species'
      WHEN 'classes' THEN 'class'        WHEN 'class' THEN 'class'
      WHEN 'weapons' THEN 'equipment'    WHEN 'armor' THEN 'equipment' WHEN 'equipment' THEN 'equipment'
      WHEN 'sections' THEN 'rule'        WHEN 'rules' THEN 'rule' WHEN 'rule' THEN 'rule'
      ELSE NULL
    END AS canonical_type,
    -- canonical key = content_slug when present, else strip a "<content_type>:" prefix
    COALESCE(
      NULLIF(content_slug, ''),
      CASE WHEN content_key LIKE content_type || ':%'
           THEN substr(content_key, length(content_type) + 2)
           ELSE content_key END
    ) AS canonical_key
  FROM public.rules_cache
)

-- A. Inventory: every stored content_type → its canonical mapping, scheme, count.
SELECT
  content_type            AS stored_content_type,
  canonical_type,
  CASE
    WHEN content_type = canonical_type THEN 'canonical (no change)'
    WHEN canonical_type IS NULL        THEN 'UNMAPPED — review'
    ELSE 'legacy → will relabel'
  END                     AS scheme,
  count(*)                AS rows
FROM canon
GROUP BY content_type, canonical_type
ORDER BY scheme, rows DESC;

-- B. Type-prefixed keys that would be rewritten to the raw slug.
SELECT
  content_type,
  count(*)                                            AS prefixed_rows,
  count(*) FILTER (WHERE canonical_key = content_slug) AS matches_content_slug
FROM canon
WHERE content_key LIKE content_type || ':%'
GROUP BY content_type
ORDER BY prefixed_rows DESC;

-- C. Cross-scheme DUPLICATES — same logical entity under both plural & singular.
--    These are the rows a normalization would MERGE (upsert collisions to resolve).
SELECT
  canonical_type,
  canonical_key,
  source_api,
  count(*)                              AS copies,
  array_agg(DISTINCT content_type)      AS stored_types,
  max(content_name)                     AS sample_name
FROM canon
WHERE canonical_type IS NOT NULL
GROUP BY canonical_type, canonical_key, source_api
HAVING count(DISTINCT content_type) > 1
ORDER BY copies DESC, canonical_type
LIMIT 200;

-- D. Bottom-line impact summary.
SELECT
  count(*)                                                         AS total_rows,
  count(*) FILTER (WHERE canonical_type IS NULL)                   AS unmapped_rows,
  count(*) FILTER (WHERE content_type <> canonical_type)           AS rows_relabeled_type,
  count(*) FILTER (WHERE content_key LIKE content_type || ':%')    AS rows_rekeyed,
  count(*) - count(DISTINCT (canonical_type, canonical_key, source_api))
                                                                   AS rows_merged_away
FROM canon;

-- ----------------------------------------------------------------------------
-- If this preview looks right, the follow-up (separate, reviewed) migration would:
--   UPDATE public.rules_cache SET content_type = <canonical>, content_key = <slug>
--   …handling the C-section duplicates (keep freshest last_synced_at, delete older).
-- That migration is intentionally NOT included here — Lovable auto-applies anything
-- in supabase/migrations/, so the rewrite stays out of the repo until approved.
-- ----------------------------------------------------------------------------
