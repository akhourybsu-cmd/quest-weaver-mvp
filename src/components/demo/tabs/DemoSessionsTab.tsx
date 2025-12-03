import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoSessions } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Play, FileText } from "lucide-react";
import { format } from "date-fns";

interface DemoSessionsTabProps {
  campaign: DemoCampaign;
}

export function DemoSessionsTab({ campaign }: DemoSessionsTabProps) {
  const sessions = adaptDemoSessions(campaign);
  const upcomingSessions = sessions.filter(s => s.status === "scheduled");
  const pastSessions = sessions.filter(s => s.status === "ended");

  return (
    <div className="space-y-8">
      {/* Upcoming Sessions */}
      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Upcoming Sessions
        </h2>
        {upcomingSessions.length === 0 ? (
          <Card className="border-brass/20">
            <CardContent className="py-8 text-center text-muted-foreground">
              No upcoming sessions scheduled
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingSessions.map(session => (
              <Card key={session.id} className="border-brass/20 hover:border-brass/40 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-cinzel">{session.title}</CardTitle>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                      Upcoming
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{format(new Date(session.started_at), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{session.location}</span>
                  </div>
                  <Button variant="outline" className="w-full mt-2" disabled>
                    <Play className="w-4 h-4 mr-2" />
                    Start Session (Demo)
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Past Sessions */}
      <section>
        <h2 className="text-xl font-cinzel text-brass mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Past Sessions
        </h2>
        {pastSessions.length === 0 ? (
          <Card className="border-brass/20">
            <CardContent className="py-8 text-center text-muted-foreground">
              No past sessions recorded
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pastSessions.map(session => (
              <Card key={session.id} className="border-brass/20">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-cinzel font-semibold">{session.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(session.started_at), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {session.location}
                        </span>
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{session.notes}</p>
                      )}
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
