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
import { X, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
}

const LocationDialog = ({ open, onOpenChange, campaignId, locationToEdit }: LocationDialogProps) => {
  const isEditing = !!locationToEdit;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [locationType, setLocationType] = useState("City");
  const [parentLocationId, setParentLocationId] = useState("none");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [coordX, setCoordX] = useState("");
  const [coordY, setCoordY] = useState("");
  const [terrain, setTerrain] = useState("");
  const [population, setPopulation] = useState("");
  const [government, setGovernment] = useState("");
  const [climate, setClimate] = useState("");
  const [resources, setResources] = useState("");
  const [notableFeatures, setNotableFeatures] = useState("");
  const [history, setHistory] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [details, setDetails] = useState<Record<string, any>>({});
  const [autoAddVenues, setAutoAddVenues] = useState(false);

  useEffect(() => {
    if (open) {
      loadLocations();
      if (locationToEdit) {
        setName(locationToEdit.name || "");
        setDescription(locationToEdit.description || "");
        setLocationType(locationToEdit.location_type || "City");
        setParentLocationId(locationToEdit.parent_location_id || "none");
        setTags(locationToEdit.tags || []);
        
        // Load from details object if it exists
        const locationDetails = locationToEdit.details || {};
        setDetails(locationDetails);
        setCoordX(locationDetails.coord_x?.toString() || "");
        setCoordY(locationDetails.coord_y?.toString() || "");
        setTerrain(locationDetails.terrain || "");
        setPopulation(locationDetails.population?.toString() || "");
        setGovernment(locationDetails.government || "");
        setClimate(locationDetails.climate || "");
        setResources(locationDetails.resources || "");
        setNotableFeatures(locationDetails.notable_features || "");
        setHistory(locationDetails.history || "");
      }
    }
  }, [open, locationToEdit]);

  const loadLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name");
    
    if (data) setLocations(data);
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
    setParentLocationId("none");
    setTags([]);
    setCoordX("");
    setCoordY("");
    setTerrain("");
    setPopulation("");
    setGovernment("");
    setClimate("");
    setResources("");
    setNotableFeatures("");
    setHistory("");
  };

  const handleSubmit = async () => {
    if (!name) {
      toast.error("Please provide a location name.");
      return;
    }

    // Merge base fields with dynamic fields in details object
    const mergedDetails = {
      ...details,
      coord_x: coordX ? parseFloat(coordX) : null,
      coord_y: coordY ? parseFloat(coordY) : null,
      terrain: terrain || null,
      population: population ? parseInt(population) : null,
      government: government || null,
      climate: climate || null,
      resources: resources || null,
      notable_features: notableFeatures || null,
      history: history || null,
    };

    const locationData = {
      campaign_id: campaignId,
      name,
      description: description || null,
      location_type: locationType,
      parent_location_id: parentLocationId !== "none" ? parentLocationId : null,
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
                      <SelectContent>
                        <SelectItem value="City">City</SelectItem>
                        <SelectItem value="Town">Town</SelectItem>
                        <SelectItem value="Village">Village</SelectItem>
                        <SelectItem value="Dungeon">Dungeon</SelectItem>
                        <SelectItem value="Wilderness">Wilderness</SelectItem>
                        <SelectItem value="Mountain">Mountain</SelectItem>
                        <SelectItem value="Forest">Forest</SelectItem>
                        <SelectItem value="Desert">Desert</SelectItem>
                        <SelectItem value="Coastal">Coastal</SelectItem>
                        <SelectItem value="Underground">Underground</SelectItem>
                        <SelectItem value="Planar">Planar</SelectItem>
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
                  <Select value={parentLocationId} onValueChange={setParentLocationId}>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="terrain">Terrain</Label>
                    <Input
                      id="terrain"
                      value={terrain}
                      onChange={(e) => setTerrain(e.target.value)}
                      placeholder="Coastal plains"
                      className="border-brass/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="climate">Climate</Label>
                    <Input
                      id="climate"
                      value={climate}
                      onChange={(e) => setClimate(e.target.value)}
                      placeholder="Temperate"
                      className="border-brass/30"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      value={population}
                      onChange={(e) => setPopulation(e.target.value)}
                      placeholder="50000"
                      className="border-brass/30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="government">Government</Label>
                    <Input
                      id="government"
                      value={government}
                      onChange={(e) => setGovernment(e.target.value)}
                      placeholder="Merchant Council"
                      className="border-brass/30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resources">Resources</Label>
                  <Textarea
                    id="resources"
                    value={resources}
                    onChange={(e) => setResources(e.target.value)}
                    placeholder="Fish, timber, iron ore..."
                    rows={3}
                    className="border-brass/30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notable-features">Notable Features</Label>
                  <Textarea
                    id="notable-features"
                    value={notableFeatures}
                    onChange={(e) => setNotableFeatures(e.target.value)}
                    placeholder="The Grand Harbor, Castle Waterdeep..."
                    rows={3}
                    className="border-brass/30"
                  />
                </div>
              </TabsContent>

              <TabsContent value="lore" className="space-y-4 px-1">
                <div className="space-y-2">
                  <Label htmlFor="history">History & Lore</Label>
                  <Textarea
                    id="history"
                    value={history}
                    onChange={(e) => setHistory(e.target.value)}
                    placeholder="Founded centuries ago by..."
                    rows={12}
                    className="border-brass/30"
                  />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {isEditing && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
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
              Are you sure you want to delete "{name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LocationDialog;
