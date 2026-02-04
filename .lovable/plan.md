
# Fix Document Import Dialog Scrolling

## Problem Analysis

The document import dialog has a scrolling issue where users cannot scroll to see all extracted content after AI processing. The current implementation uses:

```tsx
<ScrollArea className="flex-1 min-h-0 mt-2" style={{ maxHeight: 'calc(60vh - 200px)' }}>
```

This calculation is problematic because:
1. The `60vh - 200px` is an arbitrary number that doesn't account for actual header/footer heights
2. On smaller screens or when many entities are extracted, content gets cut off
3. The flex layout isn't properly constraining the ScrollArea to available space

## Solution

Restructure the dialog layout to use proper flex constraints that allow the ScrollArea to fill available space and enable scrolling for all content.

### Technical Changes

**File: `src/components/campaign/DocumentImportDialog.tsx`**

1. **Update DialogContent layout**: Change from `max-h-[90vh] flex flex-col` to use proper overflow handling

2. **Fix ScrollArea container**: Replace the fixed `maxHeight` calculation with flex-based constraints:
   - Remove the inline `style={{ maxHeight: 'calc(60vh - 200px)' }}`
   - Add proper height constraints using `max-h-[50vh] sm:max-h-[55vh]` responsive classes
   - Ensure `overflow-hidden` on parent container

3. **Update the outer flex container**: Ensure the content area properly fills available dialog space with `flex-1 overflow-hidden`

### Code Changes

**Line 134** - Update DialogContent:
```tsx
// Before:
<DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] flex flex-col bg-card" variant="ornaments">

// After:
<DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-card" variant="ornaments">
```

**Line 145** - Update the main content wrapper:
```tsx
// Before:
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">

// After:
<div className="flex-1 flex flex-col min-h-0 overflow-hidden gap-2">
```

**Line 221** - Fix ScrollArea:
```tsx
// Before:
<ScrollArea className="flex-1 min-h-0 mt-2" style={{ maxHeight: 'calc(60vh - 200px)' }}>

// After:
<ScrollArea className="flex-1 min-h-0 max-h-[45vh] sm:max-h-[50vh]">
```

**Line 222** - Ensure proper padding for scroll content:
```tsx
// Before:
<div className="space-y-3 pr-4 pb-2">

// After:
<div className="space-y-3 pr-4 pb-4">
```

### Why This Works

1. **`max-h-[85vh]` on DialogContent**: Ensures the entire dialog never exceeds 85% of viewport height, leaving room for page margins

2. **`overflow-hidden` on DialogContent**: Prevents content from escaping the dialog bounds

3. **`max-h-[45vh] sm:max-h-[50vh]` on ScrollArea**: Provides responsive, viewport-relative constraints that scale appropriately on different screen sizes

4. **Removed inline style**: The Tailwind classes are more maintainable and work better with the component's flex layout

5. **Added `pb-4`**: Ensures the last items have proper padding and aren't cut off at the bottom

### Edge Function Verification

The edge function (`parse-campaign-document`) looks correct and functional. It:
- Accepts document content and filename
- Calls Lovable AI (Gemini 2.5 Flash) for extraction
- Handles rate limits and errors appropriately
- Returns properly structured entities

No changes needed to the edge function.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/campaign/DocumentImportDialog.tsx` | Fix flex layout and ScrollArea height constraints |

## Testing Checklist

After implementation:
1. Open a campaign and click "Import Content (AI)"
2. Upload a document with many entities (NPCs, locations, items, etc.)
3. After processing, verify:
   - All extracted entities are visible by scrolling
   - The scroll bar appears and is functional
   - Content doesn't get cut off at the bottom
   - Footer buttons remain visible and accessible
4. Test on both desktop and mobile viewport sizes
5. Verify the Select All / Deselect All buttons work after scrolling
