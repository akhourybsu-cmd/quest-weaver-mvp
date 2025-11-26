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
