import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Users, Crown, Globe, Sparkles, History, Shield,
  User, Scroll, Package, Mountain, Landmark
} from "lucide-react";

interface LoreDetailsRendererProps {
  category: string;
  details: Record<string, any>;
  excerpt?: string | null;
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      {Icon && <Icon className="w-4 h-4 mt-0.5 text-brass shrink-0" />}
      <div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function TagList({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="py-1.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1 mt-1">
        {items.map((item, i) => (
          <Badge key={i} variant="outline" className="text-xs border-brass/30">{item}</Badge>
        ))}
      </div>
    </div>
  );
}

function RegionDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Type" value={details.type} icon={Mountain} />
      <DetailRow label="Population" value={details.population} icon={Users} />
      <DetailRow label="Government" value={details.government} icon={Crown} />
      <DetailRow label="Travel Notes" value={details.travelNotes} icon={MapPin} />
      <TagList label="Climate" items={details.climate} />
      <TagList label="Exports" items={details.exports} />
      <TagList label="Imports" items={details.imports} />
    </div>
  );
}

function NPCDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Race" value={details.race} icon={User} />
      <DetailRow label="Role" value={details.role} icon={Shield} />
      <DetailRow label="Gender" value={details.gender} />
      <DetailRow label="Age" value={details.age} />
      <DetailRow label="Personality" value={details.personality} />
      <DetailRow label="Voice" value={details.voice} />
      {details.cr && <DetailRow label="Challenge Rating" value={details.cr} />}
    </div>
  );
}

function HistoryDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Date" value={details.date} icon={History} />
      <DetailRow label="Type" value={details.type} icon={Scroll} />
      <DetailRow label="Outcome" value={details.outcome} />
      <TagList label="Sources" items={details.sources} />
    </div>
  );
}

function ReligionDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Entry Type" value={details.entryType} icon={Crown} />
      <DetailRow label="Alignment" value={details.alignment} />
      <DetailRow label="Tradition" value={details.tradition} />
      <DetailRow label="Observance Date" value={details.observanceDate} />
      <TagList label="Domains" items={details.domains} />
      <TagList label="Edicts" items={details.edicts} />
      <TagList label="Anathema" items={details.anathema} />
      <TagList label="Colors" items={details.colors} />
    </div>
  );
}

function MagicDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Type" value={details.entryType} icon={Sparkles} />
      {details.rarity && <DetailRow label="Rarity" value={details.rarity} icon={Package} />}
      {details.attunement && <DetailRow label="Attunement" value={details.attunement} />}
      <TagList label="Associated Spells" items={details.spells} />
    </div>
  );
}

function FactionDetails({ details }: { details: Record<string, any> }) {
  return (
    <div className="space-y-1">
      <DetailRow label="Type" value={details.type} icon={Shield} />
      <DetailRow label="Leader" value={details.leader} />
      <DetailRow label="Headquarters" value={details.headquarters} icon={Landmark} />
      <DetailRow label="Alignment" value={details.alignment} />
      <TagList label="Goals" items={details.goals} />
    </div>
  );
}

const CATEGORY_RENDERERS: Record<string, React.FC<{ details: Record<string, any> }>> = {
  regions: RegionDetails,
  npcs: NPCDetails,
  history: HistoryDetails,
  religion: ReligionDetails,
  pantheon: ReligionDetails,
  magic: MagicDetails,
  factions: FactionDetails,
};

export function LoreDetailsRenderer({ category, details, excerpt }: LoreDetailsRendererProps) {
  if (!details && !excerpt) return null;

  // Filter out internal/display-only keys
  const INTERNAL_KEYS = ['image_url', 'mapPin', 'parentId', 'showOnTimeline', 'era', 'statBlockUrl', 'homeRegionId', 'secrets'];
  const hasUsefulDetails = details && Object.keys(details).some(
    k => !INTERNAL_KEYS.includes(k) && details[k] !== null && details[k] !== '' && 
    !(Array.isArray(details[k]) && details[k].length === 0)
  );

  if (!hasUsefulDetails && !excerpt) return null;

  const Renderer = CATEGORY_RENDERERS[category];

  return (
    <Card className="border-brass/20 bg-card/50">
      <CardContent className="p-4 space-y-3">
        {excerpt && (
          <p className="text-sm text-muted-foreground italic border-l-2 border-brass/40 pl-3">
            {excerpt}
          </p>
        )}
        {hasUsefulDetails && Renderer && details && (
          <Renderer details={details} />
        )}
      </CardContent>
    </Card>
  );
}
