/* capibara-espejo.jsx — Modo Capibara · «Espejo en Vivo» (cp-espejo).

   Una silueta humana grande se mueve lenta y sin parar, pasando de una pose
   clave a otra con interpolación suave de ángulos. El concursante la sigue
   como un espejo frente a la proyección: la silueta lo mira de frente, así
   que su lado derecho queda a la izquierda del estudiante (se explica al
   inicio y queda indicado abajo, «◀ tu izquierda / tu derecha ▶»).
   Cuando el estudiante pierde el ritmo o la pose, el docente presiona
   «SE DESCONECTÓ» (celular, Espacio o Av Pág): todo se congela y queda el
   tiempo aguantado. «Deshacer» (Re Pág, D) reanuda desde el mismo punto tras
   un 3, 2, 1. Puntaje = tiempo. La velocidad sube poco a poco y, por
   niveles, se mueven más partes del cuerpo a la vez (1 → 5).
   Todos los concursantes siguen la MISMA coreografía (se genera al empezar
   la partida con una semilla). Al terminar los turnos: ranking por equipo y
   pasos hacia Jomu (1 paso cada `a.segPorPasoEspejo` s, con `jaguarPunto`).

   Reutiliza (no reimplementa): sesión de equipos del Jaguar, capibara-comun.jsx
   (audio y silencio común, `useLienzoCp`, `rrCp`, `siguienteConcursanteCp`,
   `siguienteTurnoCp`, `TablaFinalCp`, `MontanaFinalCp`), el banco de poses y
   la silueta del Muro Infernal (`POSES_MURO`, `siluetaMI`, `esqueletoMI`,
   `NEUTRA_MURO`, `MEDIDAS_MURO`), `equiposCapibara`, `EnlaceJaguar`,
   `fijarEstadoCapibara` (mando) y los estilos `vg-mi-*`.
   Atajos como los otros juegos: Espacio / Enter / Av Pág = acción principal
   (en juego: SE DESCONECTÓ), Re Pág / D = deshacer, P pausa, R reiniciar
   turno, N siguiente concursante, M silencio, F pantalla completa.

   Secciones: CONFIGURACIÓN · POSES SEGURAS · COREOGRAFÍA · MÚSICA Y SONIDOS ·
   ESCENA (fondo y silueta) · JUEGO (componente) · MANDO · HUD. */

/* =========================== CONFIGURACIÓN =========================== */
const EJ = {
  W: 1600, H: 900,
  SUELO: 866, ESCALA: 1.48,             // dónde pisa la silueta y cuánto se agranda (no toca el marcador)
  CLAVES: 260,                          // poses clave de la coreografía (≈ 8 min)
  TIEMPOS: 4, MUEVE: 0.82,              // pulsos por pose · parte del tramo en movimiento (el resto, quieta)
  BPM: { lenta: 54, media: 64, rapida: 76 }, BPM_SUBE: 1.5, BPM_TOPE: 54,
  NIVELES: [6, 14, 24, 36],             // desde qué pose se mueven 2, 3, 4 y 5 partes a la vez
  CUENTA_MS: 3000, YA_MS: 700, AVISO_NIVEL_MS: 1900,
  GUARDA_MS: 1500,                      // tras «se desconectó», Av Pág no avanza enseguida (evita doble toque)
  ADELANTO: 140,                        // ms de música programados por adelantado
};
const limitarEJ = (v, a, b, d) => Math.max(a, Math.min(b, Number(v) || d));
const segEJ = (ms) => (Math.max(0, ms) / 1000).toFixed(1).replace('.', ',');
const VELOCIDADES_EJ = [['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']];
const FASES_JUEGO_EJ = ['espejo', 'turno', 'cuenta', 'jugando', 'desconecto', 'completa'];

// Partes que se mueven juntas. clase: de dónde salen sus valores en el banco
// (los ángulos del Muro son «hacia afuera» en los dos lados: se comparten).
const GRUPOS_EJ = [
  { id: 'bi', partes: ['bi1', 'bi2'], clase: 'brazo', peso: 3 },
  { id: 'bd', partes: ['bd1', 'bd2'], clase: 'brazo', peso: 3 },
  { id: 't', partes: ['t'], clase: 'torso', peso: 1 },
  { id: 'pi', partes: ['pi1', 'pi2'], clase: 'pierna', peso: 1.4, pierna: true },
  { id: 'pd', partes: ['pd1', 'pd2'], clase: 'pierna', peso: 1.4, pierna: true },
];

/* =========================== POSES SEGURAS ===========================
   Se reutiliza el banco del Muro Infernal, quedándose solo con poses de pie,
   realizables y seguras: sin saltos, sin sentadillas, sin apoyos en el suelo.
   · Pierna: abajo y recta, o hacia el lado 45° con la rodilla casi recta.
   · Las dos piernas abiertas: rectas (postura ancha, ambos pies en el suelo).
   · En un pie: el torso derecho, y solo durante una pose (luego baja). */
