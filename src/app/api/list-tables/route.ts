import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Consultar todas las tablas en el esquema public
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_tables')
            .select('*')

        // Si no existe la función RPC, usar una consulta directa
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .neq('table_type', 'VIEW')

        if (error) {
            // Intentar método alternativo consultando directamente
            const { data: pgTables, error: pgError } = await supabase
                .rpc('exec_sql', {
                    sql: `
                        SELECT table_name, table_type
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_type = 'BASE TABLE'
                        ORDER BY table_name;
                    `
                })

            if (pgError) {
                // Último intento: consultar usando una tabla conocida y listar desde ahí
                const queryResult = await supabase
                    .from('clientes')
                    .select('*')
                    .limit(0)

                return NextResponse.json({
                    success: true,
                    message: 'Necesitas privilegios para consultar información del schema',
                    note: 'Podemos verificar que "clientes" existe',
                    tablesFound: queryResult.error ? 0 : 1,
                    error: error.message
                })
            }

            return NextResponse.json({
                success: true,
                tables: pgTables,
                count: pgTables?.length || 0
            })
        }

        return NextResponse.json({
            success: true,
            tables: data,
            count: data?.length || 0
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
