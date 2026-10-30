/* capibara-semaforo.jsx — Modo Capibara · «Semáforo» (cp-semaforo).

   Toda la pantalla se llena de un color y cada color es una acción
   (verde = moverse en el sitio, rojo = congelarse…). Cada `a.cambiosSemaforo`
   cambios se desbloquea un color nuevo, anunciado en grande antes de seguir.
   La duración de cada color es al azar y baja con el nivel; desde el 2.º color
   nuevo aparecen colores «trampa» que parpadean sin cambiar del todo
   (`a.trampasSemaforo`). Quien se equivoque o tarde demasiado, se sienta.
   Colores propios del docente (editor, `a.coloresSemaforo`): salen primero;
   con `a.soloPropiosSemaforo`, sin los del juego (verde y rojo, siempre).

   Equipos: al inicio se elige cuántos jugadores tiene cada equipo en pie
   (`a.jugadoresSemaforo`; 0 = los integrantes del equipo). El docente pausa
   y descuenta eliminados por equipo (pantalla, teclas 1–9/0 o celular), con
   «+1» y «Deshacer» para corregir. Gana el último equipo con jugadores en pie:
   `a.pasosSemaforo` pasos hacia Jomu (`jaguarPunto`). Luego enlace y montaña.

   Reutiliza (no reimplementa): sesión de equipos del Jaguar, capibara-comun.jsx
   (audio y silencio común, escenario 16:9 `useLienzoCp`, `TablaFinalCp`,
   `MontanaFinalCp`), `equiposCapibara`, `EnlaceJaguar`, el estado del mando
   `fijarEstadoCapibara`, los estilos `vg-mi-*` y la cuenta regresiva de Dedos
   Veloces (`vg-dd-cuenta`). Atajos iguales a los otros juegos: Espacio / Enter /
   Av Pág = acción principal (en juego: pausa), P pausa, D / Re Pág deshacer,
   M silencio, F pantalla completa; 1–9 y 0 = −1 al equipo (Shift: +1).

   Secciones: BANCO DE COLORES · COLORES PROPIOS · CONFIGURACIÓN · AUDIO · REGLAS DEL SEMÁFORO ·
   COMPONENTE (estado, reloj, teclado, mando, interfaz). */

/* ========================= BANCO DE COLORES =========================
   Colores puros y saturados (se ven en proyectores con poco brillo), cada
   uno con su ícono (daltonismo) y su sonido. `base`: los del inicio. Los
   demás se desbloquean EN ESTE ORDEN; para ampliar el banco, sumar al final
   (acciones seguras para un salón). tinta = color del texto encima. */
