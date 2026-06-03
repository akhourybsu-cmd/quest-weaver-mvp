/**
 * Data access for the Phase 2 rules-source tables (import_batches) and live
 * source-labelled content counts.
 *
 * As of the Phase 2 migration being applied and types.ts regenerated, these
 * tables/columns are in the generated `Database` schema, so this module uses the
 * typed Supabase client directly — no `any` cast needed. The only narrowing is
 * mapping the DB's `status` (typed as `string`) onto our domain union, which is
 * constrained by a CHECK constraint at the database level.
 */
import { supabase } from "@/integrations/supabase/client";

export type ImportBatchStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "partial"
  | "failed";

export interface ImportBatchRow {
  id: string;
  source_key: string;
  provider: string;
  content_type: string | null;
  status: ImportBatchStatus;
  imported: number;
  skipped: number;
  error_count: number;
  errors: unknown;
  params: unknown;
  triggered_by: string | null;
  started_at: string;
  finished_at: string | null;
  created_at: string;
}

/** Most recent import/sync runs, newest first. */
export async function listRecentImportBatches(
  limit = 20
): Promise<ImportBatchRow[]> {
  const { data, error } = await supabase
    .from("import_batches")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    status: r.status as ImportBatchStatus,
  })) as ImportBatchRow[];
}

/**
 * Count of builder spells grouped by source_key — a lightweight, live signal
 * that the Phase 2 source labelling is in effect. srd_spells is small (~hundreds
 * of rows) so a single bounded select aggregated client-side is fine.
 * Returns e.g. { "srd-5.1": 318 }.
 */
export async function getBuilderSpellCountsBySource(): Promise<
  Record<string, number>
> {
  const { data, error } = await supabase.from("srd_spells").select("source_key");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const key = (row as { source_key: string | null }).source_key ?? "(unlabelled)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