function poseSeguraEJ(p) {
  const pierna = (m, r) => (!m && !r) || (m === 45 && Math.abs(r || 0) <= 45);
  if (!pierna(p.pi1, p.pi2) || !pierna(p.pd1, p.pd2)) return false;
  const arriba = (p.pi1 ? 1 : 0) + (p.pd1 ? 1 : 0);
  if (arriba === 2 && (p.pi2 || p.pd2)) return false;
  if (arriba === 1 && p.t) return false;
  return Math.abs(p.t || 0) <= 45;
}
const unPieEJ = (p) => (p.pi1 ? 1 : 0) + (p.pd1 ? 1 : 0) === 1;

// Valores posibles de cada clase (brazo, pierna, torso), sacados de las poses seguras.
let bancoEJ = null;
function bancoEspejoEJ() {
  if (bancoEJ) return bancoEJ;
  const poses = [{ p: { ...NEUTRA_MURO } }].concat((window.POSES_MURO || []).filter((x) => poseSeguraEJ(x.p)));
  const valores = { brazo: [], pierna: [], torso: [] }, vistos = {};
  poses.forEach((x) => GRUPOS_EJ.forEach((g) => {
    const v = g.partes.map((k) => x.p[k] || 0), clave = g.clase + ':' + v.join(',');
    if (!vistos[clave]) { vistos[clave] = 1; valores[g.clase].push(v); }
  }));
  bancoEJ = { poses, valores };
  return bancoEJ;
}

/* ============================ COREOGRAFÍA ============================
   Lista de poses clave con su instante (ms). Cada pose dura TIEMPOS pulsos;
   el tempo sube un poco en cada pose (hasta BPM_TOPE más que al inicio) y el
   nivel dice cuántas partes cambian a la vez. Con la misma semilla sale la
   misma coreografía: así es justa para todos los concursantes. */
function azarEJ(semilla) {   // generador con semilla (mulberry32)
  let s = semilla >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), s | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const nivelEJ = (i) => 1 + EJ.NIVELES.filter((k) => i > k).length;

function siguientePoseEJ(prev, nivel, rnd) {
  const B = bancoEspejoEJ();
  const elegibles = GRUPOS_EJ.filter((g) => nivel > 1 || !g.pierna);   // nivel 1: solo brazos y torso
  for (let intento = 0; intento < 80; intento++) {
    const p = { ...prev }, bolsa = elegibles.slice(), elegidos = [];
    // Una pierna levantada baja en la pose siguiente, y la otra no sube a la
    // vez (nada de equilibrio largo en un pie ni cambios de pie como saltitos).
    if (unPieEJ(prev)) {
      const g = GRUPOS_EJ.find((x) => x.pierna && prev[x.partes[0]]);
      for (let j = bolsa.length - 1; j >= 0; j--) if (bolsa[j].pierna) bolsa.splice(j, 1);
      elegidos.push(g);
      g.partes.forEach((k) => { p[k] = 0; });
    }
    while (elegidos.length < Math.min(nivel, elegibles.length) && bolsa.length) {
      const total = bolsa.reduce((s, g) => s + g.peso, 0);
      let r = rnd() * total, j = 0;
      while (j < bolsa.length - 1 && (r -= bolsa[j].peso) > 0) j++;
      const g = bolsa.splice(j, 1)[0];
      const actual = g.partes.map((k) => prev[k] || 0).join(',');
      const opciones = B.valores[g.clase].filter((v) => v.join(',') !== actual);
      if (!opciones.length) continue;
      const v = opciones[Math.floor(rnd() * opciones.length)];
      g.partes.forEach((k, i) => { p[k] = v[i]; });
      elegidos.push(g);
    }
    if (poseSeguraEJ(p)) return p;
  }
  return { ...NEUTRA_MURO };
}

function crearCoreografiaEJ(velocidad, semilla) {
  const rnd = azarEJ(semilla);
  const bpm0 = EJ.BPM[velocidad] || EJ.BPM.lenta;
  const claves = [{ p: { ...NEUTRA_MURO }, t: 0, nivel: 1, bpm: bpm0 }];
  const pulsos = [];
  let t = 0;
  for (let i = 1; i <= EJ.CLAVES; i++) {
    const bpm = Math.min(bpm0 + EJ.BPM_TOPE, bpm0 + (i - 1) * EJ.BPM_SUBE), pulso = 60000 / bpm;
    for (let b = 0; b < EJ.TIEMPOS; b++) pulsos.push({ t: t + b * pulso, clave: i, b, nota: Math.floor(rnd() * 3) });
    t += pulso * EJ.TIEMPOS;
    claves.push({ p: siguientePoseEJ(claves[i - 1].p, nivelEJ(i), rnd), t, nivel: nivelEJ(i), bpm: Math.round(bpm) });
  }
  return { claves, pulsos, total: t };
}

