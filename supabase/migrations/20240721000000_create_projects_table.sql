-- Create projects table
create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  category text,
  image_url text,
  is_active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.projects enable row level security;

-- Create policies for projects
create policy "Public projects are viewable by everyone"
  on public.projects for select
  using ( true );

create policy "Authenticated users can insert projects"
  on public.projects for insert
  with check ( auth.role() = 'authenticated' );

create policy "Authenticated users can update projects"
  on public.projects for update
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can delete projects"
  on public.projects for delete
  using ( auth.role() = 'authenticated' );

-- Create storage bucket for projects if it doesn't exist
insert into storage.buckets (id, name, public)
values ('projects', 'projects', true)
on conflict (id) do nothing;

-- Storage policies
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'projects' );

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check ( bucket_id = 'projects' and auth.role() = 'authenticated' );

create policy "Authenticated users can update"
  on storage.objects for update
  with check ( bucket_id = 'projects' and auth.role() = 'authenticated' );

create policy "Authenticated users can delete"
  on storage.objects for delete
  using ( bucket_id = 'projects' and auth.role() = 'authenticated' );
