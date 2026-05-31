# Parte de Aula

Aplicación web para registrar incidencias compartidas usando un proyecto
Supabase existente. Las tablas se guardan en el schema `incidencias` para no
mezclarlas con otras aplicaciones del mismo proyecto.

## Configurar Supabase

1. Abre `supabase-setup.sql` y copia su contenido.
2. Pégalo en **SQL Editor** de Supabase.
3. Sustituye `CAMBIA-ESTE-PIN` únicamente dentro del editor SQL de Supabase.
4. Ejecuta el script completo sin guardar el PIN en los archivos del proyecto.
5. Ve a **Project Settings > API > Exposed schemas** y añade `incidencias`.
6. Comprueba que `app-config.js` contiene la URL y la clave pública
   `publishable` de tu proyecto.

El PIN se almacena como hash en Supabase. No se publica en Vercel ni se incluye
en el código JavaScript. Usa un PIN largo o una frase breve para dificultar
intentos de adivinación.

## Acceso

Los profesores introducen el PIN compartido del centro. La aplicación lo
conserva únicamente durante la sesión de la pestaña del navegador. Ya no utiliza
correos, enlaces de acceso ni contraseñas individuales.

Todos los usuarios que conozcan el PIN pueden consultar, registrar y eliminar
incidencias. Cambia el PIN ejecutando de nuevo `supabase-setup.sql` con un valor
nuevo si deja de ser confidencial.

## Ejecutar En Local

En Windows, haz doble clic en:

`iniciar-app.cmd`

## Publicar En Vercel

Esta aplicación es un sitio estático. Sube todos los archivos a tu repositorio
conectado a Vercel o crea un despliegue nuevo desde la web de Vercel.

Usa **Framework Preset: Other** y deja vacíos **Build Command** y
**Output Directory**.

## Seguridad

- Utiliza únicamente la clave pública `publishable` en `app-config.js`.
- Nunca incluyas la clave `service_role` en los archivos publicados.
- La tabla no está expuesta directamente al navegador.
- Las operaciones pasan por funciones SQL que validan el PIN.
