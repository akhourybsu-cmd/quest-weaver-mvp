import { useState } from "react";
import { ChevronRight, ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Location {
  id: string;
  name: string;
  location_type: string | null;
  parent_location_id: string | null;
  path: string | null;
  tags: string[];
}

interface LocationTreeViewProps {
  locations: Location[];
  onLocationSelect: (location: Location) => void;
  selectedLocationId?: string;
}

interface TreeNode {
  location: Location;
  children: TreeNode[];
  childCount: number;
}

function buildTree(locations: Location[]): TreeNode[] {
  const locationMap = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];

  // Initialize all nodes
  locations.forEach((loc) => {
    locationMap.set(loc.id, { location: loc, children: [], childCount: 0 });
  });

  // Build tree structure and count children
  locations.forEach((loc) => {
    const node = locationMap.get(loc.id)!;
    if (loc.parent_location_id && locationMap.has(loc.parent_location_id)) {
      const parent = locationMap.get(loc.parent_location_id)!;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Count all descendants
  const countDescendants = (node: TreeNode): number => {
    let count = node.children.length;
    node.children.forEach((child) => {
      count += countDescendants(child);
    });
    node.childCount = node.children.length; // Direct children only for display
    return count;
  };

  roots.forEach(countDescendants);

  return roots.sort((a, b) => a.location.name.localeCompare(b.location.name));
}

function TreeNodeComponent({
  node,
  onSelect,
  selectedId,
  level = 0,
}: {
  node: TreeNode;
  onSelect: (loc: Location) => void;
  selectedId?: string;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(level === 0); // Expand root nodes by default

  const hasChildren = node.children.length > 0;
  const isSelected = node.location.id === selectedId;

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${
          isSelected ? "bg-accent" : ""
        }`}
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
        onClick={() => onSelect(node.location)}
      >
        {hasChildren ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4 text-brass" />
            ) : (
              <ChevronRight className="h-4 w-4 text-brass" />
            )}
          </Button>
        ) : (
          <div className="w-5" />
        )}

        <MapPin className="h-3.5 w-3.5 text-arcanePurple shrink-0" />

        <span className="text-sm font-medium truncate flex-1">{node.location.name}</span>

        {node.location.location_type && (
          <span className="text-xs text-muted-foreground shrink-0">
            {node.location.location_type}
          </span>
        )}

        {hasChildren && (
          <Badge variant="secondary" className="h-5 px-1.5 text-xs shrink-0">
            {node.childCount}
          </Badge>
        )}
      </div>

      {hasChildren && expanded && (
        <div className="mt-0.5">
          {node.children
            .sort((a, b) => a.location.name.localeCompare(b.location.name))
            .map((child) => (
              <TreeNodeComponent
                key={child.location.id}
                node={child}
                onSelect={onSelect}
                selectedId={selectedId}
                level={level + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function LocationTreeView({
  locations,
  onLocationSelect,
  selectedLocationId,
}: LocationTreeViewProps) {
  const tree = buildTree(locations);

  if (tree.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No locations to display
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="space-y-0.5 p-2">
        {tree.map((node) => (
          <TreeNodeComponent
            key={node.location.id}
            node={node}
            onSelect={onLocationSelect}
            selectedId={selectedLocationId}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
