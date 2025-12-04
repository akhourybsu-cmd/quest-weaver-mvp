import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface LoreSectionProps {
  title: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
  accentClass?: string;
}

export default function LoreSection({ 
  title, 
  icon: Icon,
  children, 
  className = "",
  accentClass = ""
}: LoreSectionProps) {
  return (
    <div className={`fantasy-section p-4 ${accentClass} ${className}`}>
      <div className="lore-section-title">
        {Icon && <Icon className="w-4 h-4 text-brass" />}
        {title}
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}
