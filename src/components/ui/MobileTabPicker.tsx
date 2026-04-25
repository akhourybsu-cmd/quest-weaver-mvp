import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface MobileTabPickerOption {
  value: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface MobileTabPickerProps {
  value: string;
  onValueChange: (value: string) => void;
  options: MobileTabPickerOption[];
  className?: string;
}

/**
 * Mobile-friendly replacement for horizontal tab strips with too many tabs.
 * Use alongside Tabs: render this on <md and the original TabsList on md+.
 */
export const MobileTabPicker = ({ value, onValueChange, options, className }: MobileTabPickerProps) => {
  const current = options.find((o) => o.value === value);
  const CurrentIcon = current?.icon;
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className ?? "w-full h-11 bg-card border-brass/30"}>
        <div className="flex items-center gap-2">
          {CurrentIcon && <CurrentIcon className="w-4 h-4 text-brass" />}
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => {
          const Icon = opt.icon;
          return (
            <SelectItem key={opt.value} value={opt.value}>
              <div className="flex items-center gap-2">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{opt.label}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};