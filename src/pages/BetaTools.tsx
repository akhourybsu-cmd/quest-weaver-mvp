import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { BetaToolsLayout } from "@/components/beta-tools/BetaToolsLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles, ArrowRight, Library, Info, Package, FileEdit,
  Upload, Star, User, Skull, ScrollText, Building2,
} from "lucide-react";
import { HERO_TOOLS, TOOL_CATEGORIES, getToolsByCategory } from "@/components/beta-tools/toolRegistry";
import { BetaAssetCard, BetaAsset } from "@/components/beta-tools/BetaAssetCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const QUICK_LAUNCH = [
  { label: "Create NPC", toolId: "npc-generator", icon: User },
  { label: "Build Monster", toolId: "monster-generator", icon: Skull },
  { label: "Generate Quest", toolId: "quest-generator", icon: ScrollText },
  { label: "Make Settlement", toolId: "settlement-generator", icon: Building2 },
];

const BetaTools = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [recentAssets, setRecentAssets] = useState<BetaAsset[]>([]);
  const [stats, setStats] = useState({ total: 0, drafts: 0, imported: 0, favorites: 0 });

  useEffect(() => {
    if (!userId) return;
    const fetchRecent = supabase
      .from("beta_assets")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setRecentAssets(data as BetaAsset[]);
      });

    const fetchStats = supabase
      .from("beta_assets")
      .select("status, is_favorite")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) {
          setStats({
            total: data.length,
            drafts: data.filter((a) => a.status === "draft").length,
            imported: data.filter((a) => a.status === "imported" || a.status === "imported_adapted").length,
            favorites: data.filter((a) => a.is_favorite).length,
          });
        }
      });
  }, [userId]);

  return (
    <BetaToolsLayout>
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero */}
        <div className="relative rounded-xl border-2 border-brand-brass/30 overflow-hidden fantasy-parchment">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-brass/5 rounded-full blur-3xl" />
          </div>

          <div className="relative text-center space-y-5 py-10 px-6">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-8 w-8 text-brand-brass animate-pulse" />
              <h1 className="font-cinzel text-4xl font-bold text-foreground">
                The Creator's Forge
              </h1>
            </div>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Your standalone homebrew workshop. Generate, refine, and experiment freely —
              nothing here touches your live campaigns unless you choose to import it.
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
                onClick={() => navigate("/beta-tools/generate/npc-generator")}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Start Creating
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
                onClick={() => navigate("/beta-tools/library")}
              >
                <Library className="h-5 w-5 mr-2" />
                My Library
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              {QUICK_LAUNCH.map((q) => (
                <Button
                  key={q.toolId}
                  variant="outline"
                  size="sm"
                  className="border-border text-muted-foreground hover:bg-muted hover:text-foreground text-xs transition-all duration-200"
                  onClick={() => navigate(`/beta-tools/generate/${q.toolId}`)}
                >
                  <q.icon className="h-3.5 w-3.5 mr-1.5" />
                  {q.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Library Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Package, label: "Created", value: stats.total, color: "text-brand-brass" },
            { icon: FileEdit, label: "Drafts", value: stats.drafts, color: "text-muted-foreground" },
            { icon: Upload, label: "Imported", value: stats.imported, color: "text-secondary" },
            { icon: Star, label: "Favorites", value: stats.favorites, color: "text-brand-brass" },
          ].map((s) => (
            <Card
              key={s.label}
              className="border-border bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/25 transition-all duration-200"
              onClick={() => navigate("/beta-tools/library")}
            >
              <div className="p-4 flex items-center gap-3">
                <s.icon className={`h-5 w-5 ${s.color} shrink-0`} />
                <div>
                  <div className="text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Sandbox Banner */}
        <div className="flex items-start gap-3 p-4 rounded-lg border border-border border-l-4 border-l-primary bg-muted/30">
          <Info className="h-5 w-5 text-brand-brass shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <span className="text-foreground font-semibold">Sandbox Mode</span> — Everything
            created here stays in your Beta Library until you explicitly import it into a
            campaign. No live campaign data is affected.
          </div>
        </div>

        {/* Recent Creations */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-cinzel text-xl font-bold text-foreground">Recent Creations</h2>
            {recentAssets.length > 0 && (
              <Button
                variant="link"
                className="text-primary"
                onClick={() => navigate("/beta-tools/library")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
          {recentAssets.length === 0 ? (
            <Card className="border-dashed border-border bg-card/30">
              <div className="p-8 text-center space-y-2">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Your workshop is empty. Start creating to see your work here.
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentAssets.map((asset, i) => (
                <div key={asset.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <BetaAssetCard asset={asset} onEdit={() => navigate("/beta-tools/library")} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Featured Tools */}
        <section className="space-y-4">
          <h2 className="font-cinzel text-xl font-bold text-foreground">Featured Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {HERO_TOOLS.map((tool) => (
              <Card
                key={tool.id}
                className="group cursor-pointer border-border hover:border-primary/30 bg-card/50 backdrop-blur-sm transition-all duration-200 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]"
                onClick={() => navigate(`/beta-tools/generate/${tool.id}`)}
              >
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-lg bg-primary/10 text-brand-brass group-hover:bg-primary/20 transition-colors">
                      <tool.icon className="h-6 w-6" />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      Open Tool <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <div>
                    <h3 className="font-cinzel font-semibold text-foreground">{tool.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {tool.description}
                    </p>
                  </div>
                  {tool.outputHints && tool.outputHints.length > 0 && (
                    <p className="text-[10px] text-muted-foreground/50 truncate">
                      {tool.outputHints.join(" · ")}
                    </p>
                  )}
                  <Badge
                    variant="outline"
                    className="text-[10px] border-primary/30 text-primary"
                  >
                    {tool.categoryLabel}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* All Categories */}
        <section className="space-y-4">
          <h2 className="font-cinzel text-xl font-bold text-foreground">All Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TOOL_CATEGORIES.map((cat) => {
              const tools = getToolsByCategory(cat.id);
              const activeCount = tools.filter((t) => t.status === "active").length;
              const firstActiveTool = tools.find((t) => t.status === "active");
              return (
                <Card
                  key={cat.id}
                  className={`border-border/50 bg-card/30 transition-all duration-200 ${firstActiveTool ? 'cursor-pointer hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]' : ''}`}
                  onClick={() => firstActiveTool && navigate(`/beta-tools/generate/${firstActiveTool.id}`)}
                >
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <cat.icon className="h-5 w-5 text-brand-brass" />
                        <h3 className="font-cinzel font-semibold">{cat.label}</h3>
                      </div>
                      {firstActiveTool && <ArrowRight className="h-4 w-4 text-muted-foreground/50" />}
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