// Pose en el instante tc: va de la pose anterior a la siguiente con un vaivén
// suave (coseno) y se queda quieta el último tramo. fase: 0–1 dentro del pulso.
function poseEnEJ(coreo, tc) {
  const K = coreo.claves;
  if (tc >= coreo.total) return { p: K[K.length - 1].p, k: K.length - 1, nivel: K[K.length - 1].nivel, bpm: K[K.length - 1].bpm, fase: 0 };
  let lo = 1, hi = K.length - 1;
  while (lo < hi) { const m = (lo + hi) >> 1; if (K[m].t > tc) hi = m; else lo = m + 1; }
  const A = K[lo - 1], B = K[lo], d = B.t - A.t;
  const f = Math.min(1, Math.max(0, (tc - A.t) / (d * EJ.MUEVE)));
  const s = 0.5 - 0.5 * Math.cos(Math.PI * f);
  const p = {};
  Object.keys(NEUTRA_MURO).forEach((id) => { p[id] = (A.p[id] || 0) + ((B.p[id] || 0) - (A.p[id] || 0)) * s; });
  const pulso = d / EJ.TIEMPOS;
  return { p, k: lo, nivel: B.nivel, bpm: B.bpm, fase: ((tc - A.t) % pulso) / pulso };
}
const primerPulsoEJ = (coreo, tc) => { let i = 0; while (i < coreo.pulsos.length && coreo.pulsos[i].t < tc - 1) i++; return i; };

/* ========================= MÚSICA Y SONIDOS =========================
   Música suave con Web Audio (sin archivos), atada al pulso de la silueta:
   bajo y acorde al empezar cada pose, notas del acorde en los otros pulsos.
   Progresión Do – La m – Fa – Sol. Respeta el silencio común (M). */
const ACORDES_EJ = [[261.63, 329.63, 392.0], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [196.0, 246.94, 293.66]];
function notaEJ(p, coreo, en) {
  if (audioCapibara.silencio()) return;
  const acorde = ACORDES_EJ[(p.clave - 1) % ACORDES_EJ.length];
  const pulso = 60 / (coreo.claves[p.clave] || coreo.claves[1]).bpm;
  if (p.b === 0) {
    audioCapibara.tono(acorde[0] / 2, pulso * 1.6, 'sine', 0.12, en);
    acorde.forEach((f) => audioCapibara.tono(f, pulso * EJ.TIEMPOS * 0.95, 'triangle', 0.02, en));
  } else {
    audioCapibara.tono(acorde[p.nota] * 2, Math.min(0.55, pulso * 0.85), 'sine', 0.045, en);
    if (p.b === 2) audioCapibara.ruido(0.05, 0.03, 5200, en);
  }
}
// Programa las notas que caen en los próximos ADELANTO ms del juego.
function musicaEJ(X) {
  const P = X.coreo.pulsos;
  while (X.sigPulso < P.length && P[X.sigPulso].t <= X.tc + EJ.ADELANTO) {
    const p = P[X.sigPulso++];
    notaEJ(p, X.coreo, Math.max(0, (p.t - X.tc) / 1000));
  }
}
const SONIDO_EJ = {
  cuenta: () => audioCapibara.tono(660, 0.14, 'sine', 0.14),
  ya: () => audioCapibara.tono(990, 0.4, 'triangle', 0.16),
  desconecto: () => { audioCapibara.tono(520, 0.55, 'sawtooth', 0.12, 0, 120); audioCapibara.ruido(0.25, 0.14, 900); },
  nivel: () => [659, 784, 988].forEach((f, i) => audioCapibara.tono(f, 0.22, 'triangle', 0.12, i * 0.09)),
  fin: () => [523, 659, 784, 1047, 1319].forEach((f, i) => audioCapibara.tono(f, 0.25, 'triangle', 0.16, i * 0.1)),
};

/* ============================== ESCENA ==============================
   Fondo en acuarela con un gran espejo de marco de madera (se pinta una vez)
   y la silueta: cuerpo oscuro con halo blanco y brillo del color del equipo
   (alto contraste, legible en 1024×768). Los pies siempre tocan el suelo. */
