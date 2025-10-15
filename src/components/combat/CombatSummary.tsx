import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Scroll, Download, TrendingUp, Skull, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CombatSummaryProps {
  encounterId: string;
  encounterName: string;
  totalRounds: number;
}

interface CombatLogEntry {
  id: string;
  round: number;
  action_type: string;
  message: string;
  amount: number | null;
  details: any;
  created_at: string;
}

export function CombatSummary({
  encounterId,
  encounterName,
  totalRounds,
}: CombatSummaryProps) {
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCombatLog();
    }
  }, [isOpen, encounterId]);

  const fetchCombatLog = async () => {
    const { data } = await supabase
      .from("combat_log")
      .select("*")
      .eq("encounter_id", encounterId)
      .order("created_at", { ascending: true });

    if (data) setCombatLog(data);
  };

  const calculateStats = () => {
    let totalDamage = 0;
    let totalHealing = 0;
    let knockdowns = 0;
    let deaths = 0;

    combatLog.forEach((entry) => {
      if (entry.action_type === "damage") {
        totalDamage += entry.amount || 0;
        if (entry.details?.new_hp === 0) {
          knockdowns++;
        }
      }
      if (entry.action_type === "healing") {
        totalHealing += entry.amount || 0;
      }
      if (entry.action_type === "death") {
        deaths++;
      }
    });

    return { totalDamage, totalHealing, knockdowns, deaths };
  };

  const downloadSummary = () => {
    const stats = calculateStats();
    const summary = `
Combat Summary: ${encounterName}
Total Rounds: ${totalRounds}
Total Damage: ${stats.totalDamage}
Total Healing: ${stats.totalHealing}
Knockdowns: ${stats.knockdowns}
Deaths: ${stats.deaths}

=== Combat Log ===
${combatLog.map(entry => `Round ${entry.round}: ${entry.message}`).join('\n')}
    `.trim();

    const blob = new Blob([summary], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combat-summary-${encounterName.replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const stats = calculateStats();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Scroll className="w-4 h-4 mr-2" />
          Combat Summary
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Combat Summary: {encounterName}</span>
            <Button onClick={downloadSummary} variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{totalRounds}</div>
                  <div className="text-xs text-muted-foreground">Rounds</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <Skull className="w-5 h-5 mx-auto mb-1 text-destructive" />
                  <div className="text-2xl font-bold">{stats.totalDamage}</div>
                  <div className="text-xs text-muted-foreground">Damage</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-status-buff" />
                  <div className="text-2xl font-bold">{stats.totalHealing}</div>
                  <div className="text-xs text-muted-foreground">Healing</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="text-center">
                  <Skull className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">{stats.knockdowns}</div>
                  <div className="text-xs text-muted-foreground">KO'd</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Combat Log */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Full Combat Log</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {combatLog.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No combat log entries yet
                    </p>
                  ) : (
                    combatLog.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-2 rounded bg-muted/50"
                      >
                        <Badge variant="outline" className="shrink-0">
                          R{entry.round}
                        </Badge>
                        <div className="flex-1 text-sm">
                          <p>{entry.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
