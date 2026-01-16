'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from './ui/button';
import { LogOut, LayoutDashboard as LayoutDashboardIcon, Users as UsersIcon, Package as PackageIcon, FileText as FileTextIcon, ClipboardList as ClipboardListIcon, ChevronDown, DollarSign, Truck, Car, Briefcase } from 'lucide-react';
import { dashboardNavItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';
import { ThemeToggle } from './theme-toggle';
import { NotificationCenter } from './notification-center';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold font-headline text-glow-primary transition-all duration-300">
              <div className="relative h-10 w-10 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all duration-300">
                <Image src="https://i.ibb.co/MFtSVtR/dmreLogo.png" alt="D.M.R.E Logo" fill className="object-contain" />
              </div>
              <span className="group-data-[collapsible=icon]:hidden whitespace-nowrap overflow-hidden transition-all duration-300">D.M.R.E</span>
            </Link>
          </div>
        </SidebarHeader>
        <SidebarContent>

          {/* General Group */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-xs font-semibold text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group-data-[collapsible=icon]:hidden">
                  General
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {dashboardNavItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          asChild
                          isActive={pathname === item.href}
                          tooltip={item.label}
                          className={cn(pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground")}
                        >
                          <Link href={item.href}>
                            <item.icon />
                            <span>{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

          {/* Sistema Simplificado Group */}
          <Collapsible defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between p-2 text-xs font-semibold text-muted-foreground outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md group-data-[collapsible=icon]:hidden">
                  Sistema Simplificado
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {/* Dashboard General */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/sistema"} tooltip="Dashboard">
                        <Link href="/dashboard/sistema">
                          <LayoutDashboardIcon className="h-4 w-4" />
                          <span>Dashboard</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* A. COMERCIAL - includes Cotizador */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/comercial") || pathname.startsWith("/dashboard/sistema/cotizacion")} tooltip="Comercial">
                        <Link href="/dashboard/sistema/comercial">
                          <UsersIcon className="h-4 w-4" />
                          <span>Comercial</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* B. FINANCIERA - includes Créditos */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/financiera") || pathname.startsWith("/dashboard/sistema/creditos")} tooltip="Financiera">
                        <Link href="/dashboard/sistema/financiera">
                          <DollarSign className="h-4 w-4" />
                          <span>Financiera</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* C. LOGÍSTICA */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/logistica") || pathname.startsWith("/dashboard/sistema/inventario") || pathname.startsWith("/dashboard/sistema/suministro") || pathname.startsWith("/dashboard/sistema/dotacion") || pathname.startsWith("/dashboard/sistema/activos")} tooltip="Logística">
                        <Link href="/dashboard/sistema/logistica">
                          <PackageIcon className="h-4 w-4" />
                          <span>Logística</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* D. OPERACIONES - includes Registro, Códigos */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/operaciones") || pathname.startsWith("/dashboard/sistema/registro") || pathname.startsWith("/dashboard/sistema/codigos-trabajo")} tooltip="Operaciones">
                        <Link href="/dashboard/sistema/operaciones">
                          <ClipboardListIcon className="h-4 w-4" />
                          <span>Operaciones</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* E. TALENTO HUMANO */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/talento-humano")} tooltip="Talento Humano">
                        <Link href="/dashboard/sistema/talento-humano">
                          <Briefcase className="h-4 w-4" />
                          <span>Talento Humano</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* F. CONTROL Y SISTEMA */}
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/control") || pathname.startsWith("/dashboard/sistema/usuarios") || pathname.startsWith("/dashboard/sistema/roles") || pathname.startsWith("/dashboard/sistema/agenda")} tooltip="Control">
                        <Link href="/dashboard/sistema/control">
                          <ClipboardListIcon className="h-4 w-4" />
                          <span>Control</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>

        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 mx-2 group-data-[collapsible=icon]:mx-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:bg-transparent">
            <Avatar className="h-8 w-8">
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden overflow-hidden">
              <span className="text-sm font-semibold truncate">Admin</span>
              <span className="text-xs text-muted-foreground truncate">admin@dmre.co</span>
            </div>
          </div>
          <Button variant="ghost" asChild className="w-full justify-start gap-2 mt-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Link href="/">
              <LogOut className="h-4 w-4" />
              <span className="group-data-[collapsible=icon]:hidden">Cerrar Sesión</span>
            </Link>
          </Button>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1 h-8 w-8 hover:bg-accent/50 hover:text-accent-foreground transition-colors" />
            <Separator orientation="vertical" className="mr-2 h-4 mx-2" />
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="hidden sm:inline-block">Panel de Control</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-block text-sm text-muted-foreground mr-2 capitalize font-medium">
              {format(new Date(), "EEEE, dd 'de' MMM yyyy", { locale: es })}
            </span>
            <NotificationCenter />
            <ThemeToggle />
          </div>
        </header>
        <div className="flex-1 p-4 sm:p-6 lg:p-8 pt-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
