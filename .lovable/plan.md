
# Quest Tab Button & Dropdown Menu Fixes

## Issues Identified

### Issue 1: Quest Tab "New Quest" Button Not Working

After thorough investigation, the Quest tab in CampaignHub uses `QuestsTabUpdated` component (line 88 in CampaignHub.tsx). The button code at line 354 appears correct:

```tsx
<Button onClick={() => setDialogOpen(true)}>
  <Plus className="w-4 h-4 mr-2" />
  New Quest
</Button>
```

**Root Cause**: The `QuestDialog` component is receiving `questToEdit` as a prop, but when opening for a new quest, the `questToEdit` state isn't being explicitly reset to `undefined`. When clicking "New Quest" after viewing a quest detail, the stale `questToEdit` value may persist.

Looking at the code flow:
1. User clicks a quest card -> `handleQuestClick` sets `selectedQuest`
2. User clicks "Edit" from detail dialog -> `handleEditQuest` sets `questToEdit = selectedQuest` and opens dialog
3. User saves/closes dialog
4. User clicks "New Quest" -> `setDialogOpen(true)` but `questToEdit` still has the old value

**Fix**: Reset `questToEdit` to `undefined` when opening the dialog for a new quest.

### Issue 2: Dropdown Menus Not Staying Open

The Select dropdowns (in NPC filters, location sorters, etc.) close immediately when clicked. This is a common issue with Radix UI Select components when they're nested inside clickable containers or scroll areas.

**Root Cause**: The Select components in `EnhancedNPCDirectory` are inside a Card that has its own click handlers. When the Select dropdown opens and you click on items, the click event bubbles up to parent elements, causing unwanted behavior.

Additionally, the `NPCFilterPanel` renders Select components that may be affected by the Sheet component's focus management when on mobile.

**Fixes Needed**:
1. Add `onPointerDownOutside` handler to SelectContent to prevent closing on outside pointer events
2. Ensure proper z-index layering for dropdown content
3. Stop event propagation where Select components are inside clickable containers

---

## Technical Changes

### File 1: `src/components/campaign/tabs/QuestsTabUpdated.tsx`

**Change**: Reset `questToEdit` when opening dialog for new quest

Update the "New Quest" button click handler to explicitly clear any previously edited quest:

```tsx
// Current (line 354):
<Button onClick={() => setDialogOpen(true)}>

// Fix:
<Button onClick={() => {
  setQuestToEdit(undefined);
  setDialogOpen(true);
}}>
```

### File 2: `src/components/ui/select.tsx`

**Change**: Add `onPointerDownOutside` handler to prevent premature closing

Update `SelectContent` to include handlers that prevent the dropdown from closing unexpectedly:

```tsx
const SelectContent = React.forwardRef<...>(
  ({ className, children, position = "popper", ...props }, ref) => (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(...)}
        position={position}
        onPointerDownOutside={(e) => {
          // Prevent closing when clicking inside the trigger area
          const target = e.target as HTMLElement;
          if (target?.closest('[data-radix-select-trigger]')) {
            e.preventDefault();
          }
        }}
        {...props}
      >
```

### File 3: `src/components/npcs/EnhancedNPCDirectory.tsx`

**Change**: Stop event propagation on the Sort dropdown container

Wrap the Sort select in a container that stops propagation:

```tsx
// Around line 377:
<div onClick={(e) => e.stopPropagation()}>
  <Select value={sortBy} onValueChange={setSortBy}>
    ...
  </Select>
</div>
```

### File 4: `src/components/npcs/NPCFilterPanel.tsx`

**Change**: Add event propagation stopping for Select components inside Sheet

The Filter panel renders inside a Sheet on mobile. We need to ensure clicks inside Select don't close the Sheet:

```tsx
// Line 122-139 (Faction Select):
<Select
  value={currentFilters.factionId || "all"}
  onValueChange={(value) =>
    onFilterChange({ ...currentFilters, factionId: value === "all" ? null : value })
  }
>
  <SelectTrigger onClick={(e) => e.stopPropagation()}>
    ...
  </SelectTrigger>
  ...
</Select>

// Same for Location Select (lines 145-162)
```

### File 5: `src/components/quests/QuestLog.tsx` (Alternative Quest Component)

**Change**: Same fix for the "Add Quest" button

The QuestLog component (used by QuestsTab.tsx) also needs the same fix:

```tsx
// Around line 315:
<Button size="sm" onClick={() => {
  setQuestToEdit(null);
  setDialogOpen(true);
}}>
  <Plus className="w-4 h-4 mr-2" />
  Add Quest
</Button>
```

---

## Summary of Changes

| File | Change | Purpose |
|------|--------|---------|
| `QuestsTabUpdated.tsx` | Reset `questToEdit` before opening dialog | Fix new quest creation |
| `QuestLog.tsx` | Reset `questToEdit` before opening dialog | Fix new quest creation in alternate view |
| `select.tsx` | Add `onPointerDownOutside` handler | Prevent dropdown closing prematurely |
| `EnhancedNPCDirectory.tsx` | Wrap Sort select with stopPropagation | Prevent card click interference |
| `NPCFilterPanel.tsx` | Add stopPropagation to SelectTrigger | Prevent Sheet interference on mobile |

---

## Testing Checklist

After implementation:
1. Navigate to a campaign's Quest tab
2. Click "New Quest" button - dialog should open with empty fields
3. Create a quest and save it
4. Click on the quest to view details
5. Click "Edit" to edit it
6. Close the dialog
7. Click "New Quest" again - should open with empty fields (not the previously edited quest)
8. Go to NPC tab and test the Sort dropdown - should stay open when clicking
9. Test Filter panel on mobile (use responsive mode) - Select dropdowns should work properly
10. Test Location filters and other Select components throughout the app

