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

  // ---------- Catálogo de actividades ----------
  // Cada actividad se define en js/actividades/<id>/meta.js (ver
  // js/actividades/nucleo.js). Aquí solo se expone con los nombres de siempre.
  if (!window.Actividades) console.error('[db] Falta js/actividades/nucleo.js antes de db.js en index.html.');
  const TOOLS = window.Actividades ? window.Actividades.todas() : [];

  // Id desconocido -> la ruleta (igual que antes con TOOLS[0]).
  const toolById = (id) => window.Actividades.meta(id) || window.Actividades.meta('ruleta') || TOOLS[0];

  /* ====== Grupos de Interacciones ======
     Los grupos se definen en nucleo.js; cada actividad dice en su meta.js a
     qué grupo pertenece y en qué orden. Las marcadas `pronto` salen como
     "Próximamente" (soon: true) y no se pueden añadir. */
  const GROUPS = window.Actividades ? window.Actividades.GRUPOS : [];

  function groupTools(group) {
    return window.Actividades.delGrupo(group.id).map((m) => Object.assign({}, m, { soon: !!m.pronto }));
  }

  function defaultConfig(toolId) {
    const t = toolById(toolId);
    // `tiempoActivo` decide si el cronómetro de la actividad se muestra en
    // Presentar. Apagado por defecto: el docente lo activa explícitamente
    // desde el editor (ver tiempoHabilitado() más abajo para el caso de
    // presentaciones guardadas antes de que existiera este campo).
    const base = { titulo: t.nombre, instrucciones: t.desc + '.', duracion: 120, tiempoActivo: false, items: [] };
    // Cada meta.js ajusta lo suyo (items de ejemplo, instrucciones, duración…).
    if (typeof t.config === 'function') t.config(base);
    return base;
  }

  // ¿Debe mostrarse el cronómetro de esta actividad en Presentar?
  // Antes de que existiera `config.tiempoActivo`, algunas herramientas (las
  // que tienen `tiempoSiempre` en su meta.js) ya mostraban su cuenta regresiva
  // de forma incondicional. Para no apagar de golpe el tiempo en
  // presentaciones ya guardadas sin el campo nuevo, si `tiempoActivo` no está
  // definido se asume encendido solo para esas; para el resto, apagado.
  function tiempoHabilitado(config, toolId) {
    if (config && typeof config.tiempoActivo === 'boolean') return config.tiempoActivo;
    const m = window.Actividades && window.Actividades.meta(toolId);
    return !!(m && m.tiempoSiempre);
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
      // Registra la solicitud de acceso: el admin debe aprobarla.
    try { await crearSolicitud(cred.user); }
    catch (e) { console.error('No se pudo registrar la solicitud:', e); }
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
// ---------- Solicitudes de acceso (modo administración) ----------
  // UID(s) con permisos de administrador. Para conocer el tuyo: entra con tu
  // cuenta, abre la consola del navegador (F12) y escribe AIP.currentUid()
  const ADMIN_UIDS = ['NiPfi5dd3dbzyBMzltrf7VcanlT2'];

  function esAdmin() { const u = currentUid(); return !!u && ADMIN_UIDS.includes(u); }
  function reqDoc(uidStr) { return requireDB().collection('accessRequests').doc(uidStr); }

  async function crearSolicitud(user) {
    await reqDoc(user.uid).set({
      uid: user.uid, nombre: user.displayName || '', email: user.email || '',
      estado: 'pendiente', creado: Date.now(),
    });
  }
  // Estado del usuario actual. Cuentas antiguas (sin solicitud) = aprobadas.
  async function miEstadoAcceso() {
    const u = currentUid(); if (!u) return 'sin-sesion';
    if (ADMIN_UIDS.includes(u)) return 'aprobado';
    const snap = await reqDoc(u).get();
    if (!snap.exists) return 'aprobado';
    return snap.data().estado || 'pendiente';
  }
  async function listarSolicitudes() {
    const snap = await requireDB().collection('accessRequests').orderBy('creado', 'desc').get();
    return snap.docs.map((d) => d.data());
  }
  async function resolverSolicitud(uidStr, estado) {
    await reqDoc(uidStr).update({ estado, resuelto: Date.now() });
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
  // answerAt usa la hora del servidor: el TV ordena por ella para saber quién
  // respondió primero, y el reloj de cada celular puede estar desfasado.
  async function submitAnswer(code, pid, optionIndex) {
    if (!code || !pid) return;
    await partsCol(code).doc(pid).set({ answer: optionIndex, answerAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  // La TV limpia manos/respuestas de todos al empezar una ronda nueva.
  async function resetRound(code) {
    if (!code) return;
    const snap = await partsCol(code).get();
    await Promise.all(snap.docs.map((d) =>
      d.ref.set({ hand: false, handAt: null, answer: null, answerAt: null }, { merge: true })));
  }

  // La TV limpia solo las respuestas del Quiz al pasar a una pregunta nueva
  // (no toca las manos levantadas de la ronda de participación).
  async function resetAnswers(code) {
    if (!code) return;
    const snap = await partsCol(code).get();
    await Promise.all(snap.docs.map((d) => d.ref.set({ answer: null, answerAt: null }, { merge: true })));
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
    uid, TOOLS, GROUPS, groupTools, toolById, defaultConfig, tiempoHabilitado, seedPresentations,
    // auth
    signUp, signIn, signOut, onAuth, currentUid,
    esAdmin, crearSolicitud, miEstadoAcceso, listarSolicitudes, resolverSolicitud,
    // datos
    loadPresentations, savePresentation, deletePresentation,
    // control remoto
    createRemoteSession, updateRemoteState, clearRemoteCommand,
    sendRemoteCommand, listenRemoteSession, getRemoteSession, closeRemoteSession,
    // sala multijugador
    joinSession, raiseHand, submitAnswer, resetRound, resetAnswers, listenParticipants,
  };
})();
