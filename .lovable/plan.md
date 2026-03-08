

# Fill All Beta Tools Gaps

## Identified Gaps

1. **BetaAssetEditor bug** -- Uses `useState(() => {...})` instead of `useEffect` for form reset. State goes stale when switching between assets.

2. **Missing Lore Detector needs dedicated UI** -- Currently routed to the generic `BetaGeneratorForm`, but it requires a campaign selector, scan trigger, and structured gap report display -- not a freeform prompt.

3. **No delete confirmation** -- Library delete is instant with no safety check.

4. **verify_jwt on generate-asset** -- Currently `true`, which won't work with signing-keys. Should be `false` with in-code auth validation. (Note: config.toml is auto-managed, but the edge function code doesn't validate JWT either -- it just trusts the caller. This means the function currently works because the client sends the auth header automatically via `supabase.functions.invoke`, but it should be hardened.)

5. **Edge function doesn't handle `lore_gap` properly for standalone** -- The lore_gap type requires campaign context to scan, but standalone mode skips context. No validation for this case.

6. **No campaign context option in generators** -- The plan called for an optional "Use campaign context" toggle so users can get lore-aware generation even in Beta Tools. Currently hardcoded to `standalone: true` with no campaign context.

## Plan

### 1. Fix BetaAssetEditor state bug
**File:** `src/components/beta-tools/BetaAssetEditor.tsx`
- Replace the incorrect `useState(() => {...})` on line 30 with a proper `useEffect` that resets `name`, `status`, `tagsInput`, and `data` when `asset` prop changes.

### 2. Add delete confirmation dialog
**File:** `src/components/beta-tools/BetaAssetCard.tsx` (or `BetaToolsLibrary.tsx`)
- Wrap the delete action in an `AlertDialog` that confirms before executing.

### 3. Build Missing Lore Detector UI
**File:** `src/components/beta-tools/MissingLoreDetector.tsx` (new)
- Campaign selector dropdown (fetches user's campaigns)
- "Scan Campaign" button that calls `generate-asset` with `asset_type: 'lore_gap'` and campaign context
- Structured gap report: grouped by entity type, severity badges (minor/moderate/critical), descriptions, suggestions
- "Fix with AI" button per gap that navigates to the relevant generator pre-filled
- Save report to Beta Library as a `lore_gap` asset

**File:** `src/pages/BetaToolsGenerator.tsx`
- Add conditional: if `tool.assetType === 'lore_gap'`, render `MissingLoreDetector` instead of `BetaGeneratorForm`.

**File:** `supabase/functions/generate-asset/index.ts`
- Add validation: if `asset_type === 'lore_gap'` and no `campaign_context` provided, return an error asking user to select a campaign.

### 4. Add optional campaign context toggle to generators
**File:** `src/components/beta-tools/BetaGeneratorForm.tsx`
- Add a "Use Campaign Context" switch at the bottom of the structured fields area
- When enabled, show a campaign selector dropdown (fetch user's campaigns)
- When a campaign is selected, fetch campaign context using the existing `campaignContextBuilder` pattern and pass it to the edge function instead of `standalone: true`
- This makes generators lore-aware without leaving Beta Tools

### 5. Harden edge function auth
**File:** `supabase/functions/generate-asset/index.ts`
- Add JWT validation via `getClaims()` at the top of the handler
- Extract `userId` from claims for logging/auditing

### Files Summary
| File | Action |
|------|--------|
| `src/components/beta-tools/BetaAssetEditor.tsx` | Fix useEffect bug |
| `src/pages/BetaToolsLibrary.tsx` | Add delete confirmation AlertDialog |
| `src/components/beta-tools/MissingLoreDetector.tsx` | New -- dedicated lore gap scanner UI |
| `src/pages/BetaToolsGenerator.tsx` | Route lore_gap to MissingLoreDetector |
| `src/components/beta-tools/BetaGeneratorForm.tsx` | Add campaign context toggle + selector |
| `supabase/functions/generate-asset/index.ts` | Add auth validation, lore_gap standalone guard |

