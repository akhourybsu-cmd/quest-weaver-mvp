/**
 * Canonical source of truth for a character's classes.
 *
 * Reads from the `character_classes` table (one row per class, with
 * `is_primary`, `class_level`, optional `subclass_id`). Falls back to the
 * legacy `characters.class` text + `characters.level` int when no rows exist,
 * so old single-class characters keep working without a backfill.
 *
 * IMPORTANT:
 * - `character_classes` is the current state.
 * - `character_class_levels` is per-level history (do NOT use for "current
 *   class levels"; use it for audit / level-up timeline only).
 * - `characters.level` should equal SUM(character_classes.class_level). It
 *   is preserved as a denormalized field for legacy code paths and quick
 *   queries; treat it as derived.
 */
import { supabase } from "@/integrations/supabase/client";

export interface CharacterClassEntry {
  /** character_classes.id (null if synthesized from legacy fields) */
  rowId: string | null;
  /** srd_classes.id (null if the legacy class name didn't match SRD) */
  classId: string | null;
  /** Display name, e.g. "Fighter" */
  className: string;
  /** Current level in this class (1..20) */
  level: number;
  /** True for the starting / primary class */
  isPrimary: boolean;
  /** srd_subclasses.id, if a subclass has been chosen */
  subclassId: string | null;
}

export interface CharacterClassesResult {
  classes: CharacterClassEntry[];
  /** SUM of all class levels. Should match characters.level. */
  totalLevel: number;
  /** True if we had to synthesize from legacy characters.class/level */
  isLegacyFallback: boolean;
}

/**
 * Load a character's classes from the canonical table, falling back to the
 * legacy denormalized fields on `characters` if no rows exist.
 */
export async function getCharacterClasses(
  characterId: string,
): Promise<CharacterClassesResult> {
  // 1) Try canonical table
  const { data: ccRows, error: ccErr } = await supabase
    .from("character_classes")
    .select(
      `
      id,
      class_id,
      class_level,
      is_primary,
      subclass_id,
      srd_classes:class_id ( name )
    `,
    )
    .eq("character_id", characterId)
    .order("is_primary", { ascending: false });

  if (ccErr) {
    console.error("[getCharacterClasses] character_classes error", ccErr);
  }

  if (ccRows && ccRows.length > 0) {
    const classes: CharacterClassEntry[] = ccRows.map((r: any) => ({
      rowId: r.id,
      classId: r.class_id,
      className: r.srd_classes?.name ?? "Unknown",
      level: r.class_level ?? 1,
      isPrimary: !!r.is_primary,
      subclassId: r.subclass_id ?? null,
    }));
    const totalLevel = classes.reduce((sum, c) => sum + c.level, 0);
    return { classes, totalLevel, isLegacyFallback: false };
  }

  // 2) Fallback: synthesize a single primary class from characters.class/level
  const { data: char, error: charErr } = await supabase
    .from("characters")
    .select("class, level")
    .eq("id", characterId)
    .maybeSingle();

  if (charErr || !char) {
    return { classes: [], totalLevel: 0, isLegacyFallback: true };
  }

  const className = (char.class ?? "").toString().trim() || "Unknown";
  const level = Math.max(1, char.level ?? 1);
  return {
    classes: [
      {
        rowId: null,
        classId: null,
        className,
        level,
        isPrimary: true,
        subclassId: null,
      },
    ],
    totalLevel: level,
    isLegacyFallback: true,
  };
}

/**
 * Total character level = sum of all class levels.
 * This is the value used for proficiency bonus.
 */
export function getTotalLevelFromClasses(
  classes: Pick<CharacterClassEntry, "level">[],
): number {
  return classes.reduce((sum, c) => sum + c.level, 0);
}

/**
 * "Fighter 3 / Wizard 2" style label. Primary class first.
 */
export function getClassBreakdownLabel(
  classes: Pick<CharacterClassEntry, "className" | "level" | "isPrimary">[],
): string {
  if (classes.length === 0) return "—";
  const sorted = [...classes].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
  );
  return sorted.map((c) => `${c.className} ${c.level}`).join(" / ");
}
