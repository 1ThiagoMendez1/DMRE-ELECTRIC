-- =============================================
-- MIGRATION: 11_support_nested_apus
-- =============================================
-- Authorization: Support recursive APUs (APUs within APUs)

-- 1. Add sub_codigo_id to materiales_asociados
-- This column references codigos_trabajo(id) and is mutually exclusive (conceptually) with inventario_id,
-- or can be used alongside it depending on logic, but typically an item is either a raw material or a sub-assembly.
ALTER TABLE public.materiales_asociados
ADD COLUMN sub_codigo_id UUID REFERENCES public.codigos_trabajo(id) ON DELETE SET NULL;

-- 2. Add index for performance
CREATE INDEX idx_materiales_asociados_sub_codigo ON public.materiales_asociados(sub_codigo_id);

-- 3. Relax constraint if any (currently there isn't a strict check, but good to note)
-- We should ensure that EITHER inventario_id OR sub_codigo_id is present, but not both NULL.
-- For now, we leave it flexible to avoid breaking existing queries, but UI should enforce it.
