'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { LogOut, LayoutDashboard as LayoutDashboardIcon, Users as UsersIcon, Package as PackageIcon, FileText as FileTextIcon, ClipboardList as ClipboardListIcon, ChevronDown } from 'lucide-react';
import { dashboardNavItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Image from 'next/image';

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
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === "/dashboard/sistema"} tooltip="Resumen">
                        <Link href="/dashboard/sistema">
                          <LayoutDashboardIcon className="h-4 w-4" />
                          <span>Resumen</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/clientes")} tooltip="Clientes">
                        <Link href="/dashboard/sistema/clientes">
                          <UsersIcon className="h-4 w-4" />
                          <span>Clientes</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/inventario")} tooltip="Inventario">
                        <Link href="/dashboard/sistema/inventario">
                          <PackageIcon className="h-4 w-4" />
                          <span>Inventario</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/cotizacion")} tooltip="Cotizador">
                        <Link href="/dashboard/sistema/cotizacion">
                          <FileTextIcon className="h-4 w-4" />
                          <span>Cotizador (Kardex)</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname.startsWith("/dashboard/sistema/registro")} tooltip="Registro">
                        <Link href="/dashboard/sistema/registro">
                          <ClipboardListIcon className="h-4 w-4" />
                          <span>Registro Obras</span>
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
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
