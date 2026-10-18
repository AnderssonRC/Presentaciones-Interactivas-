# Modo Vigía

Vuelve interactivos los recursos "cerrados" (videos, documentales, podcast…): el recurso se detiene en momentos elegidos por el docente y aparece una activación en pantalla.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `../vigia.jsx` | Dashboard del Modo Vigía, pantalla de carga, ventana "¿Qué recurso?" y `cargarVigia()` (carga todo lo de esta carpeta). Se carga al abrir la página. |
| `tipos.js` | Recursos (Video, Documento, Podcast, Imágenes) y los 5 tipos de activación: nombre, color, ícono, propósito, textos del editor y si usan ruleta. |
| `youtube.jsx` | Reproductor de YouTube (`useYouTube`) e `idDeYouTube(url)`. |
| `pdf.jsx` | PDF: carga PDF.js (desde cdnjs, solo al abrir un PDF), guarda el archivo subido en el navegador (IndexedDB) y `VisorPdf` (páginas + activadores encima). |
| `ruleta.jsx` | Ruleta de estudiantes (no repite a nadie hasta que hayan salido todos). |
| `editor.jsx` | `VigiaEditor` (elige el editor según el recurso), editor de **video** y piezas compartidas: `ConfigActivacion`, `RecursoChips`, `EstudiantesPopover`. |
| `editor-pdf.jsx` | Editor de **documento**: enlace o subida del PDF y marcado de activadores arrastrando sobre el texto. |
| `presentar.jsx` | `VigiaPresentar` (elige según el recurso), Presentar de **video** y la tarjeta de la activación (`TarjetaActivacion`, `ContenidoActivacion`, Glosario). |
| `presentar-pdf.jsx` | Presentar de **documento**: PDF con activadores numerados; al tocarlos aparece la tarjeta. |
| `estilos.css` | Estilos del editor y de Presentar. |

| `drive.jsx` | Google Drive del docente: sesión con Google Identity Services (`DriveAuth`, `<DriveSesion />`), carpeta «Res Cogitans/PDFs», subida del PDF, lista de PDF ya subidos y el JSON de marcas (`useSincronizarMarcas`). |

### Sobre el PDF (Google Drive)

- **Configuración:** pega el ID de cliente OAuth en `js/google-config.js` (los pasos están en ese archivo). Permiso: `drive.file` (la app solo ve lo que ella crea).
- **Dónde queda:** en tu Drive, carpeta «Res Cogitans/PDFs»: el PDF y `<nombre>.marcas.json` (activadores, estudiantes, definiciones del glosario). El JSON se actualiza solo 2,5 s después del último cambio. Firestore sigue guardando la activación (ids de Drive incluidos).
- **Abrir:** PDF.js lo descarga con `files.get?alt=media` y el token. Queda una copia en caché en el navegador (IndexedDB `vigia-pdf`, clave `drive:<id>`), así abre rápido y aunque la sesión de Google haya vencido.
- **Sesión:** el token dura ~1 h y se guarda solo en la pestaña (sessionStorage). Al vencer, un clic en «Conectar Drive» lo renueva.
- Activaciones anteriores a Drive (enlace o archivo subido al navegador) se siguen abriendo; la app ofrece pasarlas a Drive.

Todo lo de esta carpeta se carga **solo al entrar al Modo Vigía**, mientras se ve la animación del cóndor, así no pesa en Actividades Interactivas.

## Al modificar un archivo de esta carpeta

Sube su versión en `VIGIA_MODULOS` (o `VIGIA_ESTILOS` para el CSS) dentro de `js/vigia.jsx`, y luego el `?v=` de `js/vigia.jsx` en `index.html`.

## Datos guardados

Cada activación es un documento en la misma colección que las presentaciones (`users/{uid}/presentations`), marcado con `clase: 'vigia'`:

```js
{ id, clase: 'vigia', recurso: 'video', titulo, objetivo, usos, lastPresented,
  video: { url, id },            // id de YouTube
  estudiantes: ['Ana', …],       // para la ruleta
  activaciones: [{ id, tipo, t, texto, ruleta, modo, opciones, correcta }] }
```

`t` es el segundo del video. `modo` (`'abierta'` / `'cerrada'`), `opciones` y `correcta` solo existen en las preguntas.

En un documento (`recurso: 'documento'`), en lugar de `video` hay `pdf: { url, nombre, local }`, y cada activación lleva `pagina` y su rectángulo `x, y, w, h` (fracciones 0–1 de la página) en lugar de `t`, más `fragmento` (texto marcado). El Glosario agrega `termino` y `definicion` (la que se escribe en vivo al presentar, y queda guardada).

## Agregar un tipo de activación

1. Agrégalo a `TIPOS` en `tipos.js` y su `id` a los `tipos` de los recursos donde aplique.
2. Si tiene campos propios, agrégalos en `ConfigActivacion` (`editor.jsx`).
3. Define cómo se ve en `ContenidoActivacion` (`presentar.jsx`).

## Agregar un recurso (Documento, Podcast, Imágenes)

Quita su `pronto: true` en `tipos.js` y crea su editor y su modo Presentar (por ejemplo `editor-documento.jsx`). En `app.jsx` elige el editor según `act.recurso`.
