import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Edit3 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  activeTab, 
  onTabChange,
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
      <p className="text-xs text-muted-foreground">
        Use: [[Page]], @NPC, #Location, %Faction, !Quest, $Item
      </p>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="edit" className="gap-1.5">
            <Edit3 className="w-3.5 h-3.5" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Read
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="edit" className="mt-2">
          <Textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            rows={rows}
            className="font-mono text-sm bg-card/50 border-brass/20 focus:border-brass/40"
            placeholder={placeholder}
          />
        </TabsContent>
        
        <TabsContent value="preview" className="mt-2">
          <div className="fantasy-chronicle min-h-[300px] p-6">
            {content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none fantasy-drop-cap">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
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
