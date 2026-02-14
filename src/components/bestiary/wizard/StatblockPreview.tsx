import { MonsterFormData, abilityMod } from "@/hooks/useMonsterForm";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StatblockPreviewProps {
  data: MonsterFormData;
}

function modStr(score: number): string {
  const mod = abilityMod(score);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function StatblockPreview({ data }: StatblockPreviewProps) {
  const abilities = ["str", "dex", "con", "int", "wis", "cha"] as const;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-3 font-serif text-sm">
        {/* Header */}
        <div className="border-b-2 border-dragonRed pb-2">
          <h2 className="font-cinzel text-xl text-dragonRed font-bold">{data.name || "Unnamed Monster"}</h2>
          <p className="text-muted-foreground italic text-xs">
            {data.size} {data.type}{data.subtype ? ` (${data.subtype})` : ""}{data.alignment ? `, ${data.alignment}` : ""}
          </p>
        </div>

        {/* Core Stats */}
        <div className="border-b border-brass/30 pb-2 space-y-0.5 text-xs">
          <p><strong>Armor Class</strong> {data.ac}{data.armorDescription ? ` (${data.armorDescription})` : ""}</p>
          <p><strong>Hit Points</strong> {data.hpAvg}{data.hpFormula ? ` (${data.hpFormula})` : ""}</p>
          <p><strong>Speed</strong> {Object.entries(data.speeds).filter(([, v]) => v > 0).map(([k, v]) => k === "walk" ? `${v} ft.` : `${k} ${v} ft.`).join(", ") || "0 ft."}</p>
        </div>

        {/* Abilities */}
        <div className="grid grid-cols-6 text-center border-b border-brass/30 pb-2">
          {abilities.map(a => (
            <div key={a} className="space-y-0.5">
              <div className="font-bold text-[10px] uppercase text-brass">{a}</div>
              <div className="text-xs">{data.abilities[a]} ({modStr(data.abilities[a])})</div>
            </div>
          ))}
        </div>

        {/* Saves, Skills, etc */}
        <div className="border-b border-brass/30 pb-2 space-y-0.5 text-xs">
          {Object.values(data.saveProficiencies).some(Boolean) && (
            <p><strong>Saving Throws</strong> {abilities.filter(a => data.saveProficiencies[a]).map(a => `${a.charAt(0).toUpperCase() + a.slice(1)} ${modStr(abilityMod(data.abilities[a]) + data.proficiencyBonus)}`).join(", ")}</p>
          )}
          {Object.keys(data.skills).length > 0 && (
            <p><strong>Skills</strong> {Object.entries(data.skills).map(([k, v]) => `${k} +${v}`).join(", ")}</p>
          )}
          {data.resistances.length > 0 && <p><strong>Damage Resistances</strong> {data.resistances.join(", ")}</p>}
          {data.immunities.length > 0 && <p><strong>Damage Immunities</strong> {data.immunities.join(", ")}</p>}
          {data.vulnerabilities.length > 0 && <p><strong>Damage Vulnerabilities</strong> {data.vulnerabilities.join(", ")}</p>}
          {data.conditionImmunities.length > 0 && <p><strong>Condition Immunities</strong> {data.conditionImmunities.join(", ")}</p>}
          {Object.keys(data.senses).length > 0 && <p><strong>Senses</strong> {Object.entries(data.senses).map(([k, v]) => `${k} ${v} ft.`).join(", ")}</p>}
          {data.languages && <p><strong>Languages</strong> {data.languages}</p>}
          <p><strong>Challenge</strong> {data.cr} (Proficiency Bonus +{data.proficiencyBonus})</p>
        </div>

        {/* Traits */}
        {data.traits.length > 0 && (
          <div className="space-y-1.5">
            {data.traits.map((t, i) => (
              <p key={i} className="text-xs"><strong className="italic">{t.name}.</strong> {t.description}</p>
            ))}
          </div>
        )}

        {/* Actions by category */}
        {["action", "bonus_action", "reaction", "legendary", "lair"].map(cat => {
          const items = data.actions.filter(a => a.category === cat);
          if (items.length === 0) return null;
          const labels: Record<string, string> = { action: "Actions", bonus_action: "Bonus Actions", reaction: "Reactions", legendary: "Legendary Actions", lair: "Lair Actions" };
          return (
            <div key={cat} className="space-y-1.5">
              <h3 className="font-cinzel text-sm text-dragonRed border-b border-dragonRed/30 pb-0.5">{labels[cat]}</h3>
              {items.map((a, i) => (
                <p key={i} className="text-xs"><strong className="italic">{a.name}{a.recharge ? ` (${a.recharge})` : ""}.</strong> {a.description}</p>
              ))}
            </div>
          );
        })}

        {/* Spellcasting */}
        {data.hasSpellcasting && (
          <div className="space-y-1">
            <h3 className="font-cinzel text-sm text-dragonRed border-b border-dragonRed/30 pb-0.5">Spellcasting</h3>
            <p className="text-xs">
              <strong>Ability:</strong> {data.spellcasting.ability.toUpperCase()} | 
              <strong> Save DC:</strong> {data.spellcasting.saveDC} | 
              <strong> Attack:</strong> +{data.spellcasting.attackBonus}
            </p>
            {Object.entries(data.spellcasting.spells).map(([level, spells]) => (
              <p key={level} className="text-xs"><strong>{level}:</strong> {(spells as string[]).join(", ")}</p>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
