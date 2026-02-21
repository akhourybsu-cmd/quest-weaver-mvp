
# Session Connectivity Overhaul: Making It Seamless

## Root Cause Analysis

After tracing every file in the session flow, here are all the concrete problems found:

### Problem 1: Too Many Redundant Database Calls on Every Load
`SessionPlayer.tsx` makes **four sequential async calls** before a player can see anything:
1. `auth.getUser()` → get user
2. Query `campaigns` by code → get campaign ID
3. Query `campaigns` again for `live_session_id` (separate call!)
4. Query `campaign_sessions` for status

This causes the "slow things down" feeling. The same data could be fetched in 2 calls or even 1.

### Problem 2: The Waiting Room Is Overly Aggressive
`PlayerWaitingRoom.tsx` auto-creates player profiles and auto-inserts into `player_campaign_links` and `campaign_members` as a side effect of just visiting `/player/waiting`. This is confusing — it runs heavy setup logic even when the player already exists and is already linked. It is also a dead end: if anything fails, the player is stranded.

### Problem 3: Session Validation Logic Repeats Everywhere
The "is a session live?" check is done in:
- `CampaignTile.tsx` (`getCampaignStatus` → two queries)
- `PlayerCampaignView.tsx` (separate query)
- `SessionPlayer.tsx` (two separate queries — the same pattern)
- `PlayerWaitingRoom.tsx` (`checkForLiveSession` — third copy)

All four places do it differently. When the DM ends a session, players in different states get different behavior.

### Problem 4: `SessionPlayer` Silently Kicks Players to Waiting Room
If a player navigates to `/session/player?campaign=X` and there's no live session, they're silently redirected to `/player/waiting` mid-load. From the player's perspective, something just "broke." There's no explanation shown.

### Problem 5: "Join Session" Button Sends Players to Waiting Room Even When Offline
In `CampaignTile.tsx`, the `handleJoinSession` function:
```
if (status?.hasLiveSession) → /session/player
else → /player/waiting
```
So clicking "Waiting Room" when there's no session navigates players to a page that does setup work on every visit, which is intrusive and confusing. Players should stay on the campaign tile/dashboard until a session actually starts.

### Problem 6: `SessionPlayer` Still Uses Old `/player-hub` Route
`SessionPlayer.tsx` navigates back to `/player-hub` on errors and exit, but the active Player Hub is now at `/player/dashboard` or accessed via `PlayerDashboardNew`. The `/player-hub` route exists but goes to a different older `PlayerHub.tsx` page.

### Problem 7: No Real-Time "Session Started" Notification From the Tile
`CampaignTile.tsx` subscribes to `campaigns` + `campaign_sessions` changes, but when a session goes live, it only calls `loadStatus()`. It doesn't proactively notify the player or offer a prominent "Join Now" action — they have to notice the badge changed.

### Problem 8: Waiting Room Subscribes to `campaigns` Updates But Players Could Miss It
The realtime subscription in `PlayerWaitingRoom.tsx` only listens for `campaigns` UPDATE (when `live_session_id` is set). But the DM first creates the session record, **then** updates `campaigns.live_session_id`. If the player already left the waiting room tab (e.g., to check something else), they'll miss the redirect entirely.

---

## Solution: Streamlined Session Flow

### New Flow Design

```text
PLAYER SIDE                           DM SIDE
─────────────────────                 ──────────────────────
Dashboard / CampaignTile              CampaignHub → Start Session
  │                                     │
  │  [Real-time subscription             │  Updates campaigns.live_session_id
  │   on campaigns table]                │  Sets campaign_sessions.status = 'live'
  │                                     │
  ▼ Live badge updates automatically    │
  "Session is Live" toast + CTA button  │
  │                                     │
  ▼ Player clicks "Join Session"        │
  /session/player?campaign=CODE         │
  │                                     │
  ▼ Single optimized query              │
  Loads character + validates session   │
  ▼                                     │
  Session UI                           DM controls session
  │                                     │
  ▼ When DM ends session                │
  Real-time subscription detects         DM clicks "End Session"
  live_session_id = null                │
  ▼                                     │
  Show "Session Ended" overlay          │
  with button back to campaign view     │
```

---

## Specific Changes

