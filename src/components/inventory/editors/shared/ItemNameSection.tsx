import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ItemNameSectionProps {
  name: string;
  setName: (name: string) => void;
}

export const ItemNameSection = ({ name, setName }: ItemNameSectionProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="name">Item Name *</Label>
      <Input
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter item name"
        className="text-lg font-semibold"
      />
    </div>
  );
};
