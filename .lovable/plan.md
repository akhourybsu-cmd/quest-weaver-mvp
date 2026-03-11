

## Interactive Feature Showcase on Homepage

### What We're Building
A two-panel animated showcase section inserted between the hero and the feature tiles. It auto-advances through a series of mock UI "frames" — like a looping product demo video — with manual click-through controls. One panel for the DM Campaign Manager, one for the Player Hub / Character Sheets. Users flip between them with the existing DM/Player toggle.

### Approach
Since we can't embed real video, we'll build **animated mock browser frames** that cycle through curated "slides" showing key UI states. Each slide is a styled card composition that *recreates* what the real UI looks like — stat blocks, tab bars, NPC cards, initiative trackers, character sheets, etc. — using the existing component library and fantasy design tokens. This gives a richer, more interactive feel than static screenshots.

### New Component: `src/components/landing/FeatureShowcase.tsx`

**Structure:**
- Outer "browser chrome" frame (dark toolbar with dots, fake URL bar showing "quest-weaver.app/campaign/...")
- Inner content area that cross-fades between slides on a 4-second auto-advance timer
- Dot indicators + prev/next arrows for manual navigation
- Pause-on-hover behavior

**DM Slides (5 frames):**
1. **Campaign Overview** — Mock tab bar + stat cards (Sessions: 12, NPCs: 24, Quests: 8) + recent activity list
2. **NPC Management** — Grid of NPC portrait cards with names, roles, faction badges
3. **Encounter Builder** — Monster cards with CR badges, HP bars, a difficulty gauge
4. **Lore Codex** — Graph-style node preview with interconnected lore entries
5. **Session Prep** — Checklist-style view with objectives, encounter links, notes

**Player Slides (4 frames):**
1. **Character Sheet (Stats)** — Ability scores grid, HP bar, AC/Speed/Prof stats, class/level header
2. **Character Sheet (Narrative flip)** — Backstory text, personality traits, bonds in manuscript style
3. **Inventory & Spells** — Equipment list, spell slots tracker, prepared spells grid
4. **Player Dashboard** — Campaign cards, upcoming session, party members strip

Each "slide" is a purpose-built mini-composition using existing UI primitives (Card, Badge, Progress, Avatar placeholders) styled to look like the real app. No actual data fetching — all hardcoded showcase content.

### Integration in `src/pages/Index.tsx`
- Import `FeatureShowcase` and place it between the hero section and the DM/Player toggle
- Pass `viewMode` so it switches slide sets when the toggle changes
- Move the toggle above the showcase so it controls both the showcase and the feature tiles below

### Files
| File | Action |
|------|--------|
| `src/components/landing/FeatureShowcase.tsx` | Create — all slide content + auto-advance + browser frame |
| `src/pages/Index.tsx` | Edit — import showcase, reorder sections |

### What Does NOT Change
- No real data or Supabase calls
- No changes to actual campaign/player pages
- No video files or external assets needed

