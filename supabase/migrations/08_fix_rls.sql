-- Fix infinite recursion by using a security definer function for role checks

-- 1. Create helper function to get role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text AS $$
DECLARE
  _role text;
BEGIN
  -- Access profiles directly bypassing RLS due to SECURITY DEFINER
  SELECT role::text INTO _role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN _role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Profiles Policy to avoid self-recursion
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );

-- 3. Update Agenda Policies to be more efficient and safe
DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
CREATE POLICY "Users see own tasks or if admin"
    ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
CREATE POLICY "Users can update own tasks"
    ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
CREATE POLICY "Admin can delete tasks"
    ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = auth.uid()
        OR get_current_user_role() = 'ADMIN'
    );
     
-- 4. Update Roles Policy
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;
CREATE POLICY "Only admin can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );
