// Complete SRD Tools Data
// Based on 5E SRD (System Reference Document)

export interface ToolSeed {
  name: string;
  category: string;
  cost_gp: number;
  weight?: number;
  description?: string;
}

export const TOOLS_SRD: ToolSeed[] = [
  // =============== ARTISAN'S TOOLS ===============
  { name: "Alchemist's Supplies", category: "Artisan's Tools", cost_gp: 50, weight: 8, description: "These special tools include the items needed to pursue a craft or trade. Proficiency with a set of artisan's tools lets you add your proficiency bonus to any ability checks you make using the tools in your craft." },
  { name: "Brewer's Supplies", category: "Artisan's Tools", cost_gp: 20, weight: 9 },
  { name: "Calligrapher's Supplies", category: "Artisan's Tools", cost_gp: 10, weight: 5 },
  { name: "Carpenter's Tools", category: "Artisan's Tools", cost_gp: 8, weight: 6 },
  { name: "Cartographer's Tools", category: "Artisan's Tools", cost_gp: 15, weight: 6 },
  { name: "Cobbler's Tools", category: "Artisan's Tools", cost_gp: 5, weight: 5 },
  { name: "Cook's Utensils", category: "Artisan's Tools", cost_gp: 1, weight: 8 },
  { name: "Glassblower's Tools", category: "Artisan's Tools", cost_gp: 30, weight: 5 },
  { name: "Jeweler's Tools", category: "Artisan's Tools", cost_gp: 25, weight: 2 },
  { name: "Leatherworker's Tools", category: "Artisan's Tools", cost_gp: 5, weight: 5 },
  { name: "Mason's Tools", category: "Artisan's Tools", cost_gp: 10, weight: 8 },
  { name: "Painter's Supplies", category: "Artisan's Tools", cost_gp: 10, weight: 5 },
  { name: "Potter's Tools", category: "Artisan's Tools", cost_gp: 10, weight: 3 },
  { name: "Smith's Tools", category: "Artisan's Tools", cost_gp: 20, weight: 8 },
  { name: "Tinker's Tools", category: "Artisan's Tools", cost_gp: 50, weight: 10 },
  { name: "Weaver's Tools", category: "Artisan's Tools", cost_gp: 1, weight: 5 },
  { name: "Woodcarver's Tools", category: "Artisan's Tools", cost_gp: 1, weight: 5 },

  // =============== GAMING SETS ===============
  { name: "Dice Set", category: "Gaming Set", cost_gp: 0.1, weight: 0, description: "This item encompasses a wide range of game pieces, including dice and decks of cards. Proficiency with a gaming set applies to one type of game." },
  { name: "Dragonchess Set", category: "Gaming Set", cost_gp: 1, weight: 0.5 },
  { name: "Playing Card Set", category: "Gaming Set", cost_gp: 0.5, weight: 0 },
  { name: "Three-Dragon Ante Set", category: "Gaming Set", cost_gp: 1, weight: 0 },

  // =============== MUSICAL INSTRUMENTS ===============
  { name: "Bagpipes", category: "Musical Instrument", cost_gp: 30, weight: 6, description: "If you have proficiency with a given musical instrument, you can add your proficiency bonus to any ability checks you make to play music with the instrument." },
  { name: "Drum", category: "Musical Instrument", cost_gp: 6, weight: 3 },
  { name: "Dulcimer", category: "Musical Instrument", cost_gp: 25, weight: 10 },
  { name: "Flute", category: "Musical Instrument", cost_gp: 2, weight: 1 },
  { name: "Lute", category: "Musical Instrument", cost_gp: 35, weight: 2 },
  { name: "Lyre", category: "Musical Instrument", cost_gp: 30, weight: 2 },
  { name: "Horn", category: "Musical Instrument", cost_gp: 3, weight: 2 },
  { name: "Pan Flute", category: "Musical Instrument", cost_gp: 12, weight: 2 },
  { name: "Shawm", category: "Musical Instrument", cost_gp: 2, weight: 1 },
  { name: "Viol", category: "Musical Instrument", cost_gp: 30, weight: 1 },

  // =============== OTHER TOOLS ===============
  { name: "Disguise Kit", category: "Tool", cost_gp: 25, weight: 3, description: "This pouch of cosmetics, hair dye, and small props lets you create disguises that change your physical appearance. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to create a visual disguise." },
  { name: "Forgery Kit", category: "Tool", cost_gp: 15, weight: 5, description: "This small box contains a variety of papers and parchments, pens and inks, seals and sealing wax, gold and silver leaf, and other supplies necessary to create convincing forgeries of physical documents. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to create a physical forgery of a document." },
  { name: "Herbalism Kit", category: "Tool", cost_gp: 5, weight: 3, description: "This kit contains a variety of instruments such as clippers, mortar and pestle, and pouches and vials used by herbalists to create remedies and potions. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to identify or apply herbs. Also, proficiency with this kit is required to create antitoxin and potions of healing." },
  { name: "Navigator's Tools", category: "Tool", cost_gp: 25, weight: 2, description: "This set of instruments is used for navigation at sea. Proficiency with navigator's tools lets you chart a ship's course and follow navigation charts. In addition, these tools allow you to add your proficiency bonus to any ability check you make to avoid getting lost at sea." },
  { name: "Poisoner's Kit", category: "Tool", cost_gp: 50, weight: 2, description: "A poisoner's kit includes the vials, chemicals, and other equipment necessary for the creation of poisons. Proficiency with this kit lets you add your proficiency bonus to any ability checks you make to craft or use poisons." },
  { name: "Thieves' Tools", category: "Tool", cost_gp: 25, weight: 1, description: "This set of tools includes a small file, a set of lock picks, a small mirror mounted on a metal handle, a set of narrow-bladed scissors, and a pair of pliers. Proficiency with these tools lets you add your proficiency bonus to any ability checks you make to disarm traps or open locks." },

  // =============== VEHICLES ===============
  { name: "Land Vehicles", category: "Vehicle", cost_gp: 0, description: "Proficiency with land vehicles covers a wide range of options, from chariots and howdahs to wagons and carts." },
  { name: "Water Vehicles", category: "Vehicle", cost_gp: 0, description: "Proficiency with water vehicles covers a wide range of options, from canoes and rowboats to sailing ships and galleys." },
];
