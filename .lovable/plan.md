

# Campaign Manager Tab Audit: What to Add, Merge, or Skip

## Current State (13 Tabs)

The Campaign Manager already has a robust tab structure organized into 4 groups:

**Core:** Overview, Quests, Sessions
**World:** NPCs, Locations, Lore, Factions
**Combat:** Bestiary, Encounters
**Assets:** Item Vault, Timeline, Notes

---

## Analysis of Your 7 Proposals

### 1. Player Hub (DM-facing party management) -- NEW TAB: "Party"

**Verdict: Add as a new tab.** This fills a real gap -- the DM currently has no consolidated view of the party.

What to include:
- **Party Roster**: Auto-populated from `campaign_members` + `characters` table. Shows each PC's name, class/level, AC, HP, passive Perception/Insight/Investigation, languages, and a link to their full sheet.
- **Party Inventory / Party Gold**: Aggregate view of all assigned character inventories + a shared "party fund" tracked at the campaign level.
- **DM Notes per PC**: Private markdown notes attached per character (new `dm_character_notes` table), for secrets, hooks, and plot threads.
- **Session Attendance**: Simple check-in log per session (new `session_attendance` table).
- **Inspiration Tracking**: Toggle per character, visible to DM and player.

This becomes a new **"Party"** tab in the Core group.

---

### 2. Rules and Tools (DM toolbox) -- NEW TAB: "DM Tools"

**Verdict: Add as a new tab.** The dice roller exists but is only in `SessionPlayer`. DMs need quick-access references outside of combat.

What to include:
- **Conditions Reference**: Searchable list of all 15 5e conditions (Blinded, Charmed, etc.) with full descriptions. Data already partially exists in `QuickConditionsPopover` -- this surfaces it as a standalone reference.
- **Dice Roller**: Reuse the existing `DiceRoller` component.
- **Quick Generators**: AI-powered generators (using Lovable AI / Gemini Flash) for NPC names, tavern names, loot drops, weather, and rumors. No new tables needed -- results are ephemeral or copy-to-clipboard.
- **Random Tables**: Encounter tables by environment/CR, treasure tables by hoard CR (SRD data).
- **Travel Calculator**: Input distance + pace (fast/normal/slow), outputs travel time, exhaustion risk, and random encounter check intervals per 5e PHB rules.

This becomes a **"DM Tools"** tab in a new "Utility" group.

---

### 3. Maps -- NEW TAB: "Maps"

**Verdict: Add as a new tab.** The entire map infrastructure already exists (`MapViewer`, `MapUpload`, `DrawingToolbar`, `FogOfWarTools`, `MarkerRenderer`, `TokenManager`, `map_markers` table) but is only used inside encounter/session contexts. Promoting it to a first-class tab is straightforward.

What to include:
- **Map Gallery**: Upload and manage world/region/city/dungeon maps outside of encounters. Uses existing `MapUpload` and a new lightweight `campaign_maps` table (or reuse existing map storage).
- **Pins/Markers**: Link markers to Locations, NPCs, or Encounters using existing `map_markers` infrastructure.
- **Fog of War**: Already implemented in `FogOfWarTools` and `AdvancedFogTools`.
- **Player-Safe Export**: A "Share with Players" toggle that hides DM-only markers and fog, reusing the existing `isDM` prop pattern on `MapViewer`.

This becomes a **"Maps"** tab in the World group.

---

### 4. Organizations and Religion -- MERGE INTO EXISTING

**Verdict: Merge into Factions + Lore. No new tab needed.**

Why:
- **Factions** already supports guilds, orders, churches, and institutions. The reputation/influence system works for any organization type. Adding a `faction_type` category field (e.g., "Religious Order", "Guild", "Government", "Criminal") with filterable tags gives DMs the organizational taxonomy without a separate tab.
- **Deities/Pantheons** are a natural fit for the **Lore** system, which already has category-based pages (Region, History, etc.). Adding a "Deity" or "Pantheon" lore category with structured fields (domains, alignment, symbol, holy day) in the `details` JSON keeps it consistent with the existing codex pattern.

Implementation:
- Add `faction_type` column to `factions` table with filter chips in `FactionsTab`.
- Add "Deity" and "Pantheon" categories to the Lore system with appropriate creator components.

---

### 5. Settlements and Economy -- MERGE INTO EXISTING

**Verdict: Merge into Locations. No new tab needed.**

Why:
- Locations already represent places. A "settlement" is just a location with richer metadata. Adding structured fields to the location editor (population, government type, laws, exports/imports, defenses, services, price modifiers) via a `settlement_details` JSON column or expanding existing `details` keeps everything in one place.
- "Notable NPCs" already works via the existing `location_id` FK on NPCs -- the location detail view can show linked NPCs.
- "Points of Interest" can be child locations (self-referential `parent_location_id`).

