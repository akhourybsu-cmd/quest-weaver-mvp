import { Link, useLocation } from "react-router-dom";
import { Swords, Users, BookOpen, ScrollText, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  role: "dm" | "player";
}

const BottomNav = ({ role }: BottomNavProps) => {
  const location = useLocation();

  const dmTabs = [
    { id: "session", label: "Session", icon: Swords, path: "/session/dm" },
    { id: "combat", label: "Combat", icon: Swords, path: "/combat/dm" },
    { id: "characters", label: "Party", icon: Users, path: "/characters/dm" },
    { id: "notes", label: "Notes", icon: ScrollText, path: "/notes/dm" },
    { id: "reference", label: "Reference", icon: Search, path: "/reference" },
  ];

  const playerTabs = [
    { id: "session", label: "Session", icon: Swords, path: "/session/player" },
    { id: "combat", label: "Combat", icon: Swords, path: "/combat/player" },
    { id: "characters", label: "Character", icon: Users, path: "/characters/player" },
    { id: "notes", label: "Notes", icon: BookOpen, path: "/notes/player" },
    { id: "reference", label: "Reference", icon: Search, path: "/reference" },
  ];

  const tabs = role === "dm" ? dmTabs : playerTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1",
                "transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring rounded-md",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              <span className={cn(
                "text-xs font-medium",
                isActive && "font-semibold"
              )}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
