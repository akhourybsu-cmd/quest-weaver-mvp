import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Search, Map, History, Users, Shield, Crown, Landmark, Globe, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

interface LorePage {
  id: string;
  title: string;
  content_md: string;
  excerpt: string | null;
  tags: string[] | null;
  category: string;
  era: string | null;
  details: any;
}

interface PlayerLoreViewProps {
  campaignId: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  regions: Map,
  history: History,
  npcs: Users,
  factions: Shield,
  pantheon: Crown,
  cultures: Landmark,
  geography: Globe,
  magic: Sparkles,
};

const CATEGORIES = [
  "All",
  "regions",
  "history",
  "npcs",
  "factions",
  "pantheon",
  "cultures",
  "geography",
  "magic",
  "other",
];

export function PlayerLoreView({ campaignId }: PlayerLoreViewProps) {
  const [lorePages, setLorePages] = useState<LorePage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLore, setSelectedLore] = useState<LorePage | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadLore();

    const channel = supabase
      .channel(`player-lore:${campaignId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lore_pages",
          filter: `campaign_id=eq.${campaignId}`,
        },
        () => loadLore()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const loadLore = async () => {
    const { data, error } = await supabase
      .from("lore_pages")
      .select("id, title, content_md, excerpt, tags, category, era, details")
      .eq("campaign_id", campaignId)
      .eq("visibility", "SHARED")
      .order("title");

    if (!error && data) {
      setLorePages(data as LorePage[]);
    }
  };

  const filteredLore = lorePages.filter((page) => {
    const matchesCategory = selectedCategory === "All" || page.category === selectedCategory;
    if (!matchesCategory) return false;
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      page.title.toLowerCase().includes(search) ||
      page.excerpt?.toLowerCase().includes(search) ||
      page.tags?.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  const availableCategories = CATEGORIES.filter(
    (cat) => cat === "All" || lorePages.some((p) => p.category === cat)
  );

  const getCategoryIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] || BookOpen;
    return <Icon className="w-4 h-4" />;
  };

  const handleViewLore = (page: LorePage) => {
    setSelectedLore(page);
    setDialogOpen(true);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinzel flex items-center gap-2">
              {selectedLore && getCategoryIcon(selectedLore.category)}
              {selectedLore?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedLore && (
            <div className="space-y-4">
              {selectedLore.details?.image_url && (
                <div className="rounded-lg overflow-hidden border border-brass/20">
                  <img
                    src={selectedLore.details.image_url}
                    alt={selectedLore.title}
                    className="w-full h-auto max-h-[300px] object-cover"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary" className="capitalize">
                  {selectedLore.category}
                </Badge>
                {selectedLore.era && (
                  <Badge variant="outline">{selectedLore.era}</Badge>
                )}
                {selectedLore.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-brass/30 text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{selectedLore.content_md}</ReactMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="space-y-3">
            <CardTitle className="flex items-center gap-2 font-cinzel">
              <BookOpen className="w-5 h-5" />
              Lore Codex
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search lore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            {availableCategories.length > 2 && (
              <div className="flex flex-wrap gap-1">
                {availableCategories.map((cat) => (
                  <Badge
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className="cursor-pointer capitalize text-xs"
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {filteredLore.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No lore entries shared yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {filteredLore.map((page) => (
                  <Card
                    key={page.id}
                    className="cursor-pointer hover:shadow-md hover:border-brass/40 transition-all border-brass/20"
                    onClick={() => handleViewLore(page)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 text-primary">
                          {getCategoryIcon(page.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-cinzel font-semibold truncate">{page.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {page.category}
                            </Badge>
                            {page.era && (
                              <span className="text-xs text-muted-foreground">{page.era}</span>
                            )}
                          </div>
                          {page.excerpt && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {page.excerpt}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
