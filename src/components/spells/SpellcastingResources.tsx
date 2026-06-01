import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { SpellSlotTracker } from "@/components/spells/SpellSlotTracker";
import { WarlockPactSlots } from "@/components/spells/WarlockPactSlots";
import { MysticArcanumTracker } from "@/components/spells/MysticArcanumTracker";

interface SpellcastingResourcesProps {
  characterId: string;
  characterName: string;
  characterLevel: number;
  characterClass: string;
  /** Multiclass slot map (level -> max). Undefined = single-class fallback. */
  multiclassSlots?: Record<number, number>;

  /** Warlock fields — if null/undefined, Pact Magic section is hidden. */
  warlockLevel?: number | null;
  pactSlotsMax?: number | null;
  pactSlotsUsed?: number | null;
  pactSlotLevel?: number | null;

  /** Mystic Arcanum — only shown for Warlock 11+. */
  arcanum6Used?: boolean;
  arcanum7Used?: boolean;
  arcanum8Used?: boolean;
  arcanum9Used?: boolean;
  onArcanumUpdate?: (updates: Partial<{
    mystic_arcanum_6_used: boolean;
    mystic_arcanum_7_used: boolean;
    mystic_arcanum_8_used: boolean;
    mystic_arcanum_9_used: boolean;
  }>) => void;
}

/**
 * Themed wrapper that groups the three spellcasting resource trackers
 * under one card with Cinzel section headers:
 *
 *   Spell Slots            (multiclass / single-class regular slots)
 *   ─────────────
 *   Pact Magic             (Warlock only — short-rest slots)
 *   ─────────────
 *   Mystic Arcanum         (Warlock 11+ — once-per-long-rest)
 *
 * Visually disambiguates the three slot pools that 5e Warlock + multiclass
 * combos previously rendered as scattered cards.
 */
export function SpellcastingResources({
  characterId,
  characterName,
  characterLevel,
  characterClass,
  multiclassSlots,
  warlockLevel,
  pactSlotsMax,
  pactSlotsUsed,
  pactSlotLevel,
  arcanum6Used,
  arcanum7Used,
  arcanum8Used,
  arcanum9Used,
  onArcanumUpdate,
}: SpellcastingResourcesProps) {
  const showPact = !!warlockLevel && warlockLevel > 0;
  const showArcanum = !!warlockLevel && warlockLevel >= 11;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-cinzel text-lg flex items-center gap-2 text-brass">
          <Sparkles className="h-5 w-5" />
          Spellcasting Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <section aria-label="Spell Slots">
          <SectionLabel>
            {multiclassSlots ? "Multiclass Spell Slots" : "Spell Slots"}
          </SectionLabel>
          <SpellSlotTracker
            characterId={characterId}
            characterLevel={characterLevel}
            characterClass={characterClass}
            multiclassSlots={multiclassSlots}
          />
        </section>

        {showPact && (
          <>
            <Separator className="bg-brass/20" />
            <section aria-label="Pact Magic">
              <SectionLabel
                hint="Recovers on a short rest"
              >
                Pact Magic
              </SectionLabel>
              <WarlockPactSlots
                characterId={characterId}
                characterName={characterName}
                pactSlotsMax={pactSlotsMax ?? 1}
                pactSlotsUsed={pactSlotsUsed ?? 0}
                pactSlotLevel={pactSlotLevel ?? 1}
              />
            </section>
          </>
        )}

        {showArcanum && (
          <>
            <Separator className="bg-brass/20" />
            <section aria-label="Mystic Arcanum">
              <SectionLabel hint="Once per long rest, no slot required">
                Mystic Arcanum
              </SectionLabel>
              <MysticArcanumTracker
                characterId={characterId}
                characterName={characterName}
                warlockLevel={warlockLevel!}
                arcanum6Used={!!arcanum6Used}
                arcanum7Used={!!arcanum7Used}
                arcanum8Used={!!arcanum8Used}
                arcanum9Used={!!arcanum9Used}
                onUpdate={onArcanumUpdate}
              />
            </section>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SectionLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-2 flex items-baseline justify-between">
      <h4 className="font-cinzel text-sm tracking-widest uppercase text-brass/80">
        {children}
      </h4>
      {hint && (
        <span className="text-[10px] text-muted-foreground italic">{hint}</span>
      )}
    </div>
  );
}