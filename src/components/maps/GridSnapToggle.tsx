import { Button } from "@/components/ui/button";
import { Grid3x3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GridSnapToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function GridSnapToggle({ enabled, onToggle }: GridSnapToggleProps) {
  const { toast } = useToast();

  const handleToggle = () => {
    const newValue = !enabled;
    onToggle(newValue);
    toast({
      title: newValue ? "Grid Snap Enabled" : "Grid Snap Disabled",
      description: newValue 
        ? "Tokens will snap to grid intersections" 
        : "Tokens can be placed freely",
    });
  };

  return (
    <Button
      variant={enabled ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      className="shadow-lg"
    >
      {enabled ? (
        <>
          <Grid3x3 className="w-4 h-4 mr-2" />
          Snap: ON
        </>
      ) : (
        <>
          <Grid3x3 className="w-4 h-4 mr-2 opacity-50" />
          Snap: OFF
        </>
      )}
    </Button>
  );
}
