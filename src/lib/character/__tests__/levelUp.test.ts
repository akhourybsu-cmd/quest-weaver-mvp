import { describe, it, expect } from "vitest";
import { commitLevelUp, type LevelUpDb, type LevelUpPlan } from "../levelUp";
import type { CharacterClassEntry } from "../classes";

// ── Fake Supabase-shaped DB ────────────────────────────────────────────────
interface Write {
  table: string;
  op: "insert" | "update" | "upsert";
  match?: Record<string, any>;
  values: any;
}

function makeDb(initialSlots: Array<{ slot_level: number; max_slots: number; used_slots: number; bonus_slots: number }> = []) {
  const writes: Write[] = [];
  // mutable slot store, so reconciliation reads reflect prior writes
  const slotStore = [...initialSlots];
  const db: LevelUpDb = {
    async insert(table, rows) {
      const rowArr = Array.isArray(rows) ? rows : [rows];
      for (const r of rowArr) {
        writes.push({ table, op: "insert", values: r });
        if (table === "character_spell_slots") {
          slotStore.push({
            slot_level: r.slot_level,
            max_slots: r.max_slots,
            used_slots: r.used_slots ?? 0,
            bonus_slots: r.bonus_slots ?? 0,
          });
        }
      }
    },
    async update(table, match, values) {
      writes.push({ table, op: "update", match, values });
      if (table === "character_spell_slots") {
        const row = slotStore.find((s) => s.slot_level === match.slot_level);
        if (row) Object.assign(row, values);
      }
    },
    async upsert(table, rows) {
      const rowArr = Array.isArray(rows) ? rows : [rows];
      for (const r of rowArr) writes.push({ table, op: "upsert", values: r });
    },
    async listSpellSlots() {
      return slotStore.map((r) => ({ ...r }));
    },
  };
  return { db, writes, slotStore };
}

const CHAR_ID = "char-1";
const FIGHTER_ID = "cls-fighter";
const WIZARD_ID = "cls-wizard";
const WARLOCK_ID = "cls-warlock";

function fighter(level: number, primary = true): CharacterClassEntry {
  return { rowId: "row-f", classId: FIGHTER_ID, className: "Fighter", level, isPrimary: primary, subclassId: null };
}
function wizard(level: number, primary = false): CharacterClassEntry {
  return { rowId: "row-w", classId: WIZARD_ID, className: "Wizard", level, isPrimary: primary, subclassId: null };
}
function warlock(level: number, primary = false): CharacterClassEntry {
  return { rowId: "row-wl", classId: WARLOCK_ID, className: "Warlock", level, isPrimary: primary, subclassId: null };
}

function basePlan(overrides: Partial<LevelUpPlan> = {}): LevelUpPlan {
  return {
    characterId: CHAR_ID,
    currentClasses: [fighter(3)],
    target: {
      classId: FIGHTER_ID,
      className: "Fighter",
      hitDie: 10,
      isNewMulticlass: false,
    },
    hpGain: 7,
    ...overrides,
  };
}

describe("commitLevelUp — single-class level (Fighter 3 → Fighter 4)", () => {
  it("updates character_classes, records level history, bumps hit_dice_total", async () => {
    const { db, writes } = makeDb();
    const result = await commitLevelUp(basePlan(), db);

    expect(result.classLevelTransition).toEqual({ previous: 3, new: 4 });
    expect(result.newTotalLevel).toBe(4);
    expect(result.newClasses).toEqual([{ ...fighter(4) }]);

    const cc = writes.find((w) => w.table === "character_classes");
    expect(cc).toMatchObject({ op: "update", match: { character_id: CHAR_ID, class_id: FIGHTER_ID }, values: { class_level: 4 } });

    const charUpd = writes.find((w) => w.table === "characters");
    expect(charUpd?.values).toMatchObject({ level: 4, hit_dice_total: 4 });

    const hist = writes.find((w) => w.table === "character_level_history");
    expect(hist?.values).toMatchObject({ class_id: FIGHTER_ID, previous_level: 3, new_level: 4, hp_gained: 7 });

    // Pure martial Fighter 4 → no spell-slot writes
    expect(writes.filter((w) => w.table === "character_spell_slots")).toHaveLength(0);
    expect(result.slotActions).toEqual([]);
  });
});

