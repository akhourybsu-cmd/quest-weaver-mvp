import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Map, Crown, Thermometer, Package, Trash2, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { LoreHeroHeader, LoreSection, LoreChronicle, LoreOrnamentDivider, RuneTag, RegionStatBar } from "../ui";
import { ImageUpload } from "@/components/ui/image-upload";

interface LorePage {
  id: string;
  title: string;
  slug?: string;
  excerpt?: string;
  content_md?: string;
  tags?: string[];
  visibility?: string;
  era?: string;
  details?: any;
}

interface RegionCreatorProps {
  campaignId: string;
  page?: LorePage;
  onSave: () => void;
  onCancel: () => void;
}

export default function RegionCreator({ campaignId, page, onSave, onCancel }: RegionCreatorProps) {
  const isEditing = !!page;
  
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [visibility, setVisibility] = useState<"DM_ONLY" | "SHARED">("DM_ONLY");
  const [era, setEra] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
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
      setEra(page.era || "");
      
      // Parse details
      const details = page.details || {};
      setRegionType(details.type || "city");
      setParentRegion(details.parentId || "");
      setPopulation(details.population || "");
      setGovernment(details.government || "");
      setClimate(details.climate || []);
      setExports(details.exports || []);
      setImports(details.imports || []);
      setTravelNotes(details.travelNotes || "");
      setImageUrl(details.image_url || null);
      if (details.mapPin) {
        setAddToMap(details.mapPin.enabled || false);
        setMapX(details.mapPin.x?.toString() || "");
        setMapY(details.mapPin.y?.toString() || "");
      }
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
    if (data) setRegions(data.filter(r => r.id !== page?.id));
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
        travelNotes,
        image_url: imageUrl
      };

      const pageData = {
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
      };

      if (isEditing && page) {
        const { error } = await supabase
          .from("lore_pages")
          .update(pageData)
          .eq("id", page.id);
        if (error) throw error;
        toast.success("Region updated successfully");
      } else {
        const { error } = await supabase.from("lore_pages").insert(pageData);
        if (error) throw error;
        toast.success("Region created successfully");
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
      toast.success("Region deleted");
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

  const addChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (value.trim() && !list.includes(value.trim())) {
      setter([...list, value.trim()]);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto min-h-0 px-4">
        <div className="lore-form-container space-y-6 pb-6">
          {/* Hero Header */}
          <LoreHeroHeader
            title={title}
            category="regions"
            visibility={visibility}
            era={era}
            slug={slug}
          >
            <RegionStatBar
              regionType={regionType}
              population={population}
              government={government}
              era={era}
              climate={climate}
            />
          </LoreHeroHeader>

          {/* Banner Image */}
          <LoreSection title="Banner Image" icon={ImageIcon} accentClass="lore-accent-regions">
            <ImageUpload
              bucket="maps"
              path={`${campaignId}/lore/regions`}
              currentImageUrl={imageUrl}
              onImageUploaded={setImageUrl}
              label="Region Banner"
              aspectRatio="landscape"
            />
          </LoreSection>

          {/* Basic Info Section */}
          <LoreSection title="Basic Information" icon={Map} accentClass="lore-accent-regions">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="The Emerald Coast"
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="era">Era / Date</Label>
                <Input
                  id="era"
                  value={era}
                  onChange={(e) => setEra(e.target.value)}
                  placeholder="3rd Age"
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
                placeholder="A brief overview of this region..."
                rows={2}
                className="bg-card/50 border-brass/20"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="regionType">Region Type *</Label>
                <Select value={regionType} onValueChange={setRegionType}>
                  <SelectTrigger className="bg-card/50 border-brass/20">
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
                  <SelectTrigger className="bg-card/50 border-brass/20">
                    <SelectValue placeholder="Select parent region" />
                  </SelectTrigger>
                  <SelectContent>
                    {regions.map(r => (
                      <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
                    ))}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (press Enter to add)</Label>
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="coastal, trade-hub"
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

          {/* Realm & Rule Section */}
          <LoreSection title="Realm & Rule" icon={Crown} accentClass="lore-accent-regions">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Population</Label>
                <Input 
                  value={population} 
                  onChange={(e) => setPopulation(e.target.value)} 
                  placeholder="~50,000" 
                  className="bg-card/50 border-brass/20"
                />
              </div>
              <div className="space-y-2">
                <Label>Government Type</Label>
                <Input 
                  value={government} 
                  onChange={(e) => setGovernment(e.target.value)} 
                  placeholder="Republic" 
                  className="bg-card/50 border-brass/20"
                />
              </div>
            </div>
          </LoreSection>

          {/* Land & Climate Section */}
          <LoreSection title="Land & Climate" icon={Thermometer} accentClass="lore-accent-regions">
            <div className="space-y-2">
              <Label>Climate & Terrain (press Enter to add)</Label>
              <Input
                placeholder="temperate, coastal, forest"
                className="bg-card/50 border-brass/20"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addChip(e.currentTarget.value, climate, setClimate);
                    e.currentTarget.value = "";
                  }
                }}
              />
              {climate.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {climate.map(c => (
                    <RuneTag key={c} variant="outline" onRemove={() => setClimate(climate.filter(x => x !== c))}>
                      {c}
                    </RuneTag>
                  ))}
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
                className="bg-card/50 border-brass/20"
              />
            </div>
          </LoreSection>

          {/* Trade & Ties Section */}
          <LoreSection title="Trade & Ties" icon={Package} accentClass="lore-accent-regions">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Exports</Label>
                <Input
                  placeholder="wine, silk"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChip(e.currentTarget.value, exports, setExports);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {exports.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exports.map(exp => (
                      <RuneTag key={exp} variant="accent" onRemove={() => setExports(exports.filter(x => x !== exp))}>
                        {exp}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Imports</Label>
                <Input
                  placeholder="iron, grain"
                  className="bg-card/50 border-brass/20"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addChip(e.currentTarget.value, imports, setImports);
                      e.currentTarget.value = "";
                    }
                  }}
                />
                {imports.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {imports.map(imp => (
                      <RuneTag key={imp} variant="outline" onRemove={() => setImports(imports.filter(x => x !== imp))}>
                        {imp}
                      </RuneTag>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch checked={addToMap} onCheckedChange={setAddToMap} />
                <Label>Add to Campaign Map</Label>
              </div>
              {addToMap && (
                <div className="grid grid-cols-2 gap-2 pl-6">
                  <Input 
                    type="number" 
                    placeholder="X" 
                    value={mapX} 
                    onChange={(e) => setMapX(e.target.value)} 
                    className="bg-card/50 border-brass/20"
                  />
                  <Input 
                    type="number" 
                    placeholder="Y" 
                    value={mapY} 
                    onChange={(e) => setMapY(e.target.value)} 
                    className="bg-card/50 border-brass/20"
                  />
                </div>
              )}
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
                <AlertDialogTitle>Delete Region?</AlertDialogTitle>
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
            {saving ? "Saving..." : isEditing ? "Update Region" : "Save Region"}
          </Button>
        </div>
      </div>
    </div>
  );
}
