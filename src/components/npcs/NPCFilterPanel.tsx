import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X } from "lucide-react";

interface NPCFilterPanelProps {
  campaignId: string;
  onFilterChange: (filters: NPCFilters) => void;
  currentFilters: NPCFilters;
}

export interface NPCFilters {
  factionId: string | null;
  locationId: string | null;
  status: string[];
  showOnlyPinned: boolean;
}

const NPCFilterPanel = ({ campaignId, onFilterChange, currentFilters }: NPCFilterPanelProps) => {
  const [factions, setFactions] = useState<Array<{ id: string; name: string }>>([]);
  const [locations, setLocations] = useState<Array<{ id: string; name: string }>>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    loadFactions();
    loadLocations();
  }, [campaignId]);

  const loadFactions = async () => {
    const { data } = await supabase
      .from("factions")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name");
    setFactions(data || []);
  };

  const loadLocations = async () => {
    const { data } = await supabase
      .from("locations")
      .select("id, name")
      .eq("campaign_id", campaignId)
      .order("name");
    setLocations(data || []);
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = currentFilters.status.includes(status)
      ? currentFilters.status.filter((s) => s !== status)
      : [...currentFilters.status, status];
    onFilterChange({ ...currentFilters, status: newStatuses });
  };

  const clearFilters = () => {
    onFilterChange({
      factionId: null,
      locationId: null,
      status: [],
      showOnlyPinned: false,
    });
  };

  const activeFilterCount =
    (currentFilters.factionId ? 1 : 0) +
    (currentFilters.locationId ? 1 : 0) +
    currentFilters.status.length +
    (currentFilters.showOnlyPinned ? 1 : 0);

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Pinned Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Quick Filters</Label>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pinned"
            checked={currentFilters.showOnlyPinned}
            onCheckedChange={(checked) =>
              onFilterChange({ ...currentFilters, showOnlyPinned: !!checked })
            }
          />
          <label htmlFor="pinned" className="text-sm cursor-pointer">
            Show only pinned
          </label>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Status</Label>
        <div className="space-y-2">
          {["alive", "dead", "missing", "unknown"].map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={status}
                checked={currentFilters.status.includes(status)}
                onCheckedChange={() => handleStatusToggle(status)}
              />
              <label htmlFor={status} className="text-sm capitalize cursor-pointer">
                {status}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Faction Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Faction</Label>
        <Select
          value={currentFilters.factionId || "all"}
          onValueChange={(value) =>
            onFilterChange({ ...currentFilters, factionId: value === "all" ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All factions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All factions</SelectItem>
            {factions.map((faction) => (
              <SelectItem key={faction.id} value={faction.id}>
                {faction.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Location Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Location</Label>
        <Select
          value={currentFilters.locationId || "all"}
          onValueChange={(value) =>
            onFilterChange({ ...currentFilters, locationId: value === "all" ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All locations</SelectItem>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear Filters */}
      {activeFilterCount > 0 && (
        <Button variant="outline" size="sm" onClick={clearFilters} className="w-full">
          <X className="w-4 h-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Filter NPCs</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="w-64 shrink-0">
      <div className="sticky top-4 space-y-4 p-4 rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary">{activeFilterCount}</Badge>
          )}
        </div>
        <FilterContent />
      </div>
    </div>
  );
};

export default NPCFilterPanel;
