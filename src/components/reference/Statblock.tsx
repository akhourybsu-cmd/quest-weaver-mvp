import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SimpleMarkdown } from "./SimpleMarkdown";
import type { NormalizedRulesItem } from "@/lib/rulesApi/types";

/** Coerce any of the half-dozen ways APIs report a numeric stat. */
function num(v: unknown, fallback = 0): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    if (!Number.isNaN(n)) return n;
  }
  if (Array.isArray(v) && v.length > 0) return num((v[0] as any)?.value ?? v[0], fallback);
  if (v && typeof v === "object") {
    const o = v as any;
    if (typeof o.value === "number") return o.value;
    if (typeof o.average === "number") return o.average;
  }
  return fallback;
}

function mod(score: number) {
  const m = Math.floor((score - 10) / 2);
  return m >= 0 ? `+${m}` : String(m);
}

function joinish(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    return v
      .map((x) =>
        typeof x === "string"
          ? x
          : (x as any)?.name ?? (x as any)?.type ?? "",
      )
      .filter(Boolean)
      .join(", ");
  }
  return "";
}

/**
 * Renders a 5e SRD-style statblock from a NormalizedRulesItem creature.
 * Tolerates both Open5e v2 and D&D 5e API field shapes.
 */
export function Statblock({ item }: { item: NormalizedRulesItem }) {
  const m = item.normalized_json as any;

  const size = m.size?.name ?? m.size ?? "";
  const type = m.type?.name ?? m.type ?? "";
  const alignment = m.alignment ?? "";
  const ac = num(m.ac ?? m.armor_class);
  const hp = num(m.hp ?? m.hit_points);
  const hpFormula = m.hit_dice ?? m.hit_points_roll ?? "";
  const speed = m.speed ?? m.movement ?? {};

  const stats = {
    STR: num(m.strength ?? m.str ?? m.scores?.strength, 10),
    DEX: num(m.dexterity ?? m.dex ?? m.scores?.dexterity, 10),
    CON: num(m.constitution ?? m.con ?? m.scores?.constitution, 10),
    INT: num(m.intelligence ?? m.int ?? m.scores?.intelligence, 10),
    WIS: num(m.wisdom ?? m.wis ?? m.scores?.wisdom, 10),
    CHA: num(m.charisma ?? m.cha ?? m.scores?.charisma, 10),
  };

  const cr = m.cr ?? m.challenge_rating;
  const traits: any[] = m.traits ?? m.special_abilities ?? [];
  const actions: any[] = m.actions ?? [];
  const reactions: any[] = m.reactions ?? [];
  const legendary: any[] = m.legendary_actions ?? [];

  return (
    <Card className="p-4 space-y-3">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold">{item.name}</h2>
        <div className="text-sm text-muted-foreground italic capitalize">
          {[size, type].filter(Boolean).join(" ")}
          {alignment ? `, ${alignment}` : ""}
        </div>
      </header>

      <div className="border-t border-b py-2 text-sm space-y-1">
        <div><strong>Armor Class</strong> {ac || "—"}</div>
        <div>
          <strong>Hit Points</strong> {hp || "—"}
          {hpFormula && <span className="text-muted-foreground"> ({hpFormula})</span>}
        </div>
        <div>
          <strong>Speed</strong>{" "}
          {typeof speed === "string"
            ? speed
            : Object.entries(speed || {})
                .filter(([, v]) => v !== undefined && v !== null && v !== false)
                .map(([k, v]) => (k === "walk" ? `${v} ft.` : `${k} ${v} ft.`))
                .join(", ") || "—"}
        </div>
      </div>

      <div className="grid grid-cols-6 gap-1 text-center text-xs border-b pb-2">
        {Object.entries(stats).map(([k, v]) => (
          <div key={k}>
            <div className="font-semibold text-muted-foreground">{k}</div>
            <div className="font-bold text-base">{v}</div>
            <div className="text-muted-foreground">{mod(v)}</div>
          </div>
        ))}
      </div>

      <div className="text-xs space-y-1">
        {m.saving_throws && (
          <div><strong>Saving Throws</strong> {joinish(m.saving_throws)}</div>
        )}
        {m.skills && (
          <div><strong>Skills</strong> {joinish(m.skills)}</div>
        )}
        {m.damage_resistances && (
          <div><strong>Resistances</strong> {joinish(m.damage_resistances)}</div>
        )}
        {m.damage_immunities && (
          <div><strong>Immunities</strong> {joinish(m.damage_immunities)}</div>
        )}
        {m.condition_immunities && (
          <div><strong>Condition Immunities</strong> {joinish(m.condition_immunities)}</div>
        )}
        {m.senses && (
          <div><strong>Senses</strong> {typeof m.senses === "string" ? m.senses : joinish(Object.entries(m.senses).map(([k, v]) => `${k} ${v}`))}</div>
        )}
        {m.languages !== undefined && (
          <div><strong>Languages</strong> {joinish(m.languages) || "—"}</div>
        )}
        {cr !== undefined && cr !== null && (
          <div><strong>Challenge</strong> {String(cr)}</div>
        )}
      </div>

      {traits.length > 0 && (
        <Section title="Traits" entries={traits} />
      )}
      {actions.length > 0 && (
        <Section title="Actions" entries={actions} />
      )}
      {reactions.length > 0 && (
        <Section title="Reactions" entries={reactions} />
      )}
      {legendary.length > 0 && (
        <Section title="Legendary Actions" entries={legendary} />
      )}

      <div className="flex gap-1 flex-wrap pt-2 border-t">
        {item.source_document && <Badge variant="outline" className="text-[10px]">{item.source_document}</Badge>}
        {item.license_type && <Badge variant="outline" className="text-[10px]">{item.license_type}</Badge>}
      </div>
    </Card>
  );
}

function Section({ title, entries }: { title: string; entries: any[] }) {
  return (
    <div className="space-y-2 pt-2 border-t">
      <h3 className="text-sm font-semibold">{title}</h3>
      {entries.map((e, i) => (
        <div key={i} className="text-xs">
          <div className="font-medium">{e.name}{e.usage?.times ? ` (${e.usage.times}/${e.usage.type})` : ""}</div>
          <SimpleMarkdown text={e.desc ?? e.description ?? ""} />
        </div>
      ))}
    </div>
  );
}