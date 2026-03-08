import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Save, Wand2, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildCampaignContext } from "@/lib/campaignContextBuilder";
import { useNavigate } from "react-router-dom";

interface LoreGap {
  entity_type: string;
  entity_name: string;
  gap_type: string;
  severity: string;
  description: string;
  suggestion: string;
}

interface LoreGapReport {
  gaps: LoreGap[];
  summary: string;
  priority_fixes: string[];
}

const SEVERITY_CONFIG: Record<string, { color: string; icon: typeof AlertTriangle }> = {
  critical: { color: 'text-destructive border-destructive/40', icon: AlertTriangle },
  moderate: { color: 'text-status-warning border-status-warning/40', icon: Info },
  minor: { color: 'text-muted-foreground border-muted-foreground/40', icon: CheckCircle },
};

const ENTITY_TYPE_TO_TOOL: Record<string, string> = {
  npc: 'npc-generator',
  location: 'settlement-generator',
  faction: 'faction-generator',
  quest: 'quest-generator',
  item: 'magic-item-generator',
};

export function MissingLoreDetector() {
  const { userId } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<LoreGapReport | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("dm_user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setCampaigns(data);
      });
  }, [userId]);

  const handleScan = async () => {
    if (!selectedCampaignId) {
      toast({ title: "Select a campaign first", variant: "destructive" });
      return;
    }

    setIsScanning(true);
    setReport(null);

    try {
      const campaignContext = await buildCampaignContext(selectedCampaignId, 'npc');

      const { data, error } = await supabase.functions.invoke('generate-asset', {
        body: {
          asset_type: 'lore_gap',
          user_prompt: 'Analyze the campaign for missing lore, incomplete assets, and underdeveloped connections. Be thorough.',
          existing_fields: {},
          locked_fields: [],
          campaign_context: campaignContext,
          standalone: false,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const filled = data.filled_fields || data;
      setReport({
        gaps: filled.gaps || [],
        summary: filled.summary || 'Analysis complete.',
        priority_fixes: filled.priority_fixes || [],
      });
    } catch (err) {
      toast({
        title: "Scan failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveReport = async () => {
    if (!userId || !report) return;
    setIsSaving(true);
    try {
      const campaignName = campaigns.find(c => c.id === selectedCampaignId)?.name || 'Unknown';
      const { error } = await supabase.from('beta_assets').insert({
        user_id: userId,
        asset_type: 'lore_gap',
        name: `Lore Gap Report – ${campaignName}`,
        data: report as any,
        status: 'draft',
      });
      if (error) throw error;
      toast({ title: "Report saved to Beta Library" });
    } catch (err) {
      toast({ title: "Save failed", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFixWithAI = (gap: LoreGap) => {
    const toolId = ENTITY_TYPE_TO_TOOL[gap.entity_type];
    if (toolId) {
      navigate(`/beta-tools/generate/${toolId}`);
    } else {
      toast({ title: "No matching generator for this type yet" });
    }
  };

  const groupedGaps = report?.gaps.reduce((acc, gap) => {
    const key = gap.entity_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(gap);
    return acc;
  }, {} as Record<string, LoreGap[]>);

  return (
    <div className="space-y-6">
      {/* Campaign selector */}
      <div className="space-y-3">
        <Label className="text-foreground font-cinzel">Select a Campaign to Scan</Label>
        {campaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns found. Create a campaign first.</p>
        ) : (
          <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a campaign..." />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Scan button */}
      <Button
        onClick={handleScan}
        disabled={isScanning || !selectedCampaignId}
        className="w-full"
        size="lg"
      >
        {isScanning ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Scanning Campaign...
          </>
        ) : (
          <>
            <Search className="h-5 w-5 mr-2" />
            Scan for Lore Gaps
          </>
        )}
      </Button>

      {/* Report */}
      {report && (
        <div className="space-y-5">
          {/* Summary */}
          <Card className="border-border bg-card p-5">
            <h3 className="font-cinzel font-bold text-lg text-foreground mb-2">Campaign Analysis</h3>
            <p className="text-sm text-foreground">{report.summary}</p>

            {report.priority_fixes.length > 0 && (
              <div className="mt-4">
                <Label className="text-xs text-muted-foreground">Priority Fixes</Label>
                <ol className="text-sm text-foreground mt-1 space-y-1 list-decimal list-inside">
                  {report.priority_fixes.map((fix, i) => (
                    <li key={i}>{fix}</li>
                  ))}
                </ol>
              </div>
            )}
          </Card>

          {/* Gaps grouped by entity type */}
          {groupedGaps && Object.entries(groupedGaps).map(([entityType, gaps]) => (
            <div key={entityType} className="space-y-2">
              <h4 className="text-sm font-cinzel font-semibold text-foreground capitalize">
                {entityType.replace(/_/g, ' ')} ({gaps.length})
              </h4>
              <div className="space-y-2">
                {gaps.map((gap, i) => {
                  const sev = SEVERITY_CONFIG[gap.severity] || SEVERITY_CONFIG.minor;
                  const SevIcon = sev.icon;
                  return (
                    <Card key={i} className="border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <SevIcon className={`h-3.5 w-3.5 ${sev.color.split(' ')[0]}`} />
                            <span className="font-medium text-sm text-foreground">{gap.entity_name}</span>
                            <Badge variant="outline" className={`text-[10px] ${sev.color}`}>
                              {gap.severity}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
                              {gap.gap_type.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{gap.description}</p>
                          <p className="text-xs text-secondary italic">💡 {gap.suggestion}</p>
                        </div>
                        {ENTITY_TYPE_TO_TOOL[gap.entity_type] && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0 text-xs"
                            onClick={() => handleFixWithAI(gap)}
                          >
                            <Wand2 className="h-3 w-3 mr-1" />
                            Fix
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Save report */}
          <Button
            onClick={handleSaveReport}
            disabled={isSaving}
            variant="secondary"
            className="w-full font-semibold"
          >
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Report to Beta Library
          </Button>
        </div>
      )}
    </div>
  );
}
