import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
import { MapPin, Plus, Search, Map, Users, Flag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { resilientChannel } from "@/lib/realtime";
import { toast } from "sonner";
import LocationDialog from "@/components/locations/LocationDialog";

interface LocationsTabProps {
  campaignId: string;
}

interface Location {
  id: string;
  name: string;
  description: string | null;
  location_type: string | null;
  tags: string[];
  parent_location_id: string | null;
}

const terrainColors: Record<string, string> = {
  Urban: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Mountain: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Forest: "bg-green-500/20 text-green-300 border-green-500/30",
  Desert: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  Coastal: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  City: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30",
  Dungeon: "bg-stone-500/20 text-stone-300 border-stone-500/30",
  Wilderness: "bg-green-500/20 text-green-300 border-green-500/30",
};

export function LocationsTab({ campaignId }: LocationsTabProps) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [locationToEdit, setLocationToEdit] = useState<Location | undefined>(undefined);

  useEffect(() => {
    fetchLocations();

    const channel = resilientChannel(supabase, `locations:${campaignId}`);
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'locations',
        filter: `campaign_id=eq.${campaignId}`
      }, () => {
        fetchLocations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      const { error } = await supabase
        .from('locations')
        .delete()
        .eq('id', locationToDelete.id);

      if (error) throw error;

      toast.success('Location deleted');
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    } catch (error: any) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    }
  };

  const filteredLocations = locations.filter((loc) =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass" />
            <Input
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-background/50 border-brass/30"
            />
          </div>
          <Button onClick={() => { setLocationToEdit(undefined); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Location
          </Button>
        </div>

        {/* Locations Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <Card className="bg-card/50 border-brass/20">
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <Map className="w-12 h-12 mx-auto text-brass/50" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "No locations match your search."
                    : "No locations yet. Create your first location to begin mapping your world."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {filteredLocations.map((location) => (
                <Card
                  key={location.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 bg-card/50 border-brass/20"
                  onClick={() => {
                    setLocationToEdit(location);
                    setDialogOpen(true);
                  }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MapPin className="w-4 h-4 text-arcanePurple shrink-0" />
                        <CardTitle className="text-base font-cinzel truncate">{location.name}</CardTitle>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="shrink-0 h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocationToDelete(location);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {location.location_type && (
                      <CardDescription className="text-xs">{location.location_type}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {location.description || 'No description'}
                    </p>

                    {location.tags && location.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {location.tags.slice(0, 3).map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={terrainColors[tag] || "border-brass/30"}
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be undone.
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

      <LocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        campaignId={campaignId}
        locationToEdit={locationToEdit}
      />
    </>
  );
}
