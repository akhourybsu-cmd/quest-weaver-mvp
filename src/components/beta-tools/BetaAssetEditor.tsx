import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BetaAsset } from "./BetaAssetCard";
import { STATUS_LABELS } from "./toolRegistry";

interface BetaAssetEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: BetaAsset | null;
  onSaved?: () => void;
}

export function BetaAssetEditor({ open, onOpenChange, asset, onSaved }: BetaAssetEditorProps) {
  const { toast } = useToast();
  const [name, setName] = useState(asset?.name || '');
  const [status, setStatus] = useState(asset?.status || 'draft');
  const [tagsInput, setTagsInput] = useState(asset?.tags?.join(', ') || '');
  const [data, setData] = useState<Record<string, any>>(asset?.data || {});
  const [isSaving, setIsSaving] = useState(false);

  // Reset when asset changes
  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setStatus(asset.status);
      setTagsInput(asset.tags?.join(', ') || '');
      setData(asset.data || {});
    }
  }, [asset]);

  const handleSave = async () => {
    if (!asset) return;
    setIsSaving(true);
    try {
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const { error } = await supabase.from('beta_assets').update({
        name,
        status,
        tags,
        data,
      }).eq('id', asset.id);

      if (error) throw error;
      toast({ title: "Asset updated" });
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast({ title: "Update failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (!asset) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="e.g. villain, underdark, tier-3" />
          </div>

          {/* Data fields */}
          <div className="space-y-3 border-t pt-3">
            <Label className="text-amber-400">Asset Data</Label>
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                <Textarea
                  value={Array.isArray(value) ? value.join('\n') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value || '')}
                  onChange={(e) => {
                    const newVal = Array.isArray(value)
                      ? e.target.value.split('\n').filter(Boolean)
                      : e.target.value;
                    setData(prev => ({ ...prev, [key]: newVal }));
                  }}
                  className="text-sm min-h-[50px]"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
