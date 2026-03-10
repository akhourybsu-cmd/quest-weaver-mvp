

## Final Visual Polish Pass — Character Select + Character Sheet

A styling-only pass across 4 files to elevate both screens toward a premium fantasy folio feel. No layout changes, no logic changes.

### Files to Modify

**1. `src/components/player/PlayerCharacterList.tsx`** — Character select screen polish
- Replace the header area with a more intentional folio-style treatment: add an ornamental divider below the title, tighten subtitle spacing
- Restyle "Create Character" button from default purple to a muted antique-violet/plum tone with brass border and font-cinzel text
- Upgrade character cards: add `parchment-card` class, stronger hover state (`hover:shadow-lg hover:border-brass/60 hover:-translate-y-0.5`), slightly more padding
- Portrait avatar: add double-border treatment (outer `border-brass/50`, inner via ring utility) and a subtle warm shadow
- Stat row at bottom (HP/AC/Speed): wrap in a faint parchment inset strip so it feels like a shelf
- When no characters exist, add a faint watermark ornament or decorative divider in the empty state card
- Add a subtle folio header bar above the card grid: a thin brass gradient line with a centered diamond ornament (reuse `fantasy-divider` pattern)

**2. `src/pages/PlayerCharacterViewPage.tsx`** — Header refinement
- Tighten header padding slightly (keep `p-4`, reduce `md:p-5` to `md:p-4`)
- Add secondary meta on the right side of the header: HP quick-stat and AC displayed as compact brass-framed values, filling the dead space
- Restyle the Story/Stats flip button to feel more ceremonial: add a faint brass background gradient, slightly larger, with a subtle glow on hover
- Add a sepia filter/overlay on the portrait image so it blends with the parchment (using `mix-blend-multiply` or a subtle sepia CSS filter)
- Add a faint ornamental divider between the hero banner and the sheet content

**3. `src/components/player/PlayerCharacterSheet.tsx`** — Sheet detail polish
- **Section headers**: Replace inline header treatments with a consistent pattern — wider letter-spacing, more vertical breathing room (`mt-6 mb-3` instead of implicit spacing), and use the brass gradient divider line beneath each section title
- **HP section**: Add a subtle double-border on the track (`outline` + `border`) for a more embedded feel
- **Core stat cards** (AC/Speed/Prof/Percep): Add slightly more padding (`p-4`), increase icon size to `w-5 h-5`, make the value text slightly larger
- **Ability score cards**: Increase internal padding to `p-4`, add subtle warm gradient background
- **Feature rows**: Add `border-l-2 border-brass/30` left accent to each feature row for better grouping
- **Subsection labels** ("Class Features", "Ancestry Traits", etc.): Style with `font-cinzel`, `uppercase`, `tracking-widest`, `text-[11px]`, and a faint left brass bar
- **Level Up button**: Upgrade to a more prominent treatment — fill with `bg-brass/15`, stronger border, `font-cinzel`, slight glow on hover
- **Collapsible triggers**: Add `parchment-card` class for consistency

**4. `src/styles/fantasy-lore.css`** — New utility classes
- Add `.fantasy-folio-shelf`: a subtle top-border gradient + inset shadow that makes a row feel like it sits on a shelf
- Add `.fantasy-section-header`: consistent Cinzel + letter-spacing + brass underline treatment for section titles
- Add `.fantasy-portrait-frame`: sepia overlay + double-border treatment for character portraits

**5. `src/components/player/PlayerNavigation.tsx`** — Sidebar micro-polish
- Active state: slightly richer brass background (`bg-brass/25`) with a left brass border accent (`border-l-3 border-brass`)
- Avatar frame: add `shadow-[0_0_8px_hsl(var(--brass)/0.2)]` for warm glow
- Icon contrast: add `opacity-80` to non-active icons for softer feel

### What Does NOT Change
- Layout grid, column structure, component hierarchy
- Navigation routing or menu items
- Data fetching, state management, or any logic
- Dark mode (left as-is)

