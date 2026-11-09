/* capibara-ritmo.jsx — Modo Capibara · «Ritmo y Memoria» (cp-ritmo).

   Estilo Simon con el cuerpo: la pantalla muestra una secuencia de
   movimientos, uno por uno (figura enorme, nombre y un sonido propio). Luego
   queda en blanco, con un pulso rítmico de fondo, y el concursante la repite
   completa con el cuerpo. El docente marca ✓ correcto o ✗ incorrecto
   (pantalla, teclado o celular): si es correcto, la secuencia crece en un
   movimiento y se vuelve a mostrar completa; si es incorrecto, termina su turno.
   Puntaje del concursante = la secuencia más larga que completó.

   · Al empezar solo hay 3 movimientos; cada `a.desbloqueoRitmo` rondas
     (2) se suma el siguiente del banco (se anuncia en grande).
   · JUSTICIA: cada concursante recibe una secuencia NUEVA (así nadie la vio
     antes), con el mismo largo por ronda y los movimientos nuevos en las
     mismas rondas: igual de difícil para todos.
   · Turnos: un concursante por equipo en cada vuelta (`a.rondasRitmo`, 1),
     elegido sin repetir con `siguienteConcursanteCp` (capibara-comun.jsx).
   · «Repetir secuencia»: una vez por turno.
   · Velocidad de presentación ajustable (`a.velocidadRitmo`; también en el
     menú, en cada turno, en la pausa y desde el celular).
   · Al terminar: ranking por equipo (suma de sus concursantes) y
     `a.pasosRitmo` pasos hacia Jomu para el ganador (`jaguarPunto`); luego
     el enlace y la montaña.

   Atajos: Espacio / Enter / → / Av Pág = acción principal (al repetir: ✓),
   X / ← / Re Pág = ✗ incorrecto, R repetir secuencia, P pausa, N siguiente
   concursante, M silencio, F pantalla completa.
   Mando: `capibara = { juego: 'ritmo', … }` (el celular ve la secuencia para
   juzgar), órdenes `rt-*`.

   Secciones: BANCO DE MOVIMIENTOS · FIGURAS · CONFIGURACIÓN · SECUENCIA ·
   COMPONENTE (estado, reloj, teclado, mando, interfaz). */

/* ======================== BANCO DE MOVIMIENTOS ========================
   Percusión corporal: cada movimiento es un golpe que suena (seguro para un
   salón). NO repetir acciones de otros juegos del Capibara (Jungla: saltar,
   agacharse…; Semáforo: girar, brazos arriba, manos a la cabeza…).
   Los 3 primeros son los del inicio; los demás se desbloquean EN ESTE ORDEN.
   Para ampliar el banco, sumar al final (con su figura en FIGURAS_RT y un
   sonido distinto). */
const BANCO_RITMO = [
  { id: 'aplauso', nombre: 'Aplauso', color: '#D99A00',
    sonido: () => [0, 0.11].forEach((t) => audioCapibara.ruido(0.06, 0.45, 3200, t)) },
  { id: 'pisoton', nombre: 'Pisotón', color: '#D9692A',
    sonido: () => { audioCapibara.tono(110, 0.35, 'sine', 0.38, 0, 45); audioCapibara.ruido(0.15, 0.3, 300); } },
  { id: 'piernas', nombre: 'Palmas en piernas', color: '#3E9B4F',
    sonido: () => [0, 0.12].forEach((t) => audioCapibara.ruido(0.07, 0.4, 900, t)) },
  { id: 'rodillas', nombre: 'Tocar rodillas', color: '#2F78C4',
    sonido: () => [220, 196].forEach((f, i) => audioCapibara.tono(f, 0.12, 'triangle', 0.22, i * 0.14)) },
  { id: 'hombros', nombre: 'Tocar hombros', color: '#7D5CC4',
    sonido: () => [660, 587].forEach((f, i) => audioCapibara.tono(f, 0.1, 'square', 0.08, i * 0.14)) },
  { id: 'pecho', nombre: 'Golpes en el pecho', color: '#C9403A',
    sonido: () => [0, 0.16].forEach((t) => audioCapibara.tono(95, 0.16, 'sine', 0.4, t, 60)) },
  { id: 'barriga', nombre: 'Palmas en la barriga', color: '#C94F92',
    sonido: () => audioCapibara.tono(330, 0.32, 'triangle', 0.2, 0, 160) },
  { id: 'atras', nombre: 'Aplauso atrás', color: '#139485',
    sonido: () => { audioCapibara.ruido(0.05, 0.4, 5200); audioCapibara.tono(880, 0.12, 'sine', 0.1, 0.06, 1320); } },
];

