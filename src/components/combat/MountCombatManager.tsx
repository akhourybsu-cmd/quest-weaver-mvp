import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Mountain, ArrowDown, ArrowUp } from "lucide-react";

interface MountOption {
  id: string;
  name: string;
  type: 'character' | 'monster';
  size: string;
}

interface MountCombatManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  encounterId: string;
  riderId: string;
  riderType: 'character' | 'monster';
  riderName: string;
  riderSize: string;
  currentRound: number;
  availableMounts: MountOption[];
}

export function MountCombatManager({
  open,
  onOpenChange,
  encounterId,
  riderId,
  riderType,
  riderName,
  riderSize,
  currentRound,
  availableMounts,
}: MountCombatManagerProps) {
  const [selectedMount, setSelectedMount] = useState<string>("");
  const [isControlled, setIsControlled] = useState(true);
  const [currentMount, setCurrentMount] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCurrentMount();
  }, [encounterId, riderId]);

  const loadCurrentMount = async () => {
    const query = supabase
      .from('mount_rider_pairs')
      .select('*')
      .eq('encounter_id', encounterId);

    if (riderType === 'character') {
      query.eq('rider_character_id', riderId);
    } else {
      query.eq('rider_monster_id', riderId);
    }

    const { data, error } = await query.maybeSingle();

    if (!error && data) {
      setCurrentMount(data);
    }
  };

  const canMount = (mountSize: string) => {
    const sizes = ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'];
    const riderSizeIndex = sizes.indexOf(riderSize);
    const mountSizeIndex = sizes.indexOf(mountSize);
    
    // Mount must be at least one size larger than rider
    return mountSizeIndex > riderSizeIndex;
  };

  const handleMount = async () => {
    if (!selectedMount) {
      toast.error("Please select a mount");
      return;
    }

    const mount = availableMounts.find(m => m.id === selectedMount);
    if (!mount) return;

    if (!canMount(mount.size)) {
      toast.error(`${mount.name} is too small to be a mount for ${riderName}. Mounts must be at least one size category larger than the rider.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const insertData: any = {
        encounter_id: encounterId,
        is_controlled: isControlled,
        mounted_at_round: currentRound,
      };

      if (riderType === 'character') {
        insertData.rider_character_id = riderId;
      } else {
        insertData.rider_monster_id = riderId;
      }

      if (mount.type === 'character') {
        insertData.mount_character_id = mount.id;
      } else {
        insertData.mount_monster_id = mount.id;
      }

      const { error } = await supabase
        .from('mount_rider_pairs')
        .insert(insertData);

      if (error) throw error;

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: currentRound,
        action_type: 'mount',
        message: `${riderName} mounts ${mount.name}`,
        details: {
          mount_name: mount.name,
          controlled: isControlled,
        },
      });

      toast.success(`${riderName} mounted ${mount.name}! (Used half movement)`);
      loadCurrentMount();
      onOpenChange(false);
    } catch (error) {
      console.error("Error mounting:", error);
      toast.error("Failed to mount");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDismount = async () => {
    if (!currentMount) return;

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('mount_rider_pairs')
        .delete()
        .eq('id', currentMount.id);

      if (error) throw error;

      // Log to combat log
      await supabase.from('combat_log').insert({
        encounter_id: encounterId,
        round: currentRound,
        action_type: 'dismount',
        message: `${riderName} dismounts`,
        details: {
          mount_id: currentMount.mount_character_id || currentMount.mount_monster_id,
        },
      });

      toast.success(`${riderName} dismounted! (Used half movement)`);
      setCurrentMount(null);
      onOpenChange(false);
    } catch (error) {
      console.error("Error dismounting:", error);
      toast.error("Failed to dismount");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mountain className="w-5 h-5" />
            Mount Management - {riderName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {currentMount ? (
            <div className="space-y-4">
              <Badge variant="outline" className="text-base px-3 py-1">
                Currently Mounted
              </Badge>

              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  You are mounted. Dismounting costs half your movement.
                </p>
                <p className="text-xs text-muted-foreground">
                  • You can't use your movement while mounted (mount uses its movement)
                  <br />
                  • You have advantage on melee attacks against unmounted smaller creatures
                  <br />
                  • If mount is knocked prone, you fall and take 1d6 damage (DC 10 DEX save to avoid)
                </p>
              </div>

              <Button
                onClick={handleDismount}
                disabled={isSubmitting}
                className="w-full"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Dismount (Half Movement)
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Mounting costs half your movement. The mount must be at least one size category larger than you.
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>Your size:</strong> {riderSize}
                </p>
              </div>

              <div>
                <Label>Select Mount</Label>
                <Select value={selectedMount} onValueChange={setSelectedMount}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a creature to mount..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMounts.map(mount => {
                      const canMountThis = canMount(mount.size);
                      return (
                        <SelectItem
                          key={mount.id}
                          value={mount.id}
                          disabled={!canMountThis}
                        >
                          {mount.name} ({mount.size}) {!canMountThis && '❌ Too small'}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="controlled">Controlled Mount</Label>
                <Switch
                  id="controlled"
                  checked={isControlled}
                  onCheckedChange={setIsControlled}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                {isControlled 
                  ? "Controlled: Mount moves on your turn, can only Dash/Disengage/Dodge"
                  : "Independent: Mount acts on its own initiative with full actions"
                }
              </p>

              <Button
                onClick={handleMount}
                disabled={isSubmitting || !selectedMount}
                className="w-full"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Mount (Half Movement)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
