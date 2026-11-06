"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings2, UserRound } from "lucide-react";
import { useErp } from "@/components/providers/erp-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const roles: Record<string, string> = {
  ADMIN: "Administrador",
  ENGINEER: "Ingeniería",
  CLIENT: "Cliente",
  VIEWER: "Visualizador",
};

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { currentUser, logout, isLoading } = useErp();
  const name = currentUser?.name?.trim() || (isLoading ? "Cargando cuenta" : "Mi cuenta");
  const initials = name.split(/\s+/).slice(0, 2).map(n => n[0]?.toUpperCase()).join("") || "DM";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" aria-label="Abrir menú de mi perfil"
          className={compact
            ? "h-10 w-10 rounded-full p-0 hover:bg-accent"
            : "h-auto w-full min-w-0 justify-start gap-2 rounded-xl border bg-secondary/30 p-2.5 text-left shadow-sm hover:bg-accent group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-0 group-data-[collapsible=icon]:p-0"}>
          <Avatar className="h-9 w-9 shrink-0 border border-border/70">
            <AvatarImage src={currentUser?.avatar || undefined} alt={`Foto de ${name}`} className="object-cover" />
            <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          {!compact && <>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 text-left group-data-[collapsible=icon]:hidden">
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="truncate text-[11px] font-medium text-muted-foreground">{roles[currentUser?.role || ""] || "Perfil personal"}</span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden" />
          </>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} sideOffset={8} className="w-[260px] rounded-xl p-2 shadow-xl">
        <DropdownMenuLabel className="min-w-0 px-2 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{currentUser?.email || ""}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5">
          <Link href="/dashboard/perfil" className="flex items-center gap-2"><UserRound className="h-4 w-4" /> Ver mi perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="cursor-pointer rounded-lg p-2.5">
          <Link href="/dashboard/perfil" className="flex items-center gap-2"><Settings2 className="h-4 w-4" /> Editar datos y foto</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()} className="cursor-pointer rounded-lg p-2.5 text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
