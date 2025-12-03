import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Target, Minus, Plus, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AmmunitionItem {
  id: string;
  item_ref: string;
  qty: number;
  data: {
    name?: string;
    ammo_type?: string;
    max_qty?: number;
  } | null;
}

interface AmmunitionTrackerProps {
  characterId: string;
  onAmmoUsed?: (ammoType: string, remaining: number) => void;
}

const AMMO_TYPES = ['arrow', 'bolt', 'bullet', 'dart', 'needle', 'sling bullet'];

export function AmmunitionTracker({ characterId, onAmmoUsed }: AmmunitionTrackerProps) {
  const { toast } = useToast();
  const [ammunition, setAmmunition] = useState<AmmunitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAmmunition();
  }, [characterId]);

  const fetchAmmunition = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('character_equipment')
      .select('id, item_ref, qty, data')
      .eq('character_id', characterId);

    if (error) {
      console.error('Error fetching ammunition:', error);
      setLoading(false);
      return;
    }

    // Filter for ammunition items
    const ammoItems = (data || []).filter(item => {
      const name = (item.data as any)?.name?.toLowerCase() || item.item_ref.toLowerCase();
      const type = (item.data as any)?.ammo_type?.toLowerCase() || '';
      return AMMO_TYPES.some(ammo => name.includes(ammo) || type.includes(ammo));
    }) as AmmunitionItem[];

    setAmmunition(ammoItems);
    setLoading(false);
  };

  const updateQuantity = async (item: AmmunitionItem, delta: number) => {
    const newQty = Math.max(0, (item.qty || 0) + delta);
    
    const { error } = await supabase
      .from('character_equipment')
      .update({ qty: newQty })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update ammunition",
        variant: "destructive",
      });
      return;
    }

    // Update local state
    setAmmunition(prev => 
      prev.map(a => a.id === item.id ? { ...a, qty: newQty } : a)
    );

    // Callback for combat integration
    if (delta < 0 && onAmmoUsed) {
      const ammoName = item.data?.name || item.item_ref;
      onAmmoUsed(ammoName, newQty);
    }

    if (newQty === 0) {
      toast({
        title: "Out of Ammunition",
        description: `You're out of ${item.data?.name || item.item_ref}!`,
        variant: "destructive",
      });
    }
  };

  const setQuantity = async (item: AmmunitionItem, qty: number) => {
    const newQty = Math.max(0, qty);
    
    const { error } = await supabase
      .from('character_equipment')
      .update({ qty: newQty })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update ammunition",
        variant: "destructive",
      });
      return;
    }

    setAmmunition(prev => 
      prev.map(a => a.id === item.id ? { ...a, qty: newQty } : a)
    );
  };

  const recoverAmmunition = async (item: AmmunitionItem) => {
    // D&D 5E rule: recover half spent ammunition after combat
    const maxQty = item.data?.max_qty || 20;
    const spent = maxQty - (item.qty || 0);
    const recovered = Math.floor(spent / 2);
    const newQty = Math.min(maxQty, (item.qty || 0) + recovered);

    if (recovered <= 0) {
      toast({
        title: "No Recovery",
        description: "No ammunition to recover",
      });
      return;
    }

    const { error } = await supabase
      .from('character_equipment')
      .update({ qty: newQty })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to recover ammunition",
        variant: "destructive",
      });
      return;
    }

    setAmmunition(prev => 
      prev.map(a => a.id === item.id ? { ...a, qty: newQty } : a)
    );

    toast({
      title: "Ammunition Recovered",
      description: `Recovered ${recovered} ${item.data?.name || item.item_ref}`,
    });
  };

  const getAmmoIcon = (item: AmmunitionItem) => {
    const name = (item.data?.name || item.item_ref).toLowerCase();
    if (name.includes('arrow')) return '🏹';
    if (name.includes('bolt')) return '⚡';
    if (name.includes('bullet')) return '🔫';
    if (name.includes('dart')) return '🎯';
    return '➡️';
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">Loading ammunition...</div>;
  }

  if (ammunition.length === 0) {
    return null;
  }

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Ammunition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {ammunition.map((item) => (
          <div key={item.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span>{getAmmoIcon(item)}</span>
                <span className="text-sm font-medium">{item.data?.name || item.item_ref}</span>
              </div>
              <Badge variant={item.qty > 10 ? "secondary" : item.qty > 0 ? "outline" : "destructive"}>
                {item.qty || 0}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updateQuantity(item, -1)}
                disabled={item.qty <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <Input
                type="number"
                value={item.qty || 0}
                onChange={(e) => setQuantity(item, parseInt(e.target.value) || 0)}
                className="h-7 w-16 text-center text-sm"
                min={0}
              />
              
              <Button
                variant="outline"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => updateQuantity(item, 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-auto"
                onClick={() => recoverAmmunition(item)}
                title="Recover half spent ammunition"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Recover
              </Button>
            </div>
          </div>
        ))}
        
        <p className="text-xs text-muted-foreground">
          Tip: After combat, recover half your spent ammunition
        </p>
      </CardContent>
    </Card>
  );
}

// Hook for easy ammunition usage in combat
export function useAmmunition(characterId: string) {
  const expendAmmo = async (ammoType: string) => {
    const { data, error } = await supabase
      .from('character_equipment')
      .select('id, item_ref, qty, data')
      .eq('character_id', characterId);

    if (error || !data) return { success: false, remaining: 0 };

    const ammoItem = data.find(item => {
      const name = ((item.data as any)?.name || item.item_ref).toLowerCase();
      return name.includes(ammoType.toLowerCase());
    });

    if (!ammoItem || (ammoItem.qty || 0) <= 0) {
      return { success: false, remaining: 0, outOfAmmo: true };
    }

    const newQty = (ammoItem.qty || 0) - 1;
    await supabase
      .from('character_equipment')
      .update({ qty: newQty })
      .eq('id', ammoItem.id);

    return { success: true, remaining: newQty };
  };

  return { expendAmmo };
}
