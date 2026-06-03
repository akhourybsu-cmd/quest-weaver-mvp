/**
 * Per-campaign rules-source settings (Phase 6).
 *
 * Convention: a campaign with NO rows in campaign_rules_sources means "all
 * registered sources enabled" (so existing campaigns aren't affected). Once any
 * row exists, only sources with enabled=true are active for that campaign.
 *
 * NOTE: types.ts isn't regenerated for campaign_rules_sources yet, so the cast
 * is localized here (same approach we used for import_batches before regen).
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export interface CampaignSourceRow {
  campaign_id: string;
  source_key: string;
  enabled: boolean;
}

/**
 * Returns the set of enabled source_keys for a campaign, or `null` meaning
 * "no explicit config — treat all sources as enabled".
 */
export async function fetchCampaignEnabledSources(
  campaignId: string
): Promise<Set<string> | null> {
  const { data, error } = await db
    .from("campaign_rules_sources")
    .select("source_key,enabled")
    .eq("campaign_id", campaignId);
  if (error) throw error;
  const rows = (data ?? []) as Array<{ source_key: string; enabled: boolean }>;
  if (rows.length === 0) return null; // unconfigured → all enabled
  return new Set(rows.filter((r) => r.enabled).map((r) => r.source_key));
}

/** DM toggle: upsert a single source's enabled flag for a campaign. */
export async function setCampaignSourceEnabled(
  campaignId: string,
  sourceKey: string,
  enabled: boolean
): Promise<void> {
  const { error } = await db
    .from("campaign_rules_sources")
    .upsert(
      { campaign_id: campaignId, source_key: sourceKey, enabled },
      { onConflict: "campaign_id,source_key" }
    );
  if (error) throw error;
}

/** True if a source is active for the campaign given its settings (null = all). */
export function isSourceEnabledForCampaign(
  enabled: Set<string> | null,
  sourceKey: string
): boolean {
  return enabled === null || enabled.has(sourceKey);
}

export interface UseCampaignSources {
  /** enabled source_keys, or null = all sources enabled (unconfigured) */
  enabled: Set<string> | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/** React hook. Pass a campaignId (or undefined to skip — yields null = all). */
export function useCampaignEnabledSources(campaignId?: string): UseCampaignSources {
  const [enabled, setEnabled] = useState<Set<string> | null>(null);
  const [loading, setLoading] = useState(!!campaignId);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!campaignId) {
      setEnabled(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchCampaignEnabledSources(campaignId)
      .then(setEnabled)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load source settings"))
      .finally(() => setLoading(false));
  }, [campaignId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { enabled, loading, error, refresh };
}
