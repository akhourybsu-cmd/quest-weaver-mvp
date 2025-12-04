export interface ChangelogChange {
  type: "feature" | "improvement" | "fix";
  description: string;
}

export interface ChangelogEntry {
  version: string;
  date: string;
  title: string;
  changes: ChangelogChange[];
}

export const changelogData: ChangelogEntry[] = [
  {
    version: "1.8.0",
    date: "December 4, 2025",
    title: "Image Integration & Visual Polish",
    changes: [
      { type: "feature", description: "Added image support for NPCs, locations, and factions with stock photo integration" },
      { type: "feature", description: "Demo Campaign Manager now mirrors all 12 tabs from real Campaign Manager" },
      { type: "improvement", description: "Enhanced text visibility over background images with gradient overlays and drop shadows" },
      { type: "improvement", description: "Added demo seed data for lore entries, encounters, sessions, and timeline events" },
    ],
  },
  {
    version: "1.7.0",
    date: "December 3, 2025",
    title: "Performance & Campaign Manager Optimization",
    changes: [
      { type: "improvement", description: "Optimized Campaign Manager with React.memo and useMemo for faster tab switching" },
      { type: "improvement", description: "Enhanced NPC Directory, Quests Tab, and Locations Tab performance" },
      { type: "fix", description: "Fixed slowness when toggling between Campaign Manager menus" },
    ],
  },
  {
    version: "1.6.0",
    date: "December 2, 2025",
    title: "Phase 3 & 4: Equipment & Multiclassing",
    changes: [
      { type: "feature", description: "Added Attunement Manager for tracking magic item attunement (max 3 items)" },
      { type: "feature", description: "Added Ammunition Tracker with recovery mechanics per 5e rules" },
      { type: "feature", description: "Implemented full multiclassing system with prerequisite validation" },
      { type: "feature", description: "Added multiclass spell slot calculation for combined caster levels" },
      { type: "improvement", description: "Enhanced Inspiration toggle for advantage on rolls" },
    ],
  },
  {
    version: "1.5.0",
    date: "December 1, 2025",
    title: "Phase 1 & 2: Combat & Spellcasting",
    changes: [
      { type: "feature", description: "Added Player Attack Dialog with advantage/disadvantage and cover modifiers" },
      { type: "feature", description: "Added Skill Check Dialog for DM-requested ability checks" },
      { type: "feature", description: "Implemented Exhaustion Manager with 6-level tracking and penalties" },
      { type: "feature", description: "Added Legendary Tracker for boss monster actions and resistances" },
      { type: "feature", description: "Warlock Pact Slots with separate short rest recovery" },
      { type: "feature", description: "Ritual Cast Dialog for casting without expending spell slots" },
      { type: "feature", description: "Mystic Arcanum Tracker for Warlock 6th-9th level spells" },
    ],
  },
  {
    version: "1.4.0",
    date: "November 28, 2025",
    title: "Character Creation & Level-Up System",
    changes: [
      { type: "feature", description: "Comprehensive level-up wizard with class-specific mechanics" },
      { type: "feature", description: "Magical Secrets feature for Bards selecting spells from any class" },
      { type: "feature", description: "Ranger Favored Enemy and Favored Terrain selection" },
      { type: "feature", description: "Fighting Style, Expertise, Metamagic, and Invocation selectors" },
      { type: "feature", description: "Incremental character creation supporting levels 1-20" },
      { type: "improvement", description: "Auto-seeding of SRD data on character wizard load" },
      { type: "fix", description: "Fixed spell data import with proper class assignments" },
    ],
  },
  {
    version: "1.3.0",
    date: "November 26, 2025",
    title: "Community & Changelog",
    changes: [
      { type: "feature", description: "Added Community Forum for discussions, feature requests, and bug reports" },
      { type: "feature", description: "Added Changelog page to track Quest Weaver updates" },
      { type: "improvement", description: "Improved PWA support with proper icons and manifest" },
      { type: "improvement", description: "Streamlined homepage with cleaner demo section" },
      { type: "fix", description: "Join code input moved to Player Hub where it belongs" },
    ],
  },
  {
    version: "1.2.0",
    date: "November 20, 2025",
    title: "Enhanced Quest Management",
    changes: [
      { type: "feature", description: "Quest Detail Dialog with comprehensive tracking tabs" },
      { type: "feature", description: "Progress bars and objective tracking for quests" },
      { type: "feature", description: "Quest giver NPC and location linking" },
      { type: "improvement", description: "Search and filtering by status, type, and difficulty" },
      { type: "improvement", description: "Demo mode now fully mirrors real functionality" },
    ],
  },
  {
    version: "1.1.0",
    date: "November 15, 2025",
    title: "Session Pack Builder",
    changes: [
      { type: "feature", description: "Session Pack Builder for pre-session prep" },
      { type: "feature", description: "Notes integration with session linking" },
      { type: "feature", description: "Session timeline with automatic action logging" },
      { type: "improvement", description: "Session tiles now show goals and prep checklists" },
      { type: "fix", description: "Fixed real-time sync issues between DM and players" },
    ],
  },
  {
    version: "1.0.0",
    date: "November 1, 2025",
    title: "Initial Release",
    changes: [
      { type: "feature", description: "Campaign Manager with full DM toolkit" },
      { type: "feature", description: "Initiative tracker with condition management" },
      { type: "feature", description: "Encounter builder with monster library" },
      { type: "feature", description: "Loot handouts and item vault" },
      { type: "feature", description: "Player Hub with real-time sync" },
      { type: "feature", description: "Character sheet integration" },
      { type: "feature", description: "Spell tracking and slot management" },
      { type: "feature", description: "Interactive demo mode" },
    ],
  },
];
