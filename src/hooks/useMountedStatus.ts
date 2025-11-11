import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface MountedStatus {
  isMounted: boolean;
  isMount: boolean;
  mountPairId: string | null;
  mountName: string | null;
  riderName: string | null;
  isControlled: boolean;
}

export function useMountedStatus(
  encounterId: string,
  actorId: string,
  actorType: 'character' | 'monster'
): MountedStatus {
  const [status, setStatus] = useState<MountedStatus>({
    isMounted: false,
    isMount: false,
    mountPairId: null,
    mountName: null,
    riderName: null,
    isControlled: false,
  });

  useEffect(() => {
    loadStatus();

    const channel = supabase
      .channel(`mount_status_${encounterId}_${actorId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mount_rider_pairs',
          filter: `encounter_id=eq.${encounterId}`,
        },
        () => loadStatus()
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [encounterId, actorId, actorType]);

  const loadStatus = async () => {
    // Check if this actor is a rider
    const riderQuery = supabase
      .from('mount_rider_pairs')
      .select('*')
      .eq('encounter_id', encounterId);

    if (actorType === 'character') {
      riderQuery.eq('rider_character_id', actorId);
    } else {
      riderQuery.eq('rider_monster_id', actorId);
    }

    const { data: riderData } = await riderQuery.maybeSingle();

    // Check if this actor is a mount
    const mountQuery = supabase
      .from('mount_rider_pairs')
      .select('*')
      .eq('encounter_id', encounterId);

    if (actorType === 'character') {
      mountQuery.eq('mount_character_id', actorId);
    } else {
      mountQuery.eq('mount_monster_id', actorId);
    }

    const { data: mountData } = await mountQuery.maybeSingle();

    if (riderData) {
      // This actor is riding something
      let mountName = "Unknown";
      
      if (riderData.mount_character_id) {
        const { data: char } = await supabase
          .from('characters')
          .select('name')
          .eq('id', riderData.mount_character_id)
          .single();
        if (char) mountName = char.name;
      } else if (riderData.mount_monster_id) {
        const { data: monster } = await supabase
          .from('encounter_monsters')
          .select('name')
          .eq('id', riderData.mount_monster_id)
          .single();
        if (monster) mountName = monster.name;
      }

      setStatus({
        isMounted: true,
        isMount: false,
        mountPairId: riderData.id,
        mountName,
        riderName: null,
        isControlled: riderData.is_controlled,
      });
    } else if (mountData) {
      // This actor is being ridden
      let riderName = "Unknown";
      
      if (mountData.rider_character_id) {
        const { data: char } = await supabase
          .from('characters')
          .select('name')
          .eq('id', mountData.rider_character_id)
          .single();
        if (char) riderName = char.name;
      } else if (mountData.rider_monster_id) {
        const { data: monster } = await supabase
          .from('encounter_monsters')
          .select('name')
          .eq('id', mountData.rider_monster_id)
          .single();
        if (monster) riderName = monster.name;
      }

      setStatus({
        isMounted: false,
        isMount: true,
        mountPairId: mountData.id,
        mountName: null,
        riderName,
        isControlled: mountData.is_controlled,
      });
    } else {
      setStatus({
        isMounted: false,
        isMount: false,
        mountPairId: null,
        mountName: null,
        riderName: null,
        isControlled: false,
      });
    }
  };

  return status;
}
