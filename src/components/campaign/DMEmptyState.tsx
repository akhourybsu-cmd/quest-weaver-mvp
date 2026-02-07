import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface DMEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function DMEmptyState({ icon: Icon, title, description, actionLabel, onAction }: DMEmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-brass/30 bg-card/30">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="rounded-full bg-brass/10 p-4 mb-4">
          <Icon className="w-10 h-10 text-brass/60" />
        </div>
        <h3 className="font-cinzel text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} size="sm">
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
