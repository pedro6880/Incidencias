-- Ejecuta este script desde SQL Editor en tu proyecto Supabase.
-- Sustituye CAMBIA-ESTE-PIN por el PIN que compartirás con el profesorado.

create extension if not exists pgcrypto;
create schema if not exists incidencias;

create table if not exists incidencias.registros (
  id uuid primary key default gen_random_uuid(),
  aula_ubicacion text not null check (char_length(aula_ubicacion) between 1 and 120),
  nombre_profesor text not null check (char_length(nombre_profesor) between 1 and 160),
  incidencia text not null check (char_length(incidencia) between 1 and 2000),
  fecha_incidencia date not null default current_date,
  creado_por uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table incidencias.registros alter column creado_por drop not null;

create table if not exists incidencias.configuracion (
  clave text primary key,
  valor text not null
);

insert into incidencias.configuracion (clave, valor)
values ('pin_hash', crypt('CAMBIA-ESTE-PIN', gen_salt('bf')))
on conflict (clave) do update set valor = excluded.valor;

create index if not exists registros_fecha_incidencia_idx
  on incidencias.registros (fecha_incidencia desc);

alter table incidencias.registros enable row level security;
alter table incidencias.configuracion enable row level security;

revoke all on incidencias.registros from anon, authenticated;
revoke all on incidencias.configuracion from anon, authenticated;
grant usage on schema incidencias to anon, authenticated;

create or replace function incidencias.pin_valido(p_pin text)
returns boolean
language sql
security definer
set search_path = incidencias, extensions, public
as $$
  select exists (
    select 1
    from incidencias.configuracion
    where clave = 'pin_hash' and valor = crypt(p_pin, valor)
  );
$$;

create or replace function incidencias.listar_registros(p_pin text)
returns setof incidencias.registros
language plpgsql
security definer
set search_path = incidencias, extensions, public
as $$
begin
  if not incidencias.pin_valido(p_pin) then raise exception 'PIN incorrecto'; end if;
  return query select * from incidencias.registros order by fecha_incidencia desc, created_at desc;
end;
$$;

create or replace function incidencias.crear_registro(
  p_pin text, p_aula_ubicacion text, p_nombre_profesor text, p_incidencia text, p_fecha_incidencia date
)
returns void
language plpgsql
security definer
set search_path = incidencias, extensions, public
as $$
begin
  if not incidencias.pin_valido(p_pin) then raise exception 'PIN incorrecto'; end if;
  insert into incidencias.registros (aula_ubicacion, nombre_profesor, incidencia, fecha_incidencia)
  values (p_aula_ubicacion, p_nombre_profesor, p_incidencia, p_fecha_incidencia);
end;
$$;

create or replace function incidencias.eliminar_registro(p_pin text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = incidencias, extensions, public
as $$
begin
  if not incidencias.pin_valido(p_pin) then raise exception 'PIN incorrecto'; end if;
  delete from incidencias.registros where id = p_id;
end;
$$;

revoke all on function incidencias.pin_valido(text) from public;
revoke all on function incidencias.listar_registros(text) from public;
revoke all on function incidencias.crear_registro(text, text, text, text, date) from public;
revoke all on function incidencias.eliminar_registro(text, uuid) from public;

grant execute on function incidencias.listar_registros(text) to anon, authenticated;
grant execute on function incidencias.crear_registro(text, text, text, text, date) to anon, authenticated;
grant execute on function incidencias.eliminar_registro(text, uuid) to anon, authenticated;
