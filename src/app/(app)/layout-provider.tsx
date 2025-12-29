'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  Calendar, 
  Package, 
  Wrench, 
  ShoppingBag, 
  Settings, 
  Home,
  Loader2,
  PanelLeft,
  Moon,
  Sun,
  LogOut,
  User,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { useTheme } from 'next-themes';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ROLE_LABELS, getInitials } from '@/lib/utils';
import React, { PropsWithChildren } from 'react';

const navItems = [
  { href: '/accueil', label: 'Accueil', icon: Home, module: null },
  { href: '/administration', label: 'Administration', icon: Building2, module: 'administration' as const },
  { href: '/calendrier', label: 'Calendrier', icon: Calendar, module: 'calendrier' as const },
  { href: '/stock', label: 'Gestion de Stock', icon: Package, module: 'stock' as const },
  { href: '/technique', label: 'Technique', icon: Wrench, module: 'technique' as const },
  { href: '/marketing', label: 'Marketing', icon: ShoppingBag, module: 'marketing' as const },
  { href: '/parametres', label: 'Paramètres', icon: Settings, module: 'parametres' as const },
];

const getTitleFromPath = (path: string) => {
  if (path === '/accueil') return 'Bienvenue sur Gestion DCAT';
  const item = navItems.find((item) => path.startsWith(item.href) && item.href !== '/accueil');
  if (item) return item.label;
  if (path.startsWith('/mon-profil')) return 'Mon Profil';
  return 'Gestion DCAT';
};

type AppShellContentProps = PropsWithChildren<{
  user: { role?: string; nom?: string; email?: string; avatarUrl?: string | null };
  pathname: string;
  pageTitle: string;
}>;

function AppShellContent({ user, pathname, pageTitle, children }: AppShellContentProps) {
  const { setOpenMobile, toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const { canAccess } = usePermissions();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <>
      <Sidebar collapsible="icon">
        <SidebarHeader className="flex items-center justify-between gap-2 p-4 group-data-[collapsible=icon]:justify-center">
          <Link
            href="/accueil"
            className="flex items-center gap-3 text-sidebar-foreground group-data-[collapsible=icon]:hidden"
          >
            <Image
              src="/dcat-logo.png"
              alt="Logo DCAT"
              width={40}
              height={40}
              className="h-10 w-10 rounded-md object-contain shadow-sm ring-2 ring-white/20"
              priority
            />
            <span className="text-lg font-headline font-bold leading-tight">
              Gestion DCAT
            </span>
          </Link>
          <SidebarTrigger className="hidden md:inline-flex group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem className="hidden group-data-[collapsible=icon]:block">
              <SidebarMenuButton onClick={() => toggleSidebar()} aria-label="Afficher le menu">
                <PanelLeft />
              </SidebarMenuButton>
            </SidebarMenuItem>
            {navItems.map((item) => {
              // Allow access to home for everyone, check permissions for other modules
              const hasAccess = item.module === null || canAccess(item.module);
              if (!hasAccess) return null;
              
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || (item.href !== '/accueil' && pathname.startsWith(item.href))}
                    tooltip={item.label}
                    onClick={() => setOpenMobile(false)}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        {user.role && (
          <SidebarFooter className="p-4 group-data-[collapsible=icon]:hidden">
            <div className="text-xs text-sidebar-foreground/50">
              Connecté en tant que {ROLE_LABELS[user.role] || user.role}
            </div>
          </SidebarFooter>
        )}
      </Sidebar>
      <SidebarInset className="bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <div>
              <h1 className="text-lg font-semibold md:text-xl">{pageTitle}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-9 w-9"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Changer le thème</span>
            </Button>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-9 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(user.nom || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium whitespace-nowrap">
                    {user.nom}
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.nom}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/mon-profil" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Mon Profil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </>
  );
}

export function AppLayoutProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const pageTitle = getTitleFromPath(pathname);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pathname]);

  React.useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Chargement...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Redirection vers la connexion…</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppShellContent user={user} pathname={pathname} pageTitle={pageTitle}>
        {children}
      </AppShellContent>
    </SidebarProvider>
  );
}
