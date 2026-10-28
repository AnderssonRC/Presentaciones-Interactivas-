# Presentaciones Interactivas — notas para Claude

El usuario es docente y escribe en español: responder en español, simple y sin tecnicismos.

## Stack
- React 18 UMD + Babel standalone en el navegador: sin build, sin node, sin git en la terminal.
- Firebase compat (Auth + Firestore: `users/{uid}/presentations`).
- Windows + PowerShell 5.1. Los archivos usan CRLF.

## Modo Vigía (`js/vigia/`) — mapa completo en `js/vigia/LEEME.md`
- `tipos.js`: tipos de activación (cognitivos, físico-grupales, Modo Jaguar `jg-*`).
- `editor.jsx`: editor y `ConfigActivacion`. Variantes: `editor-pdf/epub/podcast/imagenes.jsx`.
- `presentar.jsx`: presentar base (tarjetas, tonos, `ImagenActivacion`). Variantes: `presentar-pdf/epub/podcast/imagenes.jsx`.
- `presentar-reto.jsx`: Reto de activación (cóndor).
- `presentar-jaguar.jsx`: Modo Jaguar (sesión, escena, PPT, Silueta, Adivina la palabra, Origami, Mímica).
- `presentar-capibara.jsx`: Modo Capibara (infantil, acuarela; misma sesión de equipos del Jaguar, puntos = pasos en la montaña hacia Jomu).
  Juegos del Capibara en archivos propios: `capibara-muro.jsx` (Muro Infernal), `capibara-jungla.jsx`
  (Movimiento de la Jungla), `capibara-dedos.jsx` (Dedos Veloces). Lo compartido (audio, lienzo, concursantes, turnos, menú, tabla, montaña)
  está en `capibara-comun.jsx`: los juegos nuevos lo reutilizan.
- `mando.jsx` (lado televisor) · `mando-celular.jsx` (lado celular, con su propio CSS).
- `herramientas.jsx`: pincel (lupa, marcador, puntero, texto, QR, sortear).
- `estilos.css`: todos los estilos de Vigía.

## REGLAS (siempre)
1. **Todo botón de Presentar debe estar también en el mando del celular**, incluidos los que
   activan algún mecanismo (sortear, empezar/pausar, ver, siguiente, ganador, cambiar de equipo…).
   Pantalla: publicar el estado en `cambiarJaguar({ desafio })` o en el estado espejo del mando y
   escuchar la orden con `useOrdenMando`. Celular: el botón equivalente en `mando-celular.jsx`.
2. Todo presentador de Vigía debe tener el selector **«Exceso de luz»**, y cada estilo nuevo
   debe revisarse con `[data-vg-tono="luz"]` (texto legible sobre fondo claro).
3. En Vigía solo se guardan los **nombres** de los estudiantes; nada más (ni puntos ni respuestas).
4. Los diálogos usan `vigiaConfirmar` / `vigiaPreguntar` / `vigiaAviso` (en la plataforma: `aip*`),
   nunca `alert` / `confirm` / `prompt`.
5. Modo Jaguar: cada juego nuevo usa la sesión (`sesionJaguar`), suma puntos con `jaguarPunto`,
   no repite contenido ya usado en la presentación (palabras, imágenes, grupos) y, si hay
   activación enlazada, el ganador la responde (`EnlaceJaguar`).

## Al terminar un cambio
1. Subir la versión del archivo tocado en `VIGIA_MODULOS` / `VIGIA_ESTILOS` / `VIGIA_MANDO_VERSION`
   (`js/vigia.jsx`) y `js/vigia.jsx?v=` en `index.html`.
2. Comprobar que compila: Chrome headless + Babel sobre todos los módulos (ver la memoria
   «verificar-compilacion-jsx»). Un error de sintaxis apaga todo el Modo Vigía.
3. Cada módulo de Vigía se ejecuta aislado (`new Function`): lo que otro archivo necesite se
   exporta con `Object.assign(window, { ... })`.
4. Actualizar la fila del módulo en `js/vigia/LEEME.md` si cambia lo que hace.

## Forma de trabajo (ahorro de tokens)
- Buscar con Grep y leer solo el tramo necesario; no releer lo que ya está en la conversación.
- Agrupar las correcciones visuales antes de volver a tomar capturas.
- Cuando el usuario diga «esto es una regla», agregarla en la sección REGLAS de este archivo.
