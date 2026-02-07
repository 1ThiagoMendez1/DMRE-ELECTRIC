import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
    try {
        const { script } = await request.json()

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY

        if (!supabaseUrl || !serviceRoleKey) {
            return NextResponse.json({
                success: false,
                error: 'Variables de entorno no configuradas (SERVICE_ROLE_KEY)'
            }, { status: 500 })
        }

        // Crear cliente con service role para permisos elevados
        const supabase = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Leer el archivo SQL
        const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations')
        const sqlFile = path.join(migrationsPath, script)

        if (!fs.existsSync(sqlFile)) {
            return NextResponse.json({
                success: false,
                error: `Archivo no encontrado: ${script}`
            }, { status: 404 })
        }

        const sqlContent = fs.readFileSync(sqlFile, 'utf-8')

        // Ejecutar el SQL usando la API REST de Supabase
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': serviceRoleKey,
                'Authorization': `Bearer ${serviceRoleKey}`
            },
            body: JSON.stringify({ sql: sqlContent })
        })

        if (!response.ok) {
            // Si no existe la función exec_sql, intentar con la API de postgres
            // Usar el endpoint de SQL directo si está disponible
            const pgResponse = await fetch(`${supabaseUrl}/pg/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ query: sqlContent })
            })

            if (!pgResponse.ok) {
                return NextResponse.json({
                    success: false,
                    error: 'No se puede ejecutar SQL directamente. Por favor ejecuta el script manualmente en el SQL Editor de Supabase.',
                    sqlPreview: sqlContent.substring(0, 500) + '...',
                    instructions: 'Copia el contenido del archivo y pégalo en: Supabase Dashboard → SQL Editor'
                }, { status: 400 })
            }

            const pgData = await pgResponse.json()
            return NextResponse.json({
                success: true,
                message: `Script ${script} ejecutado correctamente`,
                data: pgData
            })
        }

        const data = await response.json()
        return NextResponse.json({
            success: true,
            message: `Script ${script} ejecutado correctamente`,
            data: data
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}

export async function GET() {
    // Listar scripts disponibles
    const migrationsPath = path.join(process.cwd(), 'supabase', 'migrations')

    try {
        const files = fs.readdirSync(migrationsPath)
            .filter(f => f.endsWith('.sql'))
            .sort()

        return NextResponse.json({
            success: true,
            scripts: files
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: 'No se encontró la carpeta de migraciones'
        }, { status: 500 })
    }
}
