/**
 * Report Generator - Creates markdown audit report with findings
 */

import { AuditInventory, FeatureMapping } from './staticInventory';
import { ScenarioResult } from './dynamicTester';

export interface AuditReport {
  executiveSummary: string;
  featureCoverage: FeatureCoverageMatrix[];
  linkGraph: LinkGraphEntry[];
  brokenLinks: string[];
  additions: ChangeLogEntry[];
  backlog: BacklogItem[];
  dynamicResults: ScenarioResult[];
}

export interface FeatureCoverageMatrix {
  feature: string;
  campaignManager: string;
  dmScreen: string;
  playerView: string;
  menuPaths: string;
  syncStatus: string;
  result: 'PASS' | 'FAIL' | 'PARTIAL' | 'MISSING';
}

export interface LinkGraphEntry {
  event: string;
  direction: string;
  publisher: string;
  subscriber: string;
  payload: string;
  observedLatency: number;
  result: 'PASS' | 'FAIL' | 'UNKNOWN';
}

export interface ChangeLogEntry {
  file: string;
  change: string;
  reason: string;
}

export interface BacklogItem {
  feature: string;
  priority: 'P0' | 'P1' | 'P2';
  reason: string;
  proposedUI: string;
  proposedEvents: string;
  complexity: 'S' | 'M' | 'L';
  dependencies: string[];
}

/**
 * Generate full markdown report
 */
