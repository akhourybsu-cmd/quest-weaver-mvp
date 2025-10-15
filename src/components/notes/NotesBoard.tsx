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
}

interface NotesBoardProps {
  campaignId: string;
  isDM: boolean;
  userId: string;
}

const NotesBoard = ({ campaignId, isDM, userId }: NotesBoardProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "mine" | "dm" | "shared" | "private" | "pinned">("all");
  const { toast } = useToast();

  useEffect(() => {
    loadNotes();

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

  const handleNewNote = () => {
    setSelectedNote(null);
    setEditorOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setEditorOpen(true);
  };

  return (
    <Card>
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
              placeholder="Search notes, tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mine">Mine</TabsTrigger>
            <TabsTrigger value="dm">DM Only</TabsTrigger>
            <TabsTrigger value="shared">Shared</TabsTrigger>
            <TabsTrigger value="private">Private</TabsTrigger>
            <TabsTrigger value="pinned">
              <Pin className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-4">
            {filteredNotes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No notes found</p>
                {filter !== "all" && (
                  <p className="text-sm mt-1">Try a different filter or create a new note</p>
                )}
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => handleEditNote(note)}
                    isDM={isDM}
                    isOwner={note.author_id === userId}
                  />
                ))}
              </div>
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
