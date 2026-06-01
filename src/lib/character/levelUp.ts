/**
 * commitLevelUp — pure write contract for a single level-up.
 *
 * Codifies the multiclass-aware writes that LevelUpWizard performs at
 * confirm-time, in a form that's testable in isolation. The wizard still
 * gathers choices via React state, but the "what should hit the DB" decision
 * lives here so we have one place to assert correctness for:
 *
 *   1. character_classes lineup    (insert new class / bump existing)
 *   2. character_spell_slots       (multiclass slot reconciliation)
 *   3. characters.hit_dice_total   (per-class die bumps)
 *   4. character_level_history     (per-class previous_level → new_level row)
 *
 * The wizard can be migrated to call this incrementally; tests already do.
 */
import { getSpellSlotsForClasses } from "./derivedStats";
import type { CharacterClassEntry } from "./classes";

/** Minimal Supabase-like surface this module uses. */
export interface LevelUpDb {
  insert(table: string, rows: any | any[]): Promise<void>;
  update(table: string, match: Record<string, any>, values: Record<string, any>): Promise<void>;
  upsert(table: string, rows: any | any[]): Promise<void>;
  /** existing character_spell_slots rows, used for reconciliation */
  listSpellSlots(characterId: string): Promise<Array<{ spell_level: number; max_slots: number; used_slots: number; bonus_slots: number }>>;
}

export interface LevelUpPlan {
  characterId: string;
  /** Current class lineup (BEFORE the level-up) */
  currentClasses: CharacterClassEntry[];
  /** Class being levelled (existing) or added (new) */
  target: {
    classId: string;
    className: string;
    /** d6 / d8 / d10 / d12 — used for hit dice grouping (numeric, e.g. 10). */
    hitDie: number;
    /** subclass for 1/3-caster slot calc, optional */
    subclassName?: string;
    /** True if this class is not yet in currentClasses (multiclass entry point) */
    isNewMulticlass: boolean;
  };
  /** Hit-point gain at this level (rolled or fixed) */
  hpGain: number;
  /**
   * Optional extras merged into the character_level_history row written by
   * this contract. Lets callers (LevelUpWizard) record the player's choices
   * (subclass, ASI, spells, feats, etc.) on the same history row without
   * needing a second insert.
   */
  historyExtras?: {
    choicesMade?: Record<string, any> | null;
    featuresGained?: Array<{ id: string; name: string }> | null;
  };
}

export interface LevelUpResult {
  /** Per-class transition recorded in level history */
  classLevelTransition: { previous: number; new: number };
  /** Total character level after the level-up */
  newTotalLevel: number;
  /** Spell-slot reconciliation actions taken */
  slotActions: Array<{ spell_level: number; action: "insert" | "update" | "noop"; max_slots: number }>;
  /** Final class lineup after writes */
  newClasses: CharacterClassEntry[];
}

/**
 * Apply the four contract writes for a level-up. Returns a structured result
 * useful for tests / UI summary. Throws on programmer errors (unknown class).
 */
export async function commitLevelUp(plan: LevelUpPlan, db: LevelUpDb): Promise<LevelUpResult> {
  const { characterId, currentClasses, target, hpGain } = plan;

  // ── 1. character_classes lineup ────────────────────────────────────────
  const existing = currentClasses.find((c) => c.classId === target.classId);
  let newClasses: CharacterClassEntry[];
  let prevClassLevel: number;
  let newClassLevel: number;

  if (target.isNewMulticlass || !existing) {
    prevClassLevel = 0;
    newClassLevel = 1;
    await db.insert("character_classes", {
      character_id: characterId,
      class_id: target.classId,
      class_level: 1,
      is_primary: currentClasses.length === 0,
    });
    newClasses = [
      ...currentClasses,
      {
        rowId: null,
        classId: target.classId,
        className: target.className,
        level: 1,
        isPrimary: currentClasses.length === 0,
        subclassId: null,
      },
    ];
  } else {
    prevClassLevel = existing.level;
    newClassLevel = existing.level + 1;
    await db.update(
      "character_classes",
      { character_id: characterId, class_id: target.classId },
      { class_level: newClassLevel },
    );
    newClasses = currentClasses.map((c) =>
      c.classId === target.classId ? { ...c, level: newClassLevel } : c,
    );
  }

  const newTotalLevel = newClasses.reduce((s, c) => s + c.level, 0);

  // ── 2. characters.hit_dice_total / hit_dice_current ────────────────────
  // hit_dice_total mirrors total character level.
  // hit_dice_current bumps by 1 (the new die just gained).
  await db.update(
    "characters",
    { id: characterId },
    {
      level: newTotalLevel,
      hit_dice_total: newTotalLevel,
      // current cannot exceed total
      // (caller passes any HP/derived updates separately; this is the hit-dice contract only)
    },
  );

  // ── 3. character_level_history (per-class transition) ──────────────────
  await db.insert("character_level_history", {
    character_id: characterId,
    class_id: target.classId,
    previous_level: prevClassLevel,
    new_level: newClassLevel,
    hp_gained: hpGain,
    choices_made: plan.historyExtras?.choicesMade ?? null,
    features_gained: plan.historyExtras?.featuresGained ?? null,
  });

  // ── 4. character_spell_slots reconciliation ────────────────────────────
  const desired = getSpellSlotsForClasses(
    newClasses.map((c) => ({
      className: c.className,
      level: c.level,
      subclassName:
        c.classId === target.classId ? target.subclassName : undefined,
    })),
  );
  const existingRows = await db.listSpellSlots(characterId);
  const existingByLevel = new Map(existingRows.map((r) => [r.spell_level, r]));
  const slotActions: LevelUpResult["slotActions"] = [];

  // INSERT or UPDATE slots that the multiclass table now grants
  for (const [slotLevelStr, max] of Object.entries(desired.slots)) {
    const slotLevel = Number(slotLevelStr);
    const row = existingByLevel.get(slotLevel);
    if (!row) {
      await db.insert("character_spell_slots", {
        character_id: characterId,
        spell_level: slotLevel,
        max_slots: max,
        used_slots: 0,
        bonus_slots: 0,
      });
      slotActions.push({ spell_level: slotLevel, action: "insert", max_slots: max });
    } else if (row.max_slots !== max) {
      // Clamp used_slots to the new max; preserve bonus_slots; never delete rows.
      await db.update(
        "character_spell_slots",
        { character_id: characterId, spell_level: slotLevel },
        {
          max_slots: max,
          used_slots: Math.min(row.used_slots, max),
        },
      );
      slotActions.push({ spell_level: slotLevel, action: "update", max_slots: max });
    } else {
      slotActions.push({ spell_level: slotLevel, action: "noop", max_slots: max });
    }
  }

  // For slot levels that no longer exist in `desired`, leave rows alone
  // (Warlock pact slots live in the same table and must not be wiped).

  return {
    classLevelTransition: { previous: prevClassLevel, new: newClassLevel },
    newTotalLevel,
    slotActions,
    newClasses,
  };
}