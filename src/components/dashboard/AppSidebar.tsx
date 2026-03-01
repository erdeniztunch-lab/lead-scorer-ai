import { BarChart3, LogOut, Settings, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { logout } from "@/lib/session";
import { useNavigate } from "react-router-dom";

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarContent className="bg-sidebar">
        <div className="border-b border-sidebar-border p-4">
          <span className="text-base font-bold text-sidebar-foreground">
            Lead<span className="text-sidebar-primary">Scorer</span>
          </span>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard" end activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>Leads</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/analytics" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/dashboard/settings" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                JD
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-sidebar-foreground">Jane Doe</div>
              <div className="truncate text-xs text-sidebar-foreground/60">jane@company.com</div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
