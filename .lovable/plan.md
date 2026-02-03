
# Locations Hub Bug Fix & Feature Plan

## Overview
This plan addresses two requirements:
1. **Bug Fix**: Locations not updating immediately in the UI after save
2. **Feature**: Automatically create/link NPCs when location owners are specified

---

## Part 1: Real-Time Location Updates Fix

### Current State Analysis
The `LocationsTab` component already has a real-time subscription using `resilientChannel`:
- Subscribes to postgres changes on the `locations` table
- Calls `fetchLocations()` when changes are detected

### Root Cause
The `LocationDialog` component closes immediately after a successful save, but there's no callback to notify the parent component that a save occurred. The real-time subscription should catch this, but there may be a timing issue with the resilient channel reconnection.

### Solution
Add an `onSaved` callback prop to `LocationDialog` that triggers an immediate refresh in the parent component, ensuring UI updates happen synchronously rather than relying solely on real-time events.

**Files to modify:**
- `src/components/locations/LocationDialog.tsx` - Add `onSaved` callback prop
- `src/components/campaign/tabs/LocationsTab.tsx` - Pass callback to trigger refresh

---

## Part 2: Auto-Index Location Owners as NPCs

### How It Works
When a location is saved with an owner specified (in the `details` JSON field), the system will:

1. Extract all owner-related fields from location details:
   - `owner_npc`, `owner`, `shopkeeper_name`, `wizard_name`, `innkeeper`, `guild_master`, `captain_name`, etc.

2. For each owner name found:
   - Search for existing NPC with matching name in the campaign
   - If NPC exists: Update their `location_id` to link them to this location
   - If NPC doesn't exist: Create a new NPC with:
     - Name from the owner field
     - `location_id` set to this location
     - `role_title` based on the location type
     - `player_visible` set to false (DM can reveal later)
     - `status` set to "alive"

### Owner Field Mapping
| Location Field | NPC Role Title |
|----------------|----------------|
| `owner_npc`, `owner` | "Owner" |
| `shopkeeper_name` | "Shopkeeper" |
| `wizard_name` | "Wizard" |
| `innkeeper` | "Innkeeper" |
| `guild_master` | "Guild Master" |
| `captain_name` | "Captain" |
| `banker_name` | "Banker" |
| `warden_name` | "Warden" |
| `smith_name`, `smithy_name` | "Blacksmith" |
| `librarian_name` | "Librarian" |
| `healer_name` | "Healer" |
| `harbor_master` | "Harbor Master" |
| `stable_master` | "Stable Master" |
| (and similar patterns...) |

### Implementation Details

**Files to modify:**
- `src/components/locations/LocationDialog.tsx`:
  - Add a helper function `linkOrCreateOwnerNPC()`
  - Call this function after successful location save
  - Extract owner fields from merged details
  - Query existing NPCs by name (case-insensitive)
  - Insert new NPC or update existing NPC's location_id

### NPC Creation Data Structure
```typescript
{
  campaign_id: campaignId,
  name: ownerName,
  role_title: derivedRoleTitle,
  location_id: locationId,
  location: locationName, // Human-readable reference
  player_visible: false,
  status: "alive",
  tags: ["location-owner", locationType.toLowerCase()],
}
```

---

## Technical Implementation Steps

1. **Update LocationDialog props interface** to include optional `onSaved` callback

2. **Create owner field extraction utility**:
   - Define mapping of field keys to role titles
   - Extract all owner-related values from details object

3. **Implement NPC linking logic**:
   - After successful location insert/update
   - Query for existing NPC with matching name
   - Upsert NPC record accordingly

4. **Update LocationsTab** to pass `onSaved={() => fetchLocations()}` callback

5. **Handle edge cases**:
   - Empty/null owner names (skip processing)
   - Multiple owners per location (create/link each one)
   - Owner name changes on edit (create new, don't delete old)
   - Duplicate prevention (case-insensitive name matching)

---

## User Experience

After implementation:
- Saving a location will immediately update the Locations Hub (no refresh needed)
- Any owner specified in location details automatically appears in the NPC directory
- NPCs are linked to their locations via `location_id`
- NPCs are tagged with "location-owner" for easy filtering
- Existing NPCs are linked rather than duplicated
