import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, BookOpen, Scroll, Loader2 } from "lucide-react";
import MonsterImportDialog from "./MonsterImportDialog";

interface Monster {
  id: string;
  name: string;
  type: string;
  size: string;
  cr: number | null;
  ac: number;
  hp_avg: number;
  abilities: any;
  actions?: any[];
  traits?: any[];
  reactions?: any[];
  legendary_actions?: any[];
}

interface MonsterLibraryDialogProps {
  encounterId: string;
  onMonstersAdded: () => void;
}

const MonsterLibraryDialog = ({ encounterId, onMonstersAdded }: MonsterLibraryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [catalogMonsters, setCatalogMonsters] = useState<Monster[]>([]);
  const [homebrewMonsters, setHomebrewMonsters] = useState<Monster[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonster, setSelectedMonster] = useState<Monster | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchMonsters();
    }
  }, [open]);

  const fetchMonsters = async () => {
    setLoading(true);
    
  const { data: catalog } = await supabase
      .from("monster_catalog")
      .select("*")
      .order("name");

    const { data: homebrew } = await supabase
      .from("monster_homebrew")
      .select("*")
      .order("name");

    setCatalogMonsters((catalog || []) as Monster[]);
    setHomebrewMonsters((homebrew || []) as Monster[]);
    setLoading(false);
  };

  const handleAddMonster = async () => {
    if (!selectedMonster) return;

    setAdding(true);
    try {
      const sourceType = catalogMonsters.find(m => m.id === selectedMonster.id) ? 'catalog' : 'homebrew';
      
      const { error } = await supabase.functions.invoke('add-monsters-to-encounter', {
        body: {
          encounterId,
          monsters: [{
            sourceType,
            monsterId: selectedMonster.id,
            quantity,
            namePrefix: selectedMonster.name
          }]
        }
      });

      if (error) throw error;

      toast({
        title: "Monsters Added",
        description: `Added ${quantity}× ${selectedMonster.name} to encounter`,
      });

      setOpen(false);
      setSelectedMonster(null);
      setQuantity(1);
      onMonstersAdded();
    } catch (error: any) {
      toast({
        title: "Error adding monsters",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const filterMonsters = (monsters: Monster[]) => {
    return monsters.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const calculateModifier = (score: number) => Math.floor((score - 10) / 2);

  const renderMonsterCard = (monster: Monster) => (
    <Card
      key={monster.id}
      className={`cursor-pointer transition-all hover:shadow-md ${
        selectedMonster?.id === monster.id ? 'ring-2 ring-primary' : ''
      }`}
      onClick={() => setSelectedMonster(monster)}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{monster.name}</h4>
            <p className="text-xs text-muted-foreground capitalize truncate">
              {monster.size} {monster.type}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 ml-2">
            {monster.cr !== null && (
              <Badge variant="outline" className="text-xs">CR {monster.cr}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-muted-foreground">AC {monster.ac}</span>
          <span className="text-muted-foreground">HP {monster.hp_avg}</span>
          <span className="text-muted-foreground">Init {calculateModifier(monster.abilities.dex) >= 0 ? '+' : ''}{calculateModifier(monster.abilities.dex)}</span>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Add Monsters
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Monster Library</DialogTitle>
            <MonsterImportDialog />
          </div>
        </DialogHeader>

        <div className="flex gap-4 flex-1 overflow-hidden px-6 pb-6">
          {/* Monster List */}
          <div className="flex-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search monsters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Tabs defaultValue="catalog">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="catalog">
                  <BookOpen className="w-4 h-4 mr-2" />
                  SRD ({catalogMonsters.length})
                </TabsTrigger>
                <TabsTrigger value="homebrew">
                  <Scroll className="w-4 h-4 mr-2" />
                  Homebrew ({homebrewMonsters.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="catalog" className="mt-4">
                <ScrollArea className="h-[480px]">
                  <div className="space-y-2 pr-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : filterMonsters(catalogMonsters).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No monsters found</p>
                    ) : (
                      filterMonsters(catalogMonsters).map(renderMonsterCard)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="homebrew" className="mt-4">
                <ScrollArea className="h-[480px]">
                  <div className="space-y-2 pr-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin" />
                      </div>
                    ) : filterMonsters(homebrewMonsters).length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No homebrew monsters yet</p>
                    ) : (
                      filterMonsters(homebrewMonsters).map(renderMonsterCard)
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview & Add Panel */}
          <div className="w-96 border-l border-border pl-4 flex flex-col overflow-hidden">
            {selectedMonster ? (
              <>
                <ScrollArea className="flex-1 pr-3">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-xl mb-1">{selectedMonster.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">
                        {selectedMonster.size} {selectedMonster.type}
                      </p>
                    </div>

                    {/* Spell Save DC Summary */}
                    {(selectedMonster as any).spell_save_dc_summary && (selectedMonster as any).spell_save_dc_summary.length > 0 && (
                      <div className="bg-primary/10 rounded-lg p-2 border border-primary/20">
                        <p className="text-xs font-semibold text-primary">
                          Spell Save DC{(selectedMonster as any).spell_save_dc_summary.length > 1 ? 's' : ''}:{' '}
                          {(selectedMonster as any).spell_save_dc_summary.map((dc: any, idx: number) => (
                            <span key={idx}>
                              {idx > 0 && ', '}
                              <span className="font-bold">{dc.dc}</span>
                              {dc.ability && dc.ability !== 'Unknown' && (
                                <span className="text-muted-foreground text-xs"> ({dc.ability})</span>
                              )}
                            </span>
                          ))}
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Armor Class</span>
                        <span className="font-semibold">{selectedMonster.ac}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Hit Points</span>
                        <span className="font-semibold">{selectedMonster.hp_avg}</span>
                      </div>
                      {selectedMonster.cr !== null && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Challenge Rating</span>
                          <span className="font-semibold">CR {selectedMonster.cr}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs border rounded-lg p-2">
                      <div>
                        <div className="text-muted-foreground font-medium">STR</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.str}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.str) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.str)})
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">DEX</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.dex}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.dex) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.dex)})
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">CON</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.con}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.con) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.con)})
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">INT</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.int}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.int) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.int)})
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">WIS</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.wis}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.wis) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.wis)})
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground font-medium">CHA</div>
                        <div className="font-bold text-base">
                          {selectedMonster.abilities.cha}
                          <div className="text-xs text-muted-foreground">
                            ({calculateModifier(selectedMonster.abilities.cha) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.cha)})
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Preview */}
                    {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Actions ({selectedMonster.actions.length})</h4>
                        <div className="space-y-1 text-xs">
                          {selectedMonster.actions.slice(0, 3).map((action: any, idx: number) => (
                            <div key={idx} className="p-2 border rounded">
                              <span className="font-semibold">{action.name}</span>
                            </div>
                          ))}
                          {selectedMonster.actions.length > 3 && (
                            <p className="text-muted-foreground text-center pt-1">
                              +{selectedMonster.actions.length - 3} more actions...
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Traits Preview */}
                    {selectedMonster.traits && selectedMonster.traits.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Special Traits ({selectedMonster.traits.length})</h4>
                        <div className="space-y-1 text-xs">
                          {selectedMonster.traits.slice(0, 2).map((trait: any, idx: number) => (
                            <div key={idx} className="p-2 border rounded">
                              <span className="font-semibold">{trait.name}</span>
                            </div>
                          ))}
                          {selectedMonster.traits.length > 2 && (
                            <p className="text-muted-foreground text-center pt-1">
                              +{selectedMonster.traits.length - 2} more traits...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="space-y-3 pt-4 mt-4 border-t border-border">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      max="20"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
                    />
                  </div>

                  <Button 
                    onClick={handleAddMonster} 
                    className="w-full"
                    disabled={adding}
                  >
                    {adding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      `Add ${quantity}× ${selectedMonster.name}`
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Select a monster to view details
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MonsterLibraryDialog;
