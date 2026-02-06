import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Pin, Calendar, FolderOpen, Network, LayoutList } from "lucide-react";
import NoteCard from "./NoteCard";
import NoteEditor from "./NoteEditor";
import NoteGraph from "./NoteGraph";
import { useToast } from "@/hooks/use-toast";
import { resilientChannel } from "@/lib/realtime";

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
  folder: string | null;
}

interface Session {
  id: string;
  name: string | null;
  started_at: string | null;
  status: string;
}

interface NotesBoardProps {
  campaignId: string;
  isDM: boolean;
  userId: string;
}

type GroupMode = "session" | "notebook" | "flat";
type ViewMode = "list" | "graph";

const NotesBoard = ({ campaignId, isDM, userId }: NotesBoardProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "dm" | "shared" | "private" | "pinned">("all");
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [groupMode, setGroupMode] = useState<GroupMode>("session");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();
    loadSessions();

    const channel = resilientChannel(supabase, `session_notes:${campaignId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "session_notes", filter: `campaign_id=eq.${campaignId}` }, () => loadNotes())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  const loadNotes = async () => {
    const { data, error } = await supabase
      .from("session_notes")
      .select("*")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .order("is_pinned", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading notes", description: error.message, variant: "destructive" });
      return;
    }
    setNotes((data || []) as Note[]);
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from("campaign_sessions")
      .select("id, name, started_at, status")
      .eq("campaign_id", campaignId)
      .order("started_at", { ascending: false });

    if (error) {
      toast({ title: "Error loading sessions", description: error.message, variant: "destructive" });
      return;
    }
    setSessions((data || []) as Session[]);
  };

  const sessionMap = new Map(sessions.map(s => [s.id, s]));

  const getSessionDisplayName = (session: Session | undefined) => {
    if (!session) return "No Session";
    if (session.name) return session.name;
    if (session.started_at) {
      return new Date(session.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }
    return "Session";
  };

  // --- Navigation handler for wikilinks/backlinks ---
  const handleNavigateToNote = useCallback(async (noteId: string) => {
    // Try to find in our loaded notes first
    const targetNote = notes.find(n => n.id === noteId);
    if (targetNote) {
      setSelectedNote(targetNote);
      if (!editorOpen) setEditorOpen(true);
      return;
    }
    // Fetch from DB if not in list (e.g. came from a wikilink)
    const { data } = await supabase
      .from("session_notes")
      .select("*")
      .eq("id", noteId)
      .is("deleted_at", null)
      .single();
    if (data) {
      setSelectedNote(data as Note);
      if (!editorOpen) setEditorOpen(true);
    }
  }, [notes, editorOpen]);

  const filteredNotes = notes.filter((note) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content_markdown?.toLowerCase().includes(query) ||
        note.tags.some(tag => tag.toLowerCase().includes(query));
      if (!matchesSearch) return false;
    }
    switch (filter) {
      case "mine": if (note.author_id !== userId) return false; break;
      case "dm": if (note.visibility !== "DM_ONLY") return false; break;
      case "shared": if (note.visibility !== "SHARED") return false; break;
      case "private": if (note.visibility !== "PRIVATE") return false; break;
      case "pinned": if (!note.is_pinned) return false; break;
    }
    if (sessionFilter === "none") { if (note.session_id !== null) return false; }
    else if (sessionFilter !== "all") { if (note.session_id !== sessionFilter) return false; }
    return true;
  });

  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.is_pinned);

  const notesBySession = unpinnedNotes.reduce((acc, note) => {
    const sid = note.session_id || "no-session";
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const notesByFolder = unpinnedNotes.reduce((acc, note) => {
    const f = note.folder || "Unfiled";
    if (!acc[f]) acc[f] = [];
    acc[f].push(note);
    return acc;
  }, {} as Record<string, Note[]>);

  const handleNewNote = () => { setSelectedNote(null); setEditorOpen(true); };
  const handleEditNote = (note: Note) => { setSelectedNote(note); setEditorOpen(true); };
  const handleGraphNoteSelect = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (note) handleEditNote(note);
  };

  const renderGroupedNotes = () => {
    if (groupMode === "flat") {
      return (
        <div className="grid gap-3">
          {unpinnedNotes.map(note => (
            <NoteCard key={note.id} note={note} onClick={() => handleEditNote(note)} isDM={isDM}
              isOwner={note.author_id === userId} campaignId={campaignId}
              session={note.session_id ? sessionMap.get(note.session_id) : null} />
          ))}
        </div>
      );
    }

    if (groupMode === "notebook") {
      const sortedFolders = Object.keys(notesByFolder).sort((a, b) => {
        if (a === "Unfiled") return 1;
        if (b === "Unfiled") return -1;
        return a.localeCompare(b);
      });
      return (
        <div className="space-y-6">
          {sortedFolders.map(folder => (
            <div key={folder} className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <div className="text-sm font-semibold text-foreground">{folder}</div>
                <Badge variant="secondary" className="text-xs">{notesByFolder[folder].length}</Badge>
              </div>
              <div className="grid gap-3">
                {notesByFolder[folder].map(note => (
                  <NoteCard key={note.id} note={note} onClick={() => handleEditNote(note)} isDM={isDM}
                    isOwner={note.author_id === userId} campaignId={campaignId}
                    session={note.session_id ? sessionMap.get(note.session_id) : null} />
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {filter === "all" && pinnedNotes.length > 0 && (
          <div className="text-sm font-medium text-muted-foreground pt-3 border-t">Recent Notes</div>
        )}
        {Object.entries(notesBySession).map(([sid, sessionNotes]) => {
          const session = sid !== "no-session" ? sessionMap.get(sid) : undefined;
          return (
            <div key={sid} className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brass" />
                <div className="text-sm font-semibold text-foreground">
                  {session ? getSessionDisplayName(session) : "General Notes"}
                </div>
                <Badge variant="secondary" className="text-xs">{sessionNotes.length}</Badge>
              </div>
              <div className="grid gap-3">
                {sessionNotes.map(note => (
                  <NoteCard key={note.id} note={note} onClick={() => handleEditNote(note)} isDM={isDM}
                    isOwner={note.author_id === userId} campaignId={campaignId} session={session} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="border-border/50 shadow-sm bg-card/50 border-brass/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-cinzel">Session Notes</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button size="sm" variant={viewMode === "list" ? "default" : "ghost"} className="h-8 rounded-none px-2.5" onClick={() => setViewMode("list")}>
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button size="sm" variant={viewMode === "graph" ? "default" : "ghost"} className="h-8 rounded-none px-2.5" onClick={() => setViewMode("graph")}>
                <Network className="w-4 h-4" />
              </Button>
            </div>
            <Button size="sm" onClick={handleNewNote}>
              <Plus className="w-4 h-4 mr-2" />New Note
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notes, tags, NPCs..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 rounded-lg" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={sessionFilter} onValueChange={setSessionFilter}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <Calendar className="w-3 h-3 mr-2" /><SelectValue placeholder="Filter by session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="none">No Session</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id}>
                    {getSessionDisplayName(session)}
                    {session.status && <span className="ml-1 text-muted-foreground">({session.status})</span>}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {viewMode === "list" && (
              <div className="flex items-center border rounded-md overflow-hidden">
                <Button size="sm" variant={groupMode === "session" ? "default" : "ghost"} className="h-8 rounded-none text-xs px-2.5" onClick={() => setGroupMode("session")}>
                  <Calendar className="w-3 h-3 mr-1" />Session
                </Button>
                <Button size="sm" variant={groupMode === "notebook" ? "default" : "ghost"} className="h-8 rounded-none text-xs px-2.5" onClick={() => setGroupMode("notebook")}>
                  <FolderOpen className="w-3 h-3 mr-1" />Notebook
                </Button>
                <Button size="sm" variant={groupMode === "flat" ? "default" : "ghost"} className="h-8 rounded-none text-xs px-2.5" onClick={() => setGroupMode("flat")}>
                  <LayoutList className="w-3 h-3 mr-1" />Flat
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {viewMode === "graph" ? (
          <NoteGraph campaignId={campaignId} onNoteSelect={handleGraphNoteSelect} />
        ) : (
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="space-y-4">
            <TabsList className="grid w-full grid-cols-6 rounded-lg">
              <TabsTrigger value="all" className="rounded-md text-xs">All</TabsTrigger>
              <TabsTrigger value="mine" className="rounded-md text-xs">Mine</TabsTrigger>
              {isDM && <TabsTrigger value="dm" className="rounded-md text-xs">DM</TabsTrigger>}
              <TabsTrigger value="shared" className="rounded-md text-xs">Shared</TabsTrigger>
              <TabsTrigger value="private" className="rounded-md text-xs">Private</TabsTrigger>
              <TabsTrigger value="pinned" className="rounded-md text-xs"><Pin className="w-4 h-4" /></TabsTrigger>
            </TabsList>
            <TabsContent value={filter} className="mt-0 space-y-6">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-lg">No notes found</p>
                  {filter !== "all" && <p className="text-sm mt-2">Try a different filter or create a new note</p>}
                </div>
              ) : (
                <>
                  {pinnedNotes.length > 0 && filter === "all" && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Pin className="w-4 h-4 text-amber-600 fill-amber-500" /><span>Pinned</span>
                      </div>
                      <div className="grid gap-3">
                        {pinnedNotes.map(note => (
                          <NoteCard key={note.id} note={note} onClick={() => handleEditNote(note)} isDM={isDM}
                            isOwner={note.author_id === userId} campaignId={campaignId}
                            session={note.session_id ? sessionMap.get(note.session_id) : null} />
                        ))}
                      </div>
                    </div>
                  )}
                  {Object.keys(groupMode === "notebook" ? notesByFolder : groupMode === "flat" ? { all: unpinnedNotes } : notesBySession).length > 0 && renderGroupedNotes()}
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <NoteEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        campaignId={campaignId}
        note={selectedNote}
        isDM={isDM}
        userId={userId}
        onSaved={loadNotes}
        onNavigateToNote={handleNavigateToNote}
      />
    </Card>
  );
};

export default NotesBoard;
