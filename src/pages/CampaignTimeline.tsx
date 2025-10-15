import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, ChevronDown, Calendar, Swords, Flag, FileText, User, Package, Download, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
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
}

interface Session {
  id: string;
  title: string;
  sessionDate: string;
  notes: string | null;
}

const CampaignTimeline = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";
  
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedKinds, setSelectedKinds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;
    
    loadData();
    
    // Poll for updates instead of realtime to avoid type recursion
    const interval = setInterval(loadData, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [campaignId]);

  const loadData = async () => {
    if (!campaignId) return;
    
    setLoading(true);
    
    // Load events
    const { data: eventsData } = await (supabase as any)
      .from('timeline_events')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('occurred_at', { ascending: false });

    if (eventsData) {
      setEvents(eventsData.map((e: any) => ({
        id: e.id,
        sessionId: e.session_id,
        occurredAt: e.occurred_at,
        kind: e.kind,
        title: e.title,
        summary: e.summary,
        refType: e.ref_type,
        refId: e.ref_id,
        payload: e.payload,
      })));
    }
    
    // Load sessions
    const { data: sessionsData } = await (supabase as any)
      .from('sessions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('session_date', { ascending: false });

    if (sessionsData) {
      setSessions(sessionsData.map((s: any) => ({
        id: s.id,
        title: s.title,
        sessionDate: s.session_date,
        notes: s.notes,
      })));
    }
    
    setLoading(false);
  };

  const getEventIcon = (kind: string) => {
    const icons: Record<string, any> = {
      SESSION_START: Calendar,
      SESSION_END: Calendar,
      ENCOUNTER_START: Swords,
      ENCOUNTER_END: Swords,
      ROUND_SUMMARY: Swords,
      QUEST_CREATED: Flag,
      QUEST_OBJECTIVE_UPDATED: Flag,
      QUEST_COMPLETED: Flag,
      NOTE_CREATED: FileText,
      HIGHLIGHT: FileText,
      NPC_APPEARANCE: User,
      ITEM_GAINED: Package,
      ITEM_SPENT: Package,
      CUSTOM: FileText,
    };
    return icons[kind] || FileText;
  };

  const getEventColor = (kind: string) => {
    const colors: Record<string, string> = {
      ENCOUNTER_START: "rose",
      ENCOUNTER_END: "rose",
      ROUND_SUMMARY: "rose",
      QUEST_CREATED: "amber",
      QUEST_OBJECTIVE_UPDATED: "amber",
      QUEST_COMPLETED: "emerald",
      NOTE_CREATED: "sky",
      HIGHLIGHT: "sky",
      NPC_APPEARANCE: "violet",
      ITEM_GAINED: "emerald",
      ITEM_SPENT: "orange",
      SESSION_START: "zinc",
      SESSION_END: "zinc",
      CUSTOM: "zinc",
    };
    return colors[kind] || "zinc";
  };

  const exportTimeline = () => {
    const markdown = events.map(e => {
      const date = format(new Date(e.occurredAt), "PPp");
      return `### ${e.title}\n**${date}** - ${e.kind}\n\n${e.summary || ''}\n\n`;
    }).join('\n');
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-timeline.md';
    a.click();
    
    toast({
      title: "Timeline exported",
      description: "Downloaded as Markdown file",
    });
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
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 shadow-sm">
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
            <h1 className="text-2xl font-bold">Campaign Timeline</h1>
            <div className="flex gap-2">
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
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Loading timeline...</p>
          </Card>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              No timeline events yet. Play your campaign to build your story!
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
                    className="cursor-pointer"
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
                  ? `${session.title} - ${format(new Date(session.sessionDate), 'PP')}`
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
                                  <Badge variant="outline" className="mt-2 text-xs">
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

      <BottomNav role={isDM ? "dm" : "player"} />
    </div>
  );
};

export default CampaignTimeline;
