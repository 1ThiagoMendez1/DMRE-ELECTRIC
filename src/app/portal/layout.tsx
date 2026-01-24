import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between py-4">
                    <Link href="/portal" className="flex items-center gap-2 font-bold text-xl">
                        <div className="relative h-8 w-8">
                            <Image src="https://i.ibb.co/MFtSVtR/dmreLogo.png" alt="D.M.R.E" fill className="object-contain" />
                        </div>
                        <span>D.M.R.E <span className="text-muted-foreground font-normal text-sm">| Portal Clientes</span></span>
                    </Link>
                    <ThemeToggle />
                </div>
            </header>
            <main className="flex-1 container py-8">
                {children}
            </main>
            <footer className="border-t py-6 text-center text-sm text-muted-foreground">
                <div className="container">
                    &copy; {new Date().getFullYear()} D.M.R.E Electric S.A.S. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}
