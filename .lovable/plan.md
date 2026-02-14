

# Map System Overhaul: Layout, Tool Integration, and Overlay Fixes

## Problems Found

### 1. Toolbar Covers the Map
The `DrawingToolbar` is positioned `absolute top-4 left-4 z-20` **inside** the card that wraps the canvas. It floats directly over the map image, blocking content underneath.

### 2. Most Tools Are Not Wired Up
These components exist but are **never rendered** anywhere in `MapViewer` or `MapsTab`:
- `TokenManager` (add tokens dialog)
- `AoETools` (place AoE templates)
- `FogOfWarTools` / `AdvancedFogTools` (fog brush)
- `MeasurementTool` (distance measurement)
- `RangeIndicator` (range circles)
- `TerrainMarker` (terrain type placement)
- `GridSnapToggle` (snap tokens to grid)

The `TokenContextMenu` is imported but never used in JSX either.

### 3. Canvas Destroyed on Every Resize
The `FabricCanvas` initialization `useEffect` depends on `containerSize.width` and `containerSize.height`. Every `ResizeObserver` tick destroys and recreates the entire canvas (losing all objects, state, and zoom position).

### 4. Overlay Tools Use HTML Overlays, Not Fabric
`MeasurementTool`, `RangeIndicator`, and `TerrainMarker` all render their own `<div className="absolute inset-0 z-40">` HTML overlays with SVG. These sit on top of the Fabric canvas and don't interact with it -- they measure HTML pixel coordinates, not canvas scene coordinates (which differ when zoomed/panned).

### 5. MapsTab Has No Tool Sidebar
When a map is selected, `MapsTab` renders `MapViewer` alone with no access to Token Manager, AoE Tools, or Fog Tools. The DM has no way to add tokens or use combat features from the Maps tab.

---

## Solution: Resizable Side-Panel Layout

Replace the current stacked layout with a horizontal split: **Tools Panel (left) | Map Canvas (right)**.

```text
+--------------------+--------------------------------------+
|   DM Tools Panel   |                                      |
|   (collapsible)    |         Fabric.js Canvas              |
|                    |                                      |
|  [Token Manager]   |                                      |
|  [AoE Tools]       |                                      |
|  [Fog Tools]       |         (full remaining width)       |
|  [Terrain]         |                                      |
|  [Grid Snap]       |                                      |
|                    |                                      |
|  [Drawing Tools]   |      Zoom indicator (bottom-right)   |
|  [View Controls]   |                                      |
+--------------------+--------------------------------------+
```

The drawing toolbar (select/pan/draw/shapes/etc.) moves into this side panel rather than floating over the canvas. A collapse button lets DMs maximize canvas space.

---

## Implementation Steps

### Step 1: Fix Canvas Resize (stop recreating on every pixel change)
- Remove `containerSize.width`/`containerSize.height` from the canvas init `useEffect` dependency array.
- Instead, use `fabricCanvas.setDimensions()` in a separate `useEffect` that responds to size changes without destroying the canvas.

### Step 2: Restructure MapViewer Layout
- Wrap content in a `ResizablePanelGroup` (horizontal).
- Left panel: DM tools sidebar (only shown when `isDM` is true).
- Right panel: the canvas container.
- The sidebar contains the `DrawingToolbar` tools inline (not floating), plus sections for Token Manager, AoE Tools, Fog Tools, Terrain, Grid Snap, and Measurement/Range.

### Step 3: Integrate All Existing Tool Components
Wire up each tool component into the sidebar:
- `TokenManager` -- rendered in sidebar, already a dialog trigger.
- `AoETools` -- rendered in sidebar, already self-contained.
- `FogOfWarTools` -- rendered in sidebar with fog state wired to canvas.
- `GridSnapToggle` -- rendered in sidebar.
- `MeasurementTool` and `RangeIndicator` -- convert from HTML overlay approach to using the Fabric canvas for drawing measurement lines/circles (so they respect zoom/pan). Fall back to simpler sidebar-only controls if time-constrained.
- `TerrainMarker` -- wire click handler through the canvas mouse events instead of a separate HTML overlay.

### Step 4: Fix Overlay Coordinate Systems
- `MeasurementTool`, `RangeIndicator`, and `TerrainMarker` currently use `e.clientX - rect.left` which gives HTML coordinates, not Fabric scene coordinates. Replace with `fabricCanvas.getScenePoint(e)` calls passed from MapViewer, so measurements and placements are accurate when the map is zoomed or panned.

### Step 5: Wire Up TokenContextMenu
- When a token's Fabric circle is right-clicked, show the `TokenContextMenu` positioned at the click location with edit/delete/visibility/duplicate actions (all handlers already exist in MapViewer).

### Step 6: Update MapsTab
- Pass `campaignId` to `MapViewer` so `TokenManager` and `AoETools` can load characters and encounter data.
- Add a `map_type` selector to `MapUpload` dialog so DMs can categorize maps on creation.

---

## Technical Details

### Files Modified
- `src/components/maps/MapViewer.tsx` -- Major restructure: resizable panel layout, integrate all tools, fix canvas resize, wire context menu
- `src/components/maps/DrawingToolbar.tsx` -- Convert from floating card to inline sidebar section (vertical list instead of wrapped grid)
- `src/components/maps/MeasurementTool.tsx` -- Accept Fabric canvas ref, draw on canvas instead of HTML overlay
- `src/components/maps/RangeIndicator.tsx` -- Same: use Fabric canvas coordinates
- `src/components/maps/TerrainMarker.tsx` -- Remove HTML overlay, use canvas click events from parent
- `src/components/campaign/tabs/MapsTab.tsx` -- Pass campaignId to MapViewer, add map_type to upload

### Files Unchanged
- `MarkerRenderer.tsx` -- already works correctly on Fabric canvas
- `NotePinDialog.tsx` -- already wired up and functional
- `TokenContextMenu.tsx` -- already built, just needs to be rendered
- `useMapOverlays.ts` -- hook is solid, no changes needed
- `MapUpload.tsx` -- minor: add map_type field

### New Dependencies
None -- `react-resizable-panels` is already installed.

