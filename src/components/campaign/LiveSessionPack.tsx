import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen,
  Swords,
  Users,
  FileText,
  MapPin,
  Package,
  Play,
  CheckCircle2,
  SkipForward,
  Clock,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PackCard {
  id: string;
  type: "quest" | "encounter" | "npc" | "handout" | "location" | "item";
  refId: string;
  title: string;
  status: "planned" | "in_progress" | "done" | "skipped" | "blocked";
  section: string;
  gmNotes?: string;
  startedAt?: string;
  completedAt?: string;
  plannedOrder: number;
}

interface LiveSessionPackProps {
  sessionId: string;
  campaignId: string;
}

const iconMap = {
  quest: BookOpen,
  encounter: Swords,
  npc: Users,
  handout: FileText,
  location: MapPin,
  item: Package,
};

const statusColors = {
  planned: "bg-secondary text-secondary-foreground",
  in_progress: "bg-primary text-primary-foreground",
  done: "bg-status-buff text-white",
  skipped: "bg-muted text-muted-foreground",
  blocked: "bg-destructive text-destructive-foreground",
};

export function LiveSessionPack({ sessionId, campaignId }: LiveSessionPackProps) {
  const [cards, setCards] = useState<PackCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  useEffect(() => {
    loadCards();

    // Real-time subscriptions
    const channels = [
      "session_quests",
      "session_encounters",
      "session_npcs",
      "session_handouts",
      "session_locations",
      "session_items",
    ].map((table) =>
      supabase
        .channel(`${table}:${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: table,
            filter: `session_id=eq.${sessionId}`,
          },
          () => loadCards()
        )
        .subscribe()
    );

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [sessionId]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const allCards: PackCard[] = [];

      // Load quests
      const { data: quests } = await supabase
        .from("session_quests")
        .select("*, quests(id, title)")
        .eq("session_id", sessionId);

      if (quests) {
        allCards.push(
          ...quests.map((q: any) => ({
            id: q.id,
            type: "quest" as const,
            refId: q.quest_id,
            title: q.quests?.title || "Untitled Quest",
            status: q.status || "planned",
            section: q.section || "mid",
            gmNotes: q.gm_notes,
            startedAt: q.started_at,
            completedAt: q.completed_at,
            plannedOrder: q.planned_order || 0,
          }))
        );
      }

      // Load encounters
      const { data: encounters } = await supabase
        .from("session_encounters")
        .select("*, encounters(id, name)")
        .eq("session_id", sessionId);

      if (encounters) {
        allCards.push(
          ...encounters.map((e: any) => ({
            id: e.id,
            type: "encounter" as const,
            refId: e.encounter_id,
            title: e.encounters?.name || "Untitled Encounter",
            status: e.status || "planned",
            section: e.section || "mid",
            gmNotes: e.gm_notes,
            startedAt: e.started_at,
            completedAt: e.completed_at,
            plannedOrder: e.planned_order || 0,
          }))
        );
      }

      // Load NPCs
      const { data: npcs } = await supabase
        .from("session_npcs")
        .select("*, npcs(id, name)")
        .eq("session_id", sessionId);

      if (npcs) {
        allCards.push(
          ...npcs.map((n: any) => ({
            id: n.id,
            type: "npc" as const,
            refId: n.npc_id,
            title: n.npcs?.name || "Untitled NPC",
            status: n.status || "planned",
            section: n.section || "mid",
            gmNotes: n.gm_notes,
            startedAt: n.started_at,
            completedAt: n.completed_at,
            plannedOrder: n.planned_order || 0,
          }))
        );
      }

      // Load handouts
      const { data: handouts } = await supabase
        .from("session_handouts")
        .select("*, handouts(id, title)")
        .eq("session_id", sessionId);

      if (handouts) {
        allCards.push(
          ...handouts.map((h: any) => ({
            id: h.id,
            type: "handout" as const,
            refId: h.handout_id,
            title: h.handouts?.title || "Untitled Handout",
            status: h.status || "planned",
            section: h.section || "mid",
            gmNotes: h.gm_notes,
            startedAt: h.started_at,
            completedAt: h.completed_at,
            plannedOrder: h.planned_order || 0,
          }))
        );
      }

      // Load locations
      const { data: locations } = await supabase
        .from("session_locations")
        .select("*, locations(id, name)")
        .eq("session_id", sessionId);

      if (locations) {
        allCards.push(
          ...locations.map((l: any) => ({
            id: l.id,
            type: "location" as const,
            refId: l.location_id,
            title: l.locations?.name || "Untitled Location",
            status: l.status || "planned",
            section: l.section || "mid",
            gmNotes: l.gm_notes,
            startedAt: l.started_at,
            completedAt: l.completed_at,
            plannedOrder: l.planned_order || 0,
          }))
        );
      }

      // Load items
      const { data: items } = await supabase
        .from("session_items")
        .select("*, items(id, name)")
        .eq("session_id", sessionId);

      if (items) {
        allCards.push(
          ...items.map((i: any) => ({
            id: i.id,
            type: "item" as const,
            refId: i.item_id,
            title: i.items?.name || "Untitled Item",
            status: i.status || "planned",
            section: i.section || "mid",
            gmNotes: i.gm_notes,
            startedAt: i.started_at,
            completedAt: i.completed_at,
            plannedOrder: i.planned_order || 0,
          }))
        );
      }

      // Sort by status groups, then by planned order
      allCards.sort((a, b) => {
        const statusOrder = { planned: 0, in_progress: 1, done: 2, skipped: 2, blocked: 2 };
        const aOrder = statusOrder[a.status] ?? 0;
        const bOrder = statusOrder[b.status] ?? 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.plannedOrder - b.plannedOrder;
      });

      setCards(allCards);
    } catch (error) {
      console.error("Error loading cards:", error);
      toast.error("Failed to load session pack");
    } finally {
      setLoading(false);
    }
  };

  const updateCardStatus = async (card: PackCard, newStatus: typeof card.status) => {
    const table = `session_${card.type}s`;
    const updates: any = { status: newStatus };

    if (newStatus === "in_progress" && !card.startedAt) {
      updates.started_at = new Date().toISOString();
    }

    if (["done", "skipped"].includes(newStatus) && !card.completedAt) {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await (supabase as any).from(table).update(updates).eq("id", card.id);

    if (error) {
      toast.error("Failed to update card status");
      return;
    }

    // Log event
    await supabase.from("session_log").insert({
      session_id: sessionId,
      card_id: card.id,
      card_type: card.type,
      event: `status_changed_to_${newStatus}`,
      payload: { title: card.title },
    });

    toast.success(`${card.title} marked as ${newStatus.replace("_", " ")}`);
  };

  const addNote = async (card: PackCard, note: string) => {
    const table = `session_${card.type}s`;
    const { error } = await (supabase as any)
      .from(table)
      .update({ gm_notes: note })
      .eq("id", card.id);

    if (error) {
      toast.error("Failed to save note");
      return;
    }

    toast.success("Note saved");
  };

  const groupedCards = {
    planned: cards.filter((c) => c.status === "planned"),
    in_progress: cards.filter((c) => c.status === "in_progress"),
    completed: cards.filter((c) => ["done", "skipped", "blocked"].includes(c.status)),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Planned Column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Planned ({groupedCards.planned.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {groupedCards.planned.map((card) => (
                <PackCardItem
                  key={card.id}
                  card={card}
                  onStatusChange={updateCardStatus}
                  onAddNote={addNote}
                  expanded={expandedCard === card.id}
                  onToggleExpand={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                />
              ))}
              {groupedCards.planned.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No planned items
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* In Play Column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Play className="w-5 h-5" />
            In Play ({groupedCards.in_progress.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {groupedCards.in_progress.map((card) => (
                <PackCardItem
                  key={card.id}
                  card={card}
                  onStatusChange={updateCardStatus}
                  onAddNote={addNote}
                  expanded={expandedCard === card.id}
                  onToggleExpand={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                />
              ))}
              {groupedCards.in_progress.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No items in play
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Completed Column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" />
            Completed ({groupedCards.completed.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3 pr-4">
              {groupedCards.completed.map((card) => (
                <PackCardItem
                  key={card.id}
                  card={card}
                  onStatusChange={updateCardStatus}
                  onAddNote={addNote}
                  expanded={expandedCard === card.id}
                  onToggleExpand={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
                />
              ))}
              {groupedCards.completed.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No completed items
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

interface PackCardItemProps {
  card: PackCard;
  onStatusChange: (card: PackCard, status: PackCard["status"]) => void;
  onAddNote: (card: PackCard, note: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}

function PackCardItem({ card, onStatusChange, onAddNote, expanded, onToggleExpand }: PackCardItemProps) {
  const [noteText, setNoteText] = useState(card.gmNotes || "");
  const Icon = iconMap[card.type];

  return (
    <Card className="border-2 hover:shadow-md transition-shadow">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Icon className="w-4 h-4 mt-1 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{card.title}</h4>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-xs capitalize">
                {card.type}
              </Badge>
              <Badge className={cn("text-xs", statusColors[card.status])}>
                {card.status.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1">
          {card.status === "planned" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs flex-1"
              onClick={() => onStatusChange(card, "in_progress")}
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {card.status === "in_progress" && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => onStatusChange(card, "done")}
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Done
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs flex-1"
                onClick={() => onStatusChange(card, "skipped")}
              >
                <SkipForward className="w-3 h-3 mr-1" />
                Skip
              </Button>
            </>
          )}
        </div>

        {/* Expandable Notes */}
        {expanded && (
          <div className="space-y-2 pt-2 border-t">
            <Textarea
              placeholder="Add GM notes..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="min-h-[80px] text-xs"
            />
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-7 text-xs"
              onClick={() => onAddNote(card, noteText)}
            >
              Save Note
            </Button>
          </div>
        )}

        <Button
          size="sm"
          variant="ghost"
          className="w-full h-7 text-xs"
          onClick={onToggleExpand}
        >
          {expanded ? "Hide Notes" : "Add/View Notes"}
        </Button>
      </CardContent>
    </Card>
  );
}
