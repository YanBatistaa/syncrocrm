import { useLocation, Link } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Users, FolderGit2, Timer, Zap, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useConfig } from "@/hooks/useConfig";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Projetos", url: "/projetos", icon: FolderGit2 },
  { title: "Workflow", url: "/workflow", icon: Timer },
];

export default function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  const { config } = useConfig();

  const isActive = (url: string) =>
    url === "/" ? currentPath === "/" : currentPath.startsWith(url);

  const displayName = config?.display_name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="py-4 px-3">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-sm text-foreground group-data-[collapsible=icon]:hidden">
            SyncroCRM
          </span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-1">
        {/* Config */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive("/config")}
              tooltip="Configurações"
            >
              <Link to="/config">
                <Settings className="w-4 h-4" />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Usuário + logout */}
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md group-data-[collapsible=icon]:justify-center">
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground truncate flex-1 group-data-[collapsible=icon]:hidden">
            {displayName}
          </span>
          <button
            onClick={signOut}
            title="Sair"
            className="text-muted-foreground hover:text-destructive transition-colors group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
