import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pin, Lock, Users, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  isDM: boolean;
  isOwner: boolean;
}

const NoteCard = ({ note, onClick, isDM, isOwner }: NoteCardProps) => {
  const visibilityConfig = {
    DM_ONLY: { icon: Eye, label: "DM Only", color: "bg-amber-500/10 text-amber-500" },
    SHARED: { icon: Users, label: "Shared", color: "bg-sky-500/10 text-sky-500" },
    PRIVATE: { icon: Lock, label: "Private", color: "bg-violet-500/10 text-violet-500" },
  };

  const config = visibilityConfig[note.visibility];
  const VisibilityIcon = config.icon;

  // Truncate content preview
  const preview = note.content_markdown?.slice(0, 150) || "";
  const hasMore = (note.content_markdown?.length || 0) > 150;

  return (
    <Card
      className="cursor-pointer hover:border-primary/50 transition-colors"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            {note.is_pinned && <Pin className="w-4 h-4 text-amber-500 fill-amber-500" />}
            {note.title}
          </CardTitle>
          <Badge variant="outline" className={config.color}>
            <VisibilityIcon className="w-3 h-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {preview}
            {hasMore && "..."}
          </p>
        )}

        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{note.tags.length - 3}
              </Badge>
            )}
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default NoteCard;
