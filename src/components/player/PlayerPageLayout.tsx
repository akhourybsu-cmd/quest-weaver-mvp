import { useState, useEffect } from 'react';
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex flex-col md:flex-row">
      {isMobile && (
        <header
          className="sticky z-40 bg-card border-b border-brass/20 p-3 flex items-center gap-3"
          style={{ top: "var(--demo-bar-offset, 0px)" }}
        >
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <PlayerNavigation playerId={playerId} />
            </SheetContent>
          </Sheet>
          <h1 className="font-cinzel font-bold text-foreground truncate min-w-0 flex-1">
            {mobileTitle}
          </h1>
        </header>
      )}

      {!isMobile && <PlayerNavigation playerId={playerId} />}

      <div className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </div>

      <MobileBottomNav playerId={playerId} activeCampaignCode={activeCampaignCode} isDM={isDM} />
    </div>
  );
};
