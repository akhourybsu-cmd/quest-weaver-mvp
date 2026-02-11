

# Character Creation Wizard -- Animation and Polish Pass

## Overview
The Character Creation Wizard currently uses plain, unstyled components (generic Cards, standard Progress bar, no animations) which clashes with the rich fantasy aesthetic used throughout the Player Hub, combat screen, character sheets, and settings. This plan brings the wizard up to parity.

## Current Issues

1. **No fantasy theming** -- The dialog, all step cards, the sidebar, and navigation use default shadcn styling with no `fantasy-border-ornaments`, `font-cinzel`, brass accents, or parchment overlays.
2. **No step transition animations** -- Switching steps has no entrance animation; content just appears.
3. **Plain progress bar** -- Standard unstyled `Progress` component with no thematic color.
4. **LiveSummaryPanel is generic** -- No fantasy styling on any of the sidebar cards.
5. **Navigation buttons are bland** -- Back/Next buttons have no fantasy styling or tactile feedback.
6. **Step headers are plain text** -- Each step uses `h3` with no thematic icon, color, or divider.
7. **StepReview finalize CTA is generic** -- Uses a plain `primary` button with no fantasy celebration feel.
8. **No staggered animations** on card lists (badges, proficiency lists, ancestry traits, etc.)

## Plan

### 1. Dialog Container Fantasy Theming
- Apply `fantasy-border-ornaments` to the `DialogContent` wrapper.
- Add parchment texture overlay (`bg-gradient-to-br from-parchment/5 via-transparent to-brass/5`).
- Style the wizard title "Character Creation Wizard" with `font-cinzel text-brass tracking-wide`.
- Replace the plain `Progress` bar with brass-themed styling (`[&>div]:bg-gradient-to-r [&>div]:from-brass/70 [&>div]:to-brass`).
- Add brass gradient dividers between header, content, and footer sections.

### 2. Step Transition Animation
- Wrap `renderStep()` output with a keyed `div` that applies `animate-fade-in` on each step change.
- Use `key={currentStep}` to trigger re-mount and animation on every step transition.

### 3. Navigation Buttons Polish
- Style the Next button with brass accent: `bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-brass-foreground`.
- Add `active:scale-95 transition-transform` press feedback to both Back and Next.
- Style the "Save & Exit" button with a brass outline variant.

### 4. Step Headers -- Thematic Icons and Styling
- Add a themed icon next to each step title (Sword for Basics, Users for Ancestry, Brain for Abilities, Book for Background, Wrench for Proficiencies, Backpack for Equipment, Sparkles for Spells, Star for Features, Scroll for Description, CheckCircle for Review).
- Apply `font-cinzel tracking-wide text-brass` to step `h3` titles.
- Add brass gradient divider below each step header.

### 5. Step Cards Fantasy Borders
- Apply `fantasy-border-ornaments` to the primary detail cards in each step (class details in StepBasics, ancestry card in StepAncestry, background card in StepBackground, modifiers card in StepAbilities, portrait card and personality card in StepDescription, review card in StepReview).
- Add parchment overlay to these cards where appropriate.

### 6. LiveSummaryPanel Polish
- Apply `fantasy-border-ornaments` to the sidebar wrapper.
- Use `font-cinzel` for "Character Summary" and card section titles (Identity, Combat, Ability Modifiers, Skills).
- Add brass accents to the progress badge list and combat stat blocks.
- Add `animate-fade-in` entrance to each summary card with staggered delays.

### 7. StepReview Finalize CTA
- Style the finalize section card with a glowing brass border (`shadow-[0_0_12px_hsl(var(--brass)/0.3)]`).
- Restyle "Finalize Character" button with brass gradient and a `Sparkles` icon.
- Add `animate-pulse-breathe` subtle glow to the finalize card to draw attention.

### 8. Badge and List Animations
- Add staggered `animate-fade-in` with incremental `animation-delay` to badge lists in StepBasics (saving throws, armor, weapons), StepAncestry (ability bonuses, languages, traits), StepBackground (skills, tools, languages), and StepReview sections.

---

## Technical Details

**Files to modify:**
- `src/components/character/CharacterWizard.tsx` -- Dialog theming, progress bar styling, step transition animation wrapper, navigation buttons, header font
- `src/components/character/wizard/StepBasics.tsx` -- Fantasy card borders, themed header with icon, badge animations
- `src/components/character/wizard/StepAncestry.tsx` -- Fantasy card borders, themed header with icon, badge animations
- `src/components/character/wizard/StepAbilities.tsx` -- Fantasy card borders, themed header with icon
- `src/components/character/wizard/StepBackground.tsx` -- Fantasy card borders, themed header with icon, badge animations
- `src/components/character/wizard/StepDescription.tsx` -- Fantasy card borders, themed header with icon
- `src/components/character/wizard/StepReview.tsx` -- Fantasy card borders, finalize CTA glow, themed header, badge animations
- `src/components/character/wizard/LiveSummaryPanel.tsx` -- Full fantasy theming pass, font-cinzel, brass accents, entrance animations

**No new files, dependencies, or database changes required.** All styling uses existing Tailwind utilities, animation classes, and fantasy-border CSS already in the project.

