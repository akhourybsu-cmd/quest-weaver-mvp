import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Shield, Settings, ChevronLeft, ChevronRight, LogOut, Crown, ScrollText, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/hooks/usePlayer';
import { useAuth } from '@/contexts/AuthContext';
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
  const { player } = usePlayer();
  const { userId } = useAuth();

  useEffect(() => {
    if (!userId) return;
    const checkIfDM = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('id')
        .eq('dm_user_id', userId)
        .limit(1);
      setIsDM((data?.length || 0) > 0);
    };
    checkIfDM();
  }, [userId]);

  useEffect(() => {
    localStorage.setItem('playerNavCollapsed', collapsed.toString());
  }, [collapsed]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: Home, label: 'Dashboard', path: `/player/${playerId}` },
    { icon: Shield, label: 'My Characters', path: `/player/${playerId}/characters` },
    { icon: ScrollText, label: 'Shared Notes', path: `/player/${playerId}/notes` },
    { icon: MessageCircle, label: 'Community', path: '/community' },
    { icon: Settings, label: 'Settings', path: `/player/${playerId}/settings` },
  ];

  if (isDM) {
    menuItems.splice(1, 0, { icon: Crown, label: 'Campaign Hub', path: '/campaign-hub' });
  }

  const isActivePath = (path: string) => {
    if (path === `/player/${playerId}`) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      className="h-full relative flex flex-col bg-card/80 backdrop-blur-sm border-r border-brass/20 overflow-hidden"
    >
      {/* Brass edge sheen */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-brass/50 to-transparent" />

      {/* Header */}
      <div className="p-3 border-b border-brass/20 flex items-center justify-between gap-2 min-h-[68px]">
        <AnimatePresence mode="wait">
          {!collapsed && player && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <Avatar className="w-10 h-10 border-2 border-brass/40 shadow-[0_0_10px_hsl(var(--brass)/0.2)] shrink-0">
                <AvatarImage src={player.avatar_url} />
                <AvatarFallback style={{ backgroundColor: player.color }} className="font-cinzel font-semibold">
                  {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-semibold text-foreground truncate leading-tight">{player.name}</p>
                <p className="text-[10px] font-cinzel tracking-[0.2em] uppercase text-brass/70">Adventurer</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0 h-8 w-8 text-muted-foreground hover:text-brass hover:bg-brass/10"
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto overflow-x-hidden">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          return (
            <Link key={item.path} to={item.path} className="block">
              <motion.div
                whileHover={{ x: collapsed ? 0 : 3 }}
                whileTap={{ scale: 0.97 }}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer select-none transition-colors',
                  collapsed && 'justify-center px-2',
                  isActive ? 'text-brass' : 'text-muted-foreground hover:text-brass'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="playerNavActive"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-brass/15 border border-brass/40 border-l-[3px] border-l-brass shadow-[0_0_12px_hsl(var(--brass)/0.12)]"
                  />
                )}
                <Icon className="w-5 h-5 shrink-0 relative z-10" />
                {!collapsed && (
                  <span className="relative z-10 font-cinzel text-sm tracking-wide truncate">{item.label}</span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-brass/20">
        <motion.div whileTap={{ scale: 0.97 }}>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className={cn(
              'w-full justify-start gap-3 text-destructive/80 hover:text-destructive hover:bg-destructive/10 font-cinzel tracking-wide',
              collapsed && 'justify-center px-2'
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </Button>
        </motion.div>
      </div>
    </motion.aside>
  );
};
