
# Complete Overhaul: AI Document Import Dialog

## Problem Summary

The AI document import results page has critical usability issues:
1. **Content not scrollable** - Users cannot scroll to view all extracted entities
2. **Layout overflow** - Content extends beyond the dialog bounds
3. **ScrollArea height constraints are incorrect** - Using `flex-1` with `max-h-[45vh]` doesn't work properly with Radix ScrollArea

## Root Cause Analysis

The Radix UI ScrollArea component requires a **defined height** (not max-height with flex) to enable scrolling. The current implementation uses:

```tsx
<ScrollArea className="flex-1 min-h-0 max-h-[45vh] sm:max-h-[50vh]">
```

This conflicts with the flex layout because:
- `flex-1` tells it to grow to fill space
- `max-h-[45vh]` caps it, but Radix ScrollArea's internal Viewport uses `h-full w-full`
- When the parent doesn't have a resolved height, the Viewport expands infinitely instead of constraining and scrolling

**Working pattern** (from `QuestDetailDialog`):
```tsx
<ScrollArea className="h-[50vh] sm:h-[60vh]">
```
Fixed heights work correctly with Radix ScrollArea.

---

## Solution: Complete Layout Restructure

### Approach

1. **Replace flex-based height calculation with explicit heights**
2. **Restructure dialog into fixed-height sections** (header, body, footer)
3. **Use proper height constraints for ScrollArea**
4. **Add better visual organization for many entities**
5. **Ensure footer buttons are always visible and accessible**

---

## Technical Changes

### File: `src/components/campaign/DocumentImportDialog.tsx`

#### Change 1: DialogContent Layout

Update the dialog container to use a more predictable height structure:

```tsx
// Line 134 - Update DialogContent
<DialogContent 
  className="w-[95vw] max-w-2xl h-[85vh] max-h-[700px] flex flex-col bg-card" 
  variant="ornaments"
>
```

- Use `h-[85vh]` with `max-h-[700px]` to ensure the dialog has a known height
- Remove `overflow-hidden` from here (let children handle overflow)

#### Change 2: Remove Gap from Main Container

```tsx
// Line 145 - Simplify the content wrapper
<div className="flex-1 flex flex-col min-h-0">
```

Remove `gap-2` since we'll handle spacing within sections.

#### Change 3: Fix ScrollArea with Explicit Height

The most critical fix - replace the current ScrollArea with proper height constraints:

```tsx
// Line 221 - Replace the ScrollArea
<div className="flex-1 min-h-0 overflow-hidden">
  <ScrollArea className="h-full">
    <div className="space-y-3 pr-4 pb-4">
      {categories.map((category) => {
        // ... existing category rendering
      })}
    </div>
  </ScrollArea>
</div>
```

**Key insight**: Wrap ScrollArea in a `div` with `flex-1 min-h-0 overflow-hidden`. This div will properly calculate its height from the flex container, then ScrollArea uses `h-full` to fill it.

#### Change 4: Reorganize Entity Selection Section

Restructure the entity selection area for better hierarchy:

```tsx
{/* Entity Selection - Full restructure for scrollability */}
{hasEntities && !isProcessing && (
  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
    {/* Fixed Header: Selection Controls */}
    <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border bg-muted/30 px-3 rounded-t-lg">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30">
          {selectedCount} of {totalCount} selected
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={selectAll}>Select All</Button>
        <Button variant="ghost" size="sm" onClick={deselectAll}>Deselect All</Button>
      </div>
    </div>

    {/* Scrollable Content Area */}
    <div className="flex-1 min-h-0 overflow-hidden border-x border-border">
      <ScrollArea className="h-full">
        <div className="space-y-3 p-3">
          {categories.map((category) => {
            // ... category collapsibles
          })}
        </div>
      </ScrollArea>
    </div>

    {/* Import Progress - Fixed at bottom of content area */}
    {isImporting && (
      <div className="flex-shrink-0 py-4 border-t border-border bg-muted/30 px-3 rounded-b-lg">
        <div className="flex items-center gap-2 mb-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-foreground font-medium">Importing entities...</span>
        </div>
        <Progress value={progress} />
      </div>
    )}
  </div>
)}
```

#### Change 5: Footer Always Visible

Update footer to be properly positioned:

```tsx
{/* Footer Actions - Always visible, sticky at bottom */}
{hasEntities && !isProcessing && (
  <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border bg-card">
    <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground w-full sm:w-auto">
      Upload Different File
    </Button>
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
        Cancel
      </Button>
      <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting} className="flex-1 sm:flex-none">
        {isImporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Import {selectedCount}
          </>
        )}
      </Button>
    </div>
  </div>
)}
```

Remove the negative margin hack (`-mx-6 -mb-6`) and keep footer within normal flow.

---

## Visual Layout Diagram

```text
+----------------------------------+
|  Dialog Header (fixed)           |
|  - Title & Description           |
+----------------------------------+
|  Upload Area / Processing        |  <- Only visible during upload/processing
|  OR                              |
+----------------------------------+
|  Selection Header (fixed)        |  <- "3 of 12 selected" + buttons
+----------------------------------+
|  [SCROLLABLE CONTENT AREA]       |
|  ┌───────────────────────────┐   |
|  │ ▶ NPCs (3/5)              │   |
|  │   └ NPC Card 1            │   |
|  │   └ NPC Card 2            │   |
|  │ ▶ Locations (2/4)         │   |  <- This area scrolls
|  │   └ Location Card 1       │   |
|  │   └ Location Card 2       │   |
|  │ ▶ Items (1/3)             │   |
|  │   ...                     │   |
|  └───────────────────────────┘   |
+----------------------------------+
|  Import Progress (if importing)  |
+----------------------------------+
|  Footer Actions (fixed)          |
|  [Upload Different] [Cancel] [Import 6]
+----------------------------------+
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/campaign/DocumentImportDialog.tsx` | Complete layout restructure with proper ScrollArea height handling |

---

## Testing Checklist

After implementation:
1. Upload a document that extracts many entities (10+ across categories)
2. Verify the ScrollArea scrolls smoothly
3. Verify all entities are visible when scrolling to the bottom
4. Verify footer buttons remain visible at all times
5. Test Select All / Deselect All functionality after scrolling
6. Test on mobile viewport - ensure responsive behavior works
7. Test with very few entities (1-2) - ensure layout doesn't break
8. Test the expand/collapse category behavior while scrolling
9. Verify import progress bar displays correctly during import
