import { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock } from 'lucide-react';

interface AccessBoundaryProps {
  canEdit: boolean;
  reason?: string;
  children: ReactNode;
}

export function AccessBoundary({ canEdit, reason = "DM-only action", children }: AccessBoundaryProps) {
  if (canEdit) {
    return <>{children}</>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative opacity-50 pointer-events-none">
            {children}
            <Lock className="absolute top-1 right-1 h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{reason}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
