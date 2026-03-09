import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Copy, Trash2, Upload, Pencil, FileText } from "lucide-react";
import { assetToMarkdown } from "@/lib/assetToMarkdown";
import { useToast } from "@/hooks/use-toast";
import { ASSET_TYPE_LABELS, STATUS_LABELS } from "./toolRegistry";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface BetaAsset {
  id: string;
  user_id: string;
  asset_type: string;
  name: string;
  data: Record<string, any>;
  tags: string[];
  status: string;
  is_favorite: boolean;
  imported_to_campaign_id: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BetaAssetCardProps {
  asset: BetaAsset;
  onEdit?: (asset: BetaAsset) => void;
  onDuplicate?: (asset: BetaAsset) => void;
  onDelete?: (asset: BetaAsset) => void;
  onToggleFavorite?: (asset: BetaAsset) => void;
  onImport?: (asset: BetaAsset) => void;
}

const statusColors: Record<string, string> = {
  draft: 'border-muted-foreground/40 text-muted-foreground',
  standalone: 'border-secondary/40 text-secondary',
  canon_ready: 'border-status-buff/40 text-status-buff',
  imported: 'border-primary/40 text-primary',
  imported_adapted: 'border-status-debuff/40 text-status-debuff',
};

export function BetaAssetCard({ asset, onEdit, onDuplicate, onDelete, onToggleFavorite, onImport }: BetaAssetCardProps) {
  const { toast } = useToast();
  const description = asset.data?.description || asset.data?.personality || asset.data?.content || '';

  const handleCopyMarkdown = async () => {
    try {
      const md = assetToMarkdown(asset);
      await navigator.clipboard.writeText(md);
      toast({ title: "Copied as Markdown" });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard access not available", variant: "destructive" });
    }
  };
  const truncatedDesc = typeof description === 'string' ? description.slice(0, 120) + (description.length > 120 ? '...' : '') : '';

  return (
    <Card className="group border-brand-brass/20 hover:border-brand-brass/40 transition-all card-glow bg-card relative fantasy-section overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-cinzel font-semibold text-foreground truncate">{asset.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-[10px]">
                {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
              </Badge>
              <Badge variant="outline" className={cn("text-[10px]", statusColors[asset.status] || '')}>
                {STATUS_LABELS[asset.status] || asset.status}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 focus-visible:ring-1 focus-visible:ring-ring"
            onClick={() => onToggleFavorite?.(asset)}
            aria-label={asset.is_favorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Star className={cn("h-4 w-4", asset.is_favorite ? "fill-brand-brass text-brand-brass" : "text-muted-foreground")} />
          </Button>
        </div>

        {truncatedDesc && (
          <p className="text-xs text-muted-foreground line-clamp-2">{truncatedDesc}</p>
        )}

        {asset.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1.5 py-0">{tag}</Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(asset.updated_at), { addSuffix: true })}
          </span>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 focus-visible:ring-1 focus-visible:ring-ring" onClick={() => onEdit?.(asset)} title="Edit" aria-label="Edit asset">
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 focus-visible:ring-1 focus-visible:ring-ring" onClick={() => onDuplicate?.(asset)} title="Duplicate" aria-label="Duplicate asset">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 focus-visible:ring-1 focus-visible:ring-ring" onClick={handleCopyMarkdown} title="Copy as Markdown" aria-label="Copy as Markdown">
              <FileText className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 focus-visible:ring-1 focus-visible:ring-ring" onClick={() => onImport?.(asset)} title="Import to Campaign" aria-label="Import to campaign">
              <Upload className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive focus-visible:ring-1 focus-visible:ring-ring" onClick={() => onDelete?.(asset)} title="Delete" aria-label="Delete asset">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
