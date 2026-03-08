

# Beta Tools: Round 4 Refinements

## 1. Breadcrumb navigation in generator header
Currently the layout shows `Beta Tools / NPC Generator` but doesn't indicate the category. Add the category as a clickable breadcrumb: `Beta Tools / Characters / NPC Generator`. Clicking "Characters" navigates to the first tool in that category.

**File:** `src/pages/BetaToolsGenerator.tsx` — pass `tool.categoryLabel` and first tool in category to layout, or render breadcrumb inline.

## 2. Empty structured fields cleanup before generation
When users open structured fields but leave them blank, empty strings get sent as `existing_fields`. The generator already filters these, but the `locked_fields` array includes keys with empty values, which tells the AI to "keep" empty fields. Fix: only include keys in `locked_fields` where the value is truthy.

**File:** `src/components/beta-tools/BetaGeneratorForm.tsx` — line 134, change `Object.keys(existingFields)` to match the filtered set.

## 3. Tooltip hints on structured fields
Several fields have non-obvious purposes (e.g., "Lethality" on puzzles, "Attunement" on items). Add subtle helper text below each field using the `placeholder` value when present, and wrap boolean fields with a small description.

**File:** `src/components/beta-tools/BetaGeneratorForm.tsx` — add `<p className="text-[10px] text-muted-foreground">` under fields that have placeholders.

## 4. Confirmation before navigating away from unsaved results
If a user has a generated result that hasn't been saved and tries to navigate away (via sidebar or back button), they lose their work. Add a simple `beforeunload` listener when `result` exists and `!justSaved`.

**File:** `src/components/beta-tools/BetaGeneratorForm.tsx` — add `useEffect` with `beforeunload` event.

## 5. Quick-copy individual fields from result preview
In the result renderer, add a small copy icon on hover for each field value. Clicking copies just that field's text. DMs often want to grab a single description or ability rather than the whole asset.

**File:** `src/components/beta-tools/BetaResultRenderer.tsx` — wrap `FieldDisplay` with a copy button.

## 6. Asset editor: handle nested object editing
Currently the editor renders nested objects (like monster actions array-of-objects) as raw JSON in a textarea. This is awkward. Detect array-of-object fields and render each item as a mini-card with name/description inputs.

**File:** `src/components/beta-tools/BetaAssetEditor.tsx` — add object-aware field rendering.

## Files to Update

| File | Change |
|------|--------|
| `src/pages/BetaToolsGenerator.tsx` | Category breadcrumb |
| `src/components/beta-tools/BetaGeneratorForm.tsx` | Fix locked_fields, field hints, unsaved warning |
| `src/components/beta-tools/BetaResultRenderer.tsx` | Per-field copy button |
| `src/components/beta-tools/BetaAssetEditor.tsx` | Nested object field editing |

No backend or migration changes needed.

