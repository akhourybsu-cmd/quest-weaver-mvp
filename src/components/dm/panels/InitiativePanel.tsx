import { PanelFrame } from "./PanelFrame";
import InitiativeTracker from "@/components/combat/InitiativeTracker";

export const InitiativePanel: React.FC<{ campaignId: string; encounterId?: string }> = ({ 
  campaignId, 
  encounterId 
}) => {
  if (!encounterId) {
    return (
      <PanelFrame title="Initiative Tracker">
        <div className="text-sm text-muted-foreground text-center py-8">
          No active encounter
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Initiative Tracker">
      <InitiativeTracker 
        encounterId={encounterId} 
        characters={[]}
      />
    </PanelFrame>
  );
};
