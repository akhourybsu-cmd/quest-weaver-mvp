

# Fill Remaining Beta Tools Gaps

## Critical Issues Found

### 1. Import Dialog Inserts Non-Existent Columns (Runtime Failures)
`BetaImportDialog.tsx` references columns that don't exist on the target tables:

**NPCs table** has: `name, role, description, location, portrait_url, attitude, player_visible, lore_page_id, faction_role`
- Import tries to write: `gm_notes`, `secrets`, `alignment`, `pronouns`, `status` -- **none exist**

**Quests table** has: `title, description, quest_giver, is_completed, quest_giver_id, location_id, player_visible, lore_page_id`
- Import tries to write: `difficulty`, `quest_type`, `dm_notes`, `status` -- **none exist**

**Items table** has `type` with CHECK constraint `('MUNDANE','CONSUMABLE','MAGIC','CURRENCY')`
- Import tries to set `type` to values like "weapon", "armor" -- **violates CHECK constraint**

**Fix:** Rewrite all 4 import mappings to only use actual columns, storing overflow data in existing JSONB columns (`details` on locations, `properties` on items) or omitting unsupported fields.

### 2. Edge Function `verify_jwt` Misconfigured
`config.toml` has `verify_jwt = true` for `generate-asset`, but the signing-keys system requires `verify_jwt = false` with in-code validation (which the function already does). This will cause auth failures.

**Fix:** Update config.toml to set `verify_jwt = false` for generate-asset.

### 3. No Type-Specific Result Rendering
All generator results display as a flat key-value dump. Monster stat blocks, quest stages, settlement sections all look the same.

**Fix:** Add a `BetaResultRenderer` component that formats results based on asset type:
- **Monster**: Stat block layout (HP/AC/Speed header, abilities section, actions list)
- **NPC**: Character sheet style (portrait placeholder, personality sidebar, hooks list)
- **Quest**: Stage/objective checklist style
- **Settlement**: Sectioned layout (overview, notable locations, notable NPCs, plot hooks)
- **Other types**: Enhanced key-value with better formatting for arrays and objects

### 4. Generator Doesn't Reset Between Tools
If a user generates an NPC, then navigates to Monster Generator, the prompt and result state persist because `BetaGeneratorForm` doesn't reset when `tool` prop changes.

**Fix:** Add `useEffect` keyed on `tool.id` to reset all form state.

## Files Summary

| File | Action |
|------|--------|
| `src/components/beta-tools/BetaImportDialog.tsx` | Fix all column mappings to match actual DB schema |
| `supabase/config.toml` | Set `verify_jwt = false` for generate-asset |
| `src/components/beta-tools/BetaResultRenderer.tsx` | New -- type-specific result formatting |
| `src/components/beta-tools/BetaGeneratorForm.tsx` | Use `BetaResultRenderer`, add tool-change reset |

