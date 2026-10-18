# Modo Vigía

Vuelve interactivos los recursos "cerrados" (videos, documentales, podcast…): el recurso se detiene en momentos elegidos por el docente y aparece una activación en pantalla.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `../vigia.jsx` | Dashboard del Modo Vigía, pantalla de carga, ventana "¿Qué recurso?" y `cargarVigia()` (carga todo lo de esta carpeta). Se carga al abrir la página. |
| `tipos.js` | Recursos (Video, Documento, Podcast, Imágenes) y los 5 tipos de activación: nombre, color, ícono, propósito, textos del editor y si usan ruleta. |
| `youtube.jsx` | Reproductor de YouTube (`useYouTube`) e `idDeYouTube(url)`. |
| `ruleta.jsx` | Ruleta de estudiantes (no repite a nadie hasta que hayan salido todos). |
| `editor.jsx` | Editor: enlace del video, línea de tiempo, lista y configuración de activaciones. |
| `presentar.jsx` | Presentar: video a pantalla completa y tarjeta de la activación con borde de luz. |
| `estilos.css` | Estilos del editor y de Presentar. |

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

## Agregar un tipo de activación

1. Agrégalo a `TIPOS` en `tipos.js` y su `id` a los `tipos` de los recursos donde aplique.
2. Si tiene campos propios, agrégalos en `ConfigActivacion` (`editor.jsx`).
3. Define cómo se ve en `ContenidoActivacion` (`presentar.jsx`).

## Agregar un recurso (Documento, Podcast, Imágenes)

Quita su `pronto: true` en `tipos.js` y crea su editor y su modo Presentar (por ejemplo `editor-documento.jsx`). En `app.jsx` elige el editor según `act.recurso`.
