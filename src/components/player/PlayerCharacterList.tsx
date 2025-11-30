import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Loader2, Shield, Heart, Zap, Link2, MoreVertical, Unlink, Link as LinkIcon } from 'lucide-react';
import CharacterWizard from '@/components/character/CharacterWizard';
import { JoinCampaignDialog } from './JoinCampaignDialog';
import { AssignCharacterDialog } from './AssignCharacterDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

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
  campaign?: {
    id: string;
    name: string;
  };
}

interface PlayerCharacterListProps {
  playerId: string;
}

export const PlayerCharacterList = ({ playerId }: PlayerCharacterListProps) => {
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [joinCampaignOpen, setJoinCampaignOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
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
        .select(`
          *,
          campaign:campaigns(id, name)
        `)
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

  const handleRemoveFromCampaign = async () => {
    if (!selectedCharacter) return;

    try {
      const { error } = await supabase
        .from('characters')
        .update({ campaign_id: null })
        .eq('id', selectedCharacter.id);

      if (error) throw error;

      toast({
        title: 'Character removed',
        description: `${selectedCharacter.name} has been removed from the campaign`,
      });

      loadCharacters();
      setRemoveDialogOpen(false);
      setSelectedCharacter(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleAssignClick = (character: Character) => {
    setSelectedCharacter(character);
    setAssignDialogOpen(true);
  };

  const handleRemoveClick = (character: Character) => {
    setSelectedCharacter(character);
    setRemoveDialogOpen(true);
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
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {character.creation_status === 'draft' && (
                        <Badge variant="outline">
                          Draft
                        </Badge>
                      )}
                      {character.campaign && (
                        <Badge variant="secondary" className="bg-brass/20 text-brass border-brass/30">
                          {character.campaign.name}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignClick(character);
                        }}
                      >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        {character.campaign ? 'Change Campaign' : 'Assign to Campaign'}
                      </DropdownMenuItem>
                      {character.campaign && (
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveClick(character);
                          }}
                          className="text-destructive"
                        >
                          <Unlink className="w-4 h-4 mr-2" />
                          Remove from Campaign
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      <JoinCampaignDialog
        open={joinCampaignOpen}
        onClose={() => {
          setJoinCampaignOpen(false);
          loadCharacters();
        }}
        playerId={playerId}
      />

      {selectedCharacter && (
        <>
          <AssignCharacterDialog
            open={assignDialogOpen}
            onClose={() => {
              setAssignDialogOpen(false);
              setSelectedCharacter(null);
              loadCharacters();
            }}
            characterId={selectedCharacter.id}
            characterName={selectedCharacter.name}
            currentCampaignId={selectedCharacter.campaign_id || undefined}
          />

          <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove from Campaign?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove {selectedCharacter.name} from {selectedCharacter.campaign?.name}.
                  You can assign them to another campaign later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemoveFromCampaign} className="bg-destructive hover:bg-destructive/90">
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};
