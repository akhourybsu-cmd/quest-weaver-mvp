export interface NoteLink {
  id?: string;
  link_type: string;
  link_id: string | null;
  label: string;
}

export interface NoteRevision {
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

export interface Note {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
}

export interface NoteEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  note: Note | null;
  isDM: boolean;
  userId: string;
  onSaved: () => void;
  onNavigateToNote?: (noteId: string) => void;
}
