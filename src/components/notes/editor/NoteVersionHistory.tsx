import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { History } from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { NoteRevision } from "./types";

interface NoteVersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  revisions: NoteRevision[];
  loading: boolean;
  selectedRevision: NoteRevision | null;
  onSelectRevision: (rev: NoteRevision) => void;
  onRestore: (rev: NoteRevision) => void;
}

export function NoteVersionHistory({
  open,
  onOpenChange,
  revisions,
  loading,
  selectedRevision,
  onSelectRevision,
  onRestore,
}: NoteVersionHistoryProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
                {loading ? (
                  <p className="text-sm text-muted-foreground p-2">Loading...</p>
                ) : revisions.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No revisions yet</p>
                ) : (
                  revisions.map((rev) => (
                    <button
                      key={rev.id}
                      onClick={() => onSelectRevision(rev)}
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
                  <Button size="sm" onClick={() => onRestore(selectedRevision)}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
