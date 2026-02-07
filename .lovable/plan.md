
# Player Campaign View -- Missing Tabs and Visibility Audit

## Current State

The campaign **"The World of Sandrogal"** (code `99DC7S`) has rich content:

| Asset Type | Total | Player-Visible |
|-----------|-------|----------------|
| NPCs | 112 | 0 (all `player_visible: false`) |
| Locations | 46 | 0 (all `discovered: false`) |
| Factions | 27 | N/A (no visibility column exists!) |
| Quests | 2 | 0 (both `player_visible: false`) |
| Lore Pages | 1 | 1 (`visibility: SHARED`) |
| Session Notes | 4 | 3 (`SHARED`) |
| Items | 0 | -- |
| Timeline Events | 0 | -- |

## Problems Found

### 1. Missing Tabs in Player Campaign View

The DM Campaign Manager has **12 tabs**: Overview, Quests, Sessions, NPCs, Locations, Lore, Factions, Bestiary, Encounters, Item Vault, Timeline, Notes.

The Player Campaign View currently has only **4 tabs**: Quests, NPCs, Locations, Notes.

Of the 8 missing tabs, some are correctly DM-only (Sessions, Bestiary, Encounters, Overview, Item Vault). But **3 tabs are missing that players should have access to**:

- **Factions** -- 27 factions exist with descriptions, goals, and influence. Players should be able to see factions the DM has revealed.
- **Lore** -- The lore system already has a `visibility` field (`DM_ONLY` / `SHARED`). 1 lore page is already marked SHARED. Players should be able to browse shared lore.
- **Timeline** -- The timeline_events table already has a `player_visible` column. Players should see revealed timeline events.

### 2. Factions Table Missing Visibility Column

Unlike NPCs, quests, locations, and timeline events which all have visibility controls, the `factions` table has NO `player_visible` column. This needs to be added before a player factions view can work.

### 3. All Assets Currently Hidden

Every single NPC, location, and quest has visibility turned off. This means the player currently sees **empty tabs** for everything. This is a data-state issue the DM controls -- once the tabs and visibility columns are properly wired, the DM can toggle assets visible from the Campaign Manager.

### 4. No Player-Facing Components for Factions, Lore, or Timeline

There are no `PlayerFactionsView`, `PlayerLoreView`, or `PlayerTimelineView` components. These need to be created, following the same pattern as existing player components (`PlayerNPCDirectory`, `PlayerLocationsView`, etc.).

---

## Implementation Plan

### Phase 1: Database -- Add Factions Visibility Column

Add a `player_visible` boolean column (default `false`) to the `factions` table. This mirrors the pattern used for NPCs, quests, and timeline events.

```text
ALTER TABLE public.factions ADD COLUMN player_visible boolean DEFAULT false;
```

Also update the `FactionEditor` to include a visibility toggle (matching the NPC editor pattern).

### Phase 2: Create Player-Facing Components

**`PlayerFactionsView`** -- New component displaying factions where `player_visible = true`:
- Grid of faction cards showing name, description, banner image, motto, goals
- Reputation score display (if faction_reputation exists for this player)
- Search/filter by name
- Read-only -- no edit/delete actions
- Realtime subscription for live updates
- Follows the same card design as `PlayerNPCDirectory` and `PlayerLocationsView`

**`PlayerLoreView`** -- New component displaying lore pages where `visibility = 'SHARED'`:
- List of lore pages grouped by category (Regions, History, NPCs, Factions, etc.)
- Click to open read-only lore page viewer (reusing `LorePageView` with `onEdit` hidden)
- Category filter tabs matching the DM lore tab
- Search by title/tags
- Follows the fantasy codex aesthetic from the DM lore system

**`PlayerTimelineView`** -- New component displaying timeline events where `player_visible = true`:
- Vertical timeline display with in-game dates
- Event cards showing title, summary, category icon
- Sorted by occurred_at date
- Read-only view

### Phase 3: Wire Up PlayerCampaignView Tabs

Update `PlayerCampaignView.tsx` to include 7 tabs instead of 4:

```text
Quests | NPCs | Locations | Factions | Lore | Timeline | Notes
```

- Import and render the three new components
- Update the `TabsList` grid from `grid-cols-4` to a scrollable layout (matching the DM tab bar) so all 7 tabs fit on mobile

### Phase 4: Add Visibility Toggle to Faction Editor

Update `FactionEditor.tsx` to include a "Player Visible" toggle, matching the same pattern used in `EnhancedNPCEditor` and `QuestDialog`. This lets the DM control which factions players can see.

---

## Technical Details

### Files Changed

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Add `player_visible` boolean to `factions` table |
| `src/components/player/PlayerFactionsView.tsx` | NEW -- read-only faction directory for players |
| `src/components/player/PlayerLoreView.tsx` | NEW -- read-only lore browser for players |
| `src/components/player/PlayerTimelineView.tsx` | NEW -- read-only timeline for players |
| `src/pages/PlayerCampaignView.tsx` | Add 3 new tabs (Factions, Lore, Timeline), update tab layout |
| `src/components/factions/FactionEditor.tsx` | Add `player_visible` toggle |

### Component Patterns

All three new components follow the established player component pattern:
- Accept `campaignId` prop
- Query with visibility filter (`.eq("player_visible", true)` or `.eq("visibility", "SHARED")`)
- Subscribe to realtime changes via `supabase.channel()`
- Read-only UI (no create/edit/delete buttons)
- Search input for filtering
- Empty state when no visible assets exist
- Fantasy-themed styling (font-cinzel headers, brass accents, card borders)

### Data Visibility Note

Currently ALL NPCs, locations, quests, and factions have visibility set to off. After this implementation, the DM will need to toggle visibility on individual assets from the Campaign Manager. The player will see empty states until the DM reveals content -- this is by design (the DM controls what players see).
