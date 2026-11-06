import type { Metadata } from "next";
import StartLoginOne from "@/components/ui/login-1";

export const metadata: Metadata = {
  title: "Iniciar sesión | DMRE Electric",
  description: "Acceso seguro a la plataforma de gestión DMRE Electric.",
};

export default function LoginPage() {
  return <StartLoginOne />;
}
