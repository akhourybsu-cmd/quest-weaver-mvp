import { useEffect, useMemo } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { useDmLayout, BP, COLS, type PanelId, type PanelDefinition } from "@/stores/dmLayoutStore";
import { PanelPicker } from "./PanelPicker";
import { PartyOverviewPanel, InitiativePanel, CombatLogPanel, MonsterRosterPanel, GenericPanel } from "./panels";
import ConcentrationTracker from "@/components/combat/ConcentrationTracker";
import ConditionsManager from "@/components/combat/ConditionsManager";
import EffectsList from "@/components/combat/EffectsList";
import SavePromptsList from "@/components/combat/SavePromptsList";
import QuestLog from "@/components/quests/QuestLog";
import NotesBoard from "@/components/notes/NotesBoard";
import EnhancedNPCDirectory from "@/components/npcs/EnhancedNPCDirectory";

import LootPool from "@/components/loot/LootPool";
import FactionDirectory from "@/components/factions/FactionDirectory";
import HandoutViewer from "@/components/handouts/HandoutViewer";
import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DMScreenGridProps {
  campaignId: string;
  encounterId?: string;
}

export const DMScreenGrid: React.FC<DMScreenGridProps> = ({ campaignId, encounterId }) => {
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
        title: "Party",
        minW: 3,
        minH: 6,
        defaultSize: { w: 4, h: 8 },
        Render: ({ campaignId }) => <PartyOverviewPanel campaignId={campaignId} />,
      },
      "initiative-tracker": {
        id: "initiative-tracker",
        title: "Initiative",
        minW: 3,
        minH: 6,
        defaultSize: { w: 4, h: 10 },
        requiresEncounter: true,
        Render: ({ campaignId, encounterId }) => <InitiativePanel campaignId={campaignId} encounterId={encounterId} />,
      },
      "combat-log": {
        id: "combat-log",
        title: "Combat Log",
        minW: 3,
        minH: 5,
        defaultSize: { w: 4, h: 8 },
        requiresEncounter: true,
        Render: ({ encounterId }) => <CombatLogPanel campaignId="" encounterId={encounterId} />,
      },
      "monster-roster": {
        id: "monster-roster",
        title: "Monsters",
        minW: 3,
        minH: 6,
        defaultSize: { w: 4, h: 9 },
        requiresEncounter: true,
        Render: ({ encounterId }) => <MonsterRosterPanel campaignId="" encounterId={encounterId} />,
      },
      "concentration": {
        id: "concentration",
        title: "Concentration",
        minW: 3,
        minH: 4,
        defaultSize: { w: 3, h: 6 },
        requiresEncounter: true,
        Render: ({ encounterId }) => encounterId ? (
          <GenericPanel title="Concentration">
            <ConcentrationTracker encounterId={encounterId} />
          </GenericPanel>
        ) : <GenericPanel title="Concentration"><div className="text-muted-foreground text-sm">No encounter</div></GenericPanel>,
      },
      "conditions": {
        id: "conditions",
        title: "Conditions",
        minW: 3,
        minH: 4,
        defaultSize: { w: 3, h: 6 },
        requiresEncounter: true,
        Render: ({ encounterId }) => encounterId ? (
          <GenericPanel title="Conditions">
            <ConditionsManager encounterId={encounterId} currentRound={1} characters={[]} />
          </GenericPanel>
        ) : <GenericPanel title="Conditions"><div className="text-muted-foreground text-sm">No encounter</div></GenericPanel>,
      },
      "effects": {
        id: "effects",
        title: "Effects",
        minW: 3,
        minH: 4,
        defaultSize: { w: 4, h: 7 },
        requiresEncounter: true,
        Render: ({ encounterId }) => encounterId ? (
          <GenericPanel title="Effects">
            <EffectsList encounterId={encounterId} />
          </GenericPanel>
        ) : <GenericPanel title="Effects"><div className="text-muted-foreground text-sm">No encounter</div></GenericPanel>,
      },
      "save-prompts": {
        id: "save-prompts",
        title: "Saving Throws",
        minW: 3,
        minH: 4,
        defaultSize: { w: 4, h: 6 },
        requiresEncounter: true,
        Render: ({ encounterId }) => encounterId ? (
          <GenericPanel title="Saving Throws">
            <SavePromptsList encounterId={encounterId} />
          </GenericPanel>
        ) : <GenericPanel title="Saving Throws"><div className="text-muted-foreground text-sm">No encounter</div></GenericPanel>,
      },
      "quests": {
        id: "quests",
        title: "Quests",
        minW: 4,
        minH: 5,
        defaultSize: { w: 5, h: 8 },
        Render: ({ campaignId }) => (
          <GenericPanel title="Quests">
            <QuestLog campaignId={campaignId} isDM={true} />
          </GenericPanel>
        ),
      },
      "notes": {
        id: "notes",
        title: "Notes",
        minW: 4,
        minH: 5,
        defaultSize: { w: 6, h: 8 },
        Render: ({ campaignId }) => (
          <GenericPanel title="Notes">
            <NotesBoard campaignId={campaignId} isDM={true} userId="" />
          </GenericPanel>
        ),
      },
      "npcs": {
        id: "npcs",
        title: "NPCs",
        minW: 4,
        minH: 5,
        defaultSize: { w: 5, h: 9 },
        Render: ({ campaignId }) => (
          <GenericPanel title="NPCs">
            <EnhancedNPCDirectory campaignId={campaignId} isDM={true} />
          </GenericPanel>
        ),
      },
      "lore": {
        id: "lore",
        title: "Lore",
        minW: 4,
        minH: 5,
        defaultSize: { w: 6, h: 8 },
        Render: () => (
          <GenericPanel title="Lore">
            <div className="text-sm text-muted-foreground">
              Use the Lore page for full wiki editor
            </div>
          </GenericPanel>
        ),
      },
      "inventory": {
        id: "inventory",
        title: "Loot",
        minW: 4,
        minH: 5,
        defaultSize: { w: 5, h: 7 },
        Render: ({ campaignId }) => (
          <GenericPanel title="Loot Pool">
            <LootPool campaignId={campaignId} isDM={true} />
          </GenericPanel>
        ),
      },
      "factions": {
        id: "factions",
        title: "Factions",
        minW: 4,
        minH: 5,
        defaultSize: { w: 5, h: 7 },
        Render: ({ campaignId }) => (
          <GenericPanel title="Factions">
            <FactionDirectory campaignId={campaignId} isDM={true} />
          </GenericPanel>
        ),
      },
      "handouts": {
        id: "handouts",
        title: "Handouts",
        minW: 4,
        minH: 5,
        defaultSize: { w: 5, h: 7 },
        Render: ({ campaignId }) => (
          <GenericPanel title="Handouts">
            <HandoutViewer campaignId={campaignId} isDM={true} />
          </GenericPanel>
        ),
      },
    };
    
    setPanelRegistry(registry);
  }, [setPanelRegistry]);

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
