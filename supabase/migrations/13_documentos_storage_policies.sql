-- Migration: Add RLS policies for Documentost_rabajos bucket
-- This enables uploads, reads, updates, and deletes for the document storage bucket

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('Documentost_rabajos', 'Documentost_rabajos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any (idempotent)
DROP POLICY IF EXISTS "Allow public read Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update Documentost_rabajos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete Documentost_rabajos" ON storage.objects;

-- SELECT: Allow public read access
CREATE POLICY "Allow public read Documentost_rabajos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'Documentost_rabajos');

-- INSERT: Allow authenticated users to upload
CREATE POLICY "Allow authenticated insert Documentost_rabajos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Documentost_rabajos');

-- UPDATE: Allow authenticated users to update
CREATE POLICY "Allow authenticated update Documentost_rabajos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');

-- DELETE: Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete Documentost_rabajos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Documentost_rabajos');
