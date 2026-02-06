import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Save, Pin, X, Check, Trash2, Swords, Target, Lightbulb, Package, BookOpen, MapPin, Clock, Brain, FolderPlus, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Minus, Eye, Copy, History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import NoteLinkSelector from "./NoteLinkSelector";
import NoteFolderSelector from "./NoteFolderSelector";
import WikilinkAutocomplete from "./WikilinkAutocomplete";
import NoteOutline from "./NoteOutline";
import NoteBacklinks from "./NoteBacklinks";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const NOTE_TEMPLATES = {
  combat: {
    name: "Combat Note",
    content: `## Combat Notes

**Round 1:**
- 

**Key Moments:**
- 

**Tactics Used:**
- 

**Outcome:**
- `
  },
  npc: {
    name: "NPC Dialogue",
    content: `## NPC Dialogue: [Name]

**Says:**
- 

**Reveals:**
- 

**Wants:**
- 

**Reaction:**
- `
  },
  clue: {
    name: "Clue",
    content: `## Clue Found

**Location:**
- 

**Description:**
- 

**Significance:**
- 

**Leads To:**
- `
  },
  location: {
    name: "Location",
    content: `## Location: [Name]

**Description:**
- 

**Points of Interest:**
- 

**NPCs Present:**
- 

**Hooks:**
- `
  }
};

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

// Wikilink parser utility
function parseWikilinks(markdown: string): string[] {
  const titles: string[] = [];
  const matches = markdown.matchAll(/\[\[([^\]]+)\]\]/g);
  for (const match of matches) {
    if (!titles.includes(match[1])) titles.push(match[1]);
  }
  return titles;
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

