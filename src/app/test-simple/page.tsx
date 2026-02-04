'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/client' // Adjusted from '@/lib/supabase/client' to match the file created

export default function Test() {
    const [logs, setLogs] = useState<any[]>([])

    useEffect(() => {
        const test = async () => {
            console.log('Testing connection to users table...')
            setLogs(prev => [...prev, 'Attempting query: select * from users...'])

            const { data, error } = await supabase
                .from('clientes')
                .select('*')
                .limit(5)

            if (error) {
                console.error('Error:', error)
                setLogs(prev => [...prev, `❌ Error: ${error.message} (${error.code})`])
            } else {
                console.log('Data:', data)
                setLogs(prev => [...prev, `✅ Success! Received ${data.length} rows.`])
                setLogs(prev => [...prev, JSON.stringify(data, null, 2)])
            }
        }

        test()
    }, [])

    return (
        <div className="p-8 font-mono">
            <h1 className="text-xl font-bold mb-4">Prueba Simple Supabase</h1>
            <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                {logs.length === 0 ? "Conectando..." : logs.join('\n\n')}
            </div>
        </div>
    )
}
