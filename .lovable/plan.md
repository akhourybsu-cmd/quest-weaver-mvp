

# Player Connectivity: Additional Refinements

## Issues Found

### 1. PlayerPresence "Raise Hand" silently fails if no presence record exists

**Location:** `src/components/presence/PlayerPresence.tsx` lines 70-82

**Problem:** The `toggleRaiseHand` function queries for an existing `player_presence` record, then updates it. If the player hasn't opened the SessionKiosk yet (so no presence record exists), the function does nothing silently.

**Impact:** Players who try to raise their hand before joining the kiosk (or from other views) get no feedback, and DMs won't see the request.

**Fix:** Change from SELECT-then-UPDATE to an UPSERT pattern. Create the presence record if it doesn't exist.

```typescript
// Current (fails silently):
const { data: myPresence } = await supabase.from("player_presence").select("id")...
if (myPresence) { await supabase.from("player_presence").update({...}) }

// Proposed (upsert):
await supabase.from("player_presence").upsert({
  campaign_id: campaignId,
  user_id: currentUserId,
  needs_ruling: !needsRuling,
  character_id: characterId, // need to pass this in
  is_online: false, // not necessarily online, just raising hand
}, { onConflict: 'campaign_id,user_id' });
```

**Required changes:**
- Add `characterId` prop to `PlayerPresence` component
- Update both call sites (SessionKiosk and LiveSessionTab) to pass character ID
- Change `toggleRaiseHand` to use upsert

---

### 2. No feedback when "Raise Hand" is toggled

**Location:** `src/components/presence/PlayerPresence.tsx` line 79

**Problem:** After toggling `needs_ruling`, there's no toast or visual feedback confirming the action succeeded.

**Impact:** Players are unsure if their "raise hand" request was sent to the DM.

**Fix:** Add toast notifications:
```typescript
toast({ 
  title: needsRuling ? "Hand lowered" : "Hand raised", 
  description: needsRuling ? "Request cancelled" : "DM will be notified" 
});
```

---

### 3. SessionSpectator name resolution uses broken FK joins

**Location:** `src/pages/SessionSpectator.tsx` lines 136-137 (already identified in previous audit but not fixed)

**Problem:** Same polymorphic join issue as TurnIndicator and other components. Uses `character:characters(name)` which returns null.

**Impact:** Spectator view shows empty names for combatants.

**Fix:** Apply same manual resolution pattern used in other components:
```typescript
if (entry.combatant_type === 'character') {
  const { data } = await supabase.from('characters')
    .select('name, class, level').eq('id', entry.combatant_id).single();
  // ...
} else {
  const { data } = await supabase.from('encounter_monsters')
    .select('display_name, ac, hp_current, hp_max').eq('id', entry.combatant_id).single();
  // ...
}
```

---

### 4. PlayerWaitingRoom doesn't handle session end

**Location:** `src/components/player/PlayerWaitingRoom.tsx`

**Problem:** The waiting room subscribes to campaign updates to detect when a session starts (line 140-157), but doesn't handle the case where a session ends while a player is waiting. If a DM starts a session, the player navigates away, then the DM ends the session, the subscription is orphaned.

**Impact:** Minor - subscription leak, but no functional issue since the component unmounts.

**Fix:** Already handled via cleanup on line 24-28. No changes needed.

---

### 5. Character requirement for "Raise Hand" not enforced

**Location:** `src/components/presence/PlayerPresence.tsx`

**Problem:** The "raise hand" button is shown even if the player doesn't have a character assigned to the campaign. DMs might see a ruling request from an unidentified player.

**Impact:** Confusing UX for DMs when they see presence without character association.

**Fix:** Only show the "Raise Hand" button if a character exists. Add a disabled state with tooltip if no character.

```typescript
const hasCharacter = Boolean(characterId);

<Button
  disabled={!hasCharacter}
  ...
>
  {hasCharacter ? (
    "Raise Hand"
  ) : (
    <TooltipProvider><Tooltip><TooltipTrigger>Assign character first</TooltipTrigger></Tooltip></TooltipProvider>
  )}
</Button>
```

---

## Files to Update

| File | Changes |
|------|---------|
| `src/components/presence/PlayerPresence.tsx` | Add `characterId` prop; change toggleRaiseHand to upsert; add toast feedback; conditionally show button |
| `src/components/session/SessionKiosk.tsx` | Pass `character.id` to PlayerPresence |
| `src/components/campaign/tabs/LiveSessionTab.tsx` | Pass current DM character ID (or null) to PlayerPresence |
| `src/pages/SessionSpectator.tsx` | Fix initiative name resolution (same pattern as TurnIndicator) |

---

## Additional Observations (No Action Needed)

- **Presence tracking is correctly scoped:** Only SessionKiosk sets online presence, which is appropriate. Players browsing campaigns without joining sessions shouldn't be marked as "online" in session context.
- **Multiple tab handling:** The current pattern (each tab sets/clears presence independently) is acceptable. Supabase Realtime Presence API could be used for better multi-tab handling, but the current approach is simpler and adequate.
- **SessionSpectator needs no presence:** Spectators are read-only observers, correctly excluded from presence tracking.

