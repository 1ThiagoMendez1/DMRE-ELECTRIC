import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import Link from "next/link";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between py-4">
                    <Link href="/portal" className="flex items-center gap-3 font-bold text-2xl">
                        <div className="relative h-14 w-14">
                            <Image src="/logo.png" alt="D.M.R.E" fill priority quality={100} className="object-contain" />
                        </div>
                        <span>D.M.R.E <span className="text-muted-foreground font-normal text-lg">| Portal Clientes</span></span>
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
