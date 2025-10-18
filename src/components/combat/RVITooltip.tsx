import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Shield, Flame, Skull } from "lucide-react";
import type { DamageType } from "@/types/combat";

interface RVITooltipProps {
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
}

const RVITooltip = ({ resistances, vulnerabilities, immunities }: RVITooltipProps) => {
  // Ensure values are arrays (handle JSONB objects from monsters)
  const safeResistances = Array.isArray(resistances) ? resistances : [];
  const safeVulnerabilities = Array.isArray(vulnerabilities) ? vulnerabilities : [];
  const safeImmunities = Array.isArray(immunities) ? immunities : [];
  
  const hasAny = safeResistances.length > 0 || safeVulnerabilities.length > 0 || safeImmunities.length > 0;

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
            
            {safeImmunities.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-immune font-medium">
                  <Skull className="w-3 h-3" />
                  <span>Immune (0 damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {safeImmunities.join(", ")}
                </div>
              </div>
            )}

            {safeResistances.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-resist font-medium">
                  <Shield className="w-3 h-3" />
                  <span>Resistant (½ damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {safeResistances.join(", ")}
                </div>
              </div>
            )}

            {safeVulnerabilities.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-status-vuln font-medium">
                  <Flame className="w-3 h-3" />
                  <span>Vulnerable (×2 damage)</span>
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                  {safeVulnerabilities.join(", ")}
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
