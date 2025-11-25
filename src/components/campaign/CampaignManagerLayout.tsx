import { useState, ReactNode, useEffect } from "react";
import { Search, Plus, Archive, Command as CommandIcon, ChevronLeft, ChevronRight, LogOut, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface Campaign {
  id: string;
  name: string;
  system: string;
}

interface CampaignManagerLayoutProps {
  campaigns: Campaign[];
  activeCampaignId: string | null;
  onCampaignSelect: (id: string) => void;
  onNewCampaign: () => void;
  onImport: () => void;
  onArchive: () => void;
  children: ReactNode;
  inspectorContent?: ReactNode;
  inspectorOpen?: boolean;
  onInspectorClose?: () => void;
}

export function CampaignManagerLayout({
  campaigns,
  activeCampaignId,
  onCampaignSelect,
  onNewCampaign,
  onImport,
  onArchive,
  children,
  inspectorContent,
  inspectorOpen = false,
  onInspectorClose,
}: CampaignManagerLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [leftRailCollapsed, setLeftRailCollapsed] = useState(() => {
    const stored = localStorage.getItem('qw:sidebarCollapsed');
    return stored ? JSON.parse(stored) : false;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data?.user?.email || null);
    });
  }, []);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setLeftRailCollapsed(true);
    }
  }, [isMobile]);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('qw:sidebarCollapsed', JSON.stringify(leftRailCollapsed));
    }
  }, [leftRailCollapsed, isMobile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCampaign = campaigns.find(c => c.id === activeCampaignId);

  // Sidebar content component to reuse between desktop and mobile
  const SidebarContent = ({ inSheet = false }: { inSheet?: boolean }) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-brass/20">
        <div className="flex items-center justify-between mb-4">
          {(!leftRailCollapsed || inSheet) && (
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="Quest Weaver" className="w-8 h-8" />
              <span className="font-cinzel text-lg font-semibold text-ink">Quest Weaver</span>
            </div>
          )}
          {!inSheet && !isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftRailCollapsed(!leftRailCollapsed)}
              className="shrink-0"
            >
              {leftRailCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          )}
        </div>
        {(!leftRailCollapsed || inSheet) && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brass" />
            <Input
              placeholder="Search campaigns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-obsidian/50 border-brass/30 text-ink placeholder:text-brass/50"
            />
          </div>
        )}
      </div>

      {/* Campaign List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredCampaigns.map((campaign) => (
            <button
              key={campaign.id}
              onClick={() => {
                onCampaignSelect(campaign.id);
                if (inSheet) setMobileSidebarOpen(false);
              }}
              className={cn(
                "w-full p-3 mb-1 rounded-lg text-left transition-all hover:bg-brass/10",
                activeCampaignId === campaign.id
                  ? "bg-arcanePurple/20 border border-arcanePurple/40"
                  : "border border-transparent"
              )}
            >
              {(!leftRailCollapsed || inSheet) && (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded bg-gradient-to-br from-brass/20 to-brass/10 flex items-center justify-center text-xs font-cinzel font-bold text-brass">
                      {campaign.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{campaign.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-brass/30 text-brass">
                      {campaign.system}
                    </Badge>
                  </div>
                </>
              )}
            </button>
          ))}
        </div>
      </ScrollArea>

      {/* Quick Actions */}
      <Separator className="bg-brass/20" />
      {(!leftRailCollapsed || inSheet) ? (
        <div className="p-3 space-y-2">
          <Button onClick={() => { onNewCampaign(); if (inSheet) setMobileSidebarOpen(false); }} className="w-full justify-start" variant="ghost" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Campaign
          </Button>
          <Button onClick={() => { onImport(); if (inSheet) setMobileSidebarOpen(false); }} className="w-full justify-start" variant="ghost" size="sm">
            <Archive className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Separator className="bg-brass/20 my-2" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                <span className="truncate">{userEmail || 'User'}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="p-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-full">
                <User className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{userEmail}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-obsidian text-ink overflow-hidden">
      {/* Mobile Header - Only visible on mobile */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 z-30 h-14 bg-obsidian/95 backdrop-blur-sm border-b border-brass/20 flex items-center px-3 gap-3">
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0 bg-obsidian border-brass/20">
              <SidebarContent inSheet />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <img src="/logo.png" alt="Quest Weaver" className="w-7 h-7 shrink-0" />
            <span className="font-cinzel text-sm font-semibold text-ink truncate">
              {activeCampaign?.name || 'Quest Weaver'}
            </span>
          </div>
        </div>
      )}

      {/* Left Rail - Campaign Switcher (Desktop only) */}
      {!isMobile && (
        <aside
          className={cn(
            "border-r border-brass/20 bg-obsidian/95 backdrop-blur-sm transition-all duration-200",
            leftRailCollapsed ? "w-16" : "w-[280px]"
          )}
        >
          <SidebarContent />
        </aside>
      )}

      {/* Main Workspace */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden",
        isMobile && "pt-14" // Add padding for mobile header
      )}>
        {children}
      </main>

      {/* Inspector Panel */}
      <Sheet open={inspectorOpen} onOpenChange={onInspectorClose}>
        <SheetContent side="right" className="w-[360px] sm:w-[400px] bg-obsidian border-brass/20">
          {inspectorContent}
        </SheetContent>
      </Sheet>
    </div>
  );
}