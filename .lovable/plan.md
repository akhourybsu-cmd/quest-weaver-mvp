

# Map Editor Optimization: Comprehensive Overhaul

## Current State Assessment

After reviewing all 14 component files, the map editor has a solid foundation (Fabric.js canvas, ResizablePanel layout, real-time overlays via Supabase) but suffers from **disconnected tools** -- many sidebar controls have UI but zero canvas integration. Here is every issue found, organized by severity.

---

## Critical Issues (Tools That Don't Work)

### 1. Drawing tools are inert
`DrawingToolbar` lists draw, circle, rectangle, line, and text tools with icons and shortcuts, but `MapViewer` has **zero canvas event handlers** for any of them. Selecting "Freehand Draw" changes the cursor to crosshair but clicking/dragging does nothing. These tools need actual Fabric.js drawing mode integration:
- **Freehand Draw**: Enable `fabricCanvas.isDrawingMode = true` with `PencilBrush`
- **Circle/Rectangle/Line**: Track mousedown origin, create shape on drag, finalize on mouseup
- **Text**: Click to place, open inline text input, add `IText` object

### 2. MeasurementTool is disconnected from canvas
The component manages `startPoint`/`endPoint`/`distance` state internally but has no way to receive click coordinates from the canvas. The canvas `mouse:down` handler in MapViewer only checks for `"pin"` tool -- it never sends coordinates to `MeasurementTool`. Fix: lift measurement state into MapViewer and draw a Fabric.js Line + Text label between points on the canvas.

### 3. RangeIndicator is disconnected from canvas
Same problem. The component has a `rangeFeet` input but no click-to-place integration. It needs a canvas click handler that creates a semi-transparent Fabric.js Circle at the clicked point with the configured radius.

### 4. TerrainMarker is disconnected from canvas
The sidebar lets you pick a terrain type but clicking the canvas does nothing. The `handleCanvasClick` in MapViewer only handles `"pin"` tool. Need to add a `"terrain"` case that inserts a marker into the `map_markers` table at the clicked coordinate.

### 5. Fog of War painting doesn't work
`FogOfWarTools` toggles `fogTool` state ("reveal"/"hide") but MapViewer never uses this state to handle canvas drawing. There's no mouse event that creates or modifies `fog_regions`. The `AdvancedFogTools` component (which has brush painting logic) is **never imported or rendered** anywhere.

### 6. TokenContextMenu is unused
The component exists but is never rendered. Fabric.js canvas tokens are drawn as `Circle` objects, not React elements, so the Radix `ContextMenu` wrapper has nothing to wrap. Need to intercept Fabric.js right-click events and render a positioned context menu.

---

## Performance Issues

### 7. Map image reloads on every resize
The `FabricImage.fromURL` effect (line 231) depends on `canvasSize`. Every panel resize triggers a re-fetch of the image URL. Fix: load the image once, store the FabricImage reference, and only update its `scaleX`/`scaleY` on resize.

### 8. Grid redraws hundreds of objects on resize
The grid effect (line 259) creates individual `Rect` objects for every grid line. On a 1200x800 canvas with 50px grid, that's ~40 Rect objects destroyed and recreated per resize tick. Fix: use a single Fabric.js `Group` or draw grid lines with canvas native drawing (overlay rendering) instead of discrete objects.

### 9. Pan handler causes re-renders on every mouse move
The pan effect (line 148) depends on `isPanning` and `lastPanPosition` state. Every `mousemove` during panning calls `setLastPanPosition`, triggering a re-render, which re-registers all event handlers. Fix: use `useRef` for pan tracking state instead of `useState`.

### 10. Token rendering recreates all objects on any change
The token effect (line 292) removes ALL token objects and recreates them whenever the `tokens` array changes (even for a single token move). Fix: diff the previous tokens against current and only update changed ones.

---

## Functional Gaps

### 11. Grid snap doesn't actually snap
`gridSnapEnabled` state exists but the token `modified` handler (line 318) saves raw coordinates without snapping. Fix: in the modified handler, round `newX`/`newY` to the nearest grid intersection and update the circle position.

### 12. AoE templates always appear at hardcoded (300, 200)
Both `AoETools` and `TokenManager` place new objects at `x:300, y:200` regardless of viewport zoom/pan. Fix: calculate the center of the current viewport using `fabricCanvas.viewportTransform` and place there.

### 13. CombatMap page duplicates tools
`CombatMap.tsx` renders its own Sheet sidebar with TokenManager, FogOfWarTools, and AoETools (lines 120-141), but `MapViewer` also renders all tools in its own resizable sidebar. When the DM opens both, there are two competing instances of each tool. Fix: remove the duplicate tools from `CombatMap.tsx` -- `MapViewer` already handles the full DM sidebar.

### 14. No eraser implementation
The "Eraser" tool in DrawingToolbar changes the cursor but has no logic. Fix: in eraser mode, clicking a user-drawn shape (not tokens/markers/background) should remove it from the canvas.

### 15. `campaignId` not passed to MapViewer from CombatMap
`MapViewer` accepts an optional `campaignId` prop (used for TokenManager), but `CombatMap.tsx` never passes it (line 181-190). This means the TokenManager inside MapViewer's sidebar can't load characters.

---

## Implementation Plan

### Phase 1: Fix the Canvas Event Pipeline (Foundation)

**File: `src/components/maps/MapViewer.tsx`**

