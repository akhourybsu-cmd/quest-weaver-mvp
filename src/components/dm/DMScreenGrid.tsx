import { useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useDmLayout, BP, COLS, type PanelId, type PanelDefinition } from "@/stores/dmLayoutStore";
import { PanelPicker } from "./PanelPicker";
import { PartyOverviewPanel, InitiativePanel, CombatLogPanel, MonsterRosterPanel, GenericPanel, PanelFrame } from "./panels";
import ConcentrationTracker from "@/components/combat/ConcentrationTracker";
import EffectsList from "@/components/combat/EffectsList";
import SavePromptsList from "@/components/combat/SavePromptsList";
import QuestLog from "@/components/quests/QuestLog";
import NotesBoard from "@/components/notes/NotesBoard";
import EnhancedNPCDirectory from "@/components/npcs/EnhancedNPCDirectory";
import LoreEditor from "@/components/lore/LoreEditor";
import LootPool from "@/components/loot/LootPool";
import FactionDirectory from "@/components/factions/FactionDirectory";
import HandoutViewer from "@/components/handouts/HandoutViewer";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DMScreenGridProps {
  campaignId: string;
  encounterId?: string;
  tabContext?: "combat" | "notes" | "lore" | "npcs" | "quests";
}

export const DMScreenGrid: React.FC<DMScreenGridProps> = ({ 
  campaignId, 
  encounterId,
  tabContext = "combat"
}) => {
  const enabledPanels = useDmLayout((s) => s.enabledPanels);
  const layouts = useDmLayout((s) => s.layouts);
  const setLayouts = useDmLayout((s) => s.setLayouts);
  const setPanelRegistry = useDmLayout((s) => s.setPanelRegistry);
  const save = useDmLayout((s) => s.save);
  const reset = useDmLayout((s) => s.resetLayouts);

  // Define panel registry
  useEffect(() => {
    const registry: Record<PanelId, PanelDefinition> = {
      "party-overview": {
        id: "party-overview",
        title: "Party Overview",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 4 },
        Render: PartyOverviewPanel,
      },
      "initiative-tracker": {
        id: "initiative-tracker",
        title: "Initiative Tracker",
        minW: 3,
        minH: 4,
        defaultSize: { w: 4, h: 6 },
        requiresEncounter: true,
        Render: InitiativePanel,
      },
      "combat-log": {
        id: "combat-log",
        title: "Combat Log",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        requiresEncounter: true,
        Render: CombatLogPanel,
      },
      "monster-roster": {
        id: "monster-roster",
        title: "Monster Roster",
        minW: 3,
        minH: 4,
        defaultSize: { w: 4, h: 6 },
        requiresEncounter: true,
        Render: MonsterRosterPanel,
      },
      "conditions": {
        id: "conditions",
        title: "Conditions",
        minW: 3,
        minH: 3,
        defaultSize: { w: 3, h: 4 },
        requiresEncounter: true,
        Render: ({ encounterId }) => (
          <PanelFrame title="Conditions">
            <div className="text-sm text-muted-foreground text-center py-8">
              Conditions panel - coming soon
            </div>
          </PanelFrame>
        ),
      },
      "effects": {
        id: "effects",
        title: "Effects",
        minW: 3,
        minH: 3,
        defaultSize: { w: 3, h: 4 },
        requiresEncounter: true,
        Render: ({ encounterId }) => (
          <PanelFrame title="Effects">
            {encounterId ? (
              <EffectsList encounterId={encounterId} />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">No active encounter</div>
            )}
          </PanelFrame>
        ),
      },
      "concentration": {
        id: "concentration",
        title: "Concentration",
        minW: 3,
        minH: 3,
        defaultSize: { w: 3, h: 4 },
        requiresEncounter: true,
        Render: ({ encounterId }) => (
          <PanelFrame title="Concentration">
            {encounterId ? (
              <ConcentrationTracker encounterId={encounterId} />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">No active encounter</div>
            )}
          </PanelFrame>
        ),
      },
      "save-prompts": {
        id: "save-prompts",
        title: "Save Prompts",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        requiresEncounter: true,
        Render: ({ encounterId }) => (
          <PanelFrame title="Save Prompts">
            {encounterId ? (
              <SavePromptsList encounterId={encounterId} />
            ) : (
              <div className="text-sm text-muted-foreground text-center py-8">No active encounter</div>
            )}
          </PanelFrame>
        ),
      },
      "quests": {
        id: "quests",
        title: "Quests",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Quests">
            <QuestLog campaignId={campaignId} isDM={true} />
          </PanelFrame>
        ),
      },
      "notes": {
        id: "notes",
        title: "Notes",
        minW: 4,
        minH: 4,
        defaultSize: { w: 6, h: 6 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Notes">
            <NotesBoard campaignId={campaignId} isDM={true} userId="" />
          </PanelFrame>
        ),
      },
      "npcs": {
        id: "npcs",
        title: "NPCs",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        Render: ({ campaignId }) => (
          <PanelFrame title="NPCs">
            <EnhancedNPCDirectory campaignId={campaignId} isDM={true} />
          </PanelFrame>
        ),
      },
      "lore": {
        id: "lore",
        title: "Lore",
        minW: 4,
        minH: 4,
        defaultSize: { w: 6, h: 6 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Lore">
            <div className="text-sm text-muted-foreground text-center py-8">
              Lore panel - click Lore tab for full editor
            </div>
          </PanelFrame>
        ),
      },
      "inventory": {
        id: "inventory",
        title: "Inventory",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Inventory">
            <LootPool campaignId={campaignId} isDM={true} />
          </PanelFrame>
        ),
      },
      "factions": {
        id: "factions",
        title: "Factions",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Factions">
            <FactionDirectory campaignId={campaignId} isDM={true} />
          </PanelFrame>
        ),
      },
      "handouts": {
        id: "handouts",
        title: "Handouts",
        minW: 3,
        minH: 3,
        defaultSize: { w: 4, h: 5 },
        Render: ({ campaignId }) => (
          <PanelFrame title="Handouts">
            <HandoutViewer campaignId={campaignId} isDM={true} />
          </PanelFrame>
        ),
      },
    };
    
    setPanelRegistry(registry);
  }, [setPanelRegistry]);

  // Get default panels based on tab context
  const getDefaultPanelsForTab = (tab: string): PanelId[] => {
    switch (tab) {
      case "combat":
        return ["party-overview", "initiative-tracker", "combat-log"];
      case "notes":
        return ["notes"];
      case "lore":
        return ["lore"];
      case "npcs":
        return ["npcs"];
      case "quests":
        return ["quests"];
      default:
        return ["party-overview", "initiative-tracker", "combat-log"];
    }
  };

  const activePanelIds = useMemo(() => Array.from(enabledPanels), [enabledPanels]);

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <PanelPicker hasEncounter={!!encounterId} />
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Drag headers to move • Resize from corners
          </span>
          <Button variant="outline" size="sm" onClick={save}>
            <Save className="w-3 h-3 sm:mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCcw className="w-3 h-3 sm:mr-2" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ResponsiveGridLayout
          className="layout"
          breakpoints={BP as any}
          cols={COLS as any}
          layouts={layouts}
          rowHeight={12}
          margin={[8, 8]}
          containerPadding={[0, 0]}
          isBounded
          onLayoutChange={(_, allLayouts) => setLayouts(allLayouts)}
          draggableHandle=".cursor-move"
        >
          {activePanelIds.map((id) => {
            const PanelComponent = useDmLayout.getState().panelRegistry[id]?.Render;
            return (
              <div key={id} className="react-grid-item">
                {PanelComponent && <PanelComponent campaignId={campaignId} encounterId={encounterId} />}
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};
