-- Create contact_requests table
create table if not exists public.contact_requests (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text not null,
  phone text,
  message text not null,
  status text default 'PENDIENTE', -- PENDIENTE, CONTACTADO, CERRADO
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.contact_requests enable row level security;

-- Create policies for contact_requests
create policy "Public can insert contact requests"
  on public.contact_requests for insert
  with check ( true );

create policy "Authenticated users can view contact requests"
  on public.contact_requests for select
  using ( auth.role() = 'authenticated' );

create policy "Authenticated users can update contact requests"
  on public.contact_requests for update
  using ( auth.role() = 'authenticated' );
