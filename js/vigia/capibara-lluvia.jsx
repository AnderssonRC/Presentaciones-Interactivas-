/* capibara-lluvia.jsx — Modo Capibara · «Esquiva la Lluvia» (cp-lluvia).

   La proyección muestra una franja horizontal dividida en zonas (`a.zonasLluvia`,
   3 a 6; por defecto 4) que corresponden a zonas del piso frente al video beam
   (se recomienda marcarlas con cinta). Varios estudiantes de todos los equipos
   juegan a la vez, parados en las zonas. Desde arriba caen gotas gigantes, cocos
   y piedras: primero su SOMBRA marca la zona (aviso), luego caen e impactan.
   Siempre queda al menos una zona segura. Quien quede en una zona golpeada,
   queda eliminado. Cada ronda es un poco más difícil: menos aviso, caída más
   rápida, más zonas golpeadas por nivel (cada 3 rondas) y fintas (la sombra
   aparece en otra zona y se desliza a la real justo antes de caer).

   Eliminaciones: al empezar se elige cuántos jugadores tiene cada equipo en pie
   (`a.jugadoresLluvia`; 0 = los integrantes del equipo). Tras cada impacto el
   juego se detiene y el docente descuenta por equipo (−1 / +1 en los contadores
   de abajo, teclas 1–9 / 0, o el celular), con «Deshacer». Gana el último equipo
   con jugadores en pie (o el que tenga más, si se termina antes):
   `a.pasosLluvia` pasos hacia Jomu (`jaguarPunto`); luego enlace y montaña.

   Reutiliza capibara-comun.jsx: equipos de la sesión (`useEquiposCp`), audio
   con silencio común, escenario 16:9, jugadores en pie, pausa, final, montaña
   y estado del celular (`usePublicarCp`).
   Atajos: Espacio / Enter / Av Pág = acción principal (en juego: pausa; tras el
   impacto: siguiente ronda), P pausa, D / Re Pág deshacer, M silencio,
   F pantalla completa; 1–9 y 0 = −1 al equipo (Shift: +1).
   Mando: `capibara = { juego: 'lluvia', … }`, órdenes `ll-*`.

   Secciones: CONFIGURACIÓN · OBJETOS QUE CAEN · AUDIO · REGLAS · COMPONENTE. */

/* =========================== CONFIGURACIÓN =========================== */
const LL = {
  W: 1600, H: 900,
  ZY: 470, ZH: 300,                 // franja de zonas en el lienzo lógico (1600 × 900)
  CUENTA_MS: 3000, IMPACTO_MS: 1300,
  // milisegundos de aviso (sombra) y de caída en la ronda 1, según la velocidad;
  // `finta` = ronda desde la que la sombra puede cambiar de zona antes de caer.
  VEL: {
    lenta: { aviso: 2200, caida: 850, finta: 3 },
    media: { aviso: 1700, caida: 680, finta: 2 },
    rapida: { aviso: 1300, caida: 520, finta: 1 },
  },
  MIN_AVISO: 650, MIN_CAIDA: 300,
  BAJA_POR_RONDA: 0.06,             // cada ronda, 6 % menos de tiempo (hasta la mitad)
  CADA_ZONA_EXTRA: 3,               // cada 3 rondas (un nivel) puede caer en una zona más
  DESLIZ_MS: 220,                   // lo que tarda la sombra en deslizarse a otra zona
};
const nivelLL = (r) => 1 + Math.floor((Math.max(1, r) - 1) / LL.CADA_ZONA_EXTRA);
// Zonas: colores claros y muy distintos entre sí (el número oscuro se lee en todos).
const ZONAS_LL = ['#FFD400', '#00C8FF', '#FF5FD2', '#7CFF4F', '#FF9A1F', '#C7A6FF'];

/* ========================= OBJETOS QUE CAEN =========================
   Dibujos propios (SVG, centrados en 0,0, ~180 de ancho), con borde oscuro
   grueso: se ven sobre el cielo claro y en proyectores con poco brillo. */
