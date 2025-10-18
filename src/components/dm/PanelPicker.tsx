import { useDmLayout } from "@/stores/dmLayoutStore";
import type { PanelId } from "@/stores/dmLayoutStore";

export const PanelPicker: React.FC<{ hasEncounter: boolean }> = ({ hasEncounter }) => {
  const enabledPanels = useDmLayout((s) => s.enabledPanels);
  const panelRegistry = useDmLayout((s) => s.panelRegistry);
  const enable = useDmLayout((s) => s.enablePanel);
  const disable = useDmLayout((s) => s.disablePanel);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {Object.values(panelRegistry).map((def) => {
        const on = enabledPanels.has(def.id);
        const isDisabled = def.requiresEncounter && !hasEncounter;
        
        return (
          <button
            key={def.id}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              on 
                ? "bg-primary/10 border-primary/30 text-primary" 
                : isDisabled
                ? "bg-muted border-muted-foreground/20 text-muted-foreground cursor-not-allowed opacity-50"
                : "hover:bg-accent"
            }`}
            onClick={() => !isDisabled && (on ? disable(def.id) : enable(def.id))}
            disabled={isDisabled}
            title={
              isDisabled 
                ? "Requires active encounter" 
                : on 
                ? "Hide panel (data continues updating)" 
                : "Show panel"
            }
          >
            {on ? "✓ " : "+ "}{def.title}
          </button>
        );
      })}
    </div>
  );
};