Implementation:
- Add `location_type` field ("Wilderness", "Settlement", "Dungeon", "Building") with a settlement-specific detail panel in the location editor.
- Add settlement fields: population, government, trade goods, defenses, price modifier.

---

### 6. Plot Board -- NEW TAB: "Plot Board"

**Verdict: Add as a new tab.** This is fundamentally different from Quests (which are player-facing task trackers). The Plot Board is a DM-only strategic planning tool.

What to include:
- **Plot Threads**: Cards representing ongoing storylines, mysteries, or villain plans. Each thread has a title, status (Active/Dormant/Resolved), and markdown description.
- **Clue Web**: A node-graph visualization (reuse `react-force-graph-2d`, already installed for the Notes graph) showing connections between threads, NPCs, locations, and factions.
- **Reveal Tracker**: Per-thread toggle for "Party Knows" vs "True State" -- two markdown fields per thread.
- **Branching Notes**: "If X then Y" conditional notes attached to threads.

New table: `plot_threads` with columns for campaign_id, title, status, description, truth, party_knowledge, and a `plot_thread_links` junction table for the graph.

This becomes a **"Plot Board"** tab in the Core group (DM-only, never visible to players).

---

### 7. Custom Content Builder -- MERGE INTO EXISTING

**Verdict: Mostly already done or can extend existing tabs. No new tab needed.**

What already exists:
- **Items**: Full homebrew creation in the Item Vault with 5e templates.
- **Monsters**: Full homebrew creation in Bestiary with SRD duplicate-and-reskin.
- **Spells**: SRD spell library exists; homebrew spells can follow the same Bestiary pattern (SRD + Homebrew toggle).

What to add incrementally (not as a separate tab):
- **Homebrew Spells**: Add a "Homebrew" source toggle to the existing spell system, mirroring the Bestiary pattern. New `spell_homebrew` table.
- **Homebrew Feats/Backgrounds/Subclasses**: These are lower priority and can be added as sub-features within character creation or the DM Tools tab later.

---

## Summary: Recommended New Tabs

| Proposal | Action | Where |
|---|---|---|
| Player Hub | **New "Party" tab** | Core group |
| Rules and Tools | **New "DM Tools" tab** | New Utility group |
| Maps | **New "Maps" tab** | World group |
| Organizations | **Merge into Factions + Lore** | Existing tabs |
| Settlements | **Merge into Locations** | Existing tabs |
| Plot Board | **New "Plot Board" tab** | Core group |
| Custom Content | **Extend existing tabs** | Bestiary/Item Vault pattern |

**Net result: 3 new tabs (Party, DM Tools, Plot Board, Maps) + enhancements to 3 existing tabs (Factions, Locations, Lore)**

---

## Technical Implementation

### New Database Tables

```text
campaign_maps        - id, campaign_id, name, image_url, map_type, width, height, grid_enabled, grid_size, player_visible
plot_threads         - id, campaign_id, title, status, description, truth, party_knowledge, sort_order
plot_thread_links    - id, thread_id, linked_type (NPC/Location/Faction/Thread), linked_id
dm_character_notes   - id, campaign_id, character_id, content_markdown, hooks, secrets
session_attendance   - id, session_id, character_id, attended, inspiration_granted
```

### Schema Changes to Existing Tables

```text
factions             + faction_type (text, nullable)
locations            + location_type (text, nullable), settlement_details (jsonb, nullable)
```

### New Components

```text
src/components/campaign/tabs/PartyTab.tsx
src/components/campaign/tabs/DMToolsTab.tsx  
src/components/campaign/tabs/MapsTab.tsx
src/components/campaign/tabs/PlotBoardTab.tsx
src/components/party/PartyRoster.tsx
src/components/party/PartyInventoryView.tsx
src/components/party/DMCharacterNotes.tsx
src/components/dmtools/ConditionsReference.tsx
src/components/dmtools/QuickGenerators.tsx
src/components/dmtools/TravelCalculator.tsx
src/components/dmtools/RandomTables.tsx
src/components/plotboard/PlotThreadCard.tsx
src/components/plotboard/ClueWeb.tsx
src/components/plotboard/RevealTracker.tsx
src/components/maps/MapGallery.tsx
src/components/maps/CampaignMapManager.tsx
```

### Implementation Order

1. **Party Tab** -- highest DM value, uses existing data
2. **Maps Tab** -- most infrastructure already built
3. **DM Tools Tab** -- standalone utility, no complex data dependencies
4. **Plot Board Tab** -- new data model, graph visualization
5. **Faction/Location/Lore enhancements** -- incremental improvements

Each tab will use the same lazy-loading and deferred rendering pattern already established in `CampaignHub.tsx` for zero impact on existing performance.

