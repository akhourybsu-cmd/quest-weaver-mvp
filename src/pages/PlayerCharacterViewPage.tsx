import { useState, useEffect } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/hooks/usePlayer';
import { PlayerNavigation } from '@/components/player/PlayerNavigation';
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
        toast({
          title: 'Character Not Found',
          description: 'This character does not exist or you do not have access to it.',
          variant: 'destructive',
        });
        navigate(`/player/${player?.id}/characters`);
        return;
      }

      setCharacter({
        ...data,
        subclass_name: (data as any).srd_subclasses?.name || null
      });
    } catch (error) {
      console.error('Error loading character:', error);
      toast({
        title: 'Error',
        description: 'Failed to load character details.',
        variant: 'destructive',
      });
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

  if (!player) {
    return <Navigate to="/" replace />;
  }

  if (!character) {
    return <Navigate to={`/player/${player.id}/characters`} replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-brass/5 flex">
      <PlayerNavigation playerId={player.id} />
      
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-6">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/player/${player.id}/characters`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Characters
            </Button>
            
            <div className="flex items-start gap-4">
              <CharacterPortraitEditor
                characterId={character.id}
                characterName={character.name}
                currentPortraitUrl={character.portrait_url}
                onPortraitUpdated={(newUrl) => setCharacter({ ...character, portrait_url: newUrl })}
              />
              
              <div>
                <h1 className="text-4xl font-cinzel font-bold text-foreground">
                  {character.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <p className="text-muted-foreground">
                    Level {character.level} {character.class}
                  </p>
                  {character.subclass_name && (
                    <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
                      {character.subclass_name}
                    </Badge>
                  )}
                  {character.level >= 3 && !character.subclass_name && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-500 animate-pulse">
                      Subclass Available!
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          <PlayerCharacterSheet characterId={character.id} />
        </div>
      </div>
    </div>
  );
};

export default PlayerCharacterViewPage;
