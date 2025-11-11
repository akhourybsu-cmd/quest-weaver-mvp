# Quest Weaver 5e Feature Audit System

## Overview

This audit system provides comprehensive verification of all D&D 5e companion features in Quest Weaver, with focus on DM↔Player synchronization and feature discoverability.

## Components

### 1. Static Inventory (`src/lib/audit/staticInventory.ts`)
- Scans routes, components, and menu structures
- Maps features to their locations in the app
- Identifies orphaned components and unlinked features
- Exports structured data about:
  - All application routes
  - Feature-to-route mappings
  - Realtime event publishers and subscribers
  - Menu paths and visibility

### 2. Dynamic Tester (`src/lib/audit/dynamicTester.ts`)
- Executes live DM↔Player sync scenarios using demo mode
- Tests critical interactions:
  - Join & Presence
  - Initiative Push
  - HP/Damage Updates
  - Death Saves
  - Conditions
  - Concentration
  - Quest Sharing
  - Item Handouts
  - Rest Mechanics
- Measures latency for each scenario
- Reports PASS/FAIL/SKIP status

### 3. Report Generator (`src/lib/audit/reportGenerator.ts`)
- Creates comprehensive markdown report
- Generates machine-readable artifacts:
  - `feature-map.json` - Complete feature inventory
  - `route-inventory.csv` - All routes with access levels
  - Link graph with event flows
- Includes:
  - Executive summary with metrics
  - Feature coverage matrix
  - Dynamic test results
  - Backlog of missing/proposed features
  - Change log of auto-fixes

### 4. Audit Harness UI (`/dev/audit`)
- Interactive dashboard for running audits
- Real-time progress tracking
- Visual results display
- One-click report downloads

## Usage

### Running an Audit

1. Navigate to `/dev/audit` in your browser
2. Click "Run Full Audit"
3. The system will:
   - Build static inventory (10%)
   - Create demo environment (20%)
   - Set up test context (30%)
   - Execute 10+ dynamic scenarios (40-90%)
   - Generate reports (90-100%)
4. Reports automatically download to your Downloads folder

### Interpreting Results

#### Feature Coverage Matrix
Shows which features are available in:
- Campaign Manager (DM view)
- DM Screen (active session)
- Player View

**Result Codes:**
- ✅ `PASS` - Feature fully implemented with realtime sync
- ⚠️ `PARTIAL` - Feature exists but incomplete sync or missing player view
- ❌ `MISSING` - Feature not implemented

#### Dynamic Test Results
Each scenario reports:
- **Event** - The database/realtime event triggered
- **Expected** - What should happen
- **Observed** - What actually happened
- **Latency** - Time for DM action to reach Player view
- **Result** - PASS/FAIL/SKIP
- **Details** - Additional context or error messages

**Acceptable Latencies:**
- < 300ms: Excellent
- 300-800ms: Good (target range)
- > 800ms: Needs optimization

#### Link Graph
Maps event flows showing:
- Event name (e.g., `characters.update`)
- Direction (DM→Player, Player→DM, broadcast)
- Publishers (components that trigger events)
- Subscribers (components that listen for events)
- Observed latency

## Test Scenarios

### 1. Join & Presence
**What it tests:** Player joining session and presence system  
**Expected:** Player appears in DM's presence bar within 500ms  
**Key tables:** `player_presence`

### 2. Initiative Push
**What it tests:** Combat initiative synchronization  
**Expected:** Initiative order and turn state visible to all players  
**Key tables:** `initiative`, `encounters`

### 3. HP Update
**What it tests:** Damage/healing propagation  
**Expected:** Player sees HP change in < 500ms after DM applies damage  
**Key tables:** `characters`

### 4. Death Saves (Planned)
**What it tests:** Death save tracking sync  
**Expected:** DM and player see same death save state  
**Key tables:** `characters.death_save_success/fail`

### 5. Condition Toggle (Planned)
**What it tests:** Condition application and duration  
**Expected:** Player sees condition badge with timer  
**Key tables:** `character_conditions`

### 6. Concentration (Planned)
**What it tests:** Concentration spell tracking  
**Expected:** Both views show concentration status and remaining duration  
**Key tables:** `effects`, `characters`

### 7. Quest Share (Planned)
**What it tests:** Quest objective synchronization  
**Expected:** Player quest log updates when DM marks objective complete  
**Key tables:** `quests`, `quest_objectives`

