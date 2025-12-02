import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Upload,
  FileText,
  Loader2,
  ChevronDown,
  ChevronRight,
  Users,
  MapPin,
  Package,
  Crown,
  BookOpen,
  Scroll,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useDocumentImport } from '@/hooks/useDocumentImport';
import { EntityCategory, ENTITY_LABELS, SelectableEntity } from '@/lib/documentImportSchema';

interface DocumentImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

const CATEGORY_ICONS: Record<EntityCategory, React.ReactNode> = {
  npcs: <Users className="w-4 h-4" />,
  locations: <MapPin className="w-4 h-4" />,
  items: <Package className="w-4 h-4" />,
  factions: <Crown className="w-4 h-4" />,
  lore: <BookOpen className="w-4 h-4" />,
  quests: <Scroll className="w-4 h-4" />,
};

export function DocumentImportDialog({ open, onOpenChange, campaignId }: DocumentImportDialogProps) {
  const {
    isProcessing,
    isImporting,
    entities,
    progress,
    error,
    processDocument,
    toggleSelection,
    toggleAllInCategory,
    selectAll,
    deselectAll,
    importSelected,
    getSelectedCount,
    getTotalCount,
    getCategoryEntities,
    reset,
  } = useDocumentImport();

  const [dragActive, setDragActive] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<EntityCategory>>(
    new Set(['npcs', 'locations', 'items', 'factions', 'lore', 'quests'])
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        processDocument(file);
      }
    },
    [processDocument]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processDocument(file);
      }
    },
    [processDocument]
  );

  const handleImport = useCallback(async () => {
    await importSelected(campaignId);
  }, [importSelected, campaignId]);

  const handleClose = useCallback(() => {
    reset();
    onOpenChange(false);
  }, [reset, onOpenChange]);

  const toggleCategory = useCallback((category: EntityCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const categories: EntityCategory[] = ['npcs', 'locations', 'items', 'factions', 'lore', 'quests'];
  const hasEntities = entities.length > 0;
  const selectedCount = getSelectedCount();
  const totalCount = getTotalCount();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" variant="ornaments">
        <DialogHeader>
          <DialogTitle className="font-cinzel flex items-center gap-2">
            <Upload className="w-5 h-5 text-arcanePurple" />
            Import Campaign Content
          </DialogTitle>
          <DialogDescription>
            Upload a document and AI will extract NPCs, locations, items, factions, lore, and quests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Upload Area */}
          {!hasEntities && !isProcessing && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-arcanePurple bg-arcanePurple/10'
                  : 'border-brass/30 hover:border-brass/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="w-12 h-12 mx-auto mb-4 text-brass/50" />
              <p className="text-lg mb-2">Drag & drop your document here</p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports PDF, DOCX, TXT, and MD files (max 20MB)
              </p>
              <label>
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt,.md"
                  onChange={handleFileSelect}
                />
                <Button variant="outline" className="cursor-pointer" asChild>
                  <span>Browse Files</span>
                </Button>
              </label>
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="py-12 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 text-arcanePurple animate-spin" />
              <p className="text-lg mb-4">AI is analyzing your document...</p>
              <Progress value={progress} className="max-w-xs mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">
                This may take 30-60 seconds for large documents
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isProcessing && (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-lg mb-2">Processing failed</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={reset}>Try Again</Button>
            </div>
          )}

          {/* Entity Selection */}
          {hasEntities && !isProcessing && (
            <>
              {/* Selection Controls */}
              <div className="flex items-center justify-between py-3 border-b border-brass/20">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {selectedCount} of {totalCount} selected
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Categories */}
              <ScrollArea className="flex-1 mt-2">
                <div className="space-y-2 pr-4">
                  {categories.map((category) => {
                    const categoryEntities = getCategoryEntities(category);
                    if (categoryEntities.length === 0) return null;

                    const selectedInCategory = categoryEntities.filter((e) => e.selected).length;
                    const isExpanded = expandedCategories.has(category);
                    const allSelected = selectedInCategory === categoryEntities.length;
                    const someSelected = selectedInCategory > 0 && selectedInCategory < categoryEntities.length;

                    return (
                      <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 border border-brass/20">
                          <Checkbox
                            checked={allSelected}
                            ref={(el) => {
                              if (el) (el as any).indeterminate = someSelected;
                            }}
                            onCheckedChange={(checked) => toggleAllInCategory(category, !!checked)}
                          />
                          <CollapsibleTrigger className="flex-1 flex items-center gap-2 text-left">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {CATEGORY_ICONS[category]}
                            <span className="font-medium">{ENTITY_LABELS[category]}</span>
                            <Badge variant="outline" className="ml-auto">
                              {selectedInCategory}/{categoryEntities.length}
                            </Badge>
                          </CollapsibleTrigger>
                        </div>

                        <CollapsibleContent>
                          <div className="ml-8 mt-1 space-y-1">
                            {categoryEntities.map((item) => (
                              <EntityRow
                                key={item.id}
                                entity={item}
                                onToggle={() => toggleSelection(item.id)}
                              />
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </ScrollArea>

              {/* Import Progress */}
              {isImporting && (
                <div className="py-4 border-t border-brass/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Importing entities...</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        {hasEntities && !isProcessing && (
          <div className="flex items-center justify-between pt-4 border-t border-brass/20">
            <Button variant="ghost" onClick={reset}>
              Upload Different File
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Import {selectedCount} Selected
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Entity Row Component
function EntityRow({
  entity,
  onToggle,
}: {
  entity: SelectableEntity<any>;
  onToggle: () => void;
}) {
  const name = entity.entity.name || entity.entity.title || 'Unnamed';
  const description = entity.entity.description || entity.entity.content?.substring(0, 100) || '';

  return (
    <div
      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
        entity.selected
          ? 'border-arcanePurple/50 bg-arcanePurple/5'
          : 'border-brass/10 hover:border-brass/30'
      }`}
      onClick={onToggle}
    >
      <Checkbox checked={entity.selected} className="mt-1" />
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{name}</p>
        {description && (
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        )}
      </div>
      {entity.entity.rarity && (
        <Badge variant="outline" className="text-xs">
          {entity.entity.rarity}
        </Badge>
      )}
      {entity.entity.location_type && (
        <Badge variant="outline" className="text-xs">
          {entity.entity.location_type}
        </Badge>
      )}
      {entity.entity.category && (
        <Badge variant="outline" className="text-xs">
          {entity.entity.category}
        </Badge>
      )}
    </div>
  );
}
