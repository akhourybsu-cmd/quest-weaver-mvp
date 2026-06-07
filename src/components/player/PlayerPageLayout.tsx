import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/player/MobileBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PlayerPageLayoutProps {
  playerId: string;
  mobileTitle: string;
  children: React.ReactNode;
}

export const PlayerPageLayout = ({ playerId, mobileTitle, children }: PlayerPageLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { userId } = useAuth();
  const [isDM, setIsDM] = useState(false);
  const [activeCampaignCode, setActiveCampaignCode] = useState<string | undefined>();

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data: dmRows }, { data: memberRows }] = await Promise.all([
        supabase.from('campaigns').select('id').eq('dm_user_id', userId).limit(1),
        supabase.from('campaign_members').select('campaigns(code, updated_at)').eq('user_id', userId).limit(5),
      ]);
      setIsDM((dmRows?.length || 0) > 0);
      const codes = (memberRows || [])
        .map((r: any) => r.campaigns)
        .filter(Boolean)
        .sort((a: any, b: any) => (b?.updated_at || '').localeCompare(a?.updated_at || ''));
      if (codes[0]?.code) setActiveCampaignCode(codes[0].code);
    })();
  }, [userId]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background relative">
      {/* Ambient premium backdrop */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-brass/[0.06]" />
        <div className="absolute -top-40 -left-40 w-[40rem] h-[40rem] rounded-full bg-brass/[0.05] blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[40rem] h-[40rem] rounded-full bg-primary/[0.05] blur-3xl" />
      </div>

      {isMobile && (
        <motion.header
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="sticky z-40 bg-card/80 backdrop-blur-md border-b border-brass/20 px-3 py-3 flex items-center gap-3"
          style={{ top: 'var(--demo-bar-offset, 0px)' }}
        >
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0 hover:bg-brass/10 hover:text-brass">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <PlayerNavigation playerId={playerId} />
            </SheetContent>
          </Sheet>
          <h1 className="font-cinzel font-bold text-foreground truncate min-w-0 flex-1 tracking-wide">
            {mobileTitle}
          </h1>
          <div className="h-1.5 w-1.5 rotate-45 bg-brass/60 rounded-sm shrink-0" />
        </motion.header>
      )}

      {!isMobile && <PlayerNavigation playerId={playerId} />}

      <main className="flex-1 overflow-auto pb-24 md:pb-0">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </main>

      <MobileBottomNav playerId={playerId} activeCampaignCode={activeCampaignCode} isDM={isDM} />
    </div>
  );
};
