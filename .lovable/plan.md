

# Comprehensive Account Settings and Profile Management

## Overview
Expand the existing `PlayerSettings` page into a full account settings hub that covers all user assets across the Player Hub, Campaign Manager, and Community Forum. Currently, the settings page only handles name, avatar, and fallback color -- there is no way to manage account credentials, view linked campaigns/characters, or control forum identity.

## Current State

- **PlayerSettings page**: Only has profile card (name, avatar, color) and a placeholder "Preferences" card saying "coming soon"
- **Forum (Community.tsx)**: Shows only a generic User icon and timestamps for authors -- no display name or avatar from the `players` table
- **Campaign Hub**: Has a "Settings" dropdown item that does nothing
- **Account management**: No way to change email, password, or delete account from within the app

## What We Will Build

### 1. Account Management Section
A new card on the settings page for managing auth credentials:
- **Email display** (read-only, showing current email from `auth.getUser()`)
- **Change password** button/form (using `supabase.auth.updateUser({ password })`)
- **Sign out** button (already in nav, but also available here for discoverability)
- **Danger zone**: Account deletion option with confirmation dialog

### 2. Forum Display Name Integration
Currently the forum shows no author names -- just a User icon and timestamp. We will:
- Look up the `players.name` for each `author_id` in forum topics and replies
- Display the player's name and avatar alongside their posts
- Ensure changes to the display name in settings propagate to the forum identity automatically (since forum uses `author_id` which maps to `user_id` which maps to `players.user_id`)

### 3. Linked Assets Overview
A new "My Assets" or "Connected Content" card showing a summary of what the user owns across the platform:
- **Characters**: Count and list of characters (from `characters` table where `user_id` matches)
- **Campaigns (as DM)**: Count and list of campaigns where user is `dm_user_id`
- **Campaigns (as Player)**: Count from `player_campaign_links`
- **Forum Activity**: Topic and reply counts from `forum_topics` and `forum_replies`

Each item links to its respective page for quick navigation.

### 4. Preferences Section (replacing placeholder)
Replace the "coming soon" card with functional preferences:
- **Theme toggle** (if dark/light mode is available via next-themes)
- **Navigation default**: Option to set default landing page (Player Hub vs Campaign Hub)

### 5. Fantasy Theming
Apply the same `fantasy-border-ornaments`, `font-cinzel`, and brass accent styling used in the combat and character sheet components to all new settings cards.

---

## Technical Details

### Files to create:
- `src/components/player/settings/AccountSection.tsx` -- Email display, password change form, danger zone
- `src/components/player/settings/LinkedAssetsSection.tsx` -- Asset overview with counts and links
- `src/components/player/settings/PreferencesSection.tsx` -- Theme toggle, nav defaults
- `src/components/player/settings/ForumIdentitySection.tsx` -- Preview of how user appears in forums

### Files to modify:
- `src/pages/PlayerSettings.tsx` -- Compose new section components, add fantasy theming to the page wrapper
- `src/pages/Community.tsx` -- Fetch and display `players.name` and `players.avatar_url` for topic authors and reply authors by joining on `author_id = players.user_id`

### Database:
- No schema changes needed. All data already exists across `players`, `characters`, `campaigns`, `player_campaign_links`, `forum_topics`, and `forum_replies` tables. We only need to query and display it.

### Key implementation notes:
- Password change uses `supabase.auth.updateUser({ password: newPassword })` -- no migration needed
- Forum author lookup: batch-fetch player profiles for all unique `author_id` values in topics/replies, then map them by `user_id` for display
- Asset counts use simple `select('*', { count: 'exact', head: true })` queries
- All new sections follow existing card pattern with `rounded-2xl shadow-xl border-brass/30`