const BANCO_SEMAFORO = [
  { id: 'verde', nombre: 'Verde', color: '#00D04A', tinta: '#00210B', icono: '🏃', accion: '¡Muévete!', detalle: 'Camina o trota en tu sitio', base: true,
    sonido: () => [523, 659, 784].forEach((f, i) => audioCapibara.tono(f, 0.16, 'triangle', 0.16, i * 0.07)) },
  { id: 'rojo', nombre: 'Rojo', color: '#FF1414', tinta: '#FFFFFF', icono: '✋', accion: '¡Congélate!', detalle: 'Quieto por completo, como una estatua', base: true,
    sonido: () => { audioCapibara.tono(170, 0.5, 'square', 0.12); audioCapibara.tono(127, 0.5, 'sawtooth', 0.08); } },
  { id: 'amarillo', nombre: 'Amarillo', color: '#FFE500', tinta: '#2A2000', icono: '🦩', accion: '¡En un pie!', detalle: 'Como un flamenco',
    sonido: () => [1047, 1568].forEach((f, i) => audioCapibara.tono(f, 0.3, 'sine', 0.16, i * 0.12)) },
  { id: 'azul', nombre: 'Azul', color: '#0050FF', tinta: '#FFFFFF', icono: '🐸', accion: '¡Agáchate!', detalle: 'Agachado como una rana',
    sonido: () => audioCapibara.tono(560, 0.5, 'sine', 0.2, 0, 140) },
  { id: 'morado', nombre: 'Morado', color: '#9D00FF', tinta: '#FFFFFF', icono: '🙌', accion: '¡Brazos arriba!', detalle: 'Bien estirados hacia el cielo',
    sonido: () => audioCapibara.tono(300, 0.45, 'triangle', 0.18, 0, 1200) },
  { id: 'naranja', nombre: 'Naranja', color: '#FF7400', tinta: '#200C00', icono: '🌀', accion: '¡Gira!', detalle: 'Da vueltas en tu sitio, despacio',
    sonido: () => [660, 880, 660, 880, 660].forEach((f, i) => audioCapibara.tono(f, 0.07, 'square', 0.08, i * 0.07)) },
  { id: 'rosado', nombre: 'Rosado', color: '#FF1FA0', tinta: '#FFFFFF', icono: '👏', accion: '¡Aplaude!', detalle: 'Aplaude sin parar',
    sonido: () => [0, 0.15].forEach((t) => audioCapibara.ruido(0.08, 0.35, 2600, t)) },
  { id: 'celeste', nombre: 'Celeste', color: '#00E1FF', tinta: '#001E24', icono: '🙆', accion: '¡Manos a la cabeza!', detalle: 'Las dos manos sobre la cabeza',
    sonido: () => [1319, 1760, 2093].forEach((f, i) => audioCapibara.tono(f, 0.12, 'sine', 0.13, i * 0.06)) },
];
const BASE_SF = BANCO_SEMAFORO.filter((c) => c.base);
const EXTRAS_SF = BANCO_SEMAFORO.filter((c) => !c.base);

/* ====================== COLORES PROPIOS DEL DOCENTE ======================
   `a.coloresSemaforo` = [{ id, color, icono, accion, detalle }] (editor).
   Salen primero, en su orden; con `a.soloPropiosSemaforo`, sin los del juego.
   Verde y rojo están siempre. */
// Texto legible sobre un color: oscuro en colores claros, blanco en oscuros.
function tintaSemaforo(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16), r = (n >> 16) & 255, gr = (n >> 8) & 255, b = n & 255;
  return (0.299 * r + 0.587 * gr + 0.114 * b) > 150 ? '#1A1A1A' : '#FFFFFF';
}
// Sonido de un color propio: dos notas propias según su posición (distinto de los del juego).
const NOTAS_PROPIAS_SF = [392, 440, 494, 587, 698, 784, 932, 1175];
function sonidoPropioSF(k) {
  const f = NOTAS_PROPIAS_SF[k % NOTAS_PROPIAS_SF.length], tipo = k % 2 ? 'square' : 'triangle';
  return () => { audioCapibara.tono(f, 0.14, tipo, 0.12); audioCapibara.tono(f * 1.5, 0.2, tipo, 0.12, 0.13); };
}
// Banco de esta activación: { base, extras } (extras = los que se desbloquean, en orden).
function bancoSemaforo(a) {
  const propios = ((a && a.coloresSemaforo) || []).filter((c) => c && (c.accion || '').trim()).map((c, k) => ({
    id: 'p-' + (c.id || k), nombre: (c.accion || '').trim(), color: c.color || '#FF00FF', tinta: tintaSemaforo(c.color),
    icono: (c.icono || '').trim() || '⭐', accion: (c.accion || '').trim(), detalle: (c.detalle || '').trim(), sonido: sonidoPropioSF(k), propio: true,
  }));
  return { base: BASE_SF, extras: propios.concat(a && a.soloPropiosSemaforo ? [] : EXTRAS_SF) };
}

/* =========================== CONFIGURACIÓN =========================== */
const SF = {
  CUENTA_MS: 3000, ANUNCIO_MS: 4500, TRAMPA_MS: 380, MIN_MS: 1100,
  // segundos [mín, máx] de cada color según la velocidad inicial
  VEL: { lenta: [3.5, 7], media: [2.6, 5], rapida: [1.9, 3.6] },
  NIVEL_TRAMPAS: 2,     // colores nuevos desbloqueados para que empiecen las trampas
  PROB_TRAMPA: 0.4,
};
const limitarSF = (v, a, b, d) => Math.max(a, Math.min(b, Number(v) || d));

