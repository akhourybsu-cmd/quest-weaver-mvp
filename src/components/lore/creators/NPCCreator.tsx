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
import { X } from "lucide-react";
import { toast } from "sonner";

interface NPCCreatorProps {
  campaignId: string;
  onSave: () => void;
  onCancel: () => void;
}

export default function NPCCreator({ campaignId, onSave, onCancel }: NPCCreatorProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  
  // NPC-specific fields
  const [race, setRace] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [role, setRole] = useState("");
  const [cr, setCr] = useState("");
  const [statBlockUrl, setStatBlockUrl] = useState("");
  const [homeRegion, setHomeRegion] = useState("");
  const [traits, setTraits] = useState("");
  const [ideals, setIdeals] = useState("");
  const [bonds, setBonds] = useState("");
  const [flaws, setFlaws] = useState("");
  const [voice, setVoice] = useState("");
  const [secrets, setSecrets] = useState("");
  
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
    if (!race.trim()) {
      toast.error("Race/Species is required");
      return;
    }
    if (cr && parseFloat(cr) < 0) {
      toast.error("CR must be >= 0");
      return;
    }

    setSaving(true);
    try {
      const details = {
        race,
        age,
        gender,
        role,
        cr: cr ? parseFloat(cr) : null,
        statBlockUrl,
        homeRegionId: homeRegion || null,
        personality: { traits, ideals, bonds, flaws },
        voice,
        secrets
      };

      const { error } = await supabase.from("lore_pages").insert({
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "npcs",
        visibility,
        details
      });

      if (error) throw error;
      toast.success("NPC created successfully");
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

  return (
    <ScrollArea className="h-[calc(90vh-12rem)] pr-4">
      <div className="space-y-6 pb-6">
        <div className="grid gap-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Name *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Garrick Ironforge"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="garrick-ironforge"
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
              <Label htmlFor="race">Race/Species *</Label>
              <Input
                id="race"
                value={race}
                onChange={(e) => setRace(e.target.value)}
                placeholder="Dwarf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="150"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Gender/Pronouns</Label>
              <Input
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                placeholder="He/Him"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Occupation/Role</Label>
              <Input
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Blacksmith"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cr">CR (optional)</Label>
              <Input
                id="cr"
                type="number"
                value={cr}
                onChange={(e) => setCr(e.target.value)}
                placeholder="5"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="homeRegion">Home Region (optional)</Label>
              <Select value={homeRegion} onValueChange={setHomeRegion}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="statBlockUrl">Stat Block Link</Label>
              <Input
                id="statBlockUrl"
                value={statBlockUrl}
                onChange={(e) => setStatBlockUrl(e.target.value)}
                placeholder="https://..."
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
              placeholder="merchant, ally"
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
            <CardTitle>Personality</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Traits</Label>
                <Input value={traits} onChange={(e) => setTraits(e.target.value)} placeholder="Gruff but kind" />
              </div>
              <div className="space-y-2">
                <Label>Ideals</Label>
                <Input value={ideals} onChange={(e) => setIdeals(e.target.value)} placeholder="Honor, Craftsmanship" />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Bonds</Label>
                <Input value={bonds} onChange={(e) => setBonds(e.target.value)} placeholder="Family forge" />
              </div>
              <div className="space-y-2">
                <Label>Flaws</Label>
                <Input value={flaws} onChange={(e) => setFlaws(e.target.value)} placeholder="Stubborn" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Voice & Quirks</Label>
              <Textarea
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                placeholder="Deep voice, often hums while working..."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Secrets (DM Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={secrets}
              onChange={(e) => setSecrets(e.target.value)}
              placeholder="Hidden information, plot hooks..."
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Label>Biography</Label>
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
            {saving ? "Saving..." : "Save NPC"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
