import { useEffect, useRef } from "react";
import { Eye, EyeOff, Trash2, Edit, Copy } from "lucide-react";
import type { Token } from "@/hooks/useMapOverlays";

interface FloatingTokenContextMenuProps {
  x: number;
  y: number;
  token: Token;
  onToggleVisibility: (token: Token) => void;
  onDelete: (token: Token) => void;
  onEdit: (token: Token) => void;
  onDuplicate: (token: Token) => void;
  onClose: () => void;
}

export function FloatingTokenContextMenu({
  x,
  y,
  token,
  onToggleVisibility,
  onDelete,
  onEdit,
  onDuplicate,
  onClose,
}: FloatingTokenContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const menuItems = [
    { label: "Edit Token", icon: Edit, action: () => onEdit(token) },
    { label: "Duplicate", icon: Copy, action: () => onDuplicate(token) },
    null, // separator
    {
      label: token.is_visible ? "Hide from Players" : "Show to Players",
      icon: token.is_visible ? EyeOff : Eye,
      action: () => onToggleVisibility(token),
    },
    null, // separator
    {
      label: "Delete Token",
      icon: Trash2,
      action: () => onDelete(token),
      destructive: true,
    },
  ];

  return (
    <div
      ref={menuRef}
      className="absolute z-50 min-w-[180px] bg-popover border border-border rounded-md shadow-md py-1 animate-fade-in"
      style={{ left: x, top: y }}
    >
      {menuItems.map((item, i) => {
        if (!item) {
          return <div key={`sep-${i}`} className="h-px bg-border my-1" />;
        }
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-accent transition-colors ${
              (item as any).destructive ? "text-destructive hover:text-destructive" : "text-popover-foreground"
            }`}
            onClick={item.action}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
