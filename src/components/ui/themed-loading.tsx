import { Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ThemedLoadingProps {
  message?: string;
}

export const ThemedLoading = ({ message = "Loading..." }: ThemedLoadingProps) => (
  <div className="min-h-[40vh] flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-brass" />
      <p className="font-cinzel text-muted-foreground">{message}</p>
    </div>
  </div>
);

interface ThemedEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const ThemedEmpty = ({ icon: Icon, title, description, actionLabel, onAction }: ThemedEmptyProps) => (
  <Card className="border-dashed border-brass/30">
    <CardContent className="flex flex-col items-center justify-center py-12">
      <Icon className="w-12 h-12 text-brass/50 mb-4" />
      <h3 className="font-cinzel font-semibold text-lg mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brass hover:bg-brass/90 text-brass-foreground">
          {actionLabel}
        </Button>
      )}
    </CardContent>
  </Card>
);
