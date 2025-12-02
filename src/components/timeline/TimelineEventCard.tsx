import { 
  Sword, 
  Scroll, 
  Users, 
  Crown, 
  MapPin, 
  Package, 
  BookOpen, 
  Play, 
  Square, 
  Star,
  FileText,
  Eye,
  EyeOff
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export interface TimelineEvent {
  id: string;
  campaign_id: string;
  session_id: string | null;
  kind: string;
  title: string;
  summary: string | null;
  ref_type: string | null;
  ref_id: string | null;
  payload: any;
  occurred_at: string;
  in_game_date: string | null;
  player_visible: boolean;
  created_at: string;
}

interface TimelineEventCardProps {
  event: TimelineEvent;
  showVisibility?: boolean;
  onToggleVisibility?: (event: TimelineEvent) => void;
  onClick?: (event: TimelineEvent) => void;
}

const eventConfig: Record<string, { icon: typeof Sword; color: string; bgColor: string }> = {
  session_start: { icon: Play, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  session_end: { icon: Square, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  encounter_start: { icon: Sword, color: "text-dragonRed", bgColor: "bg-dragonRed/20" },
  encounter_end: { icon: Sword, color: "text-dragonRed/70", bgColor: "bg-dragonRed/10" },
  quest_created: { icon: Scroll, color: "text-arcanePurple", bgColor: "bg-arcanePurple/20" },
  quest_completed: { icon: Scroll, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  quest_objective: { icon: Scroll, color: "text-brass", bgColor: "bg-brass/20" },
  npc_appearance: { icon: Users, color: "text-sky-400", bgColor: "bg-sky-500/20" },
  item_gained: { icon: Package, color: "text-amber-400", bgColor: "bg-amber-500/20" },
  location_discovered: { icon: MapPin, color: "text-emerald-400", bgColor: "bg-emerald-500/20" },
  note_created: { icon: FileText, color: "text-muted-foreground", bgColor: "bg-muted/50" },
  highlight: { icon: Star, color: "text-brass", bgColor: "bg-brass/20" },
  custom: { icon: BookOpen, color: "text-muted-foreground", bgColor: "bg-muted/50" },
};

export function TimelineEventCard({ 
  event, 
  showVisibility = false, 
  onToggleVisibility,
  onClick 
}: TimelineEventCardProps) {
  const config = eventConfig[event.kind] || eventConfig.custom;
  const Icon = config.icon;

  return (
    <Card 
      className={cn(
        "bg-card/50 border-border/50 hover:border-brass/30 transition-colors",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(event)}
    >
      <CardContent className="p-3 flex items-start gap-3">
        <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
          <Icon className={cn("w-4 h-4", config.color)} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground text-sm">{event.title}</span>
            {event.in_game_date && (
              <Badge variant="outline" className="text-xs border-brass/30 text-brass">
                {event.in_game_date}
              </Badge>
            )}
          </div>
          
          {event.summary && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {event.summary}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span>{format(new Date(event.occurred_at), "MMM d, h:mm a")}</span>
            {event.ref_type && (
              <Badge variant="secondary" className="text-xs">
                {event.ref_type}
              </Badge>
            )}
          </div>
        </div>

        {showVisibility && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility?.(event);
            }}
            className="p-1.5 hover:bg-muted rounded transition-colors shrink-0"
            title={event.player_visible ? "Visible to players" : "Hidden from players"}
          >
            {event.player_visible ? (
              <Eye className="w-4 h-4 text-emerald-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
      </CardContent>
    </Card>
  );
}
