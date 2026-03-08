

# Upgrade import-srd-core to use v2 API endpoints

## Analysis

Compared the current edge function against the Open5e API manifest. Here's the status:

| Endpoint | Current | Latest | Action Needed |
|----------|---------|--------|---------------|
| spells | **v1** | **v2** | Upgrade -- v2 has richer data, exact SRD filtering |
| backgrounds | v2 | v2 | None |
| feats | v2 | v2 | None |
| conditions | v2 | v2 | None |
| weapons | v2 | v2 | None |
| armor | v2 | v2 | None |
| classes | v1 | v1 | None (no v2 exists) |
| races | v1 | v1 | None (no v2 exists) |
| monsters | v1 | v1 | **Fix column mapping** (currently broken) |
| magicitems | v1 | v1 | None |

### Two issues to fix:

**1. Spells: Upgrade to v2 API**
Current v1 approach fetches ALL 1900+ spells then filters client-side. The v2 API supports `document__key=srd-2014` which returns exactly 319 SRD spells directly -- no client-side filtering needed. v2 also provides:
- `classes` as structured array `[{name: "Wizard", key: "srd_wizard"}]` instead of comma-separated string
- `damage_roll`, `damage_types`, `material_specified`, `shape_type`, `shape_size`
- `verbal`/`somatic`/`material` as booleans instead of parsed string
- `casting_options` for upcast scaling

**2. Monsters: Fix broken column mapping in import-srd-core**
The `importMonsters` function writes fields like `hp`, `hit_dice`, `str`, `dex`, `source_type` -- none of which exist in the `monster_catalog` schema. The actual columns are `hp_avg`, `hp_formula`, `abilities` (jsonb), `source` (text), etc. This means the monster import in `import-srd-core` silently fails every time. The separate `fetch-open5e-monsters` edge function worked correctly (322 monsters exist), but the unified importer is broken.

## Changes

### 1. `supabase/functions/import-srd-core/index.ts`

**Spells (`importSpells`):** Replace v1 fetch with:
```
GET /v2/spells/?document__key=srd-2014&limit=100
```
- Parse `classes` from `spell.classes.map(c => c.name)` instead of splitting `dnd_class` string
- Extract `material_specified` for the `material` column
- Map `verbal`/`somatic`/`material` booleans to components array `["V","S","M"]`
- Remove the client-side SRD filtering logic (API does it server-side now)

**Monsters (`importMonsters`):** Fix column mapping to match actual schema:
- `hp` → `hp_avg`
- `hit_dice` → `hp_formula`  
- Individual `str/dex/con/int/wis/cha` → `abilities` jsonb
- `source_type` → `source`
- Add missing fields: `senses` as jsonb, `immunities`/`resistances`/`vulnerabilities` as jsonb

### 2. Pagination helper (`fetchAllPages`)
Update to handle v2 pagination which uses the same `next`/`results` structure -- no changes needed here.

### 3. Post-import cleanup
The junk spell cleanup becomes unnecessary for the spells path since v2 only returns SRD content. Keep it as a safety net but it should be a no-op going forward.