/* ============================== FIGURAS ==============================
   Figura de palitos (SVG propio, trazo grueso, color del texto) para cada
   movimiento. Caja 200 × 280: cabeza en (100, 38), hombros en (100, 78),
   cadera en (100, 150). brazos/piernas: [codo|rodilla, mano|pie] izquierdo y
   derecho (vistos desde el frente). dy: subir la figura (salto). marcas:
   trazos extra (chispas, flechas, golpe) en el color del movimiento. */
const HOMBRO_RT = [100, 78], CADERA_RT = [100, 150];
const PIERNAS_RT = [[[88, 200], [84, 252]], [[112, 200], [116, 252]]];
const FIGURAS_RT = {
  aplauso: { brazos: [[[66, 110], [96, 94]], [[134, 110], [104, 94]]], piernas: PIERNAS_RT,
    marcas: 'M76,66 L66,52 M100,62 L100,46 M124,66 L134,52' },
  pisoton: { brazos: [[[72, 116], [60, 150]], [[128, 116], [140, 150]]], piernas: [[[88, 200], [84, 252]], [[120, 196], [128, 252]]],
    marcas: 'M104,268 L92,280 M128,266 L128,282 M152,268 L164,280' },
  piernas: { brazos: [[[62, 116], [80, 172]], [[138, 116], [120, 172]]], piernas: PIERNAS_RT,
    marcas: 'M60,166 L46,160 M60,180 L46,186 M140,166 L154,160 M140,180 L154,186' },
  rodillas: { brazos: [[[64, 136], [86, 196]], [[136, 136], [114, 196]]], piernas: [[[86, 200], [84, 252]], [[114, 200], [116, 252]]],
    marcas: 'M70,206 A10,10 0 1 0 70,205.9 M130,206 A10,10 0 1 0 130,205.9' },
  hombros: { brazos: [[[56, 104], [84, 78]], [[144, 104], [116, 78]]], piernas: PIERNAS_RT },
  pecho: { brazos: [[[58, 120], [90, 98]], [[142, 120], [110, 98]]], piernas: PIERNAS_RT,
    marcas: 'M100,84 L100,70 M84,88 L76,76 M116,88 L124,76' },
  barriga: { brazos: [[[60, 140], [92, 130]], [[140, 140], [108, 130]]], piernas: PIERNAS_RT,
    marcas: 'M100,118 A14,14 0 1 0 100,117.9' },
  atras: { brazos: [[[62, 122], [88, 150]], [[138, 122], [112, 150]]], piernas: PIERNAS_RT,
    marcas: 'M150,140 A60,40 0 0 1 50,140 M50,140 L58,124 M50,140 L66,146' },
};
function FiguraRT({ id, className }) {
  const f = FIGURAS_RT[id] || FIGURAS_RT.aplauso;
  const dy = f.dy || 0;
  const linea = (desde, [m, fin]) => 'M' + desde[0] + ',' + desde[1] + ' L' + m[0] + ',' + m[1] + ' L' + fin[0] + ',' + fin[1];
  return (
    <svg className={className} viewBox="0 -14 200 300" aria-hidden="true">
      <g transform={'translate(0 ' + dy + ')'} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="100" cy="38" r="24" fill="currentColor" stroke="none" />
        <path d={'M100,62 L' + CADERA_RT[0] + ',' + CADERA_RT[1]} />
        {f.brazos.map((b, k) => <path key={'b' + k} d={linea(HOMBRO_RT, b)} />)}
        {f.piernas.map((p, k) => <path key={'p' + k} d={linea(CADERA_RT, p)} />)}
      </g>
      {f.marcas && <path d={f.marcas} fill="none" stroke="var(--rt, currentColor)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  );
}

/* =========================== CONFIGURACIÓN =========================== */
const RT = {
  INICIO: 2,          // movimientos de la primera secuencia
  BASE: 3,            // movimientos disponibles al empezar
  LARGO: 40,          // largo máximo de la secuencia (se genera completa al empezar cada turno)
  MIRA_MS: 900,       // «¡Mira!» antes de la secuencia
  NUEVO_MS: 3200,     // anuncio de un movimiento nuevo
  BIEN_MS: 1000,      // «¡Bien!» entre secuencias
  VEL: { lenta: 1500, media: 1100, rapida: 800 },   // ms por movimiento
  VISIBLE: 0.78,      // parte del tiempo de cada movimiento en que se ve (luego, pausa breve)
};

/* ============================== SECUENCIA ==============================
   Ronda k del turno (1, 2, 3…) = secuencia de RT.INICIO + k − 1 movimientos.
   Disponibles en la ronda k = 3 + ⌊(k − 1) / cada⌋ (hasta el total del banco).
   Cuando en una ronda se desbloquea un movimiento, el que se suma a la
   secuencia es justamente ese (así todos lo ven en el mismo momento). */
const disponiblesRT = (k, cada) => Math.min(BANCO_RITMO.length, RT.BASE + Math.floor((k - 1) / cada));
const largoRT = (k) => RT.INICIO + k - 1;
function crearSecuenciaRT(cada) {
  const s = [];
  for (let j = 0; j < RT.LARGO; j++) {
    const k = Math.max(1, j - RT.INICIO + 2);   // ronda en que aparece la posición j
    const n = disponiblesRT(k, cada);
    if (k > 1 && n > disponiblesRT(k - 1, cada)) { s.push(n - 1); continue; }
    let m;
    do { m = Math.floor(Math.random() * n); } while (n > 1 && m === s[j - 1]);
    s.push(m);
  }
  return s;
}
function nuevoJuegoRT(cada, nEq) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, seg: null, hueco: false, secuencia: crearSecuenciaRT(cada),
    turno: -1, ronda: 1, nombre: null, k: 1, mejor: 0, repetido: false,
    puntajes: Array.from({ length: nEq }, () => 0), detalles: Array.from({ length: nEq }, () => []),
    ganadores: [], registrado: false, ultimo: null,
  };
}
const enTurnoRT = (f) => ['turno', 'nuevo', 'muestra', 'repite', 'bien', 'falla'].includes(f);
const corriendoRT = (f) => f === 'nuevo' || f === 'muestra' || f === 'repite' || f === 'bien';

