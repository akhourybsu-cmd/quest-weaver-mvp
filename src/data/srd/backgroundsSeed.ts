// SRD 5.1 Background seed data
// Source: D&D 5E Systems Reference Document 5.1 (CC BY 4.0)
// https://dnd.wizards.com/resources/systems-reference-document
//
// Includes only backgrounds explicitly listed in the SRD 5.1.
// feature.name and feature.description match the expected JSONB shape on srd_backgrounds.
// This file is used as a local fallback when the API seed has not yet populated
// the srd_backgrounds table, and as the authoritative format reference for
// any migration or re-seeding of the feature column.

export interface SrdBackgroundSeed {
  name: string;
  skill_proficiencies: Array<{ name: string }> | { choose: number; from: string[] };
  tool_proficiencies: Array<{ name: string }> | { choose: number; from: string[] };
  languages: Array<{ name: string }> | { choose: number; from: string[] };
  equipment: string[];
  feature: { name: string; description: string };
}

export const SRD_BACKGROUNDS: SrdBackgroundSeed[] = [
  {
    name: "Acolyte",
    skill_proficiencies: [{ name: "Insight" }, { name: "Religion" }],
    tool_proficiencies: [],
    languages: { choose: 2, from: ["any"] },
    equipment: ["Holy Symbol", "Prayer Book or Prayer Wheel", "Incense x5", "Vestments", "Common Clothes", "Pouch"],
    feature: {
      name: "Shelter of the Faithful",
      description:
        "As an acolyte, you command the respect of those who share your faith. You and your companions can receive free healing and care at a temple, shrine, or other established presence of your faith. You can also call upon your religious contacts, though they may ask favors in return.",
    },
  },
  {
    name: "Criminal",
    skill_proficiencies: [{ name: "Deception" }, { name: "Stealth" }],
    tool_proficiencies: [{ name: "Thieves' Tools" }, { choose: 1, from: ["Dice Set", "Playing Card Set"] } as any],
    languages: [],
    equipment: ["Crowbar", "Dark Common Clothes with Hood", "Pouch"],
    feature: {
      name: "Criminal Contact",
      description:
        "You have a reliable and trusted contact who acts as your liaison to a network of criminals. You know how to get messages to and from your contact, and you know the local criminal organizations well enough to ask for information.",
    },
  },
  {
    name: "Folk Hero",
    skill_proficiencies: [{ name: "Animal Handling" }, { name: "Survival" }],
    tool_proficiencies: [{ name: "Vehicles (Land)" }, { choose: 1, from: ["Artisan's Tools"] } as any],
    languages: [],
    equipment: ["Artisan's Tools", "Shovel", "Iron Pot", "Common Clothes", "Pouch"],
    feature: {
      name: "Rustic Hospitality",
      description:
        "Since you come from the ranks of common folk, you fit in among them with ease. You can find a place to hide, rest, or recuperate among other commoners. They will shield you from the law or anyone else searching for you, though they will not risk their lives for you.",
    },
  },
  {
    name: "Noble",
    skill_proficiencies: [{ name: "History" }, { name: "Persuasion" }],
    tool_proficiencies: [{ choose: 1, from: ["Dice Set", "Playing Card Set", "Dragon Chess Set"] } as any],
    languages: { choose: 1, from: ["any"] },
    equipment: ["Fine Clothes", "Signet Ring", "Scroll of Pedigree", "Purse"],
    feature: {
      name: "Position of Privilege",
      description:
        "Thanks to your noble birth, people are inclined to think the best of you. You are welcome in high society, and people assume you have the right to be wherever you are. The common folk make every effort to accommodate you, and you can secure an audience with a local noble if you need to.",
    },
  },
  {
    name: "Sage",
    skill_proficiencies: [{ name: "Arcana" }, { name: "History" }],
    tool_proficiencies: [],
    languages: { choose: 2, from: ["any"] },
    equipment: ["Bottle of Black Ink", "Quill", "Small Knife", "Letter from Dead Colleague", "Common Clothes", "Pouch"],
    feature: {
      name: "Researcher",
      description:
        "When you attempt to learn or recall a piece of lore, if you do not know that information, you often know where and from whom you can obtain it. Usually this information comes from a library, scriptorium, university, or a sage or other learned person. Your DM might rule that the knowledge you seek is hidden or lost.",
    },
  },
  {
    name: "Soldier",
    skill_proficiencies: [{ name: "Athletics" }, { name: "Intimidation" }],
    tool_proficiencies: [{ name: "Vehicles (Land)" }, { choose: 1, from: ["Dice Set", "Playing Card Set", "Dragon Chess Set"] } as any],
    languages: [],
    equipment: ["Insignia of Rank", "Trophy from Fallen Enemy", "Bone Dice or Deck of Cards", "Common Clothes", "Pouch"],
    feature: {
      name: "Military Rank",
      description:
        "You have a military rank from your career as a soldier. Soldiers loyal to your former military organization still recognize your authority and influence. You can invoke your rank to temporarily requisition simple equipment or personnel, and you are treated with deference by those of lower rank.",
    },
  },
];

/** Returns the seed data for a background by name (case-insensitive). */
export function getBackgroundSeedByName(name: string): SrdBackgroundSeed | undefined {
  return SRD_BACKGROUNDS.find(b => b.name.toLowerCase() === name.toLowerCase());
}
