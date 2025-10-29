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
import { X } from "lucide-react";
import { toast } from "sonner";

interface RegionCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function RegionCreator({ campaignId, onSave, onCancel }: RegionCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  const [era, setEra] = useState("");
  
  // Region-specific fields
  const [regionType, setRegionType] = useState("city");
  const [parentRegion, setParentRegion] = useState("");
  const [population, setPopulation] = useState("");
  const [government, setGovernment] = useState("");
  const [climate, setClimate] = useState<string[]>([]);
  const [exports, setExports] = useState<string[]>([]);
  const [imports, setImports] = useState<string[]>([]);
  const [mapX, setMapX] = useState("");
  const [mapY, setMapY] = useState("");
  const [addToMap, setAddToMap] = useState(false);
  const [travelNotes, setTravelNotes] = useState("");
  
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
    if (!regionType) {
      toast.error("Region Type is required");
      return;
    }
    if (addToMap && (!mapX || !mapY)) {
      toast.error("Map coordinates required when 'Add to Map' is enabled");
      return;
    }

    setSaving(true);
    try {
      const details = {
        type: regionType,
        parentId: parentRegion || null,
        population,
        government,
        climate,
        exports,
        imports,
        mapPin: addToMap ? { x: parseFloat(mapX), y: parseFloat(mapY), enabled: true } : null,
        travelNotes
      };

      const { error } = await supabase.from("lore_pages").insert({
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "regions",
        visibility,
        era: era || null,
        details
      });

      if (error) throw error;
      toast.success("Region created successfully");
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

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
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
                placeholder="The Emerald Coast"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="emerald-coast"
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

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="regionType">Region Type *</Label>
              <Select value={regionType} onValueChange={setRegionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="continent">Continent</SelectItem>
                  <SelectItem value="nation">Nation</SelectItem>
                  <SelectItem value="province">Province</SelectItem>
                  <SelectItem value="city">City</SelectItem>
                  <SelectItem value="district">District</SelectItem>
                  <SelectItem value="dungeon">Dungeon</SelectItem>
                  <SelectItem value="landmark">Landmark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentRegion">Parent Region</Label>
              <Select value={parentRegion} onValueChange={setParentRegion}>
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
              <Label htmlFor="era">Era / Date</Label>
              <Input
                id="era"
                value={era}
                onChange={(e) => setEra(e.target.value)}
                placeholder="3rd Age"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (press Enter to add)</Label>
            <Input
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              placeholder="coastal, trade-hub"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map(tag => (
                <Badge key={tag} variant="secondary">
                  {tag}
                  <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Region Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Population</Label>
                <Input value={population} onChange={(e) => setPopulation(e.target.value)} placeholder="~50,000" />
              </div>
              <div className="space-y-2">
                <Label>Government Type</Label>
                <Input value={government} onChange={(e) => setGovernment(e.target.value)} placeholder="Republic" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Climate & Terrain (comma separated)</Label>
              <Input
                placeholder="temperate, coastal, forest"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip(e.currentTarget.value, climate, setClimate);
                    e.currentTarget.value = "";
                  }
                }}
              />
              <div className="flex flex-wrap gap-2">
                {climate.map(c => (
                  <Badge key={c} variant="outline">
                    {c}
                    <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setClimate(climate.filter(x => x !== c))} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exports</Label>
                <Input
                  placeholder="wine, silk"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChip(e.currentTarget.value, exports, setExports);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {exports.map(exp => (
                    <Badge key={exp} variant="secondary" className="text-xs">
                      {exp}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setExports(exports.filter(x => x !== exp))} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Imports</Label>
                <Input
                  placeholder="iron, grain"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChip(e.currentTarget.value, imports, setImports);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                <div className="flex flex-wrap gap-1">
                  {imports.map(imp => (
                    <Badge key={imp} variant="secondary" className="text-xs">
                      {imp}
                      <X className="w-3 h-3 ml-1 cursor-pointer" onClick={() => setImports(imports.filter(x => x !== imp))} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={addToMap} onCheckedChange={setAddToMap} />
                <Label>Add to Campaign Map</Label>
              </div>
              {addToMap && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <Input type="number" placeholder="X" value={mapX} onChange={(e) => setMapX(e.target.value)} />
                  <Input type="number" placeholder="Y" value={mapY} onChange={(e) => setMapY(e.target.value)} />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Travel Notes</Label>
              <Textarea
                value={travelNotes}
                onChange={(e) => setTravelNotes(e.target.value)}
                placeholder="2 days south of the capital..."
                rows={3}
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
            {saving ? "Saving..." : "Save Region"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
