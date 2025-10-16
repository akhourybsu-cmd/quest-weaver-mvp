import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sword, Users, Plus, LogIn, Scroll, LogOut, Copy, PlayCircle, UserCircle, Trash2, Sparkles, Map, Clock, FileText, MoreVertical, Package, Library, Database } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CharacterWizard from "@/components/character/CharacterWizard";
import CharacterSelectionDialog from "@/components/character/CharacterSelectionDialog";
import { SeedCombatButton } from "@/components/dev/SeedCombatButton";
import { SRDImportButton } from "@/components/admin/SRDImportButton";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Badge } from "@/components/ui/badge";
import RestManager from "@/components/character/RestManager";
import { ResourceSetupDialog } from "@/components/combat/ResourceSetupDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Campaign {
  id: string;
  name: string;
  code: string;
  player_count: number;
}

interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  campaign_id: string | null;
  campaign_name?: string;
  creation_status?: 'draft' | 'complete';
}

const CampaignHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showCharacterSelection, setShowCharacterSelection] = useState(false);
  const [joinedCampaignId, setJoinedCampaignId] = useState<string | null>(null);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [expandedCharacters, setExpandedCharacters] = useState<Set<string>>(new Set());
  const [editCharacterId, setEditCharacterId] = useState<string | null>(null);
  const [deletingCharacter, setDeletingCharacter] = useState<Character | null>(null);

  useEffect(() => {
    fetchMyCampaigns();
    fetchMyCharacters();
  }, []);

  const fetchMyCampaigns = async () => {
    setLoadingCampaigns(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: campaigns, error } = await supabase
        .from("campaigns")
        .select("id, name, code")
        .eq("dm_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch player count for each campaign
      const campaignsWithCounts = await Promise.all(
        (campaigns || []).map(async (campaign) => {
          const { count } = await supabase
            .from("characters")
            .select("*", { count: "exact", head: true })
            .eq("campaign_id", campaign.id);

          return {
            ...campaign,
            player_count: count || 0,
          };
        })
      );

      setMyCampaigns(campaignsWithCounts);
    } catch (error: any) {
      toast({
        title: "Error loading campaigns",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code copied!",
      description: `Campaign code ${code} copied to clipboard`,
    });
  };

  const fetchMyCharacters = async () => {
    setLoadingCharacters(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: characters, error } = await supabase
        .from("characters")
        .select("id, name, class, level, campaign_id, current_hp, max_hp, resources, creation_status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch campaign names for characters assigned to campaigns
      const charactersWithCampaigns = await Promise.all(
        (characters || []).map(async (character) => {
          if (character.campaign_id) {
            const { data: campaign } = await supabase
              .from("campaigns")
              .select("name")
              .eq("id", character.campaign_id)
              .single();

            return {
              ...character,
              campaign_name: campaign?.name,
            };
          }
          return character;
        })
      );

      setMyCharacters(charactersWithCampaigns.map(char => ({
        ...char,
        creation_status: (char.creation_status as 'draft' | 'complete') || 'complete'
      })));
    } catch (error: any) {
      toast({
        title: "Error loading characters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingCharacters(false);
    }
  };

  const handleContinueCampaign = (campaignId: string) => {
    navigate(`/session/dm?campaign=${campaignId}`);
  };

  const handleDeleteCampaign = async () => {
    if (!deletingCampaign) return;

    try {
      // First, unassign all characters from this campaign
      const { error: characterError } = await supabase
        .from("characters")
        .update({ campaign_id: null })
        .eq("campaign_id", deletingCampaign.id);

      if (characterError) throw characterError;

      // Then delete the campaign
      const { error } = await supabase
        .from("campaigns")
        .delete()
        .eq("id", deletingCampaign.id);

      if (error) throw error;

      toast({
        title: "Campaign deleted",
        description: `${deletingCampaign.name} has been removed and characters have been unassigned`,
      });

      setDeletingCampaign(null);
      await Promise.all([fetchMyCampaigns(), fetchMyCharacters()]);
    } catch (error: any) {
      toast({
        title: "Error deleting campaign",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCharacter = async () => {
    if (!deletingCharacter) return;

    try {
      const { error } = await supabase
        .from("characters")
        .delete()
        .eq("id", deletingCharacter.id);

      if (error) throw error;

      toast({
        title: "Character deleted",
        description: `${deletingCharacter.name} has been permanently removed`,
      });

      setDeletingCharacter(null);
      await fetchMyCharacters();
    } catch (error: any) {
      toast({
        title: "Error deleting character",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateCampaign = async () => {
    if (!campaignName.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data, error } = await supabase
        .from("campaigns")
        .insert({
          code,
          name: campaignName,
          dm_user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      toast({
        title: "Campaign created!",
        description: `Campaign code: ${code}`,
      });
      fetchMyCampaigns(); // Refresh the list
      navigate(`/session/dm?campaign=${data.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinCampaign = async () => {
    if (!campaignCode.trim()) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Find campaign by code
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .select("id, code")
        .eq("code", campaignCode.toUpperCase())
        .single();

      if (campaignError) throw new Error("Campaign not found");

      // Check if user already has a character in this campaign
      const { data: existingCharacter } = await supabase
        .from("characters")
        .select("id")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingCharacter) {
        // User already has a character, go directly to session
        navigate(`/session/player?campaign=${campaign.code}`);
      } else {
        // Show character selection dialog
        setJoinedCampaignId(campaign.id);
        setShowCharacterSelection(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterCreated = async () => {
    setShowCharacterCreation(false);
    setEditCharacterId(null);
    await fetchMyCharacters();
  };

  const handleCharacterSelected = async () => {
    setShowCharacterSelection(false);
    
    // Get the campaign code to redirect
    if (joinedCampaignId) {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("code")
        .eq("id", joinedCampaignId)
        .single();

      if (campaign) {
        navigate(`/session/player?campaign=${campaign.code}`);
      }
    }
  };

  const handleCancelSelection = () => {
    setShowCharacterSelection(false);
    setJoinedCampaignId(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        className="absolute top-4 right-4"
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sign Out
      </Button>
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Scroll className="w-12 h-12 text-primary" />
            <h1 className="text-5xl font-bold tracking-tight text-foreground">
              Campaign Manager
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Run immersive D&D 5E sessions with real-time sync, minimal screen time, and powerful DM tools
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Choose Your Role</CardTitle>
            <CardDescription className="text-base">
              Start a new campaign as DM or join an existing one as a player
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="dm" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="dm" className="text-base">
                  <Sword className="w-4 h-4 mr-2" />
                  Dungeon Master
                </TabsTrigger>
                <TabsTrigger value="player" className="text-base">
                  <Users className="w-4 h-4 mr-2" />
                  Player
                </TabsTrigger>
              </TabsList>

              {/* DM Tab */}
              <TabsContent value="dm" className="space-y-6">
                {/* Existing Campaigns */}
                {loadingCampaigns ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading your campaigns...
                  </div>
                ) : myCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">Your Campaigns</h3>
                    <div className="space-y-2">
                      {myCampaigns.map((campaign) => (
                        <Card key={campaign.id} className="shadow-sm">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold truncate">{campaign.name}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <button
                                    onClick={() => handleCopyCode(campaign.code)}
                                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                  >
                                    <span className="font-mono font-bold">{campaign.code}</span>
                                    <Copy className="w-3 h-3" />
                                  </button>
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    {campaign.player_count} {campaign.player_count === 1 ? 'player' : 'players'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  onClick={() => handleContinueCampaign(campaign.id)}
                                  size="sm"
                                >
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Continue
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => navigate(`/world-map?campaign=${campaign.id}&dm=true`)}
                                    >
                                      <Map className="w-4 h-4 mr-2" />
                                      World Map
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => navigate(`/timeline?campaign=${campaign.id}&dm=true`)}
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Timeline
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => navigate(`/notes?campaign=${campaign.id}&dm=true`)}
                                    >
                                      <FileText className="w-4 h-4 mr-2" />
                                      Notes & NPCs
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => navigate(`/inventory?campaign=${campaign.id}`)}
                                    >
                                      <Package className="w-4 h-4 mr-2" />
                                      Party Inventory
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => navigate(`/lore?campaign=${campaign.id}&dm=true`)}
                                    >
                                      <Library className="w-4 h-4 mr-2" />
                                      Lore
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                <Button
                                  onClick={() => setDeletingCampaign(campaign)}
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or create new
                        </span>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Create New Campaign */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-name" className="text-base">
                      Campaign Name
                    </Label>
                    <Input
                      id="campaign-name"
                      placeholder="The Lost Mines of Phandelver"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="h-12 text-base"
                    />
                  </div>
                  <Button
                    onClick={handleCreateCampaign}
                    disabled={loading || !campaignName.trim()}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    {loading ? "Creating..." : "Create Campaign"}
                  </Button>
                </div>

                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-accent-foreground">DM Features</h3>
                  <ul className="text-sm text-accent-foreground space-y-1 list-disc list-inside">
                    <li>Run combat with initiative tracking</li>
                    <li>Manage party HP, conditions, and resources</li>
                    <li>Reveal handouts and control visibility</li>
                    <li>Access full SRD monster library</li>
                    <li>Session journal and notes</li>
                  </ul>
                </div>
              </TabsContent>

              {/* Player Tab */}
              <TabsContent value="player" className="space-y-6">
                {/* My Characters */}
                {loadingCharacters ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading your characters...
                  </div>
                ) : myCharacters.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">My Characters</h3>
                      <Button
                        onClick={() => setShowCharacterCreation(true)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Character
                      </Button>
                    </div>
                     <div className="space-y-2">
                      {myCharacters.map((character) => {
                        const isExpanded = expandedCharacters.has(character.id);
                        return (
                        <Card key={character.id} className="shadow-sm">
                          <Collapsible
                            open={isExpanded}
                            onOpenChange={(open) => {
                              const newExpanded = new Set(expandedCharacters);
                              if (open) {
                                newExpanded.add(character.id);
                              } else {
                                newExpanded.delete(character.id);
                              }
                              setExpandedCharacters(newExpanded);
                            }}
                          >
                            <CollapsibleTrigger asChild>
                              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <UserCircle className="w-5 h-5 text-primary" />
                                  </div>
                                   <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold truncate">{character.name}</h4>
                                      {character.creation_status === 'draft' && (
                                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                                          Incomplete
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <Badge variant="secondary" className="text-xs">
                                        Level {character.level} {character.class}
                                      </Badge>
                                      {character.campaign_name && (
                                        <Badge variant="outline" className="text-xs">
                                          {character.campaign_name}
                                        </Badge>
                                      )}
                                      {!character.campaign_id && (
                                        <Badge variant="outline" className="text-xs text-muted-foreground">
                                          Unassigned
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="sm">
                                      <Sparkles className="w-4 h-4" />
                                    </Button>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
                                          <MoreVertical className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onClick={() => setDeletingCharacter(character)}
                                        >
                                          <Trash2 className="h-4 w-4 mr-2" />
                                          Delete Character
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </CardContent>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <CardContent className="pt-0 pb-4 space-y-3 border-t">
                                <div className="flex gap-2 pt-3">
                                  {character.creation_status === 'draft' ? (
                                    <Button 
                                      variant="outline" 
                                      className="flex-1"
                                      onClick={() => {
                                        setEditCharacterId(character.id);
                                        setShowCharacterCreation(true);
                                      }}
                                    >
                                      Continue Creation
                                    </Button>
                                  ) : (
                                    <ResourceSetupDialog
                                      characterId={character.id}
                                      characterName={character.name}
                                      currentResources={(character as any).resources || {}}
                                      onUpdate={fetchMyCharacters}
                                    />
                                  )}
                                </div>
                              </CardContent>
                            </CollapsibleContent>
                          </Collapsible>
                        </Card>
                      )})}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Join a campaign
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-muted-foreground text-sm">
                      You don't have any characters yet
                    </p>
                    <Button
                      onClick={() => setShowCharacterCreation(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Your First Character
                    </Button>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                          Or join directly
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Join Campaign */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="campaign-code" className="text-base">
                      Campaign Code
                    </Label>
                    <Input
                      id="campaign-code"
                      placeholder="ABC123"
                      value={campaignCode}
                      onChange={(e) => setCampaignCode(e.target.value.toUpperCase())}
                      className="h-12 text-base uppercase"
                      maxLength={6}
                    />
                  </div>
                  <Button
                    onClick={handleJoinCampaign}
                    disabled={loading || !campaignCode.trim()}
                    className="w-full h-12 text-base"
                    size="lg"
                  >
                    <LogIn className="w-5 h-5 mr-2" />
                    {loading ? "Joining..." : "Join Campaign"}
                  </Button>
                </div>

                <div className="bg-accent rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-accent-foreground">Player Features</h3>
                  <ul className="text-sm text-accent-foreground space-y-1 list-disc list-inside">
                    <li>Manage your character sheet</li>
                    <li>Roll dice with advantage/disadvantage</li>
                    <li>Track HP, spell slots, and resources</li>
                    <li>Take notes during sessions</li>
                    <li>View shared handouts and quest log</li>
                  </ul>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sword className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Real-Time Sync</h3>
              <p className="text-sm text-muted-foreground">
                All players see updates instantly, even offline
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="font-semibold mb-2">Heads-Up Play</h3>
              <p className="text-sm text-muted-foreground">
                Common actions in ≤2 taps, focus on the table
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="w-12 h-12 rounded-full bg-status-buff/10 flex items-center justify-center mx-auto mb-3">
                <Scroll className="w-6 h-6 text-status-buff" />
              </div>
              <h3 className="font-semibold mb-2">SRD Complete</h3>
              <p className="text-sm text-muted-foreground">
                Full 5E rules reference at your fingertips
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Character Creation Wizard */}
      <CharacterWizard
        open={showCharacterCreation}
        campaignId={null}
        editCharacterId={editCharacterId}
        onComplete={handleCharacterCreated}
      />

      {/* Character Selection Dialog */}
      {joinedCampaignId && (
        <CharacterSelectionDialog
          open={showCharacterSelection}
          campaignId={joinedCampaignId}
          onComplete={handleCharacterSelected}
          onCancel={handleCancelSelection}
        />
      )}

      {/* Delete Campaign Confirmation */}
      <AlertDialog open={!!deletingCampaign} onOpenChange={(open) => !open && setDeletingCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingCampaign?.name}</strong> and all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All encounters and combat data</li>
                <li>Maps, handouts, and notes</li>
                <li>Quest logs and loot</li>
              </ul>
              <p className="mt-3 text-muted-foreground">
                Characters assigned to this campaign will be unassigned and returned to your character list.
              </p>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCampaign}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Character Confirmation */}
      <AlertDialog open={!!deletingCharacter} onOpenChange={(open) => !open && setDeletingCharacter(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingCharacter?.name}</strong> and remove them from all campaigns. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCharacter}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Character
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Admin Tools - Only show for admin users */}
      {isAdmin && (
        <div className="space-y-4">
          <SeedCombatButton />
          <SRDImportButton />
        </div>
      )}
    </div>
  );
};

export default CampaignHub;
