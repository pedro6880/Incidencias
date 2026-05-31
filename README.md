# Parte de Aula

Aplicación web sencilla para registrar incidencias compartidas usando un proyecto
Supabase existente. Las tablas se guardan en el schema `incidencias` para no
mezclarlas con otras aplicaciones del mismo proyecto.

## Configuración

1. Abre tu proyecto en Supabase y ejecuta `supabase-setup.sql` desde **SQL Editor**.
2. Ve a **Project Settings > API > Exposed schemas** y añade `incidencias`.
3. Abre **Project Settings > API** y localiza la URL del proyecto y la clave
   pública `anon` o `publishable`.
4. Edita `app-config.js` y reemplaza los dos valores de ejemplo.
5. En Supabase, revisa **Authentication > Providers > Email**. Mantén activado
   el proveedor de correo. Los profesores accederán mediante un enlace enviado
   a su email, sin contraseña.

## Ejecutar en local

En Windows, haz doble clic en:

`iniciar-app.cmd`

La aplicación abrirá directamente `index.html` en el navegador. No necesita
Python, una consola abierta ni un servidor local.

## Publicar en Vercel

Esta aplicación es un sitio estático. No necesita comando de compilación.

### Desde la web de Vercel

1. Crea un repositorio GitHub con los archivos de esta carpeta.
2. Entra en `https://vercel.com/new` e importa el repositorio.
3. En **Framework Preset**, elige **Other**.
4. Deja vacíos **Build Command** y **Output Directory**.
5. Pulsa **Deploy**.

### Configurar Supabase Auth

Cuando Vercel muestre la URL pública, por ejemplo
`https://parte-de-aula.vercel.app`, abre Supabase:

1. Ve a **Authentication > URL Configuration**.
2. Cambia **Site URL** por la URL pública de Vercel.
3. Añade la misma dirección en **Redirect URLs**, terminada en `/**`:
   `https://parte-de-aula.vercel.app/**`.

## Acceso de profesores

La aplicación utiliza enlaces de acceso por correo electrónico. No es necesario
crear ni recordar contraseñas. Supabase crea el usuario cuando accede por primera
vez y mantiene la sesión en el navegador.

En **Authentication > URL Configuration**, configura correctamente **Site URL**
y **Redirect URLs** para que el enlace recibido por correo vuelva a la aplicación
publicada en Vercel.

La URL de Supabase y la clave pública `publishable` se encuentran en
`app-config.js`. La clave `service_role` nunca debe incluirse en la aplicación.

## Seguridad

- La aplicación solo utiliza la clave pública. Nunca pegues la clave
  `service_role` en `app-config.js`.
- Todos los usuarios autenticados pueden consultar las incidencias compartidas.
- Cada usuario puede eliminar únicamente las incidencias que registró.
- La creación comprueba que el identificador del autor coincide con el usuario
  autenticado mediante Row Level Security.
