import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Shield, Users, Dice6, Settings, ChevronLeft, ChevronRight, LogOut, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/hooks/usePlayer';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface PlayerNavigationProps {
  playerId: string;
}

export const PlayerNavigation = ({ playerId }: PlayerNavigationProps) => {
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('playerNavCollapsed') === 'true';
  });
  const [isDM, setIsDM] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { getPlayer } = usePlayer();
  const player = getPlayer(playerId);

  useEffect(() => {
    const checkIfDM = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('campaigns')
        .select('id')
        .eq('dm_user_id', user.id)
        .limit(1);

      setIsDM((data?.length || 0) > 0);
    };

    checkIfDM();
  }, []);

  useEffect(() => {
    localStorage.setItem('playerNavCollapsed', collapsed.toString());
  }, [collapsed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Shield, label: 'My Characters', path: `/player/${playerId}/characters` },
    { icon: Users, label: 'My Campaigns', path: `/player/${playerId}` },
    { icon: Dice6, label: 'Join Campaign', path: '/link-campaign' },
    { icon: Settings, label: 'Settings', path: `/player/${playerId}/settings` },
  ];

  if (isDM) {
    menuItems.splice(1, 0, {
      icon: Crown,
      label: 'Campaign Hub',
      path: '/campaign-hub',
    });
  }

  return (
    <div
      className={cn(
        'h-full bg-card border-r border-brass/20 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-brass/20 flex items-center justify-between">
        {!collapsed && player && (
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-10 h-10 border-2 border-brass/30">
              <AvatarImage src={player.avatarUrl} />
              <AvatarFallback style={{ backgroundColor: player.color }}>
                {player.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-cinzel font-semibold text-foreground truncate">
                {player.name}
              </p>
              <p className="text-xs text-muted-foreground">Player</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link key={item.path} to={item.path}>
              <Button
                variant={isActive ? 'secondary' : 'ghost'}
                className={cn(
                  'w-full justify-start gap-3',
                  collapsed && 'justify-center px-2',
                  isActive && 'bg-brass/10 text-brass border border-brass/30'
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-brass/20">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className={cn(
            'w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </div>
    </div>
  );
};
