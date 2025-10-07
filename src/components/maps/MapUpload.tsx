import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MapUploadProps {
  campaignId: string;
  encounterId?: string;
  onMapCreated: (mapId: string) => void;
}

const MapUpload = ({ campaignId, encounterId, onMapCreated }: MapUploadProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState("50");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async () => {
    if (!file || !name) {
      toast({
        title: "Missing information",
        description: "Please provide a map name and image file.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Create image element to get dimensions
      const img = new Image();
      const imageUrl = URL.createObjectURL(file);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      const width = img.width;
      const height = img.height;

      // Upload to storage
      const fileName = `${campaignId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("maps")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("maps")
        .getPublicUrl(fileName);

      // Create map record
      const { data: mapData, error: dbError } = await supabase
        .from("maps")
        .insert({
          campaign_id: campaignId,
          encounter_id: encounterId,
          name,
          image_url: publicUrl,
          width,
          height,
          grid_enabled: gridEnabled,
          grid_size: parseInt(gridSize),
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast({
        title: "Map uploaded!",
        description: `${name} is ready to use.`,
      });

      onMapCreated(mapData.id);
      setOpen(false);
      setName("");
      setFile(null);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="w-4 h-4 mr-2" />
          Upload Map
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Battle Map</DialogTitle>
          <DialogDescription>
            Upload a JPG or PNG image for your encounter. Grid overlay optional.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="map-name">Map Name</Label>
            <Input
              id="map-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goblin Cave Level 1"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="map-file">Image File</Label>
            <Input
              id="map-file"
              type="file"
              accept="image/jpeg,image/png,image/jpg"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="grid-toggle">Enable Grid Overlay</Label>
            <Switch
              id="grid-toggle"
              checked={gridEnabled}
              onCheckedChange={setGridEnabled}
            />
          </div>
          {gridEnabled && (
            <div className="space-y-2">
              <Label htmlFor="grid-size">Grid Size (pixels per square)</Label>
              <Input
                id="grid-size"
                type="number"
                min="20"
                max="100"
                value={gridSize}
                onChange={(e) => setGridSize(e.target.value)}
              />
            </div>
          )}
          <Button onClick={handleUpload} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Map"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MapUpload;
