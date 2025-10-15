import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, Download, Undo2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  round: number;
  message: string;
  action_type: string;
  created_at: string;
  details?: Record<string, any>;
  character_id?: string;
  amount?: number;
}

interface CombatLogProps {
  encounterId: string;
}

const CombatLog = ({ encounterId }: CombatLogProps) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchLog();

    const channel = supabase
      .channel('combat-log-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'combat_log',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => fetchLog()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [encounterId]);

  const fetchLog = async () => {
    const { data, error } = await supabase
      .from("combat_log")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching combat log:", error);
      return;
    }

    setEntries((data || []) as LogEntry[]);
  };
  const toggleExpanded = (id: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleUndo = async () => {
    const lastEntry = entries[0];
    if (!lastEntry) return;

    try {
      const { error } = await supabase.functions.invoke('undo-action', {
        body: { 
          encounterId,
          logEntryId: lastEntry.id,
        }
      });

      if (error) throw error;

      toast({
        title: "Action Undone",
        description: "The last combat action has been reversed.",
      });
    } catch (error) {
      console.error('Error undoing action:', error);
      toast({
        title: "Undo Failed",
        description: error instanceof Error ? error.message : "Could not undo action",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'markdown' | 'json') => {
    try {
      const { data: allEntries } = await supabase
        .from("combat_log")
        .select("*")
        .eq("encounter_id", encounterId)
        .order("created_at", { ascending: true });

      if (!allEntries) return;

      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(allEntries, null, 2);
        filename = `combat-log-${encounterId}.json`;
        mimeType = 'application/json';
      } else {
        content = `# Combat Log\n\n`;
        let currentRound = 0;
        
        allEntries.forEach(entry => {
          if (entry.round > currentRound) {
            currentRound = entry.round;
            content += `\n## Round ${currentRound}\n\n`;
          }
          content += `- **[${entry.action_type}]** ${entry.message}\n`;
          if (entry.details) {
            content += `  - Details: ${JSON.stringify(entry.details, null, 2)}\n`;
          }
        });
        
        filename = `combat-log-${encounterId}.md`;
        mimeType = 'text/markdown';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export Successful",
        description: `Combat log exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Error exporting log:', error);
      toast({
        title: "Export Failed",
        description: "Could not export combat log",
        variant: "destructive",
      });
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "damage":
        return "text-status-hp";
      case "healing":
        return "text-status-buff";
      case "save":
        return "text-secondary";
      case "effect_applied":
        return "text-primary";
      case "effect_expired":
        return "text-muted-foreground";
      case "round_start":
        return "text-primary font-semibold";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Combat Log
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={entries.length === 0}
              title="Undo last action"
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('markdown')}
              title="Export as Markdown"
            >
              <Download className="w-4 h-4 mr-1" />
              MD
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('json')}
              title="Export as JSON"
            >
              <Download className="w-4 h-4 mr-1" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-2">
            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-8">
                No combat actions yet
              </div>
            ) : (
              entries.map((entry) => (
                <Collapsible
                  key={entry.id}
                  open={expandedEntries.has(entry.id)}
                  onOpenChange={() => entry.details && toggleExpanded(entry.id)}
                >
                  <div className="text-sm border-b border-border/50 pb-2 mb-2 last:border-0">
                    <div className="flex items-start gap-2">
                      {entry.details && (
                        <CollapsibleTrigger asChild>
                          <button className="mt-0.5 hover:text-primary transition-colors">
                            {expandedEntries.has(entry.id) ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        </CollapsibleTrigger>
                      )}
                      <div className="flex-1">
                        <span className="text-muted-foreground">
                          [Round {entry.round}]
                        </span>{" "}
                        <span className={getActionColor(entry.action_type)}>
                          {entry.message}
                        </span>
                      </div>
                    </div>
                    
                    {entry.details && (
                      <CollapsibleContent className="mt-2 ml-5">
                        <div className="bg-muted/50 rounded p-2 text-xs font-mono">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(entry.details, null, 2)}
                          </pre>
                        </div>
                      </CollapsibleContent>
                    )}
                  </div>
                </Collapsible>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CombatLog;
