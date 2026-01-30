// Script para verificar conexión de todos los módulos con Supabase
// Ejecutar con: node scripts/check_all_modules.js

const { createClient } = require("@supabase/supabase-js");

// Usar credenciales del proyecto (copiadas de check_db_clients.js y .env)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://supabase.devsystech.com.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Lista de todas las tablas a verificar
const TABLES = [
    { name: "clientes", spanish: "Clientes" },
    { name: "proveedores", spanish: "Proveedores" },
    { name: "inventario", spanish: "Inventario" },
    { name: "codigos_trabajo", spanish: "Códigos de Trabajo" },
    { name: "empleados", spanish: "Empleados" },
    { name: "vehiculos", spanish: "Vehículos" },
    { name: "gastos_vehiculos", spanish: "Gastos de Vehículos" },
    { name: "trabajos", spanish: "Trabajos/Proyectos" },
    { name: "cotizaciones", spanish: "Cotizaciones" },
    { name: "facturas", spanish: "Facturas" },
    { name: "dotacion_items", spanish: "Items de Dotación" },
    { name: "entregas_dotacion", spanish: "Entregas de Dotación" },
    { name: "cuentas_por_pagar", spanish: "Cuentas por Pagar" },
    { name: "agenda", spanish: "Agenda/Tareas" },
    { name: "creditos_empleados", spanish: "Créditos de Empleados" },
    { name: "cuentas_bancarias", spanish: "Cuentas Bancarias" },
    { name: "movimientos_financieros", spanish: "Movimientos Financieros" },
    { name: "cotizacion_items", spanish: "Items de Cotización" },
    { name: "materiales_asociados", spanish: "Materiales Asociados" },
    { name: "dotacion_variantes", spanish: "Variantes Dotación" },
    { name: "liquidaciones_nomina", spanish: "Liquidaciones Nómina" }
];

async function checkAllModules() {
    console.log("\n========================================");
    console.log("  VERIFICACIÓN DE MÓDULOS SUPABASE");
    console.log(`  URL: ${SUPABASE_URL}`);
    console.log("========================================\n");

    const results = [];

    for (const table of TABLES) {
        try {
            // Intentar leer 1 registro para verificar acceso y existencia
            const { data, error, count } = await supabase
                .from(table.name)
                .select("*", { count: "exact", head: false })
                .limit(1);

            if (error) {
                results.push({
                    table: table.spanish,
                    status: "❌ ERROR",
                    message: error.message,
                    count: 0,
                });
            } else {
                // Hacer un count separado para estar seguros
                const realCount = await getCount(table.name);
                results.push({
                    table: table.spanish,
                    status: "✅ OK",
                    message: "Conectado",
                    count: realCount,
                });
            }
        } catch (err) {
            results.push({
                table: table.spanish,
                status: "❌ ERROR",
                message: err.message,
                count: 0,
            });
        }
    }

    // Mostrar resultados en tabla
    console.log("Módulo".padEnd(25) + "Estado".padEnd(12) + "Registros".padEnd(12) + "Mensaje");
    console.log("-".repeat(80));

    for (const r of results) {
        console.log(
            r.table.padEnd(25) +
            r.status.padEnd(12) +
            String(r.count).padEnd(12) +
            (r.status.includes("ERROR") ? r.message : "")
        );
    }

    const oks = results.filter(r => r.status.includes("OK")).length;
    const errors = results.filter(r => r.status.includes("ERROR")).length;
    const total = results.length;

    console.log("\n========================================");
    console.log(`  RESUMEN: ${oks}/${total} módulos OK`);
    if (errors > 0) {
        console.log(`  ⚠️ ${errors} módulos con errores de conexión o permisos`);
    } else {
        console.log("  ✅ Todos los módulos funcionando correctamente");
    }
    console.log("========================================\n");
}

async function getCount(tableName) {
    const { count, error } = await supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
    return error ? 0 : count || 0;
}

checkAllModules();
