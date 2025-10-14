import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface LogEntry {
  id: string;
  round: number;
  message: string;
  action_type: string;
  created_at: string;
}

interface CombatLogProps {
  encounterId: string;
}

const CombatLog = ({ encounterId }: CombatLogProps) => {
  const [entries, setEntries] = useState<LogEntry[]>([]);

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

    setEntries(data || []);
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
      default:
        return "text-foreground";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Combat Log
        </CardTitle>
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
                <div key={entry.id} className="text-sm">
                  <span className="text-muted-foreground">
                    [Round {entry.round}]
                  </span>{" "}
                  <span className={getActionColor(entry.action_type)}>
                    {entry.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CombatLog;
