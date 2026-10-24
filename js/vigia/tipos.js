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
    { id: 'video',     nombre: 'Video',     desc: 'YouTube: documentales, clases, videos', icon: 'play',     tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto', 'glosario', 'reto'] },
    { id: 'documento', nombre: 'Documento', desc: 'PDF o EPUB: lecturas, libros, guías',   icon: 'memorama', tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'glosario', 'reto'] },
    { id: 'podcast',   nombre: 'Podcast',   desc: 'Audios y entrevistas, con su imagen',    icon: 'debate',   tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto', 'glosario', 'reto'] },
    // Imágenes: activadores como íconos SOBRE la imagen (editor-imagenes.jsx).
    { id: 'imagenes',  nombre: 'Imágenes',  desc: 'Mapas, infografías y fotos con activadores encima', icon: 'eye', tipos: ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto', 'glosario', 'reto'] },
  ];

  const TIPOS = [
    {
      id: 'pregunta', grupo: 'cognitivo', nombre: 'Pregunta', color: '#FF8A00', icon: 'pregunta',
      proposito: 'La ruleta elige al estudiante que responde. Abierta o de opción múltiple.',
      etiqueta: 'Pregunta', placeholder: '¿Qué crees que pasará después?',
      ruleta: true, ruletaPorDefecto: true,
      titular: '¡Pregunta!', preguntaRuleta: '¿Quién responde?',
    },
    {
      id: 'instruccion', grupo: 'cognitivo', nombre: 'Instrucción', color: '#4D94FF', icon: 'rayo',
      proposito: 'Lo que el grupo debe hacer ahora mismo.',
      etiqueta: 'Instrucción', placeholder: 'Anota en tu cuaderno tres ideas clave de lo que acabas de ver.',
      ruleta: false,
      titular: 'Instrucción',
    },
    {
      id: 'creacion', grupo: 'cognitivo', nombre: 'Creación', color: '#FFC233', icon: 'bulb',
      proposito: 'Algo que se crea después de ver: dibujo, esquema, frase…',
      etiqueta: '¿Qué se debe crear?', placeholder: 'Dibuja un esquema del proceso que explicó el video.',
      ruleta: true, ruletaPorDefecto: false,
      titular: '¡A crear!', preguntaRuleta: '¿Quién crea?',
    },
    {
      id: 'escritura', grupo: 'cognitivo', nombre: 'Escritura', color: '#B28CFF', icon: 'letras',
      proposito: 'El estudiante copia lo que aparece en pantalla, grande y legible.',
      etiqueta: 'Texto para copiar', placeholder: 'La fotosíntesis transforma la luz del sol en energía química.',
      ruleta: false,
      titular: 'Escribe en tu cuaderno',
    },
    {
      id: 'contexto', grupo: 'cognitivo', nombre: 'Nota de contexto', color: '#3DDC97', icon: 'eye',
      proposito: 'Un párrafo que un estudiante lee en voz alta con el video detenido.',
      etiqueta: 'Párrafo de contexto', placeholder: 'Para entender esta parte, recordemos que en el siglo XIX…',
      ruleta: true, ruletaPorDefecto: true,
      titular: 'Nota de contexto', preguntaRuleta: '¿Quién lee?',
    },
    {
      id: 'glosario', grupo: 'cognitivo', nombre: 'Glosario', color: '#FF5FA2', icon: 'debate',
      proposito: 'Se señala una palabra y entre todos construyen su definición (el docente la escribe en vivo).',
      etiqueta: 'Pista o pregunta guía (opcional)', placeholder: '¿Qué crees que significa esta palabra en el texto?',
      ruleta: true, ruletaPorDefecto: false,
      titular: 'Glosario', preguntaRuleta: '¿Quién propone?',
    },
    // ---- Físico-grupales: el cóndor retador irrumpe y lanza un reto (presentar-reto.jsx) ----
    {
      id: 'reto', grupo: 'fisico', nombre: 'Reto de activación', color: '#00D4FF', icon: 'user',
      proposito: 'El cóndor retador irrumpe con rayos y lanza un reto para moverse: puestos, parejas, grupos…',
      etiqueta: 'Indicaciones extra (opcional)', placeholder: 'Tienen 2 minutos. ¡En silencio!',
      ruleta: false, escena: true,
      titular: '¡Reto de activación!',
    },
  ];

  /* ---- MODO JAGUAR (equipos): irrumpe el jaguar, suena su voz y se forman
     los equipos (presentar-jaguar.jsx). Colores: verde neón, azul y amarillo.
     palabra: usa ahorcado · pideImagen: abre el campo de imagen · duelo: por
     defecto se enfrentan dos equipos por un punto · propia: actividad del docente. */
  const COLORES_JAGUAR = ['#39FF14', '#2F80FF', '#FFE600'];
  const DESAFIOS_JAGUAR = [
    { id: 'jg-ppt', nombre: 'Piedra, papel o tijera', icon: 'dado', duelo: true,
      proposito: 'Un representante por equipo: ¡a la cuenta de tres!', etiqueta: 'Indicaciones (opcional)', placeholder: 'Al mejor de tres.' },
    { id: 'jg-figura', nombre: 'El grupo imita la figura', icon: 'eye', pideImagen: true,
      proposito: 'Aparece una imagen y el equipo la imita con el cuerpo.', etiqueta: 'Indicaciones (opcional)', placeholder: 'Tienen 30 segundos para formar la figura.' },
    { id: 'jg-ejercicio', nombre: 'Ejercicio físico', icon: 'rayo',
      proposito: 'Todo el equipo hace el ejercicio que aparece.', etiqueta: 'Ejercicio', placeholder: '10 sentadillas sin parar.' },
    { id: 'jg-adivina', nombre: 'Adivina la palabra (ahorcado)', icon: 'ahorcado', palabra: true, duelo: true,
      proposito: 'Ahorcado: los equipos proponen letras hasta descubrirla.', etiqueta: 'Pista (opcional)', placeholder: 'Es un concepto de la clase de hoy.' },
    { id: 'jg-origami', nombre: 'Haz un origami', icon: 'memorama',
      proposito: 'Cada equipo dobla la figura con una hoja.', etiqueta: '¿Qué figura?', placeholder: 'Una grulla de papel.' },
    { id: 'jg-reta', nombre: 'Reta al otro equipo', icon: 'trofeo', duelo: true,
      proposito: 'Un equipo le lanza un reto al otro.', etiqueta: 'Reglas del reto (opcional)', placeholder: 'El reto debe tener que ver con el tema.' },
    { id: 'jg-cuaderno', nombre: 'Responde en cuaderno o tablero', icon: 'letras',
      proposito: 'El equipo escribe la respuesta en el cuaderno o en el tablero.', etiqueta: 'Pregunta', placeholder: '¿Qué idea principal dejó el video?' },
    { id: 'jg-baile', nombre: 'Crea un paso de baile', icon: 'sol',
      proposito: 'Cada equipo inventa un paso y lo presenta.', etiqueta: 'Indicaciones (opcional)', placeholder: 'Que represente lo que acabamos de ver.' },
    { id: 'jg-personifica', nombre: 'Personifiquen lo último visto', icon: 'user',
      proposito: 'El equipo actúa la escena o el concepto que se acaba de ver.', etiqueta: 'Escena o concepto (opcional)', placeholder: 'La reunión de los Estados Generales.' },
    { id: 'jg-azar', nombre: 'Responde la pregunta (equipo al azar)', icon: 'ruleta',
      proposito: 'El azar elige al equipo que debe responder.', etiqueta: 'Pregunta', placeholder: '¿Por qué crees que pasó eso?' },
    { id: 'jg-concepto', nombre: 'Ahorcado con el último concepto', icon: 'ahorcado', palabra: true, duelo: true,
      proposito: 'Ahorcado con el último concepto que se dijo en clase.', etiqueta: 'Pista (opcional)', placeholder: 'Lo dijimos hace un momento.' },
    { id: 'jg-propia', nombre: 'Crear actividad propia', icon: 'bulb', propia: true,
      proposito: 'Inventa tu propio desafío para los equipos.', etiqueta: 'Instrucciones', placeholder: 'Describe lo que deben hacer los equipos.' },
  ];
  // Todos con el PUÑO en verde neón: así se distinguen del resto de activadores.
  DESAFIOS_JAGUAR.forEach((d) => TIPOS.push(Object.assign({
    grupo: 'jaguar', ruleta: false, escena: true, jaguar: true, titular: d.nombre,
  }, d, { icon: 'puno', color: COLORES_JAGUAR[0], iconoDesafio: d.icon })));
  const IDS_JAGUAR = DESAFIOS_JAGUAR.map((d) => d.id);
  // El Modo Jaguar está en todos los recursos.
  RECURSOS.forEach((r) => { r.tipos = r.tipos.concat(IDS_JAGUAR); });

  /* Grupos de tipos (así se reúnen en la columna de tipos del editor). */
  const GRUPOS = {
    cognitivo: { nombre: 'Cognitivos', desc: 'Pensar, responder, escribir' },
    fisico: { nombre: 'Físico-grupales', desc: 'Moverse, cambiar, crear en grupo' },
    jaguar: { nombre: 'Modo Jaguar', titulo: 'Modo Jaguar', desc: 'Equipos para toda la presentación · termina con el ganador' },
  };
  // Escenas a pantalla completa con su propio cierre (Reto, Modo Jaguar).
  const esEscena = (a) => !!(a && TIPOS.some((t) => t.id === a.tipo && t.escena));
  // Si `t` es el primero de su grupo en `lista`, el grupo (para poner su título antes).
  function inicioGrupo(t, lista) {
    const primero = (lista || TIPOS).find((x) => x.grupo === t.grupo);
    return primero && primero.id === t.id ? GRUPOS[t.grupo] : null;
  }

  /* Retos preconfigurados del tipo "Reto de activación".
     usa: 'parejas' | 'grupos' | 'orden' -> con la lista de estudiantes se
     sortean parejas, grupos o un orden para el salón. */
  const RETOS = [
    { id: 'puesto',   nombre: 'Cambio de puesto',   titulo: '¡Cambio de puesto!',
      desc: 'Cambia de puesto con el compañero que te tocó.', usa: 'parejas' },
    { id: 'cuaderno', nombre: 'Cambia tu cuaderno', titulo: '¡Cambia tu cuaderno!',
      desc: 'Intercambia tu cuaderno con el compañero que te tocó y revisa sus apuntes.', usa: 'parejas' },
    { id: 'pregunta', nombre: 'Pregunta al compañero', titulo: '¡Crea una pregunta!',
      desc: 'Crea una pregunta sobre lo visto para el compañero con el que te tocó. Luego respóndanse.', usa: 'parejas' },
    { id: 'grupos',   nombre: 'Conforma el grupo',  titulo: '¡Conformen los grupos!',
      desc: 'Formen el grupo según aparece en pantalla.', usa: 'grupos' },
    { id: 'orden',    nombre: 'Organicen el salón', titulo: '¡Organicen el salón!',
      desc: 'Organicen el salón según el siguiente orden.', usa: 'orden' },
    { id: 'eslogan',  nombre: 'Eslogan en grupo',   titulo: '¡Creen un eslogan!',
      desc: 'En grupos, creen un eslogan con la última frase y péguenlo en el tablero.', usa: 'grupos' },
  ];
  const reto = (id) => RETOS.find((r) => r.id === id) || RETOS[0];

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
    if (ti.id === 'reto') { a.reto = RETOS[0].id; a.tamGrupo = 4; }
    if (ti.jaguar) { a.equipos = 2; a.duelo = !!ti.duelo; if (ti.palabra) a.palabra = (a.fragmento || '').trim().split(/\s+/)[0] || ''; }
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
    if (d.recurso === 'podcast') return !!(d.podcast && (d.podcast.id || d.podcast.src));
    if (d.recurso === 'imagenes') return !!(d.galeria && (d.galeria.diapos || []).some((x) => x.url));
    return !!(d.video && d.video.id);
  }

  window.esEscena = esEscena;
  window.VigiaTipos = { RECURSOS, TIPOS, GRUPOS, inicioGrupo, RETOS, reto, esEscena, IDS_JAGUAR, FRASES_ALTO, fraseAlAzar, recurso, tipo, nuevaActivacion, ordenLectura, recursoListo, fmtT, parseT };
})();
