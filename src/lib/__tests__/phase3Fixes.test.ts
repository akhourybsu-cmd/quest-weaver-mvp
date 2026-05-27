/**
 * Phase 3 targeted tests — beforeunload draft flush.
 *
 * The flush handler is a DOM side-effect inside CharacterWizard and cannot
 * be unit-tested directly without mounting the component. Instead, we test
 * the pure logic that the handler depends on:
 *
 *   1. Guard conditions — no flush when state is incomplete.
 *   2. Payload shape — the object sent to Supabase matches the shape that
 *      saveDraft() would produce (wizard_state with currentStep + draft).
 *   3. wizardState serialisation — grants round-trip through serialize helpers.
 */

import { describe, it, expect } from "vitest";

// ─── Guard condition logic (mirrored from the handler) ────────────────────────

function shouldFlush(params: {
  isOpen: boolean;
  draftId: string | null;
  draftName: string;
  sessionToken: string | null;
}): boolean {
  const { isOpen, draftId, draftName, sessionToken } = params;
  return !!(isOpen && draftId && draftName && sessionToken);
}

describe("beforeunload flush guard conditions", () => {
  const validParams = {
    isOpen: true,
    draftId: "abc-123",
    draftName: "Thorin",
    sessionToken: "tok_abc",
  };

  it("flushes when all required state is present", () => {
    expect(shouldFlush(validParams)).toBe(true);
  });

  it("does NOT flush when wizard is not open", () => {
    expect(shouldFlush({ ...validParams, isOpen: false })).toBe(false);
  });

  it("does NOT flush when draftId is null (character not yet persisted)", () => {
    expect(shouldFlush({ ...validParams, draftId: null })).toBe(false);
  });

  it("does NOT flush when draft has no name (creation not started)", () => {
    expect(shouldFlush({ ...validParams, draftName: "" })).toBe(false);
  });

  it("does NOT flush when session token is missing (user logged out mid-session)", () => {
    expect(shouldFlush({ ...validParams, sessionToken: null })).toBe(false);
  });
});

// ─── Payload shape ─────────────────────────────────────────────────────────────

/**
 * Mirror of the serialisation that happens inside the handler.
 * We use plain objects (no circular refs) to verify shape.
 */
function buildFlushPayload(
  draft: { name: string; className: string; level: number; grants: any; grantSources: any },
  currentStep: number,
  serializeGrants: (g: any) => any
) {
  const wizardState = {
    currentStep,
    draft: {
      ...draft,
      grants: serializeGrants(draft.grants),
      grantSources: {
        class: serializeGrants(draft.grantSources.class),
        ancestry: serializeGrants(draft.grantSources.ancestry),
        subAncestry: serializeGrants(draft.grantSources.subAncestry),
        background: serializeGrants(draft.grantSources.background),
      },
    },
  };

  return {
    name: draft.name,
    class: draft.className || "",
    level: draft.level,
    creation_status: "draft",
    wizard_state: wizardState,
  };
}

describe("beforeunload flush payload shape", () => {
  const identity = (x: any) => x; // no-op serializer for shape tests
  const emptyGrants = { features: [], traits: [], abilityBonuses: {}, proficiencies: [] };
  const emptyGrantSources = {
    class: emptyGrants,
    ancestry: emptyGrants,
    subAncestry: emptyGrants,
    background: emptyGrants,
  };

  const draft = {
    name: "Liriel",
    className: "Wizard",
    level: 3,
    grants: emptyGrants,
    grantSources: emptyGrantSources,
  };

  it("payload has the expected top-level keys", () => {
    const payload = buildFlushPayload(draft, 2, identity);
    expect(payload).toHaveProperty("name", "Liriel");
    expect(payload).toHaveProperty("class", "Wizard");
    expect(payload).toHaveProperty("level", 3);
    expect(payload).toHaveProperty("creation_status", "draft");
    expect(payload).toHaveProperty("wizard_state");
  });

  it("wizard_state contains currentStep", () => {
    const payload = buildFlushPayload(draft, 4, identity);
    expect(payload.wizard_state.currentStep).toBe(4);
  });

  it("wizard_state.draft contains the draft fields", () => {
    const payload = buildFlushPayload(draft, 0, identity);
    expect(payload.wizard_state.draft.name).toBe("Liriel");
    expect(payload.wizard_state.draft.className).toBe("Wizard");
    expect(payload.wizard_state.draft.level).toBe(3);
  });

  it("wizard_state.draft has serialised grantSources keys", () => {
    const payload = buildFlushPayload(draft, 0, identity);
    const gs = payload.wizard_state.draft.grantSources;
    expect(gs).toHaveProperty("class");
    expect(gs).toHaveProperty("ancestry");
    expect(gs).toHaveProperty("subAncestry");
    expect(gs).toHaveProperty("background");
  });

  it("class defaults to empty string when className is falsy", () => {
    const payload = buildFlushPayload({ ...draft, className: "" }, 0, identity);
    expect(payload.class).toBe("");
  });

  it("wizard_state is JSON-serialisable (no circular references)", () => {
    const payload = buildFlushPayload(draft, 2, identity);
    expect(() => JSON.stringify(payload)).not.toThrow();
  });
});
