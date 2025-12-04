import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  Compass, Flag, User, Clock, Sparkles, Wand2, 
  Eye, EyeOff, Link2
} from "lucide-react";

interface LoreHeroHeaderProps {
  title: string;
  category: string;
  visibility?: "DM_ONLY" | "SHARED" | "PUBLIC";
  era?: string;
  slug?: string;
  subtitle?: string;
  children?: ReactNode;
}

const categoryConfig: Record<string, { icon: typeof Compass; label: string; accentClass: string }> = {
  regions: { icon: Compass, label: "Region", accentClass: "lore-accent-regions" },
  factions: { icon: Flag, label: "Faction", accentClass: "lore-accent-factions" },
  npcs: { icon: User, label: "NPC", accentClass: "lore-accent-npcs" },
  history: { icon: Clock, label: "History", accentClass: "lore-accent-history" },
  religion: { icon: Sparkles, label: "Myth & Faith", accentClass: "lore-accent-religion" },
  magic: { icon: Wand2, label: "Magic", accentClass: "lore-accent-magic" },
};

export default function LoreHeroHeader({ 
  title, 
  category, 
  visibility = "DM_ONLY",
  era,
  slug,
  subtitle,
  children 
}: LoreHeroHeaderProps) {
  const config = categoryConfig[category] || categoryConfig.regions;
  const IconComponent = config.icon;

  return (
    <div className={`lore-hero-header ${config.accentClass}`}>
      <div className="flex items-start gap-4">
        {/* Category Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-card/80 border border-brass/30 flex items-center justify-center">
          <IconComponent className="w-6 h-6 text-brass" />
        </div>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold font-serif text-foreground mb-1 truncate">
            {title || "New Entry"}
          </h2>
          
          {/* Subtitle row with category, era, visibility */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">{config.label}</span>
            {era && (
              <>
                <span className="opacity-50">•</span>
                <span>{era}</span>
              </>
            )}
            <span className="opacity-50">•</span>
            <Badge 
              variant={visibility === "SHARED" ? "default" : "secondary"} 
              className="text-xs h-5"
            >
              {visibility === "DM_ONLY" && <EyeOff className="w-3 h-3 mr-1" />}
              {visibility === "SHARED" && <Eye className="w-3 h-3 mr-1" />}
              {visibility === "DM_ONLY" ? "DM Only" : "Shared"}
            </Badge>
          </div>

          {/* Slug chip */}
          {slug && (
            <div className="mt-2">
              <span className="slug-chip">
                <Link2 className="w-3 h-3" />
                {slug}
              </span>
            </div>
          )}

          {subtitle && (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Optional children for additional content */}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
