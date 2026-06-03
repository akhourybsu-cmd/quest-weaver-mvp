import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Scale, BookMarked } from "lucide-react";
import { Link } from "react-router-dom";
import { SimpleMarkdown } from "@/components/reference/SimpleMarkdown";
import { contentTypeLabel, type CanonicalEntity } from "@/lib/rules/cacheAdapter";
import LibraryAddActions from "@/components/rules/LibraryAddActions";

/**
 * Detail drawer for a single library entity. Read-only; renders the canonical
 * entity produced by the cache adapter, with source/ruleset/license badges and
 * attribution links.
 */
export default function RulesEntityDrawer({
  entity,
  open,
  onOpenChange,
}: {
  entity: CanonicalEntity | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {entity && (
          <>
            <SheetHeader className="space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="secondary" className="text-[10px] font-cinzel tracking-wide">
                  {contentTypeLabel(entity.contentType)}
                </Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  <BookMarked className="h-3 w-3" />
                  {entity.sourceName}
                </Badge>
                {entity.ruleset && (
                  <Badge variant="outline" className="text-[10px]">{entity.ruleset}</Badge>
                )}
                {entity.license && (
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <Scale className="h-3 w-3" />
                    {entity.license}
                  </Badge>
                )}
              </div>
              <SheetTitle className="font-cinzel text-2xl tracking-wide">
                {entity.name}
              </SheetTitle>
            </SheetHeader>

            <div className="mt-4 fantasy-divider" />

            {/* Description */}
            <div className="mt-4">
              {entity.fullDescription ? (
                <SimpleMarkdown text={entity.fullDescription} />
              ) : (
                <p className="text-sm text-muted-foreground italic font-cormorant">
                  No description available for this entry.
                </p>
              )}
            </div>

            {/* Add to encounter / character (5a / 5b) */}
            <LibraryAddActions entity={entity} />

            {/* Attribution footer */}
            <div className="mt-6 pt-4 border-t border-brass/20 space-y-2">
              <p className="fantasy-section-header text-[10px]">Source &amp; attribution</p>
              {entity.source?.attribution && (
                <p className="text-xs text-muted-foreground font-cormorant italic leading-snug">
                  {entity.source.attribution}
                </p>
              )}
              {entity.sourceDocument && (
                <p className="text-[11px] text-muted-foreground">
                  Document: <code className="px-1 bg-muted rounded">{entity.sourceDocument}</code>
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {entity.source?.upstreamUrl && (
                  <a href={entity.source.upstreamUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-brass/30 hover:bg-brass/10 hover:text-brass">
                      <ExternalLink className="h-3 w-3" />
                      {entity.sourceName}
                    </Button>
                  </a>
                )}
                <Link to="/attribution">
                  <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs border-brass/30 hover:bg-brass/10 hover:text-brass">
                    <Scale className="h-3 w-3" />
                    All attributions
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
