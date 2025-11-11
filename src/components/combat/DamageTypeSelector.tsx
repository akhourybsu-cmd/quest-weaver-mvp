import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Flame, Zap, Droplets, Snowflake, Skull, Sparkles, Wind, Heart, Target, Shield } from "lucide-react";

export const DAMAGE_TYPES = [
  'acid', 'bludgeoning', 'cold', 'fire', 'force',
  'lightning', 'necrotic', 'piercing', 'poison',
  'psychic', 'radiant', 'slashing', 'thunder'
] as const;

export type DamageType = typeof DAMAGE_TYPES[number];

interface DamageTypeSelectorProps {
  value: DamageType;
  onValueChange: (value: DamageType) => void;
  label?: string;
  className?: string;
}

export const DamageTypeSelector = ({ 
  value, 
  onValueChange, 
  label = "Damage Type",
  className 
}: DamageTypeSelectorProps) => {
  return (
    <div className={className}>
      {label && <Label className="mb-2">{label}</Label>}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              {getDamageTypeIcon(value)}
              <span className="capitalize">{value}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {DAMAGE_TYPES.map((type) => (
            <SelectItem key={type} value={type}>
              <div className="flex items-center gap-2">
                {getDamageTypeIcon(type)}
                <span className="capitalize">{type}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const DamageTypeBadge = ({ 
  type, 
  variant = "default" 
}: { 
  type: DamageType; 
  variant?: "default" | "outline" | "secondary" | "destructive";
}) => {
  return (
    <Badge variant={variant} className="gap-1">
      {getDamageTypeIcon(type, "h-3 w-3")}
      <span className="capitalize">{type}</span>
    </Badge>
  );
};

export const getDamageTypeIcon = (type: DamageType, className = "h-4 w-4") => {
  const icons: Record<DamageType, React.ReactNode> = {
    acid: <Droplets className={`${className} text-green-500`} />,
    bludgeoning: <Target className={`${className} text-gray-600 dark:text-gray-400`} />,
    cold: <Snowflake className={`${className} text-blue-400`} />,
    fire: <Flame className={`${className} text-orange-500`} />,
    force: <Sparkles className={`${className} text-purple-500`} />,
    lightning: <Zap className={`${className} text-yellow-400`} />,
    necrotic: <Skull className={`${className} text-gray-800 dark:text-gray-200`} />,
    piercing: <Target className={`${className} text-gray-600 dark:text-gray-400`} />,
    poison: <Droplets className={`${className} text-green-600`} />,
    psychic: <Wind className={`${className} text-pink-500`} />,
    radiant: <Sparkles className={`${className} text-yellow-300`} />,
    slashing: <Target className={`${className} text-gray-600 dark:text-gray-400`} />,
    thunder: <Wind className={`${className} text-blue-600`} />,
  };
  
  return icons[type];
};

export const getDamageTypeColor = (type: DamageType): string => {
  const colors: Record<DamageType, string> = {
    acid: 'text-green-500',
    bludgeoning: 'text-gray-600 dark:text-gray-400',
    cold: 'text-blue-400',
    fire: 'text-orange-500',
    force: 'text-purple-500',
    lightning: 'text-yellow-400',
    necrotic: 'text-gray-800 dark:text-gray-200',
    piercing: 'text-gray-600 dark:text-gray-400',
    poison: 'text-green-600',
    psychic: 'text-pink-500',
    radiant: 'text-yellow-300',
    slashing: 'text-gray-600 dark:text-gray-400',
    thunder: 'text-blue-600',
  };
  
  return colors[type];
};
