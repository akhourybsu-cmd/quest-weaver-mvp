import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookMarked, Plus, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface SpellbookManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  characterLevel: number;
  characterClass?: string;
}

export const SpellbookManager = ({
  open,
  onOpenChange,
  characterId,
  characterLevel,
  characterClass = "Wizard"
}: SpellbookManagerProps) => {
  const [spellbook, setSpellbook] = useState<any[]>([]);
  const [availableSpells, setAvailableSpells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddSpell, setShowAddSpell] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [spellToRemove, setSpellToRemove] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      loadSpellbook();
      loadAvailableSpells();
    }
  }, [open, characterId, characterClass]);

  const loadSpellbook = async () => {
    try {
      const { data, error } = await supabase
        .from("spellbook_entries")
        .select(`
          *,
          srd_spells(*)
        `)
        .eq("character_id", characterId)
        .order("learned_at_level");

      if (error) throw error;
      setSpellbook(data || []);
    } catch (error) {
      console.error("Error loading spellbook:", error);
      toast.error("Failed to load spellbook");
    }
  };

  const loadAvailableSpells = async () => {
    setLoading(true);
    try {
      // First try to get spells by class using the classes array
      const { data, error } = await supabase
        .from("srd_spells")
        .select("*")
        .contains("classes", [characterClass])
        .order("level")
        .order("name");

      if (error) throw error;
      
      // If no spells found with class filter, fall back to all spells
      if (!data || data.length === 0) {
        console.warn(`No spells found for class ${characterClass}, loading all spells`);
        const { data: allSpells, error: allError } = await supabase
          .from("srd_spells")
          .select("*")
          .order("level")
          .order("name");
        
        if (allError) throw allError;
        setAvailableSpells(allSpells || []);
      } else {
        setAvailableSpells(data);
      }
    } catch (error) {
      console.error("Error loading available spells:", error);
      toast.error("Failed to load available spells");
    } finally {
      setLoading(false);
    }
  };

  const addSpellToSpellbook = async (spellId: string, spellLevel: number) => {
    try {
      // Calculate cost (50gp × spell level)
      const cost = spellLevel * 50;

      const { error } = await supabase
        .from("spellbook_entries")
        .insert({
          character_id: characterId,
          spell_id: spellId,
          learned_at_level: characterLevel,
          cost_paid: cost
        });

      if (error) throw error;

      // Also add to character_spells as known
      const { error: spellError } = await supabase
        .from("character_spells")
        .insert({
          character_id: characterId,
          spell_id: spellId,
          known: true,
          source: "spellbook"
        });

      if (spellError && spellError.code !== "23505") { // Ignore duplicate errors
        throw spellError;
      }

      toast.success(`Added spell to spellbook (${cost}gp)`);
      loadSpellbook();
      setShowAddSpell(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Error adding spell:", error);
      toast.error("Failed to add spell to spellbook");
    }
  };

  const removeSpellFromSpellbook = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from("spellbook_entries")
        .delete()
        .eq("id", entryId);

      if (error) throw error;

      toast.success("Spell removed from spellbook");
      loadSpellbook();
      setSpellToRemove(null);
    } catch (error) {
      console.error("Error removing spell:", error);
      toast.error("Failed to remove spell");
    }
  };

  const spellbookByLevel = spellbook.reduce((acc: any, entry: any) => {
    const level = entry.srd_spells?.level ?? 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(entry);
    return acc;
  }, {});

  const filteredAvailableSpells = availableSpells.filter(spell =>
    spell.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !spellbook.some(entry => entry.spell_id === spell.id)
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-primary" />
                <DialogTitle>Spellbook</DialogTitle>
                <Badge variant="secondary">{characterClass}</Badge>
              </div>
              <Button size="sm" onClick={() => setShowAddSpell(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Spell
              </Button>
            </div>
            <DialogDescription>
              {spellbook.length} spells in your spellbook
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-4">
              {Object.entries(spellbookByLevel).map(([level, spells]: [string, any]) => (
                <Card key={level}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {level === "0" ? "Cantrips" : `Level ${level}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {spells.map((entry: any) => (
                      <div
                        key={entry.id}
                        className="flex items-start justify-between gap-3 p-3 rounded-lg border"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{entry.srd_spells?.name}</h4>
                            {entry.srd_spells?.ritual && (
                              <Badge variant="outline" className="text-xs">
                                Ritual
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Learned at level {entry.learned_at_level}
                            {entry.cost_paid > 0 && ` • Cost: ${entry.cost_paid}gp`}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSpellToRemove(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}

              {spellbook.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Your spellbook is empty. Add spells to begin!
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddSpell} onOpenChange={setShowAddSpell}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Spell to Spellbook</DialogTitle>
            <DialogDescription>
              {loading ? "Loading spells..." : `${availableSpells.length} ${characterClass} spells available • Copying costs 50gp per spell level`}
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Search spells..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <ScrollArea className="h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-2">
                {filteredAvailableSpells.map(spell => (
                  <div
                    key={spell.id}
                    className="flex items-start justify-between gap-3 p-3 rounded-lg border hover:border-primary transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{spell.name}</h4>
                        <Badge variant="secondary">
                          {spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}
                        </Badge>
                        {spell.ritual && (
                          <Badge variant="outline" className="text-xs">
                            Ritual
                          </Badge>
                        )}
                        {spell.concentration && (
                          <Badge variant="outline" className="text-xs">
                            C
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {spell.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addSpellToSpellbook(spell.id, spell.level)}
                    >
                      Add ({spell.level * 50}gp)
                    </Button>
                  </div>
                ))}

                {filteredAvailableSpells.length === 0 && !loading && (
                  <p className="text-center text-muted-foreground py-8">
                    No spells found. Make sure spell data has been imported in /admin.
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!spellToRemove} onOpenChange={() => setSpellToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Spell?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the spell from your spellbook. You'll need to pay to copy it again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => spellToRemove && removeSpellFromSpellbook(spellToRemove)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};