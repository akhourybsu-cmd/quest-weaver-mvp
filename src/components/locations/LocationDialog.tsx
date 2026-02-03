import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { X, Plus, Trash2, Calendar, Book } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddItemToSessionDialog } from "@/components/campaign/AddItemToSessionDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DynamicLocationFields } from "./DynamicLocationFields";
import { LOCATION_SCHEMAS, CITY_VENUE_TEMPLATE, LocationType } from "@/lib/locationSchemas";
import { timelineLogger } from "@/hooks/useTimelineLogger";
import { ImageUpload } from "@/components/ui/image-upload";
import LoreLinkSelector from "@/components/lore/LoreLinkSelector";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface LorePage {
  id: string;
  title: string;
  content_md: string;
  category: string;
  visibility: string;
  tags?: string[];
}

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  locationToEdit?: any;
  parentLocationId?: string | null;
  onSaved?: () => void;
}

// Owner field keys mapped to NPC role titles
const OWNER_FIELD_MAPPING: Record<string, string> = {
  owner_npc: "Owner",
  owner: "Owner",
  shopkeeper_name: "Shopkeeper",
  wizard_name: "Wizard",
  innkeeper: "Innkeeper",
  guild_master: "Guild Master",
  captain_name: "Captain",
  banker_name: "Banker",
  warden_name: "Warden",
  smith_name: "Blacksmith",
  smithy_name: "Blacksmith",
  librarian_name: "Librarian",
  healer_name: "Healer",
  harbor_master: "Harbor Master",
  stable_master: "Stable Master",
  proprietor: "Proprietor",
  bartender: "Bartender",
  head_priest: "High Priest",
  master_smith: "Master Smith",
  master_alchemist: "Master Alchemist",
  chief_healer: "Chief Healer",
  headmaster: "Headmaster",
  archmagister: "Archmagister",
  guild_leader: "Guild Leader",
  commander: "Commander",
  warden: "Warden",
};

