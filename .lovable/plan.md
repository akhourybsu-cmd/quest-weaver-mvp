
# Factions Bug Fixes

## Issues Identified

### Issue 1: Goals Persist When Creating New Faction
When creating a new faction after editing an existing one, the goals from the previous faction remain populated instead of being cleared.

**Root Cause**: The `useEffect` in `FactionEditor.tsx` depends on `[faction, open]`. When clicking "New Faction" multiple times in a row, `faction` remains `null` and the effect doesn't re-run to clear the state.

**Fix**: Reset all form state whenever `open` becomes `true`, regardless of whether `faction` changed.

### Issue 2: Reputation Scale Appears Read-Only
The reputation progress bar shown on faction cards is display-only. To change it, DMs must click the "Adjust Reputation" button, which opens a separate dialog.

**Root Cause**: This is actually by design (reputation is stored in a separate `faction_reputation` table and represents the party's standing with the faction), but the UX is confusing because:
1. The "Adjust Reputation" button is easy to miss
2. Users expect the reputation to be editable in the same editor as other faction fields

**Fix**: Add a reputation slider directly in `FactionEditor.tsx` so DMs can set reputation in the same place they edit other faction data.

---

## Technical Changes

### File: `src/components/factions/FactionEditor.tsx`

**Change 1**: Fix state reset for new factions

Update the `useEffect` to properly reset all state when the dialog opens fresh:

```typescript
useEffect(() => {
  if (!open) return; // Only run when dialog opens
  
  if (faction) {
    // Editing existing faction - populate fields
    setName(faction.name);
    setDescription(faction.description || "");
    setMotto(faction.motto || "");
    setBannerUrl(faction.banner_url || null);
    setTags(faction.tags || []);
    setInfluenceScore(faction.influence_score ?? 50);
    setGoals(faction.goals || []);
  } else {
    // New faction - clear all fields
    setName("");
    setDescription("");
    setMotto("");
    setBannerUrl(null);
    setTags([]);
    setInfluenceScore(50);
    setGoals([]);
  }
}, [faction, open]);
```

The key fix is adding `if (!open) return;` at the start to ensure the effect only runs when the dialog actually opens, and the clear operation happens every time.

**Change 2**: Add reputation slider to FactionEditor

Add reputation management directly in the editor:

1. Add new state for reputation:
```typescript
const [reputationScore, setReputationScore] = useState(0);
const [existingReputation, setExistingReputation] = useState<{id: string} | null>(null);
```

2. Fetch current reputation when editing:
```typescript
// Inside useEffect when faction exists:
const fetchReputation = async () => {
  const { data } = await supabase
    .from("faction_reputation")
    .select("id, score")
    .eq("faction_id", faction.id)
    .eq("campaign_id", campaignId)
    .single();
  
  if (data) {
    setReputationScore(data.score);
    setExistingReputation({ id: data.id });
  } else {
    setReputationScore(0);
    setExistingReputation(null);
  }
};
fetchReputation();
```

3. Add reputation slider UI after the influence slider:
```tsx
{/* Reputation Slider - Only show when editing */}
{faction && (
  <div className="space-y-3">
    <div className="flex justify-between items-center">
      <Label>Party Reputation</Label>
      <span className="text-sm text-muted-foreground">
        {reputationScore > 0 ? "+" : ""}{reputationScore}
      </span>
    </div>
    <Slider
      value={[reputationScore]}
      onValueChange={(v) => setReputationScore(v[0])}
      min={-100}
      max={100}
      step={1}
      className="w-full"
    />
    <div className="flex justify-between text-xs text-muted-foreground">
      <span>Hated</span>
      <span>Neutral</span>
      <span>Revered</span>
    </div>
  </div>
)}
```

4. Save reputation in `handleSave`:
```typescript
// After faction insert/update succeeds, save reputation if editing
if (faction) {
  if (existingReputation) {
    await supabase
      .from("faction_reputation")
      .update({ score: reputationScore })
      .eq("id", existingReputation.id);
  } else {
    await supabase
      .from("faction_reputation")
      .insert({
        campaign_id: campaignId,
        faction_id: faction.id,
        score: reputationScore,
      });
  }
}
```

---

## Summary of Changes

| File | Change |
|------|--------|
| `FactionEditor.tsx` | Fix useEffect to properly clear state when creating new factions |
| `FactionEditor.tsx` | Add reputation slider for editing existing factions |
| `FactionEditor.tsx` | Save reputation to `faction_reputation` table on save |

## Result
- Creating a new faction will always start with blank fields
- Editing a faction allows changing reputation directly in the same dialog
- The separate "Adjust Reputation" button still works for quick changes from the directory view
