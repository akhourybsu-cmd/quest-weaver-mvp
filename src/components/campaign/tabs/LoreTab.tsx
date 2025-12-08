import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Plus, Search, Book, Clock, List, Mountain, Users, Scroll, Sparkles, User, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import LoreEditor from "@/components/lore/LoreEditor";
import LorePageView from "@/components/lore/LorePageView";
import RegionCreator from "@/components/lore/creators/RegionCreator";
import FactionCreator from "@/components/lore/creators/FactionCreator";
import NPCCreator from "@/components/lore/creators/NPCCreator";
import HistoryCreator from "@/components/lore/creators/HistoryCreator";
import MythCreator from "@/components/lore/creators/MythCreator";
import MagicCreator from "@/components/lore/creators/MagicCreator";
import HistoryTimeline from "@/components/lore/HistoryTimeline";

interface LorePage {
  id: string;
  campaign_id: string;
  title: string;
  slug: string;
  content_md: string;
  updated_at: string;
  excerpt: string | null;
  tags: string[];
  category: string;
  era: string | null;
  visibility: 'DM_ONLY' | 'SHARED' | 'PUBLIC';
  details?: Record<string, any> | null;
  image_url?: string | null;
}

interface LoreTabProps {
  campaignId: string;
}

const categoryConfig: Record<string, { label: string; singularLabel: string; icon: React.ReactNode; color: string }> = {
  regions: { label: "Regions", singularLabel: "Region", icon: <Mountain className="w-4 h-4" />, color: "text-emerald-400" },
  factions: { label: "Factions", singularLabel: "Faction", icon: <Users className="w-4 h-4" />, color: "text-red-400" },
  npcs: { label: "NPCs", singularLabel: "NPC", icon: <User className="w-4 h-4" />, color: "text-teal-400" },
  history: { label: "History", singularLabel: "Event", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
  religion: { label: "Myth & Faith", singularLabel: "Deity/Myth", icon: <Scroll className="w-4 h-4" />, color: "text-blue-400" },
  magic: { label: "Magic", singularLabel: "Magic Entry", icon: <Sparkles className="w-4 h-4" />, color: "text-purple-400" },
};

export function LoreTab({ campaignId }: LoreTabProps) {
  const [pages, setPages] = useState<LorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState("regions");
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<LorePage | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");

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
    setActiveCategory(page.category);
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

  const filteredPages = pages
    .filter((page) => {
      const matchesCategory = page.category === activeCategory;
      const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.content_md.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => page.tags.includes(tag));
      
      return matchesCategory && matchesSearch && matchesTags;
    })
    .sort((a, b) => {
      // Sort by in-game date (details.date) if available
      const dateA = (a.details as any)?.date || '';
      const dateB = (b.details as any)?.date || '';
      
      // If both have dates, sort by date string
      if (dateA && dateB) {
        return dateA.localeCompare(dateB);
      }
      // Items with dates come before items without
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      // Fall back to era, then title
      const eraA = a.era || '';
      const eraB = b.era || '';
      if (eraA !== eraB) return eraA.localeCompare(eraB);
      
      return a.title.localeCompare(b.title);
    });

  const allTags = Array.from(new Set(pages.flatMap(p => p.tags)));

  const getCategoryLabel = (category: string) => {
    return categoryConfig[category]?.singularLabel || "Entry";
  };

  const getCategoryConfig = (category: string) => {
    return categoryConfig[category] || { label: "Other", singularLabel: "Entry", icon: <HelpCircle className="w-4 h-4" />, color: "text-muted-foreground" };
  };

  const renderCreator = () => {
    const props = {
      campaignId,
      page: currentPage,
      onSave: handleSavePage,
      onCancel: () => setEditorOpen(false)
    };

    switch (activeCategory) {
      case "regions":
        return <RegionCreator {...props} />;
      case "factions":
        return <FactionCreator {...props} />;
      case "npcs":
        return <NPCCreator {...props} />;
      case "history":
        return <HistoryCreator {...props} />;
      case "religion":
        return <MythCreator {...props} />;
      case "magic":
        return <MagicCreator {...props} />;
      default:
        return <LoreEditor {...props} />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Book className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-cinzel font-bold text-foreground">World Lore</h2>
        </div>
        <Button 
          onClick={() => handleCreateByCategory(activeCategory)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
        >
          <Plus className="h-4 w-4 mr-2" />
          New {getCategoryLabel(activeCategory)}
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

      {/* History View Mode Toggle */}
      {activeCategory === "history" && (
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4 mr-2" />
            List
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
          >
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </Button>
        </div>
      )}

      {/* Timeline View for History */}
      {activeCategory === "history" && viewMode === "timeline" ? (
        <HistoryTimeline 
          campaignId={campaignId} 
          onViewEvent={(event) => {
            // Fetch the full page data before viewing
            const fullPage = pages.find(p => p.id === event.id);
            if (fullPage) handleViewPage(fullPage);
          }} 
        />
      ) : (
        <>
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
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create {getCategoryLabel(activeCategory)}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                filteredPages.map((page) => {
                  const config = getCategoryConfig(page.category);
                  // Try to get image from details.image_url or page.image_url
                  const imageUrl = page.image_url || (page.details as any)?.image_url;
                  
                  return (
                    <Card
                      key={page.id}
                      className="cursor-pointer hover:shadow-lg transition-all border-brass/20 bg-card/50 hover:border-brass/40 overflow-hidden"
                      onClick={() => handleViewPage(page)}
                    >
                      {/* Image Banner */}
                      {imageUrl && (
                        <div className="w-full h-32 overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={page.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <CardHeader className={imageUrl ? "pt-3 pb-2" : "pb-2"}>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`${config.color} text-xs flex items-center gap-1`}>
                            {config.icon}
                            <span>{config.singularLabel}</span>
                          </Badge>
                          {page.visibility === 'SHARED' && (
                            <Badge variant="secondary" className="text-xs">Shared</Badge>
                          )}
                        </div>
                        <CardTitle className="text-base font-cinzel">{page.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {/* Era name */}
                        {page.era && (
                          <p className="text-xs text-muted-foreground mb-2">{page.era}</p>
                        )}
                        {/* In-game date from details */}
                        {(page.details as any)?.date && (
                          <p className="text-xs text-amber-600/80 mb-2">{(page.details as any).date}</p>
                        )}
                        {/* Excerpt/Summary */}
                        {page.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {page.excerpt}
                          </p>
                        )}
                        {/* Tags */}
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
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </>
      )}

      {/* Editor Drawer */}
      <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
        <DrawerContent className="h-[90vh] flex flex-col">
          <DrawerHeader className="flex-shrink-0">
            <DrawerTitle>{currentPage ? `Edit ${getCategoryLabel(currentPage.category)}` : `New ${getCategoryLabel(activeCategory)}`}</DrawerTitle>
            <DrawerDescription>
              Create rich lore content with Markdown and cross-links
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden min-h-0">
            {renderCreator()}
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
