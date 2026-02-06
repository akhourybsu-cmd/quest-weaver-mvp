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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Pin, X, Check, Trash2, Bold, Italic, Heading1, Heading2, Heading3, List, ListOrdered, Code, Minus, Eye, Copy, History, FolderPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import NoteLinkSelector from "./NoteLinkSelector";
import NoteFolderSelector from "./NoteFolderSelector";
import WikilinkAutocomplete from "./WikilinkAutocomplete";
import NoteOutline from "./NoteOutline";
import NoteBacklinks from "./NoteBacklinks";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Extracted sub-modules
import { PREDEFINED_TAGS, NOTE_TEMPLATES, parseWikilinks, debounce } from "./editor/constants";
import type { NoteLink, NoteRevision, NoteEditorProps } from "./editor/types";
import { getCaretCoordinates } from "./editor/getCaretCoordinates";
import { WikilinkText } from "./editor/WikilinkText";
import { NoteVersionHistory } from "./editor/NoteVersionHistory";
import { NotePlayerPreview } from "./editor/NotePlayerPreview";

const NoteEditor = ({ open, onOpenChange, campaignId, note, isDM, userId, onSaved, onNavigateToNote }: NoteEditorProps) => {
  // --- Core state ---
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED" | "PRIVATE">("DM_ONLY");
  const [isPinned, setIsPinned] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [links, setLinks] = useState<NoteLink[]>([]);
  const [folder, setFolder] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Array<{ id: string; title: string; session_number: number; status?: string }>>([]);

  // --- Save state ---
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [version, setVersion] = useState(1);
  const [autoSaveCount, setAutoSaveCount] = useState(0);

  // --- UI state ---
  const [editorView, setEditorView] = useState<"write" | "preview">("write");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddToSession, setShowAddToSession] = useState(false);
  const [playerPreviewOpen, setPlayerPreviewOpen] = useState(false);

  // --- Mention/wikilink dropdowns ---
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionOptions, setMentionOptions] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showWikilinks, setShowWikilinks] = useState(false);
  const [wikilinkSearch, setWikilinkSearch] = useState("");
  const [wikilinkPosition, setWikilinkPosition] = useState({ top: 0, left: 0 });

  // --- Version history ---
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [revisions, setRevisions] = useState<NoteRevision[]>([]);
  const [selectedRevision, setSelectedRevision] = useState<NoteRevision | null>(null);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  // ========== Effects ==========

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
      loadNoteMetadata(note.id);
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
    setEditorView("write");
  }, [note, open, isDM]);

  // ========== Data loading ==========

  const loadSessions = async () => {
    const { data } = await supabase
      .from("campaign_sessions")
      .select("id, name, started_at, status")
      .eq("campaign_id", campaignId)
      .order("started_at", { ascending: false });

    if (data) {
      setSessions(data.map((s, index) => ({
        id: s.id,
        title: s.name || (s.started_at ? new Date(s.started_at).toLocaleDateString() : "Session"),
        session_number: data.length - index,
        status: s.status,
      })));
    }
  };

  const loadNoteMetadata = async (noteId: string) => {
    const { data } = await supabase
      .from("session_notes")
      .select("session_id, folder, version")
      .eq("id", noteId)
      .single();

    if (data) {
      setSessionId(data.session_id);
      setFolder(data.folder || null);
      setVersion(data.version || 1);
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

  const loadMentionOptions = async (search: string) => {
    const options: Array<{ id: string; name: string; type: string }> = [];

    const [npcsRes, charsRes, locsRes, questsRes] = await Promise.all([
      supabase.from("npcs").select("id, name").eq("campaign_id", campaignId).ilike("name", `%${search}%`).limit(10),
      supabase.from("characters").select("id, name").eq("campaign_id", campaignId).ilike("name", `%${search}%`).limit(10),
      supabase.from("locations").select("id, name").eq("campaign_id", campaignId).ilike("name", `%${search}%`).limit(10),
      supabase.from("quests").select("id, title").eq("campaign_id", campaignId).ilike("title", `%${search}%`).limit(10),
    ]);

    if (npcsRes.data) options.push(...npcsRes.data.map(npc => ({ id: npc.id, name: npc.name, type: "NPC" })));
    if (charsRes.data) options.push(...charsRes.data.map(c => ({ id: c.id, name: c.name, type: "CHARACTER" })));
    if (locsRes.data) options.push(...locsRes.data.map(l => ({ id: l.id, name: l.name, type: "LOCATION" })));
    if (questsRes.data) options.push(...questsRes.data.map(q => ({ id: q.id, name: q.title, type: "QUEST" })));

    setMentionOptions(options);
  };

  // ========== Save logic ==========

  const resolveWikilinks = async (noteId: string, contentText: string) => {
    const wikilinkTitles = parseWikilinks(contentText);
    if (wikilinkTitles.length === 0) return [];

    const { data: matchedNotes } = await supabase
      .from("session_notes")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .is("deleted_at", null)
      .in("title", wikilinkTitles);

    const titleToId = new Map((matchedNotes || []).map(n => [n.title, n.id]));

    return wikilinkTitles.map((t): NoteLink => ({
      link_type: "NOTE",
      link_id: titleToId.get(t) || null,
      label: t,
    }));
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

  const performSave = async (isAutoSave = false) => {
    if (!title.trim()) {
      if (!isAutoSave) {
        toast({ title: "Title required", description: "Please add a title to your note", variant: "destructive" });
      }
      return;
    }

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
            version,
            updated_at: new Date().toISOString(),
          })
          .eq("id", note.id)
          .select("version")
          .single();

        if (error) {
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

        newVersion = updatedData?.version || version + 1;
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
        newVersion = data.version || 1;
        setVersion(newVersion);
      }

      setTags(normalizedTags);

      // Save links with error handling
      if (noteId) {
        const { error: deleteError } = await supabase.from("note_links").delete().eq("note_id", noteId);
        if (deleteError) console.error("Error deleting note links:", deleteError);

        const entityLinks = links.filter(l => l.link_type !== "NOTE");
        const wikilinkEntries = await resolveWikilinks(noteId, content);
        const allLinks = [...entityLinks, ...wikilinkEntries];

        if (allLinks.length > 0) {
          const { error: insertError } = await supabase.from("note_links").insert(
            allLinks.map(link => ({
              note_id: noteId!,
              link_type: link.link_type,
              link_id: link.link_id,
              label: link.label,
            }))
          );
          if (insertError) {
            console.error("Error saving note links:", insertError);
            if (!isAutoSave) {
              toast({ title: "Warning", description: "Note saved but some links could not be updated", variant: "destructive" });
            }
          }
        }

        // Create revision
        const nextAutoSaveCount = autoSaveCount + 1;
        if (!isAutoSave || nextAutoSaveCount % 5 === 0) {
          await createRevision(noteId, newVersion);
        }
        if (isAutoSave) setAutoSaveCount(nextAutoSaveCount);
      }

      setLastSaved(new Date());
      onSaved();
      if (!isAutoSave) {
        toast({ title: "Note saved", description: "Your note has been saved successfully" });
      }
    } catch (error: any) {
      toast({ title: "Error saving note", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const debouncedSave = useCallback(
    debounce(async () => { await performSave(true); }, 1500),
    [title, content, visibility, isPinned, tags, note, campaignId, userId, onSaved, folder, version]
  );

  useEffect(() => {
    if (open && autoSaveEnabled && title.trim()) {
      debouncedSave();
    }
  }, [title, content, visibility, isPinned, tags, open, autoSaveEnabled, debouncedSave]);

  // ========== Content handlers ==========

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

    const textarea = e.target;
    const textBeforeCursor = newContent.substring(0, newCursorPosition);

    // Check for [[ wikilink trigger
    const lastDoubleBracket = textBeforeCursor.lastIndexOf("[[");
    if (lastDoubleBracket !== -1) {
      const textAfterBracket = textBeforeCursor.substring(lastDoubleBracket + 2);
      if (!textAfterBracket.includes("]]") && !textAfterBracket.includes("\n")) {
        setWikilinkSearch(textAfterBracket);
        setShowWikilinks(true);
        setShowMentions(false);
        const coords = getCaretCoordinates(textarea, newCursorPosition);
        setWikilinkPosition({ top: coords.top + coords.height + 4, left: coords.left });
        return;
      }
    }
    setShowWikilinks(false);

    // Check for @ mention
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt);
        setShowMentions(true);
        loadMentionOptions(textAfterAt);
        const coords = getCaretCoordinates(textarea, newCursorPosition);
        setMentionPosition({ top: coords.top + coords.height + 4, left: coords.left });
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
    setTimeout(() => {
      if (textareaRef.current) {
        const newPos = lastDoubleBracket + noteTitle.length + 4;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const handleMentionSelect = (option: { id: string; name: string; type: string }) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    const beforeMention = content.substring(0, lastAtIndex);
    const afterCursor = content.substring(cursorPosition);
    const newContent = beforeMention + `@${option.name}` + afterCursor;
    setContent(newContent);
    setShowMentions(false);
    if (!links.some(link => link.link_id === option.id && link.link_type === option.type)) {
      setLinks([...links, { link_type: option.type, link_id: option.id, label: option.name }]);
    }
  };

  const handleScrollToOffset = (offset: number) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    textarea.focus();
    textarea.setSelectionRange(offset, offset);
    const lineHeight = 20;
    const linesBefore = content.substring(0, offset).split("\n").length;
    textarea.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
  };

  // ========== Tag handlers ==========

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!tags.some(t => t.toLowerCase() === newTag.toLowerCase())) {
        setTags([...tags, newTag]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t.toLowerCase() !== tag.toLowerCase()));
  };

  const handleTogglePredefinedTag = (tagName: string) => {
    const isSelected = tags.some(t => t.toLowerCase() === tagName.toLowerCase());
    if (isSelected) {
      handleRemoveTag(tagName);
    } else {
      setTags([...tags, tagName.toLowerCase()]);
    }
  };

  // ========== Actions ==========

  const handleNavigate = useCallback(async (titleOrId: string) => {
    // If onNavigateToNote prop is provided, resolve title → noteId then delegate to parent
    if (onNavigateToNote) {
      // Check if it looks like a UUID (from backlinks) or a title (from wikilink clicks)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(titleOrId);
      if (isUUID) {
        onNavigateToNote(titleOrId);
      } else {
        // Resolve title to ID
        const { data } = await supabase
          .from("session_notes")
          .select("id")
          .eq("campaign_id", campaignId)
          .eq("title", titleOrId)
          .is("deleted_at", null)
          .single();
        if (data) onNavigateToNote(data.id);
      }
    }
  }, [onNavigateToNote, campaignId]);

  const handleDelete = async () => {
    if (!note) return;
    try {
      const { error } = await supabase
        .from("session_notes")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", note.id);
      if (error) throw error;
      toast({ title: "Note moved to trash", description: "Your note has been moved to trash" });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: "Error deleting note", description: error.message, variant: "destructive" });
    }
  };

  const handleRestoreRevision = (revision: NoteRevision) => {
    setTitle(revision.title);
    setContent(revision.content_markdown || "");
    setTags(revision.tags || []);
    if (revision.visibility) setVisibility(revision.visibility as "DM_ONLY" | "SHARED" | "PRIVATE");
    if (revision.folder !== undefined) setFolder(revision.folder);
    setShowVersionHistory(false);
    setSelectedRevision(null);
    toast({ title: "Revision restored", description: `Restored to version ${revision.version}. Save to keep changes.` });
  };

  const applyTemplate = (templateKey: keyof typeof NOTE_TEMPLATES) => {
    const template = NOTE_TEMPLATES[templateKey];
    setContent(template.content);
    const templateTag = template.name.split(" ")[0].toLowerCase();
    if (!tags.some(t => t.toLowerCase() === templateTag)) {
      setTags([...tags, templateTag]);
    }
    toast({ title: "Template applied", description: `${template.name} template inserted` });
  };

  const handleCopyAsHandout = () => {
    navigator.clipboard.writeText(`# ${title}\n\n${content}`);
    toast({ title: "Copied to clipboard", description: "Note content has been copied as a handout." });
  };

  // ========== Render ==========

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{note ? "Edit Note" : "New Note"}</DialogTitle>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {isSaving && "Saving..."}
              {!isSaving && lastSaved && (
                <span className="flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-green-500" />
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Two-panel body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main editor */}
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-4">
              {/* Title */}
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note title..."
                className="text-lg font-semibold border-0 border-b rounded-none px-0 focus-visible:ring-0 focus-visible:border-primary"
              />

              {/* Compact metadata row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Visibility */}
                <div className="flex items-center gap-1">
                  {isDM && (
                    <Button type="button" size="sm" variant={visibility === "DM_ONLY" ? "default" : "outline"}
                      className={`h-7 text-xs ${visibility === "DM_ONLY" ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-400" : ""}`}
                      onClick={() => setVisibility("DM_ONLY")}>DM</Button>
                  )}
                  <Button type="button" size="sm" variant={visibility === "SHARED" ? "default" : "outline"}
                    className={`h-7 text-xs ${visibility === "SHARED" ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-400" : ""}`}
                    onClick={() => setVisibility("SHARED")}>Shared</Button>
                  <Button type="button" size="sm" variant={visibility === "PRIVATE" ? "default" : "outline"}
                    className={`h-7 text-xs ${visibility === "PRIVATE" ? "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400" : ""}`}
                    onClick={() => setVisibility("PRIVATE")}>Private</Button>
                </div>

                <div className="h-5 w-px bg-border" />

                {/* Session selector */}
                <Select value={sessionId || "none"} onValueChange={(v) => setSessionId(v === "none" ? null : v)}>
                  <SelectTrigger className="h-7 w-[160px] text-xs">
                    <SelectValue placeholder="Session..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No session</SelectItem>
                    {sessions.map(session => (
                      <SelectItem key={session.id} value={session.id}>{session.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Notebook */}
                <NoteFolderSelector campaignId={campaignId} value={folder} onChange={setFolder} />

                <div className="h-5 w-px bg-border" />

                {/* Toggles */}
                <div className="flex items-center gap-1.5">
                  <Switch id="pinned" checked={isPinned} onCheckedChange={setIsPinned} className="scale-75" />
                  <Label htmlFor="pinned" className="text-xs flex items-center gap-1 cursor-pointer">
                    <Pin className="w-3 h-3" /> Pin
                  </Label>
                </div>
                <div className="flex items-center gap-1.5">
                  <Switch id="autosave" checked={autoSaveEnabled} onCheckedChange={setAutoSaveEnabled} className="scale-75" />
                  <Label htmlFor="autosave" className="text-xs cursor-pointer">Auto-save</Label>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {PREDEFINED_TAGS.map((tagDef) => {
                    const isSelected = tags.some(t => t.toLowerCase() === tagDef.name.toLowerCase());
                    const TagIcon = tagDef.icon;
                    return (
                      <Button key={tagDef.name} type="button" variant={isSelected ? "default" : "outline"} size="sm"
                        className={`rounded-full h-7 text-xs ${isSelected ? tagDef.color : ""}`}
                        onClick={() => handleTogglePredefinedTag(tagDef.name)}>
                        <TagIcon className="w-3 h-3 mr-1" />{tagDef.name}
                      </Button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Custom tag + Enter..."
                    className="h-7 text-xs flex-1"
                  />
                  {tags.filter(tag => !PREDEFINED_TAGS.some(pt => pt.name.toLowerCase() === tag.toLowerCase())).length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {tags.filter(tag => !PREDEFINED_TAGS.some(pt => pt.name.toLowerCase() === tag.toLowerCase())).map(tag => (
                        <Badge key={tag} variant="secondary" className="rounded-full text-xs">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Content editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Select onValueChange={(v) => applyTemplate(v as keyof typeof NOTE_TEMPLATES)}>
                    <SelectTrigger className="w-[160px] h-7 text-xs">
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

                <Tabs value={editorView} onValueChange={(v) => setEditorView(v as "write" | "preview")}>
                  <TabsList className="grid w-full grid-cols-2 h-8">
                    <TabsTrigger value="write" className="text-xs">Write</TabsTrigger>
                    <TabsTrigger value="preview" className="text-xs">Preview</TabsTrigger>
                  </TabsList>

                  <TabsContent value="write" className="relative mt-2 space-y-2">
                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-0.5 p-1.5 border rounded-md bg-muted/30">
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("**", "**")} title="Bold"><Bold className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("*", "*")} title="Italic"><Italic className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("# ")} title="H1"><Heading1 className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("## ")} title="H2"><Heading2 className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("### ")} title="H3"><Heading3 className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("- ")} title="List"><List className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("1. ")} title="Numbered"><ListOrdered className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("`", "`")} title="Code"><Code className="w-3.5 h-3.5" /></Button>
                      <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => insertMarkdown("\n---\n")} title="HR"><Minus className="w-3.5 h-3.5" /></Button>
                    </div>

                    <Textarea
                      ref={textareaRef}
                      value={content}
                      onChange={handleContentChange}
                      placeholder="Write your note here... Type @ to mention entities, [[ to link notes"
                      className="min-h-[300px] font-mono text-sm"
                    />

                    {/* @mention dropdown */}
                    {showMentions && mentionOptions.length > 0 && (
                      <div className="fixed z-[100] w-64 bg-popover border border-border rounded-md shadow-lg max-h-48 overflow-y-auto"
                        style={{ top: mentionPosition.top, left: mentionPosition.left }}>
                        {mentionOptions.map(option => (
                          <button key={`${option.type}-${option.id}`} onClick={() => handleMentionSelect(option)}
                            className="w-full px-3 py-2 text-left hover:bg-accent flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">{option.type}</Badge>
                            <span>{option.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Wikilink autocomplete */}
                    {showWikilinks && (
                      <WikilinkAutocomplete campaignId={campaignId} searchText={wikilinkSearch}
                        position={wikilinkPosition} onSelect={handleWikilinkSelect} onClose={() => setShowWikilinks(false)} />
                    )}
                  </TabsContent>

                  <TabsContent value="preview" className="mt-2">
                    <div className="min-h-[300px] p-4 border rounded-md bg-muted/10 prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                        p: ({ children }) => <p><WikilinkText onNavigate={onNavigateToNote ? handleNavigate : undefined}>{children}</WikilinkText></p>,
                        li: ({ children }) => <li><WikilinkText onNavigate={onNavigateToNote ? handleNavigate : undefined}>{children}</WikilinkText></li>,
                        td: ({ children }) => <td><WikilinkText onNavigate={onNavigateToNote ? handleNavigate : undefined}>{children}</WikilinkText></td>,
                      }}>
                        {content || "*No content to preview*"}
                      </ReactMarkdown>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Mobile-only: Outline, Backlinks, Linked Entities */}
              <div className="lg:hidden space-y-3">
                <NoteOutline content={content} onScrollToOffset={handleScrollToOffset} />
                {note && (
                  <NoteBacklinks noteId={note.id} noteTitle={title} campaignId={campaignId} onNavigateToNote={handleNavigate} />
                )}
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Linked Entities</Label>
                  <NoteLinkSelector campaignId={campaignId}
                    links={links.filter(l => l.link_type !== "NOTE")}
                    onChange={(entityLinks) => {
                      const noteLinks = links.filter(l => l.link_type === "NOTE");
                      setLinks([...entityLinks, ...noteLinks]);
                    }} />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Right sidebar (desktop) */}
          <div className="hidden lg:flex flex-col w-64 border-l bg-muted/5 overflow-y-auto shrink-0">
            <div className="p-4 space-y-4">
              <NoteOutline content={content} onScrollToOffset={handleScrollToOffset} />
              {note && (
                <NoteBacklinks noteId={note.id} noteTitle={title} campaignId={campaignId} onNavigateToNote={handleNavigate} />
              )}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Linked Entities</Label>
                <NoteLinkSelector campaignId={campaignId}
                  links={links.filter(l => l.link_type !== "NOTE")}
                  onChange={(entityLinks) => {
                    const noteLinks = links.filter(l => l.link_type === "NOTE");
                    setLinks([...entityLinks, ...noteLinks]);
                  }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action bar */}
        <div className="px-6 py-3 border-t flex items-center justify-between shrink-0">
          <div className="flex gap-2">
            {note && (
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />Trash
              </Button>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {note && (
              <>
                <Button variant="outline" size="sm" onClick={() => { if (note) { loadRevisions(note.id); setShowVersionHistory(true); } }}>
                  <History className="w-3.5 h-3.5 mr-1.5" />History
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAddToSession(true)}>
                  <FolderPlus className="w-3.5 h-3.5 mr-1.5" />Pack
                </Button>
                {visibility === "SHARED" && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setPlayerPreviewOpen(true)}>
                      <Eye className="w-3.5 h-3.5 mr-1.5" />Preview
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyAsHandout}>
                      <Copy className="w-3.5 h-3.5 mr-1.5" />Handout
                    </Button>
                  </>
                )}
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => performSave(false)} disabled={isSaving || !title.trim()}>
              <Save className="w-3.5 h-3.5 mr-1.5" />Save
            </Button>
            <Button size="sm" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>

      {/* Extracted dialogs */}
      <NoteVersionHistory
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        revisions={revisions}
        loading={loadingRevisions}
        selectedRevision={selectedRevision}
        onSelectRevision={setSelectedRevision}
        onRestore={handleRestoreRevision}
      />

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

      <NotePlayerPreview
        open={playerPreviewOpen}
        onOpenChange={setPlayerPreviewOpen}
        title={title}
        content={content}
        tags={tags}
      />

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
