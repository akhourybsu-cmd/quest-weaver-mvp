import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, Shield, Swords, ScrollText, MoreHorizontal, Settings, MessageCircle, LogOut, Crown } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MobileBottomNavProps {
  playerId: string;
  activeCampaignCode?: string;
  isDM?: boolean;
}

/**
 * Persistent mobile bottom navigation for the Player Hub.
 * Hidden on md+ viewports.
 */
export const MobileBottomNav = ({ playerId, activeCampaignCode, isDM }: MobileBottomNavProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const items = [
    { icon: Home, label: "Hub", path: `/player/${playerId}`, exact: true },
    { icon: Shield, label: "Chars", path: `/player/${playerId}/characters` },
    {
      icon: Swords,
      label: "Campaign",
      path: activeCampaignCode ? `/player/campaign/${activeCampaignCode}` : `/player/${playerId}`,
      disabled: !activeCampaignCode,
    },
    { icon: ScrollText, label: "Notes", path: `/player/${playerId}/notes` },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-card border-t border-brass/20 flex items-stretch h-14"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path, item.exact);
        const content = (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 h-full w-full text-[10px] font-medium transition-colors",
              active ? "text-brass" : "text-muted-foreground",
              item.disabled && "opacity-40"
            )}
          >
            <Icon className="w-5 h-5" />
            <span className="leading-none">{item.label}</span>
          </div>
        );
        return (
          <div key={item.label} className="flex-1 min-w-0">
            {item.disabled ? content : <Link to={item.path} className="block h-full">{content}</Link>}
          </div>
        );
      })}

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetTrigger asChild>
          <button className="flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-muted-foreground">
            <MoreHorizontal className="w-5 h-5" />
            <span className="leading-none">More</span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-xl">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {isDM && (
              <Button variant="outline" className="h-14 justify-start gap-3" onClick={() => { setMoreOpen(false); navigate("/campaign-hub"); }}>
                <Crown className="w-5 h-5" /> Campaign Hub
              </Button>
            )}
            <Button variant="outline" className="h-14 justify-start gap-3" onClick={() => { setMoreOpen(false); navigate(`/player/${playerId}/settings`); }}>
              <Settings className="w-5 h-5" /> Settings
            </Button>
            <Button variant="outline" className="h-14 justify-start gap-3" onClick={() => { setMoreOpen(false); navigate("/community"); }}>
              <MessageCircle className="w-5 h-5" /> Community
            </Button>
            <Button variant="outline" className="h-14 justify-start gap-3 text-destructive col-span-2" onClick={handleLogout}>
              <LogOut className="w-5 h-5" /> Sign Out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
};