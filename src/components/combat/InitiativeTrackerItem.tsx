import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Heart, Shield, BookOpen, Zap } from "lucide-react";
import QuickConditionsPopover from "./QuickConditionsPopover";
import RVITooltip from "./RVITooltip";
import { ActionEconomy } from "./ActionEconomy";
import { ResourceChips } from "./ResourceChips";
import { InspirationToggle } from "./InspirationToggle";
import { QuickHPControls } from "./QuickHPControls";

interface InitiativeTrackerItemProps {
  entry: any;
  encounterId: string;
  onViewMonsterDetail: (id: string, type: string) => void;
  onOpenMonsterActions: (id: string, type: string) => void;
  onRemove: (id: string) => void;
}

export const InitiativeTrackerItem = memo(({ 
  entry, 
  encounterId, 
  onViewMonsterDetail, 
  onOpenMonsterActions, 
  onRemove 
}: InitiativeTrackerItemProps) => {
  return (
    <div
      className={`rounded-lg p-3 border-2 transition-all ${
        entry.is_current_turn
          ? "bg-primary/10 border-primary shadow-lg ring-2 ring-primary/20"
          : "bg-muted/50 border-transparent hover:border-muted"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Badge variant="secondary" className="text-lg font-bold w-10 justify-center shrink-0">
            {entry.initiative_roll}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="font-semibold flex items-center gap-2 flex-wrap">
              {entry.combatant_type === 'monster' ? (
                <button
                  onClick={() => onViewMonsterDetail(entry.combatant_id, entry.combatant_type)}
                  className="hover:text-primary transition-colors hover:underline text-left"
                >
                  {entry.combatant_name || "Unknown"}
                </button>
              ) : (
                <span>{entry.combatant_name || "Unknown"}</span>
              )}
              <Badge variant="outline" className="text-xs">
                {entry.combatant_type === 'character' ? 'PC' : 'NPC'}
              </Badge>
              {entry.is_current_turn && (
                <Badge variant="default" className="text-xs">
                  Current Turn
                </Badge>
              )}
            </div>
            {entry.combatant_stats && (
              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  AC {entry.combatant_stats.ac}
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {entry.combatant_stats.hp_current}/{entry.combatant_stats.hp_max}
                </div>
                {(entry.combatant_stats.resistances?.length > 0 ||
                  entry.combatant_stats.vulnerabilities?.length > 0 ||
                  entry.combatant_stats.immunities?.length > 0) && (
                  <RVITooltip
                    resistances={entry.combatant_stats.resistances || []}
                    vulnerabilities={entry.combatant_stats.vulnerabilities || []}
                    immunities={entry.combatant_stats.immunities || []}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {entry.combatant_stats && (
          <div className="flex items-center gap-1 shrink-0">
            <QuickHPControls
              characterId={entry.combatant_id}
              characterType={entry.combatant_type}
              currentHp={entry.combatant_stats.hp_current}
              maxHp={entry.combatant_stats.hp_max}
              encounterId={encounterId}
            />
            <QuickConditionsPopover
              encounterId={encounterId}
              characterId={entry.combatant_id}
              characterName={entry.combatant_name || "Unknown"}
            />
            {entry.combatant_type === 'character' && entry.is_current_turn && (
              <>
                <ActionEconomy
                  characterId={entry.combatant_id}
                  encounterId={encounterId}
                  actionUsed={entry.combatant_stats.action_used || false}
                  bonusActionUsed={entry.combatant_stats.bonus_action_used || false}
                  reactionUsed={entry.combatant_stats.reaction_used || false}
                />
                <ResourceChips
                  characterId={entry.combatant_id}
                  encounterId={encounterId}
                  resources={entry.combatant_stats.resources || {}}
                />
                <InspirationToggle
                  characterId={entry.combatant_id}
                  hasInspiration={entry.combatant_stats.inspiration || false}
                />
              </>
            )}
            {entry.combatant_type === 'monster' && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenMonsterActions(entry.combatant_id, entry.combatant_type)}
                  title="Monster Actions"
                >
                  <Zap className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewMonsterDetail(entry.combatant_id, entry.combatant_type)}
                  title="View Monster Details"
                >
                  <BookOpen className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(entry.id)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

InitiativeTrackerItem.displayName = "InitiativeTrackerItem";
