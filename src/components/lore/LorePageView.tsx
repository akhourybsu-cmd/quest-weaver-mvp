import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, X, ExternalLink, MapPin, Users, User, Scroll, Package } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { LoreHeroHeader, LoreOrnamentDivider, RuneTag } from "./ui";

interface LorePageViewProps {
  page: any;
  campaignId: string;
  onEdit?: () => void;
  onClose: () => void;
}

interface Backlink {
  id: string;
  from_type: string;
  from_id: string;
  label: string;
}

interface LinkedAsset {
  id: string;
  name: string;
  type: 'faction' | 'npc' | 'location' | 'quest' | 'item';
}

export default function LorePageView({ page, campaignId, onEdit, onClose }: LorePageViewProps) {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [linkedAssets, setLinkedAssets] = useState<LinkedAsset[]>([]);

  useEffect(() => {
    loadBacklinks();
    loadLinks();
    loadLinkedAssets();
  }, [page.id]);

  const loadBacklinks = async () => {
    try {
      const { data, error } = await supabase
        .from("lore_backlinks")
        .select("*")
        .eq("page_id", page.id);

      if (error) throw error;
      setBacklinks(data || []);
    } catch (error) {
      console.error("Error loading backlinks:", error);
    }
  };

  const loadLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("lore_links")
        .select("*")
        .eq("source_page", page.id);

      if (error) throw error;
      setLinks(data || []);
    } catch (error) {
      console.error("Error loading links:", error);
    }
  };

  // Load assets that link TO this lore page (reverse lookup)
  const loadLinkedAssets = async () => {
    const assets: LinkedAsset[] = [];
    
    try {
      // Check factions
      const { data: factions } = await supabase
        .from("factions")
        .select("id, name")
        .eq("lore_page_id", page.id);
      
      if (factions) {
        factions.forEach(f => assets.push({ id: f.id, name: f.name, type: 'faction' }));
      }
      
      // Check NPCs
      const { data: npcs } = await supabase
        .from("npcs")
        .select("id, name")
        .eq("lore_page_id", page.id);
      
      if (npcs) {
        npcs.forEach(n => assets.push({ id: n.id, name: n.name, type: 'npc' }));
      }
      
      // Check Locations
      const { data: locations } = await supabase
        .from("locations")
        .select("id, name")
        .eq("lore_page_id", page.id);
      
      if (locations) {
        locations.forEach(l => assets.push({ id: l.id, name: l.name, type: 'location' }));
      }
      
      // Check Quests
      const { data: quests } = await supabase
        .from("quests")
        .select("id, title")
        .eq("lore_page_id", page.id);
      
      if (quests) {
        quests.forEach(q => assets.push({ id: q.id, name: q.title, type: 'quest' }));
      }
      
      // Check Items
      const { data: items } = await supabase
        .from("items")
        .select("id, name")
        .eq("lore_page_id", page.id);
      
      if (items) {
        items.forEach(i => assets.push({ id: i.id, name: i.name, type: 'item' }));
      }
      
      setLinkedAssets(assets);
    } catch (error) {
      console.error("Error loading linked assets:", error);
    }
  };

  const getAssetIcon = (type: LinkedAsset['type']) => {
    switch (type) {
      case 'faction': return <Users className="h-3 w-3" />;
      case 'npc': return <User className="h-3 w-3" />;
      case 'location': return <MapPin className="h-3 w-3" />;
      case 'quest': return <Scroll className="h-3 w-3" />;
      case 'item': return <Package className="h-3 w-3" />;
    }
  };

  const groupedLinks = links.reduce((acc, link) => {
    if (!acc[link.target_type]) {
      acc[link.target_type] = [];
    }
    acc[link.target_type].push(link);
    return acc;
  }, {} as Record<string, any[]>);

  const categoryAccentClass: Record<string, string> = {
    regions: "lore-accent-regions",
    factions: "lore-accent-factions",
    npcs: "lore-accent-npcs",
    history: "lore-accent-history",
    religion: "lore-accent-religion",
    magic: "lore-accent-magic",
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with close/edit buttons */}
      <div className="p-4 flex justify-end gap-2 border-b border-brass/20">
        {onEdit && (
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className={`p-6 space-y-6 ${categoryAccentClass[page.category] || ''}`}>
          {/* Banner Image */}
          {(page.details?.image_url || page.image_url) && (
            <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-brass/20">
              <img 
                src={page.details?.image_url || page.image_url} 
                alt={page.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
            </div>
          )}

          {/* Hero Header */}
          <LoreHeroHeader
            title={page.title}
            category={page.category}
            visibility={page.visibility}
            era={page.era}
            slug={page.slug}
          >
            {/* Date for History entries */}
            {page.details?.date && (
              <div className="text-sm text-amber-600/80 mt-1">
                {page.details.date}
              </div>
            )}
            {page.tags && page.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {page.tags.map((tag: string, idx: number) => (
                  <RuneTag key={idx}>{tag}</RuneTag>
                ))}
              </div>
            )}
          </LoreHeroHeader>

          <LoreOrnamentDivider />

          {/* Main Content */}
          <div className="fantasy-chronicle p-6">
            <div className="prose prose-sm dark:prose-invert max-w-none fantasy-drop-cap">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {page.content_md || "*No content available*"}
              </ReactMarkdown>
            </div>
          </div>

          {/* Linked Entities */}
          {Object.keys(groupedLinks).length > 0 && (
            <>
              <LoreOrnamentDivider />
              <div className="space-y-4">
                <h3 className="lore-section-title">Linked Entities</h3>
                {Object.entries(groupedLinks).map(([type, items]) => (
                  <Card key={type} className="fantasy-section">
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-medium">{type.replace('_', ' ')}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-2">
                        {(items as any[]).map((item: any) => (
                          <RuneTag key={item.id} variant="outline">
                            {item.label}
                            {item.target_id && <ExternalLink className="h-3 w-3 ml-1" />}
                          </RuneTag>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {/* Linked Assets (Reverse Lookup) */}
          {linkedAssets.length > 0 && (
            <>
              <LoreOrnamentDivider />
              <div className="space-y-4">
                <h3 className="lore-section-title">Linked From</h3>
                <Card className="fantasy-section">
                  <CardHeader className="py-3">
                    <CardDescription>
                      {linkedAssets.length} campaign {linkedAssets.length === 1 ? 'asset links' : 'assets link'} to this lore entry
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {linkedAssets.map((asset) => (
                        <RuneTag key={`${asset.type}-${asset.id}`} variant="accent">
                          {getAssetIcon(asset.type)}
                          <span className="ml-1 capitalize">{asset.type}:</span>
                          <span className="ml-1">{asset.name}</span>
                        </RuneTag>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* Backlinks */}
          {backlinks.length > 0 && (
            <>
              <LoreOrnamentDivider />
              <div className="space-y-4">
                <h3 className="lore-section-title">Referenced By</h3>
                <Card className="fantasy-section">
                  <CardHeader className="py-3">
                    <CardDescription>
                      {backlinks.length} {backlinks.length === 1 ? 'reference' : 'references'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {backlinks.map((link) => (
                        <div key={link.id} className="flex items-center gap-2">
                          <RuneTag variant="accent">{link.from_type}</RuneTag>
                          <span className="text-sm">{link.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
