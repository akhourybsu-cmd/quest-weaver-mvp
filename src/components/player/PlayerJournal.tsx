import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Trash2, BookOpen, Search, ArrowLeft, Save } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { PlayerEmptyState } from "./PlayerEmptyState";

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  created_at: string;
  updated_at: string;
}

interface PlayerJournalProps {
  campaignId: string;
  characterId: string;
}

export function PlayerJournal({ campaignId, characterId }: PlayerJournalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNew, setIsNew] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel('player-journal')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_notes',
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => fetchNotes()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [campaignId]);

  const fetchNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('session_notes')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('author_id', user.id)
      .eq('visibility', 'PRIVATE')
      .order('updated_at', { ascending: false });

    if (error) {
      toast({ title: "Error loading journal", description: error.message, variant: "destructive" });
      return;
    }
    setNotes(data || []);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Title required", description: "Please enter a title for your entry", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (isNew) {
      const { error } = await supabase.from('session_notes').insert({
        campaign_id: campaignId,
        author_id: user.id,
        title: title.trim(),
        content_markdown: content.trim(),
        visibility: 'PRIVATE',
      });
      if (error) {
        toast({ title: "Error creating entry", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Entry created" });
    } else if (selectedNote) {
      const { error } = await supabase.from('session_notes').update({
        title: title.trim(),
        content_markdown: content.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', selectedNote.id);
      if (error) {
        toast({ title: "Error saving", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Entry saved" });
    }

    setIsNew(false);
    setSelectedNote(null);
    setTitle("");
    setContent("");
    if (isMobile) setMobileSheetOpen(false);
    fetchNotes();
  };

  const handleDelete = async (noteId: string) => {
    const { error } = await supabase.from('session_notes').delete().eq('id', noteId);
    if (error) {
      toast({ title: "Error deleting", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Entry deleted" });
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setTitle("");
      setContent("");
    }
    if (isMobile) setMobileSheetOpen(false);
    fetchNotes();
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setIsNew(false);
    setTitle(note.title);
    setContent(note.content_markdown);
    if (isMobile) setMobileSheetOpen(true);
  };

  const startNew = () => {
    setSelectedNote(null);
    setIsNew(true);
    setTitle("");
    setContent("");
    if (isMobile) setMobileSheetOpen(true);
  };

  const filteredNotes = notes.filter(note => {
    const q = searchQuery.toLowerCase();
    return note.title.toLowerCase().includes(q) || note.content_markdown.toLowerCase().includes(q);
  });

  if (notes.length === 0 && !isNew) {
    return (
      <div className="space-y-4">
        <PlayerEmptyState
          icon={BookOpen}
          title="No Journal Entries"
          description="Start documenting your adventure — track clues, plans, and session recaps."
        />
        <div className="flex justify-center">
          <Button onClick={startNew} className="bg-brass hover:bg-brass/90 text-brass-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>
    );
  }

  const editorPanel = (
    <div className="flex flex-col gap-3 h-full">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Entry title..."
        className="font-cinzel text-lg border-brass/30 focus-visible:ring-brass"
      />
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your thoughts, observations, plans..."
        className="flex-1 min-h-0 resize-none border-brass/30 focus-visible:ring-brass"
      />
      <div className="flex items-center gap-2 shrink-0">
        <Button onClick={handleSave} className="bg-brass hover:bg-brass/90 text-brass-foreground">
          <Save className="w-4 h-4 mr-2" />
          {isNew ? "Create" : "Save"}
        </Button>
        {selectedNote && (
          <Button variant="destructive" size="sm" onClick={() => handleDelete(selectedNote.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => { setSelectedNote(null); setIsNew(false); setTitle(""); setContent(""); if (isMobile) setMobileSheetOpen(false); }}>
          Cancel
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile editor sheet */}
      <Sheet open={mobileSheetOpen} onOpenChange={(open) => { if (!open) { setMobileSheetOpen(false); } }}>
        <SheetContent side="bottom" className="h-[90vh] flex flex-col p-0">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setMobileSheetOpen(false)} className="shrink-0">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <SheetTitle className="font-cinzel text-lg truncate">
                {isNew ? "New Entry" : selectedNote?.title}
              </SheetTitle>
            </div>
          </SheetHeader>
          <Separator />
          <div className="flex-1 min-h-0 p-4">
            {editorPanel}
          </div>
        </SheetContent>
      </Sheet>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)] min-h-[300px]">
        {/* Left: Note list */}
        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search journal..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Button size="icon" onClick={startNew} className="bg-brass hover:bg-brass/90 text-brass-foreground shrink-0">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 min-h-0">
            <div className="space-y-2 pr-2">
              {filteredNotes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No entries match your search</p>
                </div>
              ) : (
                filteredNotes.map(note => (
                  <Card key={note.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedNote?.id === note.id ? 'border-brass bg-brass/5' : 'border-border'
                    }`}
                    onClick={() => openNote(note)}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-cinzel">{note.title}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {note.content_markdown || "No content"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 pb-3">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.updated_at), 'MMM d, yyyy')}
                      </span>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right: Editor — desktop only */}
        <div className="lg:col-span-2 hidden lg:flex flex-col min-h-0">
          {(selectedNote || isNew) ? (
            <Card className="flex flex-col flex-1 min-h-0 border-brass/20">
              <CardContent className="flex-1 min-h-0 p-6 flex flex-col">
                {editorPanel}
              </CardContent>
            </Card>
          ) : (
            <Card className="flex-1 border-dashed flex items-center justify-center border-brass/30">
              <CardContent className="flex flex-col items-center justify-center text-center py-16">
                <BookOpen className="w-16 h-16 text-brass/40 mb-4" />
                <h3 className="font-cinzel text-lg font-semibold mb-2">Select or create an entry</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Pick a journal entry from the list, or create a new one to start writing.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
