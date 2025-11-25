import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Plus, Search, Book } from "lucide-react";
import { toast } from "sonner";
import LoreEditor from "@/components/lore/LoreEditor";
import LorePageView from "@/components/lore/LorePageView";
import RegionCreator from "@/components/lore/creators/RegionCreator";
import FactionCreator from "@/components/lore/creators/FactionCreator";
import NPCCreator from "@/components/lore/creators/NPCCreator";
import HistoryCreator from "@/components/lore/creators/HistoryCreator";
import MythCreator from "@/components/lore/creators/MythCreator";
import MagicCreator from "@/components/lore/creators/MagicCreator";

interface LorePage {
  id: string;
  campaign_id: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string | null;
  tags: string[];
  category: string;
  era: string | null;
  visibility: 'DM_ONLY' | 'SHARED' | 'PUBLIC';
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LoreTabProps {
  campaignId: string;
}

export function LoreTab({ campaignId }: LoreTabProps) {
  const [pages, setPages] = useState<LorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("regions");
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<LorePage | null>(null);

  useEffect(() => {
    loadPages();
  }, [campaignId]);

  const loadPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lore_pages")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setPages((data || []) as LorePage[]);
    } catch (error: any) {
      toast.error("Failed to load lore pages: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateByCategory = (category: string) => {
    setActiveCategory(category);
    setCurrentPage(null);
    setEditorOpen(true);
  };

  const handleEditPage = (page: LorePage) => {
    setCurrentPage(page);
    setEditorOpen(true);
  };

  const handleViewPage = (page: LorePage) => {
    setCurrentPage(page);
    setViewerOpen(true);
  };

  const handleSavePage = async () => {
    await loadPages();
    setEditorOpen(false);
  };

  const filteredPages = pages.filter((page) => {
    const matchesCategory = page.category === activeCategory;
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content_md.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => page.tags.includes(tag));
    
    return matchesCategory && matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(pages.flatMap(p => p.tags)));

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "regions": return "Region";
      case "factions": return "Faction";
      case "npcs": return "NPC";
      case "history": return "Event";
      case "religion": return "Deity/Myth";
      case "magic": return "Magic Entry";
      default: return "Entry";
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-arcanePurple" />
          <h2 className="text-xl font-cinzel font-bold text-foreground">World Lore</h2>
        </div>
        <Button 
          onClick={() => handleCreateByCategory(activeCategory)}
          className="bg-arcanePurple hover:bg-arcanePurple/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Lore Entry
        </Button>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 bg-card/50 border border-brass/20">
          <TabsTrigger value="regions" className="data-[state=active]:bg-arcanePurple/20">Regions</TabsTrigger>
          <TabsTrigger value="factions" className="data-[state=active]:bg-arcanePurple/20">Factions</TabsTrigger>
          <TabsTrigger value="npcs" className="data-[state=active]:bg-arcanePurple/20">NPCs</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-arcanePurple/20">History</TabsTrigger>
          <TabsTrigger value="religion" className="data-[state=active]:bg-arcanePurple/20">Myth & Faith</TabsTrigger>
          <TabsTrigger value="magic" className="data-[state=active]:bg-arcanePurple/20">Magic</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search & Tag Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lore titles, tags, or summaries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card/50 border-brass/20"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer hover:bg-arcanePurple/20"
                onClick={() => {
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  );
                }}
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Lore Cards Grid */}
      <ScrollArea className="flex-1">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
          ) : filteredPages.length === 0 ? (
            <Card className="col-span-full rounded-2xl border-brass/20 bg-card/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Book className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No lore entries yet</p>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Start worldbuilding by creating your first lore entry.
                </p>
                <Button 
                  onClick={() => handleCreateByCategory(activeCategory)}
                  className="bg-arcanePurple hover:bg-arcanePurple/90"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create {getCategoryLabel(activeCategory)}
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPages.map((page) => (
              <Card
                key={page.id}
                className="cursor-pointer hover:shadow-lg transition-all rounded-2xl border-brass/20 bg-card/50 hover:border-arcanePurple/40"
                onClick={() => handleViewPage(page)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base font-cinzel">{page.title}</CardTitle>
                    <Badge variant="outline" className="text-xs border-brass/30">
                      {page.category}
                    </Badge>
                  </div>
                  {page.excerpt && (
                    <CardDescription className="line-clamp-2">
                      {page.excerpt}
                    </CardDescription>
                  )}
                  {page.era && (
                    <p className="text-xs text-muted-foreground mt-1">{page.era}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {page.tags.slice(0, 3).map((tag, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {page.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{page.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Editor Drawer */}
      <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>{currentPage ? 'Edit Page' : `New ${getCategoryLabel(activeCategory)}`}</DrawerTitle>
            <DrawerDescription>
              Create rich lore content with Markdown and cross-links
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            {!currentPage && activeCategory === "regions" ? (
              <RegionCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : !currentPage && activeCategory === "factions" ? (
              <FactionCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : !currentPage && activeCategory === "npcs" ? (
              <NPCCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : !currentPage && activeCategory === "history" ? (
              <HistoryCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : !currentPage && activeCategory === "religion" ? (
              <MythCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : !currentPage && activeCategory === "magic" ? (
              <MagicCreator
                campaignId={campaignId}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            ) : (
              <LoreEditor
                campaignId={campaignId}
                page={currentPage}
                onSave={handleSavePage}
                onCancel={() => setEditorOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Viewer Drawer */}
      <Drawer open={viewerOpen} onOpenChange={setViewerOpen}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <div className="flex-1 overflow-hidden min-h-0">
            {currentPage && (
              <LorePageView
                page={currentPage}
                campaignId={campaignId}
                onEdit={() => {
                  setViewerOpen(false);
                  handleEditPage(currentPage);
                }}
                onClose={() => setViewerOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
