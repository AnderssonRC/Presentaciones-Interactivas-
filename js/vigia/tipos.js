/* tipos.js — Datos del Modo Vigía: recursos y tipos de activación.

   RECURSOS: el docente elige primero qué recurso va a "activar". Cada recurso
   habilita sus tipos de activación (`tipos`). Los marcados `pronto` aún no
   tienen editor y salen como "Próximamente".

   TIPOS: lo que se puede insertar en la línea de tiempo del recurso. Cada uno:
     id, nombre, proposito (texto para el docente), color, icon (de Icon en ui.jsx)
     etiqueta    -> rótulo del texto principal en el editor
     placeholder -> ejemplo dentro del campo
     ruleta      -> true: puede usar la ruleta de estudiantes; su valor por
                    defecto es `ruletaPorDefecto`
     titular     -> lo que se anuncia en la tarjeta al presentar
     preguntaRuleta -> texto sobre la ruleta ("¿Quién responde?")
   Para agregar un tipo nuevo: añádelo aquí y su contenido en presentar.jsx
   (ContenidoActivacion) y, si tiene campos propios, en editor.jsx. */
(function () {
  const RECURSOS = [
    { id: 'video',     nombre: 'Video',     desc: 'YouTube: documentales, clases, videos', icon: 'play',     tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto'] },
    { id: 'documento', nombre: 'Documento', desc: 'PDF o EPUB: lecturas, libros, guías',   icon: 'memorama', tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'glosario'] },
    { id: 'podcast',   nombre: 'Podcast',   desc: 'Audios y entrevistas',                   icon: 'debate',   tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto'], pronto: true },
    { id: 'imagenes',  nombre: 'Imágenes',  desc: 'Mapas, infografías y fotos',            icon: 'eye',      tipos: ['pregunta', 'instruccion', 'creacion', 'escritura'], pronto: true },
  ];

  const TIPOS = [
    {
      id: 'pregunta', nombre: 'Pregunta', color: '#FF8A00', icon: 'pregunta',
      proposito: 'La ruleta elige al estudiante que responde. Abierta o de opción múltiple.',
      etiqueta: 'Pregunta', placeholder: '¿Qué crees que pasará después?',
      ruleta: true, ruletaPorDefecto: true,
      titular: '¡Pregunta!', preguntaRuleta: '¿Quién responde?',
    },
    {
      id: 'instruccion', nombre: 'Instrucción', color: '#4D94FF', icon: 'rayo',
      proposito: 'Lo que el grupo debe hacer ahora mismo.',
      etiqueta: 'Instrucción', placeholder: 'Anota en tu cuaderno tres ideas clave de lo que acabas de ver.',
      ruleta: false,
      titular: 'Instrucción',
    },
    {
      id: 'creacion', nombre: 'Creación', color: '#FFC233', icon: 'bulb',
      proposito: 'Algo que se crea después de ver: dibujo, esquema, frase…',
      etiqueta: '¿Qué se debe crear?', placeholder: 'Dibuja un esquema del proceso que explicó el video.',
      ruleta: true, ruletaPorDefecto: false,
      titular: '¡A crear!', preguntaRuleta: '¿Quién crea?',
    },
    {
      id: 'escritura', nombre: 'Escritura', color: '#B28CFF', icon: 'letras',
      proposito: 'El estudiante copia lo que aparece en pantalla, grande y legible.',
      etiqueta: 'Texto para copiar', placeholder: 'La fotosíntesis transforma la luz del sol en energía química.',
      ruleta: false,
      titular: 'Escribe en tu cuaderno',
    },
    {
      id: 'contexto', nombre: 'Nota de contexto', color: '#3DDC97', icon: 'eye',
      proposito: 'Un párrafo que un estudiante lee en voz alta con el video detenido.',
      etiqueta: 'Párrafo de contexto', placeholder: 'Para entender esta parte, recordemos que en el siglo XIX…',
      ruleta: true, ruletaPorDefecto: true,
      titular: 'Nota de contexto', preguntaRuleta: '¿Quién lee?',
    },
    {
      id: 'glosario', nombre: 'Glosario', color: '#FF5FA2', icon: 'debate',
      proposito: 'Se señala una palabra y entre todos construyen su definición (el docente la escribe en vivo).',
      etiqueta: 'Pista o pregunta guía (opcional)', placeholder: '¿Qué crees que significa esta palabra en el texto?',
      ruleta: true, ruletaPorDefecto: false,
      titular: 'Glosario', preguntaRuleta: '¿Quién propone?',
    },
  ];

  /* Frases que irrumpen en pantalla (al azar) justo antes de cada activación.
     Para agregar más, basta con sumarlas aquí. */
  const FRASES_ALTO = [
    '¡Alto!',
    '¡Despierta!',
    '¡Activa ese cerebro!',
    'Anímate a…',
    'Ey, ¿sigues atento?',
    'Sí, ustedes, ¿listos?',
    '¡Pausa mental!',
    '¿Me sigues?',
    '¡Ojo aquí!',
    '¡Momento clave!',
    '¡Mente encendida!',
    '¡A pensar!',
    '¿Quién se atreve?',
    '¡Que no se te escape!',
    '¡Atención, vigías!',
    '¡Abre bien los ojos!',
    '¡Rikchariy!',
    '¡Llegó tu turno!',
    '¿Estás conectado?',
    '¡Prepárate!',
    '¡El cóndor te observa!',
    '¡No te duermas!',
    '¡Despierta esa curiosidad!',
    '¡Hora de activarse!',
    '¡Enciende la chispa!',
    '¿Listos para el reto?',
  ];
  // Una frase al azar, distinta de la anterior (para que no se repita seguida).
  function fraseAlAzar(anterior) {
    const opciones = FRASES_ALTO.filter((f) => f !== anterior);
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  const recurso = (id) => RECURSOS.find((r) => r.id === id) || RECURSOS[0];
  const tipo = (id) => TIPOS.find((t) => t.id === id) || TIPOS[0];

  // Activación nueva de un tipo. `donde`: en video, el segundo (número); en
  // documento, { pagina, x, y, w, h, fragmento } (rectángulo en fracciones 0–1
  // de la página y el texto que quedó debajo).
  function nuevaActivacion(tipoId, donde) {
    const ti = tipo(tipoId);
    const a = { id: AIP.uid(), tipo: ti.id, texto: '' };
    if (donde && typeof donde === 'object') Object.assign(a, donde);
    else a.t = Math.max(0, Math.round(donde || 0));
    if (ti.ruleta) a.ruleta = !!ti.ruletaPorDefecto;
    if (ti.id === 'pregunta') { a.modo = 'abierta'; a.opciones = ['', '']; a.correcta = 0; }
    if (ti.id === 'glosario') { a.termino = (a.fragmento || '').trim(); a.definicion = ''; }
    if (ti.id === 'escritura' && a.fragmento) a.texto = a.fragmento;
    return a;
  }

  // Documento: orden de lectura. El número de cada activador es su posición
  // en este orden. PDF: página, de arriba abajo, de izquierda a derecha.
  // EPUB: capítulo (`cap`) y posición en su texto (`ini`).
  const bloqueDe = (a) => (typeof a.cap === 'number' ? a.cap : (a.pagina || 1) - 1);
  const posicionDe = (a) => (typeof a.ini === 'number' ? a.ini : (a.y || 0));
  function ordenLectura(lista) {
    return (lista || []).slice().sort((p, q) =>
      bloqueDe(p) - bloqueDe(q) || posicionDe(p) - posicionDe(q) || (p.x || 0) - (q.x || 0));
  }

  // 83 -> "1:23"; 3725 -> "1:02:05"
  function fmtT(s) {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    const mm = h ? String(m).padStart(2, '0') : String(m);
    return (h ? h + ':' : '') + mm + ':' + String(x).padStart(2, '0');
  }
  // "1:23" -> 83 ; "75" -> 75 ; inválido -> null
  function parseT(txt) {
    const p = String(txt || '').trim().split(':').map((x) => x.trim());
    if (!p.length || p.some((x) => x === '' || isNaN(Number(x)))) return null;
    return p.reduce((acc, x) => acc * 60 + Number(x), 0);
  }

  // ¿El documento ya tiene su recurso listo para presentar?
  function recursoListo(d) {
    if (!d) return false;
    if (d.recurso === 'documento') return !!(d.pdf && (d.pdf.driveId || d.pdf.url || d.pdf.local));
    return !!(d.video && d.video.id);
  }

  window.VigiaTipos = { RECURSOS, TIPOS, FRASES_ALTO, fraseAlAzar, recurso, tipo, nuevaActivacion, ordenLectura, recursoListo, fmtT, parseT };
})();
