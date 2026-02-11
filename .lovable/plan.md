

# Bulk Visibility Toggles + Alignment Display Fix

## Alignment Answer

**NPC alignment is currently NOT shown to players** (or anyone in the detail view). The data is fetched from the database in the player NPC directory, but the UI never renders it. The NPCDetailDrawer also has no alignment display. So right now it's invisible to everyone except in the NPC editor form.

**Recommendation**: Show alignment in the NPC detail drawer for DMs only by default. Alignment is typically metagame knowledge in D&D -- players usually learn alignment through roleplay, not as a stat. We can add it to the DM section of the detail drawer.

---

## Bulk Visibility Toggle Feature

### What Changes

Add a "selection mode" to 4 asset directories (NPCs, Quests, Locations, Factions) that lets DMs:
1. Click a "Bulk Edit" button to enter selection mode
2. Check/uncheck multiple items via checkboxes on each card
3. Use a floating action bar to "Reveal to Players" or "Hide from Players" in one click
4. Exit selection mode when done

### How It Works

When the DM clicks "Bulk Edit":
- Each NPC/Quest/Location/Faction card gains a checkbox in the top-left corner
- A "Select All" / "Deselect All" option appears in the toolbar
- A floating bottom bar shows: "[X] selected | Reveal to Players | Hide from Players | Cancel"
- Clicking Reveal/Hide runs a single batched database update on all selected IDs
- A toast confirms "5 NPCs revealed to players" or similar

### Files to Create/Modify

| File | Change |
|------|--------|
| `src/components/campaign/BulkVisibilityBar.tsx` | **New** -- Reusable floating action bar component with Reveal/Hide/Cancel buttons |
| `src/components/npcs/EnhancedNPCDirectory.tsx` | Add selection mode state, checkboxes on cards, integrate BulkVisibilityBar |
| `src/components/npcs/NPCDetailDrawer.tsx` | Add alignment display in Overview tab (DM-only section) |
| `src/components/campaign/tabs/QuestsTabUpdated.tsx` | Add selection mode + bulk visibility for quests |
| `src/components/campaign/tabs/LocationsTab.tsx` | Add selection mode + bulk visibility for locations (uses `discovered` field) |
| `src/components/factions/FactionDirectory.tsx` | Add selection mode + bulk visibility for factions |

### Design Details

**Floating Action Bar** (appears at bottom of screen when items are selected):
```text
+------------------------------------------------------------------+
|  [checkbox] 5 selected    [Eye] Reveal to Players   [EyeOff] Hide from Players   [X] Cancel  |
+------------------------------------------------------------------+
```
- Styled with brass accents and `font-cinzel` to match the app
- Fixed to bottom of the content area, not the viewport
- Semi-transparent dark background with backdrop blur

**Card Checkboxes in Selection Mode**:
- Checkbox appears in the top-left corner of each card with a subtle transition
- Already-visible items show a small Eye icon badge so DMs can see current state at a glance
- Cards are still clickable for detail view (checkbox area is separate)

**Alignment in NPC Detail Drawer**:
- Added to the "Quick Facts" card in the Overview tab
- Only shown when alignment has a value
- Displayed as a Badge with a subtle icon, visible to DMs only (not shown in player view)

### Technical Approach

The bulk update uses a single Supabase query with `.in('id', selectedIds)`:
```typescript
await supabase
  .from("npcs")
  .update({ player_visible: true })
  .in("id", selectedIds);
```
This is efficient -- one DB call regardless of how many items are selected.

