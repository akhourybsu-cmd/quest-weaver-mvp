import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

interface LogEntry {
  id: string;
  round: number;
  message: string;
  actionType: string;
  createdAt: string;
}

interface CombatLogProps {
  entries: LogEntry[];
}

const CombatLog = ({ entries }: CombatLogProps) => {
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
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Combat Log
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px] pr-4">
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
                  <span className={getActionColor(entry.actionType)}>
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
