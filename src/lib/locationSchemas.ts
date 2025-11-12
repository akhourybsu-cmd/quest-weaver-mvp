// Location type schemas and templates for dynamic forms

export type LocationType =
  | "Continent" | "Region" | "Nation" | "Province"
  | "City" | "Town" | "Village" | "Hamlet" | "District"
  | "Dungeon" | "Fortress" | "Temple" | "Tower" | "Ruin" | "Cave" | "Sewer"
  | "Wilderness" | "Forest" | "Mountains" | "Desert" | "Swamp" | "River" | "Coast"
  | "Inn" | "Tavern" | "Blacksmith" | "Armorer" | "Fletcher"
  | "Alchemist" | "Apothecary" | "MagicShop" | "GeneralStore" | "MarketStall"
  | "Library" | "Scribe" | "University" | "WizardTower"
  | "TempleShrine" | "HealerClinic"
  | "AdventurersGuild" | "ThievesGuild" | "MagesGuild" | "MerchantsGuild"
  | "Guardhouse" | "Barracks" | "Garrison" | "Gatehouse" | "Prison"
  | "Stable" | "Dockyard" | "Warehouse" | "Bank"
  | "Theatre" | "Arena" | "Bathhouse" | "Brothel"
  | "Cemetery" | "Catacombs" | "TeleportCircle" | "Portal"
  | "Landmark" | "Monument" | "Other";

export interface LocationField {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "array" | "boolean";
  options?: string[];
  placeholder?: string;
  description?: string;
}

export interface LocationSchema {
  fields: LocationField[];
  template: Record<string, any>;
  category: "settlement" | "venue" | "site" | "geographic" | "other";
}

