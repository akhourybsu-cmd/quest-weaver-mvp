/**
 * Canonical registry of the open / legally-ingestible rules sources.
 *
 * This mirrors the rows seeded into the `rules_sources` table by migration
 * 20260603120000_phase2_rules_sources_registry.sql. It is the single TS-side
 * definition that the import providers (Open5eProvider, Dnd5eApiProvider, …),
 * the admin source registry, and the attribution page will all reuse so we
 * never drift between code and database.
 *
 * LEGAL GUARDRAIL: only open-licensed SRD / API / community-open material may
 * be listed here. Do NOT add proprietary, non-SRD WotC book content. A source
 * absent from (or disabled in) this registry must never be imported.
 */

export type RulesetTag = "2014" | "2024" | "a5e" | "homebrew" | "mixed";

/** Provider class responsible for ingesting a given source. */
export type RulesProvider =
  | "srd51"
  | "srd521"
  | "open5e"
  | "dnd5eapi"
  | "a5e"
  | "homebrew";

export interface RulesSourceDef {
  /** Stable identifier, also stored on content rows as `source_key`. */
  key: string;
  /** Display name. */
  name: string;
  ruleset: RulesetTag;
  version: string | null;
  license: string;
  licenseUrl: string | null;
  /** Human-readable credit line shown on the attribution page. */
  attribution: string;
  /** Canonical upstream URL. */
  upstreamUrl: string | null;
  provider: RulesProvider;
  /** Global legal kill-switch. A disabled source is never imported or shown. */
  isEnabled: boolean;
  /** True for the official WotC SRD documents. */
  isOfficial: boolean;
  sortOrder: number;
}

export const RULES_SOURCES: readonly RulesSourceDef[] = [
  {
    key: "srd-5.1",
    name: "D&D SRD 5.1",
    ruleset: "2014",
    version: "5.1",
    license: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "System Reference Document 5.1 © Wizards of the Coast LLC, licensed under CC BY 4.0",
    upstreamUrl: "https://dnd.wizards.com/resources/systems-reference-document",
    provider: "srd51",
    isEnabled: true,
    isOfficial: true,
    sortOrder: 10,
  },
  {
    key: "srd-5.2.1",
    name: "D&D SRD 5.2.1",
    ruleset: "2024",
    version: "5.2.1",
    license: "CC-BY-4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "System Reference Document 5.2.1 © Wizards of the Coast LLC, licensed under CC BY 4.0",
    upstreamUrl: "https://dnd.wizards.com/resources/systems-reference-document",
    provider: "srd521",
    isEnabled: true,
    isOfficial: true,
    sortOrder: 20,
  },
  {
    key: "open5e",
    name: "Open5e",
    ruleset: "mixed",
    version: "v2",
    license: "OGL-1.0a / CC-BY-4.0",
    licenseUrl: null,
    attribution:
      "Open5e — community-maintained open 5e content, used per upstream OGL/CC-BY licenses",
    upstreamUrl: "https://open5e.com/",
    provider: "open5e",
    isEnabled: true,
    isOfficial: false,
    sortOrder: 30,
  },
  {
    key: "dnd5eapi-2014",
    name: "D&D 5e API (5e-bits)",
    ruleset: "2014",
    version: "5.1",
    license: "OGL-1.0a",
    licenseUrl: null,
    attribution:
      "5e-bits D&D 5e API — SRD 5.1 content under the Open Game License 1.0a",
    upstreamUrl: "https://www.dnd5eapi.co/",
    provider: "dnd5eapi",
    isEnabled: true,
    isOfficial: false,
    sortOrder: 40,
  },
  {
    key: "a5e",
    name: "Level Up: Advanced 5e (A5E) SRD",
    ruleset: "a5e",
    version: "a5e-srd",
    license: "OGL-1.0a",
    licenseUrl: null,
    attribution:
      "Level Up: Advanced 5th Edition SRD © EN Publishing, under the Open Game License 1.0a",
    upstreamUrl: "https://a5esrd.com/",
    provider: "a5e",
    isEnabled: false, // enabled in Phase 10
    isOfficial: false,
    sortOrder: 50,
  },
  {
    key: "homebrew",
    name: "Homebrew",
    ruleset: "homebrew",
    version: null,
    license: "user-owned",
    licenseUrl: null,
    attribution: "User-created content — owned by its author",
    upstreamUrl: null,
    provider: "homebrew",
    isEnabled: true,
    isOfficial: false,
    sortOrder: 60,
  },
] as const;

/** The default source the character builder reads from (stable SRD 5.1). */
export const DEFAULT_SOURCE_KEY = "srd-5.1";

const BY_KEY: Record<string, RulesSourceDef> = Object.fromEntries(
  RULES_SOURCES.map((s) => [s.key, s])
);

export function getRulesSource(key: string): RulesSourceDef | undefined {
  return BY_KEY[key];
}

/** Sources currently allowed to be ingested/shown (legal kill-switch applied). */
export function enabledRulesSources(): RulesSourceDef[] {
  return RULES_SOURCES.filter((s) => s.isEnabled).sort(
    (a, b) => a.sortOrder - b.sortOrder
  );
}

/** Short label for a source key, e.g. "SRD 5.1". Falls back to the raw key. */
export function sourceLabel(key: string | null | undefined): string {
  if (!key) return "Unknown";
  return BY_KEY[key]?.name ?? key;
}
