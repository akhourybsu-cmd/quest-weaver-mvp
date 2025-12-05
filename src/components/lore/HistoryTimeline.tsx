import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Calendar, Sword, Crown, Star, Flame, BookOpen, FileText, Settings } from "lucide-react";
import { toast } from "sonner";
import EraManager from "./EraManager";

interface HistoryEvent {
  id: string;
  title: string;
  excerpt: string | null;
  era: string | null;
  visibility: string;
  tags: string[];
  details: {
    date?: string;
    era?: string;
    type?: string;
    outcome?: string;
    showOnTimeline?: boolean;
    era_id?: string;
    image_url?: string;
  } | null;
  updated_at: string;
}

interface Era {
  id: string;
  name: string;
  sort_order: number;
  description: string | null;
}

interface HistoryTimelineProps {
  campaignId: string;
  onViewEvent: (event: HistoryEvent) => void;
}

const eventTypeIcons: Record<string, typeof Sword> = {
  war: Sword,
  battle: Sword,
  coronation: Crown,
  discovery: Star,
  cataclysm: Flame,
  founding: BookOpen,
  treaty: FileText,
  other: Calendar
};

export default function HistoryTimeline({ campaignId, onViewEvent }: HistoryTimelineProps) {
  const [events, setEvents] = useState<HistoryEvent[]>([]);
  const [eras, setEras] = useState<Era[]>([]);
  const [loading, setLoading] = useState(true);
  const [eraManagerOpen, setEraManagerOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, erasRes] = await Promise.all([
        supabase
          .from("lore_pages")
          .select("id, title, excerpt, era, visibility, tags, details, updated_at")
          .eq("campaign_id", campaignId)
          .eq("category", "history")
          .order("updated_at", { ascending: false }),
        supabase
          .from("campaign_eras")
          .select("*")
          .eq("campaign_id", campaignId)
          .order("sort_order", { ascending: true })
      ]);

      if (eventsRes.error) throw eventsRes.error;
      if (erasRes.error) throw erasRes.error;

      setEvents((eventsRes.data || []) as HistoryEvent[]);
      setEras(erasRes.data || []);
    } catch (error: any) {
      toast.error("Failed to load timeline: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Group events by era with proper sorting
  const groupedEvents = useMemo(() => {
    const groups: Map<string, { era: Era | null; events: HistoryEvent[] }> = new Map();
    
    // Create era lookup
    const eraLookup = new Map(eras.map(e => [e.name.toLowerCase(), e]));
    
    // Group events
    events.forEach(event => {
      const eventEra = event.details?.era || event.era || "Unknown Era";
      const eraKey = eventEra.toLowerCase();
      
      if (!groups.has(eraKey)) {
        groups.set(eraKey, {
          era: eraLookup.get(eraKey) || null,
          events: []
        });
      }
      groups.get(eraKey)!.events.push(event);
    });

    // Sort groups by era sort_order (defined eras first, then unknown)
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const aOrder = a[1].era?.sort_order ?? 9999;
      const bOrder = b[1].era?.sort_order ?? 9999;
      return aOrder - bOrder;
    });

    // Sort events within each group by date (attempt numeric parsing)
    sortedGroups.forEach(([_, group]) => {
      group.events.sort((a, b) => {
        const dateA = a.details?.date || "";
        const dateB = b.details?.date || "";
        
        // Try to parse as numbers
        const numA = parseInt(dateA.replace(/[^-\d]/g, ""));
        const numB = parseInt(dateB.replace(/[^-\d]/g, ""));
        
        if (!isNaN(numA) && !isNaN(numB)) {
          return numA - numB;
        }
        return dateA.localeCompare(dateB);
      });
    });

    return sortedGroups;
  }, [events, eras]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium mb-2">No historical events yet</p>
        <p className="text-sm text-muted-foreground">
          Create history entries to build your world's timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Era Manager Button */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setEraManagerOpen(true)}>
          <Settings className="h-4 w-4 mr-2" />
          Manage Eras
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-350px)]">
        <div className="relative pl-8 space-y-8 pr-4">
          {/* Timeline line */}
          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500/50 via-amber-500/30 to-transparent" />

          {groupedEvents.map(([eraKey, group], groupIndex) => {
            const eraName = group.era?.name || eraKey.charAt(0).toUpperCase() + eraKey.slice(1);
            
            return (
              <div key={eraKey} className="relative">
                {/* Era marker */}
                <div className="absolute -left-5 top-0 flex items-center">
                  <div className="w-6 h-6 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                  </div>
                </div>

                {/* Era header */}
                <div className="mb-4 pl-4">
                  <h3 className="font-cinzel text-lg font-bold text-amber-500">{eraName}</h3>
                  {group.era?.description && (
                    <p className="text-sm text-muted-foreground">{group.era.description}</p>
                  )}
                </div>

                {/* Events in this era */}
                <div className="space-y-3 pl-4">
                  {group.events.map((event, eventIndex) => {
                    const eventType = event.details?.type || "other";
                    const EventIcon = eventTypeIcons[eventType] || Calendar;
                    
                    return (
                      <Card
                        key={event.id}
                        className="cursor-pointer hover:shadow-lg transition-all border-brass/20 bg-card/50 hover:border-amber-500/40 relative overflow-hidden"
                        onClick={() => onViewEvent(event)}
                      >
                        {/* Background image with fade effect */}
                        {event.details?.image_url && (
                          <div className="absolute inset-0 pointer-events-none">
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-2/3"
                              style={{ 
                                backgroundImage: `url(${event.details.image_url})`, 
                                backgroundSize: 'cover', 
                                backgroundPosition: 'center' 
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/95 to-transparent" />
                          </div>
                        )}
                        <CardHeader className="py-3 px-4 relative z-10">
                          <div className="flex items-start gap-3">
                            <div className="p-1.5 rounded bg-amber-500/10 text-amber-500">
                              <EventIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <CardTitle className="text-sm font-medium">{event.title}</CardTitle>
                                {event.details?.date && (
                                  <Badge variant="outline" className="text-xs shrink-0 border-amber-500/30 text-amber-600 bg-card/80">
                                    {event.details.date}
                                  </Badge>
                                )}
                              </div>
                              {event.excerpt && (
                                <CardDescription className="text-xs line-clamp-2 mt-1">
                                  {event.excerpt}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        {event.tags.length > 0 && (
                          <CardContent className="py-2 px-4 pt-0 relative z-10">
                            <div className="flex flex-wrap gap-1">
                              {event.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <EraManager
        campaignId={campaignId}
        open={eraManagerOpen}
        onOpenChange={setEraManagerOpen}
        onErasChange={loadData}
      />
    </div>
  );
}