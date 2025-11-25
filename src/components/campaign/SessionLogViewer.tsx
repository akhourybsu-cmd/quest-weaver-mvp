import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Clock, 
  FileText, 
  Download,
  Calendar,
  Scroll,
  Pin,
  Eye,
  Lock,
  Users
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SessionLogViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  sessionDate: string;
  sessionName?: string | null;
}

interface SessionNote {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
  created_at: string;
}

export function SessionLogViewer({ open, onOpenChange, sessionId, sessionDate, sessionName }: SessionLogViewerProps) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [sessionNotes, setSessionNotes] = useState<SessionNote[]>([]);

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

      // Fetch notes linked to this session
      const { data: notesData, error: notesError } = await supabase
        .from("session_notes")
        .select("id, title, content_markdown, visibility, tags, is_pinned, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (notesError) throw notesError;
      setSessionNotes((notesData || []).map(n => ({
        ...n,
        visibility: n.visibility as "DM_ONLY" | "SHARED" | "PRIVATE"
      })));
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

  const getDisplayName = () => {
    if (sessionName) return sessionName;
    if (session?.name) return session.name;
    return format(new Date(sessionDate), "MMMM d, yyyy");
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "DM_ONLY": return <Eye className="w-3 h-3" />;
      case "SHARED": return <Users className="w-3 h-3" />;
      case "PRIVATE": return <Lock className="w-3 h-3" />;
      default: return null;
    }
  };

  const getVisibilityClass = (visibility: string) => {
    switch (visibility) {
      case "DM_ONLY": return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400";
      case "SHARED": return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400";
      case "PRIVATE": return "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400";
      default: return "";
    }
  };

  const exportLog = () => {
    if (!session) return;

    let markdown = `# Session Log - ${getDisplayName()}

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

    if (sessionNotes.length > 0) {
      markdown += `\n## Notes Created This Session\n`;
      sessionNotes.forEach(note => {
        markdown += `\n### ${note.title}\n`;
        if (note.tags.length > 0) {
          markdown += `Tags: ${note.tags.join(", ")}\n`;
        }
        markdown += `\n${note.content_markdown || ""}\n`;
      });
    }

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
          <DialogTitle className="font-cinzel">{getDisplayName()}</DialogTitle>
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
              <TabsTrigger value="notes">
                Notes ({sessionNotes.length})
              </TabsTrigger>
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
                      <Badge variant="outline">{session?.status}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {session?.goals && (
                  <Card className="bg-card/50 border-brass/20">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Scroll className="w-4 h-4 text-arcanePurple" />
                        Session Goals
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {session.goals}
                      </p>
                    </CardContent>
                  </Card>
                )}

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

            <TabsContent value="notes" className="flex-1 overflow-auto">
              <ScrollArea className="h-[400px]">
                {sessionNotes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notes were created during this session</p>
                  </div>
                ) : (
                  <div className="space-y-3 pr-4">
                    {sessionNotes.map((note) => (
                      <Card key={note.id} className="bg-card/50 border-brass/20">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {note.is_pinned && <Pin className="w-3 h-3 text-amber-500" />}
                                <h4 className="font-medium">{note.title}</h4>
                              </div>
                              {note.content_markdown && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {note.content_markdown.slice(0, 150)}
                                  {note.content_markdown.length > 150 && "..."}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge variant="outline" className={`text-xs ${getVisibilityClass(note.visibility)}`}>
                                  {getVisibilityIcon(note.visibility)}
                                  <span className="ml-1">{note.visibility.replace("_", " ")}</span>
                                </Badge>
                                {note.tags.slice(0, 3).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {format(new Date(note.created_at), "h:mm a")}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
