

# Session Components Bug Scan

## Critical Bug Found

### Bug 1 — `SessionControl.tsx`: Ambiguous join causes 300 error (VISIBLE IN NETWORK LOGS)
**File**: `src/components/campaign/SessionControl.tsx` lines 38, 138
**Severity**: Critical — **actively breaking in production right now**
**Problem**: The query `select('live_session_id, campaign_sessions(*)')` fails with HTTP 300 because there are two foreign key relationships between `campaigns` and `campaign_sessions`:
1. `campaign_sessions_campaign_id_fkey` (one-to-many)
2. `campaigns_live_session_id_fkey` (many-to-one)

PostgREST returns: `"Could not embed because more than one relationship was found"`. This means:
- `fetchActiveSession` on mount **silently fails** — `SessionControl` never shows the live session pill
- `handleStart` also fails on the guard check, so it always creates a **new** session instead of attaching to an existing one

The network logs confirm this is happening right now (two 300 responses visible).

**Fix**: Disambiguate with `campaign_sessions!campaigns_live_session_id_fkey(*)` since we want the single live session, not all sessions for the campaign.

### Bug 2 — `SessionControl.tsx` vs `SessionsTab.tsx`: Duplicate session creation
**Severity**: Medium
**Problem**: Both components can create sessions independently. `SessionControl.handleStart` creates a brand new session record. `SessionsTab.handleStartSession` promotes an existing scheduled session to live. If `SessionControl`'s guard check fails (which it does due to Bug 1), it always creates a new session — even if one is already live.

**Fix**: Since `SessionControl` returns `null` when no session exists (line 330) and sessions are started from `SessionsTab`, the `handleStart` function in `SessionControl` is effectively dead code. However, it's still callable via keyboard shortcut `S` (line 112). Remove the keyboard shortcut for starting, or fix the guard query.

### Bug 3 — `ScheduleSessionDialog.tsx`: `prep_checklist` saved as double-encoded JSON
**Severity**: Medium
**Problem**: Line 107: `prep_checklist: prepChecklist.length > 0 ? JSON.stringify(prepChecklist) : '[]'`. If the database column `prep_checklist` is type `jsonb`, `JSON.stringify` wraps the array in a string, causing it to be stored as a JSON string (double-encoded). When read back, `SessionsTab` has defensive parsing (lines 89-97) that handles this, but it's fragile.

**Fix**: Pass the array directly if the column is `jsonb`: `prep_checklist: prepChecklist`. The Supabase client handles serialization automatically for `jsonb` columns.

### Bug 4 — `ScheduleSessionDialog.tsx`: Update sends `campaign_id` and `status` unnecessarily
**Severity**: Low
**Problem**: Line 110-114: When editing, `sessionData` includes `campaign_id` and `status: "scheduled"` in the update payload. Resetting `status` to `"scheduled"` is dangerous if the session is already live/paused — editing it would revert it to scheduled.

**Fix**: Exclude `campaign_id` and `status` from the update payload when editing.

### Bug 5 — `SessionsTab.tsx`: No guard against starting a session when one is already live
**Severity**: Medium  
**Problem**: `handleStartSession` (line 123) doesn't check if there's already a live session (`currentSession`). If DM clicks "Start" on two upcoming sessions quickly, two sessions go live simultaneously.

**Fix**: Add a guard: `if (currentSession) { toast.error("A session is already running"); return; }`

---

## Files to Update

| File | Bug(s) |
|------|--------|
| `src/components/campaign/SessionControl.tsx` | #1 (ambiguous join — critical), #2 (dead start code) |
| `src/components/campaign/ScheduleSessionDialog.tsx` | #3 (double-encoded JSON), #4 (status reset on edit) |
| `src/components/campaign/tabs/SessionsTab.tsx` | #5 (no live session guard) |

## Priority
1. **Bug #1** — Actively failing in production (300 errors in network logs)
2. **Bug #5** — Can create duplicate live sessions
3. **Bug #3** — Double-encoded JSON causes fragile parsing
4. **Bug #4** — Status reset on edit
5. **Bug #2** — Dead code cleanup

