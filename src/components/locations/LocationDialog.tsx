import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Trash2, Calendar } from "lucide-react";
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

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  locationToEdit?: any;
  parentLocationId?: string | null;
}

const LocationDialog = ({ open, onOpenChange, campaignId, locationToEdit, parentLocationId }: LocationDialogProps) => {
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

  useEffect(() => {
    if (open) {
      loadLocations();
      if (locationToEdit) {
        setName(locationToEdit.name || "");
        setDescription(locationToEdit.description || "");
        setLocationType(locationToEdit.location_type || "City");
        setParentLocation(locationToEdit.parent_location_id || "none");
        setTags(locationToEdit.tags || []);
        
        // Load from details object if it exists
        const locationDetails = locationToEdit.details || {};
        setDetails(locationDetails);
        setCoordX(locationDetails.coord_x?.toString() || "");
        setCoordY(locationDetails.coord_y?.toString() || "");
        
        // Load related quests
        loadRelatedQuests(locationToEdit.id);
      } else if (parentLocationId) {
        // Pre-fill parent location when creating sub-location
        setParentLocation(parentLocationId);
      }
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
    };

    if (isEditing) {
      const { error } = await supabase
        .from("locations")
        .update(locationData)
        .eq("id", locationToEdit.id);

      if (error) {
        toast.error(`Failed to update location: ${error.message}`);
        return;
      }

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
                <div className="space-y-2">
                  <Label htmlFor="lore">History & Lore</Label>
                  <Textarea
                    id="lore"
                    value={details.lore || ""}
                    onChange={(e) => setDetails({ ...details, lore: e.target.value })}
                    placeholder="Founded centuries ago by..."
                    rows={12}
                    className="border-brass/30"
                  />
                </div>
                
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
