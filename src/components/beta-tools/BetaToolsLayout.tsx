import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { BetaToolsSidebar } from "./BetaToolsSidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FlaskConical, Home, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface BetaToolsLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
}

export function BetaToolsLayout({ children, title, showBackButton }: BetaToolsLayoutProps) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <BetaToolsSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border bg-brand-obsidian px-4 shrink-0">
            <SidebarTrigger className="text-brand-brass" />
            {showBackButton && (
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-brand-brass" />
              <span className="font-cinzel font-bold text-foreground">Beta Tools</span>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px]">SANDBOX</Badge>
            </div>
            {title && (
              <>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium text-foreground truncate">{title}</span>
              </>
            )}
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                <Home className="h-4 w-4 mr-1" />
                Home
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
