-- ============================================
-- Plan Versions Table
-- Stores snapshots of plan designs for restoration
-- ============================================

CREATE TABLE IF NOT EXISTS public.plan_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.proyectos_planos(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    canvas_state JSONB NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view versions of their projects" 
    ON public.plan_versions FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

CREATE POLICY "Users can create versions of their projects" 
    ON public.plan_versions FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );

CREATE POLICY "Users can delete versions of their projects" 
    ON public.plan_versions FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.proyectos_planos 
            WHERE id = plan_versions.project_id
        )
    );