/* =============================== AUDIO ===============================
   Cada color suena distinto (en el banco); aquí los avisos del juego. */
const SONIDO_SF = {
  cuenta: () => audioCapibara.tono(660, 0.12, 'square', 0.12),
  anuncio: () => [392, 523, 659, 784].forEach((f, i) => audioCapibara.tono(f, 0.22, 'triangle', 0.16, i * 0.11)),
  pausa: () => audioCapibara.tono(440, 0.18, 'sine', 0.12, 0, 330),
  elimina: () => audioCapibara.tono(300, 0.35, 'sawtooth', 0.12, 0, 90),
  corrige: () => audioCapibara.tono(700, 0.15, 'sine', 0.12, 0, 1000),
  ganador: () => [523, 659, 784, 1047, 1319].forEach((f, i) => audioCapibara.tono(f, 0.25, 'triangle', 0.17, i * 0.1)),
};
const sonarColorSF = (c) => { if (c && c.sonido) c.sonido(); };

/* ======================= REGLAS DEL SEMÁFORO ======================= */
// Duración al azar de un color: más corta con cada color nuevo y con los cambios.
function duracionSF(vel, nivel, cambios) {
  const [a, b] = SF.VEL[vel] || SF.VEL.lenta;
  const f = Math.max(0.42, 1 - nivel * 0.09 - cambios * 0.006);
  return Math.max(SF.MIN_MS, (a + Math.random() * (b - a)) * f * 1000);
}
// Siguiente color: nunca el mismo dos veces seguidas; el rojo sale más seguido.
function siguienteColorSF(activos, actual) {
  const op = activos.filter((c) => c.id !== actual);
  const pesos = op.map((c) => (c.id === 'rojo' ? 2.2 : 1));
  let r = Math.random() * pesos.reduce((s, p) => s + p, 0);
  for (let k = 0; k < op.length; k++) { r -= pesos[k]; if (r <= 0) return op[k]; }
  return op[op.length - 1];
}
function nuevoJuegoSF(jugadores) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, seg: null,
    color: null, hasta: 0, cambios: 0, desbloq: 0, nuevo: null, trampa: null,
    ...nuevoEnPieCp(jugadores),   // jugadores en pie (capibara-comun.jsx)
  };
}

