

## Beta Tools Visual & Readability Pass

### Problems Identified

1. **Header bar uses `bg-brand-obsidian`** (dark background) regardless of light/dark mode, creating jarring contrast and making text unreadable in light mode since `text-foreground` is dark in light mode.

2. **Hero section gradient** (`from-brand-obsidian to-card`) creates a near-black-to-parchment transition in light mode that clashes with the parchment aesthetic. Text inside uses `text-foreground` which is dark — barely visible on the dark obsidian background.

3. **Sidebar** uses `bg-card` which is fine, but the active state uses `bg-accent` / `text-accent-foreground` (purple tints) — these can be low-contrast on parchment.

4. **Generator form cards** (`border-border bg-card`) lack the parchment warmth. The `GeneratingSkeleton`, result cards, and campaign context card all feel flat/generic.

5. **Result renderer** — `StatBox` uses `bg-muted` which in light mode is a washed-out parchment; the stat labels are `text-muted-foreground` and values are small. Group headers use `text-muted-foreground` which is quite faint.

6. **Asset cards** (`BetaAssetCard`) — status badges use custom colors that may not contrast well on parchment. The action buttons are ghost-style and nearly invisible.

7. **Library page** — filter controls, sort dropdown, and empty states all use `text-muted-foreground` which is low-contrast (HSL 30 15% 40% in light mode).

### Plan

**A. Fix header bar** (BetaToolsLayout.tsx)
- Replace `bg-brand-obsidian` with `bg-card border-b border-brand-brass/30` to match the parchment feel with a subtle brass accent line, similar to how other page headers work in the app.

**B. Fix hero section** (BetaTools.tsx)
- Replace the `from-brand-obsidian to-card` gradient with a parchment-to-card gradient using the `fantasy-parchment` pattern or a warm gradient like `from-card to-muted/50`.
- Add a brass top-border accent (like `fantasy-section::before`).
- Ensure all text uses proper foreground colors against the lighter background.

**C. Warm up the generator page** (BetaToolsGenerator.tsx)
- Add the `fantasy-section` class or brass accent to the tool header area.
- Use `font-cinzel` consistently for section titles.

**D. Improve result renderer contrast** (BetaResultRenderer.tsx)
- StatBox: add a subtle brass border and warmer background.
- Group headers: bump from `text-muted-foreground` to `text-foreground` or `text-secondary` for better visibility.
- Add brass left-border accents to group sections (like `lore-section-title::before`).

**E. Warm up asset cards** (BetaAssetCard.tsx)
- Add the `fantasy-section` top brass accent or a subtle brass border-left on hover.
- Make action buttons always visible (not just on hover) for better discoverability.

**F. Sidebar parchment feel** (BetaToolsSidebar.tsx)
- Add a subtle brass top accent or use `bg-card` with a faint parchment grain overlay.
- Improve category label contrast.

**G. Library & filters** (BetaToolsLibrary.tsx, BetaLibraryFilters.tsx)
- Ensure empty state text and filter labels are readable.
- Add brass accents to section headers.

**H. Editor & Import dialogs** (BetaAssetEditor.tsx, BetaImportDialog.tsx)
- Apply `fantasy-border-ornaments` to dialog content for consistency with other dialogs in the app.
- Ensure form labels and field text have sufficient contrast.

### Files to modify
- `src/components/beta-tools/BetaToolsLayout.tsx` — header bar
- `src/components/beta-tools/BetaToolsSidebar.tsx` — sidebar warmth
- `src/components/beta-tools/BetaResultRenderer.tsx` — stat boxes, group headers
- `src/components/beta-tools/BetaAssetCard.tsx` — card styling, action visibility
- `src/components/beta-tools/BetaGeneratorForm.tsx` — card warmth, skeleton
- `src/components/beta-tools/BetaLibraryFilters.tsx` — minor contrast fixes
- `src/components/beta-tools/BetaAssetEditor.tsx` — fantasy dialog borders
- `src/components/beta-tools/BetaImportDialog.tsx` — fantasy dialog borders
- `src/components/beta-tools/MissingLoreDetector.tsx` — card warmth
- `src/pages/BetaTools.tsx` — hero section gradient, card warmth
- `src/pages/BetaToolsGenerator.tsx` — tool header accent
- `src/pages/BetaToolsLibrary.tsx` — section header accents

