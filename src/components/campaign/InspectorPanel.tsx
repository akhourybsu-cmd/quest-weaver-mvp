import { ReactNode } from "react";
import { SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface InspectorPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  onClose?: () => void;
}

export function InspectorPanel({
  title,
  description,
  children,
  actions,
  onClose,
}: InspectorPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <SheetHeader className="px-6 pt-6 pb-4 border-b border-brass/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <SheetTitle className="font-cinzel text-xl text-ink">{title}</SheetTitle>
            {description && (
              <SheetDescription className="mt-1 text-brass/70">{description}</SheetDescription>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 -mt-1 -mr-2">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">{children}</div>
      </ScrollArea>

      {actions && (
        <>
          <Separator className="bg-brass/20" />
          <div className="px-6 py-4 flex items-center gap-2 justify-end">{actions}</div>
        </>
      )}
    </div>
  );
}
