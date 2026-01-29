'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle2, XCircle, PlayCircle, AlertTriangle } from 'lucide-react'

interface ScriptStatus {
    script: string
    status: 'pending' | 'running' | 'success' | 'error'
    message?: string
}

export default function RunMigrationsPage() {
    const [scripts, setScripts] = useState<string[]>([])
    const [statuses, setStatuses] = useState<ScriptStatus[]>([])
    const [loading, setLoading] = useState(true)
    const [running, setRunning] = useState(false)
    const [currentScript, setCurrentScript] = useState<string | null>(null)

    useEffect(() => {
        loadScripts()
    }, [])

    const loadScripts = async () => {
        try {
            const response = await fetch('/api/run-migration')
            const data = await response.json()
            if (data.success) {
                setScripts(data.scripts)
                setStatuses(data.scripts.map((s: string) => ({
                    script: s,
                    status: 'pending' as const
                })))
            }
        } catch (error) {
            console.error('Error loading scripts:', error)
        } finally {
            setLoading(false)
        }
    }

    const runScript = async (script: string) => {
        setCurrentScript(script)
        setStatuses(prev => prev.map(s =>
            s.script === script ? { ...s, status: 'running' } : s
        ))

        try {
            const response = await fetch('/api/run-migration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ script })
            })
            const data = await response.json()

            setStatuses(prev => prev.map(s =>
                s.script === script ? {
                    ...s,
                    status: data.success ? 'success' : 'error',
                    message: data.message || data.error || data.instructions
                } : s
            ))

            return data.success
        } catch (error) {
            setStatuses(prev => prev.map(s =>
                s.script === script ? {
                    ...s,
                    status: 'error',
                    message: String(error)
                } : s
            ))
            return false
        } finally {
            setCurrentScript(null)
        }
    }

    const runAllScripts = async () => {
        setRunning(true)
        for (const script of scripts) {
            const success = await runScript(script)
            if (!success) {
                // Continuar con los demás scripts aunque uno falle
                // break; // Descomentar si quieres detener en error
            }
            // Pequeña pausa entre scripts
            await new Promise(r => setTimeout(r, 500))
        }
        setRunning(false)
    }

    const getStatusIcon = (status: ScriptStatus['status']) => {
        switch (status) {
            case 'pending': return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
            case 'running': return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />
        }
    }

    const getStatusColor = (status: ScriptStatus['status']) => {
        switch (status) {
            case 'pending': return 'border-gray-200 bg-gray-50'
            case 'running': return 'border-blue-200 bg-blue-50'
            case 'success': return 'border-green-200 bg-green-50'
            case 'error': return 'border-red-200 bg-red-50'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PlayCircle className="w-6 h-6" />
                        Ejecutar Migraciones SQL
                    </CardTitle>
                    <CardDescription>
                        Ejecuta los scripts de migración en orden para crear la base de datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div className="text-sm text-yellow-800">
                            <p className="font-medium">⚠️ Importante</p>
                            <p>El script 00_cleanup.sql eliminará TODAS las tablas existentes.
                                Asegúrate de tener un respaldo si hay datos importantes.</p>
                        </div>
                    </div>

                    <Button
                        onClick={runAllScripts}
                        disabled={running}
                        className="w-full"
                        size="lg"
                    >
                        {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {running ? 'Ejecutando...' : 'Ejecutar Todos los Scripts'}
                    </Button>

                    <div className="space-y-2">
                        {statuses.map((status, index) => (
                            <div
                                key={status.script}
                                className={`p-4 rounded-lg border ${getStatusColor(status.status)}`}
                            >
                                <div className="flex items-center gap-3">
                                    {getStatusIcon(status.status)}
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">
                                            {index}. {status.script}
                                        </p>
                                        {status.message && (
                                            <p className={`text-xs mt-1 ${status.status === 'error' ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                {status.message}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => runScript(status.script)}
                                        disabled={running || status.status === 'running'}
                                    >
                                        Ejecutar
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                            <strong>Nota:</strong> Si la ejecución automática falla, puedes copiar el contenido
                            de cada archivo SQL y ejecutarlo manualmente en el
                            <a
                                href="https://studiosupa.devsystech.com.co/project/default/sql"
                                target="_blank"
                                className="text-blue-600 hover:underline ml-1"
                            >
                                SQL Editor de Supabase
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
