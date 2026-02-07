import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface PlayerEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function PlayerEmptyState({ icon: Icon, title, description }: PlayerEmptyStateProps) {
  return (
    <Card className="border-dashed border-2 border-border/60">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="rounded-full bg-muted/50 p-4 mb-4">
          <Icon className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="font-cinzel text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
      </CardContent>
    </Card>
  );
}
