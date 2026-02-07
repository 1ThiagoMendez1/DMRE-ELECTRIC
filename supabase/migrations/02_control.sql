-- =============================================
-- 02_CONTROL - Control y Sistema
-- =============================================

-- =============================================
-- TABLA: profiles (vinculada a auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role user_role DEFAULT 'VIEWER',
    avatar_url TEXT,
    phone TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id, 
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para nuevos usuarios
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLA: roles (roles personalizados)
-- =============================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

DROP TRIGGER IF EXISTS update_roles_modtime ON public.roles;
CREATE TRIGGER update_roles_modtime
    BEFORE UPDATE ON public.roles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Roles viewable by authenticated"
    ON public.roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admin can manage roles"
    ON public.roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );

-- =============================================
-- TABLA: agenda (tareas y recordatorios)
-- =============================================
CREATE TABLE public.agenda (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_vencimiento DATE,
    hora TIME,
    asignado_a UUID REFERENCES public.profiles(id),
    creado_por UUID REFERENCES public.profiles(id),
    prioridad tarea_prioridad DEFAULT 'MEDIA',
    estado tarea_estado DEFAULT 'PENDIENTE',
    etiquetas TEXT[],
    recordatorio BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TRIGGER update_agenda_modtime
    BEFORE UPDATE ON public.agenda
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_agenda_asignado ON public.agenda(asignado_a);
CREATE INDEX idx_agenda_fecha ON public.agenda(fecha_vencimiento);
CREATE INDEX idx_agenda_estado ON public.agenda(estado);

ALTER TABLE public.agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see own tasks or if admin"
    ON public.agenda FOR SELECT
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "Authenticated can create tasks"
    ON public.agenda FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update own tasks"
    ON public.agenda FOR UPDATE
    TO authenticated
    USING (
        asignado_a = auth.uid() 
        OR creado_por = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('ADMIN', 'MANAGER')
        )
    );

CREATE POLICY "Admin can delete tasks"
    ON public.agenda FOR DELETE
    TO authenticated
    USING (
        creado_por = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'ADMIN'
        )
    );
















-- 1. UPGRADE PROFILES
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 2. CREATE AGENDA TABLE
CREATE TABLE IF NOT EXISTS agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha_vencimiento TIMESTAMP WITH TIME ZONE NOT NULL,
    asignado_a UUID REFERENCES profiles(id) ON DELETE SET NULL,
    prioridad TEXT CHECK (prioridad IN ('ALTA', 'MEDIA', 'BAJA')),
    estado TEXT CHECK (estado IN ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA')) DEFAULT 'PENDIENTE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ROLES AND PERMISSIONS SCHEMA

-- 3.1 Permissions Catalog (Resources)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,          -- e.g. "Control de Usuarios"
    module TEXT NOT NULL,               -- e.g. "usuarios"
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Role Permissions Pivot (Granular access)
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL, -- Linking to 'role' string in profiles/auth or a separate roles table if strictly normalized. 
                        -- Given current architecture uses 'role' string in profiles, we key off that string or create a roles table.
                        -- User requested "Mantener roles como catálogo", implying a roles table might exist or we just use the string enum.
                        -- However, standard practice is a roles table. Let's start by ensuring roles table exists or we stick to string based on USER REQUEST "Tabla Actual: roles".
                        -- If "Tabla Actual: roles" exists (as user said), we reference it. If not, we create it.
                        -- User provided: "Tabla Actual: roles ... id, name..."
                        -- I will assume 'roles' table exists.
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    
    can_view BOOLEAN DEFAULT FALSE,
    can_create BOOLEAN DEFAULT FALSE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    
    UNIQUE(role_id, permission_id)
);

-- 4. SEED DATA

-- 4.1 Seed Permissions (Modules)
INSERT INTO permissions (name, module, description) VALUES
('Dashboard General', 'dashboard', 'Acceso al resumen general del sistema'),
('Gestión de Usuarios', 'usuarios', 'Administración de usuarios y accesos'),
('Agenda de Tareas', 'agenda', 'Gestión de calendario y tareas'),
('Inventario', 'inventario', 'Gestión de stock y productos'),
('Clientes', 'clientes', 'Base de datos de clientes'),
('Proveedores', 'proveedores', 'Base de datos de proveedores'),
('Cotizaciones', 'cotizaciones', 'Gestión de ofertas comerciales'),
('Facturación', 'facturas', 'Gestión financiera y facturas'),
('Activos y Flota', 'activos', 'Gestión de vehículos y equipos'),
('Roles y Permisos', 'roles', 'Administración de seguridad')
ON CONFLICT (name) DO NOTHING;

-- 4.2 Seed Admin Permissions (Full Access)
-- Asumiendo que el rol ADMIN ya existe en la tabla 'roles'. Si no, deberíamos crearlo.
-- DO $$ 
-- DECLARE 
--     admin_role_id UUID;
-- BEGIN
--     SELECT id INTO admin_role_id FROM roles WHERE name = 'ADMIN';
    
--     IF admin_role_id IS NOT NULL THEN
--         INSERT INTO role_permissions (role_id, permission_id, can_view, can_create, can_edit, can_delete)
--         SELECT admin_role_id, id, TRUE, TRUE, TRUE, TRUE FROM permissions
--         ON CONFLICT DO NOTHING;
--     END IF;
-- END $$;






-- FIX: Add missing Foreign Key for Agenda -> Profiles
-- This ensures the relationship 'asignado_a' exists for Supabase queries.

DO $$
BEGIN
    -- 1. Check if the constraint exists, if not add it
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE table_name = 'agenda' 
        AND constraint_type = 'FOREIGN KEY'
    ) THEN
        -- Verify column exists first
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agenda' AND column_name = 'asignado_a') THEN
            ALTER TABLE "agenda" 
            ADD CONSTRAINT "agenda_asignado_a_fkey" 
            FOREIGN KEY ("asignado_a") 
            REFERENCES "profiles" ("id") 
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 2. Force Notify Schema Cache Reload (Optional, usually automatic)
NOTIFY pgrst, 'reload config';




-- 1. Upgrade current user to ADMIN (This fixes the RLS error)
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id = auth.uid();

-- 2. Ensure roles exist
INSERT INTO public.roles (name, description) VALUES 
('ADMIN', 'Administrador del Sistema'),
('MANAGER', 'Gerente'),
('VIEWER', 'Visualizador')
ON CONFLICT (name) DO NOTHING;