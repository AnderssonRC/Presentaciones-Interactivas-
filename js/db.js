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
  ];

  const toolById = (id) => TOOLS.find((t) => t.id === id) || TOOLS[0];

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

  window.AIP = {
    uid, TOOLS, toolById, defaultConfig, seedPresentations,
    // auth
    signUp, signIn, signOut, onAuth, currentUid,
    // datos
    loadPresentations, savePresentation, deletePresentation,
  };
})();