let fondoEJ = null;
function fondoEspejoEJ() {
  if (fondoEJ) return fondoEJ;
  const c = document.createElement('canvas');
  c.width = EJ.W; c.height = EJ.H;
  const x = c.getContext('2d');
  const cielo = x.createLinearGradient(0, 0, 0, EJ.H);
  cielo.addColorStop(0, '#CDE6E2'); cielo.addColorStop(0.6, '#F7EDD6'); cielo.addColorStop(1, '#EAD8B0');
  x.fillStyle = cielo; x.fillRect(0, 0, EJ.W, EJ.H);
  const r = azarEJ(7), tintas = ['125,180,108', '255,205,140', '150,195,230', '240,165,150'];
  for (let i = 0; i < 28; i++) {   // manchas de acuarela
    const cx = r() * EJ.W, cy = r() * EJ.H * 0.75, rad = 60 + r() * 170, t = tintas[i % 4];
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(' + t + ',0.24)'); g.addColorStop(1, 'rgba(' + t + ',0)');
    x.fillStyle = g; x.fillRect(cx - rad, cy - rad, rad * 2, rad * 2);
  }
  const pasto = x.createLinearGradient(0, EJ.SUELO - 50, 0, EJ.H);
  pasto.addColorStop(0, '#BADA9F'); pasto.addColorStop(1, '#78AE66');
  x.fillStyle = pasto; x.beginPath(); x.moveTo(0, EJ.SUELO - 18);
  x.quadraticCurveTo(EJ.W / 2, EJ.SUELO - 58, EJ.W, EJ.SUELO - 18); x.lineTo(EJ.W, EJ.H); x.lineTo(0, EJ.H); x.closePath(); x.fill();
  // El espejo: vidrio claro (contraste con la silueta) y marco de madera.
  const M = { x: 380, y: 46, w: 840, h: 846, r: 70 };
  rrCp(x, M.x, M.y, M.w, M.h, M.r);
  x.fillStyle = 'rgba(255,255,255,0.62)'; x.fill();
  x.save(); x.clip();
  x.fillStyle = 'rgba(255,255,255,0.35)';
  [[M.x + 120, 150], [M.x + 330, 60]].forEach(([x0, w]) => {   // brillos diagonales del vidrio
    x.beginPath(); x.moveTo(x0, M.y); x.lineTo(x0 + w, M.y); x.lineTo(x0 + w - 380, M.y + M.h); x.lineTo(x0 - 380, M.y + M.h); x.closePath(); x.fill();
  });
  x.restore();
  rrCp(x, M.x, M.y, M.w, M.h, M.r);
  x.lineWidth = 24; x.strokeStyle = '#8A5A2E'; x.stroke();
  x.lineWidth = 6; x.strokeStyle = '#E9C68C'; x.stroke();
  fondoEJ = c;
  return c;
}

// estilo: { cuerpo, halo, brillo } · pulso: 0–1 (late con la música) · k: escala del lienzo.
function dibujarSiluetaEJ(ctx, p, estilo, pulso, k) {
  const MI = MEDIDAS_MURO, E = esqueletoMI(p);
  const reposo = MI.CADERA.y + MI.MUSLO + MI.PIERNA;
  const dy = Math.max(0, reposo - Math.max(E.pies[0].y, E.pies[1].y));   // baja la figura si levanta un pie / abre las piernas
  const abre = Math.abs(E.pies[1].x - E.pies[0].x);
  ctx.fillStyle = 'rgba(40,60,30,0.28)';   // sombra en el suelo
  ctx.beginPath(); ctx.ellipse(EJ.W / 2, EJ.SUELO + 4, 120 + abre * 0.9, 20, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.translate(EJ.W / 2, EJ.SUELO); ctx.scale(EJ.ESCALA, EJ.ESCALA); ctx.translate(-MI.CADERA.x, -MI.PIES + dy);
  ctx.shadowColor = estilo.brillo; ctx.shadowBlur = (22 + 18 * pulso) * k;
  siluetaMI(ctx, p, 9, estilo.halo);
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';
  siluetaMI(ctx, p, 0, estilo.cuerpo);
  ctx.restore();
}

// Demostración del espejo: el brazo del lado izquierdo de la pantalla sube y baja.
const poseDemoEJ = (reloj) => ({ ...NEUTRA_MURO, bi1: 100 + 70 * Math.sin(reloj / 480) });
let coreoMenuEJ = null;   // en el menú la silueta baila suave (una coreografía fija)

/* =============================== JUEGO =============================== */
function nuevoJuegoEJ(n) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, seg: null, tc: 0, coreo: null, sigPulso: 0,
    turno: 0, ronda: 1, pasa: null, ultimo: null, marcas: [], nivelVisto: 1, avisoNivel: 0,
    registrado: false, pasosDados: [],
    eq: Array.from({ length: n }, () => ({ ms: 0, turnos: 0, mejor: 0, mejorNombre: '' })),
  };
}

