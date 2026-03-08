import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Sparkles, ChevronDown, Save, RefreshCw, Pencil } from "lucide-react";
import { BetaTool } from "./toolRegistry";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

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

      const { data, error } = await supabase.functions.invoke('generate-asset', {
        body: {
          asset_type: tool.assetType,
          user_prompt: prompt || `Generate a ${tool.name.toLowerCase()}`,
          existing_fields: existingFields,
          locked_fields: Object.keys(existingFields),
          campaign_context: null,
          standalone: true,
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
        <Label className="text-amber-200">Describe what you want to create</Label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={`Describe your ${tool.name.toLowerCase()} in detail, or just give a few keywords...`}
          className="min-h-[100px] border-amber-500/20 focus-visible:ring-amber-500/30 bg-background/50"
        />
        {/* Quick prompts */}
        {tool.examplePrompts.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tool.examplePrompts.map((ep, i) => (
              <Badge
                key={i}
                variant="outline"
                className="cursor-pointer border-amber-500/30 text-amber-300 hover:bg-amber-500/10 transition-colors text-xs"
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
            <Button variant="ghost" className="text-amber-400 hover:text-amber-300 p-0 h-auto">
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
                      <SelectTrigger className="border-amber-500/20">
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
                      className="border-amber-500/20"
                    />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Generate button */}
      <Button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-semibold"
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
        <Card className="border-amber-500/20 bg-gradient-to-b from-amber-950/10 to-background">
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg text-amber-100">
                {displayResult.name || displayResult.title || displayResult.event_name || 'Generated Result'}
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="border-amber-500/30 text-amber-300">
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  {isEditing ? 'Preview' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} disabled={isGenerating} className="border-amber-500/30 text-amber-300">
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Fields display/edit */}
            <div className="grid gap-3">
              {Object.entries(displayResult).map(([key, value]) => {
                if (key === 'name' || key === 'title' || key === 'event_name') return null;
                const displayValue = Array.isArray(value) ? value.join('\n• ') : typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);

                return (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs text-amber-400/70 capitalize">{key.replace(/_/g, ' ')}</Label>
                    {isEditing ? (
                      <Textarea
                        value={typeof value === 'string' ? value : Array.isArray(value) ? value.join('\n') : JSON.stringify(value, null, 2)}
                        onChange={(e) => {
                          const newVal = Array.isArray(result?.[key])
                            ? e.target.value.split('\n').filter(Boolean)
                            : e.target.value;
                          setEditedResult(prev => prev ? { ...prev, [key]: newVal } : null);
                        }}
                        className="border-amber-500/20 text-sm min-h-[60px]"
                      />
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {Array.isArray(value) ? '• ' + value.join('\n• ') : displayValue}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Assumptions */}
            {assumptions.length > 0 && (
              <div className="border-t border-amber-500/10 pt-3">
                <Label className="text-xs text-muted-foreground">AI Assumptions</Label>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  {assumptions.map((a, i) => <li key={i}>• {a}</li>)}
                </ul>
              </div>
            )}

            {/* Save button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-semibold"
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
