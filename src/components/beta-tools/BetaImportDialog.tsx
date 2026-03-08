import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BetaAsset } from "./BetaAssetCard";

interface BetaImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: BetaAsset | null;
  onImported?: () => void;
}

type ImportMode = 'draft' | 'canon' | 'clone';

const IMPORTABLE_TYPES = ['npc', 'quest', 'magic_item', 'settlement'];

export function BetaImportDialog({ open, onOpenChange, asset, onImported }: BetaImportDialogProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [importMode, setImportMode] = useState<ImportMode>('draft');
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    supabase
      .from('campaigns')
      .select('id, name')
      .eq('dm_user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data }) => {
        if (data) setCampaigns(data);
      });
  }, [open, userId]);

  const canImport = asset && IMPORTABLE_TYPES.includes(asset.asset_type);

  const handleImport = async () => {
    if (!asset || !selectedCampaign || !userId) return;
    setIsImporting(true);

    try {
      const d = asset.data;

      // Insert into the appropriate campaign table
      if (asset.asset_type === 'npc') {
        const { error } = await supabase.from('npcs').insert({
          campaign_id: selectedCampaign,
          name: asset.name,
          role: d.role || null,
          description: d.appearance || d.description || null,
          gm_notes: [d.background, d.goals, d.fears].filter(Boolean).join('\n\n'),
          secrets: d.secrets || null,
          alignment: d.alignment || null,
          pronouns: d.pronouns || null,
          status: importMode === 'canon' ? 'alive' : 'unknown',
        });
        if (error) throw error;
      } else if (asset.asset_type === 'quest') {
        const { error } = await supabase.from('quests').insert({
          campaign_id: selectedCampaign,
          title: asset.name,
          description: d.description || null,
          difficulty: d.difficulty || null,
          quest_type: d.quest_type || null,
          dm_notes: [d.complications, d.twists].filter(Boolean).map((f: any) => Array.isArray(f) ? f.join(', ') : f).join('\n\n') || null,
          status: importMode === 'canon' ? 'active' : 'draft',
        });
        if (error) throw error;
      } else if (asset.asset_type === 'magic_item') {
        const VALID_RARITIES = ['Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary', 'Artifact'];
        const rarity = VALID_RARITIES.includes(d.rarity) ? d.rarity : null;
        const { error } = await supabase.from('items').insert({
          campaign_id: selectedCampaign,
          name: asset.name,
          description: d.description || null,
          rarity,
          type: 'MAGIC',
          properties: d.properties ? { text: d.properties, item_type: d.item_type } : (d.item_type ? { item_type: d.item_type } : null),
        });
        if (error) throw error;
      } else if (asset.asset_type === 'settlement') {
        const { error } = await supabase.from('locations').insert({
          campaign_id: selectedCampaign,
          name: asset.name,
          description: d.sensory_description || d.description || null,
          location_type: d.settlement_type || 'settlement',
          details: d,
        });
        if (error) throw error;
      }

      // Update beta asset status
      if (importMode !== 'clone') {
        await supabase.from('beta_assets').update({
          status: 'imported',
          imported_to_campaign_id: selectedCampaign,
          imported_at: new Date().toISOString(),
        }).eq('id', asset.id);
      }

      toast({ title: "Import successful!", description: `${asset.name} imported to campaign.` });
      onImported?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Import failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-amber-400" />
            Import to Campaign
          </DialogTitle>
        </DialogHeader>

        {!canImport ? (
          <div className="py-4 text-center text-muted-foreground">
            <p>This asset type ({asset?.asset_type}) cannot be imported to campaigns yet.</p>
            <p className="text-xs mt-1">Import is available for NPCs, Quests, Magic Items, and Settlements.</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Asset</Label>
              <div className="flex items-center gap-2">
                <span className="font-medium">{asset?.name}</span>
                <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400">{asset?.asset_type}</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Campaign</Label>
              <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a campaign" />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Import Mode</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Import as Draft</SelectItem>
                  <SelectItem value="canon">Import as Canon</SelectItem>
                  <SelectItem value="clone">Clone Only (keep standalone)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {importMode === 'draft' && 'Asset will be added as a draft in your campaign.'}
                {importMode === 'canon' && 'Asset will be added as active canon in your campaign.'}
                {importMode === 'clone' && 'A copy will be created in your campaign. The original stays standalone.'}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {canImport && (
            <Button
              onClick={handleImport}
              disabled={!selectedCampaign || isImporting}
              className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black"
            >
              {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              Import
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
