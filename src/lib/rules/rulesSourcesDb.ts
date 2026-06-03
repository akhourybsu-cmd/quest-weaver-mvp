/**
 * Data access for the Phase 2 rules-source tables (import_batches) and live
 * source-labelled content counts.
 *
 * NOTE: the generated src/integrations/supabase/types.ts has not yet been
 * regenerated for the Phase 2 migration, so `import_batches` and the new
 * `source_key` columns are not in the typed `Database` schema. We localize the
 * necessary `any` cast here (rather than hand-editing the generated types file)
 * so the rest of the app stays strongly typed. Once types are regenerated these
 * casts become harmless.
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

// Localized escape hatch around the not-yet-regenerated generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

/** Most recent import/sync runs, newest first. */
export async function listRecentImportBatches(
  limit = 20
): Promise<ImportBatchRow[]> {
  const { data, error } = await db
    .from("import_batches")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ImportBatchRow[];
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
  const { data, error } = await db.from("srd_spells").select("source_key");
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ source_key: string | null }>) {
    const key = row.source_key ?? "(unlabelled)";
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
