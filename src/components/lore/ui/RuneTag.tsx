import { X } from "lucide-react";

interface RuneTagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: "default" | "outline" | "accent";
  className?: string;
}

export default function RuneTag({ 
  children, 
  onRemove, 
  variant = "default",
  className = "" 
}: RuneTagProps) {
  const variantClasses = {
    default: "bg-card/60 border-brass/40",
    outline: "bg-transparent border-border",
    accent: "bg-primary/10 border-primary/30 text-primary"
  };

  return (
    <span className={`rune-tag ${variantClasses[variant]} ${className}`}>
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
