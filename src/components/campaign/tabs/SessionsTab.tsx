import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, MapPin, Plus, Send, FileText, Users } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";

interface SessionsTabProps {
  campaignId: string;
}

interface Session {
  id: string;
  started_at: string | null;
  ended_at: string | null;
  session_notes: string | null;
  dm_notes: string | null;
  status: string;
}

export function SessionsTab({ campaignId }: SessionsTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [packOpen, setPackOpen] = useState(false);

  useEffect(() => {
    fetchSessions();

    const channel = resilientChannel(supabase, `sessions:${campaignId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_sessions',
        filter: `campaign_id=eq.${campaignId}`
      }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('campaign_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');
  const pastSessions = sessions.filter((s) => s.status === 'ended');

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
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : upcomingSessions.length === 0 ? (
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
                        <h4 className="font-medium font-cinzel">
                          {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy") : 'Scheduled Session'}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-arcanePurple" />
                            {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy") : 'TBD'}
                          </div>
                          <Badge variant="outline" className="border-brass/30">
                            {session.status}
                          </Badge>
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
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : pastSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No past sessions yet
            </p>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {pastSessions.map((session) => (
                  <Card key={session.id} className="bg-background/50 border-brass/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-medium font-cinzel">
                            {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy") : 'Past Session'}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-brass" />
                              {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy") : 'Unknown date'}
                            </div>
                            {session.ended_at && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-brass" />
                                {format(new Date(session.ended_at), "h:mm a")}
                              </div>
                            )}
                          </div>
                          {session.session_notes && (
                            <div className="flex items-start gap-2 mt-2">
                              <FileText className="w-3 h-3 text-brass mt-0.5" />
                              <p className="text-sm text-muted-foreground">{session.session_notes}</p>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
