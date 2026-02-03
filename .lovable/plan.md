
# Lore Integration Analysis: What's Connected and What's Missing

## Executive Summary

After a thorough review of the Campaign Manager's data architecture, I've identified significant gaps in how various campaign components connect to the Lore system. The Lore system (`lore_pages`) has its own linking mechanism via `lore_links` and `lore_backlinks` tables, but most campaign assets (Factions, NPCs, Locations, Items, Quests) exist in **completely separate tables** with no bidirectional connection to Lore.

---

## Current Architecture: Two Parallel Systems

### System 1: Core Campaign Assets
These are stored in dedicated tables and managed through their own editors:

| Asset | Table | Dedicated Editor |
|-------|-------|------------------|
| Factions | `factions` | FactionEditor.tsx |
| NPCs | `npcs` | EnhancedNPCEditor.tsx |
| Locations | `locations` | LocationDialog.tsx |
| Quests | `quests` | QuestDialog.tsx |
| Items | `items` | ItemEditor.tsx |
| Notes | `session_notes` | NoteEditor.tsx |

### System 2: Lore System
Rich world-building content stored in `lore_pages` with category-based creators:

| Category | Creator Component |
|----------|-------------------|
| Regions | RegionCreator.tsx |
| Factions | FactionCreator.tsx |
| NPCs | NPCCreator.tsx |
| History | HistoryCreator.tsx |
| Myth & Faith | MythCreator.tsx |
| Magic | MagicCreator.tsx |

---

## The Disconnect Problem

### Factions: Complete Disconnect
- **`factions` table**: Stores name, description, motto, influence_score, goals, banner_url, tags
- **`lore_pages` (category: "factions")**: Stores rich lore content with alignment, colors, power level, headquarters region links
- **Problem**: These are **two completely separate systems** with no link between them
- **Result**: DMs create factions in the Factions tab AND create faction lore in the Lore tab separately

### NPCs: Partial Disconnect  
- **`npcs` table**: Stores name, pronouns, role_title, public_bio, gm_notes, secrets, portrait_url, tags, status, alignment, `location_id`, `faction_id`
- **`lore_pages` (category: "npcs")**: Stores rich NPC lore with race, personality traits, voice notes, secrets, home region
- **Connection that exists**: NPCs have `location_id` (links to locations) and `faction_id` (links to factions)
- **Problem**: No link between `npcs` table and `lore_pages` NPC entries
- **Result**: Operational NPC data is separate from rich biographical lore

### Locations: Partial Disconnect
- **`locations` table**: Stores name, description, location_type, parent_location_id, details JSON, coordinates, discovered status
- **`lore_pages` (category: "regions")**: Stores rich region lore with population, government, climate, exports/imports, travel notes
- **Connection that exists**: `locations.parent_location_id` creates hierarchy
- **Problem**: No link between `locations` table and `lore_pages` region entries
- **Positive**: LocationDialog already loads related quests and notes via `note_links` table

### Quests: Minimal Connection
- **`quests` table**: Has `location_id`, `faction_id`, `quest_giver_id` (NPC)
- **Connection that exists**: Links to locations, factions, and NPCs
- **Problem**: No link to Lore system for historical context or backstory

### Items: No Connection
- **`items` table**: Stores item data with properties JSON
- **Problem**: No link to any other entity or Lore

---

## What Does Work

### Lore Internal Links
The Lore system has its own linking via markdown syntax:
- `[[Page Title]]` links to other lore pages
- `@NPCName` references NPCs (as text labels only)
- `#LocationName` references locations
- `%FactionName` references factions  
- `!QuestName` references quests
- `$ItemName` references items

These are parsed and stored in `lore_links` table with:
- `source_page`: The lore page containing the link
- `target_type`: NPC, LOCATION, FACTION, QUEST, ITEM, LORE
- `target_id`: The actual entity ID (often NULL - just stores label)
- `label`: The text of the reference

**Problem**: These links are usually **one-way and unresolved** - they store the label but don't actually look up the real entity ID.

### Note Links
The `note_links` table connects session notes to entities:
- Can link notes to LOCATION, NPC, QUEST, FACTION, ITEM
- LocationDialog loads related notes via this system
- **This is the only robust cross-entity linking system**

