-- ============================================
-- DMRE-PLANS Module - Database Schema
-- ============================================

-- Drop existing if needed
DROP TABLE IF EXISTS proyectos_planos CASCADE;

-- ============================================
-- PROYECTOS PLANOS TABLE
-- ============================================

CREATE TABLE proyectos_planos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client VARCHAR(255),
    scale VARCHAR(20) DEFAULT '1:100',
    canvas_state JSONB, -- Fabric.js canvas JSON
    thumbnail_url TEXT,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_proyectos_planos_created_by ON proyectos_planos(created_by);
CREATE INDEX idx_proyectos_planos_created_at ON proyectos_planos(created_at DESC);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_proyectos_planos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proyectos_planos_updated_at
    BEFORE UPDATE ON proyectos_planos
    FOR EACH ROW
    EXECUTE FUNCTION update_proyectos_planos_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE proyectos_planos ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all projects (for collaboration)
CREATE POLICY "Everyone can view projects"
    ON proyectos_planos FOR SELECT
    USING (true);

-- Policy: Authenticated users can insert
CREATE POLICY "Authenticated users can create projects"
    ON proyectos_planos FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON proyectos_planos FOR UPDATE
    USING (created_by = auth.uid() OR created_by IS NULL);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON proyectos_planos FOR DELETE
    USING (created_by = auth.uid() OR created_by IS NULL);

-- ============================================
-- STORAGE BUCKET POLICY (for Planos bucket)
-- ============================================

-- Note: Run these in Supabase dashboard or via API
-- The bucket "Planos" should already exist

-- Policy: Authenticated users can upload
-- INSERT policy on storage.objects WHERE bucket_id = 'Planos' AND auth.uid() IS NOT NULL

-- Policy: Public read access for thumbnails
-- SELECT policy on storage.objects WHERE bucket_id = 'Planos'

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Function to get projects with user info
CREATE OR REPLACE FUNCTION get_proyectos_planos_with_user()
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    client VARCHAR(255),
    scale VARCHAR(20),
    thumbnail_url TEXT,
    created_by UUID,
    created_by_name TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.client,
        p.scale,
        p.thumbnail_url,
        p.created_by,
        COALESCE(pr.full_name, 'Usuario') as created_by_name,
        p.created_at,
        p.updated_at
    FROM proyectos_planos p
    LEFT JOIN profiles pr ON p.created_by = pr.id
    ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL ON proyectos_planos TO authenticated;
GRANT SELECT ON proyectos_planos TO anon;
GRANT EXECUTE ON FUNCTION get_proyectos_planos_with_user() TO authenticated;
