import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Clock, Plus, FileText, Package, Play, Target, CheckSquare, Pencil, Pause, Square } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";
import { SessionPackBuilder } from "../SessionPackBuilder";
import { ScheduleSessionDialog } from "../ScheduleSessionDialog";
import { SessionLogViewer } from "../SessionLogViewer";
import { EndSessionDialog } from "../EndSessionDialog";

interface SessionsTabProps {
  campaignId: string;
  onStartSession?: (sessionId: string) => void;
}

interface PrepChecklistItem {
  text: string;
  completed: boolean;
}

interface Session {
  id: string;
  name: string | null;
  started_at: string | null;
  ended_at: string | null;
  session_notes: string | null;
  dm_notes: string | null;
  status: string;
  goals: string | null;
  prep_checklist: PrepChecklistItem[];
  paused_at: string | null;
  paused_duration_seconds: number | null;
}

export function SessionsTab({ campaignId, onStartSession }: SessionsTabProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sessionToEdit, setSessionToEdit] = useState<Session | null>(null);
  const [packBuilderOpen, setPackBuilderOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [logViewerOpen, setLogViewerOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<Session | null>(null);
  const [startingSessionId, setStartingSessionId] = useState<string | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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
      
      // Parse prep_checklist from JSON if needed
      const parsedSessions = (data || []).map(s => {
        let checklist: PrepChecklistItem[] = [];
        if (s.prep_checklist) {
          if (typeof s.prep_checklist === 'string') {
            try {
              checklist = JSON.parse(s.prep_checklist);
            } catch {
              checklist = [];
            }
          } else if (Array.isArray(s.prep_checklist)) {
            checklist = s.prep_checklist as unknown as PrepChecklistItem[];
          }
        }
        return {
          id: s.id,
          name: s.name,
          started_at: s.started_at,
          ended_at: s.ended_at,
          session_notes: s.session_notes,
          dm_notes: s.dm_notes,
          status: s.status,
          goals: s.goals,
          prep_checklist: checklist,
          paused_at: s.paused_at,
          paused_duration_seconds: s.paused_duration_seconds
        };
      });
      
      setSessions(parsedSessions);
    } catch (error: any) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async (session: Session) => {
    setStartingSessionId(session.id);
    try {
      // Update session status to live
      const { error: sessionError } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'live',
          started_at: new Date().toISOString(),
          paused_duration_seconds: 0
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      // Update campaign's live_session_id
      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ live_session_id: session.id })
        .eq('id', campaignId);

      if (campaignError) throw campaignError;

      toast.success('Session started!');
      onStartSession?.(session.id);
    } catch (error: any) {
      console.error('Error starting session:', error);
      toast.error('Failed to start session');
    } finally {
      setStartingSessionId(null);
    }
  };

  const getSessionDisplayName = (session: Session) => {
    if (session.name) return session.name;
    if (session.started_at) return format(new Date(session.started_at), "MMM d, yyyy");
    return 'Scheduled Session';
  };

  const getPrepProgress = (checklist: PrepChecklistItem[]) => {
    if (!checklist || checklist.length === 0) return null;
    const completed = checklist.filter(item => item.completed).length;
    return { completed, total: checklist.length };
  };

  const liveSessions = sessions?.filter((s) => ['live', 'paused'].includes(s.status)) || [];
  const currentSession = liveSessions[0] || null;
  const upcomingSessions = sessions?.filter((s) => s.status === 'scheduled') || [];
  const pastSessions = sessions?.filter((s) => s.status === 'ended') || [];

  // Timer for current session
  useEffect(() => {
    if (!currentSession || currentSession.status !== 'live') {
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(currentSession.started_at!).getTime();
      const now = Date.now();
      const pausedMs = (currentSession.paused_duration_seconds || 0) * 1000;
      return Math.floor((now - start - pausedMs) / 1000);
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSession]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handlePauseSession = async () => {
    if (!currentSession) return;

    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      toast.success('Session paused');
    } catch (error) {
      console.error('Error pausing session:', error);
      toast.error('Failed to pause session');
    }
  };

  const handleResumeSession = async () => {
    if (!currentSession) return;

    try {
      const pausedAt = currentSession.paused_at ? new Date(currentSession.paused_at).getTime() : 0;
      const now = Date.now();
      const additionalPausedSeconds = pausedAt > 0 ? Math.floor((now - pausedAt) / 1000) : 0;
      const totalPausedSeconds = (currentSession.paused_duration_seconds || 0) + additionalPausedSeconds;

      const { error } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'live',
          paused_at: null,
          paused_duration_seconds: totalPausedSeconds
        })
        .eq('id', currentSession.id);

      if (error) throw error;
      toast.success('Session resumed');
    } catch (error) {
      console.error('Error resuming session:', error);
      toast.error('Failed to resume session');
    }
  };

  const handleEndSession = async (notes?: string) => {
    if (!currentSession) return;

    try {
      let finalPausedSeconds = currentSession.paused_duration_seconds || 0;

      if (currentSession.status === 'paused' && currentSession.paused_at) {
        const pausedAt = new Date(currentSession.paused_at).getTime();
        const additionalPausedSeconds = Math.floor((Date.now() - pausedAt) / 1000);
        finalPausedSeconds += additionalPausedSeconds;
      }

      const { error: sessionError } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          paused_duration_seconds: finalPausedSeconds,
          ...(notes && { dm_notes: notes })
        })
        .eq('id', currentSession.id);

      if (sessionError) throw sessionError;

      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ live_session_id: null })
        .eq('id', campaignId);

      if (campaignError) throw campaignError;

      toast.success('Session ended');
      setShowEndDialog(false);
    } catch (error) {
      console.error('Error ending session:', error);
      toast.error('Failed to end session');
    }
  };

  const getSessionDuration = () => {
    if (!currentSession || !currentSession.started_at) return "0s";
    
    const start = new Date(currentSession.started_at).getTime();
    const end = currentSession.status === 'paused' && currentSession.paused_at 
      ? new Date(currentSession.paused_at).getTime()
      : Date.now();
    const pausedMs = (currentSession.paused_duration_seconds || 0) * 1000;
    const elapsedSeconds = Math.floor((end - start - pausedMs) / 1000);
    
    return formatTime(elapsedSeconds);
  };

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
      {/* Current Session */}
      {currentSession && (
        <Card className="bg-card/50 border-brass/40 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CardTitle className="font-cinzel">{getSessionDisplayName(currentSession)}</CardTitle>
                {currentSession.status === 'live' && (
                  <Badge variant="outline" className="border-red-500/50 text-red-500 bg-red-500/10 animate-pulse">
                    🔴 Live
                  </Badge>
                )}
                {currentSession.status === 'paused' && (
                  <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10">
                    ⏸️ Paused
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className={`flex items-center gap-2 tabular-nums font-mono text-lg font-semibold text-brass ${currentSession.status === 'paused' ? 'opacity-50' : ''}`}>
                  <Clock className="w-5 h-5" />
                  {formatTime(elapsed)}
                </div>
                <div className="w-px h-6 bg-brass/20" />
                {currentSession.status === 'live' && (
                  <Button
                    onClick={handlePauseSession}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-yellow-500/10 hover:text-yellow-400"
                    title="Pause session"
                  >
                    <Pause className="w-4 h-4" />
                  </Button>
                )}
                {currentSession.status === 'paused' && (
                  <Button
                    onClick={handleResumeSession}
                    variant="ghost"
                    size="icon"
                    className="hover:bg-green-500/10 hover:text-green-400"
                    title="Resume session"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  onClick={() => setShowEndDialog(true)}
                  variant="ghost"
                  size="icon"
                  className="hover:bg-destructive/10 hover:text-destructive"
                  title="End session"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-arcanePurple" />
                Started {currentSession.started_at ? format(new Date(currentSession.started_at), "MMM d, yyyy 'at' h:mm a") : 'now'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session Pack Builder */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel">Session Pack Builder</CardTitle>
              <CardDescription>Build content packs for upcoming sessions</CardDescription>
            </div>
            {upcomingSessions.length > 0 ? (
              <Button size="sm" variant="outline" onClick={() => openPackBuilder(upcomingSessions[0])}>
                <Package className="w-4 h-4 mr-2" />
                Build Pack
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Schedule First
              </Button>
            )}
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
            <div className="flex flex-col items-center py-8 text-center">
              <div className="rounded-full bg-brass/10 p-3 mb-3">
                <Calendar className="w-6 h-6 text-brass/60" />
              </div>
              <p className="text-sm text-muted-foreground">No upcoming sessions scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const prepProgress = getPrepProgress(session.prep_checklist);
                return (
                  <Card key={session.id} className="bg-background/50 border-brass/10">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <h4 className="font-medium font-cinzel text-lg">
                            {getSessionDisplayName(session)}
                          </h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-arcanePurple" />
                              {session.started_at ? format(new Date(session.started_at), "MMM d, yyyy 'at' h:mm a") : 'TBD'}
                            </div>
                            <Badge variant="outline" className="border-brass/30">
                              {session.status}
                            </Badge>
                          </div>
                          
                          {/* Goals preview */}
                          {session.goals && (
                            <div className="flex items-start gap-2 mt-2">
                              <Target className="w-3 h-3 text-brass mt-0.5" />
                              <p className="text-sm text-muted-foreground line-clamp-2">{session.goals}</p>
                            </div>
                          )}
                          
                          {/* Prep checklist progress */}
                          {prepProgress && (
                            <div className="flex items-center gap-2 mt-2">
                              <CheckSquare className="w-3 h-3 text-brass" />
                              <span className="text-xs text-muted-foreground">
                                Prep: {prepProgress.completed}/{prepProgress.total} complete
                              </span>
                              <div className="flex-1 h-1.5 bg-muted rounded-full max-w-24">
                                <div 
                                  className="h-full bg-brass rounded-full transition-all"
                                  style={{ width: `${(prepProgress.completed / prepProgress.total) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 ml-4">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSessionToEdit(session);
                              setScheduleDialogOpen(true);
                            }}
                            title="Edit Session"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openPackBuilder(session)}>
                            <Package className="w-4 h-4 mr-2" />
                            Build Pack
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleStartSession(session)}
                            disabled={startingSessionId === session.id}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            {startingSessionId === session.id ? 'Starting...' : 'Start'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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
                            {getSessionDisplayName(session)}
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
                              <p className="text-sm text-muted-foreground line-clamp-2">{session.session_notes}</p>
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
              sessionName={getSessionDisplayName(selectedSession)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Session Dialog */}
      <ScheduleSessionDialog
        open={scheduleDialogOpen}
        onOpenChange={(open) => {
          setScheduleDialogOpen(open);
          if (!open) setSessionToEdit(null);
        }}
        campaignId={campaignId}
        sessionToEdit={sessionToEdit}
        onSuccess={fetchSessions}
      />

      {/* Session Log Viewer */}
      {viewingSession && (
        <SessionLogViewer
          open={logViewerOpen}
          onOpenChange={setLogViewerOpen}
          sessionId={viewingSession.id}
          sessionDate={viewingSession.started_at || viewingSession.ended_at || new Date().toISOString()}
          sessionName={viewingSession.name}
        />
      )}

      {/* End Session Dialog */}
      <EndSessionDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        onConfirm={handleEndSession}
        sessionDuration={getSessionDuration()}
      />
    </div>
  );
}
