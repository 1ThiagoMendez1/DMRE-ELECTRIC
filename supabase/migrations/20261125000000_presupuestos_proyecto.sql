-- Presupuesto explícito por oferta para el análisis de proyectos.
-- No reemplaza el precio de venta ni el total de cotización.
create table if not exists public.presupuestos_proyecto (
    cotizacion_id uuid primary key references public.cotizaciones(id) on delete cascade,
    valor_presupuestado numeric(18,2) not null check (valor_presupuestado >= 0),
    actualizado_por uuid references auth.users(id),
    updated_at timestamptz not null default now()
);

alter table public.presupuestos_proyecto enable row level security;
grant select, insert, update on public.presupuestos_proyecto to authenticated;

drop policy if exists presupuestos_proyecto_financiera_select on public.presupuestos_proyecto;
create policy presupuestos_proyecto_financiera_select on public.presupuestos_proyecto
for select to authenticated
using (exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and p.is_active is distinct from false
    and (p.role::text = 'ADMIN' or 'financiera' = any(p.sidebar_access))
));

drop policy if exists presupuestos_proyecto_financiera_insert on public.presupuestos_proyecto;
create policy presupuestos_proyecto_financiera_insert on public.presupuestos_proyecto
for insert to authenticated
with check (exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and p.is_active is distinct from false
    and (p.role::text = 'ADMIN' or 'financiera' = any(p.sidebar_access))
));

drop policy if exists presupuestos_proyecto_financiera_update on public.presupuestos_proyecto;
create policy presupuestos_proyecto_financiera_update on public.presupuestos_proyecto
for update to authenticated
using (exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and p.is_active is distinct from false
    and (p.role::text = 'ADMIN' or 'financiera' = any(p.sidebar_access))
))
with check (exists (
    select 1 from public.profiles p where p.id = (select auth.uid())
    and p.is_active is distinct from false
    and (p.role::text = 'ADMIN' or 'financiera' = any(p.sidebar_access))
));
