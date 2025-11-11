import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Plus, Sword, Scroll, Users, Crown } from "lucide-react";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: "combat" | "quest" | "social" | "political";
  era?: string;
  session?: number;
}

const mockEvents: TimelineEvent[] = [
  {
    id: "1",
    date: new Date(2025, 10, 8),
    title: "The Vault Unsealed",
    description: "Party discovered the ancient artifact within the Vault of Secrets",
    type: "quest",
    session: 12,
  },
  {
    id: "2",
    date: new Date(2025, 9, 24),
    title: "Battle at Crimson Peak",
    description: "Epic confrontation with Drakaris the Red Dragon",
    type: "combat",
    session: 11,
  },
  {
    id: "3",
    date: new Date(2025, 9, 10),
    title: "Alliance with the Thieves Guild",
    description: "Party negotiated safe passage through the Shadow Quarter",
    type: "social",
    session: 10,
  },
];

const typeIcons = {
  combat: Sword,
  quest: Scroll,
  social: Users,
  political: Crown,
};

const typeColors = {
  combat: "text-dragonRed",
  quest: "text-arcanePurple",
  social: "text-brass",
  political: "text-ink",
};

export function TimelineTab() {
  const [events] = useState<TimelineEvent[]>(mockEvents);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel">Campaign Timeline</CardTitle>
              <CardDescription>Chronicle your adventures</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      <ScrollArea className="h-[calc(100vh-300px)]">
        <div className="relative pb-4">
          {/* Timeline line */}
          <div className="absolute left-8 top-0 bottom-0 w-px bg-brass/30" />

          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = typeIcons[event.type];
              return (
                <div key={event.id} className="relative pl-16">
                  {/* Timeline node */}
                  <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-obsidian border-2 border-brass flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-arcanePurple" />
                  </div>

                  <Card className="bg-card/50 border-brass/20">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${typeColors[event.type]}`} />
                          <CardTitle className="text-base font-cinzel">{event.title}</CardTitle>
                        </div>
                        {event.session && (
                          <Badge variant="outline" className="border-brass/30 shrink-0">
                            Session {event.session}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-brass">
                        <Calendar className="w-3 h-3" />
                        <span>{format(event.date, "MMMM d, yyyy")}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      {events.length === 0 && (
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Calendar className="w-12 h-12 mx-auto text-brass/50" />
              <p className="text-sm text-muted-foreground">
                No events recorded yet. Start chronicling your campaign's history.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
