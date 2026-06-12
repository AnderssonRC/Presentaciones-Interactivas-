# Guía de despliegue — Actividades Interactivas

App estática (HTML + React por CDN, sin paso de build) con **Firebase Auth** (email/contraseña)
y **Firestore** para guardar las presentaciones de cada docente. Las imágenes se cargan **por URL**
(no se usa Firebase Storage, así no requiere facturación).

---

## 1. Estructura de archivos

```
/ (raíz del proyecto)
├── Actividades_Interactivas.html   ← página principal
├── styles.css
├── logoacogitas.png
├── logorescogitas.png
├── firestore.rules                 ← reglas de seguridad (se pegan en la consola)
└── js/
    ├── firebase-config.js          ← tu configuración de Firebase
    ├── db.js                       ← datos + auth (Firestore)
    ├── tweaks-panel.jsx
    ├── ui.jsx
    ├── activities.jsx
    ├── login.jsx
    ├── dashboard.jsx
    ├── editor.jsx
    ├── presenter.jsx
    └── app.jsx
```

---

## 2. Pegar las reglas de seguridad en Firebase

1. Consola de Firebase → **Firestore Database** → pestaña **Reglas (Rules)**.
2. Borra lo que haya y pega el contenido de `firestore.rules`.
3. **Publicar**.

Esto garantiza que cada docente solo puede ver y editar sus propias presentaciones.

> Nota (cambio de Firebase 2026): estas reglas cubren el acceso del SDK web que usa la app.
> No necesitas configurar nada más para que funcione con el cliente compat.

---

## 3. Subir el código a GitHub

```bash
cd <carpeta-del-proyecto>
git init
git add .
git commit -m "Actividades Interactivas con Firebase"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/<tu-repo>.git
git push -u origin main
```

---

## 4. Desplegar en Firebase Hosting (conectado a GitHub)

Necesitas Node.js instalado. En la carpeta del proyecto:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
```

Durante `firebase init hosting`, responde:

- **Proyecto**: elige `actividades-interactivas-7c492` (el que ya creaste).
- **¿Carpeta pública (public directory)?** → escribe `.` (un punto: la raíz, porque el HTML está ahí).
- **¿Configurar como single-page app (reescribir todo a index.html)?** → **No**.
- **¿Sobrescribir index.html?** → **No**.
- Si te ofrece **configurar despliegues automáticos con GitHub** → **Sí** (así cada `git push` publica solo).

> Importante: el archivo principal se llama `Actividades_Interactivas.html`, no `index.html`.
> Para que la app abra en la raíz del sitio, haz **una** de estas dos cosas:
>   a) Renombra el archivo a `index.html`, **o**
>   b) En `firebase.json`, dentro de `"hosting"`, añade una reescritura de la raíz a tu archivo.
> La opción (a) es la más simple y recomendada.

Despliegue manual (cuando quieras publicar a mano):

```bash
firebase deploy --only hosting
```

Al terminar te da una URL del tipo `https://actividades-interactivas-7c492.web.app`.
Esa es la dirección que compartes con los docentes.

---

## 5. Primer uso

1. Abre la URL del sitio.
2. Pulsa **"¿Primera vez? Crea una cuenta nueva"**, registra tu correo y contraseña.
3. Al entrar por primera vez se cargan 3 presentaciones de ejemplo. Edítalas o crea las tuyas.
4. Para las imágenes, pega el **enlace** de una imagen pública (por ejemplo, clic derecho →
   "Copiar dirección de la imagen" en cualquier imagen de la web).

---

## 6. Recordatorios

- **Imágenes por URL:** la imagen debe estar alojada en internet y ser de acceso público.
  Si más adelante quieres permitir *subir* archivos desde el equipo, hay que activar
  Firebase Storage (requiere plan Blaze / facturación) y ampliar el componente de imagen.
- **Sin copias de seguridad automáticas** en el plan gratuito. Para uso real, considera
  exportar tus datos periódicamente o subir al plan Pro.
- **Las claves de `firebase-config.js` son públicas** y es normal que estén en el frontend;
  la seguridad la dan las reglas de Firestore, no las claves.
