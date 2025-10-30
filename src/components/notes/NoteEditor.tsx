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
import { Save, Pin, X, Check, Trash2, Swords, Target, Lightbulb, Package, BookOpen, MapPin, Clock, Brain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NoteLinkSelector from "./NoteLinkSelector";

const PREDEFINED_TAGS = [
  { name: "NPC", icon: Target, color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400" },
  { name: "Quest", icon: Target, color: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-400" },
  { name: "Clue", icon: Lightbulb, color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-400" },
  { name: "Combat", icon: Swords, color: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400" },
  { name: "Loot", icon: Package, color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400" },
  { name: "Lore", icon: BookOpen, color: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-400" },
  { name: "Location", icon: MapPin, color: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-400" },
  { name: "Downtime", icon: Clock, color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400" },
  { name: "GM Thought", icon: Brain, color: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
];

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

interface NoteLink {
  id?: string;
  link_type: string;
  link_id: string | null;
  label: string;
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
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionOptions, setMentionOptions] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content_markdown || "");
      setVisibility(note.visibility);
      setIsPinned(note.is_pinned);
      setTags(note.tags || []);
      loadLinks(note.id);
    } else {
      setTitle("");
      setContent("");
      setVisibility(isDM ? "DM_ONLY" : "PRIVATE");
      setIsPinned(false);
      setTags([]);
      setLinks([]);
    }
    setLastSaved(null);
  }, [note, open, isDM]);

  const loadLinks = async (noteId: string) => {
    const { data } = await supabase
      .from("note_links")
      .select("*")
      .eq("note_id", noteId);

    if (data) {
      setLinks(data.map(l => ({
        id: l.id,
        link_type: l.link_type,
        link_id: l.link_id,
        label: l.label,
      })));
    }
  };

  const loadMentionOptions = async (search: string) => {
    const options: Array<{ id: string; name: string; type: string }> = [];

    // Fetch NPCs
    const { data: npcs } = await supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (npcs) {
      options.push(...npcs.map(npc => ({ id: npc.id, name: npc.name, type: "npc" })));
    }

    // Fetch Characters
    const { data: characters } = await supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (characters) {
      options.push(...characters.map(char => ({ id: char.id, name: char.name, type: "character" })));
    }

    // Fetch Locations
    const { data: locations } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (locations) {
      options.push(...locations.map(loc => ({ id: loc.id, name: loc.name, type: "location" })));
    }

    // Fetch Quests
    const { data: quests } = await supabase
      .from("quests")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .ilike("title", `%${search}%`)
      .limit(10);
    
    if (quests) {
      options.push(...quests.map(quest => ({ id: quest.id, name: quest.title, type: "quest" })));
    }

    setMentionOptions(options);
  };

  // Save function
  const performSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title to your note",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      let noteId = note?.id;

      if (note) {
        // Update existing note
        const { error } = await supabase
          .from("session_notes")
          .update({
            title,
            content_markdown: content,
            visibility,
            is_pinned: isPinned,
            tags,
            updated_at: new Date().toISOString(),
          })
          .eq("id", note.id);

        if (error) throw error;
      } else {
        // Create new note
        const { data, error } = await supabase.from("session_notes").insert({
          campaign_id: campaignId,
          author_id: userId,
          title,
          content_markdown: content,
          visibility,
          is_pinned: isPinned,
          tags,
        }).select().single();

        if (error) throw error;
        noteId = data.id;
      }

      // Save links
      if (noteId) {
        // Delete existing links
        await supabase.from("note_links").delete().eq("note_id", noteId);

        // Insert new links
        if (links.length > 0) {
          await supabase.from("note_links").insert(
            links.map(link => ({
              note_id: noteId,
              link_type: link.link_type,
              link_id: link.link_id,
              label: link.label,
            }))
          );
        }
      }

      setLastSaved(new Date());
      onSaved();
      toast({
        title: "Note saved",
        description: "Your note has been saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error saving note",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Autosave with debounce (only when enabled)
  const debouncedSave = useCallback(
    debounce(async () => {
      await performSave();
    }, 1500),
    [title, content, visibility, isPinned, tags, note, campaignId, userId, onSaved]
  );

  // Trigger autosave on content change (only when enabled)
  useEffect(() => {
    if (open && autoSaveEnabled && title.trim()) {
      debouncedSave();
    }
  }, [title, content, visibility, isPinned, tags, open, autoSaveEnabled, debouncedSave]);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(newCursorPosition);

    // Check for @ mention
    const textBeforeCursor = newContent.substring(0, newCursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        loadMentionOptions(textAfterAt);
        
        // Position the mention dropdown
        const textarea = e.target;
        const { top, left } = textarea.getBoundingClientRect();
        setMentionPosition({ top: top - 200, left: left + 10 });
        return;
      }
    }
    
    setShowMentions(false);
  };

  const handleMentionSelect = (option: { id: string; name: string; type: string }) => {
    // Find the @ position
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    // Replace @mention with the name
    const beforeMention = content.substring(0, lastAtIndex);
    const afterCursor = content.substring(cursorPosition);
    const newContent = beforeMention + `@${option.name}` + afterCursor;
    
    setContent(newContent);
    setShowMentions(false);
    
    // Add to links if not already there
    const linkExists = links.some(link => link.link_id === option.id && link.link_type === option.type);
    if (!linkExists) {
      setLinks([...links, {
        link_type: option.type,
        link_id: option.id,
        label: option.name,
      }]);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!note) return;

    try {
      const { error } = await supabase
        .from("session_notes")
        .delete()
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully",
      });
      
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error deleting note",
        description: error.message,
        variant: "destructive",
      });
    }
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

          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {isDM && (
                <Button
                  type="button"
                  variant={visibility === "DM_ONLY" ? "default" : "outline"}
                  className={visibility === "DM_ONLY" ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-400" : ""}
                  onClick={() => setVisibility("DM_ONLY")}
                >
                  DM Only
                </Button>
              )}
              <Button
                type="button"
                variant={visibility === "SHARED" ? "default" : "outline"}
                className={visibility === "SHARED" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400" : ""}
                onClick={() => setVisibility("SHARED")}
              >
                Shared
              </Button>
              <Button
                type="button"
                variant={visibility === "PRIVATE" ? "default" : "outline"}
                className={visibility === "PRIVATE" ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400" : ""}
                onClick={() => setVisibility("PRIVATE")}
              >
                Private
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {visibility === "DM_ONLY" && "Visible only to you as DM"}
              {visibility === "SHARED" && "Players can see this in recap/player view"}
              {visibility === "PRIVATE" && "Personal planning. Treated as hidden from players"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned" className="flex items-center gap-1.5">
                <Pin className="w-4 h-4" />
                Pin this note
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="autosave"
                checked={autoSaveEnabled}
                onCheckedChange={setAutoSaveEnabled}
              />
              <Label htmlFor="autosave">Auto-save</Label>
            </div>
          </div>

          <div className="relative">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={handleContentChange}
              placeholder="Write your note here... Type @ to mention NPCs, characters, locations, or quests"
              className="min-h-[300px] font-mono"
            />
            
            {showMentions && mentionOptions.length > 0 && (
              <div 
                className="absolute z-50 w-64 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                style={{ top: mentionPosition.top, left: mentionPosition.left }}
              >
                {mentionOptions.map((option) => (
                  <button
                    key={`${option.type}-${option.id}`}
                    onClick={() => handleMentionSelect(option)}
                    className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2"
                  >
                    <Badge variant="outline" className="text-xs">
                      {option.type}
                    </Badge>
                    <span>{option.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PREDEFINED_TAGS.map((tagDef) => {
                const isSelected = tags.includes(tagDef.name);
                const TagIcon = tagDef.icon;
                return (
                  <Button
                    key={tagDef.name}
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    className={`rounded-full ${isSelected ? tagDef.color : ""}`}
                    onClick={() => {
                      if (isSelected) {
                        handleRemoveTag(tagDef.name);
                      } else {
                        setTags([...tags, tagDef.name]);
                      }
                    }}
                  >
                    <TagIcon className="w-3 h-3 mr-1.5" />
                    {tagDef.name}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="customTags">Custom Tags</Label>
            <Input
              id="customTags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter to add custom tags..."
              className="mt-2"
            />
            {tags.filter(tag => !PREDEFINED_TAGS.some(pt => pt.name === tag)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.filter(tag => !PREDEFINED_TAGS.some(pt => pt.name === tag)).map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-full">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1.5 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label>Linked Entities</Label>
            <NoteLinkSelector
              campaignId={campaignId}
              links={links}
              onChange={setLinks}
            />
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
            <div className="flex gap-2">
              {note && (
                <Button 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  className="mr-auto"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button variant="outline" onClick={performSave} disabled={isSaving || !title.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{note?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default NoteEditor;
