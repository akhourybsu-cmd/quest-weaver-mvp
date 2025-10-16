import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCampaign } from '@/contexts/CampaignContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Scroll, Package, Map } from 'lucide-react';
import { AwaitingActionBanner } from './AwaitingActionBanner';

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  current_hp: number;
  max_hp: number;
  temp_hp: number;
  ac: number;
  resources: any;
}

interface Quest {
  id: string;
  title: string;
  is_completed: boolean;
  description: string;
}

interface Note {
  id: string;
  title: string;
  content_markdown: string;
  created_at: string;
}

interface Holding {
  id: string;
  items: { name: string; description: string };
  quantity: number;
  owner_type: string;
}

export function PlayerHome() {
  const { campaign } = useCampaign();
  const [character, setCharacter] = useState<Character | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!campaign) return;

      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch player's character
      const { data: charData } = await supabase
        .from('characters')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('user_id', user.id)
        .single();

      if (charData) setCharacter(charData);

      // Fetch active quests
      const { data: questData } = await supabase
        .from('quests')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('is_completed', false)
        .order('created_at', { ascending: false })
        .limit(5);

      if (questData) setQuests(questData);

      // Fetch shared notes
      const { data: noteData } = await supabase
        .from('session_notes')
        .select('*')
        .eq('campaign_id', campaign.id)
        .eq('visibility', 'SHARED')
        .order('created_at', { ascending: false })
        .limit(5);

      if (noteData) setNotes(noteData);

      // Fetch character + party inventory
      const { data: holdingData } = await supabase
        .from('holdings')
        .select('*, items(*)')
        .eq('campaign_id', campaign.id)
        .or(`owner_type.eq.PARTY,and(owner_type.eq.CHARACTER,owner_id.eq.${charData?.id})`);

      if (holdingData) setHoldings(holdingData);

      setIsLoading(false);
    };

    fetchPlayerData();
  }, [campaign?.id]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading your campaign...</div>;
  }

  const hpPercentage = character ? (character.current_hp / character.max_hp) * 100 : 0;

  return (
    <div className="container mx-auto p-4 max-w-6xl space-y-4">
      <AwaitingActionBanner />

      {character && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {character.name}
              <Badge variant="secondary" className="ml-2">
                Level {character.level} {character.class}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>HP: {character.current_hp + character.temp_hp}/{character.max_hp}</span>
                <span>AC: {character.ac}</span>
              </div>
              <Progress value={hpPercentage} className="h-3" />
              {character.temp_hp > 0 && (
                <div className="text-xs text-muted-foreground mt-1">
                  +{character.temp_hp} temporary HP
                </div>
              )}
            </div>

            {character.resources && Object.keys(character.resources).length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.entries(character.resources).map(([key, value]: [string, any]) => (
                  <Badge key={key} variant="outline" className="justify-between">
                    <span>{key}</span>
                    <span>{value.current}/{value.max}</span>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="quests" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quests">
            <Scroll className="h-4 w-4 mr-2" />
            Quests
          </TabsTrigger>
          <TabsTrigger value="notes">
            <Scroll className="h-4 w-4 mr-2" />
            Shared Notes
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="space-y-2">
          {quests.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No active quests yet
              </CardContent>
            </Card>
          ) : (
            quests.map((quest) => (
              <Card key={quest.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{quest.title}</CardTitle>
                    <Badge variant={quest.is_completed ? 'secondary' : 'default'}>
                      {quest.is_completed ? 'Completed' : 'Active'}
                    </Badge>
                  </div>
                </CardHeader>
                {quest.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{quest.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="notes" className="space-y-2">
          {notes.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No shared notes yet
              </CardContent>
            </Card>
          ) : (
            notes.map((note) => (
              <Card key={note.id}>
                <CardHeader>
                  <CardTitle className="text-base">{note.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {note.content_markdown}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="inventory" className="space-y-2">
          {holdings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No items yet
              </CardContent>
            </Card>
          ) : (
            holdings.map((holding) => (
              <Card key={holding.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{holding.items.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {holding.items.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={holding.owner_type === 'PARTY' ? 'secondary' : 'default'}>
                      {holding.owner_type === 'PARTY' ? 'Party' : 'Personal'}
                    </Badge>
                    <Badge variant="outline">x{holding.quantity}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