interface NoteRevision {
  id: string;
  version: number;
  title: string;
  content_markdown: string | null;
  tags: string[];
  visibility: string | null;
  folder: string | null;
  saved_by: string;
  saved_at: string;
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
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; session_number: number }>>([]);
  const [showAddToSession, setShowAddToSession] = useState(false);
  const [editorView, setEditorView] = useState<"write" | "preview">("write");
  const [playerPreviewOpen, setPlayerPreviewOpen] = useState(false);
  // Obsidian-style state
  const [folder, setFolder] = useState<string | null>(null);
  const [showWikilinks, setShowWikilinks] = useState(false);
  const [wikilinkSearch, setWikilinkSearch] = useState("");
  const [wikilinkPosition, setWikilinkPosition] = useState({ top: 0, left: 0 });
  // Version tracking & revision history
  const [version, setVersion] = useState(1);
  const [autoSaveCount, setAutoSaveCount] = useState(0);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [revisions, setRevisions] = useState<NoteRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<NoteRevision | null>(null);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, [campaignId]);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content_markdown || "");
      setVisibility(note.visibility);
      setIsPinned(note.is_pinned);
      setTags(note.tags || []);
      loadLinks(note.id);
      loadNoteSession(note.id);
      loadNoteVersion(note.id);
    } else {
      setTitle("");
      setContent("");
      setVisibility(isDM ? "DM_ONLY" : "PRIVATE");
      setIsPinned(false);
      setTags([]);
      setLinks([]);
      setSessionId(null);
      setFolder(null);
      setVersion(1);
    }
    setLastSaved(null);
    setAutoSaveCount(0);
    setShowVersionHistory(false);
    setSelectedRevision(null);
  }, [note, open, isDM]);

  const loadSessions = async () => {
    const { data } = await supabase
      .from("campaign_sessions")
      .select("id, name, started_at, status")
      .eq("campaign_id", campaignId)
      .order("started_at", { ascending: false });
    
    if (data) {
      setSessions(data.map((s, index) => ({
        id: s.id,
        title: s.name || (s.started_at ? new Date(s.started_at).toLocaleDateString() : `Session`),
        session_number: data.length - index,
        status: s.status,
        started_at: s.started_at
      })));
    }
  };

  const loadNoteSession = async (noteId: string) => {
    const { data } = await supabase
      .from("session_notes")
      .select("session_id, folder")
      .eq("id", noteId)
      .single();
    
    if (data) {
      setSessionId(data.session_id);
      setFolder((data as any).folder || null);
    }
  };

  const loadNoteVersion = async (noteId: string) => {
    const { data } = await supabase
      .from("session_notes")
      .select("version")
      .eq("id", noteId)
      .single();
    
    if (data) {
      setVersion((data as any).version || 1);
    }
  };

  const loadRevisions = async (noteId: string) => {
    setLoadingRevisions(true);
    try {
      const { data } = await supabase
        .from("note_revisions")
        .select("*")
        .eq("note_id", noteId)
        .order("version", { ascending: false })
        .limit(50);
      
      setRevisions((data as NoteRevision[]) || []);
    } catch (error) {
      console.error("Error loading revisions:", error);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const createRevision = async (noteId: string, currentVersion: number) => {
    try {
      await supabase.from("note_revisions").insert({
        note_id: noteId,
        version: currentVersion,
        title,
        content_markdown: content,
        tags,
        visibility,
        folder,
        saved_by: userId,
      });
    } catch (error) {
      console.error("Error creating revision:", error);
    }
  };

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

    const { data: npcs } = await supabase
      .from("npcs")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (npcs) {
      options.push(...npcs.map(npc => ({ id: npc.id, name: npc.name, type: "NPC" })));
    }

    const { data: characters } = await supabase
      .from("characters")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (characters) {
      options.push(...characters.map(char => ({ id: char.id, name: char.name, type: "CHARACTER" })));
    }

    const { data: locations } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .ilike("name", `%${search}%`)
      .limit(10);
    
    if (locations) {
      options.push(...locations.map(loc => ({ id: loc.id, name: loc.name, type: "LOCATION" })));
    }

    const { data: quests } = await supabase
      .from("quests")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .ilike("title", `%${search}%`)
      .limit(10);
    
    if (quests) {
      options.push(...quests.map(quest => ({ id: quest.id, name: quest.title, type: "QUEST" })));
    }

    setMentionOptions(options);
  };

  // Resolve wikilinks to note_links entries on save
  const resolveWikilinks = async (noteId: string, contentText: string) => {
    const wikilinkTitles = parseWikilinks(contentText);
    if (wikilinkTitles.length === 0) return;

    // Resolve titles to IDs
    const { data: matchedNotes } = await supabase
      .from("session_notes")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .in("title", wikilinkTitles);

    const titleToId = new Map((matchedNotes || []).map((n: any) => [n.title, n.id]));

    // Build wikilink entries (merged with entity links later)
    const wikilinkEntries: NoteLink[] = wikilinkTitles.map((title) => ({
      link_type: "NOTE",
      link_id: titleToId.get(title) || null,
      label: title,
    }));

    return wikilinkEntries;
  };

  const performSave = async (isAutoSave = false) => {
    if (!title.trim()) {
      if (!isAutoSave) {
        toast({
          title: "Title required",
          description: "Please add a title to your note",
          variant: "destructive",
        });
      }
      return;
    }

    // Normalize tags
    const normalizedTags = tags.map(t => t.trim().toLowerCase());

    setIsSaving(true);
    try {
      let noteId = note?.id;
      let newVersion = version;

      if (note) {
        const { data: updatedData, error } = await supabase
          .from("session_notes")
          .update({
            title,
            content_markdown: content,
            visibility,
            is_pinned: isPinned,
            tags: normalizedTags,
            session_id: sessionId,
            folder,
            version, // Send current version — trigger will reject if stale
            updated_at: new Date().toISOString(),
          })
          .eq("id", note.id)
          .select("version")
          .single();

        if (error) {
          // Check for version conflict
          if (error.message?.includes("Conflict: note was modified")) {
            toast({
              title: "Conflict detected",
              description: "This note was modified by someone else. Please close and reopen to get the latest version.",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }

        newVersion = (updatedData as any)?.version || version + 1;
        setVersion(newVersion);
      } else {
        const { data, error } = await supabase.from("session_notes").insert({
          campaign_id: campaignId,
          author_id: userId,
          title,
          content_markdown: content,
          visibility,
          is_pinned: isPinned,
          tags: normalizedTags,
          session_id: sessionId,
          folder,
        }).select("id, version").single();

        if (error) throw error;
        noteId = data.id;
        newVersion = (data as any).version || 1;
        setVersion(newVersion);
      }

      // Update local tags to normalized form
      setTags(normalizedTags);

      // Save links (entity + wikilinks)
      if (noteId) {
        await supabase.from("note_links").delete().eq("note_id", noteId);

        // Get entity links (non-NOTE types)
        const entityLinks = links.filter((l) => l.link_type !== "NOTE");

        // Resolve wikilinks from content
        const wikilinkEntries = await resolveWikilinks(noteId, content) || [];

        const allLinks = [...entityLinks, ...wikilinkEntries];

        if (allLinks.length > 0) {
          await supabase.from("note_links").insert(
            allLinks.map(link => ({
              note_id: noteId,
              link_type: link.link_type,
              link_id: link.link_id,
              label: link.label,
            }))
          );
        }
      }

      // Create revision (every manual save, or every 5th autosave)
      if (noteId) {
        const nextAutoSaveCount = autoSaveCount + 1;
        if (!isAutoSave || nextAutoSaveCount % 5 === 0) {
          await createRevision(noteId, newVersion);
        }
        if (isAutoSave) {
          setAutoSaveCount(nextAutoSaveCount);
        }
      }

      setLastSaved(new Date());
      onSaved();
      if (!isAutoSave) {
        toast({
          title: "Note saved",
          description: "Your note has been saved successfully",
        });
      }
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

  const debouncedSave = useCallback(
    debounce(async () => {
      await performSave(true);
    }, 1500),
    [title, content, visibility, isPinned, tags, note, campaignId, userId, onSaved, folder, version]
  );

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

  const insertMarkdown = (before: string, after: string = "") => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    const newCursorPosition = e.target.selectionStart;
    setContent(newContent);
    setCursorPosition(newCursorPosition);

    const textBeforeCursor = newContent.substring(0, newCursorPosition);

    // Check for [[ wikilink trigger
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");
    if (lastDoubleBracket !== -1) {
      const textAfterBracket = textBeforeCursor.substring(lastDoubleBracket + 2);
      // Check no closing ]] yet and no newlines
      if (!textAfterBracket.includes("]]") && !textAfterBracket.includes("\n")) {
        setWikilinkSearch(textAfterBracket);
        setShowWikilinks(true);
        setShowMentions(false);
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        setWikilinkPosition({ top: rect.bottom + 5, left: rect.left + 10 });
        return;
      }
    }
    setShowWikilinks(false);

    // Check for @ mention (existing logic)
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        loadMentionOptions(textAfterAt);
        const textarea = e.target;
        const rect = textarea.getBoundingClientRect();
        setMentionPosition({ top: rect.bottom + 5, left: rect.left + 10 });
        return;
      }
    }
    
    setShowMentions(false);
  };

  const handleWikilinkSelect = (noteTitle: string) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");

    const beforeLink = content.substring(0, lastDoubleBracket);
    const afterCursor = content.substring(cursorPosition);
    const newContent = beforeLink + `[[${noteTitle}]]` + afterCursor;

    setContent(newContent);
    setShowWikilinks(false);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastDoubleBracket + noteTitle.length + 4; // [[ + title + ]]
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleScrollToOffset = (offset: number) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(offset, offset);

    // Approximate scroll position
    const lineHeight = 20;
    const linesBefore = content.substring(0, offset).split("\n").length;
    textarea.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
  };

  const handleNavigateToNote = async (targetNoteId: string) => {
    // Load the target note and switch to it
    const { data } = await supabase
      .from("session_notes")
      .select("*")
      .eq("id", targetNoteId)
      .single();

    if (data) {
      // Reset state with the new note
      setTitle(data.title);
      setContent(data.content_markdown || "");
      setVisibility(data.visibility as any);
      setIsPinned(data.is_pinned);
      setTags(data.tags || []);
      setFolder((data as any).folder || null);
      loadLinks(data.id);
      loadNoteSession(data.id);
      // Update the parent's note reference isn't possible directly,
      // but the user can save and reopen. For now, toast feedback:
      toast({
        title: "Navigated to note",
        description: `Now viewing "${data.title}"`,
      });
    }
  };

  const applyTemplate = (templateKey: keyof typeof NOTE_TEMPLATES) => {
    const template = NOTE_TEMPLATES[templateKey];
    setContent(template.content);
    if (!tags.includes(template.name.split(" ")[0])) {
      setTags([...tags, template.name.split(" ")[0]]);
    }
    toast({
      title: "Template applied",
      description: `${template.name} template inserted`,
    });
  };

  const handleMentionSelect = (option: { id: string; name: string; type: string }) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    const beforeMention = content.substring(0, lastAtIndex);
    const afterCursor = content.substring(cursorPosition);
    const newContent = beforeMention + `@${option.name}` + afterCursor;
    
    setContent(newContent);
    setShowMentions(false);
    
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
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", note.id);

      if (error) throw error;

      toast({
        title: "Note moved to trash",
        description: "Your note has been moved to trash",
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

  const handleRestoreRevision = (revision: NoteRevision) => {
    setTitle(revision.title);
    setContent(revision.content_markdown || "");
    setTags(revision.tags || []);
    if (revision.visibility) setVisibility(revision.visibility as any);
    if (revision.folder !== undefined) setFolder(revision.folder);
    setShowVersionHistory(false);
    setSelectedRevision(null);
    toast({
      title: "Revision restored",
      description: `Restored to version ${revision.version}. Save to keep changes.`,
    });
  };

  const handleCopyAsHandout = () => {
    const handoutText = `# ${title}\n\n${content}`;
    navigator.clipboard.writeText(handoutText);
    toast({
      title: 'Copied to clipboard',
      description: 'Note content has been copied as a handout.',
    });
  };

  const getPlayerPreviewContent = () => {
    return content;
  };

  // Custom renderer for wikilinks in preview
  const renderMarkdownWithWikilinks = (text: string) => {
    // Replace [[Note Title]] with styled spans before rendering
    const processed = text.replace(
      /\[\[([^\]]+)\]\]/g,
      '<span class="wikilink" data-title="$1">$1</span>'
    );
    return processed;
  };

  // Custom component for wikilink rendering in ReactMarkdown
  const WikilinkText = ({ children }: { children: React.ReactNode }) => {
    const text = String(children);
    const parts = text.split(/(\[\[[^\]]+\]\])/g);
    
    return (
      <>
        {parts.map((part, i) => {
          const match = part.match(/^\[\[([^\]]+)\]\]$/);
          if (match) {
            return (
              <button
                key={i}
                onClick={() => {
                  // Try to find and navigate to the note
                  const searchTitle = match[1];
                  supabase
                    .from("session_notes")
                    .select("id")
                    .eq("campaign_id", campaignId)
                    .eq("title", searchTitle)
                    .single()
                    .then(({ data }) => {
                      if (data) handleNavigateToNote(data.id);
                    });
                }}
                className="text-primary font-medium hover:underline cursor-pointer bg-primary/10 px-1 rounded"
              >
                {match[1]}
              </button>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </>
    );
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

          {/* Session + Notebook row */}
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex-1 min-w-[180px]">
              <Label htmlFor="session">Session</Label>
              <Select value={sessionId || "none"} onValueChange={(v) => setSessionId(v === "none" ? null : v)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a session (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No session</SelectItem>
                  {sessions.map((session: any) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.title}
                      {session.status && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({session.status})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Notebook</Label>
              <NoteFolderSelector
                campaignId={campaignId}
                value={folder}
                onChange={setFolder}
              />
            </div>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <Select onValueChange={(v) => applyTemplate(v as keyof typeof NOTE_TEMPLATES)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Insert template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="combat">Combat Note</SelectItem>
                  <SelectItem value="npc">NPC Dialogue</SelectItem>
                  <SelectItem value="clue">Clue</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Outline panel (shows when 2+ headings exist) */}
            <NoteOutline
              content={content}
              onScrollToOffset={handleScrollToOffset}
            />

            <Tabs value={editorView} onValueChange={(v) => setEditorView(v as "write" | "preview")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="write" className="relative mt-2 space-y-2">
                {/* Markdown Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 border rounded-md bg-muted/30">
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("**", "**")} title="Bold">
                    <Bold className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("*", "*")} title="Italic">
                    <Italic className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("# ")} title="Heading 1">
                    <Heading1 className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("## ")} title="Heading 2">
                    <Heading2 className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("### ")} title="Heading 3">
                    <Heading3 className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("- ")} title="Bullet List">
                    <List className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("1. ")} title="Numbered List">
                    <ListOrdered className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("`", "`")} title="Code">
                    <Code className="w-4 h-4" />
                  </Button>
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => insertMarkdown("\n---\n")} title="Horizontal Rule">
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>

                <Textarea
                  ref={textareaRef}
                  id="content"
                  value={content}
                  onChange={handleContentChange}
                  placeholder="Write your note here... Type @ to mention entities, [[ to link notes"
                  className="min-h-[300px] font-mono"
                />
                
                {/* @mention dropdown */}
                {showMentions && mentionOptions.length > 0 && (
                  <div 
                    className="fixed z-[100] w-64 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                    style={{ top: mentionPosition.top, left: mentionPosition.left }}
                  >
                    {mentionOptions.map((option) => (
                      <button
                        key={`${option.type}-${option.id}`}
                        onClick={() => handleMentionSelect(option)}
                        className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm"
                      >
                        <Badge variant="outline" className="text-xs">
                          {option.type}
                        </Badge>
                        <span>{option.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* [[wikilink autocomplete dropdown */}
                {showWikilinks && (
                  <WikilinkAutocomplete
                    campaignId={campaignId}
                    searchText={wikilinkSearch}
                    position={wikilinkPosition}
                    onSelect={handleWikilinkSelect}
                    onClose={() => setShowWikilinks(false)}
                  />
                )}
              </TabsContent>

              <TabsContent value="preview" className="mt-2">
                <div className="min-h-[300px] p-4 border rounded-md bg-muted/10 prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children }) => <p><WikilinkText>{children}</WikilinkText></p>,
                      li: ({ children }) => <li><WikilinkText>{children}</WikilinkText></li>,
                      td: ({ children }) => <td><WikilinkText>{children}</WikilinkText></td>,
                    }}
                  >
                    {content || "*No content to preview*"}
                  </ReactMarkdown>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div>
            <Label>Linked Entities</Label>
            <NoteLinkSelector
              campaignId={campaignId}
              links={links.filter(l => l.link_type !== "NOTE")}
              onChange={(entityLinks) => {
                // Preserve existing NOTE-type links from wikilinks
                const noteLinks = links.filter(l => l.link_type === "NOTE");
                setLinks([...entityLinks, ...noteLinks]);
              }}
            />
          </div>

          {/* Backlinks panel */}
          {note && (
            <NoteBacklinks
              noteId={note.id}
              noteTitle={title}
              campaignId={campaignId}
              onNavigateToNote={handleNavigateToNote}
            />
          )}

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
            <div className="flex gap-2 flex-wrap">
              {note && (
                <>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)}
                    className="mr-auto"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Trash
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (note) {
                        loadRevisions(note.id);
                        setShowVersionHistory(true);
                      }
                    }}
                  >
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddToSession(true)}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add to Pack
                  </Button>
                  {visibility === 'SHARED' && (
                    <>
                      <Button 
                        variant="outline" 
                        onClick={() => setPlayerPreviewOpen(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview as Player
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCopyAsHandout}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy as Handout
                      </Button>
                    </>
                  )}
                </>
              )}
              <Button variant="outline" onClick={() => performSave(false)} disabled={isSaving || !title.trim()}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>

      {/* Version History Dialog */}
      <AlertDialog open={showVersionHistory} onOpenChange={setShowVersionHistory}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-1">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1 pr-2">
                  {loadingRevisions ? (
                    <p className="text-sm text-muted-foreground p-2">Loading...</p>
                  ) : revisions.length === 0 ? (
                    <p className="text-sm text-muted-foreground p-2">No revisions yet</p>
                  ) : (
                    revisions.map((rev) => (
                      <button
                        key={rev.id}
                        onClick={() => setSelectedRevision(rev)}
                        className={`w-full text-left p-2 rounded text-sm transition-colors ${
                          selectedRevision?.id === rev.id
                            ? "bg-accent text-accent-foreground"
                            : "hover:bg-accent/50"
                        }`}
                      >
                        <div className="font-medium truncate">{rev.title}</div>
                        <div className="text-xs text-muted-foreground">
                          v{rev.version} • {format(new Date(rev.saved_at), "MMM d, h:mm a")}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
            <div className="md:col-span-2">
              {selectedRevision ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{selectedRevision.title}</h4>
                    <Button
                      size="sm"
                      onClick={() => handleRestoreRevision(selectedRevision)}
                    >
                      Restore this version
                    </Button>
                  </div>
                  <ScrollArea className="h-[350px] border rounded-md p-3">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedRevision.content_markdown || "*No content*"}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Select a revision to preview
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowVersionHistory(false)}>
              Close
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to Trash</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to move "{note?.title}" to trash? You can restore it later.
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

      {/* Player Preview Dialog */}
      <AlertDialog open={playerPreviewOpen} onOpenChange={setPlayerPreviewOpen}>
        <AlertDialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel text-2xl flex items-center gap-2">
              <Eye className="w-5 h-5 text-brass" />
              Player Preview
            </AlertDialogTitle>
            <AlertDialogDescription>
              This is how players will see this shared note
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-xl font-cinzel font-semibold">{title}</h3>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <Separator />
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {getPlayerPreviewContent()}
              </ReactMarkdown>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPlayerPreviewOpen(false)}>
              Close
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {note && (
        <AddItemToSessionDialog
          open={showAddToSession}
          onOpenChange={setShowAddToSession}
          campaignId={campaignId}
          itemType="note"
          itemId={note.id}
          itemName={note.title}
        />
      )}
    </Dialog>
  );
};

export default NoteEditor;