export function generateMarkdownReport(
  inventory: AuditInventory,
  dynamicResults: ScenarioResult[],
  additions: ChangeLogEntry[],
  backlog: BacklogItem[]
): string {
  const totalScenarios = dynamicResults.length;
  const passedScenarios = dynamicResults.filter(r => r.result === 'PASS').length;
  const failedScenarios = dynamicResults.filter(r => r.result === 'FAIL').length;
  const skippedScenarios = dynamicResults.filter(r => r.result === 'SKIP').length;
  
  const avgLatency = dynamicResults
    .filter(r => r.result === 'PASS')
    .reduce((sum, r) => sum + r.latencyMs, 0) / (passedScenarios || 1);
  
  const maxLatency = dynamicResults.length > 0 ? Math.max(...dynamicResults.map(r => r.latencyMs)) : 0;
  const minLatency = dynamicResults.length > 0 ? Math.min(...dynamicResults.map(r => r.latencyMs)) : 0;
  
  const coveragePercent = (totalScenarios - skippedScenarios) > 0 
    ? ((passedScenarios / (totalScenarios - skippedScenarios)) * 100).toFixed(1) 
    : '0.0';

  let report = `# Quest Weaver 5e Feature Audit Report

**Generated:** ${new Date().toISOString()}  
**Audit Type:** Full System Audit (Static + Dynamic)  
**Test Environment:** Demo Mode (*The Reckoning*)  
**Average Sync Latency:** ${avgLatency.toFixed(0)}ms

---

## Executive Summary

### Coverage Metrics
- **Total Features Audited:** ${inventory.features.length}
- **Routes Mapped:** ${inventory.routes.length}
- **Realtime Events Tracked:** ${inventory.events.length}
- **Dynamic Scenarios Executed:** ${totalScenarios}

### Test Results
- **Pass Rate:** ${coveragePercent}% (${passedScenarios}/${totalScenarios - skippedScenarios})
- **Passed:** ${passedScenarios} ✅
- **Failed:** ${failedScenarios} ❌
- **Skipped:** ${skippedScenarios} ⏭️
- **Average Latency:** ${avgLatency.toFixed(0)}ms
- **Max Latency:** ${maxLatency}ms
- **Min Latency:** ${minLatency}ms

### Actions Taken
- **Additions Implemented:** ${additions.length}
- **Backlog Items:** ${backlog.length} (${backlog.filter(b => b.priority === 'P0').length} P0, ${backlog.filter(b => b.priority === 'P1').length} P1, ${backlog.filter(b => b.priority === 'P2').length} P2)

### Key Findings

${failedScenarios === 0 
  ? '✅ All dynamic DM↔Player sync tests passed successfully.'
  : `⚠️ ${failedScenarios} scenario(s) failed synchronization tests - DM actions may not propagate to Player View.`}

${inventory.unlinkedFeatures.length > 0
  ? `⚠️ ${inventory.unlinkedFeatures.length} feature(s) have no menu or route links: ${inventory.unlinkedFeatures.join(', ')}`
  : '✅ All features are properly linked and discoverable.'}

${additions.length > 0 ? `
🔧 ${additions.length} auto-fixes applied - Missing nav links and event subscriptions added.
` : ''}

${backlog.length > 0 ? `
📋 ${backlog.length} features flagged for backlog - See Backlog section for prioritized improvements.
` : ''}

---

## Feature Coverage Matrix

| Feature | Components | Hooks | Routes | Menu Paths | Sync Events | Status |
|---|---|---|---|---|---|---|
`;

  // Add feature matrix rows
  inventory.features.forEach(feature => {
    const hasComponents = feature.components.length > 0;
    const hasHooks = feature.hooks.length > 0;
    const hasRoutes = feature.routes.length > 0;
    const hasMenus = feature.menuPaths.length > 0;
    const hasEvents = feature.events.length > 0;
    const status = (hasComponents && hasRoutes && hasMenus) ? '✅ Full' : 
                   hasComponents ? '⚠️ Partial' : '❌ Missing';
    
    const componentsDisplay = feature.components.length > 0 
      ? feature.components.slice(0, 2).join(', ') + (feature.components.length > 2 ? '...' : '')
      : '-';
    const hooksDisplay = feature.hooks.length > 0 ? feature.hooks.join(', ') : '-';
    const menusDisplay = feature.menuPaths.length > 0 
      ? feature.menuPaths.slice(0, 2).join('; ') + (feature.menuPaths.length > 2 ? '...' : '')
      : '-';
    
    report += `| **${feature.name}** | ${componentsDisplay} | ${hooksDisplay} | ${feature.routes.length} | ${menusDisplay} | ${hasEvents ? feature.events.length : '-'} | ${status} |\n`;
  });

  report += `\n---

## Dynamic Test Results (DM↔Player Sync)

### Summary Table

| # | Scenario | Event | Latency | Result | Details |
|---|---|---|---:|---|---|
`;

  dynamicResults.forEach((result, idx) => {
    const icon = result.result === 'PASS' ? '✅' : result.result === 'SKIP' ? '⏭️' : '❌';
    const details = result.details || result.observed;
    report += `| ${idx + 1} | **${result.scenarioId}** | \`${result.event}\` | ${result.latencyMs}ms | ${icon} ${result.result} | ${details} |\n`;
  });

  report += `\n### Detailed Breakdown\n`;

  dynamicResults.forEach(result => {
    const icon = result.result === 'PASS' ? '✅' : result.result === 'FAIL' ? '❌' : '⏭️';
    report += `
#### ${icon} ${result.scenarioId}

- **Event:** \`${result.event}\`
- **Expected:** ${result.expected}
- **Observed:** ${result.observed}
- **Latency:** ${result.latencyMs}ms
- **Result:** ${result.result}
- **Details:** ${result.details}

`;
  });

  report += `
---

## Link Graph

### Event Flow Table

| Event | Direction | Publisher | Subscriber | Payload | Observed Latency | Result |
|-------|-----------|-----------|------------|---------|------------------|--------|
`;

  inventory.events.forEach(event => {
    event.publishers.forEach(pub => {
      event.subscribers.forEach(sub => {
        const relevantResult = dynamicResults.find(r => r.event.includes(event.name));
        const latency = relevantResult?.latencyMs || 0;
        const result = relevantResult?.result || 'UNKNOWN';
        
        report += `| \`${event.name}\` | DM→Player | ${pub} | ${sub} | \`{table:${event.table || event.channel}}\` | ${latency}ms | ${result} |\n`;
      });
    });
  });

  if (additions.length > 0) {
    report += `
---

## Additions Implemented (Change Log)

The following low-risk fixes were automatically applied:

`;

    additions.forEach(add => {
      report += `
### ${add.file}

**Change:** ${add.change}  
**Reason:** ${add.reason}

`;
    });
  }

  if (backlog.length > 0) {
    report += `
---

## Missing/Backlog (Prioritized)

`;

    ['P0', 'P1', 'P2'].forEach(priority => {
      const items = backlog.filter(item => item.priority === priority);
      if (items.length === 0) return;

      report += `
### ${priority} - ${priority === 'P0' ? 'Critical' : priority === 'P1' ? 'High' : 'Medium'} Priority

`;

      items.forEach(item => {
        report += `
#### ${item.feature}

- **Why it matters:** ${item.reason}
- **Proposed UI location:** ${item.proposedUI}
- **Proposed events:** ${item.proposedEvents}
- **Complexity:** ${item.complexity} (${item.complexity === 'S' ? 'Small' : item.complexity === 'M' ? 'Medium' : 'Large'})
- **Dependencies:** ${item.dependencies.length > 0 ? item.dependencies.join(', ') : 'None'}

`;
      });
    });
  }

  report += `
---

## Route Inventory

### All Application Routes

| Route | Component | Access | Menu Label | Status |
|-------|-----------|--------|------------|--------|
`;

  inventory.routes.forEach(route => {
    report += `| \`${route.path}\` | ${route.component} | ${route.access} | ${route.menuLabel || 'N/A'} | ✓ Active |\n`;
  });

  report += `
---

## Recommendations

1. **Fix Critical Sync Issues:** Address ${failedScenarios} failed DM↔Player scenarios
2. **Improve Discoverability:** Add nav links for orphaned features
3. **Enhance Player View:** Ensure all DM actions trigger player updates within <500ms
4. **Add Missing Features:** Implement P0 backlog items (concentration break prompts, exhaustion UI)
5. **Documentation:** Update DM guide with feature locations and menu paths

---

**End of Report**
`;

  return report;
}

/**
 * Generate CSV route inventory
 */
export function generateRouteCSV(inventory: AuditInventory): string {
  let csv = 'Route,Component,Access,Menu Label,Visibility\n';
  
  inventory.routes.forEach(route => {
    csv += `"${route.path}","${route.component}","${route.access}","${route.menuLabel || 'N/A'}","Active"\n`;
  });
  
  return csv;
}

/**
 * Generate JSON feature map
 */
export function generateFeatureJSON(inventory: AuditInventory): string {
  return JSON.stringify(inventory, null, 2);
}