export const LOCATION_SCHEMAS: Record<LocationType, LocationSchema> = {
  // Settlements
  Continent: {
    category: "geographic",
    fields: [
      { key: "climate", label: "Climate", type: "text", placeholder: "Temperate, tropical, arctic..." },
      { key: "population", label: "Population", type: "number", placeholder: "Total inhabitants" },
      { key: "notable_regions", label: "Notable Regions", type: "array", description: "Major regions within" },
    ],
    template: {},
  },
  Region: {
    category: "geographic",
    fields: [
      { key: "terrain", label: "Terrain", type: "text", placeholder: "Plains, mountains, forests..." },
      { key: "climate", label: "Climate", type: "text" },
      { key: "population", label: "Population", type: "number" },
    ],
    template: {},
  },
  Nation: {
    category: "settlement",
    fields: [
      { key: "government", label: "Government", type: "select", options: ["Monarchy", "Republic", "Theocracy", "Oligarchy", "Democracy", "Dictatorship"] },
      { key: "ruler", label: "Ruler", type: "text" },
      { key: "population", label: "Population", type: "number" },
      { key: "capital", label: "Capital City", type: "text" },
    ],
    template: { government: "Monarchy" },
  },
  Province: {
    category: "settlement",
    fields: [
      { key: "governor", label: "Governor", type: "text" },
      { key: "population", label: "Population", type: "number" },
      { key: "economy_primary", label: "Primary Economy", type: "text", placeholder: "Mining, farming, trade..." },
    ],
    template: {},
  },
  City: {
    category: "settlement",
    fields: [
      { key: "population", label: "Population", type: "number" },
      { key: "government", label: "Government", type: "select", options: ["Monarchy", "Council", "Guild Rule", "Military"] },
      { key: "ruler", label: "Ruler/Mayor", type: "text" },
      { key: "law_level", label: "Law Level", type: "select", options: ["Very Low", "Low", "Moderate", "High", "Very High"] },
      { key: "guard_size", label: "Guard Size", type: "number" },
      { key: "notable_districts", label: "Notable Districts", type: "array" },
    ],
    template: { law_level: "Moderate", population: 5000 },
  },
  Town: {
    category: "settlement",
    fields: [
      { key: "population", label: "Population", type: "number" },
      { key: "economy_primary", label: "Primary Economy", type: "text", placeholder: "Farming, fishing, trade..." },
      { key: "mayor", label: "Mayor", type: "text" },
    ],
    template: { population: 1000 },
  },
  Village: {
    category: "settlement",
    fields: [
      { key: "population", label: "Population", type: "number" },
      { key: "economy_primary", label: "Primary Economy", type: "text" },
      { key: "elder", label: "Village Elder", type: "text" },
    ],
    template: { population: 200 },
  },
  Hamlet: {
    category: "settlement",
    fields: [
      { key: "population", label: "Population", type: "number" },
      { key: "farming_type", label: "Farming Type", type: "text" },
    ],
    template: { population: 50 },
  },
  District: {
    category: "settlement",
    fields: [
      { key: "district_type", label: "District Type", type: "select", options: ["Market", "Residential", "Noble", "Industrial", "Docks", "Temple", "Military"] },
      { key: "notable_features", label: "Notable Features", type: "array" },
    ],
    template: {},
  },

  // Venues - Commerce
  Inn: {
    category: "venue",
    fields: [
      { key: "quality", label: "Quality", type: "select", options: ["Poor", "Common", "Fine", "Luxury"] },
      { key: "rooms_total", label: "Total Rooms", type: "number" },
      { key: "rooms_free", label: "Available Rooms", type: "number" },
      { key: "rate_common", label: "Common Room Rate (gp)", type: "number" },
      { key: "rate_fine", label: "Fine Room Rate (gp)", type: "number" },
      { key: "includes_meal", label: "Includes Meal", type: "boolean" },
      { key: "stabling_rate", label: "Stabling Rate (gp)", type: "number" },
      { key: "owner_npc", label: "Owner", type: "text" },
    ],
    template: { quality: "Common", rooms_total: 10, rate_common: 5, includes_meal: true },
  },
  Tavern: {
    category: "venue",
    fields: [
      { key: "crowd_type", label: "Crowd Type", type: "select", options: ["Sailors", "Merchants", "Mercenaries", "Scholars", "Locals", "Mixed"] },
      { key: "signature_drinks", label: "Signature Drinks", type: "array" },
      { key: "entertainment", label: "Entertainment", type: "select", options: ["None", "Bards", "Dice Games", "Card Games", "Dancing", "Fights"] },
      { key: "brawl_chance", label: "Brawl Chance (%)", type: "number" },
      { key: "owner_npc", label: "Owner", type: "text" },
    ],
    template: { crowd_type: "Mixed", brawl_chance: 10 },
  },
  Blacksmith: {
    category: "venue",
    fields: [
      { key: "craft_grades", label: "Craft Grades", type: "array", description: "Mundane, Masterwork, +1, +2, +3" },
      { key: "materials", label: "Available Materials", type: "array", description: "Iron, Steel, Mithral, Adamantine..." },
      { key: "custom_order_days", label: "Custom Order Lead Time (days)", type: "number" },
      { key: "repair_cost_per_dmg", label: "Repair Cost per Damage Point (gp)", type: "number" },
      { key: "smithy_name", label: "Smith's Name", type: "text" },
    ],
    template: { craft_grades: ["Mundane", "Masterwork"], materials: ["Iron", "Steel"] },
  },
  Armorer: {
    category: "venue",
    fields: [
      { key: "craft_grades", label: "Craft Grades", type: "array" },
      { key: "materials", label: "Available Materials", type: "array" },
      { key: "specialization", label: "Specialization", type: "select", options: ["Light", "Medium", "Heavy", "All"] },
      { key: "smith_name", label: "Armorer's Name", type: "text" },
    ],
    template: { specialization: "All" },
  },
  Fletcher: {
    category: "venue",
    fields: [
      { key: "arrow_types", label: "Arrow Types", type: "array", description: "Standard, silvered, magical..." },
      { key: "bow_quality", label: "Bow Quality", type: "select", options: ["Standard", "Masterwork", "Magical"] },
      { key: "fletcher_name", label: "Fletcher's Name", type: "text" },
    ],
    template: { bow_quality: "Standard" },
  },
  Alchemist: {
    category: "venue",
    fields: [
      { key: "rarity_cap", label: "Rarity Cap", type: "select", options: ["Common", "Uncommon", "Rare", "Very Rare"] },
      { key: "specialties", label: "Specialties", type: "array", description: "Healing, poison, fire, acid..." },
      { key: "brew_services", label: "Offers Brewing Services", type: "boolean" },
      { key: "identify_cost", label: "Identify Potion Cost (gp)", type: "number" },
      { key: "alchemist_name", label: "Alchemist's Name", type: "text" },
    ],
    template: { rarity_cap: "Uncommon", brew_services: true },
  },
  Apothecary: {
    category: "venue",
    fields: [
      { key: "herbs_available", label: "Herbs Available", type: "array" },
      { key: "healing_focus", label: "Healing Focus", type: "boolean" },
      { key: "healer_name", label: "Healer's Name", type: "text" },
    ],
    template: { healing_focus: true },
  },
  MagicShop: {
    category: "venue",
    fields: [
      { key: "rarity_cap", label: "Rarity Cap", type: "select", options: ["Common", "Uncommon", "Rare", "Very Rare", "Legendary"] },
      { key: "scroll_max_level", label: "Max Spell Scroll Level", type: "number" },
      { key: "identify_cost", label: "Identify Cost (gp)", type: "number" },
      { key: "buyback_rate", label: "Buyback Rate (%)", type: "number" },
      { key: "shopkeeper_name", label: "Shopkeeper's Name", type: "text" },
    ],
    template: { rarity_cap: "Uncommon", scroll_max_level: 3, identify_cost: 25, buyback_rate: 50 },
  },
  GeneralStore: {
    category: "venue",
    fields: [
      { key: "category", label: "Category", type: "select", options: ["General Goods", "Produce", "Tools", "Animals", "Maps"] },
      { key: "haggling_allowed", label: "Haggling Allowed", type: "boolean" },
      { key: "shopkeeper_name", label: "Shopkeeper's Name", type: "text" },
    ],
    template: { category: "General Goods", haggling_allowed: true },
  },
  MarketStall: {
    category: "venue",
    fields: [
      { key: "goods_type", label: "Goods Type", type: "text", placeholder: "Trinkets, food, cloth..." },
      { key: "vendor_name", label: "Vendor's Name", type: "text" },
      { key: "operates_on", label: "Operates On", type: "text", placeholder: "Market days, festivals..." },
    ],
    template: {},
  },

  // Venues - Services
  Library: {
    category: "venue",
    fields: [
      { key: "collection_size", label: "Collection Size (volumes)", type: "number" },
      { key: "subjects", label: "Subjects", type: "array", description: "History, Arcana, Religion..." },
      { key: "rarities_present", label: "Rarities Present", type: "select", options: ["Common Only", "Common & Rare", "Restricted Access"] },
      { key: "research_time_hours", label: "Research Time (hours per check)", type: "number" },
      { key: "copying_services", label: "Copying Services Available", type: "boolean" },
      { key: "librarian_name", label: "Chief Librarian", type: "text" },
    ],
    template: { collection_size: 500, research_time_hours: 4, copying_services: true },
  },
  Scribe: {
    category: "venue",
    fields: [
      { key: "copying_rate", label: "Copying Rate (gp per page)", type: "number" },
      { key: "scroll_scribing", label: "Scroll Scribing Available", type: "boolean" },
      { key: "scribe_name", label: "Master Scribe's Name", type: "text" },
    ],
    template: { copying_rate: 1, scroll_scribing: true },
  },
  University: {
    category: "venue",
    fields: [
      { key: "faculties", label: "Faculties", type: "array", description: "Arcane Studies, History, Medicine..." },
      { key: "library_size", label: "Library Size", type: "number" },
      { key: "chancellor_name", label: "Chancellor's Name", type: "text" },
    ],
    template: { library_size: 5000 },
  },
  WizardTower: {
    category: "venue",
    fields: [
      { key: "wizard_name", label: "Wizard's Name", type: "text" },
      { key: "specialization", label: "Specialization", type: "text", placeholder: "Evocation, Divination..." },
      { key: "services", label: "Services Offered", type: "array", description: "Identify, scrying, enchanting..." },
      { key: "defenses", label: "Magical Defenses", type: "textarea" },
    ],
    template: {},
  },
  TempleShrine: {
    category: "venue",
    fields: [
      { key: "deity", label: "Deity/Domain", type: "text" },
      { key: "services", label: "Services", type: "array", description: "Healing, remove curse, resurrection..." },
      { key: "donation_suggested", label: "Suggested Donation (gp)", type: "number" },
      { key: "high_priest", label: "High Priest/Priestess", type: "text" },
    ],
    template: {},
  },
  HealerClinic: {
    category: "venue",
    fields: [
      { key: "cure_wounds_cost", label: "Cure Wounds Cost (gp)", type: "number" },
      { key: "restoration_cost", label: "Lesser Restoration Cost (gp)", type: "number" },
      { key: "healer_name", label: "Healer's Name", type: "text" },
    ],
    template: { cure_wounds_cost: 10, restoration_cost: 40 },
  },
  Stable: {
    category: "venue",
    fields: [
      { key: "mounts_available", label: "Mounts Available", type: "array", description: "Horses, ponies, mules..." },
      { key: "rental_rate", label: "Rental Rate (gp/day)", type: "number" },
      { key: "capacity", label: "Stall Capacity", type: "number" },
      { key: "stable_master", label: "Stable Master's Name", type: "text" },
    ],
    template: { rental_rate: 2 },
  },
  Bank: {
    category: "venue",
    fields: [
      { key: "loan_rate", label: "Loan Interest Rate (%)", type: "number" },
      { key: "deposit_insurance", label: "Deposit Insurance (%)", type: "number" },
      { key: "vault_security", label: "Vault Security Level", type: "select", options: ["Basic", "Moderate", "High", "Maximum"] },
      { key: "banker_name", label: "Head Banker's Name", type: "text" },
    ],
    template: { vault_security: "High" },
  },
  Dockyard: {
    category: "venue",
    fields: [
      { key: "slips_available", label: "Slips Available", type: "number" },
      { key: "ship_types", label: "Ship Types", type: "array", description: "Rowboat, sailing ship, longship..." },
      { key: "repair_services", label: "Repair Services", type: "boolean" },
      { key: "harbor_master", label: "Harbor Master's Name", type: "text" },
    ],
    template: { repair_services: true },
  },
  Warehouse: {
    category: "venue",
    fields: [
      { key: "storage_capacity", label: "Storage Capacity (tons)", type: "number" },
      { key: "security_level", label: "Security Level", type: "select", options: ["Low", "Moderate", "High"] },
      { key: "owner", label: "Owner", type: "text" },
    ],
    template: { security_level: "Moderate" },
  },

  // Guilds
  AdventurersGuild: {
    category: "venue",
    fields: [
      { key: "membership_fee", label: "Membership Fee (gp)", type: "number" },
      { key: "job_board_active", label: "Job Board Active", type: "boolean" },
      { key: "guild_master", label: "Guild Master's Name", type: "text" },
    ],
    template: { job_board_active: true },
  },
  ThievesGuild: {
    category: "venue",
    fields: [
      { key: "secrecy_level", label: "Secrecy Level", type: "select", options: ["Open Secret", "Hidden", "Very Hidden"] },
      { key: "black_market", label: "Black Market Access", type: "boolean" },
      { key: "guild_master", label: "Guild Master's Name", type: "text" },
    ],
    template: { secrecy_level: "Hidden", black_market: true },
  },
  MagesGuild: {
    category: "venue",
    fields: [
      { key: "specializations", label: "Specializations", type: "array", description: "Schools of magic..." },
      { key: "library_access", label: "Library Access", type: "boolean" },
      { key: "archmage_name", label: "Archmage's Name", type: "text" },
    ],
    template: { library_access: true },
  },
  MerchantsGuild: {
    category: "venue",
    fields: [
      { key: "trade_focus", label: "Trade Focus", type: "text", placeholder: "Textiles, spices, ore..." },
      { key: "membership_benefits", label: "Membership Benefits", type: "array" },
      { key: "guild_master", label: "Guild Master's Name", type: "text" },
    ],
    template: {},
  },

  // Military
  Guardhouse: {
    category: "venue",
    fields: [
      { key: "force_size", label: "Guard Force Size", type: "number" },
      { key: "jail_cells", label: "Jail Cells", type: "number" },
      { key: "response_time_min", label: "Response Time (minutes)", type: "number" },
      { key: "captain_name", label: "Captain's Name", type: "text" },
    ],
    template: { force_size: 12, jail_cells: 4, response_time_min: 10 },
  },
  Barracks: {
    category: "venue",
    fields: [
      { key: "troop_capacity", label: "Troop Capacity", type: "number" },
      { key: "commander_name", label: "Commander's Name", type: "text" },
      { key: "training_yard", label: "Has Training Yard", type: "boolean" },
    ],
    template: { training_yard: true },
  },
  Garrison: {
    category: "venue",
    fields: [
      { key: "force_size", label: "Garrison Size", type: "number" },
      { key: "fortification_level", label: "Fortification Level", type: "select", options: ["Light", "Moderate", "Heavy", "Fortress"] },
      { key: "commander_name", label: "Commander's Name", type: "text" },
    ],
    template: { fortification_level: "Moderate" },
  },
  Gatehouse: {
    category: "venue",
    fields: [
      { key: "guards_on_duty", label: "Guards on Duty", type: "number" },
      { key: "checkpoint_thoroughness", label: "Checkpoint Thoroughness", type: "select", options: ["Minimal", "Standard", "Thorough", "Extreme"] },
      { key: "toll_cost", label: "Toll Cost (cp)", type: "number" },
    ],
    template: { checkpoint_thoroughness: "Standard", guards_on_duty: 4 },
  },
  Prison: {
    category: "venue",
    fields: [
      { key: "cell_count", label: "Cell Count", type: "number" },
      { key: "security_level", label: "Security Level", type: "select", options: ["Minimum", "Medium", "Maximum", "Arcane"] },
      { key: "warden_name", label: "Warden's Name", type: "text" },
    ],
    template: { security_level: "Medium" },
  },

  // Entertainment
  Theatre: {
    category: "venue",
    fields: [
      { key: "performances", label: "Performance Types", type: "array", description: "Plays, operas, concerts..." },
      { key: "seating_capacity", label: "Seating Capacity", type: "number" },
      { key: "ticket_price", label: "Ticket Price (gp)", type: "number" },
      { key: "director_name", label: "Director's Name", type: "text" },
    ],
    template: {},
  },
  Arena: {
    category: "venue",
    fields: [
      { key: "event_types", label: "Event Types", type: "array", description: "Gladiatorial, monster fights, sports..." },
      { key: "seating_capacity", label: "Seating Capacity", type: "number" },
      { key: "pit_master", label: "Pit Master's Name", type: "text" },
    ],
    template: {},
  },
  Bathhouse: {
    category: "venue",
    fields: [
      { key: "quality", label: "Quality", type: "select", options: ["Basic", "Standard", "Luxury"] },
      { key: "services", label: "Services", type: "array", description: "Massage, grooming, healing waters..." },
      { key: "rate", label: "Entry Rate (cp)", type: "number" },
    ],
    template: { quality: "Standard" },
  },
  Brothel: {
    category: "venue",
    fields: [
      { key: "quality", label: "Quality", type: "select", options: ["Low", "Standard", "High", "Exclusive"] },
      { key: "legal_status", label: "Legal Status", type: "select", options: ["Legal", "Tolerated", "Illegal"] },
      { key: "madame_name", label: "Madame/Manager's Name", type: "text" },
    ],
    template: { legal_status: "Tolerated" },
  },

  // Sites
  Cemetery: {
    category: "site",
    fields: [
      { key: "graves_count", label: "Number of Graves", type: "number" },
      { key: "undead_risk", label: "Undead Risk", type: "select", options: ["None", "Low", "Moderate", "High"] },
      { key: "notable_tombs", label: "Notable Tombs", type: "array" },
      { key: "caretaker_name", label: "Caretaker's Name", type: "text" },
    ],
    template: { undead_risk: "Low" },
  },
  Catacombs: {
    category: "site",
    fields: [
      { key: "depth_levels", label: "Depth Levels", type: "number" },
      { key: "undead_present", label: "Undead Present", type: "boolean" },
      { key: "secret_passages", label: "Secret Passages", type: "boolean" },
      { key: "treasures", label: "Known Treasures", type: "textarea" },
    ],
    template: { undead_present: true, secret_passages: true },
  },
  Dungeon: {
    category: "site",
    fields: [
      { key: "threat_level", label: "Threat Level (1-20)", type: "number" },
      { key: "factions_present", label: "Factions Present", type: "array" },
      { key: "key_rooms", label: "Key Rooms/Areas", type: "array" },
      { key: "hazards", label: "Environmental Hazards", type: "array" },
    ],
    template: {},
  },
  Fortress: {
    category: "site",
    fields: [
      { key: "garrison_size", label: "Garrison Size", type: "number" },
      { key: "defenses", label: "Defenses", type: "textarea", description: "Walls, towers, moat..." },
      { key: "commander_name", label: "Commander's Name", type: "text" },
    ],
    template: {},
  },
  Temple: {
    category: "site",
    fields: [
      { key: "deity", label: "Deity/Pantheon", type: "text" },
      { key: "size", label: "Size", type: "select", options: ["Shrine", "Small Temple", "Grand Temple", "Cathedral"] },
      { key: "priests", label: "Number of Priests", type: "number" },
      { key: "high_priest", label: "High Priest's Name", type: "text" },
    ],
    template: { size: "Small Temple" },
  },
  Tower: {
    category: "site",
    fields: [
      { key: "floors", label: "Number of Floors", type: "number" },
      { key: "purpose", label: "Purpose", type: "select", options: ["Wizard Tower", "Watch Tower", "Noble Estate", "Abandoned"] },
      { key: "owner", label: "Owner/Occupant", type: "text" },
    ],
    template: { floors: 4 },
  },
  Ruin: {
    category: "site",
    fields: [
      { key: "original_purpose", label: "Original Purpose", type: "text" },
      { key: "age", label: "Age (years)", type: "number" },
      { key: "danger_level", label: "Danger Level", type: "select", options: ["Safe", "Low", "Moderate", "High", "Deadly"] },
      { key: "inhabitants", label: "Current Inhabitants", type: "text" },
    ],
    template: { danger_level: "Moderate" },
  },
  Cave: {
    category: "site",
    fields: [
      { key: "depth", label: "Depth (feet)", type: "number" },
      { key: "inhabitants", label: "Inhabitants", type: "text" },
      { key: "water_source", label: "Contains Water Source", type: "boolean" },
    ],
    template: {},
  },
  Sewer: {
    category: "site",
    fields: [
      { key: "coverage_area", label: "Coverage Area", type: "text" },
      { key: "inhabitants", label: "Inhabitants", type: "array", description: "Criminals, monsters, workers..." },
      { key: "secret_entrances", label: "Known Secret Entrances", type: "number" },
    ],
    template: {},
  },
  TeleportCircle: {
    category: "site",
    fields: [
      { key: "sigil_sequence", label: "Sigil Sequence", type: "text" },
      { key: "destinations", label: "Known Destinations", type: "array" },
      { key: "guarded", label: "Guarded", type: "boolean" },
      { key: "fee", label: "Usage Fee (gp)", type: "number" },
    ],
    template: { guarded: true },
  },
  Portal: {
    category: "site",
    fields: [
      { key: "destination", label: "Destination", type: "text" },
      { key: "activation_requirement", label: "Activation Requirement", type: "text" },
      { key: "stability", label: "Stability", type: "select", options: ["Permanent", "Stable", "Unstable", "Random"] },
    ],
    template: { stability: "Stable" },
  },
  Landmark: {
    category: "site",
    fields: [
      { key: "significance", label: "Historical Significance", type: "textarea" },
      { key: "visitor_traffic", label: "Visitor Traffic", type: "select", options: ["None", "Low", "Moderate", "High"] },
    ],
    template: {},
  },
  Monument: {
    category: "site",
    fields: [
      { key: "commemorates", label: "Commemorates", type: "text" },
      { key: "age", label: "Age (years)", type: "number" },
      { key: "condition", label: "Condition", type: "select", options: ["Pristine", "Good", "Weathered", "Damaged", "Ruined"] },
    ],
    template: { condition: "Good" },
  },

  // Geographic
  Wilderness: {
    category: "geographic",
    fields: [
      { key: "terrain", label: "Terrain Type", type: "text" },
      { key: "hazards", label: "Natural Hazards", type: "array" },
      { key: "wildlife", label: "Notable Wildlife", type: "array" },
    ],
    template: {},
  },
  Forest: {
    category: "geographic",
    fields: [
      { key: "forest_type", label: "Forest Type", type: "select", options: ["Deciduous", "Coniferous", "Tropical", "Ancient"] },
      { key: "dangers", label: "Dangers", type: "array" },
      { key: "fey_presence", label: "Fey Presence", type: "boolean" },
    ],
    template: {},
  },
  Mountains: {
    category: "geographic",
    fields: [
      { key: "highest_peak", label: "Highest Peak (feet)", type: "number" },
      { key: "passes", label: "Known Passes", type: "array" },
      { key: "caves", label: "Known Caves/Mines", type: "array" },
    ],
    template: {},
  },
  Desert: {
    category: "geographic",
    fields: [
      { key: "desert_type", label: "Desert Type", type: "select", options: ["Sandy", "Rocky", "Salt Flat", "Badlands"] },
      { key: "oases", label: "Known Oases", type: "array" },
      { key: "hazards", label: "Hazards", type: "array" },
    ],
    template: {},
  },
  Swamp: {
    category: "geographic",
    fields: [
      { key: "navigability", label: "Navigability", type: "select", options: ["Easy", "Moderate", "Difficult", "Treacherous"] },
      { key: "diseases", label: "Common Diseases", type: "array" },
      { key: "inhabitants", label: "Inhabitants", type: "array" },
    ],
    template: { navigability: "Difficult" },
  },
  River: {
    category: "geographic",
    fields: [
      { key: "length", label: "Length (miles)", type: "number" },
      { key: "navigable", label: "Navigable", type: "boolean" },
      { key: "crossing_points", label: "Known Crossing Points", type: "array" },
    ],
    template: { navigable: true },
  },
  Coast: {
    category: "geographic",
    fields: [
      { key: "length", label: "Coastline Length (miles)", type: "number" },
      { key: "ports", label: "Major Ports", type: "array" },
      { key: "hazards", label: "Hazards", type: "array", description: "Reefs, pirates, storms..." },
    ],
    template: {},
  },

  Other: {
    category: "other",
    fields: [],
    template: {},
  },
};

// City/Town venue template for auto-spawn
export const CITY_VENUE_TEMPLATE = [
  { type: "Inn" as LocationType, name: "The Prancing Pony" },
  { type: "Tavern" as LocationType, name: "The Rusty Dragon" },
  { type: "Blacksmith" as LocationType, name: "Forge & Anvil" },
  { type: "GeneralStore" as LocationType, name: "General Goods" },
  { type: "TempleShrine" as LocationType, name: "Temple District" },
  { type: "Library" as LocationType, name: "Public Archives" },
  { type: "Guardhouse" as LocationType, name: "City Watch" },
  { type: "MarketStall" as LocationType, name: "Market Square" },
];
