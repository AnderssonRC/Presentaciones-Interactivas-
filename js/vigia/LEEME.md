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

| `epub.jsx` | Libros EPUB: los abre con JSZip (cdnjs, solo al abrir un EPUB), limpia cada capítulo (sin scripts, estilos ni enlaces del libro) y `LectorEpub` (capítulo con sus marcas sobre el texto) y `NavCapitulos`. |
| `editor-epub.jsx` | Editor de EPUB: seleccionar texto + tipo para marcar; "Ajustar a la selección" para reubicar una marca. |
| `presentar-epub.jsx` | Presentar un EPUB: capítulo a pantalla completa, tamaño de letra, siguiente activador. |
| `respaldo.jsx` | Sin Drive: «Guardar solo en este computador» (`SubirLocal`), «Descargar respaldo» (`.vigia.zip` = `activacion.json` + `documento.pdf|epub`) e «Importar respaldo» en otro computador. |
| `audio.jsx` | Podcast: `resolverPodcast(url)` reconoce YouTube, Spotify (iFrame API), SoundCloud (Widget API), Apple Podcasts (MP3 vía API de iTunes, JSONP), iVoox (`listen_mn_<id>_1.mp3`), Internet Archive (API de metadatos), Drive/Dropbox y MP3 directos. Reproductores `useAudio`, `useSpotify`, `useSoundCloud` (misma forma que `useYouTube`) y `usePodcast`. Imágenes en el tiempo: `imagenesDe`, `imagenEn(p, t)`. |
| `editor-podcast.jsx` | Editor de **podcast**: `PasoPodcast`, imagen inicial (`CampoImagen`), imágenes en el tiempo (`ConfigImagen`, `podcast.imagenes = [{ id, t, url }]`), `PortadaPodcast` (fundido entre imágenes, encima del reproductor) y `ControlesAudio`. |
| `presentar-podcast.jsx` | Presentar de **podcast**: la imagen a pantalla completa, mismas tarjetas y barra que el video; «YT» muestra el video de YouTube (anuncios). |
| `editor-imagenes.jsx` | Editor de **imágenes** (estilo Genially): imágenes como diapositivas (`galeria.diapos`), activadores como íconos arrastrables sobre la imagen (`x`, `y` en 0–1, `tarjeta: 'pequena'|'grande'`, `titulo` = primer vistazo), `LienzoImagen` y `MusicaFondo` (`galeria.musica`, mismas plataformas que el podcast). |
| `presentar-imagenes.jsx` | Presentar **imágenes**: íconos que laten, vistazo al pasar el mouse, `MiniTarjeta` junto al ícono o `TarjetaActivacion` grande, navegación ← → con puntos, música de fondo que baja al abrir una tarjeta. |
| `presentar-reto.jsx` | Tipo **físico-grupal** «Reto de activación»: escena del cóndor retador (`condor-retador.png`, rayos y ojos que se encienden) y el reto a pantalla completa con sorteo de parejas, grupos u orden. Los retos preconfigurados están en `tipos.js` (`RETOS`); los grupos de tipos, en `GRUPOS`. |
| `drive.jsx` | Google Drive del docente: sesión con Google Identity Services (`DriveAuth`, `<DriveSesion />`), carpeta «Res Cogitans/PDFs», subida del PDF, lista de PDF ya subidos y el JSON de marcas (`useSincronizarMarcas`). |

### Sobre el PDF (Google Drive)

- **Configuración:** pega el ID de cliente OAuth en `js/google-config.js` (los pasos están en ese archivo). Permiso: `drive.file` (la app solo ve lo que ella crea).
- **Dónde queda:** en tu Drive, carpeta «Res Cogitans/PDFs»: el PDF y `<nombre>.marcas.json` (activadores, estudiantes, definiciones del glosario). El JSON se actualiza solo 2,5 s después del último cambio. Firestore sigue guardando la activación (ids de Drive incluidos).
- **Abrir:** PDF.js lo descarga con `files.get?alt=media` y el token. Queda una copia en caché en el navegador (IndexedDB `vigia-pdf`, clave `drive:<id>`), así abre rápido y aunque la sesión de Google haya vencido.
- **Sesión:** el token dura ~1 h y se guarda solo en la pestaña (sessionStorage). Al vencer, un clic en «Conectar Drive» lo renueva.
- Activaciones anteriores a Drive (enlace o archivo subido al navegador) se siguen abriendo; la app ofrece pasarlas a Drive.

### Copia en este computador y respaldo (sin Drive)

