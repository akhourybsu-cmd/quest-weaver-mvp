

# Add Personal Journal Tab and Maximize Desktop Layout

## What's Changing

Two improvements to the player campaign view:

1. **New "Journal" tab** -- A personal notes section where players can write private notes about the campaign (tracking clues, plans, session recaps, etc.). This already has a backend component (`PlayerJournal`) that saves to `session_notes` with `visibility: PRIVATE`, so no database changes are needed.

2. **Fuller desktop layout** -- The tab content area currently uses `h-[calc(100vh-24rem)]` leaving a lot of unused space. We'll reduce the offset so content fills more of the screen, and redesign the Journal to use a two-panel layout (note list + inline editor) instead of a modal dialog, matching how the shared Notes tab already works.

---

## Technical Details

### 1. Add Journal tab to PlayerCampaignView

**File: `src/pages/PlayerCampaignView.tsx`**
- Import `PlayerJournal`
- Add a `<TabsTrigger value="journal">Journal</TabsTrigger>` after the Notes tab
- Add corresponding `<TabsContent>` that renders `<PlayerJournal campaignId={campaign.id} characterId={character?.id} />`

### 2. Redesign PlayerJournal for desktop-first layout

**File: `src/components/player/PlayerJournal.tsx`**
- Replace the dialog-based create/edit flow with a two-panel layout matching `PlayerNotesView`:
  - **Left panel (1/3)**: Scrollable list of journal entries with search, "New Entry" button at top
  - **Right panel (2/3, desktop only)**: Inline editor with title input and full-height textarea for writing/editing, with Save and Delete buttons
  - **Mobile**: Tapping a note opens a bottom Sheet for editing (same pattern as shared notes)
- Use `h-[calc(100vh-12rem)]` for the content area so it fills most of the viewport
- Apply fantasy styling: `font-cinzel` headings, `border-brass` accents on active cards, brass-themed buttons
- Tag all user-drawn objects with `isUserDrawing: true` metadata for the eraser

### 3. Reduce wasted vertical space across all tabs

**File: `src/pages/PlayerCampaignView.tsx`**
- Wrap the `TabsContent` area in a container with `h-[calc(100vh-10rem)]` so all tabs (Quests, NPCs, etc.) use more of the available viewport on desktop
- Remove `pb-0` padding and tighten vertical gaps between the header strip and tabs

**File: `src/components/player/PlayerNotesView.tsx`**
- Update the existing height from `h-[calc(100vh-24rem)]` to `h-[calc(100vh-12rem)]` to match the new taller layout

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/PlayerCampaignView.tsx` | Add Journal tab, wrap tab content in taller viewport container |
| `src/components/player/PlayerJournal.tsx` | Full redesign: two-panel layout, inline editor, mobile sheet, fantasy styling |
| `src/components/player/PlayerNotesView.tsx` | Update height calculation to fill more screen |

No database changes required -- the `session_notes` table already supports private notes with the `visibility: 'PRIVATE'` filter.

