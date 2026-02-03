
# Campaign Maps Enhancement Plan

## Overview

This plan enhances the campaign map system with proper sizing/layout, full overlay persistence, and a comprehensive DM toolkit. The goal is to make maps work cleanly for both DMs and players with real-time synchronized overlays.

---

## Part 1: Map Viewer Layout & Sizing Improvements

### Current Problems
- Fixed canvas size (1200x800 DM, 800x600 player) doesn't respect actual map dimensions
- No pan/drag for navigating large maps
- Poor mobile responsiveness
- Canvas doesn't fill available viewport space

### Solution

**A. Responsive Canvas Container**
- Replace fixed dimensions with viewport-aware sizing using `ResizeObserver`
- Canvas fills available space while maintaining map aspect ratio
- Add CSS `max-h-[calc(100vh-200px)]` for proper vertical containment

**B. Pan & Zoom Navigation**
- Implement canvas panning via Fabric.js viewport transform
- Click-and-drag to pan (when no tool selected)
- Mouse wheel zoom centered on cursor position
- Touch gesture support for mobile (pinch-to-zoom, two-finger pan)

**C. Fit-to-View Options**
- "Fit Width" button - scales map to fit container width
- "Fit Height" button - scales map to fit container height  
- "Fit All" button - scales to show entire map
- Persist user's preferred view per map in localStorage

---

## Part 2: Overlay Persistence & Real-Time Sync

### Current Gaps
- Terrain markers are local state only
- AoE templates saved to DB but not rendered on canvas
- Fog regions in DB but not drawn properly
- Overlays don't sync in real-time between DM and players

### Solution

**A. New Database Table: `map_markers`**
Unified table for all persistent map annotations:

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| map_id | UUID | Foreign key to maps |
| marker_type | TEXT | "terrain", "note", "light", "effect" |
| shape | TEXT | "circle", "square", "icon", "polygon" |
| x, y | REAL | Position coordinates |
| width, height | REAL | Dimensions (nullable) |
| rotation | REAL | Rotation angle |
| color | TEXT | Fill/stroke color |
| opacity | REAL | Transparency (0-1) |
| icon | TEXT | Lucide icon name (nullable) |
| label | TEXT | Display label |
| dm_only | BOOLEAN | Hide from players |
| metadata | JSONB | Additional properties |
| created_at | TIMESTAMPTZ | Creation time |

**B. Render All Overlays on Canvas**
Update `MapViewer.tsx` to:
1. Load and render `aoe_templates` as colored shapes on canvas
2. Load and render `map_markers` (terrain, notes, effects)
3. Load and render `fog_regions` as black polygons
4. Subscribe to real-time changes for all three tables
5. Apply `dm_only` filtering for player views

**C. Real-Time Synchronization**
- Add `resilientChannel` subscriptions for overlay tables
- DM changes propagate instantly to player views
- Token movements sync in real-time (already partially implemented)

---

## Part 3: DM Overlay Toolkit

### Enhanced Tools

**A. Token Management Improvements**
- Drag tokens directly on canvas (not just add dialog)
- Right-click context menu: Edit, Delete, Toggle Visibility, Rotate
- Token labels displayed above circles
- Support for custom token images (uploaded portraits)
- Initiative order numbers displayed on tokens during combat

**B. Drawing Tools Panel**
New unified toolbar for DM:

| Tool | Function |
|------|----------|
| Select | Click to select/move objects |
| Freeform Draw | Draw paths/arrows |
| Shape | Rectangle, circle, line placement |
| Text | Add text labels anywhere |
| Measure | Distance measurement (existing) |
| Range | Range radius indicator (existing) |

**C. Terrain & Environment Markers**
Persist `TerrainMarker` data to `map_markers` table:
- Difficult terrain (halves movement)
- Water/liquid hazards
- Fire/lava (damage zones)
- Darkness/dim light areas
- Traps (hidden from players until triggered)

**D. Effect Zones**
Enhance `AoETools` with:
- Spell effect persistence (duration tracking)
- Custom colors and opacity
- Damage type indicators
- Auto-cleanup when spell ends
- Layer ordering (above/below tokens)

**E. Note Pins**
Add map annotation system:
- Click to place numbered pins
- Each pin links to a note/description
- DM-only or player-visible options
- Pop-up tooltip on hover

