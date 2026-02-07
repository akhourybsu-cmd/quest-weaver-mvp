
# Player Campaign View -- Missing Tabs and Visibility Audit

## Status: ✅ COMPLETE

All phases implemented successfully.

## What Was Done

### Phase 1: Database ✅
- Added `player_visible` boolean column (default `false`) to `factions` table

### Phase 2: Player Components ✅
- Created `PlayerFactionsView.tsx` -- read-only faction cards with search, influence bars, goals, realtime updates
- Created `PlayerLoreView.tsx` -- read-only lore codex with category filters, markdown rendering, realtime updates
- Created `PlayerTimelineView.tsx` -- vertical timeline with event icons, date display, realtime updates

### Phase 3: Tab Layout ✅
- Updated `PlayerCampaignView.tsx` from 4 to 7 tabs: Quests | NPCs | Locations | Factions | Lore | Timeline | Notes
- Changed tab bar from `grid-cols-4` to scrollable flex layout for mobile

### Phase 4: DM Visibility Toggle ✅
- Added `player_visible` toggle to `FactionEditor.tsx` with Eye icon and descriptive label
- State properly initializes from existing faction data and resets for new factions

## Data Note
All NPCs, locations, quests, and factions currently have visibility OFF. The DM must toggle visibility from the Campaign Manager for content to appear in the player view.
