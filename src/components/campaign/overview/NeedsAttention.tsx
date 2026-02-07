import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Users, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface NeedsAttentionProps {
  campaignId: string;
  demoMode?: boolean;
  onNavigate: (tab: string) => void;
}

interface AttentionItem {
  icon: React.ElementType;
  label: string;
  tab: string;
  color: string;
}

export function NeedsAttention({ campaignId, demoMode, onNavigate }: NeedsAttentionProps) {
  const [items, setItems] = useState<AttentionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoMode) {
      setItems([]);
      setLoading(false);
      return;
    }
    checkAttention();
  }, [campaignId, demoMode]);

  const checkAttention = async () => {
    try {
      const attention: AttentionItem[] = [];

      const [emptyNpcs, unpreparedSessions] = await Promise.all([
        supabase
          .from("characters")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .is("user_id", null)
          .or("notes.is.null,notes.eq."),
        // Scheduled sessions with no prep checklist
        supabase
          .from("campaign_sessions")
          .select("*", { count: "exact", head: true })
          .eq("campaign_id", campaignId)
          .eq("status", "scheduled")
          .is("prep_checklist", null),
      ]);

      if (emptyNpcs.count && emptyNpcs.count > 0) {
        attention.push({
          icon: Users,
          label: `${emptyNpcs.count} NPC${emptyNpcs.count > 1 ? "s" : ""} without descriptions`,
          tab: "npcs",
          color: "text-teal-400",
        });
      }

      if (unpreparedSessions.count && unpreparedSessions.count > 0) {
        attention.push({
          icon: Calendar,
          label: `${unpreparedSessions.count} session${unpreparedSessions.count > 1 ? "s" : ""} missing prep checklist`,
          tab: "sessions",
          color: "text-blue-400",
        });
      }

      setItems(attention);
    } catch (error) {
      console.error("Failed to check attention items:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || items.length === 0) return null;

  return (
    <Card className="bg-card/50 border-amber-500/20">
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Needs Attention
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {items.map((item, i) => {
            const Icon = item.icon;
            return (
              <button
                key={i}
                onClick={() => onNavigate(item.tab)}
                className="flex items-center gap-3 py-2 px-2 rounded-md hover:bg-accent/30 transition-colors w-full text-left"
              >
                <Icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