### 1. Merge the Two `campaigns` Queries in `SessionPlayer.tsx`
Replace the two separate queries (get ID, then get live_session_id) with one combined query that gets `id, live_session_id` at once, then queries `campaign_sessions` only once.

**Before (4 queries):**
```typescript
const campaigns = await supabase.from('campaigns').select('id').eq('code', code);
const campaignData = await supabase.from('campaigns').select('live_session_id').eq('id', campaigns[0].id);
const sessionData = await supabase.from('campaign_sessions').select('status').eq('id', campaignData.live_session_id);
const encounter = await supabase.from('encounters').select('id')...
```

**After (2 queries):**
```typescript
const { data: campaign } = await supabase
  .from('campaigns')
  .select('id, live_session_id')
  .eq('code', code)
  .maybeSingle();

if (!campaign?.live_session_id) { /* redirect */ return; }

const [sessionData, encounter] = await Promise.all([
  supabase.from('campaign_sessions').select('status').eq('id', campaign.live_session_id).single(),
  supabase.from('encounters').select('id, status').eq('campaign_id', campaign.id)...
]);
```

### 2. Add Session-End Real-Time Listener in `SessionPlayer.tsx`
Subscribe to changes on `campaigns` where `live_session_id` becomes null. Instead of silently redirecting, show a dismissable "Session has ended" overlay card that lets players gracefully exit to the campaign view.

### 3. Fix the "Join Session" / "Waiting Room" Logic in `CampaignTile.tsx`
- When session is **live** → show prominent "Join Now" button → navigate to `/session/player`
- When session is **offline** → show "View Campaign" as the primary action; no "Waiting Room" button (this was misleading)
- When status loads → if `hasLiveSession` just became true → show a toast notification "Session is now live! Join?"

### 4. Remove the Waiting Room From Normal Flow
The `/player/waiting` route should only be reachable when a player uses a shared link (e.g., `?campaign=CODE` from a DM invite). The waiting room stays for that use case (someone with a fresh invite link who hasn't joined the dashboard yet), but it should NOT be navigated to from the dashboard tile or from `PlayerCampaignView.tsx`.

In `PlayerCampaignView.tsx`, the "Join Session" button:
- If live → `/session/player?campaign=CODE`
- If offline → stays on the page (shows "Session not started yet" inline message, not navigation)

### 5. Fix Exit Navigation in `SessionPlayer.tsx`
Change all `navigate("/player-hub")` calls to navigate to the correct route. Looking at `App.tsx`, the correct player entry points are `/player/campaign/:campaignCode` or `/player/dashboard`. Use `campaignCode` to navigate back to the campaign view: `navigate(\`/player/campaign/${campaignCode}\`)`.

### 6. Simplify `PlayerWaitingRoom.tsx`
Guard the setup logic so it only runs once (check `player_campaign_links` before inserting). Move the heavy initialization logic into a state machine:
1. First check if already linked → skip setup
2. Only create player profile if truly missing
3. Show a clear loading state with progress text so players know what's happening

---

## Files Modified

- `src/pages/SessionPlayer.tsx`
  - Merge 4 queries into 2 (combine `campaigns` queries, use `Promise.all`)
  - Fix navigation on exit/error to use `/player/campaign/:campaignCode` instead of `/player-hub`
  - Add real-time subscription for session end → show "Session Ended" overlay instead of silent redirect

- `src/components/player/CampaignTile.tsx`
  - Remove "Waiting Room" navigation path from the Join button
  - Add real-time toast when session goes live ("🔴 Session is Live — Join Now?")
  - Disable Join button when session is offline (no navigation to waiting room)

- `src/pages/PlayerCampaignView.tsx`
  - Change offline "Join Session" to show an inline "No session running" note instead of navigating to waiting room
  - Fix the `loadCampaign` query (it currently causes a `PGRST201` error visible in network logs — the ambiguous join on `campaign_sessions`)

- `src/components/player/PlayerWaitingRoom.tsx`
  - Guard all setup mutations with existence checks before running
  - Show clearer loading state text during initialization
  - Fix the redirect path on "Back to Dashboard" to go to the correct player route

### No Database Changes Required
All fixes are in the React/TypeScript layer only.
