import { DemoCampaign } from "@/data/demoSeeds";
import { adaptDemoItems } from "@/lib/demoAdapters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles } from "lucide-react";

interface DemoItemVaultTabProps {
  campaign: DemoCampaign;
}

export function DemoItemVaultTab({ campaign }: DemoItemVaultTabProps) {
  const items = adaptDemoItems(campaign);

  const getRarityColor = (rarity?: string) => {
    switch (rarity?.toLowerCase()) {
      case "legendary":
        return "border-orange-500/50 text-orange-500";
      case "very rare":
        return "border-purple-500/50 text-purple-500";
      case "rare":
        return "border-blue-500/50 text-blue-500";
      case "uncommon":
        return "border-green-500/50 text-green-500";
      default:
        return "border-brass/50 text-brass";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-cinzel font-bold">Item Vault</h2>
          <p className="text-muted-foreground">Magical items and treasures</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id} className="bg-card/50 border-brass/20 hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="font-cinzel flex items-center gap-2">
                    {item.requires_attunement ? (
                      <Sparkles className="w-5 h-5 text-arcanePurple" />
                    ) : (
                      <Package className="w-5 h-5 text-brass" />
                    )}
                    {item.name}
                  </CardTitle>
                  <CardDescription className="mt-1">{item.item_type}</CardDescription>
                </div>
                {item.rarity && (
                  <Badge variant="outline" className={getRarityColor(item.rarity)}>
                    {item.rarity}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{item.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm">
                {item.requires_attunement && (
                  <Badge variant="secondary" className="text-xs">
                    Requires Attunement
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
