import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, ChevronDown, Save, RefreshCw, Pencil, Globe } from "lucide-react";
import { BetaTool } from "./toolRegistry";
import { BetaResultRenderer } from "./BetaResultRenderer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { buildCampaignContext } from "@/lib/campaignContextBuilder";
import type { AssetType } from "@/lib/campaignContextBuilder";

interface BetaGeneratorFormProps {
  tool: BetaTool;
  onSaved?: (assetId: string) => void;
}

export function BetaGeneratorForm({ tool, onSaved }: BetaGeneratorFormProps) {
  const { userId } = useAuth();
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [structuredFields, setStructuredFields] = useState<Record<string, any>>({});
  const [showFields, setShowFields] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Record<string, any> | null>(null);
  const [assumptions, setAssumptions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedResult, setEditedResult] = useState<Record<string, any> | null>(null);
  const [saveTags, setSaveTags] = useState("");
  const [useCampaignContext, setUseCampaignContext] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [campaigns, setCampaigns] = useState<{ id: string; name: string }[]>([]);

  // Reset all form state when switching tools
  useEffect(() => {
    setPrompt("");
    setStructuredFields({});
    setShowFields(false);
    setResult(null);
    setEditedResult(null);
    setAssumptions([]);
    setIsEditing(false);
    setUseCampaignContext(false);
    setSelectedCampaignId("");
    setSaveTags("");
  }, [tool.id]);

  useEffect(() => {
    if (!useCampaignContext || !userId) return;
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("dm_user_id", userId)
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        if (data) setCampaigns(data);
      });
  }, [useCampaignContext, userId]);

  const handleGenerate = async () => {
    if (!prompt.trim() && Object.values(structuredFields).every(v => !v)) {
      toast({ title: "Enter a prompt or fill in some fields", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setResult(null);
    setIsEditing(false);

    try {
      const existingFields: Record<string, any> = {};
      for (const [key, value] of Object.entries(structuredFields)) {
        if (value && value !== '') existingFields[key] = value;
      }

      // Build campaign context if enabled
      let campaignContext = null;
      let standalone = true;
      if (useCampaignContext && selectedCampaignId) {
        const CONTEXT_ASSET_TYPES: AssetType[] = ['npc', 'location', 'faction', 'item', 'quest', 'lore'];
        const contextType = CONTEXT_ASSET_TYPES.includes(tool.assetType as AssetType)
          ? (tool.assetType as AssetType)
          : 'npc';
        campaignContext = await buildCampaignContext(selectedCampaignId, contextType);
        standalone = false;
      }

      const { data, error } = await supabase.functions.invoke('generate-asset', {
        body: {
          asset_type: tool.assetType,
          user_prompt: prompt || `Generate a ${tool.name.toLowerCase()}`,
          existing_fields: existingFields,
          locked_fields: Object.keys(existingFields),
          campaign_context: campaignContext,
          standalone,
        },
      });

      if (error) throw error;
      if (data.error) {
        if (data.error.includes("Rate limit")) {
          toast({ title: "Please wait", description: "AI is busy, try again in a moment.", variant: "destructive" });
        } else if (data.error.includes("credits")) {
          toast({ title: "Credits exhausted", description: "AI credits have been used up.", variant: "destructive" });
        }
        throw new Error(data.error);
      }

      const generated = { ...existingFields, ...data.filled_fields };
      setResult(generated);
      setEditedResult(generated);
      setAssumptions(data.assumptions || []);
    } catch (err) {
      toast({ title: "Generation failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!userId || !editedResult) return;
    setIsSaving(true);
    try {
      const name = editedResult.name || editedResult.title || editedResult.event_name || `Untitled ${tool.name}`;
      const { data, error } = await supabase.from('beta_assets').insert({
        user_id: userId,
        asset_type: tool.assetType,
        name,
        data: editedResult,
        status: 'draft',
      }).select('id').single();

      if (error) throw error;
      toast({ title: "Saved to Beta Library!", description: `${name} has been saved.` });
      onSaved?.(data.id);
      // Reset for next generation
      setResult(null);
      setEditedResult(null);
      setPrompt("");
      setStructuredFields({});
    } catch (err) {
      toast({ title: "Save failed", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const displayResult = isEditing ? editedResult : result;

  return (
    <div className="space-y-6">
      {/* Prompt area */}
      <div className="space-y-3">
        <Label className="text-foreground font-cinzel">Describe what you want to create</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe your ${tool.name.toLowerCase()} in detail, or just give a few keywords...`}
          className="min-h-[100px]"
        />
        {/* Quick prompts */}
        {tool.examplePrompts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tool.examplePrompts.map((ep, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer border-secondary/30 text-secondary hover:bg-secondary/10 transition-colors text-xs"
                onClick={() => setPrompt(ep)}
              >
                {ep.length > 60 ? ep.slice(0, 57) + '...' : ep}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Structured fields */}
      {tool.fields.length > 0 && (
        <Collapsible open={showFields} onOpenChange={setShowFields}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="text-primary hover:text-primary-hover p-0 h-auto">
              <ChevronDown className={`h-4 w-4 mr-1 transition-transform ${showFields ? 'rotate-180' : ''}`} />
              {showFields ? 'Hide' : 'Show'} structured fields
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tool.fields.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  {field.type === 'select' && field.options ? (
                    <Select
                      value={structuredFields[field.key] || ''}
                      onValueChange={(v) => setStructuredFields(prev => ({ ...prev, [field.key]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(opt => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'boolean' ? (
                    <Switch
                      checked={!!structuredFields[field.key]}
                      onCheckedChange={(v) => setStructuredFields(prev => ({ ...prev, [field.key]: v }))}
                    />
                  ) : (
                    <Input
                      value={structuredFields[field.key] || ''}
                      onChange={(e) => setStructuredFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder || ''}
                    />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Campaign context toggle */}
      <Card className="border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-brand-brass" />
            <Label className="text-sm text-foreground">Use Campaign Context</Label>
          </div>
          <Switch
            checked={useCampaignContext}
            onCheckedChange={setUseCampaignContext}
          />
        </div>
        {useCampaignContext && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Campaign</Label>
            {campaigns.length === 0 ? (
              <p className="text-xs text-muted-foreground">No campaigns found.</p>
            ) : (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a campaign..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="text-[11px] text-muted-foreground">
              Generation will reference your campaign's NPCs, factions, locations, and lore for consistency.
            </p>
          </div>
        )}
      </Card>

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Generate {tool.name.replace(' Generator', '')}
          </>
        )}
      </Button>

      {/* Result preview */}
      {displayResult && (
        <Card className="border-border bg-card">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              {isEditing ? (
                <Input
                  value={displayResult.name || displayResult.title || displayResult.event_name || ''}
                  onChange={(e) => {
                    const nameKey = displayResult.title ? 'title' : displayResult.event_name ? 'event_name' : 'name';
                    setEditedResult(prev => prev ? { ...prev, [nameKey]: e.target.value } : null);
                  }}
                  className="font-cinzel font-bold text-lg text-foreground max-w-[60%]"
                  placeholder="Asset name..."
                />
              ) : (
                <h3 className="font-cinzel font-bold text-lg text-foreground">
                  {displayResult.name || displayResult.title || displayResult.event_name || 'Generated Result'}
                </h3>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Fields display/edit */}
            {isEditing ? (
              <div className="grid gap-3">
                {Object.entries(displayResult).map(([key, value]) => {
                  if (key === 'name' || key === 'title' || key === 'event_name') return null;
                  return (
                    <div key={key} className="space-y-1">
                      <Label className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</Label>
                      <Textarea
                        value={typeof value === 'string' ? value : Array.isArray(value) ? value.join('\n') : JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          const newVal = Array.isArray(result?.[key])
                            ? e.target.value.split('\n').filter(Boolean)
                            : e.target.value;
                          setEditedResult(prev => prev ? { ...prev, [key]: newVal } : null);
                        }}
                        className="text-sm min-h-[60px]"
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <BetaResultRenderer assetType={tool.assetType} data={displayResult} />
            )}

            {/* Assumptions */}
            {assumptions.length > 0 && (
              <div className="border-t border-border pt-3">
                <Label className="text-xs text-muted-foreground">AI Assumptions</Label>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {assumptions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}

            {/* Tags input */}
            <div className="border-t border-border pt-3 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tags (optional, comma-separated)</Label>
              <Input
                value={saveTags}
                onChange={(e) => setSaveTags(e.target.value)}
                placeholder="e.g. villain, underdark, tier-3"
                className="text-sm"
              />
            </div>

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="secondary"
              className="w-full font-semibold"
            >
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save to Beta Library
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
