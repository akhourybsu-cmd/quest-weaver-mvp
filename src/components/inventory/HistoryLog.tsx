import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRightLeft,
  Plus,
  Minus,
  Sparkles,
  Trash2,
  FileEdit,
} from "lucide-react";

interface HistoryLogProps {
  campaignId: string;
}

const eventIcons = {
  CREATE: Plus,
  TRADE: ArrowRightLeft,
  CONSUME: Minus,
  ATTUNE: Sparkles,
  DETUNE: Sparkles,
  DESTROY: Trash2,
  RENAME: FileEdit,
  SPLIT: Minus,
  MERGE: Plus,
  CHARGE_USE: Minus,
  CHARGE_RESTORE: Plus,
  NOTE: FileEdit,
};

const eventColors = {
  CREATE: "text-green-500",
  TRADE: "text-blue-500",
  CONSUME: "text-orange-500",
  ATTUNE: "text-purple-500",
  DETUNE: "text-zinc-500",
  DESTROY: "text-red-500",
  RENAME: "text-sky-500",
  SPLIT: "text-amber-500",
  MERGE: "text-emerald-500",
  CHARGE_USE: "text-rose-500",
  CHARGE_RESTORE: "text-teal-500",
  NOTE: "text-indigo-500",
};

const HistoryLog = ({ campaignId }: HistoryLogProps) => {
  const [events, setEvents] = useState<any[]>([]);
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, [campaignId]);

  const loadEvents = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("holding_events")
      .select(`
        *,
        items (name, type)
      `)
      .eq("campaign_id", campaignId)
      .order("occurred_at", { ascending: false })
      .limit(100);

    if (data) setEvents(data);
    setLoading(false);
  };

  const filteredEvents = events.filter((event) => {
    const matchesType = filterType === "all" || event.event_type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      event.items.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading history...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Search Items</Label>
          <Input
            placeholder="Filter by item name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Event Type</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="CREATE">Created</SelectItem>
              <SelectItem value="TRADE">Transferred</SelectItem>
              <SelectItem value="CONSUME">Consumed</SelectItem>
              <SelectItem value="ATTUNE">Attuned</SelectItem>
              <SelectItem value="DETUNE">Un-attuned</SelectItem>
              <SelectItem value="DESTROY">Destroyed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No events found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => {
            const Icon = eventIcons[event.event_type as keyof typeof eventIcons] || FileEdit;
            const colorClass = eventColors[event.event_type as keyof typeof eventColors] || "text-zinc-500";

            return (
              <Card key={event.id}>
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 ${colorClass}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{event.items.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {getEventDescription(event)}
                          </p>
                        </div>
                        <Badge variant="secondary">{event.event_type}</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(event.occurred_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {event.quantity_delta !== 0 && (
                          <span>
                            Qty: {event.quantity_delta > 0 ? "+" : ""}
                            {event.quantity_delta}
                          </span>
                        )}
                      </div>

                      {event.payload?.reason && (
                        <p className="text-sm italic text-muted-foreground">
                          "{event.payload.reason}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

function getEventDescription(event: any): string {
  switch (event.event_type) {
    case "CREATE":
      return `Added to ${event.to_owner_type.toLowerCase()}`;
    case "TRADE":
      const from = event.from_owner_type?.toLowerCase() || "unknown";
      const to = event.to_owner_type?.toLowerCase() || "unknown";
      return `Transferred from ${from} to ${to}`;
    case "CONSUME":
      return "Item consumed";
    case "ATTUNE":
      return "Item attuned";
    case "DETUNE":
      return "Attunement removed";
    case "DESTROY":
      return "Item destroyed";
    case "CHARGE_USE":
      return "Charge used";
    case "CHARGE_RESTORE":
      return "Charge restored";
    default:
      return event.event_type.toLowerCase();
  }
}

export default HistoryLog;
