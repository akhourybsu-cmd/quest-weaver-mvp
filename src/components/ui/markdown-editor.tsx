import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Strikethrough,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  FileCode,
  Link,
  Minus,
  Table,
  Edit3,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  label?: string;
  showPreview?: boolean;
  className?: string;
  previewClassName?: string;
  hint?: string;
}

interface ToolbarButton {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  shortcut?: string;
}

const MarkdownEditor = React.forwardRef<HTMLTextAreaElement, MarkdownEditorProps>(
  (
    {
      value,
      onChange,
      placeholder = "Write your content in Markdown...",
      rows = 12,
      label,
      showPreview = true,
      className,
      previewClassName,
      hint,
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [activeTab, setActiveTab] = React.useState("edit");

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement);

    const insertMarkdown = (before: string, after: string = "", placeholder: string = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      const textToInsert = selectedText || placeholder;

      const newValue =
        value.substring(0, start) +
        before +
        textToInsert +
        after +
        value.substring(end);

      onChange(newValue);

      // Restore cursor position after React updates
      setTimeout(() => {
        textarea.focus();
        const newCursorPos = start + before.length + textToInsert.length;
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + textToInsert.length
        );
      }, 0);
    };

    const insertAtLineStart = (prefix: string, isNumberedList: boolean = false) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // Find the start of the first selected line
      const firstLineStart = value.lastIndexOf("\n", start - 1) + 1;
      // Find the end of the last selected line
      const lastLineEnd = value.indexOf("\n", end);
      const actualEnd = lastLineEnd === -1 ? value.length : lastLineEnd;
      
      // Get the selected lines as text
      const selectedText = value.substring(firstLineStart, actualEnd);
      const lines = selectedText.split("\n");
      
      // Add prefix to each line
      const modifiedLines = lines.map((line, index) => {
        // For numbered lists, use sequential numbers
        const linePrefix = isNumberedList ? `${index + 1}. ` : prefix;
        return linePrefix + line;
      });
      
      const newText = modifiedLines.join("\n");
      const newValue = value.substring(0, firstLineStart) + newText + value.substring(actualEnd);

      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
        // Select all the modified text
        const newEnd = firstLineStart + newText.length;
        textarea.setSelectionRange(firstLineStart, newEnd);
      }, 0);
    };

    const insertBlock = (block: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const needsNewlineBefore = start > 0 && value[start - 1] !== "\n";
      const prefix = needsNewlineBefore ? "\n\n" : "";

      const newValue =
        value.substring(0, start) + prefix + block + value.substring(start);

      onChange(newValue);

      setTimeout(() => {
        textarea.focus();
      }, 0);
    };

    const toolbarButtons: (ToolbarButton | "separator")[] = [
      {
        icon: <Bold className="h-4 w-4" />,
        label: "Bold",
        action: () => insertMarkdown("**", "**", "bold text"),
        shortcut: "Ctrl+B",
      },
      {
        icon: <Italic className="h-4 w-4" />,
        label: "Italic",
        action: () => insertMarkdown("*", "*", "italic text"),
        shortcut: "Ctrl+I",
      },
      {
        icon: <Strikethrough className="h-4 w-4" />,
        label: "Strikethrough",
        action: () => insertMarkdown("~~", "~~", "strikethrough"),
      },
      {
        icon: <Underline className="h-4 w-4" />,
        label: "Underline",
        action: () => insertMarkdown("<u>", "</u>", "underlined"),
      },
      "separator",
      {
        icon: <Heading1 className="h-4 w-4" />,
        label: "Heading 1",
        action: () => insertAtLineStart("# "),
      },
      {
        icon: <Heading2 className="h-4 w-4" />,
        label: "Heading 2",
        action: () => insertAtLineStart("## "),
      },
      {
        icon: <Heading3 className="h-4 w-4" />,
        label: "Heading 3",
        action: () => insertAtLineStart("### "),
      },
      "separator",
      {
        icon: <List className="h-4 w-4" />,
        label: "Bullet List",
        action: () => insertAtLineStart("- "),
      },
      {
        icon: <ListOrdered className="h-4 w-4" />,
        label: "Numbered List",
        action: () => insertAtLineStart("1. ", true),
      },
      {
        icon: <CheckSquare className="h-4 w-4" />,
        label: "Task List",
        action: () => insertAtLineStart("- [ ] "),
      },
      "separator",
      {
        icon: <Quote className="h-4 w-4" />,
        label: "Blockquote",
        action: () => insertAtLineStart("> "),
      },
      {
        icon: <Code className="h-4 w-4" />,
        label: "Inline Code",
        action: () => insertMarkdown("`", "`", "code"),
      },
      {
        icon: <FileCode className="h-4 w-4" />,
        label: "Code Block",
        action: () => insertMarkdown("```\n", "\n```", "code block"),
      },
      "separator",
      {
        icon: <Link className="h-4 w-4" />,
        label: "Link",
        action: () => insertMarkdown("[", "](url)", "link text"),
      },
      {
        icon: <Minus className="h-4 w-4" />,
        label: "Horizontal Rule",
        action: () => insertBlock("\n---\n"),
      },
      {
        icon: <Table className="h-4 w-4" />,
        label: "Table",
        action: () =>
          insertBlock(
            "| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n"
          ),
      },
    ];

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            insertMarkdown("**", "**", "bold text");
            break;
          case "i":
            e.preventDefault();
            insertMarkdown("*", "*", "italic text");
            break;
        }
      }
    };

    const renderToolbar = () => (
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-muted/50 rounded-t-md border border-b-0 border-input">
        {toolbarButtons.map((item, index) =>
          item === "separator" ? (
            <Separator key={index} orientation="vertical" className="h-6 mx-1" />
          ) : (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-accent"
                  onClick={item.action}
                >
                  {item.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                {item.label}
                {item.shortcut && (
                  <span className="ml-2 text-muted-foreground">
                    {item.shortcut}
                  </span>
                )}
              </TooltipContent>
            </Tooltip>
          )
        )}
      </div>
    );

    if (!showPreview) {
      return (
        <div className={cn("space-y-1", className)}>
          {label && (
            <label className="text-sm font-medium text-foreground">{label}</label>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {renderToolbar()}
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={rows}
            className="rounded-t-none font-mono text-sm"
            placeholder={placeholder}
          />
        </div>
      );
    }

    return (
      <div className={cn("space-y-2", className)}>
        {label && (
          <label className="text-sm font-medium text-foreground">{label}</label>
        )}
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="edit" className="gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-2">
            {renderToolbar()}
            <Textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={rows}
              className="rounded-t-none font-mono text-sm"
              placeholder={placeholder}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-2">
            <div
              className={cn(
                "min-h-[200px] p-4 border border-input rounded-md bg-card/50",
                previewClassName
              )}
            >
              {value ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No content yet...</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";

export { MarkdownEditor };
