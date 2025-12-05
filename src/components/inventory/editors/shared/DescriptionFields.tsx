import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

interface DescriptionFieldsProps {
  description: string;
  setDescription: (desc: string) => void;
  playerDescription: string;
  setPlayerDescription: (desc: string) => void;
  gmNotes: string;
  setGmNotes: (notes: string) => void;
}

export const DescriptionFields = ({
  description,
  setDescription,
  playerDescription,
  setPlayerDescription,
  gmNotes,
  setGmNotes
}: DescriptionFieldsProps) => {
  return (
    <>
      <MarkdownEditor
        value={description}
        onChange={setDescription}
        label="Description"
        placeholder="Item description..."
        rows={4}
        showPreview={false}
      />
      
      <div className="space-y-2">
        <Label>Player Description</Label>
        <Textarea
          value={playerDescription}
          onChange={(e) => setPlayerDescription(e.target.value)}
          placeholder="What players see (optional)..."
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>GM Notes</Label>
        <Textarea
          value={gmNotes}
          onChange={(e) => setGmNotes(e.target.value)}
          placeholder="Private GM notes..."
          rows={2}
        />
      </div>
    </>
  );
};
