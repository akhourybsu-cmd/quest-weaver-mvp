import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Heart, Zap, Swords, User, MapPin, ScrollText, Sparkles } from "lucide-react";

interface BetaResultRendererProps {
  assetType: string;
  data: Record<string, any>;
}

// Ordered field groups per asset type for structured display
const FIELD_GROUPS: Record<string, { label: string; icon?: React.ReactNode; fields: string[] }[]> = {
  monster: [
    { label: "Combat Stats", icon: <Shield className="h-3.5 w-3.5" />, fields: ["hit_points", "armor_class", "speed", "size", "type", "challenge_rating"] },
    { label: "Abilities", icon: <Zap className="h-3.5 w-3.5" />, fields: ["str", "dex", "con", "int", "wis", "cha", "abilities"] },
    { label: "Actions & Traits", icon: <Swords className="h-3.5 w-3.5" />, fields: ["actions", "traits", "reactions", "legendary_actions", "special_abilities"] },
    { label: "Details", fields: ["senses", "languages", "skills", "saving_throws", "damage_resistances", "damage_immunities", "condition_immunities", "description", "lore"] },
  ],
  npc: [
    { label: "Identity", icon: <User className="h-3.5 w-3.5" />, fields: ["role", "pronouns", "alignment", "race", "ancestry", "class", "occupation"] },
    { label: "Appearance & Personality", fields: ["appearance", "personality", "mannerisms", "voice", "ideal", "bond", "flaw"] },
    { label: "Background", fields: ["background", "backstory", "goals", "fears", "secrets"] },
    { label: "Hooks & Connections", icon: <Sparkles className="h-3.5 w-3.5" />, fields: ["hooks", "connections", "faction", "location", "relationships"] },
  ],
  quest: [
    { label: "Overview", icon: <ScrollText className="h-3.5 w-3.5" />, fields: ["description", "quest_type", "difficulty", "quest_giver"] },
    { label: "Objectives & Stages", fields: ["objectives", "stages", "milestones", "steps"] },
    { label: "Complications", icon: <Zap className="h-3.5 w-3.5" />, fields: ["complications", "twists", "encounters", "obstacles"] },
    { label: "Rewards & Resolution", fields: ["rewards", "consequences", "resolution", "reward_gp", "reward_xp"] },
  ],
  lore: [
    { label: "Content", icon: <ScrollText className="h-3.5 w-3.5" />, fields: ["content", "names", "rumors"] },
    { label: "Significance", fields: ["significance", "truthfulness", "cultural_notes"] },
    { label: "Connections & Seeds", icon: <Sparkles className="h-3.5 w-3.5" />, fields: ["connections", "mysteries", "plot_seeds", "hooks", "sources"] },
  ],
  settlement: [
    { label: "Overview", icon: <MapPin className="h-3.5 w-3.5" />, fields: ["settlement_type", "population", "government", "description", "sensory_description"] },
    { label: "Notable Locations", fields: ["notable_locations", "landmarks", "districts"] },
    { label: "Notable NPCs", icon: <User className="h-3.5 w-3.5" />, fields: ["notable_npcs", "leaders", "key_figures"] },
    { label: "Plot Hooks & Lore", icon: <Sparkles className="h-3.5 w-3.5" />, fields: ["plot_hooks", "rumors", "history", "conflicts", "economy", "culture", "defenses"] },
  ],
};

const TITLE_KEYS = ['name', 'title', 'event_name'];

function formatValue(value: any): string {
  if (Array.isArray(value)) return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('\n• ');
  if (typeof value === 'object' && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
}

function StatBox({ label, value }: { label: string; value: any }) {
  return (
    <div className="text-center p-2 rounded-md bg-muted border border-border">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-foreground mt-0.5">{String(value)}</div>
    </div>
  );
}

function FieldDisplay({ label, value }: { label: string; value: any }) {
  const displayValue = Array.isArray(value) ? '• ' + formatValue(value) : formatValue(value);
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground capitalize">{label.replace(/_/g, ' ')}</Label>
      <p className="text-sm text-foreground whitespace-pre-wrap">{displayValue}</p>
    </div>
  );
}

