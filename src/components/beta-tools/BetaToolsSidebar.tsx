import { useLocation, useNavigate } from "react-router-dom";
import { FlaskConical, Library } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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
                  className="data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-300"
                >
                  <FlaskConical className="h-4 w-4 text-amber-400" />
                  {!collapsed && <span>Workshop</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => navigate("/beta-tools/library")}
                  isActive={currentPath === "/beta-tools/library"}
                  className="data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-300"
                >
                  <Library className="h-4 w-4 text-amber-400" />
                  {!collapsed && <span>My Library</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tool categories */}
        {TOOL_CATEGORIES.map((cat) => {
          const tools = getToolsByCategory(cat.id);
          const activeTools = tools.filter(t => t.status === 'active');
          const hasActiveTool = tools.some(t => currentPath.includes(`/generate/${t.id}`));

          return (
            <SidebarGroup key={cat.id}>
              <SidebarGroupLabel className="text-amber-400/70 uppercase text-[10px] tracking-wider">
                {!collapsed && cat.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {tools.map((tool) => (
                    <SidebarMenuItem key={tool.id}>
                      <SidebarMenuButton
                        onClick={() => tool.status === 'active' && navigate(`/beta-tools/generate/${tool.id}`)}
                        isActive={currentPath === `/beta-tools/generate/${tool.id}`}
                        disabled={tool.status === 'coming_soon'}
                        className="data-[active=true]:bg-amber-500/15 data-[active=true]:text-amber-300 disabled:opacity-40"
                      >
                        <tool.icon className="h-4 w-4" />
                        {!collapsed && (
                          <span className="flex items-center gap-2 truncate">
                            {tool.name}
                            {tool.status === 'coming_soon' && (
                              <Badge variant="outline" className="text-[8px] px-1 py-0 border-muted-foreground/30 text-muted-foreground">
                                Soon
                              </Badge>
                            )}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}
