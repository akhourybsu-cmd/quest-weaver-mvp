import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Eye, EyeOff, Trash2, Edit, RotateCw, Copy } from "lucide-react";
import type { Token } from "@/hooks/useMapOverlays";

interface TokenContextMenuProps {
  children: React.ReactNode;
  token: Token;
  onToggleVisibility: (token: Token) => void;
  onDelete: (token: Token) => void;
  onEdit: (token: Token) => void;
  onDuplicate: (token: Token) => void;
}

export function TokenContextMenu({
  children,
  token,
  onToggleVisibility,
  onDelete,
  onEdit,
  onDuplicate,
}: TokenContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onEdit(token)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Token
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(token)}>
          <Copy className="w-4 h-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onToggleVisibility(token)}>
          {token.is_visible ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide from Players
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show to Players
            </>
          )}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() => onDelete(token)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Token
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
