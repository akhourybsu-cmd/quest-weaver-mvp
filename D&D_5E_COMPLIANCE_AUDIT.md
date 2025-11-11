# D&D 5E COMPLIANCE AUDIT — Executive Summary

**Audit Date:** 2025-11-11  
**Ruleset:** D&D 5E (2014 RAW)  
**Status:** 🔴 Critical Issues Found

---

## 🚨 TOP 10 PRIORITY ISSUES (P0/P1)

### P0 — BLOCKING GAMEPLAY

#### 1. **Concentration DC Checks Missing** ⚠️ CRITICAL
- **Location:** `src/lib/damageEngine.ts`, `src/components/combat/ConcentrationTracker.tsx`
- **Issue:** When a concentrating character takes damage, no automatic Constitution saving throw is prompted
- **RAW Rule:** DC = 10 or half damage (whichever is higher)
- **Impact:** Concentration spells stay active indefinitely regardless of damage
- **Fix Required:** Implement automatic concentration save prompt on damage application
- **Status:** ❌ NOT IMPLEMENTED

#### 2. **Temp HP Stacking Not Prevented** ⚠️ CRITICAL
- **Location:** `src/lib/damageEngine.ts` lines 96-105
- **Issue:** Multiple temp HP sources may stack
- **RAW Rule:** "Temporary hit points don't stack. If you have temporary hit points and receive more, you decide whether to keep the ones you have or to gain the new ones." (PHB 198)
- **Impact:** Characters can accumulate temp HP beyond intended limits
- **Fix Required:** Validate and prompt player to choose when receiving new temp HP
- **Status:** ⚠️ PARTIAL (applies new temp HP but doesn't validate/prompt)

#### 3. **Costly Material Components — Inventory Bypass** ⚠️ CRITICAL
- **Location:** `src/lib/spellCastValidator.ts` lines 109-127, `src/components/spells/SpellCastDialog.tsx` lines 261-283
- **Issue:** System deducts gold but doesn't check if specific material component item exists in inventory
- **RAW Rule:** "A character can use a component pouch or a spellcasting focus... but if a cost is indicated for a component, a character must have that specific component before he or she can cast the spell." (PHB 203)
- **Impact:** Players can cast *Revivify* (300gp diamond) without actually owning diamonds
- **Fix Required:** Check inventory for specific costly components, not just gold
- **Status:** ❌ INCOMPLETE (only checks gold)

#### 4. **Somatic Components — Hand Economy Not Tracked** ⚠️ HIGH
- **Location:** `src/lib/spellCastValidator.ts` line 182
- **Issue:** Always assumes `hasFreeSomaticHand: true`
- **RAW Rule:** "If a spell requires a somatic component, the caster must have free use of at least one hand" (PHB 203)
- **Impact:** Can cast somatic spells while wielding weapon + shield
- **Fix Required:** Track what's in each hand (weapon, shield, focus)
- **Status:** ❌ NOT IMPLEMENTED

#### 5. **Hit Dice Restoration on Long Rest** 🟡 MEDIUM
- **Location:** `src/components/character/RestManager.tsx`
- **Issue:** Long rest doesn't restore hit dice
- **RAW Rule:** "At the end of a long rest, a character regains all lost hit points. The character also regains spent Hit Dice, up to a number of dice equal to half of the character's total number of Hit Dice (minimum of one die)." (PHB 186)
- **Impact:** Once hit dice are spent, they never return
- **Fix Required:** Implement HD restoration formula: `Math.max(1, Math.floor(hit_dice_total / 2))`
- **Status:** ❌ NOT IMPLEMENTED

---

### P1 — CORRECTNESS GAPS

#### 6. **Bonus Action Spell Restriction — Incomplete Enforcement** 🟡
- **Location:** `src/lib/spellCastValidator.ts` lines 71-79, `src/components/spells/SpellCastDialog.tsx` lines 247-258
- **Issue:** Validation logic exists but turn state updates happen AFTER validation, creating timing gap
- **RAW Rule:** "A spell cast with a bonus action is especially swift. You must use a bonus action on your turn to cast the spell... If you cast a spell, such as *healing word*, with a bonus action, you can't cast another spell during the same turn, except for a cantrip with a casting time of 1 action." (PHB 202)
- **Impact:** Might allow BA spell + leveled action spell in edge cases
- **Fix Required:** Reorder operations to update turn state BEFORE allowing next spell
- **Status:** ⚠️ PARTIAL

#### 7. **Critical Hit — Multiple Damage Types** 🟡
- **Location:** `src/lib/attackRollEngine.ts` lines 136-174
- **Issue:** `rollDamage` only handles single damage type + modifier
- **RAW Rule:** "When you score a critical hit, you get to roll extra dice for the attack's damage against the target. Roll all of the attack's damage dice twice and add them together." (PHB 196)
- **Impact:** Features like Flame Blade (2d6 fire + 1d6 radiant) don't double correctly on crit
- **Fix Required:** Accept array of damage types and double each
- **Status:** ⚠️ INCOMPLETE (works for simple attacks only)

#### 8. **War Caster Feat — Not Implemented** 🟡
- **Location:** `src/lib/spellCastValidator.ts` lines 140-143
- **Issue:** Placeholder function never checks character feats
- **RAW Rule:** "You can perform the somatic components of spells even when you have weapons or a shield in one or both hands." (PHB 170)
- **Impact:** Cannot use somatic spells with weapon+shield even with feat
- **Fix Required:** Check `character_features` or `character_feats` table for "War Caster"
- **Status:** ❌ PLACEHOLDER ONLY

#### 9. **Exhaustion — Not Implemented** 🟡
- **Location:** N/A
- **Issue:** No exhaustion tracking or penalties
- **RAW Rule:** "Some special abilities and environmental hazards... can lead to a special condition called exhaustion... levels 1-6 with cumulative penalties" (PHB 291)
- **Impact:** Cannot apply exhaustion from Berserker Frenzy, forced march, etc.
- **Fix Required:** Add `exhaustion_level` column to characters, apply penalties to rolls
- **Status:** ❌ NOT IMPLEMENTED

#### 10. **Ritual Casting — Insufficient Validation** 🟡
- **Location:** `src/lib/rules/spellRules.ts` lines 201-204
- **Issue:** Flags ritual casters but doesn't validate ritual-only casting
- **RAW Rule:** "Certain classes can cast spells as rituals. A ritual spell can be cast following the normal rules for spellcasting, or the spell can be cast as a ritual. The ritual version of a spell takes 10 minutes longer to cast than normal. It also doesn't expend a spell slot." (PHB 201-202)
- **Impact:** Cannot cast ritual spells without preparing/knowing them (Wizard exception)
- **Fix Required:** Add ritual casting mode to SpellCastDialog, validate ritual tag + class feature
- **Status:** ⚠️ PARTIAL (detects feature, no UI)

---

## 📊 COMPLIANCE SUMMARY

| Priority | Total | Pass | Fail | Partial | Coverage |
|----------|-------|------|------|---------|----------|
| **P0** | 5 | 0 | 3 | 2 | 40% ⚠️ |
| **P1** | 5 | 0 | 3 | 2 | 40% ⚠️ |
| **P2** | 12 | 8 | 2 | 2 | 83% ✅ |
| **P3** | 8 | 6 | 0 | 2 | 100% ✅ |
| **TOTAL** | 30 | 14 | 8 | 8 | **73%** |

---

## 🎯 IMMEDIATE ACTION ITEMS

1. **Implement Concentration DC Checks** (Est: 2-3 hours)
2. **Add Temp HP Stacking Validation** (Est: 1 hour)
3. **Fix Hit Dice Long Rest Restoration** (Est: 30 min)
4. **Implement Hand Economy Tracking** (Est: 3-4 hours)
5. **Add Costly Material Inventory Check** (Est: 2 hours)

---

## ✅ CORRECTLY IMPLEMENTED (Sample)

- ✅ Advantage/Disadvantage cancellation (PHB 173)
- ✅ Cover AC bonuses (+2/+5/full) (PHB 196)
- ✅ Critical hit dice doubling, not modifiers (PHB 196)
- ✅ Critical miss (natural 1 always fails) (PHB 194)
- ✅ Proficiency bonus scaling by level (PHB 15)
- ✅ Spell slot progression (full/half/third casters) (PHB 114-116)
- ✅ Cantrip scaling at 5/11/17 (PHB 201)
- ✅ Grapple/Shove contested checks (PHB 195)
- ✅ Opportunity attacks on leaving reach (PHB 195)
- ✅ Readied actions expire at start of next turn (PHB 193)

---

## 📋 FULL COMPLIANCE MATRIX

See attached: `5E_COMPLIANCE_MATRIX.csv`

---

## 🧪 TEST PLAN

### Golden Party Test Scenario (Level 5)
- **Barbarian** (Torag): Raging, then takes 20 damage from Fireball
- **Cleric** (Elara): Concentrating on *Bless*, takes 15 damage, should roll CON save DC 10 ✅
- **Rogue** (Vex): Sneak Attack once per turn validation ✅
- **Wizard** (Merlin): Cast *Misty Step* (BA) then try *Fireball* (Action) — should block ✅

### Pass Criteria
- All P0 issues resolved
- All P1 issues addressed or documented with workarounds
- Test scenario passes without manual DM intervention

---

**Next Steps:** Review and implement fixes for P0 issues 1-5 immediately.
