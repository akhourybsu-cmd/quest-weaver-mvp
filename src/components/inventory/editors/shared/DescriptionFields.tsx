import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Item description..."
          rows={3}
        />
      </div>
      
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
