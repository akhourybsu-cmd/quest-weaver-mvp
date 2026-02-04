import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ExtractedEntities,
  SelectableEntity,
  EntityCategory,
  validateExtractedEntities,
  ExtractedNPC,
  ExtractedLocation,
  ExtractedItem,
  ExtractedFaction,
  ExtractedLore,
  ExtractedQuest,
} from '@/lib/documentImportSchema';
import { nanoid } from 'nanoid';
import {
  importNPC,
  importLocation,
  importFaction,
  importItem,
  importLore,
  importQuest,
  resolveLocationParents,
  PendingParentLink,
} from '@/lib/documentImportHelpers';

type AnyEntity = ExtractedNPC | ExtractedLocation | ExtractedItem | ExtractedFaction | ExtractedLore | ExtractedQuest;

interface UseDocumentImportResult {
  isProcessing: boolean;
  isImporting: boolean;
  entities: SelectableEntity<AnyEntity>[];
  progress: number;
  error: string | null;
  processDocument: (file: File) => Promise<void>;
  toggleSelection: (id: string) => void;
  toggleAllInCategory: (category: EntityCategory, selected: boolean) => void;
  selectAll: () => void;
  deselectAll: () => void;
  importSelected: (campaignId: string) => Promise<void>;
  getSelectedCount: () => number;
  getTotalCount: () => number;
  getCategoryEntities: (category: EntityCategory) => SelectableEntity<AnyEntity>[];
  reset: () => void;
}

export function useDocumentImport(): UseDocumentImportResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [entities, setEntities] = useState<SelectableEntity<AnyEntity>[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const processDocument = useCallback(async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setProgress(10);

    try {
      // Read file content
      const text = await readFileContent(file);
      setProgress(30);

      // Send to edge function for AI processing
      const { data, error: fnError } = await supabase.functions.invoke('parse-campaign-document', {
        body: { content: text, filename: file.name },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to process document');
      }

      // Check for error in response
      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress(80);

      // Validate and structure the response
      const extracted = validateExtractedEntities(data?.entities);

      // Convert to selectable entities
      const selectableEntities: SelectableEntity<AnyEntity>[] = [];

      (Object.keys(extracted) as EntityCategory[]).forEach((category) => {
        const items = extracted[category] as AnyEntity[];
        items.forEach((entity) => {
          selectableEntities.push({
            id: nanoid(),
            entity,
            selected: true, // Default to selected
            type: category,
            confidence: (entity as any).confidence || 0.8,
          });
        });
      });

      // Check if any entities were found
      if (selectableEntities.length === 0) {
        throw new Error('No campaign content found in document. Try a document with NPCs, locations, items, factions, lore, or quests.');
      }

      setEntities(selectableEntities);
      setProgress(100);
      
      toast({
        title: 'Document processed',
        description: `Found ${selectableEntities.length} items to import`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process document';
      setError(message);
      toast({
        title: 'Processing failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [toast]);

  const toggleSelection = useCallback((id: string) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  }, []);

  const toggleAllInCategory = useCallback((category: EntityCategory, selected: boolean) => {
    setEntities((prev) =>
      prev.map((e) => (e.type === category ? { ...e, selected } : e))
    );
  }, []);

  const selectAll = useCallback(() => {
    setEntities((prev) => prev.map((e) => ({ ...e, selected: true })));
  }, []);

  const deselectAll = useCallback(() => {
    setEntities((prev) => prev.map((e) => ({ ...e, selected: false })));
  }, []);

  const getSelectedCount = useCallback(() => {
    return entities.filter((e) => e.selected).length;
  }, [entities]);

  const getTotalCount = useCallback(() => {
    return entities.length;
  }, [entities]);

  const getCategoryEntities = useCallback(
    (category: EntityCategory) => {
      return entities.filter((e) => e.type === category);
    },
    [entities]
  );

  const importSelected = useCallback(async (campaignId: string) => {
    const selected = entities.filter((e) => e.selected);
    if (selected.length === 0) {
      toast({
        title: 'Nothing to import',
        description: 'Please select at least one item to import',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    const results = { success: 0, failed: 0 };
    const totalItems = selected.length;
    const pendingLocationParents: PendingParentLink[] = [];

    try {
      // Import in order: locations -> factions -> npcs -> items -> lore -> quests
      // This order ensures FKs can be resolved correctly

      // 1. Import Locations (first pass)
      const locationItems = selected.filter((e) => e.type === 'locations');
      for (const item of locationItems) {
        try {
          const pendingLink = await importLocation(campaignId, item.entity as ExtractedLocation);
          if (pendingLink) {
            pendingLocationParents.push(pendingLink);
          }
          results.success++;
        } catch (err) {
          console.error('Failed to import location:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      // 1b. Resolve location parent links (second pass)
      if (pendingLocationParents.length > 0) {
        await resolveLocationParents(campaignId, pendingLocationParents);
      }

      // 2. Import Factions
      const factionItems = selected.filter((e) => e.type === 'factions');
      for (const item of factionItems) {
        try {
          await importFaction(campaignId, item.entity as ExtractedFaction);
          results.success++;
        } catch (err) {
          console.error('Failed to import faction:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      // 3. Import NPCs (after locations and factions for FK resolution)
      const npcItems = selected.filter((e) => e.type === 'npcs');
      for (const item of npcItems) {
        try {
          await importNPC(campaignId, item.entity as ExtractedNPC);
          results.success++;
        } catch (err) {
          console.error('Failed to import NPC:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      // 4. Import Items
      const itemItems = selected.filter((e) => e.type === 'items');
      for (const item of itemItems) {
        try {
          await importItem(campaignId, item.entity as ExtractedItem);
          results.success++;
        } catch (err) {
          console.error('Failed to import item:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      // 5. Import Lore
      const loreItems = selected.filter((e) => e.type === 'lore');
      for (const item of loreItems) {
        try {
          await importLore(campaignId, item.entity as ExtractedLore);
          results.success++;
        } catch (err) {
          console.error('Failed to import lore:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      // 6. Import Quests (with objectives -> quest_steps)
      const questItems = selected.filter((e) => e.type === 'quests');
      for (const item of questItems) {
        try {
          await importQuest(campaignId, item.entity as ExtractedQuest);
          results.success++;
        } catch (err) {
          console.error('Failed to import quest:', err);
          results.failed++;
        }
        setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
      }

      toast({
        title: 'Import complete',
        description: `Imported ${results.success} items${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      });

      // Clear imported entities
      setEntities((prev) => prev.filter((e) => !e.selected));
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setProgress(100);
    }
  }, [entities, toast]);

  const reset = useCallback(() => {
    setEntities([]);
    setProgress(0);
    setError(null);
    setIsProcessing(false);
    setIsImporting(false);
  }, []);

  return {
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
  };
}

// Helper to read file content - supports .docx, .txt, .md
async function readFileContent(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // Handle Word documents (.docx)
  if (extension === 'docx') {
    const mammoth = await import('mammoth');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    if (!result.value || result.value.trim().length === 0) {
      throw new Error('Could not extract text from Word document');
    }
    return result.value;
  }
  
  // Handle plain text files (.txt, .md, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
