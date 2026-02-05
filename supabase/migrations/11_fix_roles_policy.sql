-- =============================================
-- 11_FIX_ROLES_POLICY.SQL
-- Fixes RLS violation on 'roles' table by ensuring policy uses secure function
-- and attempts to upgrade current user to ADMIN if possible.
-- =============================================

-- 1. Attempt to Ensure Current User is ADMIN (for Development)
-- This works if run in SQL Editor where auth.uid() is the current user.
DO $$
DECLARE
    current_user_id UUID;
    user_email TEXT;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- Try to get email if possible, otherwise use placeholder
        BEGIN
            SELECT email FROM auth.users WHERE id = current_user_id INTO user_email;
        EXCEPTION WHEN OTHERS THEN
            user_email := 'admin@example.com';
        END;

        -- Upsert profile as ADMIN
        INSERT INTO public.profiles (id, email, full_name, role)
        VALUES (
            current_user_id, 
            COALESCE(user_email, 'admin@example.com'), 
            'System Admin', 
            'ADMIN'
        )
        ON CONFLICT (id) DO UPDATE
        SET role = 'ADMIN';
    END IF;
END $$;

-- 2. Fix Roles RLS Policy
-- Ensure it uses the new safe function defined in migration 10

DROP POLICY IF EXISTS "Only admin can manage roles" ON public.roles;

CREATE POLICY "Only admin can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        get_current_user_role() = 'ADMIN'
    );

-- Ensure View policy exists
DROP POLICY IF EXISTS "Roles viewable by authenticated" ON public.roles;
CREATE POLICY "Roles viewable by authenticated"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);
