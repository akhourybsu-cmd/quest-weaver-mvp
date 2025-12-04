import { ReactNode } from "react";
import { 
  Users, Crown, MapPin, Calendar, Tag, Coins, 
  Package, Scale, Shield, Heart, Skull, Star,
  Compass, Building, Thermometer
} from "lucide-react";

interface StatItem {
  icon: typeof Users;
  label: string;
  value: string | number | null | undefined;
}

interface LoreStatBarProps {
  stats: StatItem[];
  className?: string;
}

export default function LoreStatBar({ stats, className = "" }: LoreStatBarProps) {
  const filteredStats = stats.filter(s => s.value);

  if (filteredStats.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {filteredStats.map((stat, idx) => {
        const IconComponent = stat.icon;
        return (
          <div key={idx} className="stat-gem">
            <IconComponent className="stat-gem-icon" />
            <span>{stat.value}</span>
          </div>
        );
      })}
    </div>
  );
}

// Pre-configured stat bars for each lore type
export function RegionStatBar({ 
  regionType, 
  population, 
  government, 
  era,
  climate 
}: { 
  regionType?: string;
  population?: string;
  government?: string;
  era?: string;
  climate?: string[];
}) {
  const stats: StatItem[] = [
    { icon: Building, label: "Type", value: regionType },
    { icon: Users, label: "Population", value: population },
    { icon: Crown, label: "Government", value: government },
    { icon: Calendar, label: "Era", value: era },
    { icon: Thermometer, label: "Climate", value: climate?.join(", ") },
  ];
  return <LoreStatBar stats={stats} />;
}

export function FactionStatBar({ 
  alignment, 
  powerLevel, 
  reputation, 
  headquarters 
}: { 
  alignment?: string;
  powerLevel?: number;
  reputation?: number;
  headquarters?: string;
}) {
  const powerLabels = ["", "Minor", "Local", "Regional", "Major", "Continental"];
  const stats: StatItem[] = [
    { icon: Scale, label: "Alignment", value: alignment },
    { icon: Shield, label: "Power", value: powerLabels[powerLevel || 0] },
    { icon: Heart, label: "Reputation", value: reputation !== undefined ? `${reputation > 0 ? '+' : ''}${reputation}` : null },
    { icon: MapPin, label: "HQ", value: headquarters },
  ];
  return <LoreStatBar stats={stats} />;
}

export function NPCStatBar({ 
  race, 
  age, 
  role, 
  cr, 
  homeRegion 
}: { 
  race?: string;
  age?: string;
  role?: string;
  cr?: number | string;
  homeRegion?: string;
}) {
  const stats: StatItem[] = [
    { icon: Users, label: "Race", value: race },
    { icon: Calendar, label: "Age", value: age },
    { icon: Star, label: "Role", value: role },
    { icon: Skull, label: "CR", value: cr ? `CR ${cr}` : null },
    { icon: MapPin, label: "Home", value: homeRegion },
  ];
  return <LoreStatBar stats={stats} />;
}

export function HistoryStatBar({ 
  date, 
  era, 
  eventType 
}: { 
  date?: string;
  era?: string;
  eventType?: string;
}) {
  const stats: StatItem[] = [
    { icon: Calendar, label: "Date", value: date },
    { icon: Compass, label: "Era", value: era },
    { icon: Tag, label: "Type", value: eventType },
  ];
  return <LoreStatBar stats={stats} />;
}
