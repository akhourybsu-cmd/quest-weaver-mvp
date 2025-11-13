import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MATERIALS } from "@/lib/itemConstants";

interface CommonItemFieldsProps {
  weight: string;
  setWeight: (weight: string) => void;
  quantity: string;
  setQuantity: (quantity: string) => void;
  material: string;
  setMaterial: (material: string) => void;
  tags: string;
  setTags: (tags: string) => void;
}

export const CommonItemFields = ({
  weight,
  setWeight,
  quantity,
  setQuantity,
  material,
  setMaterial,
  tags,
  setTags
}: CommonItemFieldsProps) => {
  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Weight (lbs)</Label>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0"
          />
        </div>
        
        <div className="space-y-2">
          <Label>Quantity</Label>
          <Input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="1"
          />
        </div>

        <div className="space-y-2">
          <Label>Material</Label>
          <Select value={material} onValueChange={setMaterial}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATERIALS.map((mat) => (
                <SelectItem key={mat} value={mat}>{mat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tags (comma-separated)</Label>
        <Input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="magical, enchanted, rare"
        />
      </div>
    </>
  );
};
