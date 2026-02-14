
# Campaign Manager Top Bar -- Condense, Opaque, and Sticky Fix

## Overview
Fix three issues with the Campaign Manager header and tab bar: reduce vertical height, eliminate transparency that lets content bleed through, and ensure the tab bar stays visible while scrolling.

## Root Cause Analysis

The current layout in `CampaignHub.tsx` has this structure:

```text
<CampaignManagerLayout>        (flex column)
  <header>                     (sticky top-0 z-10, semi-transparent bg-obsidian/95)
    breadcrumb + actions
    campaign name + badges
  </header>
  <div overflow-auto>          (the scroll container)
    <Tabs>
      <tab-bar>                (sticky top-0 z-20, bg-obsidian -- but sticks inside scroll container)
      <tab-content>
    </Tabs>
  </div>
</CampaignManagerLayout>
```

**Problem 1 -- Transparency**: The header uses `bg-obsidian/95 backdrop-blur-sm`, which is 95% opaque. Scrolling content bleeds through.

**Problem 2 -- Sticky conflict**: The header is `sticky top-0` in the main flex column, while the tab bar is `sticky top-0` inside the `overflow-auto` div. They each stick independently, but the header's semi-transparency lets the tab content show through it.

**Problem 3 -- Vertical bulk**: The header uses `py-4` padding and `mb-3` spacing between rows, plus `text-lg sm:text-2xl` for the campaign title. This consumes significant vertical space.

## Plan

### 1. Make Header Fully Opaque
- Change `bg-obsidian/95 backdrop-blur-sm` to `bg-obsidian` (solid, no transparency)
- Add a subtle `shadow-md` or `shadow-[0_1px_3px_rgba(0,0,0,0.3)]` to visually separate from content below

### 2. Condense Header Vertically
- Reduce padding from `py-4` to `py-2`
- Reduce horizontal padding from `px-6` to `px-4`
- Reduce spacing between breadcrumb row and title row from `mb-3` to `mb-1`
- Shrink campaign title from `text-lg sm:text-2xl` to `text-base sm:text-xl`
- Reduce badge sizes and avatar sizes slightly
- Tighten the actions bar padding

### 3. Make Tab Bar Fully Opaque with Separator
- The tab bar already uses `bg-obsidian` (good), but add `shadow-sm` for a clear bottom edge
- Ensure the gradient fades on left/right also use solid `from-obsidian` (they already do)

### 4. Fix Sticky Stacking
- The tab bar currently sticks at `top-0` inside the scroll container, which works correctly since it's inside `overflow-auto`. This is actually fine as-is -- the tab bar sticks at the top of the scrollable area.
- Bump the header `z-index` from `z-10` to `z-20` and the tab bar stays at `z-20` so they layer correctly.
- Alternatively, give the mobile tab bar the same treatment.

---

## Technical Details

**Single file to modify:** `src/pages/CampaignHub.tsx`

**Line-by-line changes:**

1. **Line 647** (header tag): Change `bg-obsidian/95 backdrop-blur-sm px-6 py-4` to `bg-obsidian px-4 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.4)]`; bump `z-10` to `z-20`

2. **Line 662** (breadcrumb row): Change `mb-3` to `mb-1`

3. **Line 733** (campaign title): Change `text-lg sm:text-2xl` to `text-base sm:text-xl`

4. **Line 789** (desktop tab bar): Add `shadow-sm` to ensure clear separation; keep `z-20`; confirm `bg-obsidian` is already solid

5. **Line 857** (mobile tab bar): Same treatment -- confirm `bg-obsidian` is solid, add `shadow-sm`

No new files, no database changes, no new dependencies.
