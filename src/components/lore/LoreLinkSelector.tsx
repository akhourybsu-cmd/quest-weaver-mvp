import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Book, Plus, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LorePage {
  id: string;
  title: string;
  category: string;
}

interface LoreLinkSelectorProps {
  campaignId: string;
  /** The lore category to filter by (e.g., "factions", "npcs", "regions") */
  category: string;
  /** Current linked lore page ID */
  value: string | null;
  /** Callback when selection changes */
  onChange: (lorePageId: string | null) => void;
  /** Label text */
  label?: string;
  /** Name of the entity for auto-creation */
  entityName?: string;
  /** Optional callback after auto-creating a lore page */
  onLoreCreated?: (lorePageId: string) => void;
}

const LoreLinkSelector = ({
  campaignId,
  category,
  value,
  onChange,
  label = "Linked Lore Page",
  entityName,
  onLoreCreated,
}: LoreLinkSelectorProps) => {
  const [lorePages, setLorePages] = useState<LorePage[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLorePages();
  }, [campaignId, category]);

  const loadLorePages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("lore_pages")
        .select("id, title, category")
        .eq("campaign_id", campaignId)
        .eq("category", category)
        .order("title");

      if (error) throw error;
      setLorePages(data || []);
    } catch (error) {
      console.error("Error loading lore pages:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLorePage = async () => {
    if (!entityName) return;
    
    setCreating(true);
    try {
      const slug = entityName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      const { data, error } = await supabase
        .from("lore_pages")
        .insert({
          campaign_id: campaignId,
          title: entityName,
          category,
          slug,
          content_md: `# ${entityName}\n\n*Add lore content here...*`,
          visibility: "DM_ONLY",
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Lore page created",
        description: `Created "${entityName}" lore entry and linked it.`,
      });

      // Refresh the list and select the new page
      await loadLorePages();
      onChange(data.id);
      onLoreCreated?.(data.id);
    } catch (error: any) {
      toast({
        title: "Error creating lore page",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const selectedPage = lorePages.find(p => p.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Book className="w-4 h-4 text-muted-foreground" />
          {label}
        </Label>
        {value && selectedPage && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => {
              // Open lore page in new context (could be improved with proper navigation)
              toast({
                title: "Linked to Lore",
                description: `This is linked to "${selectedPage.title}" in the Lore tab.`,
              });
            }}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            View
          </Button>
        )}
      </div>
      
      <div className="flex gap-2">
        <Select 
          value={value || "none"} 
          onValueChange={(v) => onChange(v === "none" ? null : v)}
          disabled={loading}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={loading ? "Loading..." : "Select lore page..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— No linked lore —</SelectItem>
            {lorePages.map((page) => (
              <SelectItem key={page.id} value={page.id}>
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {entityName && !value && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleCreateLorePage}
            disabled={creating}
            title="Create new lore page"
          >
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Link to a lore entry for rich world-building content
      </p>
    </div>
  );
};

export default LoreLinkSelector;
