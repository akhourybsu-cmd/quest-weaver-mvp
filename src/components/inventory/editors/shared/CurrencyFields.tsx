import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Currency } from "@/lib/itemConstants";

interface CurrencyFieldsProps {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const CurrencyFields = ({ currency, setCurrency }: CurrencyFieldsProps) => {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="space-y-2">
        <Label>CP</Label>
        <Input
          type="number"
          min="0"
          value={currency.cp}
          onChange={(e) => setCurrency({...currency, cp: parseInt(e.target.value) || 0})}
        />
      </div>
      <div className="space-y-2">
        <Label>SP</Label>
        <Input
          type="number"
          min="0"
          value={currency.sp}
          onChange={(e) => setCurrency({...currency, sp: parseInt(e.target.value) || 0})}
        />
      </div>
      <div className="space-y-2">
        <Label>GP</Label>
        <Input
          type="number"
          min="0"
          value={currency.gp}
          onChange={(e) => setCurrency({...currency, gp: parseInt(e.target.value) || 0})}
        />
      </div>
      <div className="space-y-2">
        <Label>PP</Label>
        <Input
          type="number"
          min="0"
          value={currency.pp}
          onChange={(e) => setCurrency({...currency, pp: parseInt(e.target.value) || 0})}
        />
      </div>
    </div>
  );
};
