

# Next Steps: Fix Remaining Styling + Stability Issues

## 1. Pages Still Use Hardcoded Amber Colors (Readability Issue)
The previous styling pass updated the 9 component files but missed the 3 page files. These still have ~110 hardcoded `amber-*` references:

- **`BetaTools.tsx`** (homepage): Hero gradient, stat strip, sandbox banner, featured tools, category cards -- all amber
- **`BetaToolsLibrary.tsx`**: Create button, empty state icon/button
- **`BetaToolsGenerator.tsx`**: Tool icon background, category badge

**Fix:** Replace all hardcoded amber/emerald/yellow with design tokens (`text-brand-brass`, `text-primary`, `border-border`, `bg-card`, `font-cinzel` for headings, etc.) to match the Campaign Manager aesthetic.

## 2. Edge Function Auth Will Crash at Runtime
`generate-asset/index.ts` uses `supabaseClient.auth.getClaims(token)` -- a method introduced in `supabase-js@2.66+`. But the Deno import uses `@supabase/supabase-js@2.49.4`, which does not have this method. Every generation request will throw.

**Fix:** Replace `getClaims` with `getUser(token)` to match the pattern used by all other edge functions in this project.

## 3. Activate High-Value "Coming Soon" Tools
These tools already have full edge function support (the AI handles them generically via the schema). They just need fields and example prompts added to the registry:

- **Villain Generator** -- popular character archetype, already has `npc` asset type
- **Faction Generator** -- needed for world-building, has its own schema in the edge function
- **Name Generator** -- lightweight utility, high usage frequency
- **Rumor Generator** -- lightweight, useful for session prep

## Files Summary

| File | Action |
|------|--------|
| `src/pages/BetaTools.tsx` | Replace all amber colors with design tokens |
| `src/pages/BetaToolsLibrary.tsx` | Replace amber colors with design tokens |
| `src/pages/BetaToolsGenerator.tsx` | Replace amber colors with design tokens |
| `supabase/functions/generate-asset/index.ts` | Replace `getClaims` with `getUser` |
| `src/components/beta-tools/toolRegistry.ts` | Activate villain, faction, name, rumor generators with fields and prompts |

