import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Loader2, Shield, Heart, Zap, Link2, MoreVertical, Unlink, Link as LinkIcon, Trash2 } from 'lucide-react';
import CharacterWizard from '@/components/character/CharacterWizard';
import { JoinCampaignDialog } from './JoinCampaignDialog';
import { AssignCharacterDialog } from './AssignCharacterDialog';
import LoreOrnamentDivider from '@/components/lore/ui/LoreOrnamentDivider';
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
  speed: number | null;
  portrait_url?: string;
  creation_status: string;
  campaign_id?: string;
  subclass_name?: string | null;
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
  const { userId } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [joinCampaignOpen, setJoinCampaignOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCharacters();
  }, [playerId]);

  const loadCharacters = async () => {
    try {
      if (!userId) return;

      const { data, error } = await supabase
        .from('characters')
        .select(`
          *,
          campaign:campaigns(id, name),
          srd_subclasses(name)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedData = (data || []).map((char: any) => ({
        ...char,
        subclass_name: char.srd_subclasses?.name || null
      }));
      setCharacters(transformedData);
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

  const handleDeleteCharacter = async () => {
    if (!selectedCharacter) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', selectedCharacter.id);

      if (error) throw error;

      toast({
        title: 'Character deleted',
        description: `${selectedCharacter.name} has been permanently deleted`,
      });

      loadCharacters();
      setDeleteDialogOpen(false);
      setSelectedCharacter(null);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
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

  const handleDeleteClick = (character: Character) => {
    setSelectedCharacter(character);
    setDeleteDialogOpen(true);
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
      {/* Folio Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold text-foreground tracking-wide">My Characters</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Your heroes and adventurers
          </p>
        </div>
        <Button 
          onClick={() => setWizardOpen(true)} 
          className="gap-2 fantasy-create-btn"
        >
          <Plus className="w-4 h-4" />
          Create Character
        </Button>
      </div>

      {/* Ornamental divider below header */}
      <LoreOrnamentDivider className="!my-2" />

      {characters.length === 0 ? (
        <Card className="rounded-xl parchment-card border-brass/30">
          <CardHeader className="text-center pb-3">
            <div className="fantasy-divider !my-4">
              <div className="fantasy-divider-ornament" />
            </div>
            <CardTitle className="font-cinzel text-2xl">No Characters Yet</CardTitle>
            <CardDescription className="mt-1">
              Create your first character to begin your adventure
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <Button onClick={() => setWizardOpen(true)} size="lg" className="gap-2 fantasy-create-btn">
              <Plus className="w-5 h-5" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {characters.map((character) => (
            <Card
              key={character.id}
              className="rounded-xl bg-card fantasy-character-card cursor-pointer overflow-hidden"
              onClick={() => handleCharacterClick(character.id)}
            >
              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex items-start gap-3">
                  {/* Portrait with double-border frame */}
                  <div className="relative shrink-0">
                    <Avatar className="w-16 h-16 fantasy-portrait-frame rounded-lg">
                      <AvatarImage src={character.portrait_url} className="object-cover" />
                      <AvatarFallback className="bg-brass/10 text-brass font-cinzel text-xl rounded-lg">
                        {character.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-cinzel text-lg truncate tracking-wide">
                      {character.name}
                    </CardTitle>
                    <CardDescription className="flex flex-col gap-1 mt-1">
                      <span className="text-sm">Level {character.level} {character.class}</span>
                      {character.subclass_name && (
                        <span className="fantasy-badge w-fit text-[10px]">
                          {character.subclass_name}
                        </span>
                      )}
                      {character.level >= 3 && !character.subclass_name && (
                        <Badge variant="outline" className="w-fit border-warning-amber/50 text-warning-amber text-xs animate-pulse">
                          Subclass Available!
                        </Badge>
                      )}
                    </CardDescription>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {character.creation_status === 'draft' && (
                        <span className="fantasy-badge">Draft</span>
                      )}
                      {character.campaign && (
                        <span className="fantasy-badge">
                          {character.campaign.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(character);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Character
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              {/* Stat shelf */}
              <CardContent className="pt-0 px-5 pb-4">
                <div className="grid grid-cols-3 gap-3 p-2.5 rounded-lg fantasy-folio-shelf mt-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-hp-red" />
                    <span className="font-medium tabular-nums">{character.current_hp}/{character.max_hp}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-brass" />
                    <span className="font-medium tabular-nums">{character.ac}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium tabular-nums">{character.speed ?? 30} ft</span>
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

          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Character Permanently?</AlertDialogTitle>
                <AlertDialogDescription asChild>
                  <div className="space-y-2">
                    <p>
                      Are you sure you want to delete <strong>{selectedCharacter.name}</strong>?
                    </p>
                    {selectedCharacter.campaign && (
                      <p className="text-destructive font-medium">
                        This will also remove them from "{selectedCharacter.campaign.name}".
                      </p>
                    )}
                    <p className="text-sm">
                      This action cannot be undone. All character data, equipment, spells, and history will be permanently removed.
                    </p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDeleteCharacter} 
                  disabled={deleting}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleting ? 'Deleting...' : 'Delete Permanently'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
};