const BORDE_LL = '#2A1A0C';
const OBJETOS_LL = {
  gota: {
    nombre: 'Gota gigante', particula: '#4FA8E8',
    dibujo: (
      <g>
        <path d="M0,-115 C40,-55 85,-5 85,40 A85,85 0 0 1 -85,40 C-85,-5 -40,-55 0,-115 Z" fill="#2E8FE0" stroke={BORDE_LL} strokeWidth="9" />
        <ellipse cx="-32" cy="22" rx="15" ry="30" fill="#BFE3FF" transform="rotate(20 -32 22)" />
      </g>
    ),
    sonido: () => { audioCapibara.ruido(0.45, 0.45, 2800); audioCapibara.tono(520, 0.25, 'sine', 0.15, 0, 120); },
  },
  coco: {
    nombre: 'Coco', particula: '#A0632F',
    dibujo: (
      <g>
        <circle r="88" fill="#7A4A24" stroke={BORDE_LL} strokeWidth="9" />
        <path d="M-62,-28 Q0,-68 62,-28 M-74,12 Q0,-24 74,12 M-58,52 Q0,26 58,52" stroke="#4A2A12" strokeWidth="7" fill="none" />
        <circle cx="-24" cy="-50" r="9" fill="#2A160A" /><circle cx="0" cy="-60" r="9" fill="#2A160A" /><circle cx="24" cy="-50" r="9" fill="#2A160A" />
      </g>
    ),
    sonido: () => { audioCapibara.tono(160, 0.3, 'sine', 0.4, 0, 55); audioCapibara.ruido(0.2, 0.3, 500); audioCapibara.tono(120, 0.15, 'sine', 0.2, 0.3, 60); },
  },
  piedra: {
    nombre: 'Piedra', particula: '#8C939E',
    dibujo: (
      <g>
        <path d="M-90,20 L-70,-50 L-20,-85 L45,-75 L90,-25 L85,45 L35,85 L-45,80 Z" fill="#8C939E" stroke={BORDE_LL} strokeWidth="9" strokeLinejoin="round" />
        <path d="M-20,-85 L-5,-20 L40,10 M-5,-20 L-50,20" stroke="#4E545C" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
    ),
    sonido: () => { audioCapibara.ruido(0.8, 0.55, 700); audioCapibara.tono(90, 0.5, 'square', 0.12, 0, 35); },
  },
};
const IDS_OBJETOS_LL = Object.keys(OBJETOS_LL);

/* =============================== AUDIO =============================== */
const SONIDO_LL = {
  aviso: () => [0, 0.22].forEach((t) => audioCapibara.tono(880, 0.16, 'square', 0.1, t)),
  tic: () => audioCapibara.tono(1200, 0.05, 'square', 0.06),
  caida: (ms) => audioCapibara.tono(1500, ms / 1000, 'sine', 0.1, 0, 260),
  cambio: () => audioCapibara.tono(380, 0.16, 'triangle', 0.14, 0, 950),   // la sombra se mueve
};

/* =============================== REGLAS =============================== */
/* La ronda r: tiempos (cada vez más cortos, poco a poco), zonas golpeadas (más
   con cada nivel, nunca todas; distinto conjunto que la ronda anterior si se
   puede) y fintas: la sombra aparece en zonas falsas y se desliza a las reales.
   `tramos` = [{ zonas, desde }]; el último tramo son las zonas reales. */
