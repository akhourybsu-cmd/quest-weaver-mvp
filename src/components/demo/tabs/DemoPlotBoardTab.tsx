import { DemoCampaign } from "@/data/demoSeeds";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Link2, Network } from "lucide-react";

interface DemoPlotBoardTabProps {
  campaign: DemoCampaign;
}

export function DemoPlotBoardTab({ campaign }: DemoPlotBoardTabProps) {
  const plotNodes = [
    { id: 1, label: "Shadowgate Conspiracy", type: "quest", revealed: true, connections: [2, 3, 5] },
    { id: 2, label: "Cassandra's True Identity", type: "secret", revealed: false, connections: [1, 4] },
    { id: 3, label: "Stolen Grimoire", type: "quest", revealed: true, connections: [1, 4] },
    { id: 4, label: "Shadow Cult Hideout", type: "location", revealed: true, connections: [2, 3] },
    { id: 5, label: "Queen's Lost Twin", type: "secret", revealed: false, connections: [1] },
    { id: 6, label: "Dragon's Tribute (Resolved)", type: "quest", revealed: true, connections: [] },
  ];

  const typeColors: Record<string, string> = {
    quest: "border-arcanePurple/50 text-arcanePurple",
    secret: "border-dragonRed/50 text-dragonRed",
    location: "border-brass/50 text-brass",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-cinzel font-bold flex items-center gap-2">
          <Network className="w-5 h-5 text-arcanePurple" />
          Plot Board
        </h2>
        <Badge variant="outline" className="border-brass/30 text-brass">
          {plotNodes.length} Nodes
        </Badge>
      </div>

      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Clue Web — Track secrets, reveals, and plot connections
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {plotNodes.map((node) => (
              <div
                key={node.id}
                className={`rounded-lg border p-3 ${typeColors[node.type] || "border-brass/20"} bg-card/30`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-sm text-ink">{node.label}</span>
                  {node.revealed ? (
                    <Eye className="w-4 h-4 text-green-400 shrink-0" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs capitalize">
                    {node.type}
                  </Badge>
                  {node.connections.length > 0 && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Link2 className="w-3 h-3" />
                      {node.connections.length}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
