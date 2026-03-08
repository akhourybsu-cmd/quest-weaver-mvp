import { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, Library, Lock, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TOOL_CATEGORIES, getToolsByCategory } from "./toolRegistry";

export function BetaToolsSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const [search, setSearch] = useState("");

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.toLowerCase();
    return TOOL_CATEGORIES.map(cat => ({
      ...cat,
      tools: getToolsByCategory(cat.id).filter(t => t.name.toLowerCase().includes(q)),
    })).filter(cat => cat.tools.length > 0);
  }, [search]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-card overflow-y-auto">
        {/* Top nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/beta-tools")}
                  isActive={currentPath === "/beta-tools"}
                  className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-primary"
                >
                  <FlaskConical className="h-4 w-4 text-brand-brass" />
                  {!collapsed && <span>Workshop</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/beta-tools/library")}
                  isActive={currentPath === "/beta-tools/library"}
                  className="data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-primary"
                >
                  <Library className="h-4 w-4 text-brand-brass" />
                  {!collapsed && <span>My Library</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="bg-border mx-3" />}

        {/* Search */}
        {!collapsed && (
          <div className="px-3 pt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tools..."
                className="h-8 pl-8 text-xs bg-muted/50 border-border/50"
              />
            </div>
          </div>
        )}

        {/* Tool categories */}
        {TOOL_CATEGORIES.map((cat) => {
          const allTools = getToolsByCategory(cat.id);
          const tools = filteredCategories ? filteredCategories.find(fc => fc.id === cat.id)?.tools : allTools;
          if (filteredCategories && !tools) return null;

          return (
            <SidebarGroup key={cat.id} className="pt-2">
              <SidebarGroupLabel className="text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border/50 pb-1 mb-1">
                {!collapsed && cat.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tools.map((tool) => {
                    const isActive = currentPath === `/beta-tools/generate/${tool.id}`;
                    const isComingSoon = tool.status === "coming_soon";

                    return (
                      <SidebarMenuItem key={tool.id}>
                        <SidebarMenuButton
                          onClick={() => !isComingSoon && navigate(`/beta-tools/generate/${tool.id}`)}
                          isActive={isActive}
                          disabled={isComingSoon}
                          className={`
                            transition-all duration-150
                            data-[active=true]:bg-accent data-[active=true]:text-accent-foreground data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-primary
                            ${isComingSoon ? "opacity-30 hover:opacity-50" : ""}
                          `}
                        >
                          <tool.icon className="h-4 w-4" />
                          {!collapsed && (
                            <span className="flex items-center gap-2 truncate">
                              {tool.name}
                              {isComingSoon && (
                                <Lock className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                              )}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
