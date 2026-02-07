

# Player Hub Tabs -- Full Connectivity Audit

## Root Cause: Two Critical Blockers

### Blocker 1: `campaign_members` INSERT Policy Blocks Players

The `campaign_members` table only has two RLS policies:
- **ALL** (DMs only) -- checks `is_dm`
- **SELECT** (members) -- checks `has_access`

There is **no INSERT policy for players**. When `linkCampaign()` tries to insert a `campaign_members` row for the player, it **silently fails** due to RLS. The `player_campaign_links` row is created, but `campaign_members` is not.

Proof: Campaign `99DC7S` has a `player_campaign_links` entry for the test player, but **zero** `campaign_members` rows and **zero** `characters` rows.

### Blocker 2: 5 Tables Still Use Old RLS Pattern

Only `lore_pages` and `session_notes` were updated to check `campaign_members` in their SELECT policies. Five other tables still use the old pattern that only checks `dm_user_id` OR `characters.user_id`:

| Table | SELECT Policy Checks | Includes campaign_members? |
|-------|---------------------|--------------------------|
| `lore_pages` | dm + characters + campaign_members | Yes |
| `session_notes` | dm + characters + campaign_members | Yes |
| `npcs` | dm + characters | **NO** |
| `locations` | dm + characters | **NO** |
| `quests` | dm + characters | **NO** |
| `quest_steps` | (via quests) dm + characters | **NO** |
| `factions` | dm + characters | **NO** |
| `timeline_events` | dm + characters | **NO** |

Since the test player has neither DM access nor a character, **all tabs return empty results** even if assets are marked visible.

### Additional Issue: Realtime Not Enabled for 2 Tables

The `factions` and `lore_pages` tables are **not** in the `supabase_realtime` publication. The `PlayerFactionsView` and `PlayerLoreView` components subscribe to realtime changes, but those subscriptions will never fire.

---

## Tab-by-Tab Status

| Tab | Component | Query Filter | RLS Issue | Other Issues |
|-----|-----------|-------------|-----------|------------|
| Quests | PlayerQuestTracker | `player_visible = true` | Missing `campaign_members` check | None |
| NPCs | PlayerNPCDirectory | `player_visible = true` | Missing `campaign_members` check | NPCDetailDrawer works with `isDM=false` |
| Locations | PlayerLocationsView | `discovered = true` | Missing `campaign_members` check | None |
| Factions | PlayerFactionsView | `player_visible = true` | Missing `campaign_members` check | Realtime not enabled on table |
| Lore | PlayerLoreView | `visibility = 'SHARED'` | Fixed | Realtime not enabled on table |
| Timeline | PlayerTimelineView | `player_visible = true` | Missing `campaign_members` check | None |
| Notes | PlayerNotesView | `visibility = 'SHARED'` | Fixed | Uses `resilientChannel` (good) |

---

## Implementation Plan

### Phase 1: Fix campaign_members INSERT Policy

Add an RLS policy allowing authenticated users to insert themselves as a `player` role. This ensures `linkCampaign()` actually creates the row:

```text
CREATE POLICY "Players can join campaigns"
ON public.campaign_members
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND role = 'player'
);
```

This restricts self-insertion to the `player` role only -- users cannot assign themselves as DM.

### Phase 2: Backfill Missing campaign_members Row

The test player (and possibly others) already has a `player_campaign_links` entry but no `campaign_members` row. Run a one-time backfill:

```text
INSERT INTO campaign_members (campaign_id, user_id, role)
SELECT pcl.campaign_id, p.user_id, 'player'
FROM player_campaign_links pcl
JOIN players p ON p.id = pcl.player_id
WHERE NOT EXISTS (
  SELECT 1 FROM campaign_members cm
  WHERE cm.campaign_id = pcl.campaign_id
  AND cm.user_id = p.user_id
);
```

### Phase 3: Fix 5 Remaining SELECT Policies

Update `npcs`, `locations`, `quests`, `quest_steps`, `factions`, and `timeline_events` SELECT policies to include `campaign_members` in the access check UNION, matching the pattern already applied to `lore_pages` and `session_notes`:

```text
campaign_id IN (
  SELECT campaigns.id FROM campaigns WHERE campaigns.dm_user_id = auth.uid()
  UNION
  SELECT characters.campaign_id FROM characters WHERE characters.user_id = auth.uid()
  UNION
  SELECT campaign_members.campaign_id FROM campaign_members WHERE campaign_members.user_id = auth.uid()
)
```

Tables affected:
- `npcs` -- "Campaign members can view NPCs"
- `locations` -- "Campaign members can view locations"
- `quests` -- "Campaign members can view quests"
- `quest_steps` -- "Campaign members can view quest steps"
- `factions` -- "Campaign members can view factions"
- `timeline_events` -- "Campaign members can view timeline events"

### Phase 4: Enable Realtime for Missing Tables

```text
ALTER PUBLICATION supabase_realtime ADD TABLE public.factions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.lore_pages;
```

---

## Files Changed

| File | Changes |
|------|---------|
| `supabase/migrations/...` | Single migration: INSERT policy, backfill, 6 SELECT policy updates, realtime enablement |

No application code changes needed -- all components are correctly implemented. The issue is entirely at the database policy layer.

