-- Fix for missing sidebar_access column
alter table if exists public.profiles 
add column if not exists sidebar_access text[] default ARRAY['dashboard'];

-- Ensure the column is an array of text
alter table public.profiles 
alter column sidebar_access set data type text[] using sidebar_access::text[];
