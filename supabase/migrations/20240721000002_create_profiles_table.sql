-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text check (role in ('ADMIN', 'ENGINEER', 'CLIENT', 'VIEWER')) default 'VIEWER',
  sidebar_access text[], -- Array of allowed module IDs
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Allow admins to manage all profiles (this depends on the admin checking their own role, 
-- which can be recursive, so often we use a function or a simpler check if possible. 
-- For now, we'll keep it simple: authenticated users can read.
-- We will implement admin-only writes via Service Role in server actions to avoid complex RLS recursion initially.)

-- Trigger to create profile on signup (optional, but good for self-signup. 
-- For admin-created users, we can insert manually.)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, sidebar_access)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'VIEWER', ARRAY['dashboard']);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger is useful if we allow public signups. 
-- Since this is an internal system, we might strictly control creation via Admin.
-- However, enabling it doesn't hurt for safety.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
