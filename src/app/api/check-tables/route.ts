import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
    try {
        const supabase = await createClient()

        // Intentar obtener lista de tablas
        const tableQueries = [
            'clientes',
            'cotizaciones',
            'cotizacion_items',
            'inventario',
            'codigos_trabajo',
            'materiales_asociados',
            'facturas',
            'cuentas_bancarias',
            'movimientos_financieros',
            'obligaciones_financieras',
            'proveedores',
            'cuentas_por_pagar',
            'empleados',
            'novedades_nomina',
            'liquidaciones_nomina',
            'creditos_empleados',
            'vehiculos',
            'gastos_vehiculos',
            'dotacion_items',
            'dotacion_variantes',
            'entregas_dotacion',
            'entrega_dotacion_items',
            'agenda',
            'profiles'
        ]

        const existingTables: string[] = []
        const nonExistingTables: string[] = []

        for (const tableName of tableQueries) {
            const { error } = await supabase
                .from(tableName)
                .select('*')
                .limit(0)

            if (!error) {
                existingTables.push(tableName)
            } else {
                nonExistingTables.push(tableName)
            }
        }

        return NextResponse.json({
            success: true,
            existingTables,
            nonExistingTables,
            totalExisting: existingTables.length,
            totalNonExisting: nonExistingTables.length
        })
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Error desconocido'
        }, { status: 500 })
    }
}
