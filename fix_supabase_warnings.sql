-- ==========================================
-- SCRIPT PARA SOLUCIONAR ADVERTENCIAS DE SUPABASE (LINTER/SECURITY)
-- ==========================================

-- 1. Habilitar RLS en tablas reportadas como "Públicas sin RLS"
ALTER TABLE IF EXISTS public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.role_permissions ENABLE ROW LEVEL SECURITY;

-- 2. Fijar el "search_path" a 'public' en las funciones (con sus argumentos correctos)
ALTER FUNCTION public.update_modified_column() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.update_obligacion_saldo() SET search_path = public;
ALTER FUNCTION public.update_cuenta_saldo(UUID, NUMERIC) SET search_path = public;
ALTER FUNCTION public.get_current_user_role() SET search_path = public;
ALTER FUNCTION public.update_proyectos_planos_updated_at() SET search_path = public;
ALTER FUNCTION public.get_proyectos_planos_with_user() SET search_path = public;

SELECT 'Advertencias de seguridad resueltas' as resultado;
