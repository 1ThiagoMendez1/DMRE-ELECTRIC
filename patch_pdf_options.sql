-- =============================================
-- PARCHE: Agregar soporte para guardar opciones 
--         personalizadas del PDF (Modo Privado, etc.)
-- =============================================

ALTER TABLE public.cotizaciones
ADD COLUMN IF NOT EXISTS opciones_pdf JSONB DEFAULT '{}'::jsonb;
