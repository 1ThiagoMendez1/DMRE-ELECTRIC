-- Update financial categories enum
ALTER TYPE public.movimiento_categoria ADD VALUE IF NOT EXISTS 'PRESTAMOS';
ALTER TYPE public.movimiento_categoria ADD VALUE IF NOT EXISTS 'INSTALACION';
ALTER TYPE public.movimiento_categoria ADD VALUE IF NOT EXISTS 'SUMINISTRO';
