import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Eye } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { WikilinkText } from "./WikilinkText";

interface NotePlayerPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  content: string;
  tags: string[];
}

export function NotePlayerPreview({ open, onOpenChange, title, content, tags }: NotePlayerPreviewProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <Separator />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p><WikilinkText>{children}</WikilinkText></p>,
                li: ({ children }) => <li><WikilinkText>{children}</WikilinkText></li>,
              }}
            >
              {content || "*No content*"}
            </ReactMarkdown>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
