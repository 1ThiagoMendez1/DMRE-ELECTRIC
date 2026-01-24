"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Search, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { initialQuotes } from "@/lib/mock-data";

export default function PortalLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [step, setStep] = useState<'TRACKING' | 'VERIFICATION'>('TRACKING');
    const [trackingCode, setTrackingCode] = useState("");
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [targetQuote, setTargetQuote] = useState<string | null>(null);

    const handleTrackingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API check
        setTimeout(() => {
            const quote = initialQuotes.find(q =>
                q.numero.toLowerCase() === trackingCode.toLowerCase() ||
                q.id.toLowerCase() === trackingCode.toLowerCase()
            );

            if (quote) {
                setTargetQuote(quote.id);
                setStep('VERIFICATION');
                toast({
                    title: "Cotización Encontrada",
                    description: `Hemos enviado un código de verificación al número registrado de ${quote.cliente}.`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "No encontrado",
                    description: "No encontramos una cotización con ese número o documento.",
                });
            }
            setIsLoading(false);
        }, 1500);
    };

    const handleVerificationSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate Verification
        setTimeout(() => {
            if (verificationCode === "123456") { // Mock code
                toast({
                    title: "Identidad Verificada",
                    description: "Accediendo al portal...",
                });
                // In a real app, we would set a session cookie here
                router.push(`/portal/view?id=${targetQuote}`);
            } else {
                toast({
                    variant: "destructive",
                    title: "Código Incorrecto",
                    description: "El código ingresado no es válido. Intente nuevamente.",
                });
                setIsLoading(false); // Only stop loading on failure
            }
        }, 1500);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="text-center space-y-2 max-w-lg">
                <h1 className="text-3xl font-bold font-headline text-primary">Rastreo de Servicios</h1>
                <p className="text-muted-foreground">Ingrese el número de su cotización o servicio para consultar el estado en tiempo real y descargar entregables.</p>
            </div>

            <Card className="w-full max-w-md shadow-lg border-primary/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {step === 'TRACKING' ? <Search className="w-5 h-5 text-primary" /> : <ShieldCheck className="w-5 h-5 text-primary" />}
                        {step === 'TRACKING' ? "Consultar Estado" : "Verificación de Seguridad"}
                    </CardTitle>
                    <CardDescription>
                        {step === 'TRACKING'
                            ? "Ingrese el ID de la cotización (ej. COT-001)."
                            : "Ingrese el código de 6 dígitos enviado a su móvil."}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === 'TRACKING' ? (
                        <form onSubmit={handleTrackingSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="tracking">Código de Cotización</Label>
                                <Input
                                    id="tracking"
                                    placeholder="COT-001"
                                    value={trackingCode}
                                    onChange={(e) => setTrackingCode(e.target.value)}
                                    disabled={isLoading}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || !trackingCode}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
                                {isLoading ? "Buscando..." : "Continuar"}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerificationSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="code">Código de Verificación</Label>
                                <Input
                                    id="code"
                                    placeholder="123456"
                                    className="text-center text-2xl tracking-[0.5em] font-mono"
                                    maxLength={6}
                                    value={verificationCode}
                                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                    disabled={isLoading}
                                    autoFocus
                                />
                                <p className="text-xs text-muted-foreground text-center">
                                    ¿No recibió el código? <Button variant="link" className="p-0 h-auto text-xs" type="button">Reenviar</Button>
                                </p>
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                {isLoading ? "Verificando..." : "Acceder al Portal"}
                            </Button>
                            <Button variant="ghost" className="w-full" type="button" onClick={() => { setStep('TRACKING'); setVerificationCode(""); setIsLoading(false); }}>
                                Volver
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