- **Refactor pan state to refs**: Replace `isPanning` / `lastPanPosition` useState with useRef to stop re-render churn during panning
- **Create unified canvas click dispatcher**: Expand `handleCanvasClick` to route clicks based on `activeTool`:
  - `"pin"` -- existing behavior (note pin dialog)
  - `"measure"` -- set start/end points, draw measurement line on canvas
  - `"range"` -- place range circle at click point
  - `"terrain"` -- insert terrain marker at click point via `addMarker`
- **Pass `campaignId` through**: Accept it from CombatMap and pass to TokenManager in the sidebar

### Phase 2: Wire Drawing Tools

**File: `src/components/maps/MapViewer.tsx`**

- **Freehand Draw**: When `activeTool === "draw"`, set `fabricCanvas.isDrawingMode = true` with a `PencilBrush` (color picker in DrawingToolbar for stroke color/width)
- **Circle tool**: On mousedown, record origin. On mousemove, preview a Circle. On mouseup, finalize.
- **Rectangle tool**: Same pattern with Rect.
- **Line tool**: Same pattern with Line.
- **Text tool**: On click, create `IText` at pointer position in editing mode.
- **Eraser tool**: On click, check if target object is a user drawing (not `isBackgroundImage`, `isGridLine`, `tokenId`, `aoeId`, `fogId`, `markerId`). If so, remove it.
- Tag all user-drawn objects with `isUserDrawing = true` so eraser can identify them.

**File: `src/components/maps/DrawingToolbar.tsx`**
- Add a color picker and stroke width slider for the draw/shape tools (collapsible section below the tool grid)

### Phase 3: Wire Measurement, Range, and Terrain

**File: `src/components/maps/MeasurementTool.tsx`**
- Change to accept `startPoint`, `endPoint`, and `distance` as props (state lives in MapViewer)
- Remove internal state; become a display-only panel

**File: `src/components/maps/RangeIndicator.tsx`**
- Add callback prop `onRangeConfigChange(rangeFeet)` so MapViewer knows the configured range
- MapViewer draws the Fabric.js Circle on click

**File: `src/components/maps/TerrainMarker.tsx`**
- Add callback prop `onTerrainTypeChange(type)` so MapViewer knows which terrain to place
- MapViewer handles the insert via `addMarker` on click

### Phase 4: Fix Fog of War

**File: `src/components/maps/MapViewer.tsx`**
- Import `AdvancedFogTools` and render it as an overlay inside the canvas container when `fogTool` is active
- Wire `onRevealArea` / `onHideArea` callbacks to create/update `fog_regions` records in the database
- Show a semi-transparent black overlay on the canvas for unrevealed areas

### Phase 5: Fix Grid Snap and Token Context Menu

**File: `src/components/maps/MapViewer.tsx`**
- In the token `modified` handler: if `gridSnapEnabled`, snap coordinates to nearest grid intersection and update circle position before saving
- Add `contextmenu` event on canvas: find clicked token via `fabricCanvas.findTarget`, show a positioned HTML context menu using TokenContextMenu data (rendered via React portal at mouse coordinates)

### Phase 6: Performance Optimizations

**File: `src/components/maps/MapViewer.tsx`**

- **Image caching**: Load image once into a ref (`imageRef`). On resize, update only `scaleX`/`scaleY` and call `renderAll()` -- no re-fetch.
- **Grid as overlay**: Instead of hundreds of Rect objects, use Fabric.js `afterRender` event to draw grid lines directly on the canvas context (`ctx.moveTo/lineTo`). This is zero-object-cost and redraws automatically.
- **Token diffing**: Store previous token state in a ref. On update, only modify changed tokens' positions instead of remove-all/re-add-all.
- **Debounce resize**: Debounce the `ResizeObserver` callback (100ms) so rapid panel resizing doesn't trigger dozens of re-renders.

### Phase 7: Place Objects at Viewport Center

**File: `src/components/maps/MapViewer.tsx`**
- Add utility: `getViewportCenter()` that uses `fabricCanvas.viewportTransform` and canvas dimensions to calculate the world-space center of the current view
- Use this for token placement and AoE template placement instead of hardcoded (300, 200)

### Phase 8: Remove Duplicates in CombatMap

**File: `src/pages/CombatMap.tsx`**
- Remove the Sheet sidebar that renders TokenManager, FogOfWarTools, and AoETools (all already in MapViewer's sidebar)
- Pass `campaignId` to MapViewer
- Keep only MapUpload and map selection in the CombatMap header

---

## Files Modified

| File | Changes |
|------|---------|
| `src/components/maps/MapViewer.tsx` | Major: pan refs, click dispatcher, drawing modes, image caching, grid overlay, token diffing, snap logic, context menu, fog integration, viewport center utility, resize debounce |
| `src/components/maps/DrawingToolbar.tsx` | Add color picker and stroke width controls for drawing tools |
| `src/components/maps/MeasurementTool.tsx` | Convert to controlled component (props for points/distance) |
| `src/components/maps/RangeIndicator.tsx` | Add `onRangeConfigChange` callback prop |
| `src/components/maps/TerrainMarker.tsx` | Add `onTerrainTypeChange` callback prop |
| `src/components/maps/TokenContextMenu.tsx` | Adapt to render as positioned portal instead of wrapping a React child |
| `src/pages/CombatMap.tsx` | Remove duplicate tool sidebar, pass campaignId to MapViewer |

### No database changes required

All fixes are in the React/TypeScript and Fabric.js layer. The existing `map_markers`, `aoe_templates`, `fog_regions`, and `tokens` tables already support all needed operations.

