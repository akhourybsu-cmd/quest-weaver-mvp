import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useState } from "react";

interface QuestDialogNotesProps {
  dmNotes: string;
  onDmNotesChange: (val: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function QuestDialogNotes({
  dmNotes, onDmNotesChange,
  tags, onTagsChange,
}: QuestDialogNotesProps) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      onTagsChange([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    onTagsChange(tags.filter(t => t !== tag));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="dm-notes" className="text-sm font-cinzel text-foreground/80">
          DM Notes
        </Label>
        <p className="text-xs text-muted-foreground">Hidden from players. Behind-the-scenes notes, secrets, or plot hooks.</p>
        <Textarea
          id="dm-notes"
          value={dmNotes}
          onChange={(e) => onDmNotesChange(e.target.value)}
          placeholder="The villain is actually the quest giver's brother..."
          rows={5}
          className="border-brass/20"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tags</Label>
        <div className="flex gap-2">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag..."
            className="h-8 text-sm border-brass/20"
          />
          <Button type="button" variant="outline" size="sm" onClick={addTag} className="h-8 border-brass/30">
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => removeTag(tag)} />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
