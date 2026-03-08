

# Player-Campaign Connectivity Audit

## Current Architecture Summary

The system has three entry points for players to interact with sessions:
1. **PlayerCampaignView** — out-of-session campaign browser with SessionKioskContainer overlay
2. **SessionPlayer** — full-page session view at `/session/player?campaign=CODE`
3. **PlayerWaitingRoom** — first-time join via invite link, waits for session to go live

## Issues Found

### Critical: PlayerCampaignView has no real-time session status listener

`PlayerCampaignView.tsx` fetches session status once on mount (`loadCampaign`) but **never subscribes** to campaign changes. If a DM starts a session while a player is on this page, the player sees nothing — no "Session is Live" toast, no FAB appearing, no status badge update. They must refresh the page manually.

Compare with `PlayerWaitingRoom` which correctly subscribes to `campaigns` table updates.

### Moderate: SessionKiosk doesn't clean up presence on unmount

`SessionKiosk.tsx` line 162–180 sets `player_presence.is_online = true` but there's no cleanup effect to set `is_online = false` when the kiosk unmounts (player closes the sheet/drawer or navigates away). Stale presence data means the DM sees ghost "online" players.

### Moderate: SessionPlayer doesn't validate campaign_members

`SessionPlayer.tsx` loads a character and renders the kiosk, but never ensures the user is in `campaign_members`. If a player somehow navigates to `/session/player?campaign=CODE` without going through the waiting room or linking flow, they may not have a `campaign_members` entry, which would break `CampaignContext` role detection and RLS-gated queries.

### Minor: PlayerCampaignView session status doesn't update when kiosk session ends

When `onSessionEnded` fires in the kiosk container, it sets `sessionStatus('offline')` but the FAB disappearing relies on `isLive` recalculating. The status badge in the header updates correctly, but if the DM restarts a session, the player has no way to know without refreshing (same root cause as issue #1).

### Minor: Kiosk initiative channel has no encounter filter

`SessionKiosk.tsx` line 132–139 subscribes to all `initiative` table changes without filtering by encounter. In a campaign with historical initiative data, this could trigger unnecessary refetches.

## Proposed Fixes

### 1. Add real-time session listener to PlayerCampaignView
Subscribe to `campaigns` table changes (filtered by campaign ID). When `live_session_id` changes:
- If set → update `sessionStatus` to the session's status, show toast "Session is Live!"
- If cleared → set `sessionStatus('offline')`, show toast "Session ended"

### 2. Add presence cleanup to SessionKiosk
Add a return cleanup in the presence `useEffect` that sets `is_online = false` on unmount. Also add a `beforeunload` listener for tab close.

### 3. Ensure campaign_members in SessionPlayer
Before rendering the kiosk, check/create `campaign_members` entry (same pattern as WaitingRoom lines 121-135).

### 4. Add encounter filter to initiative subscription
Filter initiative channel with `encounter_id=eq.${activeEncounter}` to avoid unnecessary fetches.

### 5. Minor: Kiosk presence heartbeat
Add an interval (every 30s) to update `last_seen` timestamp so presence is more accurate.

## Files to Update

| File | Change |
|------|--------|
| `src/pages/PlayerCampaignView.tsx` | Add real-time campaign subscription for session status |
| `src/components/session/SessionKiosk.tsx` | Presence cleanup on unmount, initiative filter, heartbeat |
| `src/pages/SessionPlayer.tsx` | Ensure campaign_members entry before kiosk render |

No database migrations needed.

