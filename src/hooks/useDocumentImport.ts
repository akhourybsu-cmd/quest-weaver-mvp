import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ExtractedEntities,
  SelectableEntity,
  EntityCategory,
  validateExtractedEntities,
  generateSlug,
  ExtractedNPC,
  ExtractedLocation,
  ExtractedItem,
  ExtractedFaction,
  ExtractedLore,
  ExtractedQuest,
} from '@/lib/documentImportSchema';
import { nanoid } from 'nanoid';

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

    try {
      // Import in order: locations -> factions -> npcs -> items -> lore -> quests
      const categories: EntityCategory[] = ['locations', 'factions', 'npcs', 'items', 'lore', 'quests'];

      for (const category of categories) {
        const categoryItems = selected.filter((e) => e.type === category);

        for (const item of categoryItems) {
          try {
            await importEntity(campaignId, category, item.entity);
            results.success++;
          } catch (err) {
            console.error(`Failed to import ${category}:`, err);
            results.failed++;
          }
          setProgress(Math.round(((results.success + results.failed) / totalItems) * 100));
        }
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

// Import a single entity to the database
async function importEntity(
  campaignId: string,
  category: EntityCategory,
  entity: AnyEntity
): Promise<void> {
  switch (category) {
    case 'npcs': {
      const npc = entity as ExtractedNPC;
      await supabase.from('npcs').insert({
        campaign_id: campaignId,
        name: npc.name,
        role: npc.role || null,
        description: npc.description || null,
        location: npc.location || null,
        alignment: npc.alignment || null,
        pronouns: npc.pronouns || null,
        tags: npc.tags || [],
        player_visible: false,
      });
      break;
    }
    case 'locations': {
      const loc = entity as ExtractedLocation;
      await supabase.from('locations').insert({
        campaign_id: campaignId,
        name: loc.name,
        location_type: loc.location_type || null,
        description: loc.description || null,
        tags: loc.tags || [],
        discovered: false,
      });
      break;
    }
    case 'items': {
      const item = entity as ExtractedItem;
      await supabase.from('items').insert({
        campaign_id: campaignId,
        name: item.name,
        type: item.type || null,
        rarity: item.rarity || 'common',
        description: item.description || null,
        properties: item.properties || {},
        tags: item.tags || [],
      });
      break;
    }
    case 'factions': {
      const faction = entity as ExtractedFaction;
      await supabase.from('factions').insert({
        campaign_id: campaignId,
        name: faction.name,
        description: faction.description || null,
        motto: faction.motto || null,
        influence_score: faction.influence_score || 50,
        tags: faction.tags || [],
      });
      break;
    }
    case 'lore': {
      const lore = entity as ExtractedLore;
      await supabase.from('lore_pages').insert({
        campaign_id: campaignId,
        title: lore.title,
        slug: generateSlug(lore.title),
        content_md: lore.content,
        excerpt: lore.excerpt || lore.content.substring(0, 200),
        category: lore.category || 'other',
        era: lore.era || null,
        tags: lore.tags || [],
        visibility: 'DM',
      });
      break;
    }
    case 'quests': {
      const quest = entity as ExtractedQuest;
      await supabase.from('quests').insert({
        campaign_id: campaignId,
        title: quest.title,
        description: quest.description || null,
        difficulty: quest.difficulty || null,
        quest_type: quest.quest_type || null,
        tags: quest.tags || [],
        player_visible: false,
        status: 'not_started',
      });
      break;
    }
  }
}
