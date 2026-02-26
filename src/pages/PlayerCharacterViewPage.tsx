import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerPageLayout } from '@/components/player/PlayerPageLayout';
import { PlayerCharacterSheet } from '@/components/player/PlayerCharacterSheet';
import { CharacterPortraitEditor } from '@/components/character/CharacterPortraitEditor';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PlayerCharacterViewPage = () => {
  const { characterId } = useParams();
  const { player, loading: playerLoading } = usePlayer();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!characterId || !player) return;
    loadCharacter();
  }, [characterId, player]);

  const loadCharacter = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('characters')
        .select('*, srd_subclasses(name)')
        .eq('id', characterId)
        .eq('user_id', user.id)
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
        <div className="relative mb-6 p-5 md:p-6 rounded-xl border-2 border-brass/40 bg-gradient-to-r from-brass/10 via-card to-brass/10 overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-brass rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-brass rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-brass rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-brass rounded-br-xl" />
          
          {/* Subtle parchment overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-parchment/5 via-transparent to-brass/5 pointer-events-none" />

          <div className="relative flex items-center gap-5 md:gap-6">
            {/* Large Portrait with brass double-frame & glow */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg border-[3px] border-brass shadow-[0_0_20px_hsl(var(--brass)/0.3)] overflow-hidden bg-muted/50">
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
              {/* Edit overlay */}
              <div className="absolute -bottom-1 -right-1">
                <CharacterPortraitEditor
                  characterId={character.id}
                  characterName={character.name}
                  currentPortraitUrl={character.portrait_url}
                  onPortraitUpdated={(newUrl) => setCharacter({ ...character, portrait_url: newUrl })}
                />
              </div>
            </div>

            {/* Name & Identity */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-cinzel font-bold text-foreground tracking-wide truncate">
                {character.name}
              </h1>
              <div className="flex items-center gap-2 flex-wrap mt-2">
                <Badge variant="outline" className="border-brass/50 text-brass font-cinzel text-xs tracking-wide">
                  Level {character.level}
                </Badge>
                <Badge variant="outline" className="border-primary/50 text-primary text-xs">
                  {character.class}
                </Badge>
                {character.subclass_name && (
                  <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30 text-xs">
                    {character.subclass_name}
                  </Badge>
                )}
                {character.level >= 3 && !character.subclass_name && (
                  <Badge variant="outline" className="border-amber-500/50 text-amber-500 animate-pulse text-xs">
                    Subclass Available!
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Character Sheet - fills remaining space */}
        <PlayerCharacterSheet characterId={character.id} />
      </div>
    </PlayerPageLayout>
  );
};

export default PlayerCharacterViewPage;
