import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HandoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
}

const HandoutDialog = ({ open, onOpenChange, campaignId }: HandoutDialogProps) => {
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("text");
  const [contentText, setContentText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleAdd = async () => {
    if (!title) {
      toast({
        title: "Missing information",
        description: "Please provide a handout title.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      let contentUrl = null;

      if (contentType === "image" && file) {
        const fileName = `${campaignId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from("handouts")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("handouts").getPublicUrl(fileName);
        contentUrl = data.publicUrl;
      }

      const { error } = await supabase.from("handouts").insert({
        campaign_id: campaignId,
        title,
        content_type: contentType,
        content_url: contentUrl,
        content_text: contentType === "text" ? contentText : null,
        is_revealed: false,
      });

      if (error) throw error;

      toast({
        title: "Handout added!",
        description: `${title} created. Reveal it when ready.`,
      });

      setTitle("");
      setContentText("");
      setFile(null);
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Handout</DialogTitle>
          <DialogDescription>
            Add an image or text handout to reveal to players.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="handout-title">Title</Label>
            <Input
              id="handout-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ancient Map Fragment"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger id="content-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="image">Image</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {contentType === "text" && (
            <div className="space-y-2">
              <Label htmlFor="content-text">Content</Label>
              <Textarea
                id="content-text"
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                placeholder="The ancient scroll reads..."
                rows={6}
              />
            </div>
          )}

          {contentType === "image" && (
            <div className="space-y-2">
              <Label htmlFor="handout-file">Image File</Label>
              <Input
                id="handout-file"
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
          )}

          <Button onClick={handleAdd} disabled={uploading} className="w-full">
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Handout"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HandoutDialog;
