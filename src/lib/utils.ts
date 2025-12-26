import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDateES(date: Date | string | number): string {
  const d = new Date(date);
  // Format: "Lun 22/12/2025"
  const dayName = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  const formattedDate = d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)} ${formattedDate}`;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
}