function rondaLL(r, n, vel, anterior) {
  const base = LL.VEL[vel] || LL.VEL.lenta;
  const f = Math.max(0.5, 1 - LL.BAJA_POR_RONDA * (r - 1));
  const avisoBase = Math.max(LL.MIN_AVISO, base.aviso * f);
  const caida = Math.max(LL.MIN_CAIDA, base.caida * Math.pow(f, 0.8));
  let k = Math.min(n - 1, nivelLL(r));
  if (k > 1 && Math.random() < 0.3) k -= 1;
  const todas = Array.from({ length: n }, (_, i) => i);
  // Barajado propio: cada módulo corre aislado y no ve las funciones del Jaguar.
  const barajar = (l) => { const c = l.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; };
  const elegir = (evitar) => {
    let z = [];
    for (let intento = 0; intento < 10; intento++) {
      z = barajar(todas).slice(0, k).sort((x, y) => x - y);
      if (!evitar || z.join() !== evitar.join()) break;
    }
    return z;
  };
  const zonas = elegir(anterior);
  // Fintas: desde la ronda `base.finta`, cada vez más probables; 2 seguidas desde el nivel 3.
  let fintas = 0;
  if (r >= base.finta) {
    const prob = Math.min(0.8, 0.3 + 0.08 * (r - base.finta));
    if (Math.random() < prob) fintas = 1;
    if (fintas && nivelLL(r) >= 3 && Math.random() < 0.45) fintas = 2;
  }
  const tramos = [];
  let t = 0, previa = null;
  for (let q = 0; q < fintas; q++) {
    let falsa = elegir(previa);
    if (falsa.join() === zonas.join()) falsa = elegir(zonas);
    tramos.push({ zonas: falsa, desde: t });
    t += Math.max(420, avisoBase * 0.4);
    previa = falsa;
  }
  // Tras la última finta queda tiempo justo para cambiarse de zona.
  tramos.push({ zonas, desde: t });
  const aviso = t + (fintas ? Math.max(LL.MIN_AVISO, avisoBase * 0.75) : avisoBase);
  const objetos = zonas.map(() => IDS_OBJETOS_LL[Math.floor(Math.random() * IDS_OBJETOS_LL.length)]);
  return { zonas, objetos, aviso, caida, tramos, nivel: nivelLL(r) };
}
// Tramo de la sombra en el instante e del aviso.
const tramoLL = (golpe, e) => { let i = 0; golpe.tramos.forEach((s, q) => { if (e >= s.desde) i = q; }); return i; };
function nuevoJuegoLL(jugadores) {
  return { fase: 'menu', reloj: 0, inicio: 0, seg: null, ronda: 0, golpe: null, ...nuevoEnPieCp(jugadores) };
}
const corriendoLL = (f) => f === 'cuenta' || f === 'aviso' || f === 'caida' || f === 'impacto';
const enJuegoLL = (f) => corriendoLL(f) || f === 'elimina';

