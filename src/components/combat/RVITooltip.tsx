import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Flame, Skull } from "lucide-react";
import type { DamageType } from "@/types/combat";

interface RVITooltipProps {
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
}

const RVITooltip = ({ resistances, vulnerabilities, immunities }: RVITooltipProps) => {
  const hasAny = resistances.length > 0 || vulnerabilities.length > 0 || immunities.length > 0;

  if (!hasAny) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <Shield className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-popover border z-50" side="right">
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Damage Modifiers</h4>
            
            {immunities.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-immune font-medium">
                  <Skull className="w-3 h-3" />
                  <span>Immune (0 damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {immunities.join(", ")}
                </div>
              </div>
            )}

            {resistances.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-resist font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Resistant (½ damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {resistances.join(", ")}
                </div>
              </div>
            )}

            {vulnerabilities.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-vuln font-medium">
                  <Flame className="w-3 h-3" />
                  <span>Vulnerable (×2 damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {vulnerabilities.join(", ")}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default RVITooltip;
