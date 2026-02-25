-- =========================================================================
-- SCRIPT DE CREACION: INSTALACIONES
-- Descripción: Script para generar la tabla de instalaciones y sus políticas
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.instalaciones (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    codigo text NOT NULL,
    descripcion text NOT NULL,
    valor_calculado numeric(15,2) NOT NULL DEFAULT 0,
    activo boolean NOT NULL DEFAULT true,
    creado_por uuid NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT instalaciones_pkey PRIMARY KEY (id),
    CONSTRAINT instalaciones_codigo_key UNIQUE (codigo)
);

-- Habilitar RLS
ALTER TABLE public.instalaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura
CREATE POLICY "Lectura permitida" 
    ON public.instalaciones FOR SELECT 
    USING (true);

-- Políticas de inserción
CREATE POLICY "Inserción permitida" 
    ON public.instalaciones FOR INSERT 
    WITH CHECK (true);

-- Políticas de actualización
CREATE POLICY "Actualización permitida" 
    ON public.instalaciones FOR UPDATE 
    USING (true);

-- Políticas de eliminación
CREATE POLICY "Eliminación permitida" 
    ON public.instalaciones FOR DELETE 
    USING (true);

-- Trigger para updated_at (requiere función set_updated_at si no existe)
-- CREATE OR REPLACE FUNCTION public.set_updated_at()
-- RETURNS trigger
-- LANGUAGE plpgsql
-- AS $function$
-- BEGIN
--     NEW.updated_at = now();
--     RETURN NEW;
-- END;
-- $function$;

-- CREATE TRIGGER set_public_instalaciones_updated_at 
--     BEFORE UPDATE ON public.instalaciones 
--     FOR EACH ROW 
--     EXECUTE FUNCTION public.set_updated_at();
