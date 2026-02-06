import { Target, Lightbulb, Swords, Package, BookOpen, MapPin, Clock, Brain } from "lucide-react";

export const PREDEFINED_TAGS = [
  { name: "NPC", icon: Target, color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400" },
  { name: "Quest", icon: Target, color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400" },
  { name: "Clue", icon: Lightbulb, color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400" },
  { name: "Combat", icon: Swords, color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400" },
  { name: "Loot", icon: Package, color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400" },
  { name: "Lore", icon: BookOpen, color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400" },
  { name: "Location", icon: MapPin, color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400" },
  { name: "Downtime", icon: Clock, color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400" },
  { name: "GM Thought", icon: Brain, color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
];

export const NOTE_TEMPLATES = {
  combat: {
    name: "Combat Note",
    content: `## Combat Notes

**Round 1:**
- 

**Key Moments:**
- 

**Tactics Used:**
- 

**Outcome:**
- `
  },
  npc: {
    name: "NPC Dialogue",
    content: `## NPC Dialogue: [Name]

**Says:**
- 

**Reveals:**
- 

**Wants:**
- 

**Reaction:**
- `
  },
  clue: {
    name: "Clue",
    content: `## Clue Found

**Location:**
- 

**Description:**
- 

**Significance:**
- 

**Leads To:**
- `
  },
  location: {
    name: "Location",
    content: `## Location: [Name]

**Description:**
- 

**Points of Interest:**
- 

**NPCs Present:**
- 

**Hooks:**
- `
  }
};

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function parseWikilinks(markdown: string): string[] {
  const titles: string[] = [];
  const matches = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
  for (const match of matches) {
    if (!titles.includes(match[1])) titles.push(match[1]);
  }
  return titles;
}

/** Strip markdown syntax for plain-text preview */
export function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // code blocks
    .replace(/#{1,6}\s+/g, '')      // headings
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1')     // italic
    .replace(/`([^`]+)`/g, '$1')       // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // markdown links
    .replace(/^[-*+]\s+/gm, '')    // unordered lists
    .replace(/^\d+\.\s+/gm, '')    // ordered lists
    .replace(/^>\s+/gm, '')        // blockquotes
    .replace(/---/g, '')           // hr
    .replace(/\n{2,}/g, ' ')       // collapse newlines
    .trim();
}
