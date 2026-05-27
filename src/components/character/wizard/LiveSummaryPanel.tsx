import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { calculateModifier, calculateProficiencyBonus } from "@/lib/dnd5e";
import { computeTotalHP } from "@/lib/hpCalculation";
import { useAtom } from "jotai";
import { draftAtom } from "@/state/characterWizard";
import { SRD } from "@/lib/srd/SRDClient";
import { Heart, Shield, Zap, User, Sparkles } from "lucide-react";

const ABILITY_LABELS: Record<string, string> = {
  STR: "Str", DEX: "Dex", CON: "Con",
  INT: "Int", WIS: "Wis", CHA: "Cha",
};

const LiveSummaryPanel = () => {
  const [draft] = useAtom(draftAtom);
  const [ancestryName, setAncestryName] = useState<string>("");
  const [backgroundName, setBackgroundName] = useState<string>("");

  const abilityBonuses = draft.grants.abilityBonuses || {};
  const profBonus = calculateProficiencyBonus(draft.level);

  const dexBonus =
    abilityBonuses["dex"] || abilityBonuses["DEX"] || abilityBonuses["Dex"] || 0;
  const effectiveDex = draft.abilityScores.DEX + dexBonus;
  const dexMod = calculateModifier(effectiveDex);

  const levelChoices = draft.choices?.featureChoices?.levelChoices;
  const maxHP = computeTotalHP(
    draft.className,
    draft.level,
    draft.abilityScores.CON,
    levelChoices,
    abilityBonuses
  );

  const baseAC = 10 + dexMod;

  // Completion tracking
  const completionSteps = [
    { name: "Name",       done: !!draft.name },
    { name: "Class",      done: !!draft.classId },
    { name: "Ancestry",   done: !!draft.ancestryId },
    { name: "Background", done: !!draft.backgroundId },
    { name: "Abilities",  done: Object.values(draft.abilityScores).some(v => v !== 10) },
    { name: "Skills",     done: draft.choices.skills.length > 0 },
    { name: "Equipment",  done: !!draft.choices.equipmentBundleId },
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  useEffect(() => {
    const loadNames = async () => {
      if (draft.ancestryId) {
        const ancestries = await SRD.ancestries();
        const found = ancestries.find(a => a.id === draft.ancestryId);
        setAncestryName(found?.name || "");
      }
      if (draft.backgroundId) {
        const backgrounds = await SRD.backgrounds();
        const found = backgrounds.find(b => b.id === draft.backgroundId);
        setBackgroundName(found?.name || "");
      }
    };
    loadNames();
  }, [draft.ancestryId, draft.backgroundId]);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <p className="font-cinzel text-[9px] tracking-[0.3em] uppercase text-muted-foreground/60 leading-none mb-1.5">
          In Progress
        </p>
        <h3 className="font-cinzel font-bold text-base tracking-wide text-foreground leading-tight">
          Character Summary
        </h3>
        <div className="mt-2 h-px bg-gradient-to-r from-transparent via-brass/50 to-transparent" />
      </div>

      {/* ── Progress ────────────────────────────────────────────── */}
      <div className="fantasy-section p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="font-cinzel text-[10px] tracking-widest uppercase text-muted-foreground">
            Completion
          </span>
          <span className="font-cinzel text-sm font-bold" style={{ color: "hsl(var(--brass))" }}>
            {completionPercent}%
          </span>
        </div>
        <Progress
          value={completionPercent}
          className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-brass/70 [&>div]:to-brass [&>div]:transition-[width] [&>div]:duration-500"
        />
        <div className="flex flex-wrap gap-1">
          {completionSteps.map((step, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-cinzel tracking-wide border transition-all ${
                step.done
                  ? "border-brass/60 text-foreground"
                  : "border-border/50 text-muted-foreground/50"
              }`}
              style={step.done ? { backgroundColor: "hsl(var(--brass) / 0.15)" } : {}}
            >
              {step.done && (
                <span className="mr-0.5 text-[8px]" style={{ color: "hsl(var(--brass))" }}>✦</span>
              )}
              {step.name}
            </span>
          ))}
        </div>
      </div>

      {/* ── Identity ────────────────────────────────────────────── */}
      <div className="fantasy-section p-3 space-y-0">
        <div className="flex items-center gap-1.5 mb-2.5">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="fantasy-section-header mb-0 pb-0 border-b-0 text-[10px]">Identity</span>
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Name",       value: draft.name || null },
            { label: "Level",      value: draft.level ? String(draft.level) : null },
            { label: "Class",      value: draft.className || null },
            { label: "Ancestry",   value: ancestryName || null },
            { label: "Background", value: backgroundName || null },
          ]
            .filter(row => row.value)
            .map((row, idx) => (
              <div key={idx} className="flex items-baseline justify-between gap-2">
                <span className="font-cinzel text-[9px] tracking-widest uppercase text-muted-foreground/70 shrink-0">
                  {row.label}
                </span>
                <span className="font-cormorant text-sm italic text-foreground truncate text-right">
                  {row.value}
                </span>
              </div>
            ))}
          {!draft.name && !draft.classId && (
            <p className="font-cormorant italic text-xs text-muted-foreground/60 text-center py-1">
              Your story awaits…
            </p>
          )}
        </div>
      </div>

      {/* ── Combat Stats ────────────────────────────────────────── */}
      <div className="fantasy-section p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Zap className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="fantasy-section-header mb-0 pb-0 border-b-0 text-[10px]">Combat</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {/* HP */}
          <div className="parchment-inset rounded-md border border-border/40 flex flex-col items-center py-2.5 gap-1">
            <Heart className="h-3.5 w-3.5 text-destructive/80" />
            <span className="font-cinzel font-bold text-lg leading-none text-foreground">
              {maxHP}
            </span>
            <span className="font-cinzel text-[9px] tracking-[0.15em] uppercase text-muted-foreground">HP</span>
          </div>
          {/* AC */}
          <div className="parchment-inset rounded-md border border-border/40 flex flex-col items-center py-2.5 gap-1">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="font-cinzel font-bold text-lg leading-none text-foreground">
              {baseAC}
            </span>
            <span className="font-cinzel text-[9px] tracking-[0.15em] uppercase text-muted-foreground">AC</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {/* Prof bonus */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 border border-border/30">
            <span className="font-cinzel text-[9px] tracking-widest uppercase text-muted-foreground">Prof</span>
            <span className="font-cinzel font-bold text-sm text-foreground">+{profBonus}</span>
          </div>
          {/* Initiative */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md bg-muted/30 border border-border/30">
            <span className="font-cinzel text-[9px] tracking-widest uppercase text-muted-foreground">Init</span>
            <span className="font-cinzel font-bold text-sm text-foreground">
              {dexMod >= 0 ? "+" : ""}{dexMod}
            </span>
          </div>
        </div>
      </div>

      {/* ── Ability Scores ──────────────────────────────────────── */}
      <div className="fantasy-section p-3">
        <span className="fantasy-section-header text-[10px]">Ability Scores</span>
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(draft.abilityScores).map(([ability, score]) => {
            const bonus =
              abilityBonuses[ability.toLowerCase()] || abilityBonuses[ability] || 0;
            const effective = score + bonus;
            const modifier = calculateModifier(effective);
            const label = ABILITY_LABELS[ability] || ability;
            return (
              <div
                key={ability}
                className="parchment-inset flex flex-col items-center py-2 rounded-md border border-border/30"
              >
                <span className="font-cinzel text-[9px] tracking-widest uppercase text-muted-foreground leading-none mb-1">
                  {label}
                </span>
                <span className="font-cinzel font-bold text-sm leading-none text-foreground">
                  {modifier >= 0 ? "+" : ""}{modifier}
                </span>
                <span className="font-cinzel text-[9px] text-muted-foreground/60 leading-none mt-0.5">
                  {effective}
                </span>
                {bonus > 0 && (
                  <span className="font-cinzel text-[8px] leading-none mt-0.5" style={{ color: "hsl(var(--primary))" }}>
                    +{bonus}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Skills ──────────────────────────────────────────────── */}
      {draft.choices.skills.length > 0 && (
        <div className="fantasy-section p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="fantasy-section-header text-[10px] mb-0 pb-0 border-b-0">Skills</span>
            <span className="font-cinzel text-[10px] text-muted-foreground">
              {draft.choices.skills.length}
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {draft.choices.skills.slice(0, 8).map((skill, idx) => (
              <span
                key={idx}
                className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-cinzel border border-border/40 bg-muted/30 text-foreground/80"
              >
                {skill}
              </span>
            ))}
            {draft.choices.skills.length > 8 && (
              <span className="inline-flex px-1.5 py-0.5 rounded text-[9px] font-cinzel border border-brass/30 text-muted-foreground"
                style={{ backgroundColor: "hsl(var(--brass) / 0.08)" }}>
                +{draft.choices.skills.length - 8}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Spells ──────────────────────────────────────────────── */}
      {draft.choices.spellsKnown.length > 0 && (
        <div className="fantasy-section p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="fantasy-section-header mb-0 pb-0 border-b-0 text-[10px]">Spells</span>
          </div>
          <p className="font-cormorant italic text-sm text-foreground/80">
            {draft.choices.spellsKnown.length} spell{draft.choices.spellsKnown.length !== 1 ? "s" : ""} chosen
          </p>
        </div>
      )}

    </div>
  );
};

export default LiveSummaryPanel;
