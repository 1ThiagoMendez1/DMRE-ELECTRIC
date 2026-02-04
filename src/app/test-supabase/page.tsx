"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TestSupabase() {
    const [status, setStatus] = useState<string>("Initializing...");
    const [details, setDetails] = useState<string>("");
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        async function checkConnection() {
            try {
                const supabase = createClient();

                // Log the URL (masked) to verify it's reading env vars
                const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                setUrl(sbUrl ? `${sbUrl.substring(0, 15)}...` : "UNDEFINED");

                setStatus("Testing Network Connection...");

                // FORCE Network Request to validate Key/URL
                // A simple query to a system table or non-existent table forces the client to talk to the server.
                // If the Key is invalid, the server MUST return 401 Unauthorized.
                const { error: networkError } = await supabase.from('__ping_check__').select('*').limit(1);

                if (networkError) {
                    console.log("Network Error Response:", networkError);

                    // Check for Auth specific errors
                    if (networkError.code === '401' || networkError.message.includes('key') || networkError.message.includes('JWT')) {
                        setStatus("❌ CONNECTION FAILED: Credenciales Inválidas (401)");
                        setDetails(`El servidor rechazó la llave. \nMsg: ${networkError.message} \nHint: ¿Reiniciaste la terminal después de cambiar el .env?`);
                        return;
                    }

                    // Check for Connection errors (wrong URL)
                    if (networkError.message.includes('Failed to fetch') || networkError.message.includes('Network request failed') || networkError.message.includes('Load failed')) {
                        setStatus("❌ CONNECTION FAILED: Error de Red");
                        setDetails(`No se pudo conectar a: ${sbUrl}. \nPosibles causas:\n1. URL incorrecta.\n2. Servidor apagado.\n3. Bloqueo de CORS o SSL (común en self-hosted local).\n\nError Original: ${networkError.message}`);
                        return;
                    }

                    if (networkError.code === 'PGRST204' || networkError.code === '42P01') {
                        setStatus("✅ CONEXIÓN EXITOSA (Llave Válida)");
                        setDetails("Conectado correctamente. (El servidor respondió 404 a la tabla de prueba, lo cual confirma acceso).");
                        return;
                    }

                    setStatus(`⚠️ Error Inesperado (Code: ${networkError.code})`);
                    setDetails(`Conectado pero con error: ${JSON.stringify(networkError, null, 2)}`);
                } else {
                    setStatus("✅ CONEXIÓN EXITOSA");
                    setDetails("Conectado y consulta ejecutada correctamente.");
                }

            } catch (e: any) {
                setStatus("❌ ERROR CRÍTICO DE CLIENTE");
                setDetails(`Excepción JS: ${e.message}\n${JSON.stringify(e, null, 2)}`);
                console.error(e);
            }
        }
        checkConnection();
    }, []);

    return (
        <div className="p-12 font-mono flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="border p-8 rounded-lg shadow-lg max-w-2xl w-full bg-card">
                <h1 className="text-2xl font-bold mb-6">Supabase Connectivity Check</h1>

                <div className="space-y-6 text-left">
                    <div className="p-4 bg-muted rounded-md">
                        <p className="text-xs text-muted-foreground uppercase mb-1">Target URL</p>
                        <p className="font-medium truncate">{url || "Not Detected"}</p>
                    </div>

                    <div className={`p-4 rounded-md border ${status.startsWith('✅') ? 'bg-green-50/10 border-green-500/20 text-green-600' : 'bg-red-50/10 border-red-500/20 text-red-600'}`}>
                        <p className="text-xl font-bold">{status}</p>
                    </div>

                    {details && (
                        <div className="p-4 bg-muted/50 rounded-md">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Details</p>
                            <p className="text-sm">{details}</p>
                        </div>
                    )}
                </div>

                <div className="mt-8 text-xs text-muted-foreground">
                    Edit <code>.env</code> to update credentials and refresh this page.
                </div>
            </div>
        </div>
    );
}
