import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Plus, Search, Book, Network, ArrowLeft, FileText } from "lucide-react";
import { toast } from "sonner";
import LoreEditor from "@/components/lore/LoreEditor";
import LorePageView from "@/components/lore/LorePageView";
import LoreGraph from "@/components/lore/LoreGraph";
import BottomNav from "@/components/BottomNav";

interface LorePage {
  id: string;
  campaign_id: string;
  title: string;
  slug: string;
  content_md: string;
  excerpt: string | null;
  tags: string[];
  visibility: 'DM_ONLY' | 'SHARED' | 'PUBLIC';
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function Lore() {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaign");
  const isDM = searchParams.get("dm") === "true";

  const [pages, setPages] = useState<LorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("pages");
  const [editorOpen, setEditorOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<LorePage | null>(null);

  useEffect(() => {
    if (campaignId) {
      loadPages();
    }
  }, [campaignId]);

  const loadPages = async () => {
    if (!campaignId) return;
    
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

  const handleCreatePage = () => {
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
    const matchesSearch = page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.content_md.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => page.tags.includes(tag));
    
    return matchesSearch && matchesTags;
  });

  const allTags = Array.from(new Set(pages.flatMap(p => p.tags)));

  if (!campaignId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No campaign selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container flex h-14 items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Book className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold">Lore & Worldbuilding</h1>
        </div>
      </header>

      <main className="container py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pages">
              <FileText className="h-4 w-4 mr-2" />
              Pages
            </TabsTrigger>
            <TabsTrigger value="graph">
              <Network className="h-4 w-4 mr-2" />
              Knowledge Graph
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pages" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages, tags, content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              {isDM && (
                <Button onClick={handleCreatePage}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Page
                </Button>
              )}
            </div>

            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
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

            <ScrollArea className="h-[calc(100vh-16rem)]">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                  <p className="text-muted-foreground col-span-full text-center py-8">Loading...</p>
                ) : filteredPages.length === 0 ? (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Book className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-medium mb-2">No lore pages yet</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start building your world's knowledge base
                      </p>
                      {isDM && (
                        <Button onClick={handleCreatePage}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create First Page
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  filteredPages.map((page) => (
                    <Card
                      key={page.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleViewPage(page)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base">{page.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {page.visibility.replace('_', ' ')}
                          </Badge>
                        </div>
                        {page.excerpt && (
                          <CardDescription className="line-clamp-2">
                            {page.excerpt}
                          </CardDescription>
                        )}
                      </CardHeader>
                      {page.tags.length > 0 && (
                        <CardContent>
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
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="graph" className="h-[calc(100vh-12rem)]">
            <LoreGraph campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </main>

      <Drawer open={editorOpen} onOpenChange={setEditorOpen}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>{currentPage ? 'Edit Page' : 'New Lore Page'}</DrawerTitle>
            <DrawerDescription>
              Create rich lore content with Markdown and cross-links
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-hidden">
            <LoreEditor
              campaignId={campaignId}
              page={currentPage}
              onSave={handleSavePage}
              onCancel={() => setEditorOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={viewerOpen} onOpenChange={setViewerOpen}>
        <DrawerContent className="h-[90vh]">
          <div className="flex-1 overflow-hidden">
            {currentPage && (
              <LorePageView
                page={currentPage}
                campaignId={campaignId}
                onEdit={isDM ? () => {
                  setViewerOpen(false);
                  handleEditPage(currentPage);
                } : undefined}
                onClose={() => setViewerOpen(false)}
              />
            )}
          </div>
        </DrawerContent>
      </Drawer>

      <BottomNav role={isDM ? "dm" : "player"} />
    </div>
  );
}
