import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { CampaignTile } from '@/components/player/CampaignTile';
import { JoinCampaignDialog } from '@/components/player/JoinCampaignDialog';
import { usePlayerLinks } from '@/hooks/usePlayerLinks';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Plus, ChevronRight, BookOpen, Sparkles } from 'lucide-react';

const PlayerDashboardNew = () => {
  const { player, loading: playerLoading } = usePlayer();
  const { links, loading: linksLoading, refreshLinks } = usePlayerLinks(player?.id);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  if (playerLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Sparkles className="w-8 h-8 text-brass animate-pulse-breathe" />
        <p className="font-cinzel text-brass tracking-widest text-sm uppercase">Summoning your dashboard…</p>
      </div>
    );
  }

  if (!player) {
    return <Navigate to="/" replace />;
  }

  return (
    <PlayerPageLayout playerId={player.id} mobileTitle={`${player.name}'s Dashboard`}>
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-7 hidden md:block"
        >
          <p className="font-cinzel text-brass/60 tracking-[0.3em] text-xs uppercase mb-2">The Adventurer's Hall</p>
          <h1 className="text-4xl font-cinzel font-bold text-foreground tracking-wide">
            Welcome, {player.name}
          </h1>
          <p className="text-muted-foreground font-cormorant text-lg italic mt-1">
            Your campaigns and heroes await your command.
          </p>
          <div className="flex items-center gap-3 mt-4">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-brass/50" />
            <div className="w-2 h-2 rotate-45 bg-brass/70 rounded-sm" />
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-brass/50" />
          </div>
        </motion.div>

        {/* Quick link to characters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="mb-7"
        >
          <Link to={`/player/${player.id}/characters`} className="block group">
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="rounded-2xl border border-brass/30 bg-card/70 backdrop-blur-sm p-4 flex items-center gap-4 transition-colors group-hover:border-brass/60 group-hover:bg-brass/5 shadow-sm"
            >
              <div className="w-11 h-11 rounded-full bg-brass/10 border border-brass/30 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-brass" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cinzel font-semibold text-foreground tracking-wide">My Characters</p>
                <p className="text-sm text-muted-foreground font-cormorant">View and manage all your heroes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-brass group-hover:translate-x-0.5 transition-all" />
            </motion.div>
          </Link>
        </motion.div>

        {/* Campaigns */}
        <div className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-2xl md:text-3xl font-cinzel font-bold text-foreground tracking-wide">My Campaigns</h2>
              <p className="text-sm text-muted-foreground font-cormorant italic mt-0.5 hidden md:block">
                Your active and pinned adventures
              </p>
            </div>
            <motion.div whileTap={{ scale: 0.96 }}>
              <Button
                onClick={() => setJoinDialogOpen(true)}
                size="sm"
                className="gap-2 shrink-0 bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-black font-cinzel tracking-wide text-xs uppercase shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Join Campaign</span>
                <span className="sm:hidden">Join</span>
              </Button>
            </motion.div>
          </div>

          {linksLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-brass" />
            </div>
          ) : links.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed border-brass/30 bg-card/40"
            >
              <div className="w-20 h-20 rounded-full bg-brass/10 border border-brass/20 flex items-center justify-center mb-5">
                <BookOpen className="w-9 h-9 text-brass/50" />
              </div>
              <h3 className="font-cinzel font-semibold text-xl text-foreground mb-2">No Campaigns Yet</h3>
              <p className="text-muted-foreground font-cormorant italic max-w-xs mb-6">
                Join a campaign with a code from your Dungeon Master to begin the journey.
              </p>
              <Button
                onClick={() => setJoinDialogOpen(true)}
                size="lg"
                className="gap-2 bg-gradient-to-r from-brass/80 to-brass hover:from-brass hover:to-brass/90 text-black font-cinzel tracking-wider uppercase text-sm shadow-lg px-8"
              >
                <Plus className="w-5 h-5" />
                Join Your First Campaign
              </Button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link, idx) => (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.06, 0.4), ease: [0.22, 1, 0.36, 1] }}
                >
                  <CampaignTile link={link} playerId={player.id} onUnlink={refreshLinks} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <JoinCampaignDialog
        open={joinDialogOpen}
        onClose={() => {
          setJoinDialogOpen(false);
          refreshLinks();
        }}
        playerId={player.id}
      />
    </PlayerPageLayout>
  );
};

export default PlayerDashboardNew;
