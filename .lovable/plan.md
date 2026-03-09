

## Demo Campaign Manager — Sync with Real Campaign Manager

### Current State
The Demo Campaign Manager is severely outdated. It uses a basic breadcrumb header and a flat `ScrollArea` tab list, while the real Campaign Manager has a full sidebar layout, banner header with session info, grouped tab navigation with dividers, mobile dropdown navigation, and 17 tabs. The demo only has 12 tabs.

### What's Missing

**5 missing tabs:**
- Party — shows PC stats, character cards
- Plot Board — node graph / clue web
- Maps — map gallery
- DM Tools — rule references, generators
- Live Session (conditional) — not needed for demo, can skip

**Layout mismatch:**
- Real uses `CampaignManagerLayout` with collapsible sidebar, banner image header, session badges, player avatars, command palette hint, grouped tab bar with visual dividers between groups, and mobile dropdown selector
- Demo uses a simple breadcrumb + horizontal scroll tabs — visually unrecognizable as the same product

### Plan

**A. Rewrite `DemoCampaignManager.tsx` layout to mirror the real Campaign Manager**
- Use the same header structure: sticky header with campaign name, badges (5e, session count, NPC count), "Demo Mode" indicator, player avatar row
- Use the same grouped tab bar with dividers (Core | World | Combat | Assets | Utility) matching the real `CampaignHub.tsx` structure exactly
- Add mobile dropdown navigation mirroring the real `<Select>` approach
- Use `bg-obsidian` backgrounds, `border-brass/20` borders, `data-[state=active]:border-b-2 border-arcanePurple` tab styling — all matching the real manager
- No sidebar needed (demo has only one campaign), but wrap in a similar full-height flex layout

**B. Add 4 new demo tab components**
- `DemoPartyTab.tsx` — show 4 demo party members with basic character cards (name, race, class, level, HP, AC). Add seed data for party members to `demoSeeds.ts`.
- `DemoPlotBoardTab.tsx` — static placeholder showing what the plot board looks like (read-only node preview or descriptive card explaining the feature)
- `DemoMapsTab.tsx` — placeholder gallery showing the maps feature with a sample map image or feature description card
- `DemoDMToolsTab.tsx` — placeholder showing available DM tools (dice roller description, rule references, generators list)

**C. Add demo seed data for party members**
- Add a `party` array to `DemoCampaign` interface and `RECKONING_SEED` with 4 PCs: a fighter, wizard, rogue, and cleric with basic stats (name, race, class, level, HP, AC, player name)

**D. Update `DemoOverviewTab.tsx`**
- Add party member count from seed data instead of hardcoded 4
- Match the real overview's stat card style more closely

### Files to modify
- `src/pages/DemoCampaignManager.tsx` — full layout rewrite
- `src/data/demoSeeds.ts` — add `DemoPartyMember` interface and party data
- `src/lib/demoAdapters.ts` — add `adaptDemoParty` function

### Files to create
- `src/components/demo/tabs/DemoPartyTab.tsx`
- `src/components/demo/tabs/DemoPlotBoardTab.tsx`
- `src/components/demo/tabs/DemoMapsTab.tsx`
- `src/components/demo/tabs/DemoDMToolsTab.tsx`

### Files NOT touched
- `src/pages/CampaignHub.tsx` — never modified
- `src/components/campaign/CampaignManagerLayout.tsx` — never modified
- Any real campaign tab components — never modified