function MonsterRenderer({ data }: { data: Record<string, any> }) {
  const statKeys = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
  const hasStats = statKeys.some(k => data[k] !== undefined);

  return (
    <div className="space-y-4">
      {/* Combat header */}
      <div className="grid grid-cols-3 gap-2">
        {data.hit_points && <StatBox label="HP" value={data.hit_points} />}
        {data.armor_class && <StatBox label="AC" value={data.armor_class} />}
        {data.speed && <StatBox label="Speed" value={data.speed} />}
      </div>
      {(data.size || data.type || data.challenge_rating) && (
        <div className="flex gap-2 flex-wrap">
          {data.size && <Badge variant="outline">{data.size}</Badge>}
          {data.type && <Badge variant="outline">{data.type}</Badge>}
          {data.challenge_rating && <Badge variant="outline" className="border-destructive/30 text-destructive">CR {data.challenge_rating}</Badge>}
        </div>
      )}
      {/* Ability scores */}
      {hasStats && (
        <div className="grid grid-cols-6 gap-1.5">
          {statKeys.map(k => data[k] !== undefined && <StatBox key={k} label={k.toUpperCase()} value={data[k]} />)}
        </div>
      )}
    </div>
  );
}

export function BetaResultRenderer({ assetType, data }: BetaResultRendererProps) {
  const groups = FIELD_GROUPS[assetType];

  // Monster gets a special stat block header
  if (assetType === 'monster') {
    const renderedKeys = new Set(TITLE_KEYS);
    return (
      <div className="space-y-4">
        <MonsterRenderer data={data} />
        {renderGroupedFields(data, groups, renderedKeys)}
      </div>
    );
  }

  if (groups) {
    const renderedKeys = new Set(TITLE_KEYS);
    return <div className="space-y-4">{renderGroupedFields(data, groups, renderedKeys)}</div>;
  }

  // Fallback: enhanced key-value
  return (
    <div className="grid gap-3">
      {Object.entries(data).map(([key, value]) => {
        if (TITLE_KEYS.includes(key)) return null;
        return <FieldDisplay key={key} label={key} value={value} />;
      })}
    </div>
  );
}

function renderGroupedFields(
  data: Record<string, any>,
  groups: { label: string; icon?: React.ReactNode; fields: string[] }[],
  renderedKeys: Set<string>
) {
  const elements: React.ReactNode[] = [];

  for (const group of groups) {
    const fields = group.fields.filter(f => data[f] !== undefined && data[f] !== null && data[f] !== '');
    if (fields.length === 0) continue;
    fields.forEach(f => renderedKeys.add(f));

    elements.push(
      <div key={group.label} className="space-y-2">
        <div className="flex items-center gap-1.5">
          {group.icon && <span className="text-brand-brass">{group.icon}</span>}
          <span className="text-xs font-cinzel font-semibold uppercase tracking-wider text-muted-foreground">{group.label}</span>
        </div>
        <Separator className="bg-border" />
        <div className="grid gap-2.5">
          {fields.map(f => <FieldDisplay key={f} label={f} value={data[f]} />)}
        </div>
      </div>
    );
  }

  // Remaining ungrouped fields
  const remaining = Object.entries(data).filter(([k]) => !renderedKeys.has(k) && data[k] !== undefined && data[k] !== null && data[k] !== '');
  if (remaining.length > 0) {
    elements.push(
      <div key="__remaining" className="space-y-2">
        <span className="text-xs font-cinzel font-semibold uppercase tracking-wider text-muted-foreground">Other Details</span>
        <Separator className="bg-border" />
        <div className="grid gap-2.5">
          {remaining.map(([k, v]) => <FieldDisplay key={k} label={k} value={v} />)}
        </div>
      </div>
    );
  }

  return elements;
}
