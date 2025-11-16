import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, Plus, Send, FileText, Users, Package } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";
import { SessionPackBuilder } from "../SessionPackBuilder";
import { ScheduleSessionDialog } from "../ScheduleSessionDialog";
import { SessionLogViewer } from "../SessionLogViewer";

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
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [packBuilderOpen, setPackBuilderOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);

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

  const upcomingSessions = sessions?.filter((s) => s.status === 'scheduled') || [];
  const pastSessions = sessions?.filter((s) => s.status === 'ended') || [];

  const openPackBuilder = (session: Session) => {
    setSelectedSession(session);
    setPackBuilderOpen(true);
  };

  const openLogViewer = (session: Session) => {
    setViewingSession(session);
    setLogViewerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Session Pack Builder */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel">Session Pack Builder</CardTitle>
              <CardDescription>Build content packs for upcoming sessions</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Sessions */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-cinzel">Upcoming Sessions</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setScheduleDialogOpen(true)}>
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
                      <Button size="sm" variant="outline" onClick={() => openPackBuilder(session)}>
                        <Package className="w-4 h-4 mr-2" />
                        Build Pack
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
                        <Button size="sm" variant="ghost" onClick={() => openLogViewer(session)}>
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

      {/* Session Pack Builder Dialog */}
      <Dialog open={packBuilderOpen} onOpenChange={setPackBuilderOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Session Pack Builder</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <SessionPackBuilder
              campaignId={campaignId}
              sessionId={selectedSession.id}
              sessionName={selectedSession.started_at ? format(new Date(selectedSession.started_at), "MMM d, yyyy") : "Upcoming Session"}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        campaignId={campaignId}
        onSuccess={fetchSessions}
      />

      {/* Session Log Viewer */}
      {viewingSession && (
        <SessionLogViewer
          open={logViewerOpen}
          onOpenChange={setLogViewerOpen}
          sessionId={viewingSession.id}
          sessionDate={viewingSession.started_at || viewingSession.ended_at || new Date().toISOString()}
        />
      )}
    </div>
  );
}