function EspejoEnVivo({ a, estudiantes, onContinuar }) {
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const sesion = useJaguarEstado();
  const nEq = Math.max(2, Math.min(PALETA_CAPIBARA.length, jaguarSesion().n || a.equipos || 2));
  const [provisional] = React.useState(() => jaguarSesion().equipos || jaguarRepartir(nombres, nEq));
  const equipos = sesion.equipos || provisional;
  const eqV = equiposCapibara(equipos);
  React.useEffect(() => {
    if (!jaguarSesion().equipos) cambiarJaguar(() => ({ equipos: provisional }));
    jaguarIniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rondas = limitarEJ(a.rondasEspejo, 1, 6, 1);
  const porPaso = limitarEJ(a.segPorPasoEspejo, 5, 60, 15);
  const [velocidad, setVelocidad] = React.useState(() => (EJ.BPM[a.velocidadEspejo] ? a.velocidadEspejo : 'lenta'));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [ver, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoEJ(eqV.length);
  const cfg = React.useRef({});
  cfg.current = { velocidad, rondas, porPaso, pausado, nEq: eqV.length, colores: eqV.map((e) => e.color) };
  const G = g.current;
  const seguir = React.useRef(onContinuar);
  seguir.current = onContinuar;
  const { raiz, lienzo, tam } = useLienzoCp(EJ.W, EJ.H);
  const crono = React.useRef(null);

  // ---- Reglas ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; setFase(f); };
  const quitarPausa = () => { cfg.current.pausado = false; setPausado(false); };
  const empezar = () => {
    const C = cfg.current;
    audioCapibara.despertar();
    const X = nuevoJuegoEJ(C.nEq);
    X.reloj = g.current.reloj;
    g.current = X;
    X.coreo = crearCoreografiaEJ(C.velocidad, Math.floor(Math.random() * 2147483647));   // la MISMA para todos
    X.pasa = siguienteConcursanteCp(0);
    irA('espejo'); refrescar();
  };
  const entendido = () => { if (g.current.fase === 'espejo') { irA('turno'); refrescar(); } };
  const iniciar = () => {
    const X = g.current;
    if (X.fase !== 'turno') return;
    X.tc = 0; X.nivelVisto = 1; X.avisoNivel = 0; X.ultimo = null;
    audioCapibara.despertar(); irA('cuenta'); refrescar();
  };
  // SE DESCONECTÓ: congela y guarda el tiempo (aún se puede deshacer).
  const desconecto = () => {
    const X = g.current;
    if (X.fase !== 'jugando' || cfg.current.pausado) return;
    X.ultimo = { ms: X.tc, nombre: X.pasa, quien: X.turno };
    SONIDO_EJ.desconecto(); irA('desconecto'); refrescar();
  };
  // Deshacer: se presionó por error → reanuda desde el mismo punto (tras 3, 2, 1).
  const deshacer = () => {
    const X = g.current;
    if (X.fase !== 'desconecto') return;
    X.ultimo = null; quitarPausa(); irA('cuenta'); refrescar();
  };
  const anotar = () => {
    const X = g.current, u = X.ultimo;
    if (!u) return;
    X.marcas.push({ ...u, ronda: X.ronda });
    const e = X.eq[u.quien];
    e.ms += u.ms; e.turnos += 1;
    if (u.ms > e.mejor) { e.mejor = u.ms; e.mejorNombre = u.nombre || ''; }
    X.ultimo = null;
  };
  const pasarTurno = () => {
    const X = g.current, C = cfg.current;
    const t = siguienteTurnoCp(X.turno, X.ronda, X.eq.length, C.rondas);
    if (!t) { fin(); return; }
    X.turno = t.turno; X.ronda = t.ronda; X.pasa = siguienteConcursanteCp(t.turno); X.tc = 0;
    quitarPausa(); irA('turno'); refrescar();
  };
  // Siguiente concursante: registra el tiempo del turno congelado.
  const siguiente = () => {
    const X = g.current;
    if (X.fase !== 'desconecto' && X.fase !== 'completa') return;
    anotar(); pasarTurno();
  };
  // Saltar el turno sin registrar (o, si está congelado, registrar y seguir).
  const saltar = () => {
    const X = g.current;
    if (X.fase === 'desconecto' || X.fase === 'completa') siguiente();
    else if (['turno', 'cuenta', 'jugando'].includes(X.fase)) { X.ultimo = null; pasarTurno(); }
  };
  const reiniciar = () => {
    const X = g.current;
    if (!['cuenta', 'jugando', 'desconecto'].includes(X.fase)) return;
    X.ultimo = null; X.tc = 0; quitarPausa(); irA('turno'); refrescar();
  };
  const alternarPausa = () => {
    const X = g.current;
    if (!['cuenta', 'jugando'].includes(X.fase)) return;
    const nuevo = !cfg.current.pausado;
    cfg.current.pausado = nuevo; setPausado(nuevo);
    if (!nuevo && X.fase === 'jugando') irA('cuenta');   // al seguir: 3, 2, 1 desde el mismo punto
  };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  // Final: ranking y pasos hacia Jomu (sistema existente), una sola vez por partida.
  const fin = () => {
    const X = g.current, C = cfg.current;
    quitarPausa();
    if (X.ultimo) anotar();
    if (!X.registrado) {
      X.registrado = true;
      X.pasosDados = X.eq.map((e, i) => {
        const n = Math.floor(e.ms / 1000 / C.porPaso);
        for (let k = 0; k < n; k++) jaguarPunto(i, 1);
        return n;
      });
    }
    SONIDO_EJ.fin(); irA('fin'); refrescar();
  };
  const terminar = () => { if (FASES_JUEGO_EJ.includes(g.current.fase)) fin(); };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  const principal = (desdeTeclado) => {
    const X = g.current;
    if (X.fase === 'menu') empezar();
    else if (X.fase === 'espejo') entendido();
    else if (X.fase === 'turno') iniciar();
    else if (X.fase === 'jugando') desconecto();
    else if (X.fase === 'desconecto' || X.fase === 'completa') { if (!desdeTeclado || X.reloj - X.inicio > EJ.GUARDA_MS) siguiente(); }
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguir.current();
  };

  // ---- Bucle: tiempo, música y dibujo ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current, C = cfg.current;
      if (!C.pausado) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'cuenta') {
          const seg = 3 - Math.floor(e / 1000);
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_EJ.cuenta(); refrescar(); }
          if (e >= EJ.CUENTA_MS) { SONIDO_EJ.ya(); X.sigPulso = primerPulsoEJ(X.coreo, X.tc); irA('jugando'); }
        } else if (X.fase === 'jugando') {
          X.tc += dt;
          if (e >= EJ.YA_MS && X.seg !== 'ya') { X.seg = 'ya'; refrescar(); }   // quita el «¡YA!»
          musicaEJ(X);
          if (X.tc >= X.coreo.total) {   // aguantó la coreografía completa
            X.tc = X.coreo.total; X.ultimo = { ms: X.tc, nombre: X.pasa, quien: X.turno };
            SONIDO_EJ.fin(); irA('completa'); refrescar();
          }
        }
        if (X.avisoNivel && X.reloj - X.avisoNivel > EJ.AVISO_NIVEL_MS) { X.avisoNivel = 0; refrescar(); }
      }
      const c = lienzo.current;
      if (c) {
        const ctx = c.getContext('2d'), k = c.width / EJ.W;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.drawImage(fondoEspejoEJ(), 0, 0);
        let pose, pulso = 0;
        if (X.coreo && ['turno', 'cuenta', 'jugando', 'desconecto', 'completa'].includes(X.fase)) {
          const info = poseEnEJ(X.coreo, X.tc);
          pose = info.p;
          if (X.fase === 'jugando') {
            pulso = 1 - info.fase;
            if (info.k !== X.claveVista) { X.claveVista = info.k; refrescar(); }   // nivel y ritmo en pantalla y en el celular
            if (info.nivel > X.nivelVisto) { X.nivelVisto = info.nivel; X.avisoNivel = X.reloj || 1; SONIDO_EJ.nivel(); refrescar(); }
          }
        } else if (X.fase === 'espejo') pose = poseDemoEJ(X.reloj);
        else {
          if (!coreoMenuEJ) coreoMenuEJ = crearCoreografiaEJ('lenta', 20261029);
          pose = poseEnEJ(coreoMenuEJ, X.reloj % 60000).p;
        }
        const congelado = X.fase === 'desconecto';
        const color = C.colores[X.turno] || '#FFD166';
        dibujarSiluetaEJ(ctx, pose, congelado
          ? { cuerpo: '#4E4852', halo: '#FFE3E3', brillo: 'rgba(229,57,53,0.9)' }
          : { cuerpo: '#1B1033', halo: '#FFFFFF', brillo: color }, pulso, k);
        if (congelado) {
          const e = X.reloj - X.inicio;
          ctx.fillStyle = 'rgba(229,57,53,' + Math.max(0, 0.34 - e / 1500).toFixed(3) + ')';
          ctx.fillRect(0, 0, EJ.W, EJ.H);
        }
      }
      if (crono.current) crono.current.textContent = segEJ(X.tc);
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Teclado (presentador: Av Pág = SE DESCONECTÓ, Re Pág = deshacer) ----
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const X = g.current, k = e.key, l = k.length === 1 ? k.toLowerCase() : k;
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === ' ' || k === 'Enter' || k === 'PageDown') {
        if (e.target && /button/i.test(e.target.tagName) && k !== 'PageDown' && X.fase !== 'jugando') return;
        tomar();
        if (!e.repeat) principal(true);
        return;
      }
      if (k === 'PageUp' || k === 'Backspace' || l === 'd') { if (X.fase === 'desconecto') { tomar(); deshacer(); } return; }
      if (l === 'p') { tomar(); alternarPausa(); }
      else if (l === 'r') { tomar(); reiniciar(); }
      else if (l === 'n') { tomar(); saltar(); }
      else if (l === 'm') { tomar(); alternarSilencio(); }
      else if (l === 'f') { tomar(); pantallaCompleta(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =============================== MANDO ===============================
     El celular muestra los mismos botones: SE DESCONECTÓ primero (rojo y
     grande), deshacer, iniciar, pausa, siguiente concursante… */
  const nivelAhora = G.coreo && FASES_JUEGO_EJ.includes(fase) && fase !== 'espejo' ? poseEnEJ(G.coreo, G.tc).nivel : 1;
  React.useEffect(() => {
    const X = g.current;
    fijarEstadoCapibara({
      juego: 'espejo', fase, pausado, silencio, velocidad, rondas, ronda: X.ronda, turno: X.turno, pasa: X.pasa,
      nivel: nivelAhora, seg: X.ultimo ? segEJ(X.ultimo.ms) : null,
      ultimoTurno: !siguienteTurnoCp(X.turno, X.ronda, X.eq.length, rondas),
      totales: X.eq.map((e) => segEJ(e.ms)),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pausado, silencio, velocidad, ver]);
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'ej-empezar') { if (X.fase === 'menu') empezar(); }
    else if (x === 'ej-velocidad') { if (X.fase === 'menu' && EJ.BPM[o.v]) setVelocidad(o.v); }
    else if (x === 'ej-entendido') entendido();
    else if (x === 'ej-iniciar') iniciar();
    else if (x === 'ej-desconecto') desconecto();
    else if (x === 'ej-deshacer') deshacer();
    else if (x === 'ej-siguiente') siguiente();
    else if (x === 'ej-pausa') alternarPausa();
    else if (x === 'ej-reiniciar') reiniciar();
    else if (x === 'ej-saltar') saltar();
    else if (x === 'ej-terminar') terminar();
    else if (x === 'ej-silencio') alternarSilencio();
    else if (x === 'ej-montana') verMontana();
    else if (x === 'ej-otra') otraVez();
    else if (x === 'ej-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') { if (X.fase !== 'jugando') principal(false); }
  });

  /* ================================ HUD ================================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Espejo en Vivo" />;
  const eqT = eqV[G.turno] || eqV[0];
  const enTurno = ['turno', 'cuenta', 'jugando', 'desconecto', 'completa'].includes(fase);
  const congelado = fase === 'desconecto' || fase === 'completa';
  const esUltimo = !siguienteTurnoCp(G.turno, G.ronda, G.eq.length, rondas);
  const tabla = eqV.map((e, i) => ({ ...e, i, ...G.eq[i], pasos: G.pasosDados[i] || 0 })).sort((x, y) => y.ms - x.ms);
  const ganadorI = tabla[0] && tabla[0].ms > 0 ? tabla[0].i : null;
  const empate = tabla.length > 1 && ganadorI !== null && tabla[0].ms === tabla[1].ms;
  const pasosTxt = (n) => n + (n === 1 ? ' paso' : ' pasos');
  const bpm = G.coreo && enTurno ? poseEnEJ(G.coreo, G.tc).bpm : null;

  return (
    <div className="vg-cp vg-mi vg-ej" ref={raiz} role="dialog" aria-label="Espejo en Vivo">
      <div className="vg-mi-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>
        <canvas ref={lienzo} className="vg-mi-lienzo" />

        {/* Marcador: segundos acumulados por equipo y ronda */}
        {FASES_JUEGO_EJ.includes(fase) && fase !== 'espejo' && (
          <div className="vg-mi-marcador">
            {eqV.map((e, i) => (
              <div key={i} className={'vg-mi-eq' + (i === G.turno ? ' turno' : '')} style={{ '--c': e.color }}>
                <span className="emo">{e.emoji}</span><b>{segEJ(G.eq[i].ms)}</b>
              </div>
            ))}
            <div className="vg-mi-ronda">Ronda {G.ronda}/{rondas}</div>
          </div>
        )}

        {/* Cronómetro grande (tiempo aguantado) */}
        {enTurno && (
          <div className={'vg-ej-crono' + (congelado ? ' congelado' : '')} style={{ '--c': eqT.color }} aria-label="Tiempo aguantado">
            <span className="ico" aria-hidden="true">⏱</span><b ref={crono}>{segEJ(G.tc)}</b><small>s</small>
          </div>
        )}
        {/* Nivel y ritmo */}
        {enTurno && bpm && (
          <div className="vg-ej-nivel">Nivel {nivelAhora} · {nivelAhora === 1 ? '1 parte' : nivelAhora + ' partes'} · ♩ {bpm}</div>
        )}
        {/* Quién está frente al espejo */}
        {enTurno && (
          <div className="vg-ej-quien" style={{ '--c': eqT.color }}>
            <span className="emo">{eqT.emoji}</span> {eqT.corto}{G.pasa ? ' · ' + G.pasa : ''}
          </div>
        )}
        {/* Lados del espejo (siempre visibles mientras se juega) */}
        {(enTurno || fase === 'espejo') && (
          <React.Fragment>
            <div className="vg-ej-lado izq">◀ tu izquierda</div>
            <div className="vg-ej-lado der">tu derecha ▶</div>
          </React.Fragment>
        )}

        {/* Botones (también en el celular). SE DESCONECTÓ: el más grande. */}
        {enTurno && fase !== 'turno' && (
          <div className="vg-mi-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {(fase === 'cuenta' || fase === 'jugando') && <button type="button" onClick={alternarPausa} title="Pausa (P)">⏸</button>}
            {fase === 'jugando' && <button type="button" className="falla vg-ej-desconecto" onClick={desconecto} title="Se desconectó (Espacio o Av Pág)">🔌 SE DESCONECTÓ</button>}
          </div>
        )}

        {/* Cuenta regresiva (al empezar y al reanudar) */}
        {fase === 'cuenta' && <div key={'c' + G.seg} className="vg-ej-cuenta">{G.seg || 3}</div>}
        {fase === 'jugando' && G.seg !== 'ya' && <div className="vg-ej-cuenta ya">¡YA!</div>}

        {/* ¡Nivel nuevo! */}
        {fase === 'jugando' && G.avisoNivel > 0 && (
          <div className="vg-ej-aviso-nivel">¡Nivel {G.nivelVisto}! <small>{G.nivelVisto} partes a la vez · más rápido</small></div>
        )}

        {/* Explicación del espejo (al inicio de la partida) */}
        {fase === 'espejo' && (
          <div className="vg-ej-panel">
            <h2>🪞 ¡Eres su espejo!</h2>
            <p>La silueta te mira de frente: si mueve el brazo de <b>este lado ◀</b>, tú mueves tu brazo <b>izquierdo</b>.</p>
            <p>Su derecha es tu izquierda, como en un espejo. Muévete con ella, suave y sin parar.</p>
            <p className="nota">Todos siguen la misma coreografía. Irá más rápido y moverá más partes a la vez.</p>
            <button type="button" className="vg-cp-btn grande" onClick={entendido}>✓ ¡Entendido!</button>
          </div>
        )}

        {/* Turno: pasa al frente */}
        {fase === 'turno' && (
          <div className="vg-ej-panel" style={{ '--c': eqT.color }}>
            <div className="vg-mi-emo-grande">{eqT.emoji}</div>
            <h2 className="turno">Turno del {eqT.nombre}</h2>
            <p className="pasa">{G.pasa ? <React.Fragment>Pasa al frente: <strong>{G.pasa}</strong></React.Fragment> : 'Pasa al frente un estudiante del equipo'}</p>
            <p>Ponte frente al espejo y síguelo. ¡No te desconectes!</p>
            <button type="button" className="vg-cp-btn grande" onClick={iniciar}>▶ Iniciar</button>
          </div>
        )}

        {/* Congelado: tiempo aguantado, deshacer y siguiente */}
        {congelado && G.ultimo && (
          <div className="vg-ej-panel congelado" style={{ '--c': eqT.color }}>
            <h2>{fase === 'completa' ? '🏆 ¡Coreografía completa!' : '🔌 ¡Se desconectó!'}</h2>
            <div className="vg-ej-total">{segEJ(G.ultimo.ms)}<small>segundos aguantados</small></div>
            {G.ultimo.nombre && <p>{eqT.emoji} {G.ultimo.nombre}</p>}
            <div className="vg-mi-columna">
              {fase === 'desconecto' && <button type="button" className="vg-cp-btn suave" onClick={deshacer} title="Re Pág o D">↩ Deshacer (fue un error)</button>}
              <button type="button" className="vg-cp-btn grande" onClick={siguiente} title="N">{esUltimo ? '🏁 Ver resultados' : '▶ Siguiente concursante'}</button>
            </div>
          </div>
        )}

        {pausado && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>Pausa</h2>
              <div className="vg-mi-columna">
                <button type="button" className="vg-cp-btn grande" onClick={alternarPausa}>▶ Seguir (3, 2, 1)</button>
                <button type="button" className="vg-cp-btn suave" onClick={reiniciar}>↻ Reiniciar turno (R)</button>
                <button type="button" className="vg-cp-btn suave" onClick={saltar}>⏭ Saltar turno (N)</button>
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
              </div>
            </div>
          </div>
        )}

        {/* Menú */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · {rondas} {rondas === 1 ? 'ronda' : 'rondas'}</div>
              <h1 className="vg-mi-titulo vg-ej-titulo">🪞 Espejo en Vivo 🪞</h1>
              <p className="vg-mi-intro">Una silueta se mueve lenta y sin parar. Un concursante por equipo la sigue como un espejo… ¡gana quien aguante más tiempo conectado!</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-mi-ajuste">
                <span>Velocidad inicial</span>
                {VELOCIDADES_EJ.map(([v, txt]) => (
                  <button key={v} type="button" className={'vg-jn-vel' + (velocidad === v ? ' on' : '')} onClick={() => setVelocidad(v)}>{txt}</button>
                ))}
              </div>
              <p className="vg-mi-intro">1 paso hacia Jomu cada {porPaso} s aguantados (suma del equipo)</p>
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final: ranking y pasos */}
        {fase === 'fin' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta fin">
              <h1 className="vg-mi-titulo">{ganadorI === null ? '¡Fin del juego!' : empate ? '¡Empate!' : eqV[ganadorI].emoji + ' ¡Ganó el ' + eqV[ganadorI].nombre + '!'}</h1>
              <TablaFinalCp filas={tabla.map((e) => ({
                ...e, puntos: segEJ(e.ms) + ' s',
                detalle: (e.mejorNombre ? 'mejor: ' + e.mejorNombre + ' (' + segEJ(e.mejor) + ' s) · ' : '') + '+' + pasosTxt(e.pasos),
              }))} />
              {ganadorI !== null && !empate && a.enlace && equipos[ganadorI] && (
                <EnlaceJaguar enlace={a.enlace} equipo={equipos[ganadorI]} i={ganadorI} id={a.id} />
              )}
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={otraVez}>↻ Jugar otra vez</button>
                <button type="button" className="vg-cp-btn grande" onClick={verMontana}>🏔 Ver la montaña</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { EspejoEnVivo });