/* ============================ COMPONENTE ============================ */
function SemaforoCapibara({ a, estudiantes, onContinuar }) {
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

  // ---- Ajustes (editor y menú) ----
  const cadaN = limitarSF(a.cambiosSemaforo, 3, 20, 6);
  const trampas = a.trampasSemaforo !== false;
  const pasos = limitarSF(a.pasosSemaforo, 1, 10, 3);
  const [vel, setVel] = React.useState(() => (SF.VEL[a.velocidadSemaforo] ? a.velocidadSemaforo : 'lenta'));
  const [jugadores, setJugadores] = React.useState(() => jugadoresInicialesCp(equipos, a.jugadoresSemaforo));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoSF(jugadores);
  const cfg = React.useRef({});
  cfg.current = { vel, jugadores, pausado, cadaN, trampas, nEq: eqV.length };
  const G = g.current;
  const seguirJuego = React.useRef(onContinuar);
  seguirJuego.current = onContinuar;
  const { raiz, tam } = useLienzoCp(1600, 900);
  // Banco de esta activación (colores del juego + los propios del docente).
  const [banco] = React.useState(() => bancoSemaforo(a));
  const colorSF = (id) => banco.base.concat(banco.extras).find((c) => c.id === id) || null;

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; setFase(f); };
  const activos = () => banco.base.concat(banco.extras.slice(0, g.current.desbloq));
  const enJuego = (f) => f === 'cuenta' || f === 'juego' || f === 'anuncio';
  const empezar = () => {
    audioCapibara.despertar();
    const X = nuevoJuegoSF(cfg.current.jugadores);
    X.reloj = g.current.reloj; g.current = X;
    irA('reglas'); refrescar();
  };
  const iniciar = () => { if (g.current.fase === 'reglas') { audioCapibara.despertar(); irA('cuenta'); refrescar(); } };
  // Pone un color y, a veces, programa una trampa dentro de su duración.
  const ponerColor = (c) => {
    const X = g.current, C = cfg.current;
    const dur = duracionSF(C.vel, X.desbloq, X.cambios);
    X.color = c.id; X.hasta = X.reloj + dur; X.trampa = null;
    if (C.trampas && X.desbloq >= SF.NIVEL_TRAMPAS && dur > 1600 && Math.random() < SF.PROB_TRAMPA) {
      const otros = activos().filter((k) => k.id !== c.id);
      const t0 = X.reloj + dur * (0.3 + Math.random() * 0.35);
      X.trampa = { id: otros[Math.floor(Math.random() * otros.length)].id, desde: t0, hasta: t0 + SF.TRAMPA_MS, on: false };
    }
    sonarColorSF(c); refrescar();
  };
  // Siguiente cambio: cada `cadaN` cambios se anuncia un color nuevo (si quedan).
  const cambiar = () => {
    const X = g.current, C = cfg.current;
    X.cambios += 1;
    if (X.cambios % C.cadaN === 0 && X.desbloq < banco.extras.length) {
      X.desbloq += 1; X.nuevo = banco.extras[X.desbloq - 1].id; X.trampa = null;
      SONIDO_SF.anuncio(); irA('anuncio'); refrescar(); return;
    }
    ponerColor(siguienteColorSF(activos(), X.color));
  };
  // Tras el anuncio, el primer color es el nuevo.
  const terminarAnuncio = () => {
    const X = g.current;
    if (X.fase !== 'anuncio' || cfg.current.pausado) return;
    irA('juego'); ponerColor(colorSF(X.nuevo));
  };
  const pausar = () => {
    if (!enJuego(g.current.fase) || cfg.current.pausado) return;
    cfg.current.pausado = true; g.current.trampa = null; setPausado(true); SONIDO_SF.pausa();
  };
  // Al seguir: 3, 2, 1 y color nuevo (el anuncio, en cambio, continúa donde iba).
  const seguir = () => {
    if (!cfg.current.pausado) return;
    cfg.current.pausado = false; setPausado(false);
    if (g.current.fase !== 'anuncio') irA('cuenta');
    refrescar();
  };
  const alternarPausa = () => (cfg.current.pausado ? seguir() : pausar());
  // Descontar (d = −1) o corregir (d = +1, hasta los que empezaron). Pausa sola.
  const descontar = (i, d) => {
    const X = g.current;
    if (!enJuego(X.fase)) return;
    pausar();
    if (!cambiarEnPieCp(X, i, d)) { refrescar(); return; }
    if (d < 0) SONIDO_SF.elimina(); else SONIDO_SF.corrige();
    if (equiposEnPieCp(X) <= 1) fin();   // queda un solo equipo en pie
    else refrescar();
  };
  // Deshacer el último descuento. Desde el final, también quita los pasos y vuelve a la pausa.
  const deshacer = () => {
    const X = g.current;
    if (!(enJuego(X.fase) || X.fase === 'fin') || !deshacerEnPieCp(X)) return;
    if (X.fase === 'fin') {
      anularGanadoresCp(X, pasos);
      cfg.current.pausado = true; setPausado(true); irA('juego');
    }
    SONIDO_SF.corrige(); refrescar();
  };
  // Final: gana el equipo con más jugadores en pie (empate = pasos para todos los empatados).
  const fin = () => {
    const X = g.current;
    registrarGanadoresCp(X, pasos);
    X.trampa = null; cfg.current.pausado = false; setPausado(false);
    SONIDO_SF.ganador(); irA('fin'); refrescar();
  };
  const terminar = () => { if (enJuego(g.current.fase)) fin(); };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const cambiarJugadores = (i, d) => {
    if (g.current.fase !== 'menu') return;
    setJugadores((js) => js.map((n, k) => (k === i ? limitarSF(n + d, 1, 40, 5) : n)));
  };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  const principal = () => {
    const X = g.current;
    if (cfg.current.pausado) seguir();
    else if (X.fase === 'menu') empezar();
    else if (X.fase === 'reglas') iniciar();
    else if (X.fase === 'anuncio') terminarAnuncio();
    else if (X.fase === 'cuenta' || X.fase === 'juego') pausar();
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguirJuego.current();
  };

  // ---- Reloj: cuenta regresiva, anuncio, cambios de color y trampas ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current;
      if (!cfg.current.pausado && enJuego(X.fase)) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'cuenta') {
          const seg = 3 - Math.floor(e / 1000);
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_SF.cuenta(); refrescar(); }
          if (e >= SF.CUENTA_MS) { irA('juego'); cambiar(); }
        } else if (X.fase === 'anuncio') {
          if (e >= SF.ANUNCIO_MS) terminarAnuncio();
        } else if (X.fase === 'juego') {
          const t = X.trampa;
          if (t && !t.on && X.reloj >= t.desde) { t.on = true; refrescar(); }
          else if (t && t.on && X.reloj >= t.hasta) { X.trampa = null; refrescar(); }
          if (X.reloj >= X.hasta) cambiar();
        }
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Teclado (mismos atajos que los otros juegos del Capibara) ----
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const X = g.current, k = e.key, l = k && k.length === 1 ? k.toUpperCase() : '';
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === ' ' || k === 'Enter' || k === 'PageDown') {
        if (e.target && /button/i.test(e.target.tagName) && k !== 'PageDown') return;   // el botón enfocado ya responde
        tomar(); if (!e.repeat) principal(); return;
      }
      if (k === 'PageUp' || l === 'D') { tomar(); deshacer(); return; }
      // 1–9 y 0 (fila o teclado numérico): −1 al equipo; con Shift, +1.
      const i = equipoDeTeclaCp(e);
      if (i >= 0 && enJuego(X.fase)) {
        if (i < cfg.current.nEq) { tomar(); if (!e.repeat) descontar(i, e.shiftKey ? 1 : -1); }
        return;
      }
      if (l === 'P') { tomar(); alternarPausa(); }
      else if (l === 'M') { tomar(); alternarSilencio(); }
      else if (l === 'F') { tomar(); pantallaCompleta(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: estado y órdenes (los mismos botones de la pantalla) ----
  // El color en pantalla NO se publica: cambia cada pocos segundos y el celular no lo necesita.
  const estadoMando = {
    juego: 'semaforo', fase, pausado, silencio, vel, jugadores,
    colores: activos().length, activos: activos().map((c) => c.icono + ' ' + c.nombre + ': ' + c.accion),
    enPie: G.enPie, inicial: G.inicial, puedeDeshacer: G.historial.length > 0, ganadores: G.ganadores,
    eqs: eqV.map((e) => ({ corto: e.corto, emoji: e.emoji, color: e.color })),
  };
  const claveMando = JSON.stringify(estadoMando);
  React.useEffect(() => { fijarEstadoCapibara(estadoMando); }, [claveMando]);   // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'sf-empezar') { if (X.fase === 'menu') empezar(); }
    else if (x === 'sf-velocidad') { if (X.fase === 'menu' && SF.VEL[o.v]) setVel(o.v); }
    else if (x === 'sf-jugadores') cambiarJugadores(Number(o.i), Number(o.d) || 0);
    else if (x === 'sf-iniciar') iniciar();
    else if (x === 'sf-pausa') alternarPausa();
    else if (x === 'sf-saltar') terminarAnuncio();
    else if (x === 'sf-descontar') descontar(Number(o.i), -1);
    else if (x === 'sf-sumar') descontar(Number(o.i), 1);
    else if (x === 'sf-deshacer') deshacer();
    else if (x === 'sf-terminar') terminar();
    else if (x === 'sf-silencio') alternarSilencio();
    else if (x === 'sf-montana') verMontana();
    else if (x === 'sf-otra') otraVez();
    else if (x === 'sf-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });

  /* ============================ INTERFAZ ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Semáforo" />;
  const lista = activos();
  const actual = fase === 'juego' ? colorSF(G.color) : fase === 'anuncio' ? colorSF(G.nuevo) : null;
  const trampaC = fase === 'juego' && !pausado && G.trampa && G.trampa.on ? colorSF(G.trampa.id) : null;
  const sombra = (c) => (c.tinta === '#FFFFFF' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.55)');
  const tabla = tablaEnPieCp(eqV, G);
  const unGanador = G.ganadores.length === 1 ? eqV[G.ganadores[0]] : null;

  return (
    <div className={'vg-cp vg-mi vg-sf' + (actual ? ' lleno' : '')} ref={raiz} role="dialog" aria-label="Semáforo"
      style={actual ? { '--sf': actual.color, '--sf-tinta': actual.tinta, '--sf-sombra': sombra(actual) } : undefined}>
      {/* Color trampa: parpadea detrás de la señal, sin cambiar el color */}
      {trampaC && <div key={G.trampa.desde} className="vg-sf-trampa" style={{ '--t': trampaC.color }} aria-hidden="true"></div>}
      <div className="vg-mi-escenario vg-sf-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>

        {/* La señal: ícono, acción y nombre del color */}
        {fase === 'juego' && actual && (
          <div key={G.cambios} className="vg-sf-senal" aria-live="assertive">
            <div className="vg-sf-icono" aria-hidden="true">{actual.icono}</div>
            <div className="vg-sf-accion">{actual.accion}</div>
            {/* (en los colores propios, el nombre ES la acción: no se repite) */}
            {actual.propio ? (actual.detalle && <div className="vg-sf-nombre propio">{actual.detalle}</div>) : <div className="vg-sf-nombre">{actual.nombre}</div>}
          </div>
        )}

        {/* Leyenda lateral discreta: colores activos y su acción */}
        {enJuego(fase) && (
          <div className="vg-sf-leyenda" aria-label="Colores en juego">
            {lista.map((c) => (
              <div key={c.id} className={'vg-sf-ley' + (actual && actual.id === c.id ? ' ahora' : '')} style={{ '--c': c.color }}>
                <i aria-hidden="true">{c.icono}</i><span>{c.accion}</span>
              </div>
            ))}
          </div>
        )}

        {/* Jugadores en pie por equipo (abajo, sin tapar el color). Tocar = pausa para descontar. */}
        {enJuego(fase) && <ContadoresEnPieCp eqV={eqV} E={G} onTocar={pausar} clase="vg-sf-equipos" />}
        {enJuego(fase) && <div className="vg-sf-info">🚦 {lista.length} colores · cambio {G.cambios}</div>}

        {/* Cuenta regresiva (la de Dedos Veloces) */}
        {fase === 'cuenta' && !pausado && <div key={'c' + G.seg} className="vg-dd-cuenta">{G.seg || 3}</div>}

        {/* Anuncio de un color nuevo */}
        {fase === 'anuncio' && actual && (
          <div className="vg-mi-capa vg-sf-capa-clara">
            <div className="vg-jn-anuncio vg-sf-anuncio" style={{ borderColor: actual.color }}>
              {actual.propio ? <h2>¡Color nuevo!</h2>
                : <h2>¡Color nuevo: <b style={{ color: actual.tinta === '#FFFFFF' ? actual.color : '#1F1408' }}>{actual.nombre}</b>!</h2>}
              <div className="vg-sf-icono chico" style={{ background: actual.color }} aria-hidden="true">{actual.icono}</div>
              <p>{actual.accion}</p>
              <small>{actual.detalle}</small>
            </div>
          </div>
        )}

        {/* Botones (también en el celular) */}
        {enJuego(fase) && !pausado && (
          <div className="vg-mi-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {fase === 'anuncio' && <button type="button" className="listo" onClick={terminarAnuncio} title="Espacio">⏭ Seguir</button>}
            <button type="button" onClick={pausar} title="Pausa para descontar (P o Espacio)">⏸</button>
          </div>
        )}

        {/* Pausa: descontar eliminados por equipo, corregir y deshacer */}
        {pausado && enJuego(fase) && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta vg-sf-pausa">
              <h2>⏸ Pausa · ¿Quién quedó eliminado?</h2>
              <TarjetasEnPieCp eqV={eqV} E={G} onCambiar={descontar} />
              <div className="vg-mi-fila">
                {G.historial.length > 0 && <button type="button" className="vg-cp-btn suave" onClick={deshacer}>↩ Deshacer (D)</button>}
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
                <button type="button" className="vg-cp-btn grande" onClick={seguir}>▶ Seguir {fase === 'anuncio' ? '' : '(3, 2, 1)'}</button>
              </div>
              <span className="vg-sf-ayuda">Teclas 1–9 / 0: −1 al equipo · Shift + número: +1 · D o Re Pág: deshacer · Espacio: seguir</span>
            </div>
          </div>
        )}

        {/* Menú: velocidad y jugadores en pie por equipo */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · un color nuevo cada {cadaN} cambios</div>
              <h1 className="vg-mi-titulo vg-sf-titulo">🚦 Semáforo</h1>
              <p className="vg-mi-intro">Cada color es una acción. ¡Quien se equivoque o tarde demasiado, se sienta! Gana el último equipo con jugadores en pie.</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-mi-ajuste">
                {[['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']].map(([v, txt]) => (
                  <button key={v} type="button" className={'vg-jn-vel' + (vel === v ? ' on' : '')} onClick={() => setVel(v)}>{txt}</button>
                ))}
              </div>
              <div className="vg-mi-sub">🧍 Jugadores en pie por equipo</div>
              <JugadoresEnPieCp eqV={eqV} jugadores={jugadores} onCambiar={cambiarJugadores} />
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Reglas: los dos colores del inicio */}
        {fase === 'reglas' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>¡Atentos al color!</h2>
              <div className="vg-sf-reglas">
                {BASE_SF.map((c) => (
                  <div key={c.id} className="vg-sf-tile" style={{ '--c': c.color, '--tinta': c.tinta, '--sf-sombra': sombra(c) }}>
                    <span className="ico" aria-hidden="true">{c.icono}</span><b>{c.accion}</b><small>{c.nombre} · {c.detalle}</small>
                  </div>
                ))}
              </div>
              <p className="vg-mi-intro">Cada {cadaN} cambios aparece un color nuevo.{trampas ? ' ¡Cuidado con los colores que solo parpadean: son trampa!' : ''}</p>
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn grande" onClick={iniciar}>▶ ¡A jugar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final */}
        {fase === 'fin' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta fin">
              <h1 className="vg-mi-titulo">
                {unGanador ? unGanador.emoji + ' ¡Ganó el ' + unGanador.nombre + '!' : G.ganadores.length > 1 ? '¡Empate! ' + G.ganadores.map((i) => eqV[i].emoji).join(' ') : '¡Fin del juego!'}
              </h1>
              {G.ganadores.length > 0 && <p className="vg-mi-sub">+{pasos} {pasos === 1 ? 'paso' : 'pasos'} hacia Jomu</p>}
              <TablaFinalCp filas={tabla} />
              {unGanador && a.enlace && equipos[G.ganadores[0]] && (
                <EnlaceJaguar enlace={a.enlace} equipo={equipos[G.ganadores[0]]} i={G.ganadores[0]} id={a.id} />
              )}
              <div className="vg-mi-fila">
                {G.historial.length > 0 && <button type="button" className="vg-cp-btn suave" onClick={deshacer}>↩ Deshacer el último</button>}
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

Object.assign(window, { SemaforoCapibara, BANCO_SEMAFORO, tintaSemaforo });
