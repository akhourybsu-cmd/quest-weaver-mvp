import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Upload, Trash2, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CharacterPortraitEditorProps {
  characterId: string;
  characterName: string;
  currentPortraitUrl?: string | null;
  onPortraitUpdated: (newUrl: string | null) => void;
}

export const CharacterPortraitEditor = ({
  characterId,
  characterName,
  currentPortraitUrl,
  onPortraitUpdated,
}: CharacterPortraitEditorProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const getInitials = () => {
    return characterName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${characterId}/${Date.now()}.${fileExt}`;
      const filePath = `character-portraits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("maps")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("maps").getPublicUrl(filePath);
      const newUrl = data.publicUrl;

      // Update character in database
      const { error: updateError } = await supabase
        .from("characters")
        .update({ portrait_url: newUrl })
        .eq("id", characterId);

      if (updateError) throw updateError;

      onPortraitUpdated(newUrl);
      setOpen(false);

      toast({
        title: "Portrait updated",
        description: "Your character portrait has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePortrait = async () => {
    setUploading(true);
    try {
      const { error } = await supabase
        .from("characters")
        .update({ portrait_url: null })
        .eq("id", characterId);

      if (error) throw error;

      onPortraitUpdated(null);
      setOpen(false);

      toast({
        title: "Portrait removed",
        description: "Your character portrait has been removed",
      });
    } catch (error: any) {
      toast({
        title: "Error",
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
        <div className="relative group cursor-pointer">
          <Avatar className="w-24 h-24 border-4 border-brass/30 shadow-xl">
            {currentPortraitUrl ? (
              <AvatarImage src={currentPortraitUrl} alt={characterName} />
            ) : (
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Portrait</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <Avatar className="w-32 h-32 border-4 border-border shadow-xl">
            {currentPortraitUrl ? (
              <AvatarImage src={currentPortraitUrl} alt={characterName} />
            ) : (
              <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="flex flex-col gap-3 w-full">
            <Label htmlFor="portrait-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg hover:bg-accent transition-colors">
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
                <span>{uploading ? "Uploading..." : "Upload New Portrait"}</span>
              </div>
              <Input
                id="portrait-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </Label>

            {currentPortraitUrl && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={handleRemovePortrait}
                disabled={uploading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Portrait
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Recommended: Square image, at least 256x256 pixels. Max 5MB.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
