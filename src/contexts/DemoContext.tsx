import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { RECKONING_SEED, DemoCampaign } from "@/data/demoSeeds";

interface DemoContextType {
  isDemo: boolean;
  demoId: string | null;
  campaign: DemoCampaign | null;
  expiresAt: number | null;
  timeRemaining: number | null;
  updateCampaign: (updates: Partial<DemoCampaign>) => Promise<void>;
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

  // Load demo data from localStorage
  useEffect(() => {
    if (!demoId) return;

    const storedDemo = localStorage.getItem(`demo_${demoId}`);
    
    if (storedDemo) {
      try {
        const parsed = JSON.parse(storedDemo);
        setCampaign(parsed.campaign);
        setExpiresAt(parsed.expiresAt);

        // Check if expired
        if (parsed.expiresAt < Date.now()) {
          localStorage.removeItem(`demo_${demoId}`);
          toast({
            title: "Demo Expired",
            description: "This demo session has ended. Redirecting...",
            variant: "destructive",
          });
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
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
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  }, [demoId, toast]);

  // Update countdown timer
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
        setTimeout(() => {
          window.location.href = "/";
        }, 2000);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, toast]);

  const updateCampaign = async (updates: Partial<DemoCampaign>) => {
    if (!demoId || !campaign || !expiresAt) return;

    try {
      const updatedCampaign = { ...campaign, ...updates };
      setCampaign(updatedCampaign);

      // Save to localStorage
      localStorage.setItem(
        `demo_${demoId}`,
        JSON.stringify({ campaign: updatedCampaign, expiresAt })
      );
    } catch (error) {
      console.error("[DEMO] Error updating campaign:", error);
    }
  };

  const endDemo = async () => {
    if (!demoId) return;

    localStorage.removeItem(`demo_${demoId}`);
    toast({
      title: "Demo Ended",
      description: "Thank you for trying Quest Weaver!",
    });
    window.location.href = "/";
  };

  const resetDemo = async () => {
    if (!demoId) return;

    const newExpiresAt = Date.now() + 30 * 60 * 1000;
    const freshCampaign = JSON.parse(JSON.stringify(RECKONING_SEED));
    freshCampaign.id = demoId;

    setCampaign(freshCampaign);
    setExpiresAt(newExpiresAt);

    localStorage.setItem(
      `demo_${demoId}`,
      JSON.stringify({ campaign: freshCampaign, expiresAt: newExpiresAt })
    );

    toast({
      title: "Demo Reset",
      description: "Campaign data restored to original state with fresh 30 minutes.",
    });
  };

  return (
    <DemoContext.Provider
      value={{
        isDemo: !!demoId,
        demoId,
        campaign,
        expiresAt,
        timeRemaining,
        updateCampaign,
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