/* ============================ COMPONENTE ============================ */
function RitmoMemoria({ a, estudiantes, onContinuar }) {
  const { sesion, equipos, eqV } = useEquiposCp(a, estudiantes);
  // ---- Ajustes (editor y menú) ----
  const pasos = limitarCp(a.pasosRitmo, 1, 10, 3);
  const cada = limitarCp(a.desbloqueoRitmo, 1, 6, 2);
  const [vel, setVel] = React.useState(() => (RT.VEL[a.velocidadRitmo] ? a.velocidadRitmo : 'media'));
  const [rondas, setRondas] = React.useState(() => limitarCp(a.rondasRitmo, 1, 5, 1));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoRT(cada, eqV.length);
  const cfg = React.useRef({});
  cfg.current = { vel, rondas, pausado, nEq: eqV.length, cada };
  const G = g.current;
  const seguirJuego = React.useRef(onContinuar);
  seguirJuego.current = onContinuar;
  const { raiz, tam } = useLienzoCp(1600, 900);

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; X.hueco = false; setFase(f); };
  const paso = () => RT.VEL[cfg.current.vel] || RT.VEL.media;
  // Siguiente concursante: el siguiente equipo en orden (y su vuelta); si no queda, el final.
  const siguienteTurno = () => {
    const X = g.current;
    const t = siguienteTurnoCp(X.turno, X.ronda, cfg.current.nEq, cfg.current.rondas);
    if (!t) { fin(); return; }
    X.turno = t.turno; X.ronda = t.ronda;
    X.nombre = siguienteConcursanteCp(t.turno);
    X.k = 1; X.mejor = 0; X.repetido = false; X.ultimo = null;
    X.secuencia = crearSecuenciaRT(cfg.current.cada);   // secuencia nueva: igual de difícil, nadie la vio antes
    irA('turno'); refrescar();
  };
  const empezar = () => {
    if (g.current.fase !== 'menu') return;
    audioCapibara.despertar();
    const X = nuevoJuegoRT(cfg.current.cada, cfg.current.nEq);
    X.reloj = g.current.reloj; g.current = X;
    siguienteTurno();
  };
  // Mostrar la secuencia de la ronda (antes, el anuncio si entra un movimiento nuevo).
  const mostrar = (conAnuncio) => {
    const X = g.current, C = cfg.current;
    if (conAnuncio && X.k > 1 && disponiblesRT(X.k, C.cada) > disponiblesRT(X.k - 1, C.cada)) {
      SONIDO_CP.ganador(); irA('nuevo'); refrescar(); return;
    }
    irA('muestra'); refrescar();
  };
  const iniciarTurno = () => { if (g.current.fase === 'turno' && !cfg.current.pausado) { audioCapibara.despertar(); mostrar(true); } };
  const saltarAnuncio = () => { if (g.current.fase === 'nuevo' && !cfg.current.pausado) mostrar(false); };
  // Fin del turno: el puntaje del concursante queda en su equipo.
  const cerrarTurno = () => {
    const X = g.current;
    X.puntajes[X.turno] += X.mejor;
    X.detalles[X.turno].push((X.nombre || 'Concursante') + ' ' + X.mejor);
    irA('falla'); refrescar();
  };
  const correcto = () => {
    const X = g.current;
    if (X.fase !== 'repite' || cfg.current.pausado) return;
    X.mejor = largoRT(X.k);
    SONIDO_CP.corrige();
    if (largoRT(X.k) >= RT.LARGO) { X.ultimo = 'completa'; SONIDO_CP.ganador(); cerrarTurno(); return; }
    X.k += 1; irA('bien'); refrescar();
  };
  const incorrecto = () => {
    const X = g.current;
    if (X.fase !== 'repite' || cfg.current.pausado) return;
    X.ultimo = 'fallo'; SONIDO_CP.elimina(); cerrarTurno();
  };
  const repetir = () => {
    const X = g.current;
    if (X.fase !== 'repite' || X.repetido || cfg.current.pausado) return;
    X.repetido = true; mostrar(false);
  };
  // «Siguiente concursante»: desde el final del turno, o cortando el turno (vale lo que llevaba).
  const siguiente = () => {
    const X = g.current;
    if (cfg.current.pausado) { cfg.current.pausado = false; setPausado(false); }
    if (X.fase === 'falla') siguienteTurno();
    else if (enTurnoRT(X.fase)) { X.ultimo = 'saltado'; cerrarTurno(); }
  };
  const pausar = () => {
    if (!corriendoRT(g.current.fase) || cfg.current.pausado) return;
    cfg.current.pausado = true; setPausado(true); SONIDO_CP.pausa();
  };
  // Al seguir: si se estaba mostrando la secuencia, se muestra desde el principio.
  const seguir = () => {
    if (!cfg.current.pausado) return;
    cfg.current.pausado = false; setPausado(false);
    if (g.current.fase === 'muestra') irA('muestra');
    refrescar();
  };
  const alternarPausa = () => (cfg.current.pausado ? seguir() : pausar());
  // Final: gana el equipo con más movimientos completados (empate = pasos para todos los empatados).
  const fin = () => {
    const X = g.current;
    const max = Math.max(0, ...X.puntajes);
    X.ganadores = max > 0 ? X.puntajes.map((p, k) => (p === max ? k : -1)).filter((k) => k >= 0) : [];
    if (!X.registrado && X.ganadores.length) { X.registrado = true; X.ganadores.forEach((k) => jaguarPunto(k, pasos)); }
    cfg.current.pausado = false; setPausado(false);
    SONIDO_CP.ganador(); irA('fin'); refrescar();
  };
  const terminar = () => {
    const X = g.current;
    if (!enTurnoRT(X.fase)) return;
    if (X.fase !== 'falla' && X.fase !== 'turno') cerrarTurno();   // el turno en curso cuenta
    fin();
  };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const cambiarRondas = (d) => { if (g.current.fase === 'menu') setRondas((r) => Math.max(1, Math.min(5, r + d))); };
  const principal = () => {
    const X = g.current;
    if (cfg.current.pausado) seguir();
    else if (X.fase === 'menu') empezar();
    else if (X.fase === 'turno') iniciarTurno();
    else if (X.fase === 'nuevo') saltarAnuncio();
    else if (X.fase === 'repite') correcto();
    else if (X.fase === 'falla') siguienteTurno();
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguirJuego.current();
  };

  // ---- Reloj: anuncio, secuencia (un sonido por movimiento), pulso y «¡Bien!» ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current;
      if (!cfg.current.pausado && corriendoRT(X.fase)) {
        X.reloj += dt;
        const e = X.reloj - X.inicio, ms = paso();
        if (X.fase === 'nuevo') {
          if (e >= RT.NUEVO_MS) mostrar(false);
        } else if (X.fase === 'muestra') {
          const largo = largoRT(X.k);
          const j = e < RT.MIRA_MS ? -1 : Math.floor((e - RT.MIRA_MS) / ms);
          if (j !== X.seg) {
            X.seg = j; X.hueco = false;
            if (j >= 0 && j < largo) BANCO_RITMO[X.secuencia[j]].sonido();
            refrescar();
          }
          if (j >= largo) irA('repite');
          else if (j >= 0 && !X.hueco && (e - RT.MIRA_MS) % ms > ms * RT.VISIBLE) { X.hueco = true; refrescar(); }
        } else if (X.fase === 'repite') {
          // Pulso rítmico: un golpe suave por tiempo (más fuerte cada 4).
          const b = Math.floor(e / ms);
          if (b !== X.seg) { X.seg = b; audioCapibara.tono(b % 4 === 0 ? 150 : 120, 0.12, 'sine', b % 4 === 0 ? 0.22 : 0.12, 0, 50); refrescar(); }
        } else if (X.fase === 'bien') {
          if (e >= RT.BIEN_MS) mostrar(true);
        }
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Teclado ----
  React.useEffect(() => {
    const onKey = (e) => {
      if (enCampoCp(e)) return;
      const k = e.key, l = k && k.length === 1 ? k.toUpperCase() : '';
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === ' ' || k === 'Enter' || k === 'PageDown' || k === 'ArrowRight') {
        if (e.target && /button/i.test(e.target.tagName) && (k === ' ' || k === 'Enter')) return;   // el botón enfocado ya responde
        tomar(); if (!e.repeat) principal(); return;
      }
      if (k === 'PageUp' || k === 'ArrowLeft' || l === 'X') { tomar(); if (!e.repeat) incorrecto(); return; }
      if (l === 'R') { tomar(); repetir(); }
      else if (l === 'P') { tomar(); alternarPausa(); }
      else if (l === 'N') { tomar(); siguiente(); }
      else if (l === 'M') { tomar(); alternarSilencio(); }
      else if (l === 'F') { tomar(); pantallaCompletaCp(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: estado y órdenes. El celular ve la secuencia (para juzgar). ----
  const largo = largoRT(G.k);
  const verSecuencia = ['muestra', 'repite', 'bien'].includes(fase);
  const nuevoMov = BANCO_RITMO[disponiblesRT(G.k, cada) - 1];
  usePublicarCp({
    juego: 'ritmo', fase, pausado, silencio, vel, rondas, ronda: G.ronda, turno: G.turno, nombre: G.nombre,
    largo, mejor: G.mejor, repetido: G.repetido, ultimo: G.ultimo, puntajes: G.puntajes,
    secuencia: verSecuencia ? G.secuencia.slice(0, largo).map((m) => BANCO_RITMO[m].nombre) : [],
    nuevo: fase === 'nuevo' ? nuevoMov.nombre : null, ganadores: G.ganadores,
    ultimoTurno: fase === 'falla' && !siguienteTurnoCp(G.turno, G.ronda, eqV.length, rondas),
    eqs: eqV.map((e) => ({ corto: e.corto, emoji: e.emoji, color: e.color })),
  });
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'rt-empezar') empezar();
    else if (x === 'rt-velocidad') { if (RT.VEL[o.v]) setVel(o.v); }
    else if (x === 'rt-rondas') cambiarRondas(Number(o.d) || 0);
    else if (x === 'rt-iniciar') { if (X.fase === 'turno') iniciarTurno(); else saltarAnuncio(); }
    else if (x === 'rt-correcto') correcto();
    else if (x === 'rt-incorrecto') incorrecto();
    else if (x === 'rt-repetir') repetir();
    else if (x === 'rt-pausa') alternarPausa();
    else if (x === 'rt-siguiente') siguiente();
    else if (x === 'rt-terminar') terminar();
    else if (x === 'rt-silencio') alternarSilencio();
    else if (x === 'rt-montana') verMontana();
    else if (x === 'rt-otra') otraVez();
    else if (x === 'rt-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });

  /* ============================ INTERFAZ ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Ritmo y Memoria" />;
  const eqT = G.turno >= 0 ? eqV[G.turno] : null;
  const e = G.reloj - G.inicio;
  const ms = paso();
  const j = fase === 'muestra' && e >= RT.MIRA_MS ? Math.floor((e - RT.MIRA_MS) / ms) : -1;
  const movAhora = j >= 0 && j < largo && !G.hueco ? BANCO_RITMO[G.secuencia[j]] : null;
  const filas = eqV.map((q, i) => ({ ...q, i, puntos: G.puntajes[i], detalle: G.detalles[i].join(' · ') || 'sin turnos' }))
    .sort((x, y) => y.puntos - x.puntos);
  const velocidades = [['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']];
  const activos = BANCO_RITMO.slice(0, RT.BASE);

  return (
    <div className={'vg-cp vg-mi vg-rt fase-' + fase} ref={raiz} role="dialog" aria-label="Ritmo y Memoria"
      style={movAhora ? { '--rt': movAhora.color } : eqT ? { '--rt': eqT.color } : undefined}>
      <div className="vg-mi-escenario vg-rt-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>

        {/* Arriba: turno, vuelta y largo de la secuencia */}
        {enTurnoRT(fase) && eqT && (
          <div className="vg-ep-hud" style={{ '--c': eqT.color }}>
            {eqT.emoji} {eqT.corto}{G.nombre ? ' · ' + G.nombre : ''} · vuelta {G.ronda}/{rondas} · {largo} movimientos{G.mejor ? ' · récord ' + G.mejor : ''}
          </div>
        )}

        {/* La secuencia, uno por uno */}
        {fase === 'muestra' && (
          <div className="vg-rt-muestra">
            {j < 0 && <div className="vg-rt-mira">👀 ¡Mira!</div>}
            {movAhora && (
              <div key={j} className="vg-rt-mov" style={{ '--rt': movAhora.color }}>
                <FiguraRT id={movAhora.id} className="vg-rt-figura" />
                <div className="vg-rt-nombre">{movAhora.nombre}</div>
              </div>
            )}
            <div className="vg-rt-puntos" aria-label={'Movimiento ' + Math.max(0, j + 1) + ' de ' + largo}>
              {Array.from({ length: largo }, (_, q) => <i key={q} className={q < j || (q === j && movAhora) ? 'on' : q === j ? 'ya' : ''}></i>)}
            </div>
          </div>
        )}

        {/* Repetir con el cuerpo: pantalla en blanco con un pulso */}
        {fase === 'repite' && (
          <div className="vg-rt-repite">
            {/* Un latido por tiempo (la animación dura lo mismo que un movimiento) */}
            <div key={'p' + G.seg} className={'vg-rt-pulso' + (G.seg % 4 === 0 ? ' fuerte' : '')} style={{ animationDuration: ms + 'ms' }}></div>
            <div className="vg-rt-tuturno">¡Tu turno! Repite los <b>{largo}</b> movimientos</div>
            <div className="vg-rt-juez">
              <button type="button" className="vg-cp-btn vg-rt-no" onClick={incorrecto} title="Incorrecto (X, ← o Re Pág)">✗ Incorrecto</button>
              {!G.repetido && <button type="button" className="vg-cp-btn suave" onClick={repetir} title="Repetir la secuencia una vez (R)">↻ Repetir secuencia (1 vez)</button>}
              <button type="button" className="vg-cp-btn grande" onClick={correcto} title="Correcto (Espacio, → o Av Pág)">✓ Correcto</button>
            </div>
          </div>
        )}

        {/* ¡Bien! La secuencia crece */}
        {fase === 'bien' && <div className="vg-rt-bien">¡Bien! <small>Ahora {largo} movimientos</small></div>}

        {/* Movimiento nuevo */}
        {fase === 'nuevo' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <div className="vg-cp-kicker">✨ ¡Movimiento nuevo!</div>
              <div className="vg-rt-mov chico" style={{ '--rt': nuevoMov.color }}>
                <FiguraRT id={nuevoMov.id} className="vg-rt-figura" />
                <div className="vg-rt-nombre">{nuevoMov.nombre}</div>
              </div>
              <button type="button" className="vg-cp-btn grande" onClick={saltarAnuncio}>▶ ¡Entendido!</button>
            </div>
          </div>
        )}

        {/* Turno: quién pasa */}
        {fase === 'turno' && eqT && !pausado && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta turno" style={{ '--c': eqT.color }}>
              <div className="vg-cp-kicker">🥁 Ritmo y Memoria · vuelta {G.ronda} de {rondas}</div>
              <div className="vg-mi-emo-grande" aria-hidden="true">{eqT.emoji}</div>
              <h2>{eqT.nombre}</h2>
              <p className="pasa">{G.nombre ? '¡Pasa ' + G.nombre + '!' : 'Pasa un concursante del equipo'}</p>
              <p className="vg-mi-intro">Mira la secuencia y repítela completa con tu cuerpo. Cada vez que aciertes, se suma un movimiento.</p>
              <OpcionesCp etiqueta="Velocidad" valor={vel} onElegir={setVel} opciones={velocidades} />
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={siguiente}>⏭ Saltar turno</button>
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
                <button type="button" className="vg-cp-btn grande" onClick={iniciarTurno}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Fin del turno */}
        {fase === 'falla' && eqT && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta turno" style={{ '--c': eqT.color }}>
              <div className="vg-cp-kicker">{G.ultimo === 'completa' ? '🏆 ¡Secuencia completa!' : G.ultimo === 'saltado' ? '⏭ Turno terminado' : '✗ Fin del turno'}</div>
              <h2>{eqT.emoji} {G.nombre || eqT.nombre}</h2>
              <p className="vg-mi-resultado">Completó {G.mejor} {G.mejor === 1 ? 'movimiento' : 'movimientos'}</p>
              <div className="vg-rt-marcador">
                {eqV.map((q, i) => <span key={i} style={{ '--c': q.color }}>{q.emoji} {q.corto} <b>{G.puntajes[i]}</b></span>)}
              </div>
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
                <button type="button" className="vg-cp-btn grande" onClick={siguienteTurno}>
                  {siguienteTurnoCp(G.turno, G.ronda, eqV.length, rondas) ? '▶ Siguiente concursante' : '🏁 Ver resultados'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botones (también en el celular) */}
        {corriendoRT(fase) && !pausado && (
          <div className="vg-mi-botones vg-ep-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            <button type="button" onClick={siguiente} title="Siguiente concursante (N)">⏭</button>
            <button type="button" onClick={pausar} title="Pausa (P)">⏸</button>
          </div>
        )}

        {/* Pausa */}
        {pausado && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>⏸ Pausa</h2>
              <OpcionesCp etiqueta="Velocidad" valor={vel} onElegir={setVel} opciones={velocidades} />
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={siguiente}>⏭ Siguiente concursante</button>
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
                <button type="button" className="vg-cp-btn grande" onClick={seguir}>{fase === 'muestra' ? '▶ Seguir (se muestra de nuevo)' : '▶ Seguir'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Menú */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · gana el equipo con más movimientos (+{pasos} pasos)</div>
              <h1 className="vg-mi-titulo">🥁 Ritmo y Memoria</h1>
              <p className="vg-mi-intro">Mira la secuencia de movimientos y repítela con tu cuerpo. Si aciertas, se suma uno más… ¿hasta dónde llegas? Cada concursante tiene su <b>propia</b> secuencia, igual de difícil.</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-rt-banco">
                {activos.map((m) => (
                  <div key={m.id} className="vg-rt-tile" style={{ '--rt': m.color }}><FiguraRT id={m.id} className="vg-rt-figura" /><span>{m.nombre}</span></div>
                ))}
              </div>
              <p className="vg-ep-nota">Empiezan con estos 3. Cada {cada} {cada === 1 ? 'ronda' : 'rondas'} se suma uno: {BANCO_RITMO.slice(RT.BASE).map((m) => m.nombre.toLowerCase()).join(', ')}.</p>
              <div className="vg-mi-fila">
                <OpcionesCp valor={vel} onElegir={setVel} opciones={velocidades} />
                <AjusteCp etiqueta="Concursantes por equipo" valor={rondas} min={1} max={5} onCambiar={cambiarRondas} />
              </div>
              <div className="vg-mi-fila">
                <BotonSonidoCp silencio={silencio} onCambiar={alternarSilencio} />
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final: ranking y pasos */}
        {fase === 'fin' && (
          <FinJuegoCp a={a} equipos={equipos} eqV={eqV} ganadores={G.ganadores} pasos={pasos} filas={filas} titulo="🥁 Ritmo y Memoria · movimientos completados"
            puedeDeshacer={false} onOtra={otraVez} onMontana={verMontana} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { RitmoMemoria, BANCO_RITMO, FiguraRT });
