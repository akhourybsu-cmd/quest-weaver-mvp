import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scroll, Users, MapPin, Trophy, Eye, EyeOff, Plus } from "lucide-react";

interface Quest {
  id: string;
  title: string;
  arc: string;
  status: "hook" | "active" | "complete" | "failed";
  objectives: { id: string; text: string; complete: boolean }[];
  npcs: string[];
  locations: string[];
  rewards: { xp: number; gp: number; items: string[] };
  visibility: "dm" | "shared";
}

const mockQuests: Quest[] = [
  {
    id: "1",
    title: "The Missing Tome",
    arc: "Act II: Shadows Rising",
    status: "active",
    objectives: [
      { id: "o1", text: "Investigate the library", complete: true },
      { id: "o2", text: "Find the stolen tome", complete: false },
      { id: "o3", text: "Return to the guild", complete: false },
    ],
    npcs: ["Elara the Sage", "Marcus the Guard"],
    locations: ["Grand Library", "Thieves' Quarter"],
    rewards: { xp: 1000, gp: 250, items: ["Ring of Protection"] },
    visibility: "shared",
  },
  {
    id: "2",
    title: "Shadows in the Night",
    arc: "Act II: Shadows Rising",
    status: "active",
    objectives: [
      { id: "o4", text: "Track the shadow cult", complete: false },
      { id: "o5", text: "Infiltrate their hideout", complete: false },
    ],
    npcs: ["The Shadow", "Captain Reeves"],
    locations: ["Old Warehouse District"],
    rewards: { xp: 1500, gp: 500, items: [] },
    visibility: "dm",
  },
  {
    id: "3",
    title: "The Dragon's Hoard",
    arc: "Act I: The Awakening",
    status: "complete",
    objectives: [
      { id: "o6", text: "Locate the dragon's lair", complete: true },
      { id: "o7", text: "Defeat the dragon", complete: true },
      { id: "o8", text: "Claim the treasure", complete: true },
    ],
    npcs: ["Drakaris the Red"],
    locations: ["Crimson Peak"],
    rewards: { xp: 5000, gp: 10000, items: ["Dragon Scale Armor", "Flaming Sword"] },
    visibility: "shared",
  },
];

interface QuestsTabProps {
  onQuestSelect: (quest: Quest) => void;
}

export function QuestsTab({ onQuestSelect }: QuestsTabProps) {
  const [view, setView] = useState<"board" | "list">("board");
  const [quests] = useState<Quest[]>(mockQuests);

  const questsByStatus = {
    hook: quests.filter((q) => q.status === "hook"),
    active: quests.filter((q) => q.status === "active"),
    complete: quests.filter((q) => q.status === "complete"),
    failed: quests.filter((q) => q.status === "failed"),
  };

  const QuestCard = ({ quest }: { quest: Quest }) => {
    const completedObjectives = quest.objectives.filter((o) => o.complete).length;
    const progress = (completedObjectives / quest.objectives.length) * 100;

    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20"
        onClick={() => onQuestSelect(quest)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-cinzel">{quest.title}</CardTitle>
            {quest.visibility === "dm" ? (
              <EyeOff className="w-4 h-4 text-brass shrink-0" />
            ) : (
              <Eye className="w-4 h-4 text-arcanePurple shrink-0" />
            )}
          </div>
          <CardDescription className="text-xs">{quest.arc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span>Progress</span>
              <span>{completedObjectives}/{quest.objectives.length}</span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-arcanePurple transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {quest.npcs.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Users className="w-3 h-3 text-brass" />
              <span className="text-muted-foreground">{quest.npcs.length} NPCs</span>
            </div>
          )}

          {quest.locations.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <MapPin className="w-3 h-3 text-brass" />
              <span className="text-muted-foreground">{quest.locations.length} Locations</span>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {quest.rewards.xp > 0 && (
              <Badge variant="outline" className="text-xs border-brass/30">
                {quest.rewards.xp} XP
              </Badge>
            )}
            {quest.rewards.gp > 0 && (
              <Badge variant="outline" className="text-xs border-brass/30">
                {quest.rewards.gp} GP
              </Badge>
            )}
            {quest.rewards.items.length > 0 && (
              <Badge variant="outline" className="text-xs border-brass/30">
                <Trophy className="w-3 h-3 mr-1" />
                {quest.rewards.items.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Tabs value={view} onValueChange={(v) => setView(v as "board" | "list")}>
          <TabsList>
            <TabsTrigger value="board">Board View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Quest
        </Button>
      </div>

      {view === "board" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-brass">Hook</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.hook.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.hook.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-arcanePurple">Active</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.active.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.active.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-green-500">Complete</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.complete.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.complete.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-cinzel font-semibold text-dragonRed">Failed</h3>
              <p className="text-xs text-muted-foreground">{questsByStatus.failed.length} quests</p>
            </div>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {questsByStatus.failed.map((quest) => (
                  <QuestCard key={quest.id} quest={quest} />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {quests.map((quest) => (
            <Card
              key={quest.id}
              className="cursor-pointer hover:bg-accent/5 transition-colors border-brass/20"
              onClick={() => onQuestSelect(quest)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Scroll className="w-5 h-5 text-arcanePurple" />
                    <div>
                      <h4 className="font-medium font-cinzel">{quest.title}</h4>
                      <p className="text-sm text-muted-foreground">{quest.arc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        quest.status === "active"
                          ? "default"
                          : quest.status === "complete"
                          ? "outline"
                          : "secondary"
                      }
                    >
                      {quest.status}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {quest.objectives.filter((o) => o.complete).length}/{quest.objectives.length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
