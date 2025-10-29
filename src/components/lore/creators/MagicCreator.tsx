import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface PowerTier {
  tier: string;
  description: string;
}

interface MagicCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function MagicCreator({ campaignId, onSave, onCancel }: MagicCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // Magic-specific fields
  const [entryType, setEntryType] = useState("artifact");
  const [rarity, setRarity] = useState("uncommon");
  const [attunement, setAttunement] = useState(false);
  const [charges, setCharges] = useState("");
  const [sentience, setSentience] = useState(false);
  const [int, setInt] = useState("");
  const [wis, setWis] = useState("");
  const [cha, setCha] = useState("");
  const [ego, setEgo] = useState("");
  const [curse, setCurse] = useState("");
  const [powers, setPowers] = useState<PowerTier[]>([]);
  const [spells, setSpells] = useState<string[]>([]);
  const [opposedSchools, setOpposedSchools] = useState<string[]>([]);
  const [philosophy, setPhilosophy] = useState("");
  const [ruleText, setRuleText] = useState("");
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [impact, setImpact] = useState("");
  
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (entryType === "artifact" && sentience) {
      if (!int || !wis || !cha) {
        toast.error("Sentient artifacts require INT, WIS, and CHA");
        return;
      }
    }

    setSaving(true);
    try {
      const details = {
        entryType,
        rarity: entryType === "artifact" ? rarity : null,
        attunement: entryType === "artifact" ? attunement : null,
        charges: entryType === "artifact" && charges ? parseInt(charges) : null,
        sentience: entryType === "artifact" ? (sentience ? {
          int: parseInt(int),
          wis: parseInt(wis),
          cha: parseInt(cha),
          ego: ego ? parseInt(ego) : null
        } : null) : null,
        curse: entryType === "artifact" ? curse : null,
        powers: entryType === "artifact" ? powers : null,
        spells: entryType === "school" || entryType === "tradition" ? spells : null,
        opposedSchools: entryType === "school" ? opposedSchools : null,
        philosophy: entryType === "school" || entryType === "tradition" ? philosophy : null,
        ruleText: entryType === "law" ? ruleText : null,
        exceptions: entryType === "law" ? exceptions : null,
        impact: entryType === "law" ? impact : null
      };

      const { error } = await supabase.from("lore_pages").insert([{
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "magic",
        visibility,
        details: details as any
      }]);

      if (error) throw error;
      toast.success("Magic entry created successfully");
      onSave();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const addToList = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
    }
  };

  const addPowerTier = () => {
    setPowers([...powers, { tier: "", description: "" }]);
  };

  const updatePowerTier = (index: number, field: keyof PowerTier, value: string) => {
    const newPowers = [...powers];
    newPowers[index][field] = value;
    setPowers(newPowers);
  };

  const removePowerTier = (index: number) => {
    setPowers(powers.filter((_, i) => i !== index));
  };

  return (
    <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
      <div className="space-y-6 pb-6">
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Staff of the Archmagi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="staff-archmagi"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Entry Type</Label>
            <ToggleGroup type="single" value={entryType} onValueChange={setEntryType}>
              <ToggleGroupItem value="artifact">Artifact</ToggleGroupItem>
              <ToggleGroupItem value="school">School</ToggleGroupItem>
              <ToggleGroupItem value="tradition">Tradition</ToggleGroupItem>
              <ToggleGroupItem value="law">Law/Rule</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="A brief overview..."
              rows={2}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DM_ONLY">DM Only</SelectItem>
                  <SelectItem value="SHARED">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="evocation, legendary"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setTags(tags.filter(t => t !== tag))} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {entryType === "artifact" && (
          <Card>
            <CardHeader>
              <CardTitle>Artifact Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Rarity</Label>
                  <Select value={rarity} onValueChange={setRarity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="common">Common</SelectItem>
                      <SelectItem value="uncommon">Uncommon</SelectItem>
                      <SelectItem value="rare">Rare</SelectItem>
                      <SelectItem value="very_rare">Very Rare</SelectItem>
                      <SelectItem value="legendary">Legendary</SelectItem>
                      <SelectItem value="artifact">Artifact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 flex items-end">
                  <div className="flex items-center gap-2">
                    <Switch checked={attunement} onCheckedChange={setAttunement} />
                    <Label>Requires Attunement</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Charges</Label>
                  <Input type="number" value={charges} onChange={(e) => setCharges(e.target.value)} placeholder="Optional" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch checked={sentience} onCheckedChange={setSentience} />
                  <Label>Sentient</Label>
                </div>
                {sentience && (
                  <div className="grid grid-cols-4 gap-2 pl-6">
                    <Input type="number" value={int} onChange={(e) => setInt(e.target.value)} placeholder="INT *" />
                    <Input type="number" value={wis} onChange={(e) => setWis(e.target.value)} placeholder="WIS *" />
                    <Input type="number" value={cha} onChange={(e) => setCha(e.target.value)} placeholder="CHA *" />
                    <Input type="number" value={ego} onChange={(e) => setEgo(e.target.value)} placeholder="Ego" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Powers by Tier</Label>
                {powers.map((power, idx) => (
                  <div key={idx} className="flex gap-2 items-start">
                    <Input
                      value={power.tier}
                      onChange={(e) => updatePowerTier(idx, "tier", e.target.value)}
                      placeholder="Tier label"
                      className="w-32"
                    />
                    <Textarea
                      value={power.description}
                      onChange={(e) => updatePowerTier(idx, "description", e.target.value)}
                      placeholder="Power description"
                      rows={2}
                      className="flex-1"
                    />
                    <Button variant="ghost" size="icon" onClick={() => removePowerTier(idx)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addPowerTier}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Power Tier
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Curse</Label>
                <Textarea value={curse} onChange={(e) => setCurse(e.target.value)} placeholder="Any curse or drawback..." rows={3} />
              </div>
            </CardContent>
          </Card>
        )}

        {(entryType === "school" || entryType === "tradition") && (
          <Card>
            <CardHeader>
              <CardTitle>{entryType === "school" ? "School of Magic" : "Arcane Tradition"} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Associated Spells</Label>
                <Input
                  placeholder="Fireball, Lightning Bolt"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, spells, setSpells);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {spells.map(s => (
                    <Badge key={s} variant="outline">
                      {s}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setSpells(spells.filter(x => x !== s))} />
                    </Badge>
                  ))}
                </div>
              </div>
              {entryType === "school" && (
                <div className="space-y-2">
                  <Label>Opposed Schools</Label>
                  <Input
                    placeholder="Necromancy"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addToList(e.currentTarget.value, opposedSchools, setOpposedSchools);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <div className="flex flex-wrap gap-2">
                    {opposedSchools.map(o => (
                      <Badge key={o} variant="destructive">
                        {o}
                        <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setOpposedSchools(opposedSchools.filter(x => x !== o))} />
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Philosophies / Methods</Label>
                <Textarea value={philosophy} onChange={(e) => setPhilosophy(e.target.value)} rows={4} />
              </div>
            </CardContent>
          </Card>
        )}

        {entryType === "law" && (
          <Card>
            <CardHeader>
              <CardTitle>Magical Law Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Rule Text</Label>
                <Textarea value={ruleText} onChange={(e) => setRuleText(e.target.value)} placeholder="The law as stated..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label>Known Exceptions</Label>
                <Input
                  placeholder="Exception case"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addToList(e.currentTarget.value, exceptions, setExceptions);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  {exceptions.map(ex => (
                    <Badge key={ex} variant="secondary">
                      {ex}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setExceptions(exceptions.filter(x => x !== ex))} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>World Impact</Label>
                <Textarea value={impact} onChange={(e) => setImpact(e.target.value)} placeholder="How this affects the world..." rows={4} />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          <Label>Full Description</Label>
          <p className="text-xs text-muted-foreground">
            Use: [[Page]], @NPC, #Location, %Faction, !Quest, $Item
          </p>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="font-mono"
              />
            </TabsContent>
            <TabsContent value="preview">
              <div className="prose prose-sm max-w-none p-4 border rounded-md min-h-[300px]">
                {content || <span className="text-muted-foreground">No content yet...</span>}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Entry"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
