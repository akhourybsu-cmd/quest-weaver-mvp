

# Player Hub -- Scrolling, Empty States, and Note Display Improvements

## Problems Identified

### 1. NPC Tab Shows White Screen When Empty
The `PlayerNPCDirectory` component renders a minimal empty state ("No NPCs to display") inside a Card, but the message is tiny and buried. Worse, the `NPCDetailDrawer` is always rendered even with no NPCs, and the empty state has no visual cue (no icon, no explanation about what to expect).

### 2. Quest Tab Returns `null` When Empty
`PlayerQuestTracker` literally returns `null` when there are no quests (line 87-89). This means the entire tab content area is completely empty -- a white void with nothing rendered.

### 3. Note Reader Cuts Off Content
The note content panel uses a `ScrollArea` with `max-h-[60vh]` (line 225), but it's inside a Card with no flex layout. The outer container also uses `max-h-[calc(100vh-12rem)]` (line 140). These fixed heights stack poorly, cutting off long notes. The note list sidebar `ScrollArea` has `flex-1 min-h-0` but has no explicit height boundary since the parent is inside a grid that doesn't constrain itself.

### 4. Tab Content Not Contained Within Viewport
The `PlayerCampaignView` has a large header section (back button, campaign name, character card) before the tabs. When you scroll down to the tabs, the tab content itself (like the 500px ScrollAreas) extends beyond the viewport. The page scrolls as a whole, but the inner ScrollAreas create double-scroll issues.

### 5. Locations, Factions, Lore, and Timeline Empty States
These have basic text-only empty states ("No factions revealed yet", etc.) with no icons, no context about what the tab is for, and no guidance for the player about why it's empty or what to expect.

---

## Implementation Plan

### 1. Fix Quest Tab -- Replace `return null` With Rich Empty State

Replace the `return null` at lines 87-89 of `PlayerQuestTracker.tsx` with a proper empty state card featuring:
- A `ScrollText` icon (already imported)
- Title: "No Active Quests"
- Description: "Your DM hasn't assigned any quests yet. Check back after your next session!"
- Consistent card styling matching the other tabs

### 2. Fix NPC Tab -- Rich Empty State With Icon and Guidance

Update `PlayerNPCDirectory.tsx` empty state (lines 127-130) to include:
- A `Users` icon (already imported)
- Title: "No Known NPCs"
- Description: "You haven't met any NPCs yet. As your DM introduces characters, they'll appear here."
- Remove the search bar and header when there are no NPCs (show a clean, centered empty state instead)

### 3. Fix All Other Empty States (Locations, Factions, Lore, Timeline)

Update each component's empty state to follow a consistent pattern:
- Centered icon (relevant to the tab)
- Bold title
- Helpful description text explaining what the player should expect
- All wrapped in a dashed-border Card for visual consistency

Components and their empty state messages:
- **Locations**: MapPin icon, "No Discovered Locations", "Locations will appear here as you explore the world."
- **Factions**: Shield icon, "No Known Factions", "Factions will be revealed as you encounter them in your adventures."
- **Lore**: BookOpen icon, "No Shared Lore", "Your DM will share lore entries as the story unfolds."
- **Timeline**: Clock icon, "No Timeline Events", "Key events will appear here as your campaign progresses."

### 4. Fix Note Display -- Full Content Readable With Proper Scrolling

Redesign `PlayerNotesView.tsx` layout:
- Remove the rigid `max-h-[calc(100vh-12rem)]` on the outer container
- On mobile: Switch from side-by-side grid to a stacked layout where clicking a note opens a full-screen-like view (using a Dialog or Sheet) so the full note is readable
- On desktop: Keep the two-column layout but fix the ScrollArea heights to use `h-[calc(100vh-20rem)]` (accounting for header, tabs, and character card) so both the list and content panel are properly bounded and fully scrollable
- Ensure the note content `ScrollArea` fills the available space without double-scroll issues
- Add a "Back to list" button on mobile when viewing a note

### 5. Improve Tab Content Containment

Update the scroll behavior so content stays within bounds:
- Remove the fixed `h-[500px]` on ScrollAreas inside NPC, Locations, Factions, and Lore components and replace with responsive `h-[calc(100vh-24rem)]` that adapts to the available viewport
- Remove the fixed `h-[300px]` on the Quest ScrollArea and use a similar responsive calculation
- This ensures content never overflows the viewport regardless of header height

---

## Files Changed

| File | Changes |
|------|---------|
| `src/components/player/PlayerQuestTracker.tsx` | Replace `return null` with rich empty state card |
| `src/components/player/PlayerNPCDirectory.tsx` | Upgrade empty state with icon, title, and description |
| `src/components/player/PlayerLocationsView.tsx` | Upgrade empty state with icon and guidance |
| `src/components/player/PlayerFactionsView.tsx` | Upgrade empty state with icon and guidance |
| `src/components/player/PlayerLoreView.tsx` | Upgrade empty state with icon and guidance |
| `src/components/player/PlayerTimelineView.tsx` | Upgrade empty state with icon and guidance |
| `src/components/player/PlayerNotesView.tsx` | Fix layout heights, add mobile note dialog, fix content scrolling |

### Empty State Design Pattern

All empty states will follow this consistent structure:

```text
+----------------------------------+
|           (dashed border)        |
|                                  |
|         [Relevant Icon]          |
|         (48x48, muted)           |
|                                  |
|     "No [Items] Yet"             |
|     (font-cinzel, semibold)      |
|                                  |
|  "Helpful context about what     |
|   this tab shows and when        |
|   content will appear."          |
|     (text-sm, muted)             |
|                                  |
+----------------------------------+
```

No code or data changes are required -- this is purely a UI/UX polish pass.

