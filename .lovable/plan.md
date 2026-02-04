

# Fix: Faction Goals State Reset and Persistence Bug

## Problem Summary

Two issues were identified in the FactionEditor:

1. **Input field carryover**: When editing Faction 1, then switching to edit/create Faction 2, the `goalInput` field (and `tagInput`) retains text from the previous session because these fields are **not being reset** in the `useEffect`.

2. **Goals not persisted**: Database query confirms all factions have `goals: []` - goals appear to not be saving. This is likely because users type goals but don't press Enter to add them, or there's a state timing issue.

---

## Root Cause Analysis

### Issue 1: Missing State Resets

In `FactionEditor.tsx` lines 83-95, the reset block for new factions is missing:
- `setGoalInput("")`
- `setTagInput("")`

Similarly, when editing an existing faction (lines 55-63), these input fields are not reset.

**Current Code (missing resets):**
```tsx
} else {
  // New faction - clear all fields
  setName("");
  setDescription("");
  setMotto("");
  setBannerUrl(null);
  setTags([]);
  setInfluenceScore(50);
  setGoals([]);  // ✓ Goals array reset
  // ✗ goalInput NOT reset!
  // ✗ tagInput NOT reset!
  setReputationScore(0);
  setExistingReputation(null);
  setLorePageId(null);
}
```

### Issue 2: Goals Not Saving

Goals require pressing Enter to be added to the array. Users may be typing goals and clicking "Save" without pressing Enter first. The current `goalInput` value is lost because it's never committed to the `goals` array.

---

## Solution

### Fix 1: Reset Input Fields on Dialog Open

Add `setGoalInput("")` and `setTagInput("")` to both branches of the `useEffect`:

```tsx
useEffect(() => {
  if (!open) return;
  
  if (faction) {
    setName(faction.name);
    setDescription(faction.description || "");
    setMotto(faction.motto || "");
    setBannerUrl(faction.banner_url || null);
    setTags(faction.tags || []);
    setInfluenceScore(faction.influence_score ?? 50);
    setGoals(faction.goals || []);
    setLorePageId(faction.lore_page_id || null);
    setTagInput("");    // ADD THIS
    setGoalInput("");   // ADD THIS
    
    // ... reputation fetch
  } else {
    // New faction - clear all fields
    setName("");
    setDescription("");
    setMotto("");
    setBannerUrl(null);
    setTags([]);
    setInfluenceScore(50);
    setGoals([]);
    setReputationScore(0);
    setExistingReputation(null);
    setLorePageId(null);
    setTagInput("");    // ADD THIS
    setGoalInput("");   // ADD THIS
  }
}, [faction, open, campaignId]);
```

### Fix 2: Auto-commit Pending Input Before Save

Modify `handleSave()` to automatically add any uncommitted goal/tag before saving:

```tsx
const handleSave = async () => {
  if (!name.trim()) {
    toast({
      title: "Name required",
      description: "Please enter a name for the faction",
      variant: "destructive",
    });
    return;
  }

  // Auto-commit any pending goal input
  const finalGoals = [...goals];
  if (goalInput.trim() && !goals.includes(goalInput.trim())) {
    finalGoals.push(goalInput.trim());
  }

  // Auto-commit any pending tag input
  const finalTags = [...tags];
  if (tagInput.trim() && !tags.includes(tagInput.trim())) {
    finalTags.push(tagInput.trim());
  }

  try {
    const factionData = {
      campaign_id: campaignId,
      name: name.trim(),
      description: description.trim() || null,
      motto: motto.trim() || null,
      banner_url: bannerUrl,
      tags: finalTags,           // Use finalTags
      influence_score: influenceScore,
      goals: finalGoals,         // Use finalGoals
      lore_page_id: lorePageId,
    };
    // ... rest of save logic
  }
};
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/factions/FactionEditor.tsx` | Add input field resets in useEffect + auto-commit pending inputs before save |

---

## Technical Changes Summary

1. **Line ~63** (editing faction): Add `setTagInput("")` and `setGoalInput("")`
2. **Line ~94** (new faction): Add `setTagInput("")` and `setGoalInput("")`
3. **Line ~126** (handleSave): Auto-commit pending goal/tag inputs before building factionData

---

## Testing Checklist

After implementation:
1. Create Faction 1 with goals "Goal A", "Goal B"
2. Save Faction 1
3. Open Faction 2 or create new faction
4. Verify goal input field is empty (not showing old text)
5. Add goals to Faction 2 and save
6. Verify both Faction 1 and Faction 2 have their correct goals in database
7. Test typing a goal but NOT pressing Enter, then clicking Save - verify it still gets saved
8. Test editing an existing faction - verify existing goals load and new ones can be added

