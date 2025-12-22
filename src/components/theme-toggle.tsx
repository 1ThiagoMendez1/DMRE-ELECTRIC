"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-full w-9 h-9 transition-colors duration-300 hover:bg-accent/20"
            title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={`absolute top-0 left-0 w-full h-full transition-all duration-300 transform ${theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
                        }`}
                />
                <Moon
                    className={`absolute top-0 left-0 w-full h-full transition-all duration-300 transform ${theme === "dark" ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
                        }`}
                />
            </div>
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
