# Fix: Can't set character level between 1 and 20

## The Bug

In the character creation wizard's "Basics" step, the Level field is a controlled number input that fights the user's typing:

- It always shows `draft.level` (a parsed number), so the field can never be momentarily empty.
- `onChange` and `onBlur` both immediately `parseInt` and clamp to 1–20 on every keystroke.
- When a user clears the field to type a new number, `parseInt("")` → `NaN`, which falls back to `1`.
- Result: typing "20" works (both digits parse cleanly along the way), and "1" is the fallback, but most levels in between (e.g. "5", "12") are nearly impossible to enter without the field snapping back to 1.

File: `src/components/character/wizard/StepBasics.tsx` (lines ~123–138)

## The Fix

Change the Level input to behave like a normal text-friendly number input:

1. Hold the input as a local string state (`levelInput`) so it can be empty or partially typed without instantly being coerced.
2. On `onChange`, accept any digit-only string (including empty) into local state. Don't clamp yet.
3. On `onBlur` (and on Enter), parse and clamp to 1–20, then commit via `setLevel`. If empty/invalid on blur, restore to the last committed level (don't silently reset to 1 mid-typing).
4. Sync local state back from `draft.level` when it changes externally (e.g. wizard reset).
5. Keep the spinner arrows working by also committing on valid numeric `onChange` when the value parses to a whole number in range — but without clobbering the string while the user is mid-edit.

Also add a small helper hint under the field: "Level 1–20" so the constraint is visible.

## Files changed

- `src/components/character/wizard/StepBasics.tsx` — replace the Level `<Input>` block with the controlled-string pattern above.

## Out of scope

- No changes to `setLevelAtom`, level-up rules, or any other wizard step. The atom already stores a number; only the input UX is broken.

## QA

- At 411px viewport, open character creation, type "5", "12", "17" — each should stick.
- Use the spinner arrows from 1 up to 20 — should increment normally.
- Clear field and tab away — should snap back to last valid value, not 1.
- Confirm Subclass "Unlocks at level N" badge updates as level changes.
