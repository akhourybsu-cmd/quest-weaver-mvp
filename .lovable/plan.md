

# Beta Tools Full Audit Report

After reading all 10 component files, 3 page files, the edge function, and supporting libraries, here are the issues found:

## Critical Issues

### 1. Edge Function `verify_jwt = true` Conflicts with Manual Auth
The `generate-asset` function has `verify_jwt = true` in `config.toml` AND does manual `getUser()` auth inside the function. This is redundant but not broken — Supabase verifies the JWT at the gateway, then the function verifies again. However, the standard pattern for functions that need the `user.id` (like this one) is `verify_jwt = false` + manual auth in code. Current setup works but adds latency. **Low priority — no change needed.**

### 2. `sanitizeGeneratedFields` Only Knows 6 Asset Types
`assetFieldSchemas.ts` defines schemas for: `npc`, `location`, `faction`, `item`, `quest`, `lore`. But the Beta Tools generators send asset types like `monster`, `settlement`, `magic_item`, `battle_map`, `world_event`. When `sanitizeGeneratedFields` is called in `useAIAssetGenerator.ts` with these types, the schema lookup returns `undefined`, so all fields pass through unsanitized (no length limits, no markdown stripping). **The BetaGeneratorForm doesn't use `sanitizeGeneratedFields`** — it calls the edge function directly and uses raw results. So this is only an issue for the campaign editor's "Generate with AI" flow, not the Beta Tools. **No fix needed for Beta Tools.**

### 3. Missing `BetaResultRenderer` Groups for New Asset Types
The renderer has groups for: `monster`, `npc`, `quest`, `lore`, `settlement`. Missing:
- **`faction`** — Generated factions fall through to the generic key-value renderer (ugly but functional)
- **`magic_item`** — Same issue
- **`battle_map`** — Same issue  
- **`world_event`** — Same issue

These 4 asset types will display results as flat key-value pairs instead of nicely grouped sections.

## Moderate Issues

### 4. Import Dialog Missing New Asset Types
`IMPORTABLE_TYPES` includes `['npc', 'quest', 'magic_item', 'settlement', 'faction', 'monster']`. Missing:
- `battle_map` — Could import as a location
- `world_event` — Could import as lore or a session note
- `lore` — Random tables, handouts, names, puzzles, rumors all save as `lore` type but can't be imported

Users generating content with 6 of the 16 active tools (Random Table, Name, Handout, Puzzle, Rumor, and both Map generators) will see "cannot be imported" when trying to import.

### 5. Name/Rumor/Handout/Table/Puzzle Generators Save with Generic Names
The save logic uses `editedResult.name || editedResult.title || editedResult.event_name || 'Untitled...'`. But for lore-type generators, the AI might return content in a `content` field with no `name` field. The `name` field IS defined in the tool's fields schema, so the user CAN set it — but if they don't, and the AI doesn't return one, the asset saves as "Untitled Random Table Generator" etc.

### 6. `assetType` Mismatch Between Generators and Renderer
Several generators map to shared asset types. For example, both "Villain Generator" and "NPC Generator" use `assetType: 'npc'`. The result renderer uses `assetType` to pick display groups, so villains render identically to NPCs. This is actually fine since villains ARE NPCs — but battle map generators and dungeon generators both use `battle_map` and neither has a renderer group.

## Cosmetic / Minor Issues

### 7. Monster Renderer Grid Issue
When only 1 or 2 of HP/AC/Speed are returned, the 3-column grid has empty cells. Minor visual glitch.

### 8. `AlertTriangle` Imported but Unused in Library
`BetaToolsLibrary.tsx` imports `AlertTriangle` but never uses it. Harmless but messy.

## Proposed Fixes

| File | Change | Priority |
|------|--------|----------|
| `BetaResultRenderer.tsx` | Add field groups for `faction`, `magic_item`, `battle_map`, `world_event` | High |
| `BetaImportDialog.tsx` | Add `lore` and `battle_map` to importable types with appropriate table mappings | Medium |
| `BetaImportDialog.tsx` | Add `world_event` import mapping (to lore_pages or session notes) | Low |
| `BetaToolsLibrary.tsx` | Remove unused `AlertTriangle` import | Trivial |

No edge function changes needed — auth is working correctly.

