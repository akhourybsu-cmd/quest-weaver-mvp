import { useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, Library, Lock } from "lucide-react";
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

  return (
    <Sidebar collapsible="icon" className="border-r border-amber-500/20">
      <SidebarContent className="bg-gradient-to-b from-amber-950/20 to-background">
        {/* Top nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/beta-tools")}
                  isActive={currentPath === "/beta-tools"}
                  className="data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-200 data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-amber-400"
                >
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  {!collapsed && <span>Workshop</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/beta-tools/library")}
                  isActive={currentPath === "/beta-tools/library"}
                  className="data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-200 data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-amber-400"
                >
                  <Library className="h-4 w-4 text-amber-400" />
                  {!collapsed && <span>My Library</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {!collapsed && <Separator className="bg-amber-500/15 mx-3" />}

        {/* Tool categories */}
        {TOOL_CATEGORIES.map((cat) => {
          const tools = getToolsByCategory(cat.id);

          return (
            <SidebarGroup key={cat.id} className="pt-2">
              <SidebarGroupLabel className="text-amber-400/70 uppercase text-[10px] tracking-wider border-b border-amber-500/10 pb-1 mb-1">
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
                            data-[active=true]:bg-amber-500/20 data-[active=true]:text-amber-200 data-[active=true]:font-medium data-[active=true]:border-l-2 data-[active=true]:border-l-amber-400
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
