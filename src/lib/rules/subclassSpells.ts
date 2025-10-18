// SRD-only auto-prepared spell lists. If a spell name is not present in your SRD table,
// the consumer code will filter it out (no crash). Expand as needed with SRD-included options.
export const AUTO_PREPARED_BY_SUBCLASS: Record<string, Record<number, string[]>> = {
  "Cleric:Life Domain": {
    1: ["Bless", "Cure Wounds"],
    3: ["Lesser Restoration", "Spiritual Weapon"],
    5: ["Beacon of Hope", "Revivify"]
    // Add higher levels if your SRD dataset includes them; otherwise omit.
  }
  // Add more SRD-only subclass mappings here if desired.
};
