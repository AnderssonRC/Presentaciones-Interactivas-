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
    { id: 'documento', nombre: 'Documento', desc: 'Lecturas, artículos y PDF',             icon: 'memorama', tipos: ['pregunta', 'instruccion', 'creacion', 'contexto'], pronto: true },
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
  ];

  const recurso = (id) => RECURSOS.find((r) => r.id === id) || RECURSOS[0];
  const tipo = (id) => TIPOS.find((t) => t.id === id) || TIPOS[0];

  // Activación nueva de un tipo, en el segundo `t` del recurso.
  function nuevaActivacion(tipoId, t) {
    const ti = tipo(tipoId);
    const a = { id: AIP.uid(), tipo: ti.id, t: Math.max(0, Math.round(t || 0)), texto: '' };
    if (ti.ruleta) a.ruleta = !!ti.ruletaPorDefecto;
    if (ti.id === 'pregunta') { a.modo = 'abierta'; a.opciones = ['', '']; a.correcta = 0; }
    return a;
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

  window.VigiaTipos = { RECURSOS, TIPOS, recurso, tipo, nuevaActivacion, fmtT, parseT };
})();
