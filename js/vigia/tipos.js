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
    // Silueta del grupo: instrucción + grupo al azar (sin repetir) → 3, 2, 1 →
    // la silueta (7 s) y luego unos ojos, con temporizador → ¿lo lograron?
    { id: 'jg-figura', nombre: 'Silueta del grupo', icon: 'eye', pideImagen: true, silueta: true,
      proposito: 'Un grupo al azar memoriza una silueta y la forma con el cuerpo antes de que acabe el tiempo.', etiqueta: 'Instrucción', placeholder: 'Formen con su cuerpo la silueta que verán. ¡Solo la verán 7 segundos!' },
    { id: 'jg-ejercicio', nombre: 'Ejercicio físico', icon: 'rayo',
      proposito: 'Todo el equipo hace el ejercicio que aparece.', etiqueta: 'Ejercicio', placeholder: '10 sentadillas sin parar.' },
    { id: 'jg-adivina', nombre: 'Adivina la palabra (ahorcado)', icon: 'ahorcado', palabra: true, duelo: true,
      proposito: 'Ahorcado por turnos: cada equipo dice una letra; si falla, pierde una vida y pasa el turno. Gana quien la descubre.', etiqueta: 'Indicación (opcional)', placeholder: 'Es un concepto de la clase de hoy.' },
    // Dos tarjetas: el reto (temporizador opcional) → ¿Ganadores? (+1 punto).
    { id: 'jg-origami', nombre: 'Haz un origami', icon: 'memorama', dosTarjetas: true,
      proposito: 'Cada equipo dobla la figura con una hoja; los que lo logran suman un punto.', etiqueta: '¿Qué figura?', placeholder: 'Una grulla de papel.' },
    // Mímica: palabras por equipo (columnas en el editor) → la palabra se ve 5 s → ¿Correcto?
    { id: 'jg-mimica', nombre: 'Mímica', icon: 'user', mimica: true,
      proposito: 'Un estudiante actúa la palabra (aparece solo 5 segundos) y su equipo la adivina.', etiqueta: 'Indicaciones (opcional)', placeholder: 'Sin hablar ni señalar objetos del salón.' },
    { id: 'jg-reta', nombre: 'Reta al otro equipo', icon: 'trofeo', duelo: true,
      proposito: 'Un equipo le lanza un reto al otro.', etiqueta: 'Reglas del reto (opcional)', placeholder: 'El reto debe tener que ver con el tema.' },
    // Tres tarjetas: Pregunta → Responder → ¿Ganador?, con cronómetro. En el editor
    // se elige la pantalla: videobeam (un recuadro grande por equipo para escribir
    // en el tablero) o televisor (solo la pregunta; responden en el cuaderno).
    { id: 'jg-cuaderno', nombre: 'Responde en cuaderno o tablero', icon: 'letras', cuaderno: true,
      proposito: 'El equipo escribe la respuesta en el cuaderno o en el tablero.', etiqueta: 'Pregunta', placeholder: '¿Qué idea principal dejó el video?' },
    { id: 'jg-baile', nombre: 'Crea un paso de baile', icon: 'sol',
      proposito: 'Cada equipo inventa un paso y lo presenta.', etiqueta: 'Indicaciones (opcional)', placeholder: 'Que represente lo que acabamos de ver.' },
    // pideVideo: el campo del video de YouTube (la escena a imitar) viene abierto.
    { id: 'jg-personifica', nombre: 'Personifiquen lo último visto', icon: 'user', pideVideo: true,
      proposito: 'El equipo actúa (imita) la escena o el concepto que se acaba de ver; puede llevar el video de YouTube de la escena.', etiqueta: 'Escena o concepto (opcional)', placeholder: 'La reunión de los Estados Generales.' },
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

  /* ---- MODO CAPIBARA (público infantil, estilo acuarela tipo Studio Ghibli):
     las mismas reglas del Modo Jaguar (equipos), pero en vez de ganar, los
     equipos ayudan a rescatar a Jomu, el capibara (presentar-capibara.jsx).
     historia: la escena de inicio (texto + imágenes) que abre la aventura. */
  const COLOR_CAPIBARA = '#7DB46C';
  const DESAFIOS_CAPIBARA = [
    { id: 'cp-historia', nombre: 'Historia: ¡Rescata a Jomu!', icon: 'sol', historia: true,
      proposito: 'Abre la aventura: Jomu es atrapado por dos cazadores. Luego se forman los equipos y cada uno recibe su camino en la montaña.' },
    // Muro Infernal (capibara-muro.jsx): un muro con un agujero en forma de pose avanza; hay que imitarla.
    { id: 'cp-muro', nombre: 'Muro Infernal', icon: 'user', muro: true,
      proposito: 'Avanza un muro con un agujero en forma de pose: hay que quedar en esa pose antes de que llegue… ¡o al agua!',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Pasa un estudiante por equipo. ¡Sin empujar!' },
    // Movimiento de la Jungla (capibara-jungla.jsx): tres carriles, obstáculos y animales-instrucción.
    { id: 'cp-jungla', nombre: 'Movimiento de la Jungla', icon: 'rayo', jungla: true,
      proposito: 'Por tres carriles llegan obstáculos y animales: hay que esquivar moviéndose y hacer la acción de cada animal (saltar, agacharse, aplaudir…).',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Deja espacio libre frente al tablero para moverse.' },
    // Dedos Veloces (capibara-dedos.jsx): gana quien presione más veces en el tiempo límite.
    { id: 'cp-dedos', nombre: 'Dedos Veloces', icon: 'trofeo', dedos: true,
      proposito: 'Un concursante por equipo presiona su tecla (o el botón gigante) lo más rápido que pueda. ¡Gana quien haga más toques!',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Un dedo por persona. ¡Sin golpear el teclado!' },
    // Espejo en Vivo (capibara-espejo.jsx): seguir como un espejo a una silueta que se mueve sin parar.
    { id: 'cp-espejo', nombre: 'Espejo en Vivo', icon: 'user', espejo: true,
      proposito: 'Una silueta se mueve lenta y sin parar: un concursante por equipo la sigue como un espejo. Tú marcas «Se desconectó» cuando pierde el ritmo. ¡Gana quien aguante más!',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Deja espacio libre frente al tablero. Movimientos suaves.' },
    // Semáforo (capibara-semaforo.jsx): cada color es una acción; gana el último equipo con jugadores en pie.
    { id: 'cp-semaforo', nombre: 'Semáforo', icon: 'rayo', semaforo: true,
      proposito: 'La pantalla se llena de un color y cada color es una acción (verde = moverse, rojo = congelarse…). Quien se equivoque, se sienta. ¡Gana el último equipo en pie!',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Todos de pie junto a su puesto. ¡Movimientos en el sitio!' },
    // Verdadero o Falso en Movimiento (capibara-vf.jsx): correr al lado del salón que corresponde.
    { id: 'cp-vf', nombre: 'Verdadero o Falso en Movimiento', icon: 'check', vfMovimiento: true,
      proposito: 'Aparece una afirmación: todos corren a la izquierda (verdadero) o a la derecha (falso) antes de que acabe el tiempo. Quien quede en el lado incorrecto, se sienta.',
      etiqueta: 'Indicaciones (opcional)', placeholder: 'Despejen el centro del salón. ¡Sin empujar!' },
  ];
  DESAFIOS_CAPIBARA.forEach((d) => TIPOS.push(Object.assign({
    grupo: 'capibara', ruleta: false, escena: true, capibara: true, titular: d.nombre,
    etiqueta: 'Indicaciones (opcional)', placeholder: '',
  }, d, { color: COLOR_CAPIBARA })));
  const IDS_CAPIBARA = DESAFIOS_CAPIBARA.map((d) => d.id);
  RECURSOS.forEach((r) => { r.tipos = r.tipos.concat(IDS_CAPIBARA); });

  /* Grupos de tipos (así se reúnen en la columna de tipos del editor).
     imagen: se muestra en la cabecera del desplegable en lugar de los íconos. */
  const GRUPOS = {
    cognitivo: { nombre: 'Cognitivos', desc: 'Pensar, responder, escribir' },
    fisico: { nombre: 'Físico-grupales', desc: 'Moverse, cambiar, crear en grupo' },
    jaguar: { nombre: 'Modo Jaguar', titulo: 'Modo Jaguar', desc: 'Equipos para toda la presentación · termina con el ganador' },
    capibara: { nombre: 'Modo Capibara', titulo: 'Modo Capibara', desc: 'Para niños · los equipos ayudan a rescatar a Jomu', imagen: 'modo-capibara.jpg' },
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
    if (ti.silueta) a.tiempoSilueta = 20;
    if (ti.dosTarjetas) { a.temporizador = false; a.tiempoReto = 120; }
    if (ti.cuaderno) { a.pantalla = 'videobeam'; a.tiempoReto = 180; }
    if (ti.mimica) a.palabrasEquipo = [];   // una lista de palabras (texto, una por renglón) por equipo
    if (ti.capibara) { a.equipos = 3; if (ti.historia) a.metaCapibara = META_CAPIBARA; }
    // Muro Infernal: modo (beam = equipos al frente / individual = teclado y mouse), quién decide, tiempo, rondas y tolerancia.
    if (ti.muro) { a.modoMuro = 'beam'; a.juezMuro = 'docente'; a.tiempoMuro = 15; a.rondasMuro = 3; a.toleranciaMuro = 0; }
    // Movimiento de la Jungla: modo, velocidad inicial, objetos seguidos para cada instrucción nueva, rondas y objetos por paso.
    // Dedos Veloces: modo (auto = según el dispositivo), segundos, rondas y la tecla de cada equipo.
    if (ti.dedos) { a.modoDedos = 'auto'; a.tiempoDedos = 10; a.rondasDedos = 3; a.teclasDedos = ['Q', 'O', 'Z', 'K', 'T', 'B', 'Y', 'H', 'X', 'U']; }
    // Espejo en Vivo: velocidad inicial, rondas y segundos aguantados por cada paso hacia Jomu.
    if (ti.espejo) { a.velocidadEspejo = 'lenta'; a.rondasEspejo = 1; a.segPorPasoEspejo = 15; }
    // Semáforo: velocidad inicial, cambios para cada color nuevo, trampas, jugadores por equipo (0 = los del equipo) y pasos del ganador.
    // Verdadero o Falso en Movimiento: segundos para correr, jugadores por equipo (0 = los del equipo), pasos del ganador y
    // las afirmaciones (formato de la actividad «Verdadero o falso»: «Afirmación | V | explicación»).
    if (ti.vfMovimiento) { a.tiempoVF = 8; a.jugadoresVF = 0; a.pasosVF = 3; a.afirmaciones = []; }
    if (ti.semaforo) { a.velocidadSemaforo = 'lenta'; a.cambiosSemaforo = 6; a.trampasSemaforo = true; a.jugadoresSemaforo = 0; a.pasosSemaforo = 3; }
    if (ti.jungla) { a.modoJungla = 'beam'; a.velocidadJungla = 'lenta'; a.rachaJungla = 8; a.rondasJungla = 2; a.objetosPorPaso = 10; }
    if (ti.jaguar) { a.equipos = 3; a.enfrentar = ti.duelo ? 2 : 0; a.duelo = !!ti.duelo; if (ti.palabra) a.listaPalabras = (a.fragmento || '').trim().split(/\s+/)[0] || ''; }
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

  /* Modo Jaguar: los equipos son una CONDICIÓN de toda la presentación. Se
     eligen en el PRIMER desafío Jaguar (en el orden de la presentación) y los
     demás desafíos los heredan. */
  const MAX_EQUIPOS_JAGUAR = 10;
  // El primero (en el orden de la presentación) de los que cumplen `re`.
  function primeroDe(lista, re) {
    const jg = (lista || []).filter((x) => re.test(x.tipo || ''));
    if (!jg.length) return null;
    const conT = jg.every((x) => typeof x.t === 'number');
    return (conT ? jg.slice().sort((x, y) => x.t - y.t) : ordenLectura(jg))[0];
  }
  // Modo Jaguar y Modo Capibara comparten los equipos (y su número).
  const primerJaguar = (lista) => primeroDe(lista, /^(jg|cp)-/);
  /* Modo Capibara: pasos que cada equipo debe avanzar en la montaña para
     llegar hasta Jomu (se eligen en la historia, la primera del modo). */
  const META_CAPIBARA = 10;
  function metaCapibara(lista) {
    const h = primeroDe((lista || []).filter((x) => typeof x.metaCapibara === 'number'), /^cp-/);
    return Math.max(3, Math.min(30, (h && h.metaCapibara) || META_CAPIBARA));
  }
  function equiposJaguar(lista, a) {
    const p = primerJaguar(lista) || a;
    return Math.max(2, Math.min(MAX_EQUIPOS_JAGUAR, (p && p.equipos) || 2));
  }
  // Cuántos equipos se enfrentan a la vez: 0 = todos juntos; 2, 3 o 4 (de 2 en 2…).
  function enfrentarDe(a) {
    if (!a) return 0;
    if (typeof a.enfrentar === 'number') return a.enfrentar;
    return a.duelo ? 2 : 0;   // activaciones anteriores: solo tenían «duelo»
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
  window.VigiaTipos = { RECURSOS, TIPOS, GRUPOS, inicioGrupo, RETOS, reto, esEscena, IDS_JAGUAR, IDS_CAPIBARA, FRASES_ALTO, fraseAlAzar, recurso, tipo, nuevaActivacion, ordenLectura, recursoListo, fmtT, parseT,
    MAX_EQUIPOS_JAGUAR, primerJaguar, equiposJaguar, enfrentarDe, META_CAPIBARA, metaCapibara };
})();
