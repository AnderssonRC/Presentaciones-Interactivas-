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
| `presentar.jsx` | `ImagenActivacion` muestra la imagen (`a.imagen`) y el video de YouTube opcional (`a.youtube` → `VideoActivacion`, con Reproducir/Desde el inicio/Agrandar; orden del celular `video-tarjeta`). `VigiaPresentar` (elige según el recurso), Presentar de **video** y la tarjeta de la activación (`TarjetaActivacion`, `ContenidoActivacion`, Glosario). |
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
| `presentar-jaguar.jsx` | **Modo Jaguar** (equipos; tipos `jg-*` en `tipos.js`, grupo `jaguar`). Los equipos (2–10, colores `COLORES_EQUIPOS`) son una condición de toda la presentación: los fija el PRIMER desafío Jaguar (`VigiaTipos.primerJaguar` / `equiposJaguar`, se pasa a `jaguarReiniciar(actId, n)`); al iniciar, fase `grupos` («¡Busca tu equipo!», con «Volver a sortear»); «👥 Ver equipos» (`PantallaGruposJaguar`, `jaguarVerGrupos`, orden `jaguar-grupos`). Enfrentar: `a.enfrentar` 0 = todos juntos, 2/3/4 = de k en k (`VigiaTipos.enfrentarDe`, `jaguarSiguienteDuelo(n, k)` elige a los que menos han jugado). jaguar con ojos en llamas (`jaguar-equipos-transparente.png`), voz `Jaguar-voz.mp3` con las frases sincronizadas (`FRASES_JAGUAR`, tiempos medidos en el audio), equipos al azar que se mantienen en la sesión (con puntos), duelo por un punto, «Adivina la palabra» (`PalabraJaguar`: ahorcado por turnos con 6 vidas compartidas; `a.listaPalabras` = una por renglón «palabra = pista», cada una sale una vez por sesión; órdenes del mando `ah-*`), «Responde en cuaderno o tablero» (`CuadernoJaguar`, tipo con `cuaderno`: Pregunta → Responder → ¿Ganador? con cronómetro `a.tiempoReto`; `a.pantalla` 'videobeam' = un recuadro grande por equipo que se toca para elegir ganador, 'televisor' = solo la pregunta; un solo ganador +1; órdenes `cq-*`), «Haz un origami» (`OrigamiJaguar`, tipos con `dosTarjetas`: reto con temporizador opcional `a.temporizador`/`a.tiempoReto` → ¿Ganadores? con +1 por equipo; órdenes `og-*`), «Mímica» (`MimicaJaguar`: `a.palabrasEquipo[i]` = palabras de cada equipo, columnas en el editor según los equipos del primer desafío Jaguar; la palabra se ve 5 s; ¿Correcto?; se elige quién actúa tocando su equipo, orden `mm-turno`; órdenes `mm-*`). `EquiposEnJuego`: en todos los desafíos se ven todos los equipos (los que no concursan, apagados); sin enfrentamiento siempre aparece «¿Qué equipo ganó?», equipo al azar y cierre «¡A ganar!». Escenas (Reto y Jaguar): `esEscena(a)`. |
| Modo Jaguar · juego y enlace | **Piedra, papel o tijera** (`jg-ppt`): elegir cuántos/cuáles equipos se enfrentan → `AnimacionPPT` (manos SVG propias, `MANOS_PPT`) → ¿quién ganó? → nuevo enfrentamiento. **Enlace** (`a.enlace`, editor `EnlaceEditor`): en todo desafío Jaguar, el equipo GANADOR responde una activación cognitiva (`EnlaceJaguar`, con −/+ puntos). El desafío en pantalla se publica en la sesión (`desafio`) y el mando muestra los MISMOS botones (`ppt-*`, `jg-ganador`, `jg-enfrentar`, `punto`). **Regla: todo botón nuevo de Presentar debe tener su orden en el mando.** |
| Modo Jaguar · Silueta del grupo | `jg-figura` (`SiluetaJaguar`): 4 tarjetas — grupo al azar SIN repetir (`siguienteGrupoSilueta`, cuenta en la sesión) → 3·2·1 → la silueta (`a.imagen`, visible 7 s, luego `OjosJaguar`) con temporizador `a.tiempoSilueta` (20 s, editor) → ¿Ganadores? (celebración o rojo, ±puntos, enlace). Órdenes del mando: `sil-azar`, `sil-continuar`, `sil-saltar`, `sil-resultado`, `sil-otro`. |
| `presentar-capibara.jsx` | **Modo Capibara** (público infantil, estilo cuento en acuarela inspirado en Studio Ghibli; tipos `cp-*` en `tipos.js`, grupo `capibara`, desplegable con `modo-capibara.jpg` debajo del Modo Jaguar). Usa la MISMA sesión de equipos del Jaguar (`jaguarReiniciar(id, n, { modo: 'capibara', meta })`; `primerJaguar` cuenta `jg-*` y `cp-*`): número de equipos del primer desafío con equipos, estudiantes repartidos, enlace (`EnlaceEditor` en los juegos, no en la historia). Los puntos son **pasos** hacia Jomu; la meta (`a.metaCapibara`, 3–30, por defecto 10) se elige en la historia (`VigiaTipos.metaCapibara`). Equipos con colores de acuarela y un animal cada uno (`PALETA_CAPIBARA`, `equiposCapibara`, solo para mostrar). `cp-historia` (`HistoriaCapibara`) tiene tres fases: historia (`HISTORIA_JOMU`: textos en negro palabra por palabra + `capibara-corriendo.jpg`, `capibara-preso.jpg`, misión sobre `capibara-preso1.jpg` con «¿Listos aventureros de las llanuras?») → grupos («¡Busca tu equipo!», volver a sortear) → montaña. `MontanaCapibara`: SVG con un camino por equipo hasta Jomu en la cima, `meta` pasos marcados y el emoji del equipo, que se anima desde `sesion.montanaVista` (lo último que se vio) hasta sus pasos actuales. `PantallaMontanaCapibara` («🏔 Ver la montaña», `capibaraVerMontana`) y `MarcadorCapibara` (− / + pasos) los monta `VigiaPresentar` si hay `cp-*` y no `jg-*`; al salir no hay pantalla de ganador. Mando: estado espejo `capibara` ({ fase, paso, total, final }), `modoEquipos`, `capibaraMontana`, `metaCapibara`; órdenes `cp-anterior`, `cp-siguiente`, `cp-listos`, `cp-resortear`, `cp-montana`. |
| `capibara-comun.jsx` | Piezas compartidas por los juegos del Modo Capibara (se carga antes que ellos): audio Web Audio con silencio común (`audioCapibara`), dibujo (`rrCp`, `circuloCp`, `lineaCp`), lienzo 16:9 responsivo (`useLienzoCp`), concursantes sin repetir en la presentación (`siguienteConcursanteCp`, cola en `sesion.colasConcursantes`), turnos por equipo y ronda (`siguienteTurnoCp`), y la interfaz común: `SelectorPersonajeCp`, `ChipsEquiposCp`, `TablaFinalCp`, `MontanaFinalCp`. **Un juego nuevo del Capibara debe usar estas piezas, no copiarlas.** |
| `capibara-jungla.jsx` | Modo Capibara · **Movimiento de la Jungla** (`cp-jungla`). Tres carriles en perspectiva; obstáculos (roca, espinas, tronco; 1 o 2 carriles, nunca los 3) y animales-instrucción que ocupan los tres carriles (`BANCO_JN`: ave = saltar, cerdo = agacharse, mono = aplaudir, serpiente = quieto, loro = girar, rana = manos a la cabeza, tucán = brazos arriba, perezoso = estírate, tortuga = tócate los pies, mariposa = aletea). Continuo hasta fallar; puntaje = objetos superados; la velocidad sube sola. Escalada: cada `a.rachaJungla` objetos seguidos se suma el siguiente animal (anuncio en grande y panel lateral). Modos (`a.modoJungla`): `beam` (no evalúa: el docente presiona FALLÓ — celular, Espacio o Av Pág —; «Deshacer» 5 s con Re Pág/D; turnos `a.rondasJungla`; concursante de la plataforma) e `individual` (personaje del Muro visto de espaldas, ← → carril, ↑ ↓ y una letra por animal; ventana = último 30 % del recorrido). Velocidad inicial `a.velocidadJungla` (el beam va más lento). Pasos: 1 por cada `a.objetosPorPaso` objetos (`jaguarPunto`). Mismos atajos que el Muro: P, R (reiniciar turno), N (saltar turno), M, F. Mando: estado `capibara` = `{ juego: 'jungla', … }`, órdenes `jn-*` (FALLÓ primero, botón rojo grande). |
| `capibara-dedos.jsx` | Modo Capibara · **Dedos Veloces** (`cp-dedos`). Gana quien presione más veces en `a.tiempoDedos` s (10). «3, 2, 1, ¡YA!» (antes no cuenta), congelado, ganador con animación y sonido, +1 paso (`jaguarPunto`); empate → desempate de 5 s solo entre los empatados. `a.rondasDedos` rondas; final con tabla, enlace y montaña (piezas de `capibara-comun.jsx`). Modos (`a.modoDedos`: auto/simultaneo/turnos; auto = por turnos si `pointer: coarse` o si en la prueba se toca la pantalla sin teclado): **simultáneo** (una tecla por equipo `a.teclasDedos`, por defecto Q O Z K…, nunca P R N M F L D; keydown ignorando `event.repeat`; columna que crece y contador enorme; prueba de teclas antes de la primera ronda, tocando una columna se cambia su tecla) y **por turnos** (botón gigante con clic/toque/Espacio; resultado fijo en el marcador; el celular del docente también sirve de botón: `TocarDedosCel` envía el total del turno cada 200 ms, orden `dd-toques`, aceptada hasta 0,6 s tras el final). Atajos como los demás juegos: Espacio/Enter/Av Pág principal, P pausa, R repetir ronda, N siguiente concursante, M, F. Mando: `capibara` = `{ juego: 'dedos', … }`, órdenes `dd-*`. |
| `capibara-muro.jsx` | Modo Capibara · **Muro Infernal** (`cp-muro`, lo elige `CapibaraActivacion`). Lienzo 1600×900 que se ajusta a cualquier pantalla (16:9 con franjas; sirve en 1024×768). Personaje articulado dibujado por código (`PERSONAJES_MURO`: Tito, Lupe, Zombi Zeta, Robo-7, Capi), 9 partes (`SEGMENTOS_MURO`, teclas 1–9) que giran de 45° en 45° con límites; poses fijas alcanzables (`POSES_MURO`, dificultad = partes que cambian; no se repiten en la presentación: `sesion.muroUsadas`). El muro (`construirMuroMI`, agujero = silueta con margen `MI.HUECO`) crece en perspectiva; al llegar se compara cada ángulo (`coincideMI`, `a.toleranciaMuro` 0 o 45). Modos (`a.modoMuro`): `beam` (equipos por turnos, `a.rondasMuro`, 3 vidas por equipo, `a.tiempoMuro` ajustable en el menú; `a.juezMuro` 'docente' = el estudiante imita con su cuerpo y el docente decide ✓/✗, 'auto' = el personaje en pantalla) e `individual` (mouse y teclado, 3 vidas, cada vez más rápido; récord solo en memoria: en Vigía no se guardan puntos). Cada muro superado = `jaguarPunto` (1 paso hacia Jomu); el ganador responde el enlace (`EnlaceJaguar`); al final, «Ver la montaña». Teclas: ← → / Re Pág Av Pág giran, ↑ ↓ cambian de parte, Espacio ¡Listo!, P, R, N, F, M. Sonidos con Web Audio. Mando: estado `capibara` = `{ juego: 'muro', fase, … }`; órdenes `mu-empezar`, `mu-personaje`, `mu-equipo`, `mu-tiempo`, `mu-seg`, `mu-listo`, `mu-juez`, `mu-pausa`, `mu-repetir`, `mu-saltar`, `mu-terminar`, `mu-silencio`, `mu-montana`, `mu-otra`, `mu-continuar`. |
| Imágenes de las escenas | Se usan las versiones **WebP** livianas (`condor-retador.webp`, `jaguar-equipos.webp`, `condor-vigia-icono.webp`, ~5× menos peso que los PNG, que quedan como originales). `vigia.jsx` las precarga (`precargarVigia`) y marca cada `<img>` cargada con `.vg-img-lista`: los estilos la muestran completa con fundido (nunca a pedazos). |
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
