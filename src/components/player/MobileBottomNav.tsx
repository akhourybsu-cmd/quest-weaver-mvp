import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Home, Shield, Swords, ScrollText, MoreHorizontal, Settings, MessageCircle, LogOut, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface MobileBottomNavProps {
  playerId: string;
  activeCampaignCode?: string;
  isDM?: boolean;
}

/** Persistent floating mobile bottom navigation for the Player Hub. Hidden on md+. */
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
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <nav className="flex items-stretch h-16 rounded-2xl border border-brass/25 bg-card/85 backdrop-blur-md shadow-[0_-2px_20px_hsl(var(--brass)/0.08),0_8px_24px_hsl(0_0%_0%/0.18)] overflow-hidden">
        {/* top brass sheen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brass/60 to-transparent" />
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path, item.exact);
          const inner = (
            <motion.div
              whileTap={{ scale: item.disabled ? 1 : 0.88 }}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 h-full w-full text-[10px] font-cinzel tracking-wide transition-colors",
                active ? "text-brass" : "text-muted-foreground",
                item.disabled && "opacity-40"
              )}
            >
              {active && (
                <motion.div
                  layoutId="playerMobileNavActive"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl bg-brass/15 border border-brass/35"
                />
              )}
              <Icon className="w-5 h-5 relative z-10" />
              <span className="leading-none relative z-10">{item.label}</span>
            </motion.div>
          );
          return (
            <div key={item.label} className="flex-1 min-w-0">
              {item.disabled ? inner : <Link to={item.path} className="block h-full">{inner}</Link>}
            </div>
          );
        })}

        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex-1 min-w-0">
              <motion.div
                whileTap={{ scale: 0.88 }}
                className="flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-cinzel tracking-wide text-muted-foreground"
              >
                <MoreHorizontal className="w-5 h-5" />
                <span className="leading-none">More</span>
              </motion.div>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl border-brass/25">
            <div className="grid grid-cols-2 gap-2 pt-2">
              {isDM && (
                <Button variant="outline" className="h-14 justify-start gap-3 border-brass/30 font-cinzel" onClick={() => { setMoreOpen(false); navigate("/campaign-hub"); }}>
                  <Crown className="w-5 h-5 text-brass" /> Campaign Hub
                </Button>
              )}
              <Button variant="outline" className="h-14 justify-start gap-3 border-brass/30 font-cinzel" onClick={() => { setMoreOpen(false); navigate(`/player/${playerId}/settings`); }}>
                <Settings className="w-5 h-5 text-brass" /> Settings
              </Button>
              <Button variant="outline" className="h-14 justify-start gap-3 border-brass/30 font-cinzel" onClick={() => { setMoreOpen(false); navigate("/community"); }}>
                <MessageCircle className="w-5 h-5 text-brass" /> Community
              </Button>
              <Button variant="outline" className="h-14 justify-start gap-3 text-destructive col-span-2 font-cinzel" onClick={handleLogout}>
                <LogOut className="w-5 h-5" /> Sign Out
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};