describe("commitLevelUp — add a new class (Fighter 3 → Fighter 3 / Wizard 1)", () => {
  it("inserts new character_classes row, records 0→1 transition, grants Wizard L1 slots", async () => {
    const { db, writes } = makeDb();
    const result = await commitLevelUp(
      basePlan({
        target: { classId: WIZARD_ID, className: "Wizard", hitDie: 6, isNewMulticlass: true },
        hpGain: 4,
      }),
      db,
    );

    expect(result.classLevelTransition).toEqual({ previous: 0, new: 1 });
    expect(result.newTotalLevel).toBe(4);
    expect(result.newClasses.map((c) => `${c.className}${c.level}`)).toEqual(["Fighter3", "Wizard1"]);

    const cc = writes.find((w) => w.table === "character_classes" && w.op === "insert");
    expect(cc?.values).toMatchObject({ character_id: CHAR_ID, class_id: WIZARD_ID, class_level: 1, is_primary: false });

    const hist = writes.find((w) => w.table === "character_level_history");
    expect(hist?.values).toMatchObject({ class_id: WIZARD_ID, previous_level: 0, new_level: 1 });

    // Multiclass spellcaster level: Fighter (martial) 0 + Wizard 1 = 1 → 2 first-level slots
    const slotInserts = writes.filter((w) => w.table === "character_spell_slots" && w.op === "insert");
    expect(slotInserts).toHaveLength(1);
    expect(slotInserts[0].values).toMatchObject({ slot_level: 1, max_slots: 2, used_slots: 0 });
    expect(result.slotActions).toEqual([{ slot_level: 1, action: "insert", max_slots: 2 }]);
  });
});

describe("commitLevelUp — level secondary class (Fighter 3 / Wizard 2 → Wizard 3)", () => {
  it("bumps Wizard's class level (not Fighter's), records Wizard 2→3, expands slot table", async () => {
    // Wizard 2 currently grants 3 L1 slots (from multiclass table at caster level 2).
    const { db, writes } = makeDb([
      { slot_level: 1, max_slots: 3, used_slots: 1, bonus_slots: 0 },
    ]);
    const result = await commitLevelUp(
      basePlan({
        currentClasses: [fighter(3), wizard(2)],
        target: { classId: WIZARD_ID, className: "Wizard", hitDie: 6, isNewMulticlass: false },
        hpGain: 4,
      }),
      db,
    );

    expect(result.classLevelTransition).toEqual({ previous: 2, new: 3 });
    expect(result.newClasses.find((c) => c.className === "Fighter")?.level).toBe(3);
    expect(result.newClasses.find((c) => c.className === "Wizard")?.level).toBe(3);
    expect(result.newTotalLevel).toBe(6);

    const cc = writes.find((w) => w.table === "character_classes" && w.op === "update");
    expect(cc).toMatchObject({ match: { class_id: WIZARD_ID }, values: { class_level: 3 } });

    // Caster level 3 (Wizard 3, Fighter contributes 0): 4 L1 + 2 L2
    const slotWrites = writes.filter((w) => w.table === "character_spell_slots");
    const l1 = slotWrites.find((w) => (w.values?.slot_level ?? w.match?.slot_level) === 1);
    const l2 = slotWrites.find((w) => (w.values?.slot_level ?? w.match?.slot_level) === 2);
    expect(l1?.op).toBe("update");
    expect(l1?.values).toMatchObject({ max_slots: 4, used_slots: 1 }); // used preserved (1 ≤ 4)
    expect(l2?.op).toBe("insert");
    expect(l2?.values).toMatchObject({ slot_level: 2, max_slots: 2 });
  });

  it("clamps used_slots when new max is lower than previous used count", async () => {
    // Contrived: previously had used=3 at L1; if multiclass shrinks max to 2, used must clamp.
    const { db, writes } = makeDb([
      { slot_level: 1, max_slots: 4, used_slots: 3, bonus_slots: 1 },
    ]);
    // Single Wizard 1 → 2 L1 slots
    await commitLevelUp(
      {
        characterId: CHAR_ID,
        currentClasses: [],
        target: { classId: WIZARD_ID, className: "Wizard", hitDie: 6, isNewMulticlass: true },
        hpGain: 6,
      },
      db,
    );
    const upd = writes.find((w) => w.table === "character_spell_slots" && w.op === "update");
    expect(upd?.values).toMatchObject({ max_slots: 2, used_slots: 2 });
    // bonus_slots is preserved (not in the update payload)
    expect(upd?.values.bonus_slots).toBeUndefined();
  });
});

