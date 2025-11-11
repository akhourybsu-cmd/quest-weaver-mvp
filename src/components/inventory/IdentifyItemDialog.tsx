import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface IdentifyItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  characterId: string;
  characterName: string;
  method: 'short_rest' | 'identify_spell';
}

export function IdentifyItemDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  characterId,
  characterName,
  method,
}: IdentifyItemDialogProps) {
  const [identifying, setIdentifying] = useState(false);
  const [complete, setComplete] = useState(false);

  const handleIdentify = async () => {
    setIdentifying(true);

    try {
      // Mark item as identified
      const { error: itemError } = await supabase
        .from('items')
        .update({ identified: true })
        .eq('id', itemId);

      if (itemError) throw itemError;

      setComplete(true);
      
      const methodText = method === 'identify_spell' ? 'via Identify spell' : 'after short rest focus';
      toast.success(`${itemName} identified ${methodText}!`);

      setTimeout(() => {
        onOpenChange(false);
        setComplete(false);
      }, 2000);
    } catch (error) {
      console.error('Error identifying item:', error);
      toast.error("Failed to identify item");
    } finally {
      setIdentifying(false);
    }
  };

  const timeRequired = method === 'identify_spell' ? '1 action' : '1 hour (short rest)';
  const icon = method === 'identify_spell' ? <Sparkles className="w-5 h-5" /> : <Clock className="w-5 h-5" />;
  const description = method === 'identify_spell'
    ? `${characterName} casts Identify on ${itemName}`
    : `${characterName} focuses on ${itemName} during a short rest`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Identify Magic Item
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item Info */}
          <Alert>
            {icon}
            <AlertDescription>
              <div className="font-semibold">Item: {itemName}</div>
              <div className="text-sm mt-1">Method: {method === 'identify_spell' ? 'Identify Spell' : 'Short Rest Focus'}</div>
              <div className="text-sm">Time Required: {timeRequired}</div>
            </AlertDescription>
          </Alert>

          {/* RAW Explanation */}
          {!complete && (
            <Alert>
              <AlertDescription className="text-xs">
                <strong>RAW:</strong> {method === 'identify_spell' 
                  ? 'The Identify spell instantly reveals all magical properties of an item. (PHB 252)'
                  : 'You can focus on one magic item during a short rest while in physical contact with it. At the end of the rest, you learn all its properties. (DMG 136)'
                }
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {complete && (
            <Alert className="border-green-500 bg-green-50">
              <Eye className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <div className="font-semibold">✓ Item Identified!</div>
                <div className="text-sm mt-1">All properties of {itemName} are now revealed.</div>
              </AlertDescription>
            </Alert>
          )}

          {/* Identify Button */}
          {!complete && (
            <Button
              onClick={handleIdentify}
              disabled={identifying}
              className="w-full"
              size="lg"
            >
              {icon}
              <span className="ml-2">
                {method === 'identify_spell' ? 'Cast Identify' : 'Focus During Short Rest'}
              </span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
