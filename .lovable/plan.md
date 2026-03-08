

# Beta Tools Refinements

The codebase is in solid shape. There's one critical bug and a few polish items worth addressing before moving on to new tools.

## 1. Critical: Edge Function Auth is Broken

The `generate-asset` edge function uses `supabaseClient.auth.getClaims(token)` — a method that **does not exist** in `@supabase/supabase-js@2.49.4` (the version imported). Every other edge function in this project uses `getUser()`. This means **all generation requests will fail at runtime**.

**Fix:** Replace `getClaims` with `getUser()` to match the pattern in all 10+ other edge functions:
```typescript
// Before (broken)
const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
const userId = claimsData.claims.sub;

// After (working)
const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
const userId = user.id;
```

## 2. Polish: Name Generator Has No `name` Output Field

The Name Generator's `assetType` is `'lore'`, which means the AI returns a `content` field — but the save logic looks for `name` or `title` first, so saved assets will be called "Untitled Name Generator". The result renderer also won't know how to display a list of names nicely.

**Fix:** Add `name` output mapping in the save logic or add a result renderer group for `lore` type assets.

## 3. Polish: HERO_TOOLS Now Shows All 8 Active Tools

`HERO_TOOLS` is defined as `BETA_TOOLS.filter(t => t.status === 'active')`, which now includes all 8 active tools (NPC, Villain, Monster, Settlement, Faction, Quest, Rumor, Name, Magic Item, Missing Lore). The "Featured Tools" section on the homepage will be crowded.

**Fix:** Cap `HERO_TOOLS` to the top 4 most useful tools, or define a `featured: true` flag.

## 4. Polish: Sidebar Scrolling on Small Screens

With 8 categories of tools, the sidebar can overflow on smaller screens. The `SidebarContent` doesn't have explicit scroll handling.

**Fix:** Ensure `overflow-y-auto` is applied to the sidebar content area.

## Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-asset/index.ts` | Replace `getClaims` with `getUser()` (critical fix) |
| `src/components/beta-tools/toolRegistry.ts` | Add `featured` flag, cap HERO_TOOLS to 4 |
| `src/components/beta-tools/BetaResultRenderer.tsx` | Add `lore` field group for name/rumor rendering |
| `src/components/beta-tools/BetaToolsSidebar.tsx` | Add `overflow-y-auto` to sidebar content |

