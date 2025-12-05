import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Flag, Shield, Target, Palette, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag, FactionStatBar } from "../ui";
import { ImageUpload } from "@/components/ui/image-upload";

interface LorePage {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content_md?: string;
  tags?: string[];
  visibility?: string;
  details?: any;
}

interface FactionCreatorProps {
  campaignId: string;
  page?: LorePage;
  onSave: () => void;
  onCancel: () => void;
}

export default function FactionCreator({ campaignId, page, onSave, onCancel }: FactionCreatorProps) {
  const isEditing = !!page;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
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
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("edit");

  // Load existing page data when editing
  useEffect(() => {
    if (page) {
      setTitle(page.title || "");
      setSlug(page.slug || "");
      setSummary(page.excerpt || "");
      setContent(page.content_md || "");
      setTags(page.tags || []);
      setVisibility((page.visibility as "DM_ONLY" | "SHARED") || "DM_ONLY");
      
      const details = page.details || {};
      setAlignment(details.alignment || "N");
      setMotto(details.motto || "");
      setColors(details.colors || []);
      setPowerLevel([details.powerLevel || 3]);
      setHqRegion(details.hqRegionId || "");
      setReputation([details.reputation || 0]);
      setGoals(details.goals || "");
      setImageUrl(details.image_url || null);
    }
  }, [page]);

  useEffect(() => {
    loadRegions();
  }, [campaignId]);

  useEffect(() => {
    if (title && !slug && !isEditing) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    }
  }, [title, isEditing]);

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
        goals,
        image_url: imageUrl
      };

      const pageData = {
        campaign_id: campaignId,
        title,
        slug,
        content_md: content,
        excerpt: summary,
        tags,
        category: "factions",
        visibility,
        details
      };

      if (isEditing && page) {
        const { error } = await supabase
          .from("lore_pages")
          .update(pageData)
          .eq("id", page.id);
        if (error) throw error;
        toast.success("Faction updated successfully");
      } else {
        const { error } = await supabase.from("lore_pages").insert(pageData);
        if (error) throw error;
        toast.success("Faction created successfully");
      }
      onSave();
    } catch (error: any) {
      toast.error("Failed to save: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!page) return;
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("lore_pages")
        .delete()
        .eq("id", page.id);
      if (error) throw error;
      toast.success("Faction deleted");
      onSave();
    } catch (error: any) {
      toast.error("Failed to delete: " + error.message);
    } finally {
      setDeleting(false);
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

  const hqRegionName = regions.find(r => r.id === hqRegion)?.title;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="lore-form-container space-y-6 pb-6">
          {/* Hero Header */}
          <LoreHeroHeader
            title={title}
            category="factions"
            visibility={visibility}
            slug={slug}
            subtitle={motto}
          >
            <FactionStatBar
              alignment={alignment}
              powerLevel={powerLevel[0]}
              reputation={reputation[0]}
              headquarters={hqRegionName}
            />
          </LoreHeroHeader>

          {/* Banner Image */}
          <LoreSection title="Banner Image" icon={ImageIcon} accentClass="lore-accent-factions">
            <ImageUpload
              bucket="maps"
              path={`${campaignId}/lore/factions`}
              currentImageUrl={imageUrl}
              onImageUploaded={setImageUrl}
              label="Faction Banner"
              aspectRatio="landscape"
            />
          </LoreSection>

          {/* Banner & Allegiance Section */}
          <LoreSection title="Banner & Allegiance" icon={Flag} accentClass="lore-accent-factions">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Faction Name *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Iron Brotherhood"
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Motto</Label>
                <Input 
                  value={motto} 
                  onChange={(e) => setMotto(e.target.value)} 
                  placeholder="Strength in Unity" 
                  className="bg-card/50 border-brass/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="A brief overview of this faction..."
                rows={2}
                className="bg-card/50 border-brass/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (press Enter to add)</Label>
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="military, secretive"
                className="bg-card/50 border-brass/20"
              />
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map(tag => (
                    <RuneTag key={tag} onRemove={() => setTags(tags.filter(t => t !== tag))}>
                      {tag}
                    </RuneTag>
                  ))}
                </div>
              )}
            </div>
          </LoreSection>

          <LoreOrnamentDivider />

          {/* Structure & Influence Section */}
          <LoreSection title="Structure & Influence" icon={Shield} accentClass="lore-accent-factions">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alignment">Alignment</Label>
                <Select value={alignment} onValueChange={setAlignment}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
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
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DM_ONLY">DM Only</SelectItem>
                    <SelectItem value="SHARED">Shared</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hqRegion">Headquarters</Label>
                <Select value={hqRegion} onValueChange={setHqRegion}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue placeholder="Select headquarters" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
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
                <span>Local</span>
                <span>Regional</span>
                <span>Major</span>
                <span>Continental</span>
              </div>
            </div>

            <div className="space-y-3">
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
          </LoreSection>

          {/* Colors & Identity Section */}
          <LoreSection title="Colors & Identity" icon={Palette} accentClass="lore-accent-factions">
            <div className="space-y-2">
              <Label>Faction Colors (press Enter to add)</Label>
              <Input
                placeholder="crimson, gold"
                className="bg-card/50 border-brass/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addColor(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <RuneTag key={c} variant="accent" onRemove={() => setColors(colors.filter(x => x !== c))}>
                      {c}
                    </RuneTag>
                  ))}
                </div>
              )}
            </div>
          </LoreSection>

          {/* Goals & Doctrine Section */}
          <LoreSection title="Goals & Doctrine" icon={Target} accentClass="lore-accent-factions">
            <div className="space-y-2">
              <Label>Goals & Tactics</Label>
              <Textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="What does this faction want and how do they achieve it?"
                rows={4}
                className="bg-card/50 border-brass/20"
              />
            </div>
          </LoreSection>

          <LoreOrnamentDivider />

          {/* Chronicle Section */}
          <LoreChronicle
            content={content}
            onChange={setContent}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            label="Full Description"
          />
        </div>
      </div>

      {/* Actions - Sticky Footer */}
      <div className="flex-shrink-0 flex gap-2 justify-between p-4 border-t border-brass/20 bg-card">
        {isEditing ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Faction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete "{title}". This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <div />}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Update Faction" : "Save Faction"}
          </Button>
        </div>
      </div>
    </div>
  );
}
