import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Heart, AlertTriangle } from "lucide-react";
import { DamageTypeBadge } from "@/components/combat/DamageTypeSelector";
import type { DamageType } from "@/lib/damageEngine";

interface DefensesPanelProps {
  resistances: DamageType[];
  vulnerabilities: DamageType[];
  immunities: DamageType[];
  className?: string;
}

export const DefensesPanel = ({
  resistances,
  vulnerabilities,
  immunities,
  className
}: DefensesPanelProps) => {
  const hasDefenses = resistances.length > 0 || vulnerabilities.length > 0 || immunities.length > 0;

  if (!hasDefenses) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Damage Resistances & Vulnerabilities
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Immunities */}
        {immunities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Immune</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {immunities.map((type) => (
                <DamageTypeBadge key={type} type={type} variant="secondary" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Takes no damage from these types</p>
          </div>
        )}

        {/* Resistances */}
        {resistances.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-green-500" />
              <span className="text-sm font-semibold text-green-600 dark:text-green-400">Resistant</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {resistances.map((type) => (
                <DamageTypeBadge key={type} type={type} variant="outline" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Takes half damage from these types</p>
          </div>
        )}

        {/* Vulnerabilities */}
        {vulnerabilities.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-semibold text-destructive">Vulnerable</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {vulnerabilities.map((type) => (
                <DamageTypeBadge key={type} type={type} variant="destructive" />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Takes double damage from these types</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
