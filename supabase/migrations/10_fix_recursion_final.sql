-- =============================================
-- 10_FIX_RECURSION_FINAL.SQL
-- Fixes infinite recursion by using SECURITY DEFINER and CASCADE drop
-- =============================================

-- 1. DROP FUNCTION WITH CASCADE
-- This is necessary because some policies (on agenda/roles) depend on this function.
-- CASCADE will automatically remove those dependent policies so we can recreate them clean.
DROP FUNCTION IF EXISTS public.get_current_user_role() CASCADE;

-- 2. RECREATE THE HELPER FUNCTION
-- SECURITY DEFINER: Runs with permissions of the creator (usually postgres/admin), bypassing RLS
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

-- 3. RECREATE/UPDATE POLICIES

-- We must manually cleanup any potential remaining policies that CASCADE didn't catch 
-- (mostly just to be sure we don't have duplicates if names differed),
-- then we recreate everything consistently.

-- ==========================
-- A) PROFILES POLICIES
-- ==========================
-- Drop old variations just in case
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can see own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (
        id = auth.uid()
        OR get_current_user_role() = 'ADMIN'
    );

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (
        id = auth.uid()
    );

CREATE POLICY "Admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- ==========================
-- B) ROLES POLICIES
-- ==========================
-- Need to drop if they weren't dropped by CASCADE (unlikely if they depended on the function, but good hygiene)
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;

CREATE POLICY "Roles viewable by authenticated"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admin can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );


-- ==========================
-- C) AGENDA POLICIES
-- ==========================
-- Similarly, drop ensuring clean slate before create
DROP POLICY IF EXISTS "Users see own tasks or if admin" ON public.agenda;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.agenda;
DROP POLICY IF EXISTS "Admin can delete tasks" ON public.agenda;
DROP POLICY IF EXISTS "Authenticated can create tasks" ON public.agenda;

CREATE POLICY "Users see own tasks or if admin"
    ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

CREATE POLICY "Users can update own tasks"
    ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR get_current_user_role() IN ('ADMIN', 'MANAGER')
    );

CREATE POLICY "Admin can delete tasks"
    ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = auth.uid()
        OR get_current_user_role() = 'ADMIN'
    );

CREATE POLICY "Authenticated can create tasks"
    ON public.agenda FOR INSERT
    TO authenticated
    WITH CHECK (true);
