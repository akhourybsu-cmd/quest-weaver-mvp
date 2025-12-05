import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { BookOpen } from "lucide-react";

interface LoreChronicleProps {
  content: string;
  onChange: (value: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}

export default function LoreChronicle({ 
  content, 
  onChange, 
  placeholder = "Write your lore in Markdown...\n\nUse: [[Page]], @NPC, #Location, %Faction, !Quest, $Item",
  label = "Chronicle",
  rows = 12
}: LoreChronicleProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <BookOpen className="w-4 h-4 text-brass" />
        {label}
      </div>
      
      <MarkdownEditor
        value={content}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        showPreview={true}
        hint="Use: [[Page]], @NPC, #Location, %Faction, !Quest, $Item"
        previewClassName="fantasy-chronicle fantasy-drop-cap"
      />
    </div>
  );
}
