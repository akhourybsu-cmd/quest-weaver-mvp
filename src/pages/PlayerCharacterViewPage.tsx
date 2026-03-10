import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerCharacterSheet } from '@/components/player/PlayerCharacterSheet';
import { CharacterNarrativeSheet } from '@/components/player/CharacterNarrativeSheet';
import { CharacterPortraitEditor } from '@/components/character/CharacterPortraitEditor';
import { Camera, RotateCcw, Heart, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import LoreOrnamentDivider from '@/components/lore/ui/LoreOrnamentDivider';

const PlayerCharacterViewPage = () => {
  const { characterId } = useParams();
  const { player, loading: playerLoading } = usePlayer();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (!characterId || !player) return;
    loadCharacter();
  }, [characterId, player]);

  const loadCharacter = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('characters')
        .select('*, srd_subclasses(name)')
        .eq('id', characterId)
        .eq('user_id', userId)
        .single();

      if (error) throw error;

      if (!data) {
        toast({ title: 'Character Not Found', description: 'This character does not exist or you do not have access to it.', variant: 'destructive' });
        navigate(`/player/${player?.id}/characters`);
        return;
      }

      setCharacter({
        ...data,
        subclass_name: (data as any).srd_subclasses?.name || null
      });
    } catch (error) {
      console.error('Error loading character:', error);
      toast({ title: 'Error', description: 'Failed to load character details.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (playerLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  if (!player) return <Navigate to="/" replace />;
  if (!character) return <Navigate to={`/player/${player.id}/characters`} replace />;

  const hpPct = character.max_hp > 0 ? Math.round((character.current_hp / character.max_hp) * 100) : 0;

  return (
    <PlayerPageLayout playerId={player.id} mobileTitle={character.name}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 py-4 md:py-6">
        {/* Minimal back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/player/${player.id}/characters`)}
          className="mb-3 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {/* Regal Hero Banner */}
        <div className="relative mb-4 p-4 rounded-xl border-2 border-brass/40 parchment-card bg-gradient-to-r from-brass/8 via-card to-brass/8 overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-10 h-10 border-t-[3px] border-l-[3px] border-brass/70 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-10 h-10 border-t-[3px] border-r-[3px] border-brass/70 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[3px] border-l-[3px] border-brass/70 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[3px] border-r-[3px] border-brass/70 rounded-br-xl" />
          
          {/* Subtle parchment overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-parchment/8 via-transparent to-brass/5 pointer-events-none" />

          <div className="relative flex items-center gap-5 md:gap-6">
            {/* Large Portrait with fantasy frame */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg fantasy-portrait-frame overflow-hidden bg-muted/50">
                {character.portrait_url ? (
                  <img src={character.portrait_url} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl md:text-5xl font-cinzel text-brass">
                    {character.name.charAt(0)}
                  </div>
                )}
              </div>
              {/* Outer decorative frame */}
              <div className="absolute -inset-1 rounded-lg border border-brass/30 pointer-events-none" />
              {/* Edit button overlay */}
              <CharacterPortraitEditor
                characterId={character.id}
                characterName={character.name}
                currentPortraitUrl={character.portrait_url}
                onPortraitUpdated={(newUrl) => setCharacter({ ...character, portrait_url: newUrl })}
                trigger={
                  <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-card border-2 border-brass/40 flex items-center justify-center hover:bg-brass/20 transition-colors cursor-pointer">
                    <Camera className="w-3.5 h-3.5 text-brass" />
                  </button>
                }
              />
            </div>

            {/* Name & Identity */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-cinzel font-bold text-foreground tracking-wide truncate">
                {character.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <span className="fantasy-badge font-cinzel">
                  Level {character.level}
                </span>
                <span className="fantasy-badge">
                  {character.class}
                </span>
                {character.subclass_name && (
                  <span className="fantasy-badge">
                    {character.subclass_name}
                  </span>
                )}
                {character.level >= 3 && !character.subclass_name && (
                  <Badge variant="outline" className="border-warning-amber/50 text-warning-amber animate-pulse text-xs">
                    Subclass Available!
                  </Badge>
                )}
              </div>
            </div>

            {/* Right side: Quick stats + flip button */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              {/* Quick HP */}
              <div className="text-center px-3 py-1.5 rounded-lg border border-brass/30 bg-card/80 parchment-inset">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-hp-red" />
                  <span className="text-xs text-muted-foreground font-cinzel uppercase tracking-wider">HP</span>
                </div>
                <div className="text-lg font-bold tabular-nums mt-0.5">
                  {character.current_hp}<span className="text-muted-foreground text-sm">/{character.max_hp}</span>
                </div>
              </div>
              {/* Quick AC */}
              <div className="text-center px-3 py-1.5 rounded-lg border border-brass/30 bg-card/80 parchment-inset">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-brass" />
                  <span className="text-xs text-muted-foreground font-cinzel uppercase tracking-wider">AC</span>
                </div>
                <div className="text-lg font-bold tabular-nums mt-0.5">{character.ac}</div>
              </div>
              {/* Flip button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="gap-1.5 fantasy-flip-btn text-xs"
              >
                <RotateCcw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
                {isFlipped ? 'Stats' : 'Story'}
              </Button>
            </div>

            {/* Mobile flip button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlipped(!isFlipped)}
              className="md:hidden shrink-0 gap-1.5 fantasy-flip-btn text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''}`} />
              {isFlipped ? 'Stats' : 'Story'}
            </Button>
          </div>
        </div>

        {/* Ornamental divider between header and sheet */}
        <LoreOrnamentDivider className="!my-3" />

        {/* 3D Flip Container */}
        <div style={{ perspective: '2000px' }}>
          <div
            className="relative transition-transform duration-700 ease-in-out"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front — Mechanical Sheet */}
            <div
              style={{ backfaceVisibility: 'hidden' }}
              className={isFlipped ? 'invisible' : ''}
            >
              <PlayerCharacterSheet characterId={character.id} />
            </div>

            {/* Back — Narrative Sheet */}
            <div
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
              className={`absolute inset-0 ${!isFlipped ? 'invisible' : ''}`}
            >
              <CharacterNarrativeSheet characterId={character.id} />
            </div>
          </div>
        </div>
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerCharacterViewPage;
