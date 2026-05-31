-- Ejecuta este script una sola vez desde SQL Editor en tu proyecto Supabase.
-- La aplicación usa un schema propio para convivir con tus tablas existentes.

create schema if not exists incidencias;

create table if not exists incidencias.registros (
  id uuid primary key default gen_random_uuid(),
  aula_ubicacion text not null check (char_length(aula_ubicacion) between 1 and 120),
  nombre_profesor text not null check (char_length(nombre_profesor) between 1 and 160),
  incidencia text not null check (char_length(incidencia) between 1 and 2000),
  fecha_incidencia date not null default current_date,
  creado_por uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists registros_fecha_incidencia_idx
  on incidencias.registros (fecha_incidencia desc);

create index if not exists registros_creado_por_idx
  on incidencias.registros (creado_por);

alter table incidencias.registros enable row level security;

grant usage on schema incidencias to authenticated, service_role;
grant select, insert, update, delete on table incidencias.registros to authenticated, service_role;
grant usage, select on all sequences in schema incidencias to authenticated, service_role;

alter default privileges for role postgres in schema incidencias
  grant select, insert, update, delete on tables to authenticated, service_role;

drop policy if exists "Usuarios autenticados pueden consultar incidencias" on incidencias.registros;
create policy "Usuarios autenticados pueden consultar incidencias"
  on incidencias.registros for select
  to authenticated
  using (true);

drop policy if exists "Usuarios autenticados pueden registrar incidencias" on incidencias.registros;
create policy "Usuarios autenticados pueden registrar incidencias"
  on incidencias.registros for insert
  to authenticated
  with check ((select auth.uid()) = creado_por);

drop policy if exists "Usuarios pueden eliminar sus incidencias" on incidencias.registros;
create policy "Usuarios pueden eliminar sus incidencias"
  on incidencias.registros for delete
  to authenticated
  using ((select auth.uid()) = creado_por);
