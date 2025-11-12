import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Sword, Scroll, Users, Crown } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";

interface TimelineTabProps {
  campaignId: string;
}

interface TimelineEvent {
  id: string;
  created_at: string;
  text: string;
  color: string | null;
  session_id: string | null;
}

const typeIcons = {
  combat: Sword,
  quest: Scroll,
  social: Users,
  political: Crown,
  default: Scroll,
};

const typeColors: Record<string, string> = {
  red: "text-dragonRed",
  purple: "text-arcanePurple",
  brass: "text-brass",
  neutral: "text-muted-foreground",
};

export function TimelineTab({ campaignId }: TimelineTabProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();

    const channel = resilientChannel(supabase, `timeline:${campaignId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_highlights',
        filter: `campaign_id=eq.${campaignId}`
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('session_highlights')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching timeline events:', error);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-cinzel">Campaign Timeline</CardTitle>
              <CardDescription>Chronicle your adventures</CardDescription>
            </div>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : events.length === 0 ? (
        <Card className="bg-card/50 border-brass/20">
          <CardContent className="py-12">
            <div className="text-center space-y-2">
              <Calendar className="w-12 h-12 mx-auto text-brass/50" />
              <p className="text-sm text-muted-foreground">
                No events recorded yet. Start chronicling your campaign's history.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="relative pb-4">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-brass/30" />

            <div className="space-y-6">
              {events.map((event) => {
                const Icon = typeIcons.default;
                const colorClass = event.color ? typeColors[event.color] || typeColors.neutral : typeColors.neutral;
                return (
                  <div key={event.id} className="relative pl-16">
                    {/* Timeline node */}
                    <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-obsidian border-2 border-brass flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-arcanePurple" />
                    </div>

                    <Card className="bg-card/50 border-brass/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Icon className={`w-4 h-4 ${colorClass}`} />
                            <CardTitle className="text-base font-cinzel">{event.text}</CardTitle>
                          </div>
                          {event.session_id && (
                            <Badge variant="outline" className="border-brass/30 shrink-0">
                              Session
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-brass">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.created_at), "MMMM d, yyyy")}</span>
                        </div>
                      </CardHeader>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
