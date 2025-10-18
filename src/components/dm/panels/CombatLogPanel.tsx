import { PanelFrame } from "./PanelFrame";
import CombatLog from "@/components/combat/CombatLog";

export const CombatLogPanel: React.FC<{ campaignId: string; encounterId?: string }> = ({ 
  encounterId 
}) => {
  if (!encounterId) {
    return (
      <PanelFrame title="Combat Log">
        <div className="text-sm text-muted-foreground text-center py-8">
          No active encounter
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Combat Log">
      <CombatLog encounterId={encounterId} />
    </PanelFrame>
  );
};
