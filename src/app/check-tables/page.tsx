'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function CheckTablesPage() {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)

    const checkTables = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/check-tables', { method: 'POST' })
            const data = await response.json()
            setResult(data)
        } catch (error) {
            setResult({ success: false, error: String(error) })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <Card>
                <CardHeader>
                    <CardTitle>Verificar Tablas en Supabase</CardTitle>
                    <CardDescription>
                        Consulta qué tablas existen actualmente en la base de datos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Button onClick={checkTables} disabled={loading} className="w-full">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading ? 'Verificando...' : 'Verificar Tablas'}
                    </Button>

                    {result && (
                        <div className="space-y-4">
                            {result.success ? (
                                <>
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-green-900 mb-2">
                                            Tablas Existentes ({result.totalExisting})
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {result.existingTables?.map((table: string) => (
                                                <div key={table} className="bg-white px-3 py-2 rounded border text-sm">
                                                    ✓ {table}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {result.nonExistingTables && result.nonExistingTables.length > 0 && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h3 className="font-semibold text-gray-900 mb-2">
                                                Tablas No Encontradas ({result.totalNonExisting})
                                            </h3>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                {result.nonExistingTables.map((table: string) => (
                                                    <div key={table} className="bg-white px-3 py-2 rounded border text-sm text-gray-500">
                                                        ✗ {table}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <p className="text-red-900 font-medium">Error</p>
                                    <p className="text-red-700 text-sm">{result.error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
