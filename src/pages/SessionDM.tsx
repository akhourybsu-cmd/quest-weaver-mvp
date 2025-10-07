import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Shield, Zap, Eye, Plus } from "lucide-react";

interface PartyMember {
  id: string;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  ac: number;
  passivePerception: number;
  conditions: string[];
}

const SessionDM = () => {
  const [searchParams] = useSearchParams();
  const campaignCode = searchParams.get("campaign");

  const [partyMembers] = useState<PartyMember[]>([
    {
      id: "1",
      name: "Theron Brightblade",
      class: "Paladin",
      level: 5,
      hp: 42,
      maxHp: 45,
      ac: 18,
      passivePerception: 12,
      conditions: [],
    },
    {
      id: "2",
      name: "Lyra Shadowstep",
      class: "Rogue",
      level: 5,
      hp: 28,
      maxHp: 32,
      ac: 15,
      passivePerception: 18,
      conditions: ["Hidden"],
    },
    {
      id: "3",
      name: "Eldric Flameheart",
      class: "Wizard",
      level: 5,
      hp: 25,
      maxHp: 26,
      ac: 12,
      passivePerception: 14,
      conditions: ["Concentrating"],
    },
  ]);

  const getHPColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage > 50) return "bg-status-buff";
    if (percentage > 25) return "bg-status-warning";
    return "bg-status-hp";
  };

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">DM Screen</h1>
              <p className="text-sm text-muted-foreground">
                Campaign: {campaignCode || "Demo"}
              </p>
            </div>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Quick Action
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="shadow-md">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">{partyMembers.length}</div>
                <div className="text-sm text-muted-foreground">Active Players</div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-4 pb-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary">12</div>
                <div className="text-sm text-muted-foreground">Session #</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Party Overview */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Party Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partyMembers.map((member) => (
              <div
                key={member.id}
                className="bg-muted/50 rounded-lg p-4 space-y-3 transition-all hover:shadow-md"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Level {member.level} {member.class}
                    </p>
                  </div>
                  {member.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.conditions.map((condition) => (
                        <Badge
                          key={condition}
                          variant="outline"
                          className="text-xs bg-status-debuff/10 border-status-debuff text-status-debuff"
                        >
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* HP Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Heart className="w-4 h-4" />
                      <span>HP</span>
                    </div>
                    <span className="font-semibold tabular-nums">
                      {member.hp} / {member.maxHp}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getHPColor(
                        member.hp,
                        member.maxHp
                      )}`}
                      style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>AC {member.ac}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Eye className="w-4 h-4" />
                    <span>Passive {member.passivePerception}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Speed 30 ft</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Swords className="w-6 h-6" />
              <span>Start Combat</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <ScrollText className="w-6 h-6" />
              <span>Add Note</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <FileText className="w-6 h-6" />
              <span>Reveal Handout</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col gap-2">
              <Clock className="w-6 h-6" />
              <span>Rest Party</span>
            </Button>
          </CardContent>
        </Card>
      </div>

      <BottomNav role="dm" />
    </div>
  );
};

const Swords = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    strokeWidth="2"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l6-6M19 13l-1.5 1.5" />
  </svg>
);

const ScrollText = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    strokeWidth="2"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3m11-11V5a2 2 0 0 0-2-2h-3M8 21h8M8 7h8M8 11h8M8 15h8" />
  </svg>
);

const FileText = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    strokeWidth="2"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6M16 13H8M16 17H8M10 9H8" />
  </svg>
);

const Clock = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    strokeWidth="2"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default SessionDM;
