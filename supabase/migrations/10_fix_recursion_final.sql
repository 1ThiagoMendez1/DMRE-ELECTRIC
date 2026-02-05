-- =============================================
-- 10_FIX_RECURSION_FINAL.SQL
-- Fixes infinite recursion in RLS policies by correctly using SECURITY DEFINER
-- Also fixes RLS policies for Roles and Agenda tables
-- =============================================

-- 1. Drop the problematic policies and function first to ensure clean state
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

DROP FUNCTION IF EXISTS public.get_current_user_role();

-- 2. Recreate the helper function with stricter settings
-- SECURITY DEFINER: Runs with permissions of the creator (usually postgres/admin), bypassing RLS
-- SET search_path: Prevents search_path hijacking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role text;
BEGIN
  -- Direct query to profiles. Since this is SECURITY DEFINER, 
  -- it bypasses the RLS on profiles table that calls this function.
  SELECT role::text INTO _role
  FROM public.profiles
  WHERE id = auth.uid();
  
  -- Return 'VIEWER' if no role found (safety default)
  RETURN COALESCE(_role, 'VIEWER');
END;
$$;

-- 3. Re-apply policies on Profiles
-- IMPORTANT: Split into "Own Profile" (no function call) and "Admin Access" (function call)
-- This breaks the recursion for standard users accessing their own data.

-- A) Users can see their own profile matches their ID
CREATE POLICY "Users can see own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR get_current_user_role() = 'ADMIN'
    );

-- B) Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
    );

-- C) Admins can manage ALL profiles
-- This uses the function, but since the function is SECURITY DEFINER, it won't check this policy again inside.
CREATE POLICY "Admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- 4. ROLES Table Policies
-- Previously causing RLS violation because "Only admin can manage roles" used a recursive check.

DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;

-- Everyone authenticated can view roles (needed for UI to show roles to assign, or at least list them)
CREATE POLICY "Roles viewable by authenticated"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

-- Only ADMIN can INSERT/UPDATE/DELETE roles
CREATE POLICY "Only admin can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- 5. UPDATE AGENDA/Other items to ensure they use the new safe function
-- (Re-applying these just to be safe)

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

DROP POLICY IF EXISTS "Authenticated can create tasks" ON public.agenda;
CREATE POLICY "Authenticated can create tasks"
    ON public.agenda FOR INSERT
    TO authenticated
    WITH CHECK (true);
