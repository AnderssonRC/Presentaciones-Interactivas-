/* db.js — Datos y almacenamiento sobre Firebase (Firestore + Auth)
   Reemplaza la versión basada en localStorage.

   Modelo en Firestore:
     users/{uid}/presentations/{presId}  -> documento con la presentación completa

   La API pública (window.AIP) conserva los mismos nombres que antes, pero las
   funciones de presentaciones ahora son ASÍNCRONAS (devuelven Promesas).
   Las herramientas y configuraciones (TOOLS, toolById, defaultConfig) siguen
   siendo síncronas porque son datos estáticos. */
(function () {
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- 20 Herramientas de Actividades Interactivas ----------
  const TOOLS = [
    { id: 'ruleta',       nombre: 'Ruleta de preguntas',   desc: 'Gira y responde la pregunta que toque', color: '#11F555', icon: 'ruleta' },
    { id: 'completa',     nombre: 'Completa la palabra',    desc: 'Encuentra la letra que falta',          color: '#F53711', icon: 'letras' },
    { id: 'elige',        nombre: 'Elige la respuesta',     desc: 'Opción múltiple con revelado',          color: '#116CF5', icon: 'check' },
    { id: 'crea',         nombre: 'Crea una pregunta',      desc: 'Los estudiantes formulan preguntas',    color: '#11F555', icon: 'pregunta' },
    { id: 'problema',     nombre: 'Resuelve un problema',   desc: 'Reto con tiempo para resolver',         color: '#F53711', icon: 'bulb' },
    { id: 'vf',           nombre: 'Verdadero o falso',      desc: 'Afirmaciones para debatir y revelar',   color: '#116CF5', icon: 'vf' },
    { id: 'pares',        nombre: 'Une los pares',          desc: 'Relaciona conceptos con definiciones',  color: '#11F555', icon: 'pares' },
    { id: 'ordena',       nombre: 'Ordena los pasos',       desc: 'Secuencia procesos en orden correcto',  color: '#F53711', icon: 'ordena' },
    { id: 'memorama',     nombre: 'Memorama',               desc: 'Memoria visual con parejas',            color: '#116CF5', icon: 'memorama' },
    { id: 'sopa',         nombre: 'Sopa de letras',         desc: 'Encuentra palabras clave del tema',     color: '#11F555', icon: 'sopa' },
    { id: 'adivina',      nombre: 'Adivina la imagen',      desc: 'Imagen oculta que se revela poco a poco', color: '#F53711', icon: 'eye' },
    { id: 'lluvia',       nombre: 'Lluvia de ideas',        desc: 'Recoge ideas del grupo en pantalla',    color: '#116CF5', icon: 'cloud' },
    { id: 'encuesta',     nombre: 'Encuesta rápida',        desc: 'Votación a mano alzada con conteo',     color: '#11F555', icon: 'chart' },
    { id: 'temporizador', nombre: 'Temporizador',           desc: 'Cuenta regresiva grande y visible',     color: '#F53711', icon: 'clock' },
    { id: 'selector',     nombre: 'Selector de estudiante', desc: 'Elige un participante al azar',         color: '#116CF5', icon: 'user' },
    { id: 'dado',         nombre: 'Dado didáctico',         desc: 'Lanza el dado y asigna el reto',        color: '#11F555', icon: 'dado' },
    { id: 'marcador',     nombre: 'Marcador de equipos',    desc: 'Puntajes en vivo por equipo',           color: '#F53711', icon: 'trofeo' },
    { id: 'ahorcado',     nombre: 'Ahorcado',               desc: 'Adivina la palabra letra por letra',    color: '#116CF5', icon: 'ahorcado' },
    { id: 'debate',       nombre: 'Debate: dos posturas',   desc: 'Divide el aula y argumenta',            color: '#11F555', icon: 'debate' },
    { id: 'reto',         nombre: 'Reto relámpago',         desc: 'Desafío sorpresa de 60 segundos',       color: '#F53711', icon: 'rayo' },
    { id: 'crucigrama',   nombre: 'Crucigrama',             desc: 'Cruza palabras por sus pistas',         color: '#116CF5', icon: 'sopa' },
    { id: 'organiza',     nombre: 'Organiza la frase',      desc: 'Ordena las palabras del párrafo',       color: '#116CF5', icon: 'ordena' },
    { id: 'descubre',     nombre: 'Descubre la palabra',    desc: 'Adivínala en seis intentos',            color: '#116CF5', icon: 'letras' },
    { id: 'stop',         nombre: 'Stop the clock',         desc: 'Categorías del cuadro (una por línea)', color: '#116CF5', icon: 'letras' },
    { id: 'errores',      nombre: 'Encuentra las diferencias', desc: 'Busca las diferencias en la imagen', color: '#116CF5', icon: 'eye' },
    { id: 'acertijo',     nombre: 'Acertijo',               desc: 'Resuelve el enigma del docente',        color: '#116CF5', icon: 'pregunta' },
  ];

  const toolById = (id) => TOOLS.find((t) => t.id === id) || TOOLS[0];

  /* ====== Grupos de Interacciones ======
     Cada grupo agrupa actividades EXISTENTES (por id, con { ref: 'id' }) y,
     opcionalmente, actividades "próximamente" que aún no están construidas
     (objeto completo con soon: true). */
  const GROUPS = [
    {
      id: 'fisicas',
      nombre: 'Pausas Físicas',
      desc: 'Activan el cuerpo: movimiento por zonas',
      color: '#F53711',
      icon: 'rayo',
      tools: [
        { id: 'pf-cabeza', nombre: 'Cabeza',        desc: 'Movilidad de cuello y rostro', color: '#F53711', icon: 'user', soon: true },
        { id: 'pf-torso',  nombre: 'Torso medio',   desc: 'Brazos, hombros y espalda',    color: '#F53711', icon: 'user', soon: true },
        { id: 'pf-tren',   nombre: 'Tren inferior', desc: 'Piernas, cadera y equilibrio', color: '#F53711', icon: 'user', soon: true },
      ],
    },
    {
      id: 'cognitivos',
      nombre: 'Activadores Cognitivos',
      desc: 'Despiertan el pensamiento y el ingenio',
      color: '#116CF5',
      icon: 'bulb',
      tools: [
        { ref: 'acertijo' },
        { ref: 'ahorcado' },
        { ref: 'reto' },
        { ref: 'organiza' },
        { ref: 'descubre' },
        { ref: 'errores'},
        { ref: 'stop' },
        { ref: 'sopa' },
        { id: 'colorea',    nombre: 'Colorea con números', desc: 'Pinta siguiendo la clave numérica',  color: '#116CF5', icon: 'chart',    soon: true },
        { ref: 'crucigrama' },
        { ref: 'completa' },
        { ref: 'adivina' },
      ],
    },
    {
      id: 'evaluadoras',
      nombre: 'Pausas Evaluadoras',
      desc: 'Comprueban y consolidan lo aprendido',
      color: '#11F555',
      icon: 'check',
      tools: [
        { ref: 'ruleta' }, { ref: 'elige' }, { ref: 'crea' }, { ref: 'problema' },
        { ref: 'vf' }, { ref: 'pares' }, { ref: 'ordena' }, { ref: 'memorama' },
        { ref: 'encuesta' }, { ref: 'lluvia' }, { ref: 'temporizador' }, { ref: 'selector' },
        { ref: 'dado' }, { ref: 'marcador' }, { ref: 'debate' },
      ],
    },
  ];

  /* Resuelve cada entrada de un grupo a un objeto completo de herramienta.
     - { ref: 'id' }          -> toma la herramienta existente del catálogo TOOLS
     - objeto con soon: true  -> actividad futura (deshabilitada) */
  function groupTools(group) {
    return group.tools.map((entry) => {
      if (entry.ref) return Object.assign({}, toolById(entry.ref), { soon: false });
      return entry;
    });
  }

  function defaultConfig(toolId) {
    const t = toolById(toolId);
    const base = { titulo: t.nombre, instrucciones: t.desc + '.', duracion: 120, items: [] };
    switch (toolId) {
      case 'ruleta':
        base.items = ['¿Qué aprendimos hoy?', 'Da un ejemplo del tema', 'Explica con tus palabras', '¿Dónde lo ves en tu vida diaria?', 'Pregunta sorpresa del docente'];
        base.instrucciones = 'Gira la ruleta y responde la pregunta que toque.';
        break;
      case 'completa':
        base.items = ['EJEMPL_=O', 'PALABR_=A'];
        base.instrucciones = 'Elige la letra que completa la palabra.';
        break;
      case 'elige':
        base.items = ['¿Cuál es la respuesta correcta?|Opción correcta|Distractor 1|Distractor 2'];
        base.instrucciones = 'Lee la pregunta y elige una opción.';
        break;
      case 'vf':
        base.items = ['Esta afirmación es verdadera|V', 'Esta afirmación es falsa|F'];
        base.instrucciones = '¿Verdadero o falso? Decide y revela.';
        break;
      case 'crea':
        base.instrucciones = 'En parejas, escriban una pregunta sobre el tema. La mejor pregunta se responde en grupo.';
        base.duracion = 180;
        break;
      case 'problema':
        base.instrucciones = 'Resuelve el problema en tu cuaderno antes de que termine el tiempo.';
        base.items = ['Escribe aquí el enunciado del problema.'];
        base.duracion = 300;
        break;
      case 'selector':
        base.items = ['Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Pedro'];
        base.instrucciones = 'El selector elegirá un participante al azar.';
        break;
      case 'marcador':
        base.items = ['Equipo Verde', 'Equipo Naranja'];
        base.instrucciones = 'Suma puntos a cada equipo durante la clase.';
        break;
      case 'temporizador':
        base.duracion = 300;
        base.instrucciones = 'Tiempo para completar la actividad.';
        break;
      case 'lluvia':
        base.items = [];
        base.instrucciones = 'Escribe las ideas del grupo: las repetidas crecen.';
        break;
      case 'pares':
        base.items = ['Sol = Estrella', 'Luna = Satélite', 'Tierra = Planeta'];
        base.instrucciones = 'Une cada elemento con su pareja: toca uno y luego su par.';
        break;
      case 'encuesta':
        base.items = ['Opción A', 'Opción B', 'Opción C'];
        base.instrucciones = 'Votación a mano alzada: suma los votos de cada opción.';
        break;
      case 'debate':
        base.items = ['¿Escribe aquí la pregunta del debate?', 'A favor', 'En contra'];
        base.instrucciones = 'Cada postura tiene su propio tiempo para argumentar.';
        base.duracion = 120;
        break;
      case 'memorama':
        base.items = ['Sol = Estrella', 'Agua = H₂O', 'Perro = Mamífero', 'Rosa = Flor'];
        base.instrucciones = 'Voltea dos cartas: si forman pareja, se quedan descubiertas.';
        break;
      case 'ordena':
        base.items = ['Primer paso', 'Segundo paso', 'Tercer paso', 'Cuarto paso'];
        base.instrucciones = 'Arrastra los pasos hasta dejarlos en el orden correcto.';
        break;
      default:
        base.duracion = 180;
    }
    return base;
  }

  // ---------- presentaciones semilla (para cuentas nuevas) ----------
  function seedPresentations() {
    const s = (extra) => Object.assign({ id: uid() }, extra);
    return [
      {
        id: uid(), tema: 'El ciclo del agua', materia: 'Ciencias Naturales',
        objetivo: 'Comprender las etapas del ciclo del agua y su importancia para la vida.',
        color: '#11F555', usos: 0,
        slides: [
          s({ type: 'contenido', titulo: 'El ciclo del agua', texto: 'Un viaje sin fin: evaporación, condensación, precipitación e infiltración.', imagen: { tipo: 'url', valor: '' } }),
          s({ type: 'contenido', titulo: 'Evaporación', texto: 'El sol calienta el agua de ríos, lagos y mares. El agua se transforma en vapor y sube a la atmósfera.', imagen: { tipo: 'url', valor: '' } }),
          s({ type: 'actividad', tool: 'ruleta', config: { titulo: 'Ruleta del ciclo del agua', instrucciones: 'Gira la ruleta y responde la pregunta que toque.', duracion: 120, items: ['¿Qué es la evaporación?', '¿Dónde se forman las nubes?', 'Nombra dos tipos de precipitación', '¿Por qué es importante el agua?', '¿Qué pasa con el agua que cae al suelo?'] } }),
          s({ type: 'contenido', titulo: 'Condensación', texto: 'El vapor de agua se enfría en la atmósfera y forma pequeñas gotas que se agrupan en nubes.', imagen: { tipo: 'url', valor: '' } }),
          s({ type: 'actividad', tool: 'elige', config: { titulo: '¿Cuánto sabes?', instrucciones: 'Lee la pregunta y elige una opción.', duracion: 120, items: ['¿Qué provoca la evaporación del agua?|El calor del sol|El viento frío|La lluvia', '¿Dónde ocurre la condensación?|En la atmósfera|En el subsuelo|En los océanos'] } }),
          s({ type: 'actividad', tool: 'problema', config: { titulo: 'Problema del agua', instrucciones: 'Resuelve en tu cuaderno antes de que termine el tiempo.', duracion: 300, items: ['Si una nube descarga 2 litros de lluvia por metro cuadrado, ¿cuántos litros caen sobre un patio de 50 m²?'] } }),
        ],
      },
      {
        id: uid(), tema: 'Fracciones en la vida diaria', materia: 'Matemáticas',
        objetivo: 'Identificar y operar fracciones simples usando ejemplos cotidianos.',
        color: '#F53711', usos: 0,
        slides: [
          s({ type: 'contenido', titulo: 'Fracciones en la vida diaria', texto: 'Mitades de pizza, cuartos de hora, tres cuartas partes del camino: las fracciones están en todas partes.', imagen: { tipo: 'url', valor: '' } }),
          s({ type: 'actividad', tool: 'vf', config: { titulo: 'Verdadero o falso', instrucciones: '¿Verdadero o falso? Decide y revela.', duracion: 120, items: ['1/2 es mayor que 1/4|V', '2/4 es diferente de 1/2|F', 'Tres cuartos de hora son 45 minutos|V'] } }),
          s({ type: 'actividad', tool: 'problema', config: { titulo: 'Reparte la pizza', instrucciones: 'Resuelve el problema en equipo.', duracion: 240, items: ['Una pizza tiene 8 porciones. Si Ana come 1/4 y Luis come 3/8, ¿cuántas porciones quedan?'] } }),
          s({ type: 'contenido', titulo: 'Lo que aprendimos', texto: 'Una fracción representa partes de un todo. Comparar fracciones es más fácil con denominadores iguales.', imagen: { tipo: 'url', valor: '' } }),
        ],
      },
      {
        id: uid(), tema: 'El cuento y sus partes', materia: 'Lengua Castellana',
        objetivo: 'Reconocer inicio, nudo y desenlace en narraciones cortas.',
        color: '#116CF5', usos: 0,
        slides: [
          s({ type: 'contenido', titulo: 'El cuento y sus partes', texto: 'Toda historia tiene un inicio que presenta, un nudo que complica y un desenlace que resuelve.', imagen: { tipo: 'url', valor: '' } }),
          s({ type: 'actividad', tool: 'completa', config: { titulo: 'Completa la palabra', instrucciones: 'Elige la letra que completa la palabra.', duracion: 120, items: ['DESENL_CE=A', 'N_DO=U', 'PERSONAJ_=E'] } }),
          s({ type: 'actividad', tool: 'crea', config: { titulo: 'Crea una pregunta', instrucciones: 'En parejas, escriban una pregunta sobre el cuento que leímos. La mejor pregunta se responde en grupo.', duracion: 180, items: [] } }),
          s({ type: 'actividad', tool: 'selector', config: { titulo: '¿Quién lee?', instrucciones: 'El selector elegirá quién lee la siguiente parte.', duracion: 60, items: ['Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Pedro', 'Lucía', 'Diego'] } }),
        ],
      },
    ];
  }

  // ---------- helpers de Firestore ----------
  function requireDB() {
    if (!window.fbDB || !window.fbAuth) throw new Error('Firebase no inicializado (revisa firebase-config.js).');
    return window.fbDB;
  }
  function currentUid() {
    const u = window.fbAuth && window.fbAuth.currentUser;
    return u ? u.uid : null;
  }
  function presCol(uidStr) {
    return requireDB().collection('users').doc(uidStr).collection('presentations');
  }

  // ---------- Autenticación ----------
  async function signUp(email, password, nombre) {
    const cred = await window.fbAuth.createUserWithEmailAndPassword(email.trim(), password);
    if (nombre && nombre.trim()) {
      await cred.user.updateProfile({ displayName: nombre.trim() });
    }
    return cred.user;
  }
  async function signIn(email, password) {
    const cred = await window.fbAuth.signInWithEmailAndPassword(email.trim(), password);
    return cred.user;
  }
  async function signOut() {
    await window.fbAuth.signOut();
  }
  function onAuth(cb) {
    return window.fbAuth.onAuthStateChanged(cb);
  }

  // ---------- Presentaciones (asíncronas) ----------
  // Carga todas las presentaciones del docente actual. Si no tiene ninguna,
  // siembra las de ejemplo una sola vez.
  async function loadPresentations() {
    const u = currentUid();
    if (!u) return [];
    const snap = await presCol(u).orderBy('updatedAt', 'desc').get();
    if (snap.empty) {
      const seeded = seedPresentations();
      await Promise.all(seeded.map((p) => savePresentation(p)));
      return seeded;
    }
    return snap.docs.map((d) => d.data());
  }

  // Guarda (crea o actualiza) UNA presentación.
  async function savePresentation(pres) {
    const u = currentUid();
    if (!u) throw new Error('No hay sesión activa.');
    const withMeta = Object.assign({}, pres, { updatedAt: Date.now() });
    await presCol(u).doc(pres.id).set(withMeta);
    return withMeta;
  }

  async function deletePresentation(id) {
    const u = currentUid();
    if (!u) throw new Error('No hay sesión activa.');
    await presCol(u).doc(id).delete();
  }

  /* ============================================================
     Control remoto (el celular como mando de la presentación)
     ------------------------------------------------------------
     Modelo en Firestore:
       remoteSessions/{code}  -> documento ÚNICO por sesión

     El documento es un "estado espejo": la TV (Presenter) escribe
     el estado de la presentación, y el celular escribe "comandos".
     Ambos escuchan el mismo documento con onSnapshot y reaccionan.

     Campos del documento:
       code      : el código corto (también es el id del doc)
       ownerUid  : uid del docente dueño (para reglas de seguridad)
       createdAt : marca de tiempo de creación
       state     : { idx, total, tema, modo, hideScores,
                     activity: {tool, titulo}, teams:[{name,color,score}] }
       command   : { type, payload, nonce }  <- lo escribe el celular
                   La TV procesa el comando y luego lo limpia (nonce).
     ============================================================ */

  // Genera un código corto legible (4 dígitos). Evita el 0 inicial.
  function genSessionCode() {
    return String(Math.floor(1000 + Math.random() * 9000));
  }

  function remoteCol() {
    return requireDB().collection('remoteSessions');
  }

  // La TV crea (o reusa) una sesión. Devuelve { code, ref }.
  // Reintenta si el código ya está ocupado por otra sesión viva.
  async function createRemoteSession(initialState) {
    const u = currentUid();
    if (!u) throw new Error('No hay sesión activa.');
    for (let intento = 0; intento < 6; intento++) {
      const code = genSessionCode();
      const ref = remoteCol().doc(code);
      const snap = await ref.get();
      // Si existe y fue creada hace menos de 6 h, está "viva": probamos otro código.
      if (snap.exists) {
        const data = snap.data();
        const fresca = data.createdAt && (Date.now() - data.createdAt) < 6 * 3600 * 1000;
        if (fresca && data.ownerUid !== u) continue;
      }
      await ref.set({
        code,
        ownerUid: u,
        createdAt: Date.now(),
        state: initialState || {},
        command: null,
      });
      return { code, ref };
    }
    throw new Error('No se pudo crear la sesión de control remoto. Intenta de nuevo.');
  }

  // La TV actualiza el estado espejo (solo el campo state).
  async function updateRemoteState(code, state) {
    if (!code) return;
    await remoteCol().doc(code).set({ state }, { merge: true });
  }

  // La TV limpia el comando ya procesado (evita repetirlo).
  async function clearRemoteCommand(code) {
    if (!code) return;
    await remoteCol().doc(code).set({ command: null }, { merge: true });
  }

  // El celular envía un comando. nonce hace cada comando único e idempotente.
  async function sendRemoteCommand(code, type, payload) {
    if (!code) return;
    const command = { type, payload: payload || null, nonce: uid(), at: Date.now() };
    await remoteCol().doc(code).set({ command }, { merge: true });
  }

  // Cualquiera de los dos lados escucha el documento de la sesión.
  // cb recibe el data completo (o null si la sesión no existe).
  function listenRemoteSession(code, cb) {
    if (!code) return () => {};
    return remoteCol().doc(code).onSnapshot(
      (snap) => cb(snap.exists ? snap.data() : null),
      (err) => { console.error('[remote] onSnapshot:', err); cb(null, err); }
    );
  }

  // El celular comprueba que la sesión existe antes de "entrar".
  async function getRemoteSession(code) {
    if (!code) return null;
    const snap = await remoteCol().doc(code).get();
    return snap.exists ? snap.data() : null;
  }

  // La TV cierra la sesión al salir del modo Presentar.
  async function closeRemoteSession(code) {
    if (!code) return;
    try {
      // Borra participantes y respuestas antes de borrar la sesión.
      const parts = await remoteCol().doc(code).collection('participants').get();
      await Promise.all(parts.docs.map((d) => d.ref.delete()));
      await remoteCol().doc(code).delete();
    } catch (e) { /* silencioso */ }
  }

  /* ============================================================
     Sala multijugador (estudiantes)
     ------------------------------------------------------------
     Subcolección:
       remoteSessions/{code}/participants/{pid}
         { pid, nombre, grupo, joinedAt, hand, handAt, answer, answerAt }

     - Cada estudiante es un documento propio (no se pisan al escribir).
     - 'hand' = pidió la palabra (levantó la mano) para participación.
     - 'answer' = su respuesta en el Quiz.
     El estado de la ronda (qué se pregunta, si está abierta) vive en
     el campo state.live del documento de la sesión, que escribe la TV.
     ============================================================ */

  function partsCol(code) {
    return remoteCol().doc(code).collection('participants');
  }

  // El estudiante se une a la sala. Devuelve su pid (id de participante).
  async function joinSession(code, nombre, grupo) {
    if (!code) throw new Error('Falta el código.');
    const sess = await remoteCol().doc(code).get();
    if (!sess.exists) throw new Error('No existe esa sala.');
    const pid = uid();
    await partsCol(code).doc(pid).set({
      pid,
      nombre: (nombre || '').trim() || 'Estudiante',
      grupo: (grupo || '').trim() || null,
      joinedAt: Date.now(),
      hand: false, handAt: null,
      answer: null, answerAt: null,
    });
    return pid;
  }

  // El estudiante levanta la mano (pide participar).
  async function raiseHand(code, pid) {
    if (!code || !pid) return;
    await partsCol(code).doc(pid).set({ hand: true, handAt: Date.now() }, { merge: true });
  }

  // El estudiante responde el Quiz (índice de la opción elegida).
  async function submitAnswer(code, pid, optionIndex) {
    if (!code || !pid) return;
    await partsCol(code).doc(pid).set({ answer: optionIndex, answerAt: Date.now() }, { merge: true });
  }

  // La TV limpia manos/respuestas de todos al empezar una ronda nueva.
  async function resetRound(code) {
    if (!code) return;
    const snap = await partsCol(code).get();
    await Promise.all(snap.docs.map((d) =>
      d.ref.set({ hand: false, handAt: null, answer: null, answerAt: null }, { merge: true })));
  }

  // La TV (y opcionalmente el celular) escucha la lista de participantes.
  function listenParticipants(code, cb) {
    if (!code) return () => {};
    return partsCol(code).onSnapshot(
      (snap) => cb(snap.docs.map((d) => d.data())),
      (err) => { console.error('[remote] participants:', err); cb([], err); }
    );
  }

  window.AIP = {
    uid, TOOLS, GROUPS, groupTools, toolById, defaultConfig, seedPresentations,
    // auth
    signUp, signIn, signOut, onAuth, currentUid,
    // datos
    loadPresentations, savePresentation, deletePresentation,
    // control remoto
    createRemoteSession, updateRemoteState, clearRemoteCommand,
    sendRemoteCommand, listenRemoteSession, getRemoteSession, closeRemoteSession,
    // sala multijugador
    joinSession, raiseHand, submitAnswer, resetRound, listenParticipants,
  };
})();