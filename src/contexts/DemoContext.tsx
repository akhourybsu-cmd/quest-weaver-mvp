import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { RECKONING_SEED, DemoCampaign } from "@/data/demoSeeds";
import { nanoid } from "nanoid";

type EntityType = "quests" | "npcs" | "locations" | "factions" | "monsters" | "items" | "sessions" | "timeline" | "notes" | "lore" | "encounters" | "party";

interface DemoContextType {
  isDemo: boolean;
  demoId: string | null;
  campaign: DemoCampaign | null;
  expiresAt: number | null;
  timeRemaining: number | null;
  updateCampaign: (updates: Partial<DemoCampaign>) => Promise<void>;
  addEntity: (type: EntityType, entity: any) => void;
  updateEntity: (type: EntityType, id: string, updates: any) => void;
  deleteEntity: (type: EntityType, id: string) => void;
  endDemo: () => Promise<void>;
  resetDemo: () => Promise<void>;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

interface DemoProviderProps {
  children: ReactNode;
  demoId?: string | null;
}

export function DemoProvider({ children, demoId: initialDemoId }: DemoProviderProps) {
  const [demoId, setDemoId] = useState<string | null>(initialDemoId || null);
  const [campaign, setCampaign] = useState<DemoCampaign | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const { toast } = useToast();

  // Persist helper
  const persist = useCallback((updatedCampaign: DemoCampaign, exp: number) => {
    if (!demoId) return;
    localStorage.setItem(
      `demo_${demoId}`,
      JSON.stringify({ campaign: updatedCampaign, expiresAt: exp })
    );
  }, [demoId]);

  // Load demo data from localStorage
  useEffect(() => {
    if (!demoId) return;

    const storedDemo = localStorage.getItem(`demo_${demoId}`);
    
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setCampaign(parsed.campaign);
        setExpiresAt(parsed.expiresAt);

        if (parsed.expiresAt < Date.now()) {
          localStorage.removeItem(`demo_${demoId}`);
          toast({
            title: "Demo Expired",
            description: "This demo session has ended. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => { window.location.href = "/"; }, 2000);
        }
      } catch (error) {
        console.error("[DEMO] Error loading demo:", error);
      }
    } else {
      toast({
        title: "Demo Not Found",
        description: "This demo session doesn't exist. Redirecting...",
        variant: "destructive",
      });
      setTimeout(() => { window.location.href = "/"; }, 2000);
    }
  }, [demoId, toast]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(remaining);

      if (remaining === 0) {
        toast({
          title: "Demo Expired",
          description: "Your demo session has ended. Redirecting...",
          variant: "destructive",
        });
        setTimeout(() => { window.location.href = "/"; }, 2000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, toast]);

  // Cleanup on tab close (best-effort)
  useEffect(() => {
    if (!demoId) return;
    const cleanup = () => {
      localStorage.removeItem(`demo_${demoId}`);
    };
    window.addEventListener("beforeunload", cleanup);
    return () => window.removeEventListener("beforeunload", cleanup);
  }, [demoId]);

  const updateCampaign = useCallback(async (updates: Partial<DemoCampaign>) => {
    if (!demoId || !campaign || !expiresAt) return;
    const updatedCampaign = { ...campaign, ...updates };
    setCampaign(updatedCampaign);
    persist(updatedCampaign, expiresAt);
  }, [demoId, campaign, expiresAt, persist]);

  const addEntity = useCallback((type: EntityType, entity: any) => {
    if (!campaign || !expiresAt) return;
    const entityWithId = { ...entity, id: entity.id || nanoid() };
    const updatedCampaign = {
      ...campaign,
      [type]: [...(campaign[type] as any[]), entityWithId],
    };
    setCampaign(updatedCampaign);
    persist(updatedCampaign, expiresAt);
    toast({ title: "Created", description: `New ${type.slice(0, -1)} added.` });
  }, [campaign, expiresAt, persist, toast]);

  const updateEntity = useCallback((type: EntityType, id: string, updates: any) => {
    if (!campaign || !expiresAt) return;
    const updatedCampaign = {
      ...campaign,
      [type]: (campaign[type] as any[]).map((item: any) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    };
    setCampaign(updatedCampaign);
    persist(updatedCampaign, expiresAt);
  }, [campaign, expiresAt, persist]);

  const deleteEntity = useCallback((type: EntityType, id: string) => {
    if (!campaign || !expiresAt) return;
    const updatedCampaign = {
      ...campaign,
      [type]: (campaign[type] as any[]).filter((item: any) => item.id !== id),
    };
    setCampaign(updatedCampaign);
    persist(updatedCampaign, expiresAt);
    toast({ title: "Deleted", description: `${type.slice(0, -1)} removed.` });
  }, [campaign, expiresAt, persist, toast]);

  const endDemo = useCallback(async () => {
    if (!demoId) return;
    localStorage.removeItem(`demo_${demoId}`);
    toast({ title: "Demo Ended", description: "Thank you for trying Quest Weaver!" });
    window.location.href = "/";
  }, [demoId, toast]);

  const resetDemo = useCallback(async () => {
    if (!demoId) return;
    const newExpiresAt = Date.now() + 30 * 60 * 1000;
    const freshCampaign = JSON.parse(JSON.stringify(RECKONING_SEED));
    freshCampaign.id = demoId;

    setCampaign(freshCampaign);
    setExpiresAt(newExpiresAt);
    persist(freshCampaign, newExpiresAt);

    toast({
      title: "Demo Reset",
      description: "Campaign data restored to original state with fresh 30 minutes.",
    });
  }, [demoId, persist, toast]);

  return (
    <DemoContext.Provider
      value={{
        isDemo: !!demoId,
        demoId,
        campaign,
        expiresAt,
        timeRemaining,
        updateCampaign,
        addEntity,
        updateEntity,
        deleteEntity,
        endDemo,
        resetDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
