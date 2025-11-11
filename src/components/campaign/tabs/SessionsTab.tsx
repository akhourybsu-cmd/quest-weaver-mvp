import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, Clock, MapPin, Plus, Send, FileText, Users } from "lucide-react";
import { format } from "date-fns";

interface Session {
  id: string;
  title: string;
  date: Date;
  location: string;
  notes?: string;
  status: "upcoming" | "past";
}

const mockSessions: Session[] = [
  {
    id: "1",
    title: "Session 13: Into the Shadowfell",
    date: new Date(2025, 11, 15, 19, 0),
    location: "Online",
    status: "upcoming",
  },
  {
    id: "2",
    title: "Session 12: The Vault of Secrets",
    date: new Date(2025, 10, 8, 19, 0),
    location: "Online",
    notes: "Party discovered the ancient artifact",
    status: "past",
  },
];

export function SessionsTab() {
  const [sessions] = useState<Session[]>(mockSessions);
  const [packOpen, setPackOpen] = useState(false);

  const upcomingSessions = sessions.filter((s) => s.status === "upcoming");
  const pastSessions = sessions.filter((s) => s.status === "past");

  return (
    <div className="space-y-6">
      {/* Session Pack Builder */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel">Session Pack Builder</CardTitle>
              <CardDescription>Assemble content for tonight's session</CardDescription>
            </div>
            <Button onClick={() => setPackOpen(!packOpen)}>
              <Plus className="w-4 h-4 mr-2" />
              Build Pack
            </Button>
          </div>
        </CardHeader>
        {packOpen && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Selected Quests</h4>
                <div className="text-sm text-muted-foreground">No quests added yet</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Selected Encounters</h4>
                <div className="text-sm text-muted-foreground">No encounters added yet</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">NPC Briefs</h4>
                <div className="text-sm text-muted-foreground">No NPCs added yet</div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Handouts</h4>
                <div className="text-sm text-muted-foreground">No handouts added yet</div>
              </div>
            </div>
            <Separator className="my-4 bg-brass/20" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPackOpen(false)}>
                Cancel
              </Button>
              <Button>
                <Send className="w-4 h-4 mr-2" />
                Send to DM Screen
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Upcoming Sessions */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cinzel">Upcoming Sessions</CardTitle>
            <Button size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming sessions scheduled
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => (
                <Card key={session.id} className="bg-background/50 border-brass/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <h4 className="font-medium font-cinzel">{session.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-arcanePurple" />
                            {format(session.date, "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-arcanePurple" />
                            {format(session.date, "h:mm a")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-arcanePurple" />
                            {session.location}
                          </div>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session History */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <CardTitle className="font-cinzel">Session History</CardTitle>
          <CardDescription>Past sessions and notes</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <Card key={session.id} className="bg-background/50 border-brass/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h4 className="font-medium font-cinzel">{session.title}</h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-brass" />
                            {format(session.date, "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-brass" />
                            {session.location}
                          </div>
                        </div>
                        {session.notes && (
                          <div className="flex items-start gap-2 mt-2">
                            <FileText className="w-3 h-3 text-brass mt-0.5" />
                            <p className="text-sm text-muted-foreground">{session.notes}</p>
                          </div>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        View Log
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
