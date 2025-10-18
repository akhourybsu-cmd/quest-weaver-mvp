import { create } from "zustand";
import { type Layout, type Layouts } from "react-grid-layout";

/************************************
 * Panel Registry Types
 ************************************/
export type PanelId =
  | "party-overview"
  | "initiative-tracker"
  | "combat-log"
  | "monster-roster"
  | "conditions"
  | "effects"
  | "concentration"
  | "save-prompts"
  | "quests"
  | "notes"
  | "npcs"
  | "lore"
  | "inventory"
  | "factions"
  | "handouts";

export type PanelDefinition = {
  id: PanelId;
  title: string;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  defaultSize: { w: number; h: number };
  requiresEncounter?: boolean;
  Render: React.FC<{ campaignId: string; encounterId?: string }>;
};

/************************************
 * Breakpoints & Columns
 ************************************/
export const BP = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 } as const;
export const COLS = { lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 } as const;
const LAYOUT_KEY = "dm-screen-layout-v1";

/************************************
 * Persistence
 ************************************/
function readPersisted(): { layouts: Layouts; enabled: PanelId[] } | null {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writePersisted(payload: { layouts: Layouts; enabled: PanelId[] }) {
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(payload));
}

/************************************
 * Default Layout Builder
 ************************************/
export function defaultLayoutsFromEnabled(enabled: PanelId[], registry: Record<PanelId, PanelDefinition>): Layouts {
  const make = (cols: number): Layout[] => {
    let x = 0, y = 0, rowH = 0;
    return enabled.map((id) => {
      const def = registry[id];
      if (!def) return { i: id, x: 0, y: 0, w: 4, h: 4 };
      
      const w = Math.min(def.defaultSize.w, cols);
      const h = def.defaultSize.h;
      if (x + w > cols) { x = 0; y += rowH; rowH = 0; }
      const item: Layout = { i: id, x, y, w, h, minW: def.minW, minH: def.minH };
      x += w; rowH = Math.max(rowH, h);
      return item;
    });
  };
  return {
    lg: make(COLS.lg),
    md: make(COLS.md),
    sm: make(COLS.sm),
    xs: make(COLS.xs),
    xxs: make(COLS.xxs),
  } as Layouts;
}

/************************************
 * Zustand Store
 ************************************/
interface LayoutState {
  enabledPanels: Set<PanelId>;
  layouts: Layouts;
  panelRegistry: Record<PanelId, PanelDefinition>;
  setLayouts: (layouts: Layouts) => void;
  setPanelRegistry: (registry: Record<PanelId, PanelDefinition>) => void;
  enablePanel: (id: PanelId) => void;
  disablePanel: (id: PanelId) => void;
  resetLayouts: () => void;
  save: () => void;
}

const initialEnabled: PanelId[] = [
  "party-overview",
  "initiative-tracker",
  "combat-log",
];

const persisted = typeof window !== "undefined" ? readPersisted() : null;

export const useDmLayout = create<LayoutState>((set, get) => ({
  enabledPanels: new Set<PanelId>(persisted?.enabled ?? initialEnabled),
  layouts: persisted?.layouts ?? {},
  panelRegistry: {} as Record<PanelId, PanelDefinition>,
  
  setPanelRegistry: (registry) => {
    const state = get();
    const layouts = persisted?.layouts ?? defaultLayoutsFromEnabled(Array.from(state.enabledPanels), registry);
    set({ panelRegistry: registry, layouts });
  },
  
  setLayouts: (layouts) => set({ layouts }),
  
  enablePanel: (id) => set((state) => {
    if (state.enabledPanels.has(id)) return state;
    const nextEnabled = new Set(state.enabledPanels);
    nextEnabled.add(id);
    const nextLayouts = { ...state.layouts } as Layouts;
    (Object.keys(nextLayouts) as (keyof Layouts)[]).forEach((bp) => {
      const arr = [...(nextLayouts[bp] ?? [])];
      if (!arr.find((l) => l.i === id)) {
        const def = state.panelRegistry[id];
        if (!def) return;
        const cols = (COLS as any)[bp] as number;
        const maxY = arr.reduce((m, l) => Math.max(m, l.y + l.h), 0);
        arr.push({ 
          i: id, 
          x: 0, 
          y: maxY, 
          w: Math.min(def.defaultSize.w, cols), 
          h: def.defaultSize.h, 
          minW: def.minW, 
          minH: def.minH 
        });
      }
      (nextLayouts as any)[bp] = arr;
    });
    return { enabledPanels: nextEnabled, layouts: nextLayouts };
  }),
  
  disablePanel: (id) => set((state) => {
    if (!state.enabledPanels.has(id)) return state;
    const nextEnabled = new Set(state.enabledPanels);
    nextEnabled.delete(id);
    const nextLayouts = { ...state.layouts } as Layouts;
    (Object.keys(nextLayouts) as (keyof Layouts)[]).forEach((bp) => {
      (nextLayouts as any)[bp] = (nextLayouts[bp] ?? []).filter((l: Layout) => l.i !== id);
    });
    return { enabledPanels: nextEnabled, layouts: nextLayouts };
  }),
  
  resetLayouts: () => set((state) => ({
    layouts: defaultLayoutsFromEnabled(Array.from(state.enabledPanels), state.panelRegistry),
  })),
  
  save: () => {
    const { layouts, enabledPanels } = get();
    writePersisted({ layouts, enabled: Array.from(enabledPanels) });
  },
}));
