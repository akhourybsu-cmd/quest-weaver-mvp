import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Clock,
  Search,
  Swords,
  MapPin,
  Users,
  ScrollText,
  Star,
  BookOpen,
  Package,
  Play,
  Square,
} from "lucide-react";
import { format } from "date-fns";
import { PlayerEmptyState } from "./PlayerEmptyState";

interface TimelineEvent {
  id: string;
  kind: string;
  title: string;
  summary: string | null;
  occurred_at: string | null;
  in_game_date: string | null;
  created_at: string | null;
}

interface PlayerTimelineViewProps {
  campaignId: string;
}

const KIND_ICONS: Record<string, React.ElementType> = {
  SESSION_START: Play,
  SESSION_END: Square,
  ENCOUNTER_START: Swords,
  ENCOUNTER_END: Swords,
  QUEST_CREATED: ScrollText,
  QUEST_COMPLETED: ScrollText,
  NPC_APPEARANCE: Users,
  LOCATION_DISCOVERED: MapPin,
  ITEM_GAINED: Package,
  NOTE_CREATED: BookOpen,
  HIGHLIGHT: Star,
};

const KIND_LABELS: Record<string, string> = {
  SESSION_START: "Session Started",
  SESSION_END: "Session Ended",
  ENCOUNTER_START: "Encounter",
  ENCOUNTER_END: "Encounter Ended",
  QUEST_CREATED: "New Quest",
  QUEST_COMPLETED: "Quest Completed",
  NPC_APPEARANCE: "NPC Encountered",
  LOCATION_DISCOVERED: "Location Discovered",
  ITEM_GAINED: "Item Acquired",
  NOTE_CREATED: "Note Added",
  HIGHLIGHT: "Highlight",
};

export function PlayerTimelineView({ campaignId }: PlayerTimelineViewProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadEvents();

    const channel = supabase
      .channel(`player-timeline:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timeline_events",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("timeline_events")
      .select("id, kind, title, summary, occurred_at, in_game_date, created_at")
      .eq("campaign_id", campaignId)
      .eq("player_visible", true)
      .order("occurred_at", { ascending: false, nullsFirst: false });

    if (!error && data) {
      setEvents(data as TimelineEvent[]);
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      event.title.toLowerCase().includes(search) ||
      event.summary?.toLowerCase().includes(search) ||
      event.kind.toLowerCase().includes(search)
    );
  });

  const getKindIcon = (kind: string) => {
    const Icon = KIND_ICONS[kind] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const formatDate = (event: TimelineEvent) => {
    if (event.in_game_date) return event.in_game_date;
    if (event.occurred_at) {
      try {
        return format(new Date(event.occurred_at), "MMM d, yyyy");
      } catch {
        return null;
      }
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="space-y-3">
          <CardTitle className="flex items-center gap-2 font-cinzel">
            <Clock className="w-5 h-5" />
            Campaign Timeline
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredEvents.length === 0 && events.length === 0 ? (
          <PlayerEmptyState
            icon={Clock}
            title="No Timeline Events"
            description="Key events will appear here as your campaign progresses."
          />
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No events match your search</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-28rem)] min-h-[200px] pr-4">
            <div className="relative">
              {/* Vertical timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

              <div className="space-y-4">
                {filteredEvents.map((event, index) => {
                  const dateStr = formatDate(event);
                  return (
                    <div key={event.id} className="relative pl-10 opacity-0 animate-fade-in" style={{ animationDelay: `${Math.min(index * 30, 300)}ms`, animationFillMode: 'forwards' }}>
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                      <Card className="border-brass/20 hover:border-brass/40 transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-primary">
                              {getKindIcon(event.kind)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-sm">{event.title}</h3>
                                <Badge variant="secondary" className="text-xs">
                                  {KIND_LABELS[event.kind] || event.kind}
                                </Badge>
                              </div>
                              {dateStr && (
                                <p className="text-xs text-muted-foreground mt-1">{dateStr}</p>
                              )}
                              {event.summary && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  {event.summary}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
