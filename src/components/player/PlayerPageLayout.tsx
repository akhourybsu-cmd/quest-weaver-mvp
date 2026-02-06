import { useState } from 'react';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PlayerPageLayoutProps {
  playerId: string;
  mobileTitle: string;
  children: React.ReactNode;
}

export const PlayerPageLayout = ({ playerId, mobileTitle, children }: PlayerPageLayoutProps) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex flex-col md:flex-row">
      {isMobile && (
        <header className="sticky top-0 z-50 bg-card border-b border-brass/20 p-3 flex items-center gap-3">
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
          <h1 className="font-cinzel font-bold text-foreground truncate">
            {mobileTitle}
          </h1>
        </header>
      )}

      {!isMobile && <PlayerNavigation playerId={playerId} />}

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};
