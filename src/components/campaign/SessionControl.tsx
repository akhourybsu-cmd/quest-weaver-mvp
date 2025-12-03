import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Pause, Square, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "@/hooks/use-toast";
import { EndSessionDialog } from "./EndSessionDialog";
import { timelineLogger } from "@/hooks/useTimelineLogger";

interface SessionData {
  id: string;
  campaign_id: string;
  status: 'live' | 'paused' | 'ended';
  started_at: string;
  paused_at?: string | null;
  paused_duration_seconds: number;
  dm_notes?: string | null;
}

interface SessionControlProps {
  campaignId: string;
}

export function SessionControl({ campaignId }: SessionControlProps) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [morphing, setMorphing] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);

  // Fetch active session on mount
  useEffect(() => {
    const fetchActiveSession = async () => {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('live_session_id, campaign_sessions(*)')
        .eq('id', campaignId)
        .single();

      if (campaign?.live_session_id && campaign.campaign_sessions) {
        const sessionData = Array.isArray(campaign.campaign_sessions) 
          ? campaign.campaign_sessions[0] 
          : campaign.campaign_sessions;
        
        if (sessionData?.status !== 'ended') {
          setSession(sessionData as SessionData);
        }
      }
    };

    fetchActiveSession();
  }, [campaignId]);

  // Real-time sync
  useEffect(() => {
    const channel = resilientChannel(supabase, `campaign_sessions:${campaignId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'campaign_sessions',
        filter: `campaign_id=eq.${campaignId}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updatedSession = payload.new as SessionData;
          if (updatedSession.status === 'ended') {
            setSession(null);
          } else {
            setSession(updatedSession);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  // Timer calculation
  useEffect(() => {
    if (!session || session.status !== 'live') {
      return;
    }

    const calculateElapsed = () => {
      const start = new Date(session.started_at).getTime();
      const now = Date.now();
      const pausedMs = (session.paused_duration_seconds || 0) * 1000;
      return Math.floor((now - start - pausedMs) / 1000);
    };

    setElapsed(calculateElapsed());
    const interval = setInterval(() => {
      setElapsed(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [session]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || 
          e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      
      if (key === 's' && !session && !loading) {
        e.preventDefault();
        handleStart();
      } else if (key === 'p' && session?.status === 'live') {
        e.preventDefault();
        handlePause();
      } else if (key === 'p' && session?.status === 'paused') {
        e.preventDefault();
        handleResume();
      } else if (key === 'e' && session) {
        e.preventDefault();
        setShowEndDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [session, loading]);

  const handleStart = async () => {
    setLoading(true);

    try {
      // Check if session already exists
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('live_session_id, campaign_sessions(*)')
        .eq('id', campaignId)
        .single();

      // If live session exists, attach to it
      if (campaign?.live_session_id && campaign.campaign_sessions) {
        const existingSession = Array.isArray(campaign.campaign_sessions)
          ? campaign.campaign_sessions[0]
          : campaign.campaign_sessions;

        if (existingSession?.status !== 'ended') {
          setSession(existingSession as SessionData);
          toast({ title: 'Attached to existing session' });
          setLoading(false);
          return;
        }
      }

      // Create new session with morphing animation
      setMorphing(true);
      
      const { data: newSession, error: sessionError } = await supabase
        .from('campaign_sessions')
        .insert({
          campaign_id: campaignId,
          status: 'live',
          started_at: new Date().toISOString(),
          paused_duration_seconds: 0
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ live_session_id: newSession.id })
        .eq('id', campaignId);

      if (updateError) throw updateError;

      // Wait for animation then show pill
      setTimeout(() => {
        setSession(newSession as SessionData);
        setMorphing(false);
      }, 300);

      // Log to timeline
      await timelineLogger.sessionStart(campaignId, newSession.id);

      toast({ title: 'Session started' });
    } catch (error) {
      console.error('Error starting session:', error);
      toast({ 
        title: 'Failed to start session', 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive' 
      });
      setMorphing(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!session) return;

    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'paused',
          paused_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Session paused' });
    } catch (error) {
      console.error('Error pausing session:', error);
      toast({ 
        title: 'Failed to pause session', 
        variant: 'destructive' 
      });
    }
  };

  const handleResume = async () => {
    if (!session) return;

    try {
      const pausedAt = session.paused_at ? new Date(session.paused_at).getTime() : 0;
      const now = Date.now();
      const additionalPausedSeconds = pausedAt > 0 ? Math.floor((now - pausedAt) / 1000) : 0;
      const totalPausedSeconds = (session.paused_duration_seconds || 0) + additionalPausedSeconds;

      const { error } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'live',
          paused_at: null,
          paused_duration_seconds: totalPausedSeconds
        })
        .eq('id', session.id);

      if (error) throw error;
      toast({ title: 'Session resumed' });
    } catch (error) {
      console.error('Error resuming session:', error);
      toast({ 
        title: 'Failed to resume session', 
        variant: 'destructive' 
      });
    }
  };

  const handleEnd = async (notes?: string) => {
    if (!session) return;

    try {
      const now = new Date().toISOString();
      let finalPausedSeconds = session.paused_duration_seconds || 0;

      // If ending while paused, add final paused duration
      if (session.status === 'paused' && session.paused_at) {
        const pausedAt = new Date(session.paused_at).getTime();
        const additionalPausedSeconds = Math.floor((Date.now() - pausedAt) / 1000);
        finalPausedSeconds += additionalPausedSeconds;
      }

      const { error: sessionError } = await supabase
        .from('campaign_sessions')
        .update({
          status: 'ended',
          ended_at: now,
          paused_duration_seconds: finalPausedSeconds,
          ...(notes && { dm_notes: notes })
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ live_session_id: null })
        .eq('id', campaignId);

      if (campaignError) throw campaignError;

      // Log to timeline
      const durationFormatted = formatTime(Math.floor((Date.now() - new Date(session.started_at).getTime() - finalPausedSeconds * 1000) / 1000));
      await timelineLogger.sessionEnd(campaignId, session.id, undefined, durationFormatted);

      setSession(null);
      toast({ title: 'Session ended' });
    } catch (error) {
      console.error('Error ending session:', error);
      toast({ 
        title: 'Failed to end session', 
        variant: 'destructive' 
      });
    }
  };

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

  const getFormattedDuration = () => {
    if (!session) return "0s";
    
    const start = new Date(session.started_at).getTime();
    const end = session.status === 'paused' && session.paused_at 
      ? new Date(session.paused_at).getTime()
      : Date.now();
    const pausedMs = (session.paused_duration_seconds || 0) * 1000;
    const elapsedSeconds = Math.floor((end - start - pausedMs) / 1000);
    
    return formatTime(elapsedSeconds);
  };

  // Idle state - show nothing (sessions are started from SessionsTab)
  if (!session) {
    return null;
  }

  // Live or Paused state - Control pill
  return (
    <TooltipProvider>
      <div className="flex items-center gap-3 px-4 py-2 rounded-2xl shadow-lg border border-brass/40 bg-obsidian/80 backdrop-blur-md animate-fade-in">
        {session.status === 'live' && (
          <Badge 
            variant="outline" 
            className="border-red-500/50 text-red-500 bg-red-500/10 animate-pulse text-base px-3 py-1"
          >
            🔴 Live
          </Badge>
        )}
        {session.status === 'paused' && (
          <Badge 
            variant="outline" 
            className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 text-base px-3 py-1"
          >
            ⏸️ Paused
          </Badge>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <div 
              className={`flex items-center gap-2 tabular-nums font-mono text-lg font-semibold text-brass ${session.status === 'paused' ? 'opacity-50' : ''}`}
              aria-live="polite"
              aria-atomic="true"
            >
              <Clock className="w-5 h-5" />
              <span className="sr-only">Session duration: </span>
              {formatTime(elapsed)}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Elapsed time (excluding pauses)</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-px h-6 bg-brass/20" />

        {session.status === 'live' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handlePause}
                variant="ghost"
                size="icon"
                className="hover:bg-yellow-500/10 hover:text-yellow-400"
                aria-label="Pause session (Shortcut: P)"
              >
                <Pause className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Pause session (P)</p>
            </TooltipContent>
          </Tooltip>
        )}

        {session.status === 'paused' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={handleResume}
                variant="ghost"
                size="icon"
                className="hover:bg-green-500/10 hover:text-green-400"
                aria-label="Resume session (Shortcut: P)"
              >
                <Play className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Resume session (P)</p>
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setShowEndDialog(true)}
              variant="ghost"
              size="icon"
              className="hover:bg-destructive/10 hover:text-destructive"
              aria-label="End session (Shortcut: E)"
            >
              <Square className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>End session (E)</p>
          </TooltipContent>
        </Tooltip>
      </div>

      <EndSessionDialog
        open={showEndDialog}
        onOpenChange={setShowEndDialog}
        onConfirm={handleEnd}
        sessionDuration={getFormattedDuration()}
      />
    </TooltipProvider>
  );
}
