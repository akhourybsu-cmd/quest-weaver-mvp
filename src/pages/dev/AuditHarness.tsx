/**
 * Audit Harness - UI for running and viewing audit results
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle,
  FileText,
  Database,
  Network
} from "lucide-react";
import { buildFeatureInventory } from "@/lib/audit/staticInventory";
import { runDynamicTests, TestContext, ScenarioResult } from "@/lib/audit/dynamicTester";
import { 
  generateMarkdownReport, 
  generateRouteCSV, 
  generateFeatureJSON,
  BacklogItem,
  ChangeLogEntry
} from "@/lib/audit/reportGenerator";
import { createDemo } from "@/lib/demoHelpers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function AuditHarness() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [report, setReport] = useState<string>("");
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const runAudit = async () => {
    setRunning(true);
    setProgress(0);
    setResults([]);

    try {
      // Step 1: Static inventory (10%)
      setProgress(10);
      toast({ title: "Building static inventory..." });
      const inventory = buildFeatureInventory();

      // Step 2: Create demo environment (20%)
      setProgress(20);
      toast({ title: "Creating demo environment..." });
      const { demoId } = createDemo();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Create a campaign with proper UUID
      const campaignCode = `AUDIT_${Date.now()}`;
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: 'Audit Test Campaign',
          code: campaignCode,
          dm_user_id: user.id,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      // Step 3: Set up test context (30%)
      setProgress(30);
      toast({ title: "Setting up test context..." });
      
      // Create a test encounter
      const { data: encounter, error: encounterError } = await supabase
        .from('encounters')
        .insert({
          campaign_id: campaign.id,
          name: 'Audit Test Encounter',
          status: 'active',
          current_round: 1,
        })
        .select()
        .single();

      if (encounterError) throw encounterError;

      // Create test character
      const { data: character, error: charError } = await supabase
        .from('characters')
        .insert({
          campaign_id: campaign.id,
          user_id: user.id,
          name: 'Test Character',
          class: 'Fighter',
          level: 5,
          max_hp: 42,
          current_hp: 42,
          temp_hp: 0,
          ac: 16,
          proficiency_bonus: 3,
          initiative_bonus: 2,
          passive_perception: 12,
          speed: 30,
          str_save: 5,
          dex_save: 2,
          con_save: 5,
          int_save: 0,
          wis_save: 1,
          cha_save: 0,
        })
        .select()
        .single();

      if (charError) throw charError;

      const context: TestContext = {
        demoId,
        campaignId: campaign.id,
        encounterId: encounter.id,
        characterId: character.id,
        dmUserId: user.id,
        playerUserId: user.id,
      };

      // Step 4: Run dynamic tests (40-90%)
      setProgress(40);
      toast({ title: "Running dynamic tests..." });
      const testResults = await runDynamicTests(context);
      setResults(testResults);
      
      setProgress(90);

      // Step 5: Auto-fixes (optional)
      const additions: ChangeLogEntry[] = [];
      const backlog: BacklogItem[] = [
        {
          feature: 'Concentration Break Auto-Prompt',
          priority: 'P0',
          reason: 'Players need immediate notification when taking damage while concentrating',
          proposedUI: 'Toast notification in Player View with concentration save prompt',
          proposedEvents: 'concentration_check_required event',
          complexity: 'M',
          dependencies: ['Concentration tracking'],
        },
        {
          feature: 'Exhaustion Ladder Visual',
          priority: 'P1',
          reason: 'Players need to see exhaustion level effects at a glance',
          proposedUI: 'Badge in Player Character Sheet with hover tooltip',
          proposedEvents: 'character.exhaustion_level update',
          complexity: 'S',
          dependencies: ['Conditions system'],
        },
      ];

      // Step 6: Generate reports (100%)
      setProgress(95);
      toast({ title: "Generating reports..." });
      const markdownReport = generateMarkdownReport(inventory, testResults, additions, backlog);
      setReport(markdownReport);

      // Generate downloadable artifacts
      const routeCSV = generateRouteCSV(inventory);
      const featureJSON = generateFeatureJSON(inventory);

      // Save to downloads (trigger browser downloads)
      downloadFile('quest-weaver-5e-audit.md', markdownReport);
      downloadFile('route-inventory.csv', routeCSV);
      downloadFile('feature-map.json', featureJSON);

      setProgress(100);
      toast({ 
        title: "Audit Complete!", 
        description: `${testResults.length} scenarios executed. Reports downloaded.`
      });

      // Cleanup test data
      localStorage.removeItem(`demo_${demoId}`);
      await supabase.from('campaigns').delete().eq('id', campaign.id);

    } catch (error: any) {
      console.error('[AUDIT] Error:', error);
      toast({
        title: "Audit Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const passedCount = results.filter(r => r.result === 'PASS').length;
  const failedCount = results.filter(r => r.result === 'FAIL').length;
  const skippedCount = results.filter(r => r.result === 'SKIP').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Database className="w-6 h-6" />
                  Quest Weaver 5e Feature Audit
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-2">
                  Comprehensive audit of DM↔Player sync, feature coverage, and 5e compliance
                </p>
              </div>
              <Button 
                onClick={runAudit} 
                disabled={running}
                size="lg"
              >
                <Play className="w-4 h-4 mr-2" />
                {running ? 'Running...' : 'Run Full Audit'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Progress */}
        {running && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Scenarios</p>
                    <p className="text-3xl font-bold">{results.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Passed</p>
                    <p className="text-3xl font-bold text-green-500">{passedCount}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Failed</p>
                    <p className="text-3xl font-bold text-red-500">{failedCount}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Skipped</p>
                    <p className="text-3xl font-bold text-yellow-500">{skippedCount}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Results */}
        {results.length > 0 && (
          <Tabs defaultValue="scenarios">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="scenarios">
                <Network className="w-4 h-4 mr-2" />
                Scenarios
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="w-4 h-4 mr-2" />
                Report
              </TabsTrigger>
              <TabsTrigger value="downloads">
                <Download className="w-4 h-4 mr-2" />
                Downloads
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scenarios" className="space-y-4">
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {results.map((result, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.result === 'PASS' && <CheckCircle className="w-5 h-5 text-green-500" />}
                            {result.result === 'FAIL' && <XCircle className="w-5 h-5 text-red-500" />}
                            {result.result === 'SKIP' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                            <CardTitle className="text-lg">{result.scenarioId}</CardTitle>
                          </div>
                          <Badge variant={
                            result.result === 'PASS' ? 'default' : 
                            result.result === 'FAIL' ? 'destructive' : 
                            'secondary'
                          }>
                            {result.result}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Event:</span>
                            <code className="ml-2 text-xs bg-muted px-1 py-0.5 rounded">{result.event}</code>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Latency:</span>
                            <span className="ml-2 font-mono">{result.latencyMs}ms</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Expected:</span>
                          <p className="text-sm mt-1">{result.expected}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-sm">Observed:</span>
                          <p className="text-sm mt-1">{result.observed}</p>
                        </div>
                        {result.details && (
                          <Alert>
                            <AlertDescription className="text-sm">
                              {result.details}
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="report">
              <Card>
                <CardContent className="pt-6">
                  <ScrollArea className="h-[600px]">
                    <pre className="text-xs whitespace-pre-wrap font-mono">
                      {report}
                    </pre>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="downloads">
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <Alert>
                    <AlertDescription>
                      Reports have been automatically downloaded. Check your Downloads folder.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Full Audit Report</p>
                        <p className="text-sm text-muted-foreground">quest-weaver-5e-audit.md</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadFile('quest-weaver-5e-audit.md', report)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Route Inventory</p>
                        <p className="text-sm text-muted-foreground">route-inventory.csv</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Re-download
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Feature Map</p>
                        <p className="text-sm text-muted-foreground">feature-map.json</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Re-download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
