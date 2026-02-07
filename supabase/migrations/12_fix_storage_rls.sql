-- Enable RLS for storage.objects if not already enabled (it usually is)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view files in 'Archivos Carros' bucket
CREATE POLICY "Allow authenticated users to select files from Archivos Carros"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'Archivos Carros');

-- Policy to allow authenticated users to upload files to 'Archivos Carros' bucket
CREATE POLICY "Allow authenticated users to insert files to Archivos Carros"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Archivos Carros');

-- Policy to allow authenticated users to update files in 'Archivos Carros' bucket
CREATE POLICY "Allow authenticated users to update files in Archivos Carros"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'Archivos Carros');

-- Policy to allow authenticated users to delete files in 'Archivos Carros' bucket
CREATE POLICY "Allow authenticated users to delete files from Archivos Carros"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'Archivos Carros');