**F. Light & Vision** (Future consideration)
- Light source markers with radius
- Darkness zones
- Line-of-sight blocking (walls)

---

## Part 4: Player Map Experience

### Improvements for Players

**A. Cleaner Player View**
- Full responsive canvas sizing (match DM improvements)
- Smooth pan/zoom navigation
- Their token highlighted (gold border - existing)
- Other player tokens visible
- Revealed fog regions only

**B. Player Measurement Tool**
- Allow players to measure distances
- Range indicator for their character's attacks
- No editing capabilities (view-only for overlays)

**C. Visible Overlays**
Players see (when not `dm_only`):
- AoE spell effects
- Terrain markers
- Public note pins
- Revealed areas (no fog)

---

## Technical Implementation

### Files to Create
- `src/components/maps/DrawingToolbar.tsx` - Unified DM toolbar
- `src/components/maps/MarkerRenderer.tsx` - Renders all marker types
- `src/components/maps/TokenContextMenu.tsx` - Right-click token actions
- `src/components/maps/NotePinDialog.tsx` - Create/edit note pins
- `src/hooks/useMapOverlays.ts` - Centralized overlay data hook

### Files to Modify
1. **MapViewer.tsx** - Major refactor:
   - Responsive sizing with ResizeObserver
   - Pan/zoom navigation
   - Render all overlay types
   - Real-time subscriptions
   - DM vs player mode rendering

2. **PlayerMapViewer.tsx** - Align with MapViewer improvements:
   - Same responsive sizing
   - Add pan/zoom
   - Add measurement tool for players
   - Render visible overlays

3. **CombatMap.tsx** - UI reorganization:
   - Floating toolbar instead of sidebar
   - Better tool state management
   - Fullscreen option

4. **WorldMap.tsx** - Apply same improvements:
   - Responsive canvas
   - Pan/zoom for large world maps
   - Location pin markers

5. **TerrainMarker.tsx** - Persist to database:
   - Save markers to `map_markers` table
   - Load existing markers on init

6. **AoETools.tsx** - Enhance rendering:
   - Render existing templates on canvas
   - Drag to reposition
   - Click to delete

### Database Migration
```sql
-- Create unified markers table
CREATE TABLE map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES maps(id) ON DELETE CASCADE NOT NULL,
  marker_type TEXT NOT NULL DEFAULT 'note',
  shape TEXT NOT NULL DEFAULT 'circle',
  x REAL NOT NULL,
  y REAL NOT NULL,
  width REAL,
  height REAL,
  rotation REAL DEFAULT 0,
  color TEXT DEFAULT '#ffffff',
  opacity REAL DEFAULT 1,
  icon TEXT,
  label TEXT,
  dm_only BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE map_markers;

-- RLS policies
ALTER TABLE map_markers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "DMs can manage markers"
  ON map_markers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM maps m
      JOIN campaigns c ON m.campaign_id = c.id
      WHERE m.id = map_markers.map_id
      AND c.dm_user_id = auth.uid()
    )
  );

CREATE POLICY "Players can view non-DM-only markers"
  ON map_markers FOR SELECT
  USING (
    dm_only = false OR
    EXISTS (
      SELECT 1 FROM maps m
      JOIN campaigns c ON m.campaign_id = c.id
      WHERE m.id = map_markers.map_id
      AND c.dm_user_id = auth.uid()
    )
  );

-- Enable realtime for existing overlay tables
ALTER PUBLICATION supabase_realtime ADD TABLE aoe_templates;
ALTER PUBLICATION supabase_realtime ADD TABLE fog_regions;
```

---

## User Experience Summary

### For DMs
- Maps automatically fit available screen space
- Pan and zoom large maps easily
- Unified floating toolbar for all drawing/marking tools
- All overlays persist and sync to players in real-time
- Right-click tokens for quick actions
- Place terrain, effects, and note markers anywhere

### For Players
- Maps scale to their viewport
- Easy pan/zoom navigation
- Measure distances and ranges
- See all revealed overlays from DM
- Their token clearly highlighted

---

## Implementation Order

1. Database migration (map_markers table)
2. MapViewer responsive sizing + pan/zoom
3. Overlay rendering (markers, AoE, fog)
4. Real-time subscriptions
5. Drawing toolbar for DM
6. Token drag/context menu
7. PlayerMapViewer alignment
8. Terrain/Effect persistence
9. Note pin system
10. WorldMap integration
