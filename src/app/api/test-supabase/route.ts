import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Verificar que las variables de entorno estén configuradas
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({
                success: false,
                error: 'Variables de entorno no configuradas',
                details: {
                    hasUrl: !!supabaseUrl,
                    hasKey: !!supabaseKey,
                    url: supabaseUrl || 'No configurada'
                }
            }, { status: 500 })
        }

        const supabase = await createClient()

        // Primero intentar una consulta simple de salud
        const { data, error } = await supabase
            .from('clientes')
            .select('count')
            .limit(1)

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                details: {
                    code: error.code,
                    hint: error.hint,
                    message: error.message,
                    supabaseUrl: supabaseUrl,
                    keyPrefix: supabaseKey.substring(0, 20) + '...'
                }
            }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Conexión a Supabase exitosa',
            data: data,
            config: {
                url: supabaseUrl,
                keyPrefix: supabaseKey.substring(0, 20) + '...'
            }
        })
    } catch (error) {
        console.error('Error en test-supabase:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido',
            stack: error instanceof Error ? error.stack : undefined
        }, { status: 500 })
    }
}
