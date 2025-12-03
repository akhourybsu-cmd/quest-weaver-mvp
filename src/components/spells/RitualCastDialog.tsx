import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { BookMarked, Clock, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Spell {
  id: string;
  name: string;
  level: number;
  school: string;
  casting_time: string;
  range: string;
  duration: string;
  description: string;
}

interface RitualCastDialogProps {
  characterId: string;
  characterName: string;
  characterClass: string;
  canCastRituals: boolean;
  onCast?: (spell: Spell) => void;
  trigger?: React.ReactNode;
}

// Classes that can ritual cast from spellbook without preparation
const RITUAL_BOOK_CASTERS = ['Wizard'];

// Classes that must have ritual spells prepared to cast them as rituals
const RITUAL_PREPARED_CASTERS = ['Cleric', 'Druid', 'Bard'];

export const RitualCastDialog: React.FC<RitualCastDialogProps> = ({
  characterId,
  characterName,
  characterClass,
  canCastRituals,
  onCast,
  trigger,
}) => {
  const [open, setOpen] = useState(false);
  const [ritualSpells, setRitualSpells] = useState<Spell[]>([]);
  const [loading, setLoading] = useState(false);
  const [castingSpell, setCastingSpell] = useState<Spell | null>(null);

  const isBookCaster = RITUAL_BOOK_CASTERS.includes(characterClass);
  const isPreparedCaster = RITUAL_PREPARED_CASTERS.includes(characterClass);

  const loadRitualSpells = useCallback(async () => {
    setLoading(true);
    try {
      // Query depends on class type
      let query = supabase
        .from('character_spells')
        .select(`
          id,
          prepared,
          srd_spells!inner(
            id,
            name,
            level,
            school,
            casting_time,
            range,
            duration,
            description,
            ritual
          )
        `)
        .eq('character_id', characterId)
        .eq('srd_spells.ritual', true);

      // Prepared casters must have spells prepared
      if (isPreparedCaster) {
        query = query.eq('prepared', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      const spells = (data || []).map((item: any) => ({
        id: item.srd_spells.id,
        name: item.srd_spells.name,
        level: item.srd_spells.level,
        school: item.srd_spells.school,
        casting_time: item.srd_spells.casting_time,
        range: item.srd_spells.range,
        duration: item.srd_spells.duration,
        description: item.srd_spells.description,
      }));

      setRitualSpells(spells);
    } catch (error) {
      console.error('Error loading ritual spells:', error);
      toast.error('Failed to load ritual spells');
    } finally {
      setLoading(false);
    }
  }, [characterId, isPreparedCaster]);

  useEffect(() => {
    if (open) {
      loadRitualSpells();
    }
  }, [open, loadRitualSpells]);

  const handleCastRitual = useCallback((spell: Spell) => {
    setCastingSpell(spell);
    toast.success(
      `${characterName} begins casting ${spell.name} as a ritual (10 minutes)`,
      { duration: 5000 }
    );
    onCast?.(spell);
    
    // Auto-close after brief delay
    setTimeout(() => {
      setCastingSpell(null);
      setOpen(false);
    }, 1500);
  }, [characterName, onCast]);

  if (!canCastRituals) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <BookMarked className="h-4 w-4 mr-2" />
            Ritual Cast
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-primary" />
            Ritual Casting
          </DialogTitle>
          <DialogDescription>
            Cast a spell as a ritual without expending a spell slot. Takes 10 minutes longer than normal.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info Box */}
          <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>Ritual casting adds 10 minutes to casting time</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-muted-foreground" />
              <span>Does not consume a spell slot</span>
            </div>
            {isBookCaster && (
              <p className="text-xs text-muted-foreground mt-2">
                As a {characterClass}, you can ritual cast any ritual spell in your spellbook.
              </p>
            )}
            {isPreparedCaster && (
              <p className="text-xs text-muted-foreground mt-2">
                As a {characterClass}, you can only ritual cast spells you have prepared.
              </p>
            )}
          </div>

          {/* Spell List */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading ritual spells...</p>
            </div>
          ) : ritualSpells.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookMarked className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No ritual spells available</p>
              {isPreparedCaster && (
                <p className="text-xs mt-1">Prepare a ritual spell to cast it here</p>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {ritualSpells.map((spell) => (
                  <Card 
                    key={spell.id} 
                    className={`cursor-pointer transition-colors hover:border-primary ${
                      castingSpell?.id === spell.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleCastRitual(spell)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{spell.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {spell.school}
                            </Badge>
                          </div>
                          <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                            <span>{spell.casting_time} + 10 min</span>
                            <span>•</span>
                            <span>{spell.range}</span>
                            <span>•</span>
                            <span>{spell.duration}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {spell.description}
                          </p>
                        </div>
                        <Button size="sm" variant="ghost" className="shrink-0">
                          <BookMarked className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