const LocationDialog = ({ open, onOpenChange, campaignId, locationToEdit, parentLocationId, onSaved }: LocationDialogProps) => {
  const isEditing = !!locationToEdit;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("City");
  const [parentLocation, setParentLocation] = useState("none");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coordX, setCoordX] = useState("");
  const [coordY, setCoordY] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [autoAddVenues, setAutoAddVenues] = useState(false);
  const [showAddToSessionDialog, setShowAddToSessionDialog] = useState(false);
  const [relatedQuests, setRelatedQuests] = useState<any[]>([]);
  const [relatedNotes, setRelatedNotes] = useState<any[]>([]);
  const [discovered, setDiscovered] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lorePageId, setLorePageId] = useState<string | null>(null);
  const [linkedLore, setLinkedLore] = useState<LorePage | null>(null);

  useEffect(() => {
    if (open) {
      loadLocations();
      if (locationToEdit) {
        setName(locationToEdit.name || "");
        setDescription(locationToEdit.description || "");
        setLocationType(locationToEdit.location_type || "City");
        setParentLocation(locationToEdit.parent_location_id || "none");
        setTags(locationToEdit.tags || []);
        setImageUrl(locationToEdit.image_url || null);
        
        // Load from details object if it exists
        const locationDetails = locationToEdit.details || {};
        setDetails(locationDetails);
        setCoordX(locationDetails.coord_x?.toString() || "");
        setCoordY(locationDetails.coord_y?.toString() || "");
        setDiscovered(locationToEdit.discovered || false);
        setLorePageId(locationToEdit.lore_page_id || null);
        
        // Load linked lore content
        if (locationToEdit.lore_page_id) {
          loadLinkedLore(locationToEdit.lore_page_id);
        } else {
          setLinkedLore(null);
        }
        
        // Load related quests
        loadRelatedQuests(locationToEdit.id);
        // Load related notes
        loadRelatedNotes(locationToEdit.id);
      } else if (parentLocationId) {
        // Pre-fill parent location when creating sub-location
        setParentLocation(parentLocationId);
        setImageUrl(null);
        setLorePageId(null);
        setLinkedLore(null);
      }
    }
  }, [open, locationToEdit, parentLocationId]);

  // Load linked lore when lorePageId changes
  useEffect(() => {
    if (lorePageId && open) {
      loadLinkedLore(lorePageId);
    } else {
      setLinkedLore(null);
    }
  }, [open, locationToEdit, parentLocationId]);

  // Auto-populate template when type changes (only for new locations)
  useEffect(() => {
    if (locationType && LOCATION_SCHEMAS[locationType as LocationType] && !isEditing) {
      const schema = LOCATION_SCHEMAS[locationType as LocationType];
      if (schema.template) {
        setDetails(prevDetails => ({
          ...schema.template,
          ...prevDetails, // Preserve any manually entered values
        }));
      }
    }
  }, [locationType, isEditing]);

  const loadLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name");
    
    if (data) setLocations(data);
  };

  const loadRelatedQuests = async (locationId: string) => {
    const { data } = await supabase
      .from("quests")
      .select("id, title, status")
      .eq("location_id", locationId);
    
    if (data) setRelatedQuests(data);
  };

  const loadRelatedNotes = async (locationId: string) => {
    // Get notes linked to this location
    const { data: links } = await supabase
      .from("note_links")
      .select("note_id")
      .eq("link_type", "LOCATION")
      .eq("link_id", locationId);

    if (!links || links.length === 0) {
      setRelatedNotes([]);
      return;
    }

    const noteIds = links.map(l => l.note_id);

    // Fetch the actual notes
    const { data: notes } = await supabase
      .from("session_notes")
      .select("id, title, visibility, is_pinned, updated_at, tags")
      .in("id", noteIds)
      .eq("campaign_id", campaignId)
      .order("updated_at", { ascending: false });

    setRelatedNotes(notes || []);
  };

  const loadLinkedLore = async (pageId: string) => {
    const { data } = await supabase
      .from("lore_pages")
      .select("*")
      .eq("id", pageId)
      .single();
    
    if (data) {
      setLinkedLore(data as LorePage);
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

  const resetForm = () => {
    setName("");
    setDescription("");
    setLocationType("City");
    setParentLocation("none");
    setTags([]);
    setCoordX("");
    setCoordY("");
    setDetails({});
    setAutoAddVenues(false);
    setImageUrl(null);
    setLorePageId(null);
    setLinkedLore(null);
  };

  // Helper function to extract owner names from details and create/link NPCs
  const linkOrCreateOwnerNPCs = async (locationId: string, locationName: string, locType: string, mergedDetails: Record<string, any>) => {
    const ownersToProcess: Array<{ name: string; roleTitle: string }> = [];
    
    // Extract all owner-related fields
    for (const [key, roleTitle] of Object.entries(OWNER_FIELD_MAPPING)) {
      const ownerName = mergedDetails[key];
      if (ownerName && typeof ownerName === 'string' && ownerName.trim()) {
        ownersToProcess.push({ name: ownerName.trim(), roleTitle });
      }
    }
    
    if (ownersToProcess.length === 0) return;
    
    for (const { name: ownerName, roleTitle } of ownersToProcess) {
      try {
        // Check if NPC with this name already exists in the campaign (case-insensitive)
        const { data: existingNPCs } = await supabase
          .from('npcs')
          .select('id, name')
          .eq('campaign_id', campaignId)
          .ilike('name', ownerName);
        
        if (existingNPCs && existingNPCs.length > 0) {
          // Update existing NPC to link to this location
          await supabase
            .from('npcs')
            .update({ 
              location_id: locationId,
              location: locationName,
            })
            .eq('id', existingNPCs[0].id);
        } else {
          // Create new NPC linked to this location
          const locationTypeLower = locType?.toLowerCase() || 'location';
          await supabase
            .from('npcs')
            .insert({
              campaign_id: campaignId,
              name: ownerName,
              role_title: roleTitle,
              location_id: locationId,
              location: locationName,
              player_visible: false,
              status: 'alive',
              tags: ['location-owner', locationTypeLower],
            });
        }
      } catch (err) {
        console.error(`Failed to create/link NPC "${ownerName}":`, err);
        // Don't block the save operation if NPC creation fails
      }
    }
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Please provide a location name.");
      return;
    }

    // Merge universal coordinates with type-specific dynamic fields
    const mergedDetails = {
      ...details,
      coord_x: coordX ? parseFloat(coordX) : null,
      coord_y: coordY ? parseFloat(coordY) : null,
    };

    const locationData = {
      campaign_id: campaignId,
      name,
      description: description || null,
      location_type: locationType,
      parent_location_id: parentLocation !== "none" ? parentLocation : null,
      tags,
      details: mergedDetails,
      discovered,
      image_url: imageUrl,
      lore_page_id: lorePageId,
    };

    if (isEditing) {
      // Check if location is being discovered for the first time
      const wasDiscovered = locationToEdit?.discovered || false;
      const isNowDiscovered = discovered;
      
      const { error } = await supabase
        .from("locations")
        .update(locationData)
        .eq("id", locationToEdit.id);

      if (error) {
        toast.error(`Failed to update location: ${error.message}`);
        return;
      }

      // Log timeline event if location was just discovered
      if (!wasDiscovered && isNowDiscovered) {
        // Get live session ID for this campaign
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('live_session_id')
          .eq('id', campaignId)
          .single();
        
        await timelineLogger.locationDiscovered(
          campaignId, 
          campaign?.live_session_id || null, 
          name, 
          locationToEdit.id
        );
      }

      // Auto-index location owners as NPCs
      await linkOrCreateOwnerNPCs(locationToEdit.id, name, locationType, mergedDetails);

      toast.success(`${name} has been updated.`);
    } else {
      const { data, error } = await supabase
        .from("locations")
        .insert(locationData)
        .select();

      if (error) {
        toast.error(`Failed to create location: ${error.message}`);
        return;
      }

      const newLocationId = data?.[0]?.id;

      // Auto-index location owners as NPCs
      if (newLocationId) {
        await linkOrCreateOwnerNPCs(newLocationId, name, locationType, mergedDetails);
      }

      // Auto-add city venues if requested
      if (autoAddVenues && (locationType === "City" || locationType === "Town")) {
        const parentId = data?.[0]?.id;
        if (parentId) {
          const venues = CITY_VENUE_TEMPLATE.map((venue) => ({
            campaign_id: campaignId,
            name: venue.name,
            location_type: venue.type,
            parent_location_id: parentId,
            description: `A ${venue.type} in ${name}`,
            tags: [],
            details: LOCATION_SCHEMAS[venue.type].template,
          }));

          const { error: venueError } = await supabase
            .from("locations")
            .insert(venues);

          if (venueError) {
            console.error("Error creating venues:", venueError);
            toast.warning(`${name} created but failed to add venues`);
          } else {
            toast.success(`${name} created with ${venues.length} venues`);
          }
        }
      } else {
        toast.success(`${name} has been created.`);
      }
    }

    resetForm();
    onSaved?.();
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!locationToEdit) return;

    try {
      const { error } = await supabase
        .from("locations")
        .delete()
        .eq("id", locationToEdit.id);

      if (error) throw error;

      toast.success(`${name} has been deleted.`);
      resetForm();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(`Failed to delete location: ${error.message}`);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="font-cinzel">{isEditing ? "Edit Location" : "Create Location"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update location details and information." : "Create a new location for your campaign world."}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basics" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basics">Basics</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="lore">Lore</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[500px] mt-4">
              <TabsContent value="basics" className="space-y-4 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location-name">Location Name *</Label>
                    <Input
                      id="location-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Waterdeep"
                      className="border-brass/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location-type">Location Type</Label>
                    <Select value={locationType} onValueChange={setLocationType}>
                      <SelectTrigger className="border-brass/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-96">
                        {/* Settlements */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Settlements</div>
                        <SelectItem value="Continent">Continent</SelectItem>
                        <SelectItem value="Region">Region</SelectItem>
                        <SelectItem value="Nation">Nation</SelectItem>
                        <SelectItem value="Province">Province</SelectItem>
                        <SelectItem value="City">City</SelectItem>
                        <SelectItem value="Town">Town</SelectItem>
                        <SelectItem value="Village">Village</SelectItem>
                        <SelectItem value="Hamlet">Hamlet</SelectItem>
                        <SelectItem value="District">District</SelectItem>
                        
                        {/* Venues - Commerce */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Commerce</div>
                        <SelectItem value="Inn">Inn</SelectItem>
                        <SelectItem value="Tavern">Tavern</SelectItem>
                        <SelectItem value="Blacksmith">Blacksmith</SelectItem>
                        <SelectItem value="Armorer">Armorer</SelectItem>
                        <SelectItem value="Fletcher">Fletcher</SelectItem>
                        <SelectItem value="Alchemist">Alchemist</SelectItem>
                        <SelectItem value="Apothecary">Apothecary</SelectItem>
                        <SelectItem value="MagicShop">Magic Shop</SelectItem>
                        <SelectItem value="GeneralStore">General Store</SelectItem>
                        <SelectItem value="MarketStall">Market Stall</SelectItem>
                        
                        {/* Services */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Services</div>
                        <SelectItem value="Library">Library</SelectItem>
                        <SelectItem value="Scribe">Scribe</SelectItem>
                        <SelectItem value="University">University</SelectItem>
                        <SelectItem value="WizardTower">Wizard Tower</SelectItem>
                        <SelectItem value="TempleShrine">Temple/Shrine</SelectItem>
                        <SelectItem value="HealerClinic">Healer Clinic</SelectItem>
                        <SelectItem value="Stable">Stable</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        
                        {/* Guilds */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Guilds</div>
                        <SelectItem value="AdventurersGuild">Adventurers Guild</SelectItem>
                        <SelectItem value="ThievesGuild">Thieves Guild</SelectItem>
                        <SelectItem value="MagesGuild">Mages Guild</SelectItem>
                        <SelectItem value="MerchantsGuild">Merchants Guild</SelectItem>
                        
                        {/* Military */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Military</div>
                        <SelectItem value="Guardhouse">Guardhouse</SelectItem>
                        <SelectItem value="Barracks">Barracks</SelectItem>
                        <SelectItem value="Garrison">Garrison</SelectItem>
                        <SelectItem value="Gatehouse">Gatehouse</SelectItem>
                        <SelectItem value="Prison">Prison</SelectItem>
                        
                        {/* Infrastructure */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Infrastructure</div>
                        <SelectItem value="Dockyard">Dockyard</SelectItem>
                        <SelectItem value="Warehouse">Warehouse</SelectItem>
                        <SelectItem value="TeleportCircle">Teleport Circle</SelectItem>
                        <SelectItem value="Portal">Portal</SelectItem>
                        
                        {/* Entertainment */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Entertainment</div>
                        <SelectItem value="Theatre">Theatre</SelectItem>
                        <SelectItem value="Arena">Arena</SelectItem>
                        <SelectItem value="Bathhouse">Bathhouse</SelectItem>
                        <SelectItem value="Brothel">Brothel</SelectItem>
                        
                        {/* Sites & Dungeons */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Sites & Dungeons</div>
                        <SelectItem value="Dungeon">Dungeon</SelectItem>
                        <SelectItem value="Fortress">Fortress</SelectItem>
                        <SelectItem value="Temple">Temple</SelectItem>
                        <SelectItem value="Tower">Tower</SelectItem>
                        <SelectItem value="Ruin">Ruin</SelectItem>
                        <SelectItem value="Cave">Cave</SelectItem>
                        <SelectItem value="Sewer">Sewer</SelectItem>
                        <SelectItem value="Catacombs">Catacombs</SelectItem>
                        <SelectItem value="Cemetery">Cemetery</SelectItem>
                        
                        {/* Geographic */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Geographic</div>
                        <SelectItem value="Wilderness">Wilderness</SelectItem>
                        <SelectItem value="Forest">Forest</SelectItem>
                        <SelectItem value="Mountains">Mountains</SelectItem>
                        <SelectItem value="Desert">Desert</SelectItem>
                        <SelectItem value="Swamp">Swamp</SelectItem>
                        <SelectItem value="River">River</SelectItem>
                        <SelectItem value="Coast">Coast</SelectItem>
                        
                        {/* Landmarks */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">Landmarks</div>
                        <SelectItem value="Landmark">Landmark</SelectItem>
                        <SelectItem value="Monument">Monument</SelectItem>
                        
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location Image Upload */}
                <ImageUpload
                  bucket="maps"
                  path={`${campaignId}/locations`}
                  currentImageUrl={imageUrl}
                  onImageUploaded={setImageUrl}
                  label="Location Image"
                  aspectRatio="landscape"
                />

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="A bustling port city on the Sword Coast..."
                    rows={4}
                    className="border-brass/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="parent-location">Parent Location</Label>
                  <Select value={parentLocation} onValueChange={setParentLocation}>
                    <SelectTrigger className="border-brass/30">
                      <SelectValue placeholder="None (Top Level)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Top Level)</SelectItem>
                      {locations
                        .filter(loc => !isEditing || loc.id !== locationToEdit.id)
                        .map(loc => (
                          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
          </div>

          {!isEditing && (locationType === "City" || locationType === "Town") && (
            <div className="space-y-2 p-4 border border-brass/30 rounded-md bg-accent/20">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-add-venues" className="text-sm font-medium">
                  Auto-add common venues
                </Label>
                <Switch
                  id="auto-add-venues"
                  checked={autoAddVenues}
                  onCheckedChange={setAutoAddVenues}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Automatically create child locations: Inn, Tavern, Blacksmith, General Store, Temple, Library, Guardhouse, and Market
              </p>
            </div>
          )}

          <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="Add tag..."
                      className="border-brass/30"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map(tag => (
                      <div key={tag} className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-sm">
                        {tag}
                        <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 px-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coord-x">Map X Coordinate</Label>
                    <Input
                      id="coord-x"
                      type="number"
                      value={coordX}
                      onChange={(e) => setCoordX(e.target.value)}
                      placeholder="0"
                      className="border-brass/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="coord-y">Map Y Coordinate</Label>
                    <Input
                      id="coord-y"
                      type="number"
                      value={coordY}
                      onChange={(e) => setCoordY(e.target.value)}
                      placeholder="0"
                      className="border-brass/30"
                    />
                  </div>
                </div>

                {/* Type-Specific Dynamic Fields */}
                {LOCATION_SCHEMAS[locationType as LocationType] && 
                 LOCATION_SCHEMAS[locationType as LocationType].fields.length > 0 && (
                  <div className="pt-4 border-t border-brass/30">
                    <h4 className="text-sm font-semibold mb-4 text-foreground">
                      {locationType}-Specific Information
                    </h4>
                    <DynamicLocationFields
                      locationType={locationType as LocationType}
                      details={details}
                      onDetailsChange={setDetails}
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="lore" className="space-y-4 px-1">
                {/* Lore Link */}
                <LoreLinkSelector
                  campaignId={campaignId}
                  category="regions"
                  value={lorePageId}
                  onChange={setLorePageId}
                  label="Linked Lore Entry"
                  entityName={name.trim() || undefined}
                />

                {/* Linked Lore Content Display */}
                {linkedLore && (
                  <Card className="border-brass/20 bg-brass/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Book className="w-4 h-4 text-brass" />
                        <span className="text-sm font-medium">Region Lore: {linkedLore.title}</span>
                      </div>
                      <ScrollArea className="h-40 rounded-lg border border-brass/20 bg-muted/30 p-3">
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {linkedLore.content_md || "*No lore content*"}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>
                      {linkedLore.tags && linkedLore.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {linkedLore.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <MarkdownEditor
                  value={details.lore || ""}
                  onChange={(val) => setDetails({ ...details, lore: val })}
                  label="Additional History & Lore"
                  placeholder="Founded centuries ago by..."
                  rows={10}
                  showPreview={true}
                />
                
                {isEditing && relatedQuests.length > 0 && (
                  <div className="space-y-2">
                    <Label>Related Quests</Label>
                    <div className="border border-brass/30 rounded-md p-3 space-y-2">
                      {relatedQuests.map((quest) => (
                        <div key={quest.id} className="flex items-center justify-between text-sm">
                          <span>{quest.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {quest.status?.replace('_', ' ') || 'active'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {isEditing && relatedNotes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Referenced in Notes</Label>
                    <div className="border border-brass/30 rounded-md p-3 space-y-2">
                      <div className="text-xs text-muted-foreground mb-2">
                        {relatedNotes.length} {relatedNotes.length === 1 ? 'note' : 'notes'} mentioning this location
                      </div>
                      {relatedNotes.map((note) => {
                        const visibilityConfig: Record<string, any> = {
                          DM_ONLY: { label: "DM", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400" },
                          SHARED: { label: "Shared", className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400" },
                          PRIVATE: { label: "Private", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400" },
                        };
                        const visConfig = visibilityConfig[note.visibility];

                        return (
                          <div key={note.id} className="flex items-start justify-between gap-2 py-1.5 text-sm">
                            <div className="flex-1">
                              <div className="font-medium">{note.title}</div>
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {note.tags.slice(0, 2).map((tag: string) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {note.tags.length > 2 && (
                                    <Badge variant="secondary" className="text-xs">+{note.tags.length - 2}</Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className={`text-xs shrink-0 ${visConfig.className}`}>
                              {visConfig.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowAddToSessionDialog(true)}
                    className="mr-2"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Add to Session Pack
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2 mr-2">
                <Label htmlFor="location-discovered" className="text-sm">Discovered by Players</Label>
                <Switch
                  id="location-discovered"
                  checked={discovered}
                  onCheckedChange={setDiscovered}
                />
              </div>
              {isEditing && (
                <Button variant="outline" onClick={() => setShowAddToSessionDialog(true)}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Add to Session
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {isEditing ? "Update Location" : "Create Location"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this location? This action cannot be undone.
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

      {locationToEdit && (
        <AddItemToSessionDialog
          open={showAddToSessionDialog}
          onOpenChange={setShowAddToSessionDialog}
          campaignId={campaignId}
          itemType="location"
          itemId={locationToEdit.id}
          itemName={locationToEdit.name}
        />
      )}
    </>
  );
};

export default LocationDialog;
