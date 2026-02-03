import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";

export interface MapMarker {
  id: string;
  map_id: string;
  marker_type: string;
  shape: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation: number;
  color: string;
  opacity: number;
  icon?: string;
  label?: string;
  dm_only: boolean;
  metadata: Record<string, any>;
}

export interface AoETemplate {
  id: string;
  map_id: string;
  encounter_id?: string;
  shape: string;
  x: number;
  y: number;
  radius?: number;
  length?: number;
  width?: number;
  rotation: number;
  color: string;
  opacity: number;
  label?: string;
}

export interface FogRegion {
  id: string;
  map_id: string;
  is_revealed: boolean;
  polygon_points: { x: number; y: number }[];
}

export interface Token {
  id: string;
  map_id: string;
  name: string;
  x: number;
  y: number;
  size: number;
  color: string;
  is_visible: boolean;
  character_id?: string;
  image_url?: string;
}

interface UseMapOverlaysOptions {
  mapId: string;
  isDM: boolean;
  encounterId?: string;
}

export function useMapOverlays({ mapId, isDM, encounterId }: UseMapOverlaysOptions) {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [aoeTemplates, setAoETemplates] = useState<AoETemplate[]>([]);
  const [fogRegions, setFogRegions] = useState<FogRegion[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all overlays
  const loadOverlays = useCallback(async () => {
    if (!mapId) return;

    const [markersRes, aoeRes, fogRes, tokensRes] = await Promise.all([
      supabase
        .from("map_markers")
        .select("*")
        .eq("map_id", mapId),
      supabase
        .from("aoe_templates")
        .select("*")
        .eq("map_id", mapId),
      supabase
        .from("fog_regions")
        .select("*")
        .eq("map_id", mapId),
      supabase
        .from("tokens")
        .select("*")
        .eq("map_id", mapId),
    ]);

    if (markersRes.data) {
      const filteredMarkers = isDM 
        ? markersRes.data 
        : markersRes.data.filter((m: any) => !m.dm_only);
      setMarkers(filteredMarkers as MapMarker[]);
    }

    if (aoeRes.data) {
      setAoETemplates(aoeRes.data as AoETemplate[]);
    }

    if (fogRes.data) {
      const filteredFog = isDM 
        ? fogRes.data 
        : fogRes.data.filter((f: any) => f.is_revealed);
      setFogRegions(
        filteredFog.map((f: any) => ({
          ...f,
          polygon_points: f.polygon_points || [],
        }))
      );
    }

    if (tokensRes.data) {
      const filteredTokens = isDM
        ? tokensRes.data
        : tokensRes.data.filter((t: any) => t.is_visible);
      setTokens(filteredTokens as Token[]);
    }

    setLoading(false);
  }, [mapId, isDM]);

  // Initial load
  useEffect(() => {
    loadOverlays();
  }, [loadOverlays]);

  // Real-time subscriptions
  useEffect(() => {
    if (!mapId) return;

    const markersChannel = resilientChannel(supabase, `map-markers:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "map_markers",
          filter: `map_id=eq.${mapId}`,
        },
        () => loadOverlays()
      )
      .subscribe();

    const aoeChannel = resilientChannel(supabase, `aoe-templates:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "aoe_templates",
          filter: `map_id=eq.${mapId}`,
        },
        () => loadOverlays()
      )
      .subscribe();

    const fogChannel = resilientChannel(supabase, `fog-regions:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "fog_regions",
          filter: `map_id=eq.${mapId}`,
        },
        () => loadOverlays()
      )
      .subscribe();

    const tokensChannel = resilientChannel(supabase, `tokens:${mapId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tokens",
          filter: `map_id=eq.${mapId}`,
        },
        () => loadOverlays()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(markersChannel);
      supabase.removeChannel(aoeChannel);
      supabase.removeChannel(fogChannel);
      supabase.removeChannel(tokensChannel);
    };
  }, [mapId, loadOverlays]);

  // CRUD operations for markers
  const addMarker = async (marker: Omit<MapMarker, "id">) => {
    const { error } = await supabase.from("map_markers").insert(marker);
    return !error;
  };

  const updateMarker = async (id: string, updates: Partial<MapMarker>) => {
    const { error } = await supabase
      .from("map_markers")
      .update(updates)
      .eq("id", id);
    return !error;
  };

  const deleteMarker = async (id: string) => {
    const { error } = await supabase.from("map_markers").delete().eq("id", id);
    return !error;
  };

  // CRUD operations for AoE templates
  const addAoE = async (template: Omit<AoETemplate, "id">) => {
    const { error } = await supabase.from("aoe_templates").insert(template);
    return !error;
  };

  const updateAoE = async (id: string, updates: Partial<AoETemplate>) => {
    const { error } = await supabase
      .from("aoe_templates")
      .update(updates)
      .eq("id", id);
    return !error;
  };

  const deleteAoE = async (id: string) => {
    const { error } = await supabase.from("aoe_templates").delete().eq("id", id);
    return !error;
  };

  // Token operations
  const updateToken = async (id: string, updates: Partial<Token>) => {
    const { error } = await supabase
      .from("tokens")
      .update(updates)
      .eq("id", id);
    return !error;
  };

  const deleteToken = async (id: string) => {
    const { error } = await supabase.from("tokens").delete().eq("id", id);
    return !error;
  };

  return {
    markers,
    aoeTemplates,
    fogRegions,
    tokens,
    loading,
    refresh: loadOverlays,
    addMarker,
    updateMarker,
    deleteMarker,
    addAoE,
    updateAoE,
    deleteAoE,
    updateToken,
    deleteToken,
  };
}
