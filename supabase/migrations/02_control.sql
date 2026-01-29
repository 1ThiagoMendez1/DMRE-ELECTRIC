-- =============================================
-- 02_CONTROL - Control y Sistema
-- =============================================

-- =============================================
-- TABLA: profiles (vinculada a auth.users)
-- =============================================
CREATE TABLE public.profiles (
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
CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

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
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- TABLA: roles (roles personalizados)
-- =============================================
CREATE TABLE public.roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

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
