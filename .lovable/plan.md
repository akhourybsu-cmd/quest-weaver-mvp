

# Beta Tools Landing Page & Sidebar Refinement

## Summary
Polish the Beta Tools landing page and sidebar to feel more premium, active, and clearly sandboxed. No structural redesign -- just visual hierarchy, depth, interaction quality, and content improvements across 3 files.

## Changes

### 1. Landing Page (`src/pages/BetaTools.tsx`) -- Full rewrite of page content

**Hero Section:**
- Wrap in an elevated panel with `bg-gradient-to-b from-amber-950/40 to-background border border-amber-500/15 rounded-xl` and inner padding
- Add subtle radial glow behind the title using a pseudo-element or div
- Add quick-launch chips below CTAs: "Create NPC", "Build Monster", "Generate Quest", "Make Settlement" as small amber-outlined buttons linking to respective generators
- Improve copy as specified

**Library Stats Strip** (new section after hero):
- Fetch counts from `beta_assets` grouped by status: total, drafts, imported, favorites
- Display as 4 compact stat cards in a row: `📦 12 Created | ✏️ 5 Drafts | ⬆️ 3 Imported | ⭐ 4 Favorites`
- Uses small `Card` components with amber accent borders, icons, and counts
- Shows zeros gracefully with encouraging microcopy when empty

**Sandbox Banner:**
- Elevate with stronger amber border, slightly darker bg, and a left accent bar (`border-l-4 border-l-amber-500`)
- Heading: "Sandbox Mode" as bold amber text
- Body copy refined per spec

**Recent Creations** (moved above Featured Tools):
- Show even when empty with a friendly empty state: "Your workshop is empty. Start creating to see your work here."
- Add staggered `animate-fade-in` to cards

**Featured Tools Cards:**
- Add output hints as tiny tags below description (e.g., NPC Generator shows "name · personality · goals · secrets")
- Stronger hover: `hover:scale-[1.02] hover:shadow-amber-500/10 hover:shadow-xl` with `transition-all duration-200`
- Add "Open Tool →" text that appears on hover next to the arrow icon
- Each card gets an `outputHints` array added to the tool registry

**Categories Section:**
- Keep as-is, minor spacing improvements

### 2. Tool Registry (`src/components/beta-tools/toolRegistry.ts`)

Add `outputHints: string[]` to the `BetaTool` interface and populate for the 8 hero tools:
- NPC: `['name', 'personality', 'goals', 'secrets', 'faction ties']`
- Monster: `['stat block', 'abilities', 'tactics', 'habitat', 'lore']`
- Quest: `['objectives', 'complications', 'twists', 'rewards']`
- Settlement: `['NPCs', 'economy', 'atmosphere', 'plot hooks']`
- Magic Item: `['properties', 'lore', 'quirks', 'attunement']`
- World Event: `['consequences', 'factions', 'timeline', 'rumors']`
- Battle Map: `['terrain', 'cover', 'hazards', 'tactical notes']`
- Missing Lore Detector: `['gap analysis', 'fix suggestions', 'priority ranking']`

Empty array for coming_soon tools.

### 3. Sidebar (`src/components/beta-tools/BetaToolsSidebar.tsx`)

- Add a visual separator (thin amber line or extra spacing) between the top nav group (Workshop / Library) and the category groups
- Increase spacing between category groups: add `mt-2` or `pt-2` to each `SidebarGroup`
- Active item: stronger treatment -- `bg-amber-500/20 text-amber-200 font-medium border-l-2 border-l-amber-400`
- Coming soon items: reduce to `opacity-30` (from 40), remove the "Soon" badge text, replace with a subtle lock icon or just dim the text -- reduces visual clutter significantly
- Only show "Soon" badge on hover for coming_soon items (cleaner default state)
- Category labels: add a faint bottom border or subtle separator line beneath each label

### Files Modified
| File | Change |
|------|--------|
| `src/pages/BetaTools.tsx` | Hero panel, stats strip, quick-launch chips, better cards, reordered sections |
| `src/components/beta-tools/toolRegistry.ts` | Add `outputHints` field to interface and hero tools |
| `src/components/beta-tools/BetaToolsSidebar.tsx` | Spacing, active states, cleaner coming-soon treatment |

