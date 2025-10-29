import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface FactionCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function FactionCreator({ campaignId, onSave, onCancel }: FactionCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // Faction-specific fields
  const [alignment, setAlignment] = useState("N");
  const [motto, setMotto] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [powerLevel, setPowerLevel] = useState([3]);
  const [hqRegion, setHqRegion] = useState("");
  const [reputation, setReputation] = useState([0]);
  const [goals, setGoals] = useState("");
  
  const [regions, setRegions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  useEffect(() => {
    loadRegions();
  }, [campaignId]);

  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title]);

  const loadRegions = async () => {
    const { data } = await supabase
      .from("lore_pages")
      .select("id, title")
      .eq("campaign_id", campaignId)
      .eq("category", "regions");
    if (data) setRegions(data);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setSaving(true);
    try {
      const details = {
        alignment,
        motto,
        colors,
        powerLevel: powerLevel[0],
        hqRegionId: hqRegion || null,
        reputation: reputation[0],
        goals
      };

      const { error } = await supabase.from("lore_pages").insert({
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "factions",
        visibility,
        details
      });

      if (error) throw error;
      toast.success("Faction created successfully");
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

  const addColor = (value: string) => {
    if (value.trim() && !colors.includes(value.trim())) {
      setColors([...colors, value.trim()]);
    }
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
                placeholder="The Iron Brotherhood"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="iron-brotherhood"
              />
            </div>
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

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="alignment">Alignment</Label>
              <Select value={alignment} onValueChange={setAlignment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LG">Lawful Good</SelectItem>
                  <SelectItem value="NG">Neutral Good</SelectItem>
                  <SelectItem value="CG">Chaotic Good</SelectItem>
                  <SelectItem value="LN">Lawful Neutral</SelectItem>
                  <SelectItem value="N">True Neutral</SelectItem>
                  <SelectItem value="CN">Chaotic Neutral</SelectItem>
                  <SelectItem value="LE">Lawful Evil</SelectItem>
                  <SelectItem value="NE">Neutral Evil</SelectItem>
                  <SelectItem value="CE">Chaotic Evil</SelectItem>
                  <SelectItem value="Unaligned">Unaligned</SelectItem>
                </SelectContent>
              </Select>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="hqRegion">Headquarters</Label>
              <Select value={hqRegion} onValueChange={setHqRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
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
              placeholder="military, secretive"
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

        <Card>
          <CardHeader>
            <CardTitle>Faction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Motto</Label>
              <Input value={motto} onChange={(e) => setMotto(e.target.value)} placeholder="Strength in Unity" />
            </div>

            <div className="space-y-2">
              <Label>Colors (press Enter to add)</Label>
              <Input
                placeholder="crimson, gold"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                  <Badge key={c} variant="outline">
                    {c}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setColors(colors.filter(x => x !== c))} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Power Level: {powerLevel[0]}</Label>
              <Slider
                value={powerLevel}
                onValueChange={setPowerLevel}
                min={1}
                max={5}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Minor</span>
                <span>Regional</span>
                <span>Continental</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reputation with Party: {reputation[0]}</Label>
              <Slider
                value={reputation}
                onValueChange={setReputation}
                min={-100}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Hostile</span>
                <span>Neutral</span>
                <span>Allied</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Goals & Tactics</Label>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What does this faction want and how do they achieve it?"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

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
            {saving ? "Saving..." : "Save Faction"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
