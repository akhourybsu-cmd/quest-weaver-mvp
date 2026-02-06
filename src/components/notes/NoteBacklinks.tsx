import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ChevronDown, ChevronRight, FileText } from "lucide-react";

interface BacklinkNote {
  id: string;
  title: string;
  excerpt: string;
  folder: string | null;
}

interface NoteBacklinksProps {
  noteId: string | null;
  noteTitle: string;
  campaignId: string;
  onNavigateToNote: (noteId: string) => void;
}

const NoteBacklinks = ({ noteId, noteTitle, campaignId, onNavigateToNote }: NoteBacklinksProps) => {
  const [backlinks, setBacklinks] = useState<BacklinkNote[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (noteId) {
      loadBacklinks();
    }
  }, [noteId, noteTitle, campaignId]);

  const loadBacklinks = async () => {
    if (!noteId) return;
    setLoading(true);

    try {
      // 1. Find notes that link to this note via note_links
      const { data: linkData } = await supabase
        .from("note_links")
        .select("note_id")
        .eq("link_type", "NOTE")
        .eq("link_id", noteId);

      const linkNoteIds = linkData?.map((l: any) => l.note_id) || [];

      // 2. Also search for [[Note Title]] text references
      const { data: textMatches } = await supabase
        .from("session_notes")
        .select("id, title, content_markdown, folder")
        .eq("campaign_id", campaignId)
        .ilike("content_markdown", `%[[${noteTitle}]]%`)
        .neq("id", noteId)
        .limit(20);

      // Combine results
      const allIds = new Set([
        ...linkNoteIds,
        ...(textMatches?.map((m: any) => m.id) || []),
      ]);

      // Fetch full note info for link-based backlinks
      let backlinkNotes: BacklinkNote[] = [];

      if (linkNoteIds.length > 0) {
        const { data: linkedNotes } = await supabase
          .from("session_notes")
          .select("id, title, content_markdown, folder")
          .in("id", linkNoteIds);

        if (linkedNotes) {
          backlinkNotes = linkedNotes.map((n: any) => ({
            id: n.id,
            title: n.title,
            excerpt: extractExcerpt(n.content_markdown, noteTitle),
            folder: n.folder,
          }));
        }
      }

      // Add text-matched notes not already in the list
      if (textMatches) {
        for (const match of textMatches) {
          if (!backlinkNotes.some((b) => b.id === match.id)) {
            backlinkNotes.push({
              id: match.id,
              title: match.title,
              excerpt: extractExcerpt(match.content_markdown, noteTitle),
              folder: match.folder,
            });
          }
        }
      }

      setBacklinks(backlinkNotes);
    } catch (error) {
      console.error("Error loading backlinks:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractExcerpt = (content: string, searchTitle: string): string => {
    if (!content) return "";
    const pattern = `[[${searchTitle}]]`;
    const index = content.indexOf(pattern);
    if (index !== -1) {
      const start = Math.max(0, index - 40);
      const end = Math.min(content.length, index + pattern.length + 40);
      return (start > 0 ? "..." : "") + content.slice(start, end) + (end < content.length ? "..." : "");
    }
    // Fallback: first 80 chars
    return content.slice(0, 80) + (content.length > 80 ? "..." : "");
  };

  if (!noteId || backlinks.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md bg-muted/20">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-3 py-2 h-auto"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ArrowLeft className="w-3.5 h-3.5" />
            Backlinks
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
              {backlinks.length}
            </Badge>
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-2 space-y-1">
          {backlinks.map((backlink) => (
            <button
              key={backlink.id}
              onClick={() => onNavigateToNote(backlink.id)}
              className="w-full text-left p-2 rounded hover:bg-accent/50 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium truncate group-hover:text-foreground">
                  {backlink.title}
                </span>
              </div>
              {backlink.excerpt && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pl-5.5">
                  {backlink.excerpt}
                </p>
              )}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NoteBacklinks;