describe("commitLevelUp — Warlock + full caster (Wizard 3 / Warlock 2 → Warlock 3)", () => {
  it("excludes Warlock from multiclass slot table — pact slot rows are not touched", async () => {
    // Pre-existing rows: multiclass slots from Wizard 3 (caster level 3 = 4×L1 + 2×L2)
    // PLUS a Warlock pact-slot row at slot_level 1 with max_slots that should NOT be overwritten.
    // We simulate the pact slots living in the same table by adding a "high" row not in the
    // multiclass desired set; reconciliation must leave it alone.
    const { db, writes, slotStore } = makeDb([
      { slot_level: 1, max_slots: 4, used_slots: 0, bonus_slots: 0 },
      { slot_level: 2, max_slots: 2, used_slots: 0, bonus_slots: 0 },
      // Pretend slot_level 9 is being used as a sentinel for pact slots in this test
      { slot_level: 9, max_slots: 99, used_slots: 0, bonus_slots: 0 },
    ]);

    const result = await commitLevelUp(
      {
        characterId: CHAR_ID,
        currentClasses: [wizard(3, true), warlock(2)],
        target: { classId: WARLOCK_ID, className: "Warlock", hitDie: 8, isNewMulticlass: false },
        hpGain: 5,
      },
      db,
    );

    expect(result.classLevelTransition).toEqual({ previous: 2, new: 3 });
    expect(result.newTotalLevel).toBe(6);

    // Warlock excluded → multiclass caster level = Wizard 3 → still 4×L1 + 2×L2 (no change)
    // So L1/L2 should be noop, no other slot levels written, and the sentinel L9 row untouched.
    const slotMutations = writes.filter(
      (w) => w.table === "character_spell_slots" && w.op !== "insert" || (w.op === "insert" && w.table === "character_spell_slots"),
    );
    // No inserts (rows already exist), no updates (max unchanged)
    const inserts = slotMutations.filter((w) => w.op === "insert");
    const updates = slotMutations.filter((w) => w.op === "update");
    expect(inserts).toHaveLength(0);
    expect(updates).toHaveLength(0);

    // Sentinel pact-slot row preserved
    const pact = slotStore.find((r) => r.slot_level === 9);
    expect(pact).toEqual({ slot_level: 9, max_slots: 99, used_slots: 0, bonus_slots: 0 });

    // Result reports 2 noop actions for L1/L2
    expect(result.slotActions).toEqual(
      expect.arrayContaining([
        { slot_level: 1, action: "noop", max_slots: 4 },
        { slot_level: 2, action: "noop", max_slots: 2 },
      ]),
    );
  });

  it("level history records Warlock's per-class transition (not character total)", async () => {
    const { db, writes } = makeDb();
    await commitLevelUp(
      {
        characterId: CHAR_ID,
        currentClasses: [wizard(3, true), warlock(2)],
        target: { classId: WARLOCK_ID, className: "Warlock", hitDie: 8, isNewMulticlass: false },
        hpGain: 5,
      },
      db,
    );
    const hist = writes.find((w) => w.table === "character_level_history");
    expect(hist?.values).toMatchObject({
      class_id: WARLOCK_ID,
      previous_level: 2, // Warlock 2 → 3, NOT total 5 → 6
      new_level: 3,
    });
  });
});

describe("commitLevelUp — write ordering & idempotency guarantees", () => {
  it("never writes character_classes for the wrong class on a multiclass level-up", async () => {
    const { db, writes } = makeDb();
    await commitLevelUp(
      basePlan({
        currentClasses: [fighter(3), wizard(2)],
        target: { classId: WIZARD_ID, className: "Wizard", hitDie: 6, isNewMulticlass: false },
      }),
      db,
    );
    const ccWrites = writes.filter((w) => w.table === "character_classes");
    expect(ccWrites).toHaveLength(1);
    expect(ccWrites[0].match?.class_id).toBe(WIZARD_ID);
    // Fighter row untouched
    expect(ccWrites.some((w) => w.match?.class_id === FIGHTER_ID)).toBe(false);
  });

  it("hit_dice_total mirrors total character level after multiclass add", async () => {
    const { db, writes } = makeDb();
    await commitLevelUp(
      basePlan({
        currentClasses: [fighter(5)],
        target: { classId: WIZARD_ID, className: "Wizard", hitDie: 6, isNewMulticlass: true },
      }),
      db,
    );
    const charUpd = writes.find((w) => w.table === "characters");
    expect(charUpd?.values).toMatchObject({ level: 6, hit_dice_total: 6 });
  });
});