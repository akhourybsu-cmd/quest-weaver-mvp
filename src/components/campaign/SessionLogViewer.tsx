import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  Sword, 
  FileText, 
  Package, 
  Trophy, 
  Users,
  Download,
  CheckCircle2,
  XCircle,
  Calendar,
  Scroll
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionDate: string;
}

interface SessionPackNote {
  id: string;
  note_text: string;
  status: string;
}

interface SessionPackQuest {
  id: string;
  quest_id: string;
  status: string;
}

export function SessionLogViewer({ open, onOpenChange, sessionId, sessionDate }: SessionLogViewerProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (open && sessionId) {
      fetchSessionData();
    }
  }, [open, sessionId]);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      // Fetch session details
      const { data: sessionData, error: sessionError } = await supabase
        .from("campaign_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();

      if (sessionError) throw sessionError;
      setSession(sessionData);
    } catch (error: any) {
      console.error("Error fetching session data:", error);
      toast.error("Failed to load session log");
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = () => {
    if (!session?.started_at || !session?.ended_at) return "Unknown";
    
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    const pausedSeconds = session.paused_duration_seconds || 0;
    
    const activeMilliseconds = end - start - (pausedSeconds * 1000);
    const hours = Math.floor(activeMilliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((activeMilliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const exportLog = () => {
    if (!session) return;

    const markdown = `# Session Log - ${format(new Date(sessionDate), "MMM d, yyyy")}

## Session Details
- **Started:** ${session.started_at ? format(new Date(session.started_at), "h:mm a") : "N/A"}
- **Ended:** ${session.ended_at ? format(new Date(session.ended_at), "h:mm a") : "N/A"}
- **Duration:** ${calculateDuration()}
- **Status:** ${session.status}

## Session Notes
${session.session_notes || "No notes recorded"}

## DM Notes
${session.dm_notes || "No DM notes"}
`;

    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session-log-${format(new Date(sessionDate), "yyyy-MM-dd")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Session log exported");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-cinzel">Session Log</DialogTitle>
          <DialogDescription>
            {sessionDate && format(new Date(sessionDate), "MMMM d, yyyy")}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <Tabs defaultValue="summary" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="flex-1 overflow-auto">
              <div className="space-y-4">
                <Card className="bg-card/50 border-brass/20">
                  <CardHeader>
                    <CardTitle className="text-sm font-medium">Session Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-arcanePurple" />
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">{format(new Date(sessionDate), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-arcanePurple" />
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{calculateDuration()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant="outline">{session.status}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {session?.session_notes && (
                  <Card className="bg-card/50 border-brass/20">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-arcanePurple" />
                        Session Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {session.session_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {session?.dm_notes && (
                  <Card className="bg-card/50 border-brass/20">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="w-4 h-4 text-arcanePurple" />
                        DM Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {session.dm_notes}
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Button onClick={exportLog} variant="outline" className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Export as Markdown
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
