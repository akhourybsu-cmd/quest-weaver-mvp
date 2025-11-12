import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Loader2, Shield, Heart, Zap } from 'lucide-react';
import CharacterWizard from '@/components/character/CharacterWizard';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  max_hp: number;
  current_hp: number;
  ac: number;
  portrait_url?: string;
  creation_status: string;
  campaign_id?: string;
}

interface PlayerCharacterListProps {
  playerId: string;
}

export const PlayerCharacterList = ({ playerId }: PlayerCharacterListProps) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCharacters();
  }, [playerId]);

  const loadCharacters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterClick = (characterId: string) => {
    navigate(`/player/${playerId}/characters/${characterId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-brass" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold text-foreground">My Characters</h2>
          <p className="text-muted-foreground mt-1">
            Manage your heroes and adventurers
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Create Character
        </Button>
      </div>

      {characters.length === 0 ? (
        <Card className="rounded-2xl shadow-xl border-brass/30">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl">No Characters Yet</CardTitle>
            <CardDescription>
              Create your first character to begin your adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setWizardOpen(true)} size="lg" className="gap-2">
              <Plus className="w-5 h-5" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {characters.map((character) => (
            <Card
              key={character.id}
              className="rounded-2xl shadow-xl border-brass/30 hover:border-brass/50 transition-all cursor-pointer"
              onClick={() => handleCharacterClick(character.id)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start gap-3">
                  <Avatar className="w-16 h-16 border-2 border-brass/30">
                    <AvatarImage src={character.portrait_url} />
                    <AvatarFallback className="bg-brass/10 text-brass font-cinzel text-xl">
                      {character.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-cinzel text-xl truncate">
                      {character.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>Level {character.level} {character.class}</span>
                    </CardDescription>
                    {character.creation_status === 'draft' && (
                      <Badge variant="outline" className="mt-2">
                        Draft
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-red-500" />
                    <span>{character.current_hp}/{character.max_hp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-blue-500" />
                    <span>{character.ac}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span>30 ft</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CharacterWizard
        open={wizardOpen}
        campaignId={undefined}
        onComplete={() => {
          setWizardOpen(false);
          loadCharacters();
        }}
      />
    </div>
  );
};
