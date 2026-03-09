

## Home Page Overhaul — Enterprise-Ready Pass

### Problems Found

1. **Copyright year is 2025** — should be 2026.

2. **Hero right column is a placeholder** — just three pulsing Lucide icons (dice, sparkles, flame) in a box. No screenshot, no meaningful visual. Looks unfinished.

3. **Feature list is stale** — only covers 6 DM and 6 player features from early builds. Missing major features that now exist:
   - World Map
   - Lore & Worldbuilding (with graph view, cross-links, multiple lore types)
   - Campaign Timeline
   - AI-powered Beta Tools (NPC/encounter/faction generators)
   - Community Forum
   - Character Sheets (full 5e stat blocks)
   - Factions & Bestiary
   - NPC Management
   - Session Packs (pre-session prep bundles)
   - Missing Lore Detector

4. **"What it replaces" section is weak** — just 6 text badges. Doesn't communicate value. Should be reframed as a more compelling "Why Quest Weaver" or feature-count highlight section.

5. **Testimonials are clearly fake** — attributed to "Dungeon Master", "Wizard Player", "Rogue Player" with generic quotes. Either remove entirely or replace with a "Built for" social proof section that feels authentic without fabricated quotes.

6. **Navbar is cluttered** — "Campaign Hub" appears as both a nav link AND the primary CTA button. "Beta Tools" and "Player Hub" are internal app links that don't belong on a public landing page for unauthenticated visitors. Should be simplified: Features, Demo, Community, Changelog + CTA.

7. **Footer dead links** — Privacy and Terms link to `#`. "Docs" and "Roadmap" say "Coming Soon" — stale placeholders.

8. **Demo badges are vague** — "Live Initiative", "Loot Handouts", "Spell Panel", "Player Sync" don't capture the breadth of the demo anymore.

9. **No stats/numbers section** — enterprise-ready landing pages typically have a "by the numbers" or key metrics strip. Can add feature counts or capability highlights.

10. **DM/Player toggle is underutilized** — good concept but the player features don't mention character sheets, the Player Hub, or campaign joining.

### Plan

**A. Clean up the navbar** (lines 146-241)
- Remove "Beta Tools", "Player Hub", and "Campaign Hub" from the nav links — these are internal app navigation, not landing page sections.
- Keep: Features, Demo, Community, Changelog.
- Desktop CTA: "Try Demo" + "Get Started" (or "Campaign Hub" if authenticated).
- Authenticated users get a single "Go to Dashboard" CTA.

**B. Upgrade hero section** (lines 324-394)
- Replace the placeholder icon box with a more polished visual — a styled feature highlight card showing 3-4 key stats (e.g., "12+ tools", "Real-time sync", "AI-powered") in a grid layout with brass accents, rather than the pulsing icons.
- Update copy to mention AI generation and worldbuilding alongside combat/initiative.

**C. Expand and restructure features section** (lines 427-458)
- Increase from 6 to 9 DM features and 8 player features to reflect new capabilities:
  - DM: add World Map, Lore & Worldbuilding, AI Generators (Beta Tools), Session Packs, NPC & Faction Management, Bestiary, Campaign Timeline
  - Player: add Character Sheets, Player Hub/Dashboard, Campaign Joining, Shared Notes
- Show only 6 at a time with a "See all features" expand, or restructure into two rows.

**D. Replace "What it replaces" with "Why Quest Weaver"** (lines 461-477)
- Instead of vague badges, show 3-4 compelling value props in a mini-card grid:
  - "Everything in one place" — no more juggling 5 apps
  - "Real-time sync" — DM and players always in sync
  - "AI-assisted prep" — generate NPCs, encounters, factions
  - "Zero setup" — demo in 30 seconds, no account required

**E. Replace fake testimonials with "Built for" section** (lines 507-545)
- Remove fabricated quotes. Replace with a "Built for every table" section showing use-case cards:
  - "First-time DMs" — guided campaign setup, session packs
  - "Veteran DMs" — deep worldbuilding, lore graphs, encounter tuning
  - "Players" — character sheets, inventory, quest tracking

**F. Update demo strip** (lines 479-505)
- Update badges to reflect current demo scope (now includes NPCs, Locations, Lore, Factions, Bestiary, Encounters, Quests).

**G. Update footer** (lines 565-667)
- Copyright to 2026.
- Add Changelog link to Product column.
- Remove "Coming Soon" items or link them to real pages if they exist.
- Remove dead Privacy/Terms `#` links — either link to real pages or remove.

**H. Update mobile menu** (lines 242-321)
- Mirror navbar cleanup — remove internal app links, keep landing page links.

### Files to modify
- `src/pages/Index.tsx` — all changes are in this single file

