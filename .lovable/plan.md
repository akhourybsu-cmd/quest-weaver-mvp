

## Parchment Fantasy Visual Polish Pass

A styling-only refinement across three files to give the character sheet a warmer, richer parchment aesthetic without touching layout or structure.

### Files to Modify

**1. `src/index.css`** — CSS variable and utility updates
- Warm `--background` slightly (shift hue toward 38, bump saturation)
- Lighten `--card` to create better separation from page background
- Shift `--border` to antique tan/gold-brown tone
- Shift `--foreground` toward deep brown ink (`30 25% 15%`) instead of near-black
- Increase grain overlay opacity slightly for subtle paper texture
- Add new utility class `.parchment-card` with faint inner shadow, subtle grain overlay, and warm border styling
- Add `.parchment-inset` for layered-paper depth effect on stat cards
- Add `.fantasy-hp-bar` with deeper herbal green and subtle inner texture
- Add `.fantasy-badge` for parchment-tab styled pills/badges (replacing SaaS look)

**2. `src/pages/PlayerCharacterViewPage.tsx`** — Hero banner refinement
- Tighten vertical padding on the hero banner (`p-4` instead of `p-5 md:p-6`)
- Apply `parchment-card` class to the banner for warm inset depth
- Shift corner accents to use slightly thicker/warmer brass with a touch of inner glow
- Add a faint watermark-style diamond ornament behind the name area (using CSS pseudo-element via a small wrapper class)

**3. `src/components/player/PlayerCharacterSheet.tsx`** — Card and element styling
- HP bar: replace `bg-status-buff` / `bg-status-warning` / `bg-status-hp` with deeper herbal green tones, add subtle border framing around the bar track
- HP section: apply `parchment-card` class for warm panel treatment
- Core stat grid cards: add `parchment-inset` for layered paper depth, soften border-radius slightly
- Ability score cards: warm up the gradient from brass tones, add faint inner shadow
- Collapsible triggers (Skills, Proficiencies, Spellbook, Features): apply warmer bg tones and antique-gold borders
- Source badges (Class, Subclass, Ancestry, etc.): restyle with muted parchment tones instead of bright translucent SaaS colors — tan backgrounds, brown-ink text, brass borders
- Spell slot and resource dots: add subtle warm shadow instead of bright neon glow
- Section dividers: use the existing `fantasy-divider` gradient style from `fantasy-lore.css`
- Saving throw rows: warm up from pure `bg-muted/30` to a cream-tinted surface

**4. `src/styles/fantasy-lore.css`** — New utility additions
- Add `.parchment-card` definition here alongside existing fantasy utilities
- Add `.parchment-inset` with `inset 0 1px 3px hsl(30 20% 12% / 0.06)` shadow
- Add `.fantasy-badge` styled like a stamped parchment label

### Color Direction (Light Mode)
- Page background: `38 38% 93%` (warmer ivory)
- Card surfaces: `42 42% 95%` (lighter cream)
- Borders: `35 30% 68%` (muted antique tan)
- Primary text: `30 25% 15%` (deep brown ink)
- HP bar green: `145 45% 35%` (deeper herbal green)
- Badge/tag style: tan bg, brown text, brass-tinted border

### What Does NOT Change
- Layout grid (3-column desktop, stacked mobile)
- Component hierarchy and nesting
- Navigation or routing
- Data fetching or logic
- Dark mode values (left as-is for now)

