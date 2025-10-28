import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, BookOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();

    const channel = supabase
      .channel('player-notes')
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

    return () => {
      supabase.removeChannel(channel);
    };
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
      toast({
        title: "Error loading notes",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setNotes(data || []);
  };

  const handleCreateNote = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your note",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('session_notes')
      .insert({
        campaign_id: campaignId,
        author_id: user.id,
        title: title.trim(),
        content_markdown: content.trim(),
        visibility: 'PRIVATE',
      });

    if (error) {
      toast({
        title: "Error creating note",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Note created",
      description: "Your journal entry has been saved",
    });

    setTitle("");
    setContent("");
    setIsCreating(false);
    fetchNotes();
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;

    const { error } = await supabase
      .from('session_notes')
      .update({
        title: title.trim(),
        content_markdown: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedNote.id);

    if (error) {
      toast({
        title: "Error updating note",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Note updated",
      description: "Your changes have been saved",
    });

    setSelectedNote(null);
    setTitle("");
    setContent("");
    fetchNotes();
  };

  const handleDeleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('session_notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Note deleted",
      description: "Your journal entry has been removed",
    });

    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setTitle("");
      setContent("");
    }

    fetchNotes();
  };

  const openNote = (note: Note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content_markdown);
  };

  const resetForm = () => {
    setSelectedNote(null);
    setTitle("");
    setContent("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Personal Journal
        </h2>
        <Dialog open={isCreating || selectedNote !== null} onOpenChange={(open) => !open && resetForm()}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedNote ? "Edit Entry" : "New Journal Entry"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="note-title">Title</Label>
                <Input
                  id="note-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entry title..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="note-content">Content</Label>
                <Textarea
                  id="note-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your thoughts, observations, plans..."
                  rows={12}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={selectedNote ? handleUpdateNote : handleCreateNote}>
                {selectedNote ? "Save Changes" : "Create Entry"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No journal entries yet</p>
            <p className="text-sm">Create your first entry to start documenting your adventure</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {notes.map((note) => (
            <Card key={note.id} className="cursor-pointer hover:border-primary transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0" onClick={() => openNote(note)}>
                    <CardTitle className="text-lg mb-2">{note.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.content_markdown || "No content"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">
                    {new Date(note.updated_at).toLocaleDateString()}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
