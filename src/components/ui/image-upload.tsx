import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { nanoid } from "nanoid";

interface ImageUploadProps {
  bucket: string;
  path: string;
  currentImageUrl?: string | null;
  onImageUploaded: (url: string | null) => void;
  label?: string;
  accept?: string;
  maxSizeMB?: number;
  aspectRatio?: "square" | "landscape" | "portrait" | "auto";
  className?: string;
}

export function ImageUpload({
  bucket,
  path,
  currentImageUrl,
  onImageUploaded,
  label = "Image",
  accept = "image/*",
  maxSizeMB = 5,
  aspectRatio = "auto",
  className = "",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "aspect-auto min-h-[120px]",
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB.`);
      return;
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const ext = file.name.split(".").pop();
      const filename = `${nanoid()}.${ext}`;
      const fullPath = `${path}/${filename}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fullPath);

      const publicUrl = urlData.publicUrl;
      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(`Failed to upload image: ${error.message}`);
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveImage = async () => {
    // Just clear the preview and notify parent - don't delete from storage
    // (in case it's used elsewhere or for history)
    setPreviewUrl(null);
    onImageUploaded(null);
    toast.success("Image removed");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <div
        className={`relative border-2 border-dashed border-brass/30 rounded-lg overflow-hidden bg-background/50 ${aspectClasses[aspectRatio]}`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={handleRemoveImage}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </>
        ) : (
          <div
            className="flex flex-col items-center justify-center h-full p-4 cursor-pointer hover:bg-accent/20 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-brass" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  Click to upload
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Max {maxSizeMB}MB
                </p>
              </>
            )}
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
}
