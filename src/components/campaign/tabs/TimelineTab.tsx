import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Calendar, Plus, Filter, Eye, EyeOff, Download, Loader2 } from "lucide-react";
import { DMEmptyState } from "@/components/campaign/DMEmptyState";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";
import { TimelineEventCard, TimelineEvent } from "@/components/timeline/TimelineEventCard";
import { AddTimelineEventDialog } from "@/components/timeline/AddTimelineEventDialog";

interface TimelineTabProps {
  campaignId: string;
}

type FilterKind = 'all' | 'highlight' | 'combat' | 'quest' | 'social' | 'discovery';

const filterOptions: { value: FilterKind; label: string }[] = [
  { value: 'all', label: 'All Events' },
  { value: 'highlight', label: 'Highlights' },
  { value: 'combat', label: 'Combat' },
  { value: 'quest', label: 'Quests' },
  { value: 'social', label: 'NPCs & Social' },
  { value: 'discovery', label: 'Discoveries' },
];

const filterKindMap: Record<FilterKind, string[]> = {
  all: [],
  highlight: ['highlight', 'custom'],
  combat: ['encounter_start', 'encounter_end'],
  quest: ['quest_created', 'quest_completed', 'quest_objective'],
  social: ['npc_appearance', 'note_created'],
  discovery: ['location_discovered', 'item_gained'],
};

export function TimelineTab({ campaignId }: TimelineTabProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterKind>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<TimelineEvent | null>(null);
  const [eventToDelete, setEventToDelete] = useState<TimelineEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchLiveSession();

    const channel = resilientChannel(supabase, `timeline:${campaignId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'timeline_events',
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
        .from('timeline_events')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('occurred_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      console.error('Error fetching timeline events:', error);
      toast.error('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveSession = async () => {
    try {
      const { data } = await supabase
        .from('campaigns')
        .select('live_session_id')
        .eq('id', campaignId)
        .single();
      
      setLiveSessionId(data?.live_session_id || null);
    } catch (error) {
      console.error('Error fetching live session:', error);
    }
  };

  const toggleVisibility = async (event: TimelineEvent) => {
    try {
      const { error } = await supabase
        .from('timeline_events')
        .update({ player_visible: !event.player_visible })
        .eq('id', event.id);

      if (error) throw error;
      
      setEvents(events.map(e => 
        e.id === event.id ? { ...e, player_visible: !e.player_visible } : e
      ));
      
      toast.success(event.player_visible ? 'Hidden from players' : 'Visible to players');
    } catch (error: any) {
      toast.error('Failed to update visibility');
    }
  };

  const handleEdit = (event: TimelineEvent) => {
    setEventToEdit(event);
    setShowAddDialog(true);
  };

  const handleDeleteClick = (event: TimelineEvent) => {
    setEventToDelete(event);
  };

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('timeline_events')
        .delete()
        .eq('id', eventToDelete.id);

      if (error) throw error;

      toast.success('Event deleted');
      setEventToDelete(null);
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleting(false);
    }
  };

  const exportTimeline = () => {
    const markdown = events
      .filter(e => filter === 'all' || filterKindMap[filter].includes(e.kind))
      .map(e => {
        const date = format(new Date(e.occurred_at), "MMM d, yyyy");
        const gameDate = e.in_game_date ? ` (${e.in_game_date})` : '';
        return `### ${e.title}${gameDate}\n*${date}*\n\n${e.summary || 'No description'}\n`;
      })
      .join('\n---\n\n');

    const blob = new Blob([`# Campaign Timeline\n\n${markdown}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campaign-timeline.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => filterKindMap[filter].includes(e.kind));

  // Group events by date
  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = format(new Date(event.occurred_at), "MMMM d, yyyy");
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-card/50 border-brass/20">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="font-cinzel">Campaign Timeline</CardTitle>
              <CardDescription>Chronicle your adventures</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterKind)}>
                <SelectTrigger className="w-[140px] h-9">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={exportTimeline}>
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={() => { setEventToEdit(null); setShowAddDialog(true); }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Timeline */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredEvents.length === 0 ? (
        <DMEmptyState
          icon={Calendar}
          title="No Events Recorded"
          description={filter === 'all'
            ? "No events recorded yet. Start chronicling your campaign's history."
            : "No events match this filter. Try a different category."}
          actionLabel={filter === 'all' ? "Add First Event" : undefined}
          onAction={filter === 'all' ? () => { setEventToEdit(null); setShowAddDialog(true); } : undefined}
        />
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="relative pb-4">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-brass/30" />

            <div className="space-y-6">
              {Object.entries(groupedEvents).map(([date, dateEvents]) => (
                <div key={date} className="relative">
                  {/* Date marker */}
                  <div className="flex items-center gap-3 mb-3 pl-1">
                    <div className="w-7 h-7 rounded-full bg-brass/20 border-2 border-brass flex items-center justify-center z-10">
                      <Calendar className="w-3.5 h-3.5 text-brass" />
                    </div>
                    <Badge variant="outline" className="border-brass/30 text-brass font-cinzel">
                      {date}
                    </Badge>
                  </div>

                  {/* Events for this date */}
                  <div className="space-y-2 pl-12">
                    {dateEvents.map((event) => (
                      <TimelineEventCard
                        key={event.id}
                        event={event}
                        showVisibility
                        showActions
                        onToggleVisibility={toggleVisibility}
                        onEdit={handleEdit}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      )}

      <AddTimelineEventDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEventToEdit(null);
        }}
        campaignId={campaignId}
        sessionId={liveSessionId}
        eventToEdit={eventToEdit}
        onEventAdded={fetchEvents}
      />

      <AlertDialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Timeline Event?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{eventToDelete?.title}" from the timeline. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Event"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
