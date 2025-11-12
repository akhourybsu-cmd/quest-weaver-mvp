import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, StopCircle, Loader2, Swords } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTenant } from "@/contexts/TenantContext";
import InitiativeTracker from "@/components/combat/InitiativeTracker";
import CombatLog from "@/components/combat/CombatLog";
import MonsterRoster from "@/components/monsters/MonsterRoster";
import ConditionsManager from "@/components/combat/ConditionsManager";
import EffectsList from "@/components/combat/EffectsList";
import { toast } from "sonner";

interface SessionTabProps {
  session: any;
  onSessionEnd: () => void;
}

export function SessionTab({ session, onSessionEnd }: SessionTabProps) {
  const { campaignId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [encounter, setEncounter] = useState<any>(null);

  useEffect(() => {
    if (!session?.active_encounter_id) return;

    const fetchEncounter = async () => {
      const { data } = await supabase
        .from('encounters')
        .select('*')
        .eq('id', session.active_encounter_id)
        .single();
      
      setEncounter(data);
    };

    fetchEncounter();

    // Subscribe to encounter updates
    const channel = supabase
      .channel(`encounter:${session.active_encounter_id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'encounters', filter: `id=eq.${session.active_encounter_id}` },
        () => fetchEncounter()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.active_encounter_id]);

  const handlePauseSession = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({ status: 'paused' })
        .eq('id', session.id);

      if (error) throw error;
      toast.success('Session paused');
    } catch (error) {
      console.error('Failed to pause session:', error);
      toast.error('Failed to pause session');
    } finally {
      setLoading(false);
    }
  };

  const handleResumeSession = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('campaign_sessions')
        .update({ status: 'live' })
        .eq('id', session.id);

      if (error) throw error;
      toast.success('Session resumed');
    } catch (error) {
      console.error('Failed to resume session:', error);
      toast.error('Failed to resume session');
    } finally {
      setLoading(false);
    }
  };

  const handleEndSession = async () => {
    setLoading(true);
    try {
      const { error: sessionError } = await supabase
        .from('campaign_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      const { error: campaignError } = await supabase
        .from('campaigns')
        .update({ live_session_id: null })
        .eq('id', campaignId);

      if (campaignError) throw campaignError;

      toast.success('Session ended');
      onSessionEnd();
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Session Controls */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel flex items-center gap-2">
                <Swords className="w-5 h-5 text-arcanePurple" />
                Live Session
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Started {new Date(session.started_at).toLocaleString()}
              </p>
            </div>
            <Badge 
              variant={session.status === 'live' ? 'default' : 'secondary'}
              className={session.status === 'live' ? 'bg-green-500 animate-pulse' : ''}
            >
              {session.status.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {session.status === 'live' && (
              <Button variant="outline" onClick={handlePauseSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pause className="w-4 h-4 mr-2" />}
                Pause
              </Button>
            )}
            {session.status === 'paused' && (
              <Button variant="outline" onClick={handleResumeSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Resume
              </Button>
            )}
            <Button variant="destructive" onClick={handleEndSession} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <StopCircle className="w-4 h-4 mr-2" />}
              End Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Session Active - Combat features coming soon */}
      <Card className="bg-card/50 border-brass/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Swords className="w-16 h-16 text-arcanePurple mb-4" />
          <h3 className="text-xl font-cinzel font-bold mb-2">Session is Live!</h3>
          <p className="text-muted-foreground text-center max-w-md mb-4">
            Players can now connect. Combat features will appear here when an encounter starts.
          </p>
          {encounter && (
            <Badge variant="outline" className="text-sm">
              Active Encounter: {encounter.name || 'Unnamed'}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
