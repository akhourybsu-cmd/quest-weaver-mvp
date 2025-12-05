import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, ImageIcon, Crop } from "lucide-react";
import { nanoid } from "nanoid";
import Cropper, { Area } from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

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
  enableCrop?: boolean;
}

const aspectRatioValues = {
  square: 1,
  landscape: 16 / 9,
  portrait: 3 / 4,
  auto: 16 / 9,
};

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
  enableCrop = true,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropper state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const aspectClasses = {
    square: "aspect-square",
    landscape: "aspect-video",
    portrait: "aspect-[3/4]",
    auto: "aspect-auto min-h-[120px]",
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => (image.onload = resolve));

    const canvas = document.createElement("canvas");
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) throw new Error("No 2d context");

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      }, "image/jpeg", 0.9);
    });
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

    if (enableCrop) {
      // Open crop dialog
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setPendingFile(file);
        setCropDialogOpen(true);
      };
      reader.readAsDataURL(file);
    } else {
      // Upload directly without cropping
      await uploadFile(file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setUploading(true);
    setCropDialogOpen(false);

    try {
      const croppedBlob = await createCroppedImage(imageToCrop, croppedAreaPixels);
      const ext = pendingFile?.name.split(".").pop() || "jpg";
      const filename = `${nanoid()}.${ext}`;
      const fullPath = `${path}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, croppedBlob, {
          cacheControl: "3600",
          upsert: false,
          contentType: "image/jpeg",
        });

      if (uploadError) throw uploadError;

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
      setImageToCrop(null);
      setPendingFile(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);

    try {
      const ext = file.name.split(".").pop();
      const filename = `${nanoid()}.${ext}`;
      const fullPath = `${path}/${filename}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fullPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

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
    }
  };

  const handleRemoveImage = async () => {
    setPreviewUrl(null);
    onImageUploaded(null);
    toast.success("Image removed");
  };

  return (
    <>
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
                    Max {maxSizeMB}MB {enableCrop && "• Crop to fit"}
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

      {/* Crop Dialog */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crop className="w-5 h-5" />
              Adjust Image
            </DialogTitle>
          </DialogHeader>
          
          <div className="relative h-64 bg-black/90 rounded-lg overflow-hidden">
            {imageToCrop && (
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={aspectRatioValues[aspectRatio]}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Zoom</Label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCropDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCropConfirm} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Apply & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}