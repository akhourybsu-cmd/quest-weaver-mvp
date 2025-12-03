import { useState } from "react";
import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoLore } from "@/lib/demoAdapters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Scroll, Sparkles, Mountain, Users, HelpCircle, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface DemoLoreTabProps {
  campaign: DemoCampaign;
}

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  history: { label: "History", icon: <Clock className="w-4 h-4" />, color: "text-amber-400" },
  region: { label: "Regions", icon: <Mountain className="w-4 h-4" />, color: "text-emerald-400" },
  magic: { label: "Magic", icon: <Sparkles className="w-4 h-4" />, color: "text-purple-400" },
  myth: { label: "Myths", icon: <Scroll className="w-4 h-4" />, color: "text-blue-400" },
  faction: { label: "Factions", icon: <Users className="w-4 h-4" />, color: "text-red-400" },
  other: { label: "Other", icon: <HelpCircle className="w-4 h-4" />, color: "text-muted-foreground" },
};

export function DemoLoreTab({ campaign }: DemoLoreTabProps) {
  const [selectedLore, setSelectedLore] = useState<ReturnType<typeof adaptDemoLore>[0] | null>(null);
  const lore = adaptDemoLore(campaign);

  const categories = Object.keys(categoryConfig);
  const loreByCategory = categories.reduce((acc, cat) => {
    acc[cat] = lore.filter(l => l.category === cat);
    return acc;
  }, {} as Record<string, typeof lore>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BookOpen className="w-5 h-5 text-brass" />
        <h2 className="text-xl font-cinzel text-brass">Campaign Lore</h2>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat} className="hidden lg:flex">
              {categoryConfig[cat].label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lore.map(page => (
              <LoreCard key={page.id} page={page} onClick={() => setSelectedLore(page)} />
            ))}
          </div>
        </TabsContent>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-6">
            {loreByCategory[cat].length === 0 ? (
              <Card className="border-brass/20">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No {categoryConfig[cat].label.toLowerCase()} entries yet
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {loreByCategory[cat].map(page => (
                  <LoreCard key={page.id} page={page} onClick={() => setSelectedLore(page)} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Lore Detail Dialog */}
      <Dialog open={!!selectedLore} onOpenChange={() => setSelectedLore(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedLore && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={categoryConfig[selectedLore.category]?.color}>
                    {categoryConfig[selectedLore.category]?.icon}
                    <span className="ml-1">{categoryConfig[selectedLore.category]?.label}</span>
                  </Badge>
                  {selectedLore.show_on_timeline && (
                    <Badge variant="secondary" className="text-xs">Timeline</Badge>
                  )}
                </div>
                <DialogTitle className="font-cinzel text-xl">{selectedLore.title}</DialogTitle>
              </DialogHeader>
              
              {selectedLore.image_url && (
                <div className="w-full h-48 rounded-lg overflow-hidden">
                  <img
                    src={selectedLore.image_url}
                    alt={selectedLore.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{selectedLore.content}</ReactMarkdown>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function LoreCard({ page, onClick }: { page: ReturnType<typeof adaptDemoLore>[0]; onClick: () => void }) {
  const config = categoryConfig[page.category] || categoryConfig.other;
  
  return (
    <Card
      className="border-brass/20 hover:border-brass/40 transition-colors cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {page.image_url && (
        <div className="w-full h-32 overflow-hidden">
          <img
            src={page.image_url}
            alt={page.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${config.color} text-xs`}>
            {config.icon}
            <span className="ml-1">{config.label}</span>
          </Badge>
          {page.show_on_timeline && (
            <Badge variant="secondary" className="text-xs">Timeline</Badge>
          )}
        </div>
        <CardTitle className="text-base font-cinzel">{page.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {page.content.slice(0, 150)}...
        </p>
      </CardContent>
    </Card>
  );
}
