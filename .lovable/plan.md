

# Beta Tools -- Implementation Plan

## Overview

Build Beta Tools as a standalone top-level section with its own routing, navigation, asset storage, and AI-powered generators. Reuse the existing `generate-asset` edge function by extending it with new asset types. Deliver all 8 hero generators, the Beta Library, and the import-to-campaign flow.

## Architecture

```text
/beta-tools                    --> Landing page
/beta-tools/library            --> Beta Library (all saved assets)
/beta-tools/generate/:toolId   --> Generator pages (NPC, Monster, Quest, etc.)
```

```text
src/
  pages/
    BetaTools.tsx              -- Landing page
    BetaToolsLibrary.tsx       -- Library browser
    BetaToolsGenerator.tsx     -- Universal generator page (renders per toolId)
  components/
    beta-tools/
      BetaToolsLayout.tsx      -- Sidebar + content wrapper
      BetaToolsSidebar.tsx     -- Category navigation
      BetaToolsLanding.tsx     -- Hero + featured tools + recent creations
      BetaAssetCard.tsx        -- Universal asset card for library
      BetaGeneratorForm.tsx    -- Reusable generator UI (prompt + structured fields + AI)
      BetaAssetEditor.tsx      -- Edit saved asset
      BetaImportDialog.tsx     -- Import-to-campaign flow
      BetaLibraryFilters.tsx   -- Type/status/search/favorites filters
      toolRegistry.ts          -- Central registry of all tools, categories, schemas
```

## Database

**New table: `beta_assets`**

```sql
create table public.beta_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_type text not null,          -- 'npc', 'monster', 'quest', 'settlement', 'magic_item', 'world_event', 'battle_map', 'lore_gap'
  name text not null,
  data jsonb not null default '{}',  -- all generated/edited fields
  tags text[] default '{}',
  status text not null default 'draft',  -- 'draft', 'standalone', 'canon_ready', 'imported', 'imported_adapted'
  is_favorite boolean default false,
  imported_to_campaign_id uuid references campaigns(id) on delete set null,
  imported_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.beta_assets enable row level security;

-- Users can only access their own assets
create policy "Users manage own beta assets"
  on public.beta_assets for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Updated_at trigger
create trigger beta_assets_updated_at
  before update on public.beta_assets
  for each row execute function update_updated_at();
```

Single table with JSONB `data` column. Each asset type stores its fields in `data`. No need for separate tables per type -- keeps the schema simple and extensible.

## Edge Function Changes

Extend `generate-asset` to accept new asset types. Add schemas for: `monster`, `settlement`, `world_event`, `magic_item` (reuse existing `item`), `battle_map`, `lore_gap`. Add a `standalone: true` flag in the request body that tells the function to skip campaign context when none is provided.

New types added to the function:

- **monster**: CR, type, size, abilities, lair actions, legendary actions, tactics, habitat, lore
- **settlement**: population, government, economy, defenses, notable_locations, notable_npcs, history, atmosphere, plot_hooks
- **world_event**: category, severity, affected_regions, affected_factions, description, consequences, timeline, rumors
- **battle_map**: layout_type (grid/hex), biome, size, indoor/outdoor, terrain_features, cover_positions, hazards, tactical_notes (text description, not actual image generation)
- **lore_gap**: (special -- scans provided assets and returns gap analysis, not a generator)

## Tool Registry

Central `toolRegistry.ts` defines all tools with metadata:

```typescript
interface BetaTool {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: LucideIcon;
  assetType: string;
  status: 'active' | 'coming_soon';
  fields: FieldSchema[];     // structured input fields
  examplePrompts: string[];  // quick-start prompts
}
```

8 hero tools marked `active`. All other tools from the spec marked `coming_soon` with placeholder cards in the UI.

## Generator UX Flow

Every generator follows the same reusable component pattern:

1. **BetaGeneratorForm** renders:
   - Freeform prompt textarea
   - Quick-start prompt chips
   - Optional structured fields (collapsible, type-specific)
   - Optional "Use campaign context" toggle (lets user pick a campaign for lore-aware generation)
   - Generate button -> calls edge function
