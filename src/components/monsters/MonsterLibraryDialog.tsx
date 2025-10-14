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
      .select("id, name, type, size, cr, ac, hp_avg, abilities")
      .order("name");

    const { data: homebrew } = await supabase
      .from("monster_homebrew")
      .select("id, name, type, size, cr, ac, hp_avg, abilities")
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h4 className="font-semibold">{monster.name}</h4>
            <p className="text-sm text-muted-foreground capitalize">
              {monster.size} {monster.type}
            </p>
          </div>
          {monster.cr !== null && (
            <Badge variant="outline">CR {monster.cr}</Badge>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          <span>AC {monster.ac}</span>
          <span>HP {monster.hp_avg}</span>
          <span>DEX {calculateModifier(monster.abilities.dex) >= 0 ? '+' : ''}{calculateModifier(monster.abilities.dex)}</span>
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
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Monster Library</DialogTitle>
            <MonsterImportDialog />
          </div>
        </DialogHeader>

        <div className="flex gap-4 h-[600px]">
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
          <div className="w-80 border-l border-border pl-4 flex flex-col">
            {selectedMonster ? (
              <>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1">{selectedMonster.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">
                      {selectedMonster.size} {selectedMonster.type}
                    </p>
                  </div>

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
                        <span className="text-muted-foreground">Challenge</span>
                        <span className="font-semibold">CR {selectedMonster.cr}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-sm">
                    <div>
                      <div className="text-muted-foreground">STR</div>
                      <div className="font-semibold">
                        {selectedMonster.abilities.str} ({calculateModifier(selectedMonster.abilities.str) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.str)})
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">DEX</div>
                      <div className="font-semibold">
                        {selectedMonster.abilities.dex} ({calculateModifier(selectedMonster.abilities.dex) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.dex)})
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CON</div>
                      <div className="font-semibold">
                        {selectedMonster.abilities.con} ({calculateModifier(selectedMonster.abilities.con) >= 0 ? '+' : ''}{calculateModifier(selectedMonster.abilities.con)})
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
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
