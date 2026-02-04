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
      <DialogContent 
        className="w-[95vw] max-w-2xl h-[85vh] max-h-[700px] flex flex-col bg-card" 
        variant="ornaments"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="font-cinzel flex items-center gap-2 text-foreground">
            <Upload className="w-5 h-5 text-primary" />
            Import Campaign Content
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload a document and AI will extract NPCs, locations, items, factions, lore, and quests.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Upload Area */}
          {!hasEntities && !isProcessing && (
            <div
              className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors bg-muted/30 ${
                dragActive
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-muted-foreground" />
              <p className="text-base sm:text-lg mb-2 text-foreground font-medium">Drag & drop your document here</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
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
            <div className="py-8 sm:py-12 text-center bg-muted/20 rounded-lg px-4">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-primary animate-spin" />
              <p className="text-base sm:text-lg mb-4 text-foreground font-medium">AI is analyzing your document...</p>
              <Progress value={progress} className="max-w-xs mx-auto" />
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                This may take 30-60 seconds for large documents
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isProcessing && (
            <div className="py-6 sm:py-8 text-center bg-destructive/10 rounded-lg border border-destructive/30 px-4">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-destructive" />
              <p className="text-base sm:text-lg mb-2 text-foreground font-medium">Processing failed</p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={reset}>Try Again</Button>
            </div>
          )}

          {/* Entity Selection */}
          {hasEntities && !isProcessing && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Fixed Header: Selection Controls */}
              <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b border-border bg-muted/30 px-3 rounded-t-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30">
                    {selectedCount} of {totalCount} selected
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-foreground hover:bg-accent text-xs sm:text-sm">
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAll} className="text-foreground hover:bg-accent text-xs sm:text-sm">
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 min-h-0 overflow-hidden border-x border-border">
                <ScrollArea className="h-full">
                  <div className="space-y-3 p-3">
                    {categories.map((category) => {
                      const categoryEntities = getCategoryEntities(category);
                      if (categoryEntities.length === 0) return null;

                      const selectedInCategory = categoryEntities.filter((e) => e.selected).length;
                      const isExpanded = expandedCategories.has(category);
                      const allSelected = selectedInCategory === categoryEntities.length;
                      const someSelected = selectedInCategory > 0 && selectedInCategory < categoryEntities.length;

                      return (
                        <Collapsible key={category} open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                          <div className="flex items-center gap-2 p-2 sm:p-3 rounded-lg bg-accent/50 border border-border hover:bg-accent/70 transition-colors">
                            <Checkbox
                              checked={allSelected}
                              ref={(el) => {
                                if (el) (el as any).indeterminate = someSelected;
                              }}
                              onCheckedChange={(checked) => toggleAllInCategory(category, !!checked)}
                              className="shrink-0 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <CollapsibleTrigger className="flex-1 flex items-center gap-1.5 sm:gap-2 text-left min-w-0">
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-foreground shrink-0" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-foreground shrink-0" />
                              )}
                              <span className="text-primary shrink-0">{CATEGORY_ICONS[category]}</span>
                              <span className="font-medium text-foreground text-sm sm:text-base truncate">{ENTITY_LABELS[category]}</span>
                              <Badge variant="outline" className="ml-auto bg-background/80 text-foreground border-border shrink-0 text-xs">
                                {selectedInCategory}/{categoryEntities.length}
                              </Badge>
                            </CollapsibleTrigger>
                          </div>

                          <CollapsibleContent>
                            <div className="ml-4 sm:ml-8 mt-2 space-y-2">
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
              </div>

              {/* Import Progress - Fixed at bottom of content area */}
              {isImporting && (
                <div className="flex-shrink-0 py-4 border-t border-x border-border bg-muted/30 px-3 rounded-b-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-foreground font-medium">Importing entities...</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions - Always visible */}
        {hasEntities && !isProcessing && (
          <div className="flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border bg-card">
            <Button variant="ghost" onClick={reset} className="text-muted-foreground hover:text-foreground w-full sm:w-auto">
              Upload Different File
            </Button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting} className="flex-1 sm:flex-none">
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Import {selectedCount}
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
      className={`flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
        entity.selected
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-background hover:border-primary/30 hover:bg-accent/30'
      }`}
      onClick={onToggle}
    >
      <Checkbox 
        checked={entity.selected} 
        className="mt-0.5 shrink-0 border-foreground/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary" 
      />
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="font-medium text-foreground text-sm sm:text-base truncate">{name}</p>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-0.5">{description}</p>
        )}
      </div>
      {entity.entity.rarity && (
        <Badge variant="outline" className="text-xs bg-background/80 text-foreground border-border hidden sm:inline-flex">
          {entity.entity.rarity}
        </Badge>
      )}
      {entity.entity.location_type && (
        <Badge variant="outline" className="text-xs bg-background/80 text-foreground border-border hidden sm:inline-flex">
          {entity.entity.location_type}
        </Badge>
      )}
      {entity.entity.category && (
        <Badge variant="outline" className="text-xs bg-background/80 text-foreground border-border hidden sm:inline-flex">
          {entity.entity.category}
        </Badge>
      )}
    </div>
  );
}