/* ============================ COMPONENTE ============================ */
function EsquivaLluvia({ a, estudiantes, onContinuar }) {
  const { sesion, equipos, eqV } = useEquiposCp(a, estudiantes);
  // ---- Ajustes (editor y menú) ----
  const pasos = limitarCp(a.pasosLluvia, 1, 10, 3);
  const [zonas, setZonas] = React.useState(() => limitarCp(a.zonasLluvia, 3, 6, 4));
  const [vel, setVel] = React.useState(() => (LL.VEL[a.velocidadLluvia] ? a.velocidadLluvia : 'lenta'));
  const [jugadores, setJugadores] = React.useState(() => jugadoresInicialesCp(equipos, a.jugadoresLluvia));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoLL(jugadores);
  const cfg = React.useRef({});
  cfg.current = { zonas, vel, jugadores, pausado, nEq: eqV.length };
  const G = g.current;
  const seguirJuego = React.useRef(onContinuar);
  seguirJuego.current = onContinuar;
  const { raiz, tam } = useLienzoCp(LL.W, LL.H);

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; X.tramo = 0; setFase(f); };
  const empezar = () => {
    if (g.current.fase !== 'menu') return;
    audioCapibara.despertar();
    const X = nuevoJuegoLL(cfg.current.jugadores);
    X.reloj = g.current.reloj; g.current = X;
    irA('cuenta'); refrescar();
  };
  // Ronda nueva: la sombra aparece en las zonas que van a ser golpeadas.
  const nuevaRonda = () => {
    const X = g.current;
    X.ronda += 1;
    X.golpe = rondaLL(X.ronda, cfg.current.zonas, cfg.current.vel, X.golpe && X.golpe.zonas);
    SONIDO_LL.aviso(); irA('aviso'); refrescar();
  };
  const pausar = () => {
    const X = g.current;
    if (!corriendoLL(X.fase) || X.fase === 'impacto' || cfg.current.pausado) return;
    cfg.current.pausado = true; setPausado(true); SONIDO_CP.pausa();
  };
  // Al seguir: se repite el aviso de la misma ronda (así nadie queda en desventaja).
  const seguir = () => {
    if (!cfg.current.pausado) return;
    cfg.current.pausado = false; setPausado(false);
    const X = g.current;
    if (X.fase === 'caida' || X.fase === 'aviso') { SONIDO_LL.aviso(); irA('aviso'); }
    refrescar();
  };
  const alternarPausa = () => (cfg.current.pausado ? seguir() : pausar());
  // Tras el impacto (pausa de eliminación): la siguiente ronda.
  const siguienteRonda = () => { if (g.current.fase === 'elimina' && !cfg.current.pausado) nuevaRonda(); };
  // Descontar (d = −1) o corregir (d = +1). Durante la caída, primero pausa.
  const descontar = (i, d) => {
    const X = g.current;
    if (!enJuegoLL(X.fase)) return;
    if (X.fase !== 'elimina' && X.fase !== 'impacto') pausar();
    if (!cambiarEnPieCp(X, i, d)) { refrescar(); return; }
    if (d < 0) SONIDO_CP.elimina(); else SONIDO_CP.corrige();
    if (equiposEnPieCp(X) <= 1) fin();   // queda un solo equipo en pie
    else refrescar();
  };
  // Deshacer el último descuento. Desde el final, también quita los pasos y vuelve a la eliminación.
  const deshacer = () => {
    const X = g.current;
    if (!(enJuegoLL(X.fase) || X.fase === 'fin') || !deshacerEnPieCp(X)) return;
    if (X.fase === 'fin') { anularGanadoresCp(X, pasos); irA('elimina'); }
    SONIDO_CP.corrige(); refrescar();
  };
  const fin = () => {
    const X = g.current;
    registrarGanadoresCp(X, pasos);
    cfg.current.pausado = false; setPausado(false);
    SONIDO_CP.ganador(); irA('fin'); refrescar();
  };
  const terminar = () => { if (enJuegoLL(g.current.fase)) fin(); };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const cambiarZonas = (d) => { if (g.current.fase === 'menu') setZonas((z) => Math.max(3, Math.min(6, z + d))); };
  const cambiarJugadores = (i, d) => {
    if (g.current.fase !== 'menu') return;
    setJugadores((js) => js.map((n, k) => (k === i ? limitarCp(n + d, 1, 40, 5) : n)));
  };
  const principal = () => {
    const X = g.current;
    if (cfg.current.pausado) seguir();
    else if (X.fase === 'menu') empezar();
    else if (X.fase === 'cuenta' || X.fase === 'aviso' || X.fase === 'caida') pausar();
    else if (X.fase === 'elimina') siguienteRonda();
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguirJuego.current();
  };

  // ---- Reloj: cuenta, aviso (sombra), caída e impacto ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current;
      if (!cfg.current.pausado && corriendoLL(X.fase)) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'cuenta') {
          const seg = 3 - Math.floor(e / 1000);
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_CP.cuenta(); refrescar(); }
          if (e >= LL.CUENTA_MS) nuevaRonda();
        } else if (X.fase === 'aviso') {
          const s = Math.floor(e / 1000);
          if (s !== X.seg) { if (X.seg !== null) SONIDO_LL.tic(); X.seg = s; }
          const tr = tramoLL(X.golpe, e);
          if (tr !== (X.tramo || 0)) { X.tramo = tr; SONIDO_LL.cambio(); }
          if (e >= X.golpe.aviso) { SONIDO_LL.caida(X.golpe.caida); irA('caida'); }
          refrescar();
        } else if (X.fase === 'caida') {
          if (e >= X.golpe.caida) {
            // Un sonido por tipo de objeto (si caen dos cocos, suena uno).
            Array.from(new Set(X.golpe.objetos)).forEach((id) => OBJETOS_LL[id].sonido());
            irA('impacto');
          }
          refrescar();
        } else if (X.fase === 'impacto') {
          if (e >= LL.IMPACTO_MS) irA('elimina');
          refrescar();
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
      if (enCampoCp(e)) return;
      const X = g.current, k = e.key, l = k && k.length === 1 ? k.toUpperCase() : '';
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === ' ' || k === 'Enter' || k === 'PageDown') {
        if (e.target && /button/i.test(e.target.tagName) && k !== 'PageDown') return;   // el botón enfocado ya responde
        tomar(); if (!e.repeat) principal(); return;
      }
      if (k === 'PageUp' || l === 'D') { tomar(); deshacer(); return; }
      const i = equipoDeTeclaCp(e);
      if (i >= 0 && enJuegoLL(X.fase)) {
        if (i < cfg.current.nEq) { tomar(); if (!e.repeat) descontar(i, e.shiftKey ? 1 : -1); }
        return;
      }
      if (l === 'P') { tomar(); alternarPausa(); }
      else if (l === 'M') { tomar(); alternarSilencio(); }
      else if (l === 'F') { tomar(); pantallaCompletaCp(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: estado y órdenes (los mismos botones de la pantalla) ----
  usePublicarCp({
    juego: 'lluvia', fase, pausado, silencio, zonas, vel, jugadores, ronda: G.ronda,
    golpeadas: G.golpe && fase !== 'menu' ? G.golpe.zonas.map((z) => z + 1) : [],
    enPie: G.enPie, inicial: G.inicial, puedeDeshacer: G.historial.length > 0, ganadores: G.ganadores,
    eqs: eqV.map((e) => ({ corto: e.corto, emoji: e.emoji, color: e.color })),
  });
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'll-empezar') empezar();
    else if (x === 'll-zonas') cambiarZonas(Number(o.d) || 0);
    else if (x === 'll-velocidad') { if (X.fase === 'menu' && LL.VEL[o.v]) setVel(o.v); }
    else if (x === 'll-jugadores') cambiarJugadores(Number(o.i), Number(o.d) || 0);
    else if (x === 'll-pausa') alternarPausa();
    else if (x === 'll-ronda') siguienteRonda();
    else if (x === 'll-descontar') descontar(Number(o.i), -1);
    else if (x === 'll-sumar') descontar(Number(o.i), 1);
    else if (x === 'll-deshacer') deshacer();
    else if (x === 'll-terminar') terminar();
    else if (x === 'll-silencio') alternarSilencio();
    else if (x === 'll-montana') verMontana();
    else if (x === 'll-otra') otraVez();
    else if (x === 'll-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });

  /* ============================ INTERFAZ ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Esquiva la Lluvia" />;
  const n = zonas;
  const wz = LL.W / n;
  const golpe = G.golpe;
  const e = G.reloj - G.inicio;
  // Durante el aviso, la sombra puede estar en zonas falsas (finta) y deslizarse a las reales.
  const iTramo = golpe && fase === 'aviso' ? tramoLL(golpe, e) : -1;
  const zonasVis = !golpe ? [] : iTramo >= 0 ? golpe.tramos[iTramo].zonas : golpe.zonas;
  const centro = (z) => z * wz + wz / 2;
  const xZona = (j) => {
    if (iTramo <= 0) return centro(zonasVis[j]);
    const p = Math.min(1, (e - golpe.tramos[iTramo].desde) / LL.DESLIZ_MS), s = p * p * (3 - 2 * p);
    return centro(golpe.tramos[iTramo - 1].zonas[j]) * (1 - s) + centro(zonasVis[j]) * s;
  };
  const golpeada = (k) => !!(golpe && zonasVis.includes(k) && fase !== 'menu' && fase !== 'cuenta');
  const verSombra = fase === 'aviso' || fase === 'caida' || fase === 'impacto';
  const resultado = fase === 'impacto' || fase === 'elimina';
  // Sombra: crece durante el aviso (0,25 → 0,75) y la caída (→ 1).
  const sombra = fase === 'aviso' ? 0.25 + 0.5 * Math.min(1, e / golpe.aviso)
    : fase === 'caida' ? 0.75 + 0.25 * Math.min(1, e / golpe.caida) : 1;
  const escalaObj = Math.min(1.15, (wz * 0.72) / 180);
  // Posición del objeto: asoma arriba durante el aviso y cae acelerando.
  const yObjeto = () => {
    if (fase === 'aviso') return -100 + 170 * Math.min(1, e / golpe.aviso);
    if (fase === 'caida') { const p = Math.min(1, e / golpe.caida); return 70 + (LL.ZY + 40 - 70) * p * p; }
    return LL.ZY + 40;
  };
  const sacudir = fase === 'impacto' && e < 320 ? 'translate(' + ((Math.random() - 0.5) * 18).toFixed(1) + ' ' + ((Math.random() - 0.5) * 12).toFixed(1) + ')' : undefined;
  const parpadeo = 0.45 + 0.55 * Math.abs(Math.sin(e / 140));
  const tabla = tablaEnPieCp(eqV, G);
  const totalEnPie = G.enPie.reduce((s, v) => s + v, 0);

  return (
    <div className={'vg-cp vg-mi vg-ll' + (resultado ? ' resultado' : '')} ref={raiz} role="dialog" aria-label="Esquiva la Lluvia">
      <div className="vg-mi-escenario vg-ll-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>
        <svg className="vg-ll-svg" viewBox={'0 0 ' + LL.W + ' ' + LL.H} aria-hidden="true">
          <defs>
            <linearGradient id="vgLlCielo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" className="vg-ll-cielo-a" /><stop offset="1" className="vg-ll-cielo-b" />
            </linearGradient>
          </defs>
          <g transform={sacudir}>
            <rect x="0" y="0" width={LL.W} height={LL.ZY} fill="url(#vgLlCielo)" />
            {/* Nubes de acuarela */}
            <g className="vg-ll-nubes">
              <ellipse cx="260" cy="90" rx="170" ry="46" /><ellipse cx="350" cy="70" rx="110" ry="40" />
              <ellipse cx="1240" cy="110" rx="190" ry="50" /><ellipse cx="1340" cy="84" rx="120" ry="42" />
            </g>
            {/* Zonas del piso */}
            {Array.from({ length: n }, (_, k) => {
              const x = k * wz, hit = golpeada(k);
              return (
                <g key={k}>
                  <rect x={x} y={LL.ZY} width={wz} height={LL.ZH} fill={ZONAS_LL[k]} />
                  {hit && verSombra && fase !== 'impacto' && <rect x={x} y={LL.ZY} width={wz} height={LL.ZH} fill="#000000" opacity="0.2" />}
                  {resultado && hit && <rect x={x} y={LL.ZY} width={wz} height={LL.ZH} fill="#E8322E" opacity="0.9" />}
                  <text x={x + wz / 2} y={LL.ZY + LL.ZH / 2 + 96} textAnchor="middle" className="vg-ll-num">{k + 1}</text>
                  {resultado && <text x={x + wz / 2} y={LL.ZY + 62} textAnchor="middle" className={'vg-ll-res' + (hit ? ' fuera' : ' salvo')}>{hit ? '✗ ¡FUERA!' : '✓ A SALVO'}</text>}
                  {hit && (fase === 'aviso' || fase === 'caida') && (
                    <rect x={x + 8} y={LL.ZY + 8} width={wz - 16} height={LL.ZH - 16} fill="none" stroke="#E8322E" strokeWidth="16" opacity={parpadeo} />
                  )}
                </g>
              );
            })}
            {Array.from({ length: n - 1 }, (_, k) => (
              <line key={k} x1={(k + 1) * wz} y1={LL.ZY} x2={(k + 1) * wz} y2={LL.ZY + LL.ZH} stroke={BORDE_LL} strokeWidth="12" />
            ))}
            <line x1="0" y1={LL.ZY} x2={LL.W} y2={LL.ZY} stroke={BORDE_LL} strokeWidth="8" />
            {/* Sombras de lo que va a caer */}
            {verSombra && golpe && zonasVis.map((z, j) => (
              <ellipse key={'s' + j} cx={xZona(j)} cy={LL.ZY + 52} rx={wz * 0.38 * sombra} ry={36 * sombra} fill="#000000" opacity={0.3 + 0.5 * sombra} />
            ))}
            {/* Objetos (aviso y caída) */}
            {(fase === 'aviso' || fase === 'caida') && golpe && zonasVis.map((z, j) => (
              <g key={'o' + j} transform={'translate(' + xZona(j).toFixed(1) + ' ' + yObjeto().toFixed(1) + ') scale(' + escalaObj.toFixed(3) + ') rotate(' + ((e / 12 + j * 40) % 360 * (golpe.objetos[j] === 'gota' ? 0 : 1)).toFixed(1) + ')'}>
                {OBJETOS_LL[golpe.objetos[j]].dibujo}
              </g>
            ))}
            {/* Impacto: el objeto se aplasta y salta en pedazos */}
            {fase === 'impacto' && golpe && golpe.zonas.map((z, j) => {
              const p = Math.min(1, e / LL.IMPACTO_MS), cx = z * wz + wz / 2, cy = LL.ZY + 40, ob = OBJETOS_LL[golpe.objetos[j]];
              return (
                <g key={'i' + z}>
                  <g transform={'translate(' + cx + ' ' + (cy + 30) + ') scale(' + (escalaObj * (1 + p * 0.4)).toFixed(3) + ' ' + (escalaObj * Math.max(0.1, 0.5 - p * 0.4)).toFixed(3) + ')'} opacity={1 - p}>{ob.dibujo}</g>
                  {Array.from({ length: 12 }, (_, q) => {
                    const ang = Math.PI + (q / 11) * Math.PI, d = 40 + p * wz * 0.55;
                    return <circle key={q} cx={cx + Math.cos(ang) * d} cy={cy + Math.sin(ang) * d * 0.9 + p * p * 160} r={18 * (1 - p) + 4} fill={ob.particula} stroke={BORDE_LL} strokeWidth="3" opacity={1 - p * 0.8} />;
                  })}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Arriba: ronda y aviso */}
        {enJuegoLL(fase) && fase !== 'cuenta' && (
          <div className="vg-ep-hud">🌧 Ronda {G.ronda} · Nivel {nivelLL(G.ronda)} · {golpe ? golpe.zonas.length : 1} {golpe && golpe.zonas.length > 1 ? 'zonas' : 'zona'} · 🧍 {totalEnPie} en pie</div>
        )}
        {(fase === 'aviso' || fase === 'caida') && !pausado && <div className="vg-ll-alerta">⚠ ¡A una zona segura!</div>}

        {/* Contadores grandes por equipo (abajo). Tras el impacto, con −1 / +1. */}
        {enJuegoLL(fase) && (
          <ContadoresEnPieCp eqV={eqV} E={G} conNombre clase="vg-ep-abajo"
            onTocar={fase === 'elimina' ? undefined : pausar} onCambiar={fase === 'elimina' && !pausado ? descontar : undefined} />
        )}

        {/* Cuenta regresiva (la de Dedos Veloces) */}
        {fase === 'cuenta' && !pausado && (
          <React.Fragment>
            <div key={'c' + G.seg} className="vg-dd-cuenta">{G.seg || 3}</div>
            <div className="vg-ll-alerta arriba">¡Todos a una zona!</div>
          </React.Fragment>
        )}

        {/* Pausa de eliminación (tras cada impacto): los contadores de abajo tienen −1 / +1 */}
        {fase === 'elimina' && !pausado && (
          <div className="vg-mi-tarjeta vg-ll-elimina" role="group" aria-label="Eliminados">
            <h2>💥 ¿Quién quedó en una zona golpeada?</h2>
            <p>Descuenta con <b>−1</b> en cada equipo (abajo), con las teclas 1–9 o desde el celular.</p>
            <div className="vg-mi-fila">
              {G.historial.length > 0 && <button type="button" className="vg-cp-btn suave" onClick={deshacer}>↩ Deshacer (D)</button>}
              <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
              <button type="button" className="vg-cp-btn grande" onClick={siguienteRonda}>▶ Siguiente ronda</button>
            </div>
          </div>
        )}

        {/* Botones (también en el celular) */}
        {corriendoLL(fase) && !pausado && (
          <div className="vg-mi-botones vg-ep-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {fase !== 'impacto' && <button type="button" onClick={pausar} title="Pausa (P o Espacio)">⏸</button>}
          </div>
        )}

        {/* Pausa general (durante el aviso o la caída) */}
        {pausado && enJuegoLL(fase) && (
          <PausaEnPieCp titulo="⏸ Pausa" eqV={eqV} E={G} onCambiar={descontar} onDeshacer={deshacer} onTerminar={terminar}
            onSeguir={seguir} textoSeguir={fase === 'cuenta' ? '▶ Seguir' : '▶ Seguir (se repite el aviso)'} />
        )}

        {/* Menú: zonas, velocidad y jugadores en pie */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · gana el último equipo en pie (+{pasos} pasos)</div>
              <h1 className="vg-mi-titulo">🌧 Esquiva la Lluvia</h1>
              <p className="vg-mi-intro">Caen gotas gigantes, cocos y piedras. Su <b>sombra</b> marca las zonas donde van a caer: ¡corre a una zona segura! Quien quede en una zona golpeada, se sienta. ¡Ojo! A veces la sombra <b>cambia de zona</b> justo antes de caer, y cada ronda es un poco más rápida.</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-ll-mini" aria-hidden="true">
                {Array.from({ length: zonas }, (_, k) => <span key={k} style={{ background: ZONAS_LL[k] }}>{k + 1}</span>)}
              </div>
              <p className="vg-ep-nota">📏 Marca las {zonas} zonas en el piso con cinta, frente al video beam, del mismo ancho que se ven proyectadas.</p>
              <div className="vg-mi-fila">
                <AjusteCp etiqueta="Zonas" valor={zonas} min={3} max={6} onCambiar={cambiarZonas} />
                <OpcionesCp valor={vel} onElegir={setVel} opciones={[['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']]} />
              </div>
              <div className="vg-mi-sub">🧍 Jugadores en pie por equipo</div>
              <JugadoresEnPieCp eqV={eqV} jugadores={jugadores} onCambiar={cambiarJugadores} />
              <div className="vg-mi-fila">
                <BotonSonidoCp silencio={silencio} onCambiar={alternarSilencio} />
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final */}
        {fase === 'fin' && (
          <FinJuegoCp a={a} equipos={equipos} eqV={eqV} ganadores={G.ganadores} pasos={pasos} filas={tabla}
            titulo={'🌧 Esquiva la Lluvia · ' + G.ronda + (G.ronda === 1 ? ' ronda' : ' rondas')}
            puedeDeshacer={G.historial.length > 0} onDeshacer={deshacer} onOtra={otraVez} onMontana={verMontana} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { EsquivaLluvia, OBJETOS_LL, ZONAS_LL });
