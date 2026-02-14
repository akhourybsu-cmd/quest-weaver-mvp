import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { UnifiedMonster } from "./MonsterCard";

interface MonsterDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monster: UnifiedMonster | null;
}

function modStr(score: number): string {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function renderActionList(label: string, actions: any[]) {
  if (!actions || actions.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <h3 className="font-cinzel text-sm text-dragonRed border-b border-dragonRed/30 pb-0.5">{label}</h3>
      {actions.map((a: any, i: number) => (
        <p key={i} className="text-xs">
          <strong className="italic">{a.name}.</strong> {a.description}
        </p>
      ))}
    </div>
  );
}

export function MonsterDetailDialog({ open, onOpenChange, monster }: MonsterDetailDialogProps) {
  if (!monster) return null;

  const abilities = monster.abilities || {};
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"];
  const speeds = monster.speed || {};
  const saves = monster.saves || {};
  const skills = monster.skills || {};
  const senses = monster.senses || {};
  const traits = monster.traits || [];
  const actions = monster.actions || [];
  const reactions = monster.reactions || [];
  const legendaryActions = monster.legendary_actions || [];
  const lairActions = monster.lair_actions || [];
  const immunities = monster.immunities || [];
  const resistances = monster.resistances || [];
  const vulnerabilities = monster.vulnerabilities || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] fantasy-border-ornaments bg-card p-0">
        <ScrollArea className="max-h-[82vh]">
          <div className="p-6 space-y-3 font-serif text-sm">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-xl text-dragonRed">{monster.name}</DialogTitle>
              <p className="text-muted-foreground italic text-xs">
                {monster.size} {monster.type}{monster.alignment ? `, ${monster.alignment}` : ""}
              </p>
            </DialogHeader>

            <div className="border-y border-brass/30 py-2 space-y-0.5 text-xs">
              <p><strong>Armor Class</strong> {monster.ac}</p>
              <p><strong>Hit Points</strong> {monster.hp_avg}{monster.hp_formula ? ` (${monster.hp_formula})` : ""}</p>
              <p><strong>Speed</strong> {Object.entries(speeds).filter(([, v]) => Number(v) > 0).map(([k, v]) => k === "walk" ? `${v} ft.` : `${k} ${v} ft.`).join(", ") || "30 ft."}</p>
            </div>

            <div className="grid grid-cols-6 text-center border-b border-brass/30 pb-2">
              {abilityKeys.map(a => (
                <div key={a} className="space-y-0.5">
                  <div className="font-bold text-[10px] uppercase text-brass">{a}</div>
                  <div className="text-xs">{abilities[a] || 10} ({modStr(abilities[a] || 10)})</div>
                </div>
              ))}
            </div>

            <div className="border-b border-brass/30 pb-2 space-y-0.5 text-xs">
              {Object.keys(saves).length > 0 && (
                <p><strong>Saving Throws</strong> {Object.entries(saves).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)} +${v}`).join(", ")}</p>
              )}
              {Object.keys(skills).length > 0 && (
                <p><strong>Skills</strong> {Object.entries(skills).map(([k, v]) => `${k} +${v}`).join(", ")}</p>
              )}
              {resistances.length > 0 && <p><strong>Damage Resistances</strong> {resistances.join(", ")}</p>}
              {immunities.length > 0 && <p><strong>Damage Immunities</strong> {immunities.join(", ")}</p>}
              {vulnerabilities.length > 0 && <p><strong>Vulnerabilities</strong> {vulnerabilities.join(", ")}</p>}
              {senses && (typeof senses === "string" ? senses : Object.keys(senses).length > 0) && (
                <p><strong>Senses</strong> {typeof senses === "string" ? senses : Object.entries(senses).map(([k, v]) => `${k} ${v} ft.`).join(", ")}</p>
              )}
              {monster.languages && <p><strong>Languages</strong> {monster.languages}</p>}
              <p><strong>Challenge</strong> {monster.cr ?? "?"}</p>
            </div>

            {traits.length > 0 && (
              <div className="space-y-1.5">
                {traits.map((t: any, i: number) => (
                  <p key={i} className="text-xs"><strong className="italic">{t.name}.</strong> {t.description}</p>
                ))}
              </div>
            )}

            {renderActionList("Actions", actions)}
            {renderActionList("Reactions", reactions)}
            {renderActionList("Legendary Actions", legendaryActions)}
            {renderActionList("Lair Actions", lairActions)}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
