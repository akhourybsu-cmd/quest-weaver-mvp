import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { List, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  level: number;
  text: string;
  offset: number;
}

interface NoteOutlineProps {
  content: string;
  onScrollToOffset: (offset: number) => void;
  className?: string;
}

function parseOutline(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  let offset = 0;
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)/);
    if (match) {
      headings.push({ level: match[1].length, text: match[2], offset });
    }
    offset += line.length + 1;
  }
  return headings;
}

const NoteOutline = ({ content, onScrollToOffset, className }: NoteOutlineProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const headings = useMemo(() => parseOutline(content), [content]);

  // Only show if there are 2+ headings
  if (headings.length < 2) return null;

  const minLevel = Math.min(...headings.map((h) => h.level));

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={cn("border rounded-md bg-muted/20", className)}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between px-3 py-2 h-auto"
        >
          <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <List className="w-3.5 h-3.5" />
            Outline
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="px-2 pb-2 space-y-0.5">
          {headings.map((heading, index) => (
            <button
              key={index}
              onClick={() => onScrollToOffset(heading.offset)}
              className="w-full text-left px-2 py-1 text-xs rounded hover:bg-accent/50 transition-colors truncate text-muted-foreground hover:text-foreground"
              style={{ paddingLeft: `${(heading.level - minLevel) * 12 + 8}px` }}
            >
              {heading.text}
            </button>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default NoteOutline;
