-- Migration to add potentially missing columns to cotizaciones table
-- Run this in Supabase SQL Editor to fix "Column does not exist" errors

alter table cotizaciones
    add column if not exists cotizacion_estado text, -- Legacy/Dual support
    add column if not exists direccion_proyecto text,
    add column if not exists ubicacion jsonb,
    add column if not exists fecha_inicio timestamptz,
    add column if not exists fecha_fin_estimada timestamptz,
    add column if not exists fecha_fin_real timestamptz,
    add column if not exists costo_real numeric,
    add column if not exists responsable_id text,
    add column if not exists progreso numeric default 0,
    add column if not exists notas text,
    add column if not exists evidencia jsonb default '[]'::jsonb,
    add column if not exists comentarios jsonb default '[]'::jsonb,
    add column if not exists aiu_admin_global_porcentaje numeric default 0,
    add column if not exists aiu_imprevisto_global_porcentaje numeric default 0,
    add column if not exists aiu_utilidad_global_porcentaje numeric default 0,
    add column if not exists iva_utilidad_global_porcentaje numeric default 19,
    add column if not exists descuento_global numeric default 0,
    add column if not exists descuento_global_porcentaje numeric default 0,
    add column if not exists impuesto_global_porcentaje numeric default 19;

-- Ensure RLS allows updates to these columns if needed (Policies usually cover all cols, but good to check)
