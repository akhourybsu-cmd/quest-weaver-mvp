import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SessionKiosk } from "./SessionKiosk";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Swords, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface SessionKioskContainerProps {
  campaignId: string;
  campaignCode: string;
  sessionStatus: 'live' | 'paused' | 'offline';
  requestOpen?: boolean;
  onRequestOpenHandled?: () => void;
  onSessionEnded?: () => void;
}

interface KioskCharacter {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  speed: number;
  proficiency_bonus: number;
  passive_perception: number;
  con_save: number;
  str_save: number;
  dex_save: number;
  int_save: number;
  wis_save: number;
  cha_save: number;
  hit_dice_current?: number;
  hit_dice_total?: number;
  hit_die?: string;
}

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
};

export const SessionKioskContainer = ({
  campaignId,
  campaignCode,
  sessionStatus,
  requestOpen,
  onRequestOpenHandled,
  onSessionEnded,
}: SessionKioskContainerProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [character, setCharacter] = useState<KioskCharacter | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const isLive = sessionStatus === "live" || sessionStatus === "paused";

  const loadCharacter = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data } = await supabase
        .from("characters")
        .select("*")
        .eq("campaign_id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setCharacter(data);
      } else {
        toast({
          title: "No character found",
          description: "Please select a character for this campaign first.",
          variant: "destructive",
        });
        setOpen(false);
      }
    } catch (err) {
      console.error("Kiosk load error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    loadCharacter();
  };

  // Handle parent requesting open (from "Join Session" button)
  useEffect(() => {
    if (requestOpen && !open && isLive) {
      handleOpen();
      onRequestOpenHandled?.();
    }
  }, [requestOpen]);

  const handleSessionEnded = () => {
    onSessionEnded?.();
    // Auto-close after a delay so the player sees the "Session Ended" card
    setTimeout(() => setOpen(false), 4000);
  };

  // FAB - only show when session is live and kiosk is closed
  if (!open) {
    if (!isLive) return null;
    return (
      <Button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg 
          bg-primary hover:bg-primary/90 text-primary-foreground
          animate-pulse hover:animate-none transition-all"
        size="icon"
        title="Join Session"
      >
        <Swords className="w-6 h-6" />
      </Button>
    );
  }

  const kioskContent = loading ? (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin text-brass" />
    </div>
  ) : character && currentUserId ? (
    <SessionKiosk
      campaignId={campaignId}
      campaignCode={campaignCode}
      currentUserId={currentUserId}
      character={character}
      onSessionEnded={handleSessionEnded}
      onCharacterUpdate={loadCharacter}
    />
  ) : null;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="h-[92vh] max-h-[92vh]">
          <VisuallyHidden><DrawerTitle>Session Kiosk</DrawerTitle></VisuallyHidden>
          <div className="flex flex-col h-full overflow-hidden">
            {kioskContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        side="right"
        className="w-[55vw] max-w-2xl sm:max-w-2xl p-0 flex flex-col"
      >
        <VisuallyHidden><SheetTitle>Session Kiosk</SheetTitle></VisuallyHidden>
        <div className="flex flex-col h-full overflow-hidden">
          {kioskContent}
        </div>
      </SheetContent>
    </Sheet>
  );
};
