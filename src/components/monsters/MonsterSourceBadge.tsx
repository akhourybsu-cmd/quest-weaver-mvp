import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookOpen, Sparkles, Globe } from "lucide-react";

export interface MonsterSourceInfo {
  source_type?: "catalog" | "homebrew" | "api" | null;
  source_api?: string | null;
  source_key?: string | null;
  source_slug?: string | null;
  source_document?: string | null;
  source_url?: string | null;
}

interface Props {
  source: MonsterSourceInfo;
  showDetails?: boolean;
  className?: string;
}

const labelForApi = (api?: string | null) => {
  if (!api) return "API";
  if (api.includes("open5e")) return "Open5e";
  if (api.includes("srd")) return "SRD API";
  return "API";
};

export const MonsterSourceBadge = ({ source, showDetails = false, className }: Props) => {
  const type = source.source_type ?? "catalog";

  const content = (() => {
    if (type === "api") {
      return {
        icon: <Globe className="w-3 h-3" />,
        label: labelForApi(source.source_api),
        variant: "secondary" as const,
        tooltip: [
          source.source_api && `API: ${source.source_api}`,
          (source.source_slug || source.source_key) && `Key: ${source.source_slug ?? source.source_key}`,
          source.source_document && `Document: ${source.source_document}`,
        ]
          .filter(Boolean)
          .join(" · "),
      };
    }
    if (type === "homebrew") {
      return {
        icon: <Sparkles className="w-3 h-3" />,
        label: "Homebrew",
        variant: "outline" as const,
        tooltip: "Custom homebrew monster",
      };
    }
    return {
      icon: <BookOpen className="w-3 h-3" />,
      label: "Catalog",
      variant: "outline" as const,
      tooltip: "SRD compendium",
    };
  })();

  const badge = (
    <Badge variant={content.variant} className={`gap-1 text-[10px] px-1.5 py-0 h-5 font-normal ${className ?? ""}`}>
      {content.icon}
      {content.label}
    </Badge>
  );

  if (showDetails && type === "api") {
    return (
      <div className="flex flex-col gap-0.5">
        {badge}
        {(source.source_slug || source.source_key) && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {source.source_slug ?? source.source_key}
            {source.source_document ? ` · ${source.source_document}` : ""}
          </span>
        )}
      </div>
    );
  }

  if (!content.tooltip) return badge;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          {content.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default MonsterSourceBadge;