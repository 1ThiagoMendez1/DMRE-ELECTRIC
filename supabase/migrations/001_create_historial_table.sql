-- Create table for Cotizacion History
create table if not exists cotizacion_historial (
  id uuid default gen_random_uuid() primary key,
  cotizacion_id uuid references cotizaciones(id) on delete cascade not null,
  fecha timestamptz default now() not null,
  usuario_id text, -- Can be linked to auth.users or just a string if using custom users
  usuario_nombre text,
  tipo text not null, -- CREACION, ESTADO, PROGRESO, EDICION, NOTA, ITEM_*, etc.
  descripcion text,
  valor_anterior text,
  valor_nuevo text,
  metadata jsonb default '{}'::jsonb, -- Store extra data like location {lat, lng}, or photo URLs
  created_at timestamptz default now()
);

-- Add indexes for performance
create index if not exists idx_cotizacion_historial_cotizacion_id on cotizacion_historial(cotizacion_id);
create index if not exists idx_cotizacion_historial_fecha on cotizacion_historial(fecha desc);

-- Enable RLS
alter table cotizacion_historial enable row level security;

-- Policies (Adjust based on your project's auth needs, allowing all for authenticated for now)
create policy "Authenticated users can select history"
on cotizacion_historial for select
to authenticated
using (true);

create policy "Authenticated users can insert history"
on cotizacion_historial for insert
to authenticated
with check (true);