### 8. Loot Handout (Planned)
**What it tests:** Item transfer from DM to player  
**Expected:** Player receives item with correct properties and attunement  
**Key tables:** `items`, `character_inventory`

### 9. Short Rest (Planned)
**What it tests:** Resource recovery mechanics  
**Expected:** Player resources refresh according to rest rules  
**Key tables:** `characters`, `character_resources`

### 10. Notes/Handout Share (Planned)
**What it tests:** Sharing DM notes with players  
**Expected:** Player can view shared note content  
**Key tables:** `notes`, `handouts`

## Backlog Features

The system automatically identifies and prioritizes missing features:

### P0 - Critical
- **Concentration Break Auto-Prompt**: Toast notification when damaged while concentrating
- Missing UI elements for core mechanics

### P1 - High Priority
- **Exhaustion Ladder Visual**: Clear display of exhaustion level effects
- **Party Ready Check**: Confirm all players ready before starting encounter

### P2 - Medium Priority
- **Lair Actions Tracker**: Automated lair action reminders
- **Legendary Actions Counter**: Visual legendary action pool

## Auto-Fixes

When enabled, the system can automatically apply low-risk fixes:

### Example Fixes
1. **Missing Nav Links**: Add navigation to implemented but unlinked features
2. **Event Subscriptions**: Wire missing realtime listeners
3. **Menu Entries**: Add discoverable menu items for orphaned routes

All fixes are logged in the report's "Additions Implemented" section with:
- File path modified
- Description of change
- Reason for change

## Output Artifacts

### 1. Full Audit Report (`quest-weaver-5e-audit.md`)
Complete markdown document with:
- Executive summary
- Feature coverage matrix
- Dynamic test results
- Link graph
- Backlog items
- Recommendations

### 2. Route Inventory (`route-inventory.csv`)
CSV file listing all routes:
```csv
Route,Component,Access,Menu Label,Visibility
/,Index,public,Home,Active
/session/dm,SessionDM,dm,DM Screen,Active
```

### 3. Feature Map (`feature-map.json`)
JSON file with structured data:
```json
{
  "routes": [...],
  "features": [...],
  "events": [...],
  "orphanedComponents": [],
  "unlinkedFeatures": []
}
```

## Integration with CI/CD

To run audits automatically in CI:

```bash
# Run audit and save results
npm run audit:5e

# Check for regressions
npm run audit:check
```

## Troubleshooting

### "No authenticated user" error
- Ensure you're logged in before running audit
- Check Supabase auth status

### "Character not found" in tests
- Audit creates temporary test data
- Check test character creation step

### High latency (>1000ms)
- Check network connection
- Verify Supabase realtime is enabled
- Review database RLS policies

### Scenarios skipped
- Some scenarios require active encounter
- System skips scenarios when prerequisites not met

## Extending the Audit

### Adding New Scenarios

1. Open `src/lib/audit/dynamicTester.ts`
2. Add scenario to `TEST_SCENARIOS` array:

```typescript
{
  id: 'my-new-test',
  name: 'My New Test',
  description: 'What this test verifies',
  execute: async (ctx) => {
    // Test implementation
    return {
      scenarioId: 'my-new-test',
      startTime,
      endTime,
      event: 'event_name',
      expected: 'What should happen',
      observed: 'What did happen',
      latencyMs: endTime - startTime,
      result: 'PASS',
      details: 'Additional context',
    };
  },
}
```

### Adding New Features to Track

1. Open `src/lib/audit/staticInventory.ts`
2. Add feature to `CORE_FEATURES`:

```typescript
{
  id: 'my-feature',
  name: 'My Feature Name',
  patterns: ['pattern1', 'pattern2', 'ComponentName'],
}
```

## Best Practices

1. **Run before releases**: Verify no regressions in DM↔Player sync
2. **Review backlog regularly**: Prioritize missing features based on user feedback
3. **Monitor latencies**: Keep sync times under 500ms for responsive experience
4. **Document auto-fixes**: Review what was changed and why
5. **Update test scenarios**: Add scenarios for new features as they're built

## Architecture Notes

- Uses **Ephemeral Demo Mode** to avoid touching production data
- All tests run in isolated demo instance (auto-cleaned after audit)
- Leverages Supabase realtime for event verification
- Static analysis uses regex patterns (could be enhanced with AST parsing)
- Modular design allows adding new scenario types easily

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** Quest Weaver Development Team
