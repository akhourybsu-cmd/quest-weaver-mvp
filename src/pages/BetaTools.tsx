import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BetaToolsLayout } from "@/components/beta-tools/BetaToolsLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Library, Info } from "lucide-react";
import { HERO_TOOLS, TOOL_CATEGORIES, getToolsByCategory, ASSET_TYPE_LABELS } from "@/components/beta-tools/toolRegistry";
import { BetaAssetCard, BetaAsset } from "@/components/beta-tools/BetaAssetCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const BetaTools = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [recentAssets, setRecentAssets] = useState<BetaAsset[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('beta_assets')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setRecentAssets(data as BetaAsset[]);
      });
  }, [userId]);

  return (
    <BetaToolsLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3">
            <Sparkles className="h-8 w-8 text-amber-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-amber-500 bg-clip-text text-transparent">
              The Creator's Forge
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your standalone homebrew workshop. Generate, refine, and experiment with campaign content freely — nothing here touches your campaigns unless you choose to import it.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold"
              onClick={() => navigate('/beta-tools/generate/npc-generator')}
            >
              <Sparkles className="h-5 w-5 mr-2" />
              Start Creating
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              onClick={() => navigate('/beta-tools/library')}
            >
              <Library className="h-5 w-5 mr-2" />
              My Library
            </Button>
          </div>
        </div>

        {/* Info callout */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5">
          <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="text-amber-300 font-medium">Sandbox Mode</span> — Everything you create here lives in your personal Beta Library. Import your best creations into any campaign whenever you're ready, or keep them standalone forever. No live campaign data is affected.
          </div>
        </div>

        {/* Featured Tools */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">Featured Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {HERO_TOOLS.map((tool) => (
              <Card
                key={tool.id}
                className="group cursor-pointer border-amber-500/10 hover:border-amber-500/30 bg-card/50 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-amber-500/5"
                onClick={() => navigate(`/beta-tools/generate/${tool.id}`)}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{tool.description}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">
                    {tool.categoryLabel}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Recent Creations */}
        {recentAssets.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-foreground">Recent Creations</h2>
              <Button variant="link" className="text-amber-400" onClick={() => navigate('/beta-tools/library')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentAssets.map((asset) => (
                <BetaAssetCard key={asset.id} asset={asset} onEdit={() => navigate('/beta-tools/library')} />
              ))}
            </div>
          </section>
        )}

        {/* All Categories */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">All Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOL_CATEGORIES.map((cat) => {
              const tools = getToolsByCategory(cat.id);
              const activeCount = tools.filter(t => t.status === 'active').length;
              return (
                <Card key={cat.id} className="border-border/50 bg-card/30">
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <cat.icon className="h-5 w-5 text-amber-400" />
                      <h3 className="font-semibold">{cat.label}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{cat.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{activeCount} active</span>
                      <span>•</span>
                      <span>{tools.length - activeCount} coming soon</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </BetaToolsLayout>
  );
};

export default BetaTools;
