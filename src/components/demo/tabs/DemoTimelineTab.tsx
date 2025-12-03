import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoTimeline } from "@/lib/demoAdapters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Swords, Scroll, Users, Crown } from "lucide-react";
import { format } from "date-fns";

interface DemoTimelineTabProps {
  campaign: DemoCampaign;
}

const eventTypeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  combat: { label: "Combat", icon: <Swords className="w-4 h-4" />, color: "bg-red-500/10 text-red-400 border-red-500/30" },
  quest: { label: "Quest", icon: <Scroll className="w-4 h-4" />, color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  social: { label: "Social", icon: <Users className="w-4 h-4" />, color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  political: { label: "Political", icon: <Crown className="w-4 h-4" />, color: "bg-purple-500/10 text-purple-400 border-purple-500/30" },
};

export function DemoTimelineTab({ campaign }: DemoTimelineTabProps) {
  const timeline = adaptDemoTimeline(campaign);
  
  // Sort by date descending (most recent first)
  const sortedTimeline = [...timeline].sort(
    (a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-brass" />
        <h2 className="text-xl font-cinzel text-brass">Campaign Timeline</h2>
      </div>

      {sortedTimeline.length === 0 ? (
        <Card className="border-brass/20">
          <CardContent className="py-8 text-center text-muted-foreground">
            No timeline events recorded
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brass/20" />
          
          <div className="space-y-4">
            {sortedTimeline.map((event, index) => {
              const config = eventTypeConfig[event.event_type] || eventTypeConfig.quest;
              
              return (
                <div key={event.id} className="relative pl-12">
                  {/* Timeline dot */}
                  <div className="absolute left-2 top-4 w-4 h-4 rounded-full bg-brass/30 border-2 border-brass flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-brass" />
                  </div>
                  
                  <Card className="border-brass/20 hover:border-brass/40 transition-colors">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={config.color}>
                              {config.icon}
                              <span className="ml-1">{config.label}</span>
                            </Badge>
                            {event.session_number && (
                              <Badge variant="secondary" className="text-xs">
                                Session {event.session_number}
                              </Badge>
                            )}
                          </div>
                          
                          <h3 className="font-cinzel font-semibold">{event.title}</h3>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                        
                        <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(event.event_date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
