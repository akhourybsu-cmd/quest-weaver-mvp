

# Beta Tools: Round 3 Optimizations

## Changes

### 1. Library Loading Skeleton (BetaToolsLibrary.tsx)
Replace the plain "Loading..." text with a grid of skeleton cards matching the asset card layout. Uses the existing `Skeleton` component.

### 2. Category Cards Link to Tools (BetaTools.tsx)
Make the "All Categories" cards on the homepage clickable -- navigate to the first active tool in that category. Currently they're static/decorative.

### 3. Sidebar Search Filter (BetaToolsSidebar.tsx)
Add a small search input at the top of the sidebar that filters the tool list in real-time. With 30+ tools, scrolling through categories is cumbersome.

### 4. Export Asset as Markdown (BetaAssetCard.tsx + new util)
Add a "Copy as Markdown" button to asset cards. Generates a formatted markdown string from the asset data (name, type, all fields) and copies to clipboard. DMs frequently paste generated content into VTTs or notes apps.

### 5. Regenerate with Refinement Prompt (BetaGeneratorForm.tsx)
After generating a result, show a small "Refine" input below the result that lets users type a follow-up like "make it darker" or "change the setting to underdark". This calls the same edge function but passes the current result as `existing_fields` with the refinement as `user_prompt`.

### 6. Responsive Filter Improvements (BetaLibraryFilters.tsx)
Stack filters vertically on mobile with full-width selects. Currently they wrap awkwardly.

## Files to Update

| File | Change |
|------|--------|
| `src/pages/BetaToolsLibrary.tsx` | Skeleton loading grid |
| `src/pages/BetaTools.tsx` | Clickable category cards |
| `src/components/beta-tools/BetaToolsSidebar.tsx` | Search filter input |
| `src/components/beta-tools/BetaAssetCard.tsx` | Copy-as-markdown action |
| `src/components/beta-tools/BetaGeneratorForm.tsx` | Refinement prompt after generation |
| `src/components/beta-tools/BetaLibraryFilters.tsx` | Mobile-responsive layout |

No backend or migration changes needed.

