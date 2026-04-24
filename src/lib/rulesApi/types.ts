/**
 * Normalized rules-API content shape — UI never depends on raw Open5e or
 * dnd5eapi shapes directly. See supabase/functions/rules-api/index.ts.
 */
export type RulesContentType =
  | "creature"
  | "spell"
  | "condition"
  | "rule"
  | "class"
  | "species"
  | "background"
  | "feat"
  | "equipment"
  | "magic_item"
  | "search";

export type RulesSourceApi = "open5e_v2" | "dnd5eapi_2014" | "open5e_v1";

export interface NormalizedRulesItem {
  id: string;
  key: string;
  slug: string | null;
  name: string;
  content_type: RulesContentType;
  source_api: RulesSourceApi;
  source_document: string | null;
  ruleset_version: string | null;
  license_type: string;
  short_description: string;
  full_description: string;
  tags: string[];
  raw_json: unknown;
  normalized_json: Record<string, unknown>;
  last_fetched_at: string;
}

export interface RulesListResponse {
  items: NormalizedRulesItem[];
  source: RulesSourceApi;
  count: number;
  latency_ms: number;
  fallback_used: boolean;
  from_cache?: boolean;
}

export interface RulesDetailResponse {
  item: NormalizedRulesItem;
  source: RulesSourceApi;
  fallback_used: boolean;
  from_cache: boolean;
  stale?: boolean;
  latency_ms?: number;
}

export interface RulesHealthCheck {
  name: string;
  url: string;
  status: "Connected" | "Failed" | "Connected with fallback" | "Cached only" | "Not configured" | "Mock data detected";
  latency_ms: number;
  sample?: string;
  error?: string;
}

export interface RulesHealthResponse {
  checked_at: string;
  checks: RulesHealthCheck[];
  cache_count: number;
  summary: string;
}