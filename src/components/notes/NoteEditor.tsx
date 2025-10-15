import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Pin, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simple debounce implementation
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
}

interface NoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  note: Note | null;
  isDM: boolean;
  userId: string;
  onSaved: () => void;
}

const NoteEditor = ({ open, onOpenChange, campaignId, note, isDM, userId, onSaved }: NoteEditorProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED" | "PRIVATE">("DM_ONLY");
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content_markdown || "");
      setVisibility(note.visibility);
      setIsPinned(note.is_pinned);
      setTags(note.tags || []);
    } else {
      setTitle("");
      setContent("");
      setVisibility(isDM ? "DM_ONLY" : "PRIVATE");
      setIsPinned(false);
      setTags([]);
    }
    setLastSaved(null);
  }, [note, open, isDM]);

  // Autosave with debounce
  const saveNote = useCallback(
    debounce(async (data: { title: string; content: string; visibility: string; isPinned: boolean; tags: string[] }) => {
      if (!data.title.trim()) return;

      setIsSaving(true);
      try {
        if (note) {
          // Update existing note
          const { error } = await supabase
            .from("session_notes")
            .update({
              title: data.title,
              content_markdown: data.content,
              visibility: data.visibility,
              is_pinned: data.isPinned,
              tags: data.tags,
              updated_at: new Date().toISOString(),
            })
            .eq("id", note.id);

          if (error) throw error;
        } else {
          // Create new note
          const { error } = await supabase.from("session_notes").insert({
            campaign_id: campaignId,
            author_id: userId,
            title: data.title,
            content_markdown: data.content,
            visibility: data.visibility,
            is_pinned: data.isPinned,
            tags: data.tags,
          });

          if (error) throw error;
        }

        setLastSaved(new Date());
        onSaved();
      } catch (error: any) {
        toast({
          title: "Error saving note",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }, 1500),
    [note, campaignId, userId, onSaved, toast]
  );

  // Trigger autosave on content change
  useEffect(() => {
    if (open && title.trim()) {
      saveNote({ title, content, visibility, isPinned, tags });
    }
  }, [title, content, visibility, isPinned, tags, open]);

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                <SelectTrigger id="visibility">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isDM && <SelectItem value="DM_ONLY">DM Only</SelectItem>}
                  <SelectItem value="SHARED">Shared with Party</SelectItem>
                  <SelectItem value="PRIVATE">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned" className="flex items-center gap-1">
                <Pin className="w-4 h-4" />
                Pin Note
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your note here... Use @NPC, #Location, !Quest for tags"
              className="min-h-[300px] font-mono"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter to add tags..."
            />
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {isSaving && "Saving..."}
              {!isSaving && lastSaved && (
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NoteEditor;
