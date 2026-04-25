import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Where to go if there is no usable browser history */
  fallback: string;
  /** Optional label; on xs viewports the label is hidden */
  label?: string;
  className?: string;
}

/**
 * History-aware back button.
 * - If there's a same-origin history entry, goes back.
 * - Otherwise navigates to `fallback`.
 * - 44px tap target, label hidden on xs.
 */
export function BackButton({ fallback, label = "Back", className }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    // history.length > 1 means there's at least one prior entry in this tab.
    // We can't reliably read the previous URL for same-origin checks, so we
    // optimistically go back; if that lands on a non-app page the browser will
    // simply leave the SPA. In practice users arrive here from inside the app.
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleClick}
      aria-label={label}
      className={cn(
        "h-11 min-w-11 gap-2 px-2 sm:px-3 text-foreground/80 hover:text-brass hover:bg-brass/10",
        className,
      )}
    >
      <ArrowLeft className="h-5 w-5 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

export default BackButton;