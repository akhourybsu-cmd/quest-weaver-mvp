import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pin, Lock, Users, Eye, FolderPlus, Calendar, FolderOpen } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  visibility: "DM_ONLY" | "SHARED" | "PRIVATE";
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  session_id?: string | null;
  folder?: string | null;
}

interface Session {
  id: string;
  name: string | null;
  started_at: string | null;
}

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  isDM: boolean;
  isOwner: boolean;
  campaignId: string;
  session?: Session | null;
}

const NoteCard = ({ note, onClick, isDM, isOwner, campaignId, session }: NoteCardProps) => {
  const [showAddToSession, setShowAddToSession] = useState(false);
  const visibilityConfig = {
    DM_ONLY: { 
      icon: Eye, 
      label: "DM Only", 
      className: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800"
    },
    SHARED: { 
      icon: Users, 
      label: "Shared", 
      className: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800"
    },
    PRIVATE: { 
      icon: Lock, 
      label: "Private", 
      className: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
    },
  };

  const config = visibilityConfig[note.visibility];
  const VisibilityIcon = config.icon;

  // Truncate content preview
  const preview = note.content_markdown?.slice(0, 150) || "";
  const hasMore = (note.content_markdown?.length || 0) > 150;

  // Render @mentions inline
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /@(\w+(?:\s+\w+)*)/g;
    const parts = text.split(mentionRegex);
    
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        // This is a mention
        return (
          <span key={index} className="text-primary font-medium">
            @{part}
          </span>
        );
      }
      return part;
    });
  };

  // Get session display name
  const getSessionDisplayName = () => {
    if (!session) return null;
    if (session.name) return session.name;
    if (session.started_at) {
      const date = new Date(session.started_at);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return 'Session';
  };

  const sessionDisplayName = getSessionDisplayName();

  return (
    <>
      <Card
        className="cursor-pointer hover:border-primary/50 transition-all duration-200 bg-card/80 backdrop-blur-sm"
        onClick={onClick}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg flex items-center gap-2 font-semibold">
              {note.is_pinned && <Pin className="w-4 h-4 text-amber-600 fill-amber-500" />}
              {note.title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {isDM && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAddToSession(true);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                </Button>
              )}
              <Badge variant="outline" className={`${config.className} rounded-full px-3 py-0.5 text-xs font-medium`}>
                <VisibilityIcon className="w-3 h-3 mr-1.5" />
                {config.label}
              </Badge>
            </div>
          </div>
        </CardHeader>

      <CardContent className="space-y-3">
        {/* Session + Folder pills */}
        <div className="flex flex-wrap gap-1.5">
          {sessionDisplayName && (
            <Badge variant="secondary" className="text-xs rounded-full px-2.5 py-0.5 bg-arcanePurple/10 text-arcanePurple border-arcanePurple/20">
              <Calendar className="w-3 h-3 mr-1" />
              {sessionDisplayName}
            </Badge>
          )}
          {note.folder && (
            <Badge variant="secondary" className="text-xs rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20">
              <FolderOpen className="w-3 h-3 mr-1" />
              {note.folder}
            </Badge>
          )}
        </div>

        {preview && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {renderContentWithMentions(preview)}
            {hasMore && "..."}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex flex-wrap gap-1.5">
            {note.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs rounded-full px-2.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {note.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs rounded-full px-2.5 py-0.5">
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

    <AddItemToSessionDialog
      open={showAddToSession}
      onOpenChange={setShowAddToSession}
      campaignId={campaignId}
      itemType="note"
      itemId={note.id}
      itemName={note.title}
    />
  </>
  );
};

export default NoteCard;
