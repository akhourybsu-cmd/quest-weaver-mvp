import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, Calendar, Swords, Flag, FileText, User, Package, Download, MapPin, Star, Play, Square } from "lucide-react";

import { toast } from "sonner";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  sessionId: string | null;
  occurredAt: string;
  kind: string;
  title: string;
  summary: string | null;
  refType: string | null;
  refId: string | null;
  payload: any;
  playerVisible: boolean;
}

interface Session {
  id: string;
  name: string | null;
  startedAt: string;
}

const CampaignTimeline = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    
    loadData();
    
    const interval = setInterval(loadData, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [campaignId]);

  const loadData = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    
    // Load events from timeline_events table
    const { data: eventsData, error: eventsError } = await supabase
      .from('timeline_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('occurred_at', { ascending: false });

    if (eventsError) {
      console.error('Error loading timeline events:', eventsError);
    } else if (eventsData) {
      // Filter for player visibility if not DM
      const filteredEvents = isDM 
        ? eventsData 
        : eventsData.filter(e => e.player_visible);
      
      setEvents(filteredEvents.map((e) => ({
        id: e.id,
        sessionId: e.session_id,
        occurredAt: e.occurred_at,
        kind: e.kind,
        title: e.title,
        summary: e.summary,
        refType: e.ref_type,
        refId: e.ref_id,
        payload: e.payload,
        playerVisible: e.player_visible,
      })));
    }
    
    // Load sessions from campaign_sessions table
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('campaign_sessions')
      .select('id, name, started_at')
      .eq('campaign_id', campaignId)
      .order('started_at', { ascending: false });

    if (sessionsError) {
      console.error('Error loading sessions:', sessionsError);
    } else if (sessionsData) {
      setSessions(sessionsData.map((s) => ({
        id: s.id,
        name: s.name,
        startedAt: s.started_at || '',
      })));
    }
    
    setLoading(false);
  };

  const getEventIcon = (kind: string) => {
    const icons: Record<string, any> = {
      session_start: Play,
      session_end: Square,
      encounter_start: Swords,
      encounter_end: Swords,
      quest_created: Flag,
      quest_objective: Flag,
      quest_completed: Flag,
      note_created: FileText,
      highlight: Star,
      npc_appearance: User,
      item_gained: Package,
      location_discovered: MapPin,
      custom: FileText,
    };
    return icons[kind] || FileText;
  };

  const getEventColor = (kind: string) => {
    const colors: Record<string, string> = {
      session_start: "emerald",
      session_end: "amber",
      encounter_start: "rose",
      encounter_end: "rose",
      quest_created: "violet",
      quest_objective: "violet",
      quest_completed: "emerald",
      note_created: "sky",
      highlight: "amber",
      npc_appearance: "sky",
      item_gained: "amber",
      location_discovered: "emerald",
      custom: "zinc",
    };
    return colors[kind] || "zinc";
  };

  const exportTimeline = () => {
    const markdown = events.map(e => {
      const date = format(new Date(e.occurredAt), "PPp");
      return `### ${e.title}\n**${date}** - ${e.kind}\n\n${e.summary || ''}\n\n`;
    }).join('\n');
    
    const blob = new Blob([`# Campaign Timeline\n\n${markdown}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-timeline.md';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Timeline exported as Markdown");
  };

  const filteredEvents = selectedKinds.length > 0
    ? events.filter(e => selectedKinds.includes(e.kind))
    : events;

  // Group events by session
  const eventsBySession = filteredEvents.reduce((acc, event) => {
    const sessionId = event.sessionId || 'unsorted';
    if (!acc[sessionId]) acc[sessionId] = [];
    acc[sessionId].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-brass/20 sticky top-0 z-40 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-cinzel font-bold">Campaign Timeline</h1>
            <Button
              size="sm"
              variant="outline"
              onClick={exportTimeline}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading timeline...</p>
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No timeline events yet. Start a session to build your campaign history!
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Filters */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Filter by Event Type</h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(events.map(e => e.kind))).map(kind => (
                  <Badge
                    key={kind}
                    variant={selectedKinds.includes(kind) ? "default" : "outline"}
                    className="cursor-pointer capitalize"
                    onClick={() => {
                      setSelectedKinds(prev =>
                        prev.includes(kind)
                          ? prev.filter(k => k !== kind)
                          : [...prev, kind]
                      );
                    }}
                  >
                    {kind.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </Card>

            {/* Timeline */}
            <div className="space-y-4">
              {Object.entries(eventsBySession).map(([sessionId, sessionEvents]) => {
                const session = sessions.find(s => s.id === sessionId);
                const sectionTitle = session
                  ? `${session.name || 'Session'} - ${session.startedAt ? format(new Date(session.startedAt), 'PP') : 'Unknown date'}`
                  : 'Unassigned Events';

                return (
                  <Collapsible key={sessionId} defaultOpen>
                    <Card>
                      <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-muted-foreground" />
                          <h3 className="font-semibold">{sectionTitle}</h3>
                          <Badge variant="secondary">{sessionEvents.length}</Badge>
                        </div>
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-0 space-y-3">
                          {sessionEvents.map((event) => {
                            const Icon = getEventIcon(event.kind);
                            const color = getEventColor(event.kind);
                            
                            return (
                              <div
                                key={event.id}
                                className="flex gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors"
                              >
                                <div className={`p-2 rounded-lg bg-${color}-500/10 h-fit`}>
                                  <Icon className={`w-4 h-4 text-${color}-500`} />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium">{event.title}</h4>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(event.occurredAt), 'p')}
                                    </span>
                                  </div>
                                  {event.summary && (
                                    <p className="text-sm text-muted-foreground">{event.summary}</p>
                                  )}
                                  <Badge variant="outline" className="mt-2 text-xs capitalize">
                                    {event.kind.replace(/_/g, ' ')}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </div>
          </div>
        )}
      </div>

      
    </div>
  );
};

export default CampaignTimeline;
