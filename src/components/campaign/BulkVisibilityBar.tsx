import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BulkVisibilityBarProps {
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onCancel: () => void;
  /** The Supabase table name */
  tableName: string;
  /** The column to update — defaults to "player_visible" */
  visibilityColumn?: string;
  /** Human label like "NPCs" or "locations" */
  entityLabel: string;
  /** Called after a successful bulk update */
  onUpdated?: () => void;
}

export function BulkVisibilityBar({
  selectedIds,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onCancel,
  tableName,
  visibilityColumn = "player_visible",
  entityLabel,
  onUpdated,
}: BulkVisibilityBarProps) {
  const allSelected = selectedIds.length === totalCount && totalCount > 0;

  const handleBulkUpdate = async (visible: boolean) => {
    if (selectedIds.length === 0) return;

    try {
      const { error } = await supabase
        .from(tableName as any)
        .update({ [visibilityColumn]: visible } as any)
        .in("id", selectedIds);

      if (error) throw error;

      toast.success(
        `${selectedIds.length} ${entityLabel} ${visible ? "revealed to" : "hidden from"} players`
      );
      onUpdated?.();
      onCancel();
    } catch (err: any) {
      console.error("Bulk visibility update failed:", err);
      toast.error("Failed to update visibility");
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border border-brass/30 bg-card/95 backdrop-blur-md shadow-xl">
      <div className="flex items-center gap-2">
        <Checkbox
          checked={allSelected}
          onCheckedChange={(checked) => (checked ? onSelectAll() : onDeselectAll())}
        />
        <span className="text-sm font-cinzel font-semibold whitespace-nowrap">
          {selectedIds.length} selected
        </span>
      </div>

      <div className="h-6 w-px bg-border" />

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => handleBulkUpdate(true)}
      >
        <Eye className="w-4 h-4" />
        Reveal to Players
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        onClick={() => handleBulkUpdate(false)}
      >
        <EyeOff className="w-4 h-4" />
        Hide from Players
      </Button>

      <Button size="sm" variant="ghost" className="gap-1" onClick={onCancel}>
        <X className="w-4 h-4" />
        Cancel
      </Button>
    </div>
  );
}
