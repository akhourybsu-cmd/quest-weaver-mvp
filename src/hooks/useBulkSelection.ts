import { useState, useCallback } from "react";

export function useBulkSelection() {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleId = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(ids);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds([]);
  }, []);

  const enterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedIds([]);
  }, []);

  return {
    selectionMode,
    selectedIds,
    toggleId,
    selectAll,
    deselectAll,
    enterSelectionMode,
    exitSelectionMode,
  };
}
