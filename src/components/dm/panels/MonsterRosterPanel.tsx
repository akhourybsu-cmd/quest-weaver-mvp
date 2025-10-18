import { PanelFrame } from "./PanelFrame";
import MonsterRoster from "@/components/monsters/MonsterRoster";

export const MonsterRosterPanel: React.FC<{ campaignId: string; encounterId?: string }> = ({ 
  encounterId 
}) => {
  if (!encounterId) {
    return (
      <PanelFrame title="Monster Roster">
        <div className="text-sm text-muted-foreground text-center py-8">
          No active encounter
        </div>
      </PanelFrame>
    );
  }

  return (
    <PanelFrame title="Monster Roster">
      <MonsterRoster encounterId={encounterId} currentRound={1} />
    </PanelFrame>
  );
};
