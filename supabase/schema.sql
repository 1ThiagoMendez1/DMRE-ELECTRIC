-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- FUNCTION UPDATE_MODIFIED_COLUMN (Definir al inicio)
create or replace function update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language 'plpgsql';

-- ROLES & PERMISSIONS
create type user_role as enum ('ADMIN', 'ENGINEER', 'CLIENT', 'VIEWER');

create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  role user_role default 'VIEWER'::user_role,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ==========================================
-- MÓDULO COMERCIAL (Clientes, Cotizaciones)
-- ==========================================

-- CLIENTES
create table public.clientes (
  id uuid default gen_random_uuid() primary key,
  codigo text, 
  nombre text not null,
  documento text,
  direccion text,
  correo text,
  telefono text,
  contacto_principal text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.clientes enable row level security;
create policy "Clientes access" on public.clientes for all to authenticated using (true);

-- COTIZACIONES
create type cotizacion_estado as enum ('PENDIENTE', 'APROBADA', 'NO_APROBADA', 'EN_EJECUCION', 'FINALIZADA', 'BORRADOR', 'ENVIADA', 'EN_REVISION', 'RECHAZADA');
create type cotizacion_tipo as enum ('NORMAL', 'SIMPLIFICADA');

create table public.cotizaciones (
  id uuid default gen_random_uuid() primary key,
  numero text,
  tipo cotizacion_tipo default 'NORMAL',
  fecha date default CURRENT_DATE,
  cliente_id uuid references public.clientes(id),
  descripcion_trabajo text,
  subtotal numeric default 0,
  aiu_admin numeric default 0,
  aiu_imprevistos numeric default 0,
  aiu_utilidad numeric default 0,
  iva numeric default 0,
  total numeric default 0,
  estado cotizacion_estado default 'PENDIENTE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cotizaciones enable row level security;
create policy "Cotizaciones access" on public.cotizaciones for all to authenticated using (true);

-- ==========================================
-- MÓDULO INVENTARIO Y OPERACIONES
-- ==========================================

-- INVENTARIO
create type inventario_categoria as enum ('MATERIAL', 'HERRAMIENTA', 'DOTACION', 'EPP');
create type inventario_ubicacion as enum ('BODEGA', 'OBRA');
create type inventario_tipo as enum ('SIMPLE', 'COMPUESTO');

create table public.inventario (
  id uuid default gen_random_uuid() primary key,
  sku text,
  item text, 
  descripcion text not null,
  categoria inventario_categoria,
  ubicacion inventario_ubicacion default 'BODEGA',
  unidad text,
  cantidad numeric default 0,
  stock_minimo numeric default 0,
  valor_unitario numeric default 0,
  valor_total numeric generated always as (cantidad * valor_unitario) stored,
  tipo inventario_tipo default 'SIMPLE',
  costo_materiales numeric default 0,
  margen_utilidad numeric default 0,
  t1 numeric default 0,
  t2 numeric default 0,
  t3 numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.inventario enable row level security;
create policy "Inventario access" on public.inventario for all to authenticated using (true);

-- ITEMS DE COTIZACION
create table public.cotizacion_items (
  id uuid default gen_random_uuid() primary key,
  cotizacion_id uuid references public.cotizaciones(id) on delete cascade,
  inventario_id uuid references public.inventario(id),
  descripcion text,
  cantidad numeric not null default 1,
  valor_unitario numeric not null default 0,
  valor_total numeric generated always as (cantidad * valor_unitario) stored
);

alter table public.cotizacion_items enable row level security;
create policy "Cotizacion Items access" on public.cotizacion_items for all to authenticated using (true);

-- CÓDIGOS DE TRABAJO (APUs)
create table public.codigos_trabajo (
  id uuid default gen_random_uuid() primary key,
  codigo text unique,
  nombre text,
  descripcion text,
  mano_de_obra numeric default 0,
  costo_total_materiales numeric default 0,
  costo_total numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.codigos_trabajo enable row level security;
create policy "Codigos Trabajo access" on public.codigos_trabajo for all to authenticated using (true);

create table public.materiales_asociados (
  id uuid default gen_random_uuid() primary key,
  codigo_trabajo_id uuid references public.codigos_trabajo(id) on delete cascade,
  inventario_id uuid references public.inventario(id),
  nombre text,
  cantidad numeric default 1,
  valor_unitario numeric default 0
);

alter table public.materiales_asociados enable row level security;
create policy "Materiales Asociados access" on public.materiales_asociados for all to authenticated using (true);


-- ==========================================
-- MÓDULO FINANCIERO (Facturación, Bancos)
-- ==========================================

-- FACTURAS
create type factura_estado as enum ('PENDIENTE', 'PARCIAL', 'CANCELADA');

create table public.facturas (
  id uuid default gen_random_uuid() primary key,
  numero text,
  cotizacion_id uuid references public.cotizaciones(id),
  fecha_emision date default CURRENT_DATE,
  fecha_vencimiento date,
  valor_facturado numeric default 0,
  anticipo_recibido numeric default 0,
  retencion_renta numeric default 0,
  retencion_ica numeric default 0,
  retencion_iva numeric default 0,
  saldo_pendiente numeric default 0,
  estado factura_estado default 'PENDIENTE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.facturas enable row level security;
create policy "Facturas access" on public.facturas for all to authenticated using (true);

-- CUENTAS BANCARIAS
create type cuenta_tipo as enum ('BANCO', 'EFECTIVO', 'CREDITO');

create table public.cuentas_bancarias (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  tipo cuenta_tipo default 'BANCO',
  saldo_actual numeric default 0,
  numero_cuenta text,
  banco text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cuentas_bancarias enable row level security;
create policy "Cuentas Bancarias access" on public.cuentas_bancarias for all to authenticated using (true);

-- MOVIMIENTOS FINANCIEROS
create type movimiento_tipo as enum ('INGRESO', 'EGRESO');
create type movimiento_categoria as enum ('NOMINA', 'PROVEEDORES', 'SERVICIOS', 'IMPUESTOS', 'PRESTAMOS', 'VENTAS', 'OTROS');

create table public.movimientos_financieros (
  id uuid default gen_random_uuid() primary key,
  fecha date default CURRENT_DATE,
  tipo movimiento_tipo not null,
  cuenta_id uuid references public.cuentas_bancarias(id),
  categoria movimiento_categoria,
  tercero text,
  concepto text,
  valor numeric default 0,
  oferta_id uuid references public.cotizaciones(id), -- Opcional link
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.movimientos_financieros enable row level security;
create policy "Movimientos Financieros access" on public.movimientos_financieros for all to authenticated using (true);

-- OBLIGACIONES FINANCIERAS
create table public.obligaciones_financieras (
  id uuid default gen_random_uuid() primary key,
  entidad text,
  monto_prestado numeric,
  tasa_interes numeric,
  plazo_meses numeric,
  saldo_capital numeric,
  valor_cuota numeric,
  fecha_inicio date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.obligaciones_financieras enable row level security;
create policy "Obligaciones access" on public.obligaciones_financieras for all to authenticated using (true);


-- ==========================================
-- MÓDULO PROVEEDORES
-- ==========================================

create type proveedor_categoria as enum ('MATERIALES', 'SERVICIOS', 'MIXTO');

create table public.proveedores (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  nit text,
  categoria proveedor_categoria,
  datos_bancarios text,
  correo text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.proveedores enable row level security;
create policy "Proveedores access" on public.proveedores for all to authenticated using (true);

create table public.cuentas_por_pagar (
  id uuid default gen_random_uuid() primary key,
  proveedor_id uuid references public.proveedores(id),
  numero_factura_proveedor text,
  fecha date,
  concepto text,
  valor_total numeric,
  valor_pagado numeric default 0,
  saldo_pendiente numeric, -- Calculado o almacenado
  oferta_id uuid references public.cotizaciones(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.cuentas_por_pagar enable row level security;
create policy "Cuentas por Pagar access" on public.cuentas_por_pagar for all to authenticated using (true);


-- ==========================================
-- MÓDULO RRHH (Empleados, Nómina)
-- ==========================================

-- EMPLEADOS
create type empleado_estado as enum ('ACTIVO', 'INACTIVO');

create table public.empleados (
  id uuid default gen_random_uuid() primary key,
  nombre_completo text not null,
  cedula text unique,
  cargo text,
  salario_base numeric default 0,
  fecha_ingreso date,
  estado empleado_estado default 'ACTIVO',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.empleados enable row level security;
create policy "Empleados access" on public.empleados for all to authenticated using (true);

-- NOVEDADES NOMINA
create type novedad_tipo as enum ('HORA_EXTRA_DIURNA', 'HORA_EXTRA_NOCTURNA', 'FESTIVA', 'PRESTAMO', 'AUSENCIA');
create type novedad_efecto as enum ('SUMA', 'RESTA');

create table public.novedades_nomina (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.empleados(id),
  fecha date,
  tipo novedad_tipo,
  cantidad numeric default 0,
  valor_unitario numeric default 0,
  valor_calculado numeric default 0,
  efecto novedad_efecto default 'SUMA',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.novedades_nomina enable row level security;
create policy "Novedades access" on public.novedades_nomina for all to authenticated using (true);

-- LIQUIDACIONES
create table public.liquidaciones_nomina (
  id uuid default gen_random_uuid() primary key,
  periodo text, -- e.g. "2024-01-Q1"
  empleado_id uuid references public.empleados(id),
  total_devengado numeric,
  total_deducido numeric,
  neto_pagar numeric,
  estado text default 'PENDIENTE', -- PENDIENTE, PAGADO
  detalle jsonb, -- Detalles en JSON
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.liquidaciones_nomina enable row level security;
create policy "Liquidaciones access" on public.liquidaciones_nomina for all to authenticated using (true);

-- CRÉDITOS EMPLEADOS
create table public.creditos_empleados (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.empleados(id),
  monto_prestado numeric,
  plazo_meses numeric,
  cuota_mensual numeric,
  saldo_pendiente numeric,
  fecha_otorgado date,
  estado text default 'ACTIVO', -- ACTIVO, PAGADO
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.creditos_empleados enable row level security;
create policy "Creditos Empleados access" on public.creditos_empleados for all to authenticated using (true);


-- ==========================================
-- MÓDULO ACTIVOS (Vehículos)
-- ==========================================

create table public.vehiculos (
  id uuid default gen_random_uuid() primary key,
  placa text unique,
  marca_modelo text,
  conductor_asignado text,
  vencimiento_soat date,
  vencimiento_tecnomecanica date,
  vencimiento_seguro date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vehiculos enable row level security;
create policy "Vehiculos access" on public.vehiculos for all to authenticated using (true);

create type gasto_vehiculo_tipo as enum ('COMBUSTIBLE', 'PEAJE', 'MANTENIMIENTO', 'PARQUEADERO', 'OTROS');

create table public.gastos_vehiculos (
  id uuid default gen_random_uuid() primary key,
  vehiculo_id uuid references public.vehiculos(id),
  fecha date,
  tipo gasto_vehiculo_tipo,
  kilometraje numeric,
  valor numeric,
  proveedor text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.gastos_vehiculos enable row level security;
create policy "Gastos Vehiculos access" on public.gastos_vehiculos for all to authenticated using (true);


-- ==========================================
-- MÓDULO DOTACIÓN
-- ==========================================

create table public.dotacion_items (
  id uuid default gen_random_uuid() primary key,
  descripcion text,
  categoria text, -- UNIFORME, EPP, HERRAMIENTA
  genero text, -- HOMBRE, MUJER, UNISEX
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.dotacion_items enable row level security;
create policy "Dotacion Items access" on public.dotacion_items for all to authenticated using (true);

create table public.dotacion_variantes (
  id uuid default gen_random_uuid() primary key,
  dotacion_id uuid references public.dotacion_items(id) on delete cascade,
  talla text,
  color text,
  cantidad_disponible numeric default 0
);

alter table public.dotacion_variantes enable row level security;
create policy "Dotacion Variantes access" on public.dotacion_variantes for all to authenticated using (true);

create table public.entregas_dotacion (
  id uuid default gen_random_uuid() primary key,
  empleado_id uuid references public.empleados(id),
  fecha date,
  estado text default 'ASIGNADO', -- ASIGNADO, ENTREGADO, RECHAZADO
  observacion text,
  fecha_aceptacion date,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.entregas_dotacion enable row level security;
create policy "Entregas Dotacion access" on public.entregas_dotacion for all to authenticated using (true);

create table public.entrega_dotacion_items (
  id uuid default gen_random_uuid() primary key,
  entrega_id uuid references public.entregas_dotacion(id) on delete cascade,
  dotacion_id uuid references public.dotacion_items(id),
  variante_id uuid references public.dotacion_variantes(id),
  cantidad numeric default 1,
  detalle text
);

alter table public.entrega_dotacion_items enable row level security;
create policy "Entrega Dotacion Items access" on public.entrega_dotacion_items for all to authenticated using (true);

-- ==========================================
-- AGENDA
-- ==========================================
create type tarea_prioridad as enum ('ALTA', 'MEDIA', 'BAJA');
create type tarea_estado as enum ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA');

create table public.agenda (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descripcion text,
  fecha_vencimiento date,
  asignado_a uuid references public.empleados(id), -- O auth.users, pero empleados por ahora
  prioridad tarea_prioridad default 'MEDIA',
  estado tarea_estado default 'PENDIENTE',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.agenda enable row level security;
create policy "Agenda access" on public.agenda for all to authenticated using (true);

-- Trigger de Update para todas las tablas
do $$
declare
  t text;
begin
  for t in 
    select table_name from information_schema.tables where table_schema = 'public'
  loop
    execute format('drop trigger if exists update_modtime on %I', t);
    execute format('create trigger update_modtime before update on %I for each row execute procedure update_modified_column()', t);
  end loop;
end;
$$ language plpgsql;
