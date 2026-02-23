-- run this in your supabase sql editor to create the required storage bucket
insert into storage.buckets (id, name, public)
values ('cotizaciones_docs', 'cotizaciones_docs', false)
on conflict (id) do nothing;

create policy "Allow authenticated admins to upload"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'cotizaciones_docs' );

create policy "Allow authenticated admins to delete"
on storage.objects for delete
to authenticated
using ( bucket_id = 'cotizaciones_docs' );

-- Since clients are not authenticated via standard Supabase Auth in the portal,
-- the server uses the Service Role Key to manage these files.
-- Thus, the Service Role key bypasses RLS and handles all uploads/downloads/deletes internally.
-- No public policies are needed, maximizing security as requested.