2. **AI result preview** (reuse existing `AIGenerationPreview` pattern)
3. **Save to Beta Library** button -> inserts into `beta_assets`
4. **Regenerate** or **Edit manually** before saving

## Beta Library

- Grid of `BetaAssetCard` components
- Filter bar: type dropdown, status dropdown, search input, favorites toggle
- Each card shows: name, type badge, status badge, favorite star, created date
- Card actions: Edit, Duplicate, Delete, Import to Campaign
- Clicking a card opens `BetaAssetEditor` (inline or dialog)

## Import Flow

`BetaImportDialog` presents:
1. Campaign selector (from user's campaigns)
2. Import mode: "As Draft", "As Canon", "Clone Only"
3. On confirm: inserts the asset data into the appropriate campaign table (npcs, locations, quests, items, etc.) using existing insert patterns
4. Updates `beta_assets.status` to `imported`, sets `imported_to_campaign_id` and `imported_at`

For MVP, import supports: NPC -> `npcs` table, Quest -> `quests` table, Magic Item -> `items` table, Settlement -> `locations` table. Monster/world_event/battle_map/lore_gap remain standalone-only initially.

## Missing Lore Detector

Special tool that works differently from generators:
1. User selects a campaign
2. Edge function scans campaign assets (NPCs, locations, factions, quests, items) via the campaign context builder
3. Returns a structured report of gaps (NPCs without goals, locations without descriptions, factions without leadership, etc.)
4. Results saved as a `lore_gap` type beta asset for reference
5. Each gap has a "Fix with AI" action that opens the relevant generator pre-filled

## Landing Page Layout

- Hero: "The Creator's Forge" title, tagline about experimental sandbox, CTA to browse tools
- 8 featured tool cards in a responsive grid
- "Your Recent Creations" section (last 5 beta assets)
- Category browser (accordion or tabs showing all tool categories with coming-soon badges)
- Info callout: "Nothing here touches your campaigns unless you choose to import it"

## Visual Identity

- Uses existing design system (Tailwind, shadcn)
- Accent color: amber/brass tones (vs purple for Campaign Manager) to create visual distinction
- Beaker/flask icon motif for the "experimental lab" feel
- Beta badge on the section header
- Cards use a slightly different border treatment (dashed or amber border)

## Routing (App.tsx additions)

```typescript
const BetaTools = lazy(() => import("./pages/BetaTools"));
const BetaToolsLibrary = lazy(() => import("./pages/BetaToolsLibrary"));
const BetaToolsGenerator = lazy(() => import("./pages/BetaToolsGenerator"));

// Protected routes
<Route path="/beta-tools" element={<BetaTools />} />
<Route path="/beta-tools/library" element={<BetaToolsLibrary />} />
<Route path="/beta-tools/generate/:toolId" element={<BetaToolsGenerator />} />
```

Add "Beta Tools" link to the landing page nav and Campaign Hub header.

## Implementation Order

1. **Database migration** -- create `beta_assets` table with RLS
2. **Extend edge function** -- add monster, settlement, world_event, battle_map types + standalone mode
3. **Tool registry + types** -- `toolRegistry.ts` with all tool definitions and field schemas
4. **Layout components** -- `BetaToolsLayout`, `BetaToolsSidebar`
5. **Landing page** -- `BetaTools.tsx` with hero, featured tools, recent creations
6. **Generator page** -- `BetaToolsGenerator.tsx` with `BetaGeneratorForm` (reusable for all types)
7. **Library page** -- `BetaToolsLibrary.tsx` with `BetaAssetCard`, filters, CRUD
8. **Import dialog** -- `BetaImportDialog.tsx` with campaign selector and insert logic
9. **Missing Lore Detector** -- special scanning tool
10. **App.tsx routing** -- wire everything up, add nav links

## File Count Estimate

~15 new files, 2 modified files (App.tsx, generate-asset edge function), 1 migration.

