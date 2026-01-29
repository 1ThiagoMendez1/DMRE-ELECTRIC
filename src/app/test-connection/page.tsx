'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'

export default function TestConnectionPage() {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')
    const [data, setData] = useState<any>(null)

    const testConnection = async () => {
        setStatus('loading')
        setMessage('')
        setData(null)

        try {
            const response = await fetch('/api/test-supabase')
            const result = await response.json()

            if (result.success) {
                setStatus('success')
                setMessage(result.message)
                setData(result.data)
            } else {
                setStatus('error')
                setMessage(result.error || 'Error en la conexión')
            }
        } catch (error) {
            setStatus('error')
            setMessage(error instanceof Error ? error.message : 'Error desconocido')
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Prueba de Conexión a Supabase</CardTitle>
                    <CardDescription>
                        Verifica que tu aplicación pueda conectarse correctamente a Supabase
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button
                        onClick={testConnection}
                        disabled={status === 'loading'}
                        className="w-full"
                    >
                        {status === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {status === 'loading' ? 'Probando conexión...' : 'Probar Conexión'}
                    </Button>

                    {status !== 'idle' && (
                        <div className={`p-4 rounded-lg border ${status === 'success'
                                ? 'bg-green-50 border-green-200'
                                : status === 'error'
                                    ? 'bg-red-50 border-red-200'
                                    : 'bg-gray-50 border-gray-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                {status === 'success' && (
                                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                )}
                                {status === 'error' && (
                                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${status === 'success' ? 'text-green-900' : 'text-red-900'
                                        }`}>
                                        {message}
                                    </p>
                                    {data && (
                                        <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-60">
                                            {JSON.stringify(data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-sm text-gray-600 space-y-2">
                        <p className="font-medium">Información de la configuración:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                            <li>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</li>
                            <li>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
