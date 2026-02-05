

# AI Asset Generator - Campaign-Aware Content Creation

## Overview

Add an AI-powered "Generate with AI" button to all asset editor dialogs that intelligently fills empty fields while respecting user-provided values and maintaining consistency with existing campaign lore.

---

## Architecture

```text
+------------------+       +----------------------+       +------------------+
|  Asset Editor    |  -->  |  AI Generation Hook  |  -->  |  Edge Function   |
|  (NPC, Location) |       |  (useAIAssetGen)     |       |  generate-asset  |
+------------------+       +----------------------+       +------------------+
        |                           |                            |
        |  existing_fields          |  context_pack              |  AI Response
        |  locked_fields            |  campaign_snapshot         |  filled_fields
        +---------------------------+----------------------------+
                                    |
                              Campaign Context
                              (NPCs, Factions, Locations, Lore, Pitch)
```

---

## Feature Components

### 1. Edge Function: `supabase/functions/generate-asset/index.ts`

Handles AI generation using Lovable AI gateway with campaign context.

**Input payload:**
```typescript
{
  asset_type: 'npc' | 'location' | 'faction' | 'item' | 'quest' | 'lore',
  user_prompt?: string,           // Optional 1-3 sentence guidance
  existing_fields: Record<string, any>,  // Current form values
  locked_fields: string[],        // Fields user has filled (immutable)
  campaign_context: {
    campaign_id: string,
    tone?: string,                // From campaign_pitch
    themes?: string[],            // From campaign_pitch
    pitch_text?: string,          // Campaign summary
    canon_entities: {
      npcs: Array<{ name: string, role?: string, location?: string }>,
      factions: Array<{ name: string, description?: string }>,
      locations: Array<{ name: string, type?: string, parent?: string }>,
      lore_pages: Array<{ title: string, category: string, excerpt?: string }>,
    },
    recent_sessions?: Array<{ name: string, notes?: string }>,
  }
}
```

**Output format (strict JSON):**
```typescript
{
  filled_fields: Record<string, any>,  // Only fields that were empty
  assumptions: string[],               // What AI assumed
  consistency_checks: Array<{
    check: string,
    result: 'pass' | 'adjusted' | 'potential_conflict',
    details: string
  }>,
  followup_questions?: string[]       // Only if absolutely necessary
}
```

### 2. React Hook: `src/hooks/useAIAssetGenerator.ts`

Manages generation state, context building, and response handling.

```typescript
interface UseAIAssetGeneratorOptions {
  campaignId: string;
  assetType: AssetType;
}

interface UseAIAssetGeneratorResult {
  isGenerating: boolean;
  error: string | null;
  lastResult: GenerationResult | null;
  generate: (
    existingFields: Record<string, any>,
    lockedFields: string[],
    userPrompt?: string
  ) => Promise<GenerationResult>;
  clearResult: () => void;
}
```

### 3. Context Builder: `src/lib/campaignContextBuilder.ts`

Fetches and compiles campaign context for AI consumption.

```typescript
interface CampaignContextPack {
  campaign_id: string;
  tone?: string;
  themes?: string[];
  pitch_text?: string;
  canon_entities: {
    npcs: CanonNPC[];
    factions: CanonFaction[];
    locations: CanonLocation[];
    lore_pages: CanonLore[];
  };
  recent_sessions?: SessionSummary[];
}

async function buildCampaignContext(
  campaignId: string,
  assetType: AssetType,
  currentEntityName?: string
): Promise<CampaignContextPack>
```

**Context Selection Logic:**
- Fetches campaign_pitch for tone/themes
- Fetches top 20 most relevant entities per type (ordered by recency + tags)
- Limits context to ~4000 tokens to stay within AI context window
- Excludes the current entity being edited

### 4. UI Component: `src/components/ai/AIGenerateButton.tsx`

Reusable button + preview dialog for all asset editors.

```typescript
interface AIGenerateButtonProps {
  campaignId: string;
  assetType: AssetType;
  getFormValues: () => Record<string, any>;
  getLockedFields: () => string[];
  onApply: (filledFields: Record<string, any>) => void;
}
```

**UI Flow:**
1. Button displays "Generate with AI" with sparkle icon
2. Click opens modal with optional prompt textarea
3. On generate: shows loading spinner
4. On success: shows diff preview (current vs suggested)
5. User can accept all, accept individual fields, or cancel
6. On accept: calls `onApply` with selected fields

### 5. Preview Dialog: `src/components/ai/AIGenerationPreview.tsx`

Shows AI suggestions with diff view before applying.

**Features:**
- Side-by-side comparison of current vs suggested values
- Checkboxes to select which suggestions to apply
- "Assumptions Made" collapsible section
- "Consistency Checks" collapsible section with pass/warning indicators
- Apply Selected / Apply All / Cancel buttons

