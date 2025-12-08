import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Building2, FileText, User, LogOut, Phone, Image } from 'lucide-react';
import { AIChatBubble } from '@/components/AIChatBubble';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuthStore } from '@/store/authStore';
import logoImage from '@/assets/logo.png';

const roleMenuItems: Record<string, { title: string; icon: typeof Home; path: string }[]> = {
  admin: [
    { title: 'Home', icon: Home, path: '/admin/home' },
    { title: 'Properties', icon: Building2, path: '/admin/properties' },
    { title: 'Loan Requests', icon: FileText, path: '/admin/loan-requests' },
    { title: 'Profile', icon: User, path: '/admin/profile' },
  ],
  employee: [
    { title: 'Home', icon: Home, path: '/employee/home' },
    { title: 'Profile', icon: User, path: '/employee/profile' },
  ],
  'employee-finance': [
    { title: 'Home', icon: Home, path: '/employee/home' },
    { title: 'Loan Requests', icon: FileText, path: '/employee/loan-requests' },
    { title: 'Profile', icon: User, path: '/employee/profile' },
  ],
  agent: [
    { title: 'Home', icon: Home, path: '/home' },
    { title: 'Profile', icon: User, path: '/profile' },
    { title: 'Contact', icon: Phone, path: '/contact' },
  ],
  customer: [
    { title: 'Home', icon: Home, path: '/home' },
    { title: 'Profile', icon: User, path: '/profile' },
    { title: 'Contact', icon: Phone, path: '/contact' },
  ],
};

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  
  const getMenuKey = () => {
    const role = user?.role?.toLowerCase() || 'customer';
    if (role === 'employee' && user?.department?.toLowerCase() === 'finance') {
      return 'employee-finance';
    }
    return role;
  };
  
  const menuItems = roleMenuItems[getMenuKey()] || roleMenuItems.customer;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton size="lg">
                <img src={logoImage} alt="Kreddy King" className="size-8" />
                <div className="grid flex-1 text-left text-sm leading-tight transition-all duration-300 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0">
                  <span className="truncate font-semibold">Kreddy King</span>
                  <span className="truncate text-xs capitalize">{user?.role || 'User'}</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton
                  isActive={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu className="group-data-[collapsible=icon]:items-center">
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setShowLogoutDialog(true)} tooltip="Logout">
                <LogOut />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 md:h-16 shrink-0 items-center gap-2 border-b px-3 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border hidden sm:block" />
          <h1 className="text-base md:text-lg font-semibold truncate">Kreddy King</h1>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-2 sm:p-4">{children}</main>
      </SidebarInset>
      <AIChatBubble />
      
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-[340px] sm:max-w-[380px] gap-3">
          <AlertDialogHeader className="gap-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <LogOut className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Logout Confirmation</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel className="m-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { clearAuth(); navigate('/'); }}
              className="bg-destructive hover:bg-destructive/90 m-0"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};
