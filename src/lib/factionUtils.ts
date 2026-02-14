// Unified reputation and influence labels/colors for the faction system.
// All faction-related components should import from here.

export function getReputationLabel(score: number): string {
  if (score >= 75) return "Revered";
  if (score >= 50) return "Friendly";
  if (score >= 25) return "Warm";
  if (score >= -25) return "Neutral";
  if (score >= -50) return "Unfriendly";
  if (score >= -75) return "Hostile";
  return "Hated";
}

export function getReputationColor(score: number): string {
  if (score >= 50) return "text-emerald-400";
  if (score >= 0) return "text-amber-400";
  return "text-red-400";
}

export function getReputationBadgeColor(score: number): string {
  if (score >= 50) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= 20) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (score >= -20) return "bg-slate-500/10 text-slate-500 border-slate-500/20";
  if (score >= -50) return "bg-orange-500/10 text-orange-500 border-orange-500/20";
  return "bg-red-500/10 text-red-500 border-red-500/20";
}

export function getInfluenceLabel(score: number | null): string {
  if (score === null) return "Unknown";
  if (score >= 80) return "Dominant";
  if (score >= 60) return "Strong";
  if (score >= 40) return "Moderate";
  if (score >= 20) return "Minor";
  return "Negligible";
}

export const FACTION_TYPES = [
  "Guild",
  "Religious Order",
  "Government",
  "Military",
  "Criminal",
  "Merchant",
  "Academic",
  "Other",
] as const;

export type FactionType = (typeof FACTION_TYPES)[number];