- **Orden de búsqueda al abrir** (`leerCopiaLocal` en `pdf.jsx`): 1) caché de Drive `drive:<idDrive>`, 2) copia local `local:<idActivación>` (y la clave antigua `<idActivación>`), 3) Google Drive, 4) enlace antiguo. Así abre sin Drive o si Drive falla.
- **Solo en este computador:** `pdf: { local: true, nombre, formato }` sin `driveId`. No hay JSON de marcas en Drive (las marcas siguen en Firestore).
- **Llevar a otro computador:** «Descargar respaldo» → `.vigia.zip`. En el otro: «Importar respaldo» (dashboard) o, desde el aviso de error del documento, elegir el `.zip` o el archivo. Si la activación ya existe en la cuenta, se pregunta si se reemplazan sus marcas.
- El navegador no puede buscar archivos en el disco por sí solo: la «búsqueda local» es la copia guardada en IndexedDB de ese navegador.

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

**EPUB:** el archivo va en el mismo campo `pdf` con `formato: 'epub'` (y en la misma carpeta de Drive). Como el texto de un EPUB se reacomoda, sus marcas no son rectángulos sino posiciones de texto: `cap` (capítulo, índice del spine) e `ini`/`fin` (caracteres dentro del texto de ese capítulo). `fragmento` es el texto seleccionado.

En un documento (`recurso: 'documento'`), en lugar de `video` hay `pdf: { url, nombre, local }`, y cada activación lleva `pagina` y su rectángulo `x, y, w, h` (fracciones 0–1 de la página) en lugar de `t`, más `fragmento` (texto marcado). El Glosario agrega `termino` y `definicion` (la que se escribe en vivo al presentar, y queda guardada).

## Agregar un tipo de activación

1. Agrégalo a `TIPOS` en `tipos.js` y su `id` a los `tipos` de los recursos donde aplique.
2. Si tiene campos propios, agrégalos en `ConfigActivacion` (`editor.jsx`).
3. Define cómo se ve en `ContenidoActivacion` (`presentar.jsx`).

## Agregar un recurso (Podcast, Imágenes…)

1. Quita su `pronto: true` en `tipos.js` (ahí está también qué tipos de activación habilita).
2. Crea su editor y su modo Presentar en archivos propios (por ejemplo `editor-podcast.jsx` y `presentar-podcast.jsx`) y agrégalos a `VIGIA_MODULOS` en `js/vigia.jsx`.
3. Elígelos según `act.recurso` en `VigiaEditor` (`editor.jsx`) y `VigiaPresentar` (`presentar.jsx`).
4. Cumple la lista de «Todo modo Presentar» (abajo).

## Todo modo Presentar (obligatorio en todos: Video, Documento, Podcast, Imágenes…)

- **Exceso de luz / tono de pantalla:**
  - `const [tono, setTono] = useTonoPresentar();` (recuerda el tono en ese computador y activa la tecla **L**).
  - En la raíz: `className={'vigia vg-presentar … tono-' + tono}`.
  - Al final de la raíz: `<TonoLateral tono={tono} setTono={setTono} />` (botón ☀ en el borde izquierdo: aparece al acercar el mouse y se oculta al retirarlo).
  - Mando a distancia (mando.jsx): `const mando = useMandoVigia(estado, manejar)` y `<MandoBadge mando={mando} />`. `estado` es lo que ve el celular (recurso, lista con `itemMando`, activa…); `manejar(accion)` recibe 'alternar', 'continuar', 'abrir', 'siguiente', 'saltar', 'zoom', 'salir'… La pantalla del celular es `mando-celular.jsx` (la carga remote.jsx; versión en `VIGIA_MANDO_VERSION` de vigia.jsx).
  - Y después: `<HerramientasPresentar />` (herramientas.jsx: pincel abajo a la izquierda con lupa, marcador, puntero y texto; la lupa escala `.vg-presentar`).
  - Lo que se proyecta lleva una clase genérica para que los tonos lo afecten:
    - `vg-proyectado-doc`: páginas, textos e **imágenes** (Imágenes y Documento).
    - `vg-proyectado-medio`: video, portada o animación del **podcast**.
  - Las tarjetas (`TarjetaActivacion`) cambian de tono solas.
- **Pantalla completa:** `usePantallaCompleta(onExit)`.
- **Ruleta sin repetir:** `useUsadosRuleta(act.estudiantes)`.
- **Tarjeta y frases:** `TarjetaActivacion` con `frase={VigiaTipos.fraseAlAzar(…)}` y un `textoContinuar` acorde («Continuar el audio», «Volver a la imagen»…).
- **Controles discretos** que se ocultan solos (como la pastilla de PDF/EPUB), con Esc para salir.
