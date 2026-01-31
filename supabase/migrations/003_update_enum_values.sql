-- Migration to update the cotizacion_estado enum
-- The error "invalid input value for enum cotizacion_estado: EN_REVISION" indicates the DB enum is missing values.

-- NOTE: PostgreSQL does not support "ALTER TYPE ... ADD VALUE IF NOT EXISTS" in a single transaction block easily in some versions/clients.
-- The safest way is to alter it one by one outside of a transaction, or check first.
-- However, for Supabase SQL Editor, running these lines is usually safe.

-- Try adding EN_REVISION
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'EN_REVISION';

-- Add other potentially missing values based on types/sistema.ts
-- 'BORRADOR' | 'ENVIADA' | 'EN_REVISION' | 'APROBADA' | 'RECHAZADA' | 'PENDIENTE' | 'NO_APROBADA' | 'EN_EJECUCION' | 'FINALIZADA'

ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'PENDIENTE';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'NO_APROBADA';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'EN_EJECUCION';
ALTER TYPE cotizacion_estado ADD VALUE IF NOT EXISTS 'FINALIZADA';
