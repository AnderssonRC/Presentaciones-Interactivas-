/* google-config.js — ID de cliente OAuth de Google (Google Identity Services).
   Lo usa el Modo Vigía para guardar los PDF y sus marcas en TU Google Drive
   (carpeta "Res Cogitans/PDFs"), con el permiso drive.file: la app solo ve
   los archivos que ella misma crea.

   Cómo obtenerlo (una sola vez), en https://console.cloud.google.com
   con el proyecto "actividades-interactivas-7c492" (el mismo de Firebase):
     1. APIs y servicios > Biblioteca > "Google Drive API" > Habilitar.
     2. APIs y servicios > Pantalla de consentimiento de OAuth: tipo "Externo",
        nombre de la app, tu correo; en "Usuarios de prueba" agrega tu correo.
     3. APIs y servicios > Credenciales > Crear credenciales > ID de cliente
        de OAuth > "Aplicación web". En "Orígenes de JavaScript autorizados"
        agrega la dirección donde abres la app (p. ej. https://TU-USUARIO.github.io
        y, si pruebas en tu equipo, http://localhost:5500).
     4. Copia el "ID de cliente" (termina en .apps.googleusercontent.com) y
        pégalo abajo. No es una contraseña: puede estar en el código. */
window.GOOGLE_CLIENT_ID = '1011471685927-6bvfl5grci8j5cjt35lhhj0avjfs9ckd.apps.googleusercontent.com';
