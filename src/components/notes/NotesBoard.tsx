import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Pin } from "lucide-react";
import NoteCard from "./NoteCard";
import NoteEditor from "./NoteEditor";
import { useToast } from "@/hooks/use-toast";

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author_id: string;
  session_id: string | null;
}

interface Session {
  id: string;
  title: string;
  session_number: number;
  session_date: string;
}

interface NotesBoardProps {
  campaignId: string;
  isDM: boolean;
  userId: string;
}

const NotesBoard = ({ campaignId, isDM, userId }: NotesBoardProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "dm" | "shared" | "private" | "pinned">("all");
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
    loadSessions();

    const channel = supabase
      .channel(`session_notes:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "session_notes",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadNotes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from("session_notes")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      toast({
        title: "Error loading notes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNotes((data || []) as Note[]);
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("sessions")
      .select("id, title, session_number, session_date")
      .eq("campaign_id", campaignId)
      .order("session_number", { ascending: false });

    if (error) {
      toast({
        title: "Error loading sessions",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setSessions((data || []) as Session[]);
  };

  const filteredNotes = notes.filter((note) => {
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content_markdown?.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }

    // Apply tab filter
    switch (filter) {
      case "mine":
        return note.author_id === userId;
      case "dm":
        return note.visibility === "DM_ONLY";
      case "shared":
        return note.visibility === "SHARED";
      case "private":
        return note.visibility === "PRIVATE";
      case "pinned":
        return note.is_pinned;
      default:
        return true;
    }
  });

  // Separate pinned and unpinned notes
  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.is_pinned);

  // Group unpinned notes by session
  const notesBySession = unpinnedNotes.reduce((acc, note) => {
    const sessionId = note.session_id || "no-session";
    if (!acc[sessionId]) {
      acc[sessionId] = [];
    }
    acc[sessionId].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const handleNewNote = () => {
    setSelectedNote(null);
    setEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditorOpen(true);
  };

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Session Notes</CardTitle>
          <Button size="sm" onClick={handleNewNote}>
            <Plus className="w-4 h-4 mr-2" />
            New Note
          </Button>
        </div>

        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search notes, tags, NPCs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 rounded-lg"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 rounded-lg">
            <TabsTrigger value="all" className="rounded-md">All</TabsTrigger>
            <TabsTrigger value="mine" className="rounded-md">Mine</TabsTrigger>
            <TabsTrigger value="dm" className="rounded-md">DM Only</TabsTrigger>
            <TabsTrigger value="shared" className="rounded-md">Shared</TabsTrigger>
            <TabsTrigger value="private" className="rounded-md">Private</TabsTrigger>
            <TabsTrigger value="pinned" className="rounded-md">
              <Pin className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-0 space-y-6">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg">No notes found</p>
                {filter !== "all" && (
                  <p className="text-sm mt-2">Try a different filter or create a new note</p>
                )}
              </div>
            ) : (
              <>
                {/* Pinned Section */}
                {pinnedNotes.length > 0 && filter === "all" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Pin className="w-4 h-4 text-amber-600 fill-amber-500" />
                      <span>Pinned</span>
                    </div>
                    <div className="grid gap-3">
                      {pinnedNotes.map((note) => (
                        <NoteCard
                          key={note.id}
                          note={note}
                          onClick={() => handleEditNote(note)}
                          isDM={isDM}
                          isOwner={note.author_id === userId}
                          campaignId={campaignId}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes Grouped by Session */}
                {Object.keys(notesBySession).length > 0 && (
                  <div className="space-y-6">
                    {filter === "all" && pinnedNotes.length > 0 && (
                      <div className="text-sm font-medium text-muted-foreground pt-3 border-t">
                        Recent Notes
                      </div>
                    )}
                    {Object.entries(notesBySession).map(([sessionId, sessionNotes]) => {
                      const session = sessions.find(s => s.id === sessionId);
                      return (
                        <div key={sessionId} className="space-y-3">
                          <div className="flex items-center gap-2">
                            <div className="text-sm font-semibold text-foreground">
                              {session ? `Session ${session.session_number}: ${session.title}` : "Unassigned Notes"}
                            </div>
                            {session?.session_date && (
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.session_date).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                          <div className="grid gap-3">
                            {sessionNotes.map((note) => (
                              <NoteCard
                                key={note.id}
                                note={note}
                                onClick={() => handleEditNote(note)}
                                isDM={isDM}
                                isOwner={note.author_id === userId}
                                campaignId={campaignId}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId}
        note={selectedNote}
        isDM={isDM}
        userId={userId}
        onSaved={loadNotes}
      />
    </Card>
  );
};

export default NotesBoard;
