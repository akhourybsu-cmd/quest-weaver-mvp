

# Map Overlays Bug Scan

## Critical Issues Found

### Bug 1 — `useMapOverlays.ts` + `MarkerRenderer.tsx`: Fog schema mismatch (BROKEN)
**Severity**: Critical — fog of war is completely non-functional
**Problem**: The database `fog_regions` table has columns `is_hidden` (boolean) and `path` (jsonb). But the hook and renderer use `is_revealed` and `polygon_points` — fields that don't exist. Result:
- `useMapOverlays` filters on `f.is_revealed` → always `undefined` → all fog filtered out for players
- `MarkerRenderer` reads `fog.polygon_points` → always `[]` → nothing renders
- `FogOfWarTools` correctly updates `is_hidden`, but the data never reaches the canvas

**Fix**:
- In `useMapOverlays`, map DB fields correctly: `is_revealed: !f.is_hidden`, `polygon_points: f.path || []`
- Update the `FogRegion` interface to match
- In `MarkerRenderer`, the logic already uses `is_revealed` which will now work after the mapping fix

### Bug 2 — `MarkerRenderer.tsx`: Fog z-order behind background image
**Severity**: High — even if fog data were correct, it would be invisible
**Problem**: Line 77 calls `canvas.sendObjectToBack(polygon)` for fog regions. The background image is also sent to back. This puts fog polygons *behind* the map image, making them invisible.

**Fix**: Don't call `sendObjectToBack` on fog. Instead, ensure fog is added *after* the image exists. Use a simple ordering: add fog first in the render loop, then AoE, then markers. The image is already at the back (index 0). Fog should sit at index 1+, not behind index 0.

### Bug 3 — `MapViewer.tsx`: Fog drawing tool has no implementation
**Severity**: High — DM cannot create fog regions
**Problem**: `fogTool` state is set by `FogOfWarTools` but never referenced in the `handleMouseDown` switch. There is no mouse handler to draw fog polygons on the canvas. The "Reveal" and "Hide" buttons in the sidebar only toggle existing regions — but there's no way to create new ones.

**Fix**: Add a fog drawing mode that:
1. On mouse down with `fogTool` active, starts collecting polygon points
2. On subsequent clicks, adds points
3. On double-click or close, saves the polygon to `fog_regions` via Supabase
4. Wire this into the existing `handleMouseDown` handler

### Bug 4 — `MarkerRenderer.tsx`: Overlays may render before image loads
**Severity**: Medium — overlays briefly flash then disappear on re-render
**Problem**: `MarkerRenderer` runs its `useEffect` when `markers/aoeTemplates/fogRegions` change. If overlays load before the background image (async `FabricImage.fromURL`), the image load callback calls `sendObjectToBack(img)` which pushes the image below overlays — correct. But if MarkerRenderer re-runs *after* the image, it clears all overlay objects and re-adds them. This works, but the clear-and-rebuild approach means overlays flash on every realtime update.

**Fix**: Use diffing (like tokens already do) instead of clear-and-rebuild. For now, acceptable but flagged.

### Bug 5 — `FogOfWarTools.tsx`: Uses `is_hidden` but should be consistent
**Severity**: Low
**Problem**: `handleRevealAll` sets `is_hidden: false` and `handleHideAll` sets `is_hidden: true`. This is correct per DB schema. No fix needed — just needs the hook mapping to match.

---

## Files to Update

| File | Bug(s) |
|------|--------|
| `src/hooks/useMapOverlays.ts` | #1 (map `is_hidden`→`is_revealed`, `path`→`polygon_points`) |
| `src/components/maps/MarkerRenderer.tsx` | #2 (fix fog z-ordering) |
| `src/components/maps/MapViewer.tsx` | #3 (implement fog drawing handler) |

## Priority
1. **Bug #1** — Schema mismatch makes fog completely broken
2. **Bug #2** — Z-order makes fog invisible even with correct data
3. **Bug #3** — No way to create fog regions (drawing not wired up)

## Implementation Details

**useMapOverlays.ts** — Fix the fog data mapping in `loadOverlays`:
```typescript
// Map DB columns to interface
const mappedFog = filteredFog.map((f: any) => ({
  id: f.id,
  map_id: f.map_id,
  is_revealed: !f.is_hidden,
  polygon_points: Array.isArray(f.path) ? f.path : [],
}));
setFogRegions(mappedFog);
```

**MarkerRenderer.tsx** — Remove `sendObjectToBack` from fog rendering. Fog objects will naturally layer above the background image (which is at index 0).

**MapViewer.tsx** — Add fog drawing to `handleMouseDown`:
- Track polygon points in a ref
- On click when `fogTool` is active, add point to polygon
- On double-click, save completed polygon to DB via `supabase.from('fog_regions').insert()`
- Render preview polygon on canvas during drawing
- Clear preview on completion