---

## Asset Type Field Schemas

Each asset type has a defined schema for AI generation:

### NPC Fields
- name*, role, appearance, personality, voice_quirks
- background, goals, fears, secrets
- relationships (references to existing entities)
- plot_hooks (3-5 suggested)
- stat_block_suggestion (level/cr, archetype)

### Location Fields
- name*, location_type, region/parent
- sensory_description (sights, sounds, smells)
- purpose, history, atmosphere
- notable_npcs, factions_present
- dangers, secrets, adventure_hooks (3-5)

### Faction Fields
- name*, motto, public_goal, true_goal
- leadership, ranks, recruitment_method
- allies, enemies, territory
- resources, methods, weakness
- quest_hooks (3), rumors (3)

### Item Fields
- name*, type, rarity, description
- properties, attunement_required
- lore_history, creator

### Quest Fields
- title*, description, objectives
- rewards, difficulty, quest_type
- key_npcs, key_locations
- complications, twists

---

## Integration Points

### EnhancedNPCEditor.tsx
Add AI button in header, integrate with form state:
```tsx
<AIGenerateButton
  campaignId={campaignId}
  assetType="npc"
  getFormValues={() => ({
    name, pronouns, roleTitle, publicBio, gmNotes, secrets, tags, status, alignment
  })}
  getLockedFields={() => getFilledFieldKeys()}
  onApply={(fields) => applyGeneratedFields(fields)}
/>
```

### LocationDialog.tsx
Add AI button in dialog header with location-specific fields.

### FactionEditor.tsx
Add AI button for faction-specific generation.

### Lore Creators (NPCCreator, FactionCreator, etc.)
Add AI generation to lore-specific forms.

---

## Files to Create

| File | Description |
|------|-------------|
| `supabase/functions/generate-asset/index.ts` | Edge function for AI generation |
| `src/hooks/useAIAssetGenerator.ts` | React hook for generation state |
| `src/lib/campaignContextBuilder.ts` | Context aggregation utility |
| `src/lib/assetFieldSchemas.ts` | Field schemas per asset type |
| `src/components/ai/AIGenerateButton.tsx` | Trigger button component |
| `src/components/ai/AIGenerationPreview.tsx` | Diff preview dialog |
| `src/components/ai/AIGenerationPromptDialog.tsx` | Prompt input dialog |

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/config.toml` | Add generate-asset function config |
| `src/components/npcs/EnhancedNPCEditor.tsx` | Add AI button |
| `src/components/locations/LocationDialog.tsx` | Add AI button |
| `src/components/factions/FactionEditor.tsx` | Add AI button |
| `src/components/lore/creators/*.tsx` | Add AI button to all creators |

---

## AI System Prompt

The edge function uses this system prompt for consistent generation:

```text
You are the Quest Weaver Campaign Asset Generator. Generate D&D 5e campaign 
assets that are consistent with the provided campaign canon.

RULES:
1. NEVER modify locked_fields - they are immutable canon
2. DO NOT contradict existing campaign lore (NPCs, factions, locations, history)
3. If a conflict is detected, adjust your output to fit canon and report it
4. Make reasonable assumptions that fit the campaign's tone and themes
5. Keep outputs game-usable: actionable hooks, clear motivations, playable secrets
6. Reference existing entities by exact name when creating relationships
7. DO NOT invent new world primitives (new planes, magic systems, metals) 
   unless explicitly requested

OUTPUT: Return only valid JSON matching the schema. No markdown. No commentary.
```

---

## Consistency Validation

After AI responds, the hook performs lightweight validation:

1. **Name Matching**: Ensure referenced entities exist in campaign
2. **Type Checking**: Verify field types match schema
3. **Length Limits**: Truncate overly long descriptions
4. **Sanitization**: Remove markdown formatting if present

---

## Rate Limiting & Error Handling

- Button disabled during generation
- Toast on rate limit (429): "AI is busy, please try again in a moment"
- Toast on credit exhaustion (402): "AI credits exhausted"
- Toast on general error with retry option
- Timeout after 60 seconds with graceful failure

---

## Testing Checklist

After implementation:
1. Open NPC editor, fill in name only, click Generate - verify other fields populate
2. Verify locked fields (name) are not overwritten
3. Verify generated NPC references existing locations/factions from campaign
4. Test with optional prompt: "Make this NPC a secret villain"
5. Verify preview dialog shows diff correctly
6. Test Apply Selected vs Apply All
7. Test generation for Location, Faction, Quest, Lore
8. Test rate limit handling (spam the button)
9. Verify assumptions and consistency checks display correctly

