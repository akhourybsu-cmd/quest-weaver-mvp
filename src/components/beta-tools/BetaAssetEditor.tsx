import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Save, Eye, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BetaAsset } from "./BetaAssetCard";
import { BetaResultRenderer } from "./BetaResultRenderer";
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
  const [activeTab, setActiveTab] = useState<string>('edit');

  // Reset when asset changes
  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setStatus(asset.status);
      setTagsInput(asset.tags?.join(', ') || '');
      setData(asset.data || {});
      setActiveTab('edit');
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
      <DialogContent className="sm:max-w-2xl h-[85vh] max-h-[700px] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="font-cinzel">Edit Asset</DialogTitle>
        </DialogHeader>

        <div className="px-6 space-y-3 shrink-0">
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col px-6">
          <TabsList className="w-full justify-start shrink-0">
            <TabsTrigger value="edit" className="gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit Data
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full">
              <div className="space-y-3 pr-4 pb-2">
                {Object.entries(data).map(([key, value]) => {
                  // Boolean fields
                  if (typeof value === 'boolean') {
                    return (
                      <div key={key} className="flex items-center justify-between py-1">
                        <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Switch
                          checked={value}
                          onCheckedChange={(v) => setData(prev => ({ ...prev, [key]: v }))}
                        />
                      </div>
                    );
                  }

                  // Array of objects: render mini-cards
                  if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
                    return (
                      <div key={key} className="space-y-2">
                        <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                        {value.map((item, idx) => (
                          <div key={idx} className="border border-border rounded-md p-3 space-y-2 bg-muted/30">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">#{idx + 1}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-destructive hover:text-destructive"
                                aria-label={`Remove item ${idx + 1}`}
                                onClick={() => {
                                  const updated = [...value];
                                  updated.splice(idx, 1);
                                  setData(prev => ({ ...prev, [key]: updated }));
                                }}
                              >×</Button>
                            </div>
                            {Object.entries(item).map(([subKey, subVal]) => (
                              <div key={subKey} className="space-y-0.5">
                                <Label className="text-[10px] text-muted-foreground capitalize">{subKey.replace(/_/g, ' ')}</Label>
                                <Input
                                  value={String(subVal ?? '')}
                                  onChange={(e) => {
                                    const updated = [...value];
                                    updated[idx] = { ...updated[idx], [subKey]: e.target.value };
                                    setData(prev => ({ ...prev, [key]: updated }));
                                  }}
                                  className="text-sm h-8"
                                />
                              </div>
                            ))}
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => {
                            const template = Object.fromEntries(Object.keys(value[0]).map(k => [k, '']));
                            setData(prev => ({ ...prev, [key]: [...value, template] }));
                          }}
                        >+ Add {key.replace(/_/g, ' ').replace(/s$/, '')}</Button>
                      </div>
                    );
                  }

                  // Empty arrays
                  if (Array.isArray(value) && value.length === 0) {
                    return (
                      <div key={key} className="space-y-1">
                        <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                        <Textarea
                          value=""
                          onChange={(e) => {
                            setData(prev => ({ ...prev, [key]: e.target.value.split('\n').filter(Boolean) }));
                          }}
                          placeholder="One item per line..."
                          className="text-sm min-h-[50px]"
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                      <Textarea
                        value={Array.isArray(value) ? value.join('\n') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')}
                        onChange={(e) => {
                          const newVal = Array.isArray(value)
                            ? e.target.value.split('\n').filter(Boolean)
                            : e.target.value;
                          setData(prev => ({ ...prev, [key]: newVal }));
                        }}
                        className="text-sm min-h-[50px]"
                      />
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="flex-1 min-h-0 mt-3">
            <ScrollArea className="h-full">
              <div className="pr-4 pb-2">
                <BetaResultRenderer assetType={asset.asset_type} data={{ name, ...data }} />
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="px-6 pb-6 pt-3 border-t border-border shrink-0">
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