---

## Technical Gaps Summary

| Component | Links TO Lore | Links FROM Lore | Linked to Other Assets |
|-----------|---------------|-----------------|------------------------|
| Factions | None | Text-only via `%name` | None |
| NPCs | None | Text-only via `@name` | location_id, faction_id |
| Locations | None | Text-only via `#name` | parent_location_id |
| Quests | None | Text-only via `!name` | location_id, faction_id, quest_giver_id |
| Items | None | Text-only via `$name` | None |
| Notes | None | None | via note_links table |

---

## Recommended Solution: Unified Entity Linking

### Phase 1: Add `lore_page_id` to Core Tables
Add optional foreign key to connect assets with their lore entries:

```text
ALTER TABLE factions ADD COLUMN lore_page_id UUID REFERENCES lore_pages(id);
ALTER TABLE npcs ADD COLUMN lore_page_id UUID REFERENCES lore_pages(id);
ALTER TABLE locations ADD COLUMN lore_page_id UUID REFERENCES lore_pages(id);
ALTER TABLE quests ADD COLUMN lore_page_id UUID REFERENCES lore_pages(id);
ALTER TABLE items ADD COLUMN lore_page_id UUID REFERENCES lore_pages(id);
```

### Phase 2: Update Editors to Link Lore Pages
1. **FactionEditor**: Add "Link to Lore" dropdown showing lore_pages with category="factions"
2. **EnhancedNPCEditor**: Add "Link to Lore" dropdown for NPC lore pages
3. **LocationDialog**: Add "Link to Lore" dropdown for region lore pages
4. **QuestDialog**: Add "Link to Lore" dropdown
5. **ItemEditor**: Add "Link to Lore" dropdown

### Phase 3: Resolve Lore Link References
Update LoreEditor to actually resolve `@NPCName` to real entity IDs:
- When saving, look up entities by name in their respective tables
- Store the actual `target_id` in `lore_links` instead of NULL
- This enables true bidirectional navigation

### Phase 4: Display Linked Lore in Asset Views
Update detail views to show linked lore content:
- FactionDirectory detail dialog: Show linked lore page content
- NPCDetailDrawer: Show linked lore biography
- LocationDialog: Show linked region lore
- QuestDetailDialog: Show linked lore context

### Phase 5: Auto-Create Lore from Assets
Add "Generate Lore Entry" button to editors:
- Creates a lore_page with matching category
- Pre-fills data from the asset
- Auto-links the new lore page to the asset

---

## Files to Modify

### Database Migration
- Add `lore_page_id` column to 5 tables

### Editors to Update
| File | Change |
|------|--------|
| `FactionEditor.tsx` | Add lore page link selector |
| `FactionDirectory.tsx` | Display linked lore in detail view |
| `EnhancedNPCEditor.tsx` | Add lore page link selector |
| `NPCDetailDrawer.tsx` | Display linked lore |
| `LocationDialog.tsx` | Add lore page link selector |
| `QuestDialog.tsx` | Add lore page link selector |
| `QuestDetailDialog.tsx` | Display linked lore |
| `ItemEditor.tsx` | Add lore page link selector |

### Lore System Updates
| File | Change |
|------|--------|
| `LoreEditor.tsx` | Resolve entity references to actual IDs |
| `LorePageView.tsx` | Show linked assets (reverse lookup) |
| `LoreGraph.tsx` | Include actual entity links in graph |

### New Shared Components
- `LoreLinkSelector.tsx`: Reusable dropdown for linking lore pages

---

## Implementation Priority

1. **High Priority - Factions**: Most commonly requested, complete disconnect currently
2. **High Priority - NPCs**: Rich biographical data split between two systems  
3. **Medium Priority - Locations**: Already has some linking via parent_location_id
4. **Medium Priority - Quests**: Has faction/NPC/location links but no lore context
5. **Lower Priority - Items**: Rarely need extensive lore

---

## Outcome

After implementation:
- DMs can create a faction in the Factions tab and link it to rich lore content
- Clicking on a faction shows both operational data AND linked lore
- Creating a faction can auto-generate a lore page stub
- Lore pages show what entities they're connected to
- The LoreGraph visualization shows actual entity connections
- Cross-entity navigation becomes seamless
