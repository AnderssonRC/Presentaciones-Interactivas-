/* capibara-congelados.jsx — Modo Capibara · «Congelados por Números» (cp-congelados).

   Fase de movimiento: suena música generada (Web Audio) y la pantalla dice
   «¡Caminen!»; los estudiantes caminan libremente por el salón durante un
   tiempo AL AZAR (impredecible; según `a.velocidadCongelados`). De pronto la
   música se corta y aparece un número enorme: hay que agruparse en conjuntos
   de exactamente ese tamaño antes de que termine una cuenta regresiva corta
   (`a.tiempoCongelados`, 6 s). Quien quede suelto o en un grupo del tamaño
   incorrecto, queda eliminado. El número sale al azar entre 2 y un máximo
   (`a.maxCongelados`, 6) que baja solo al total de jugadores en pie, así
   siempre se puede formar al menos un grupo.
   Dificultad: el tiempo para agruparse baja un 6 % por ronda (hasta el 55 %,
   mínimo 3 s) y, desde la ronda 3, cada 2 rondas entra una consigna nueva
   (`CONSIGNAS_CG`: tomados de las manos, espalda con espalda, tren…; +1 s).

   Eliminaciones: jugadores en pie por equipo (`a.jugadoresCongelados`;
   0 = los integrantes), contador grande por equipo y total en pie. Tras cada
   número, el docente descuenta por equipo (pantalla, teclas 1–9 / 0 o celular)
   con «+1» y «Deshacer». Gana el último equipo con jugadores en pie:
   `a.pasosCongelados` pasos hacia Jomu (`jaguarPunto`); luego enlace y montaña.

   Reutiliza capibara-comun.jsx (equipos, audio con silencio común, escenario
   16:9, jugadores en pie, pausa, final, montaña, estado del celular).
   Atajos: Espacio / Enter / Av Pág = acción principal (caminando: cortar la
   música; tras el número: siguiente ronda), C cortar, P pausa, D / Re Pág
   deshacer, M silencio, F pantalla completa; 1–9 y 0 = −1 al equipo (Shift: +1).
   Mando: `capibara = { juego: 'congelados', … }`, órdenes `cg-*`.

   Secciones: CONFIGURACIÓN · MÚSICA Y SONIDOS · REGLAS · COMPONENTE. */

/* =========================== CONFIGURACIÓN =========================== */
const CG = {
  W: 1600, H: 900,
  // segundos [mín, máx] caminando, según la velocidad
  CAMINAR: { lenta: [9, 17], media: [6, 13], rapida: [4, 9] },
  TIEMPO_MS: 1500,   // «¡Tiempo!» antes de descontar
  BAJA_POR_RONDA: 0.06, MIN_FACTOR: 0.55, MIN_MS: 3000,   // el tiempo para agruparse baja 6 % por ronda (hasta 55 %, nunca menos de 3 s)
  CONSIGNA_DESDE: 3, CONSIGNA_CADA: 2,                     // desde la ronda 3, una consigna nueva cada 2 rondas
  CONSIGNA_MS: 1000,                                       // un segundo más cuando hay consigna
};

/* ============================= CONSIGNAS =============================
   Cómo debe formarse el grupo. Se desbloquean EN ESTE ORDEN (la ronda en que
   entra una, sale esa); después se mezclan sin repetir la anterior. Son
   formaciones de grupo: no repiten acciones de otros juegos del Capibara. */
const CONSIGNAS_CG = [
  { id: 'manos', icono: '🤝', texto: 'tomados de las manos' },
  { id: 'espaldas', icono: '🔙', texto: 'espalda con espalda' },
  { id: 'tren', icono: '🚂', texto: 'en fila, como un tren' },
  { id: 'ronda', icono: '⭕', texto: 'en ronda, mirando hacia afuera' },
  { id: 'codos', icono: '💪', texto: 'codo con codo' },
  { id: 'dedos', icono: '☝️', texto: 'con un dedo de cada uno en el centro' },
];
// Consignas activas en la ronda r (0 = ninguna: solo «grupos de N»).
const consignasCG = (r) => (r < CG.CONSIGNA_DESDE ? 0
  : Math.min(CONSIGNAS_CG.length, 1 + Math.floor((r - CG.CONSIGNA_DESDE) / CG.CONSIGNA_CADA)));
function consignaCG(r, anterior) {
  const n = consignasCG(r);
  if (!n) return null;
  if (n > consignasCG(r - 1)) return CONSIGNAS_CG[n - 1];   // la nueva
  // Las rondas sin consigna nueva también pueden ser «solo grupos» (1 de cada n + 1).
  const op = [null].concat(CONSIGNAS_CG.slice(0, n)).filter((c) => (c && c.id) !== (anterior && anterior.id));
  return op[Math.floor(Math.random() * op.length)];
}
// Milisegundos para agruparse en la ronda r (con o sin consigna).
function limiteCG(segundos, r, conConsigna) {
  const f = Math.max(CG.MIN_FACTOR, 1 - CG.BAJA_POR_RONDA * (r - 1));
  return Math.max(CG.MIN_MS, Math.round(segundos * 1000 * f)) + (conConsigna ? CG.CONSIGNA_MS : 0);
}

/* ========================= MÚSICA Y SONIDOS =========================
   Música generada en vivo: bombo, aplauso, platillo, bajo y una melodía
   pentatónica. Se programa con poca anticipación (0,12 s): al cortar, se
   calla casi en el acto. Respeta el silencio común (audioCapibara). */
const BAJO_CG = [130.81, 130.81, 196.0, 174.61, 146.83, 146.83, 196.0, 220.0];
const MELODIA_CG = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
function crearMusicaCG() {
  let reloj = null, siguiente = 0, paso = 0, bpm = 124, nota = 2;
  const programar = () => {
    const c = audioCapibara.despertar();
    if (!c) return;
    const corchea = 60 / bpm / 2;
    while (siguiente < c.currentTime + 0.12) {
      const en = Math.max(0, siguiente - c.currentTime), p = paso % 16;
      if (p % 4 === 0) audioCapibara.tono(150, 0.16, 'sine', 0.32, en, 45);                 // bombo
      if (p === 4 || p === 12) audioCapibara.ruido(0.1, 0.2, 2200, en);                        // aplauso
      if (p % 2 === 1) audioCapibara.ruido(0.03, 0.07, 8000, en);                              // platillo
      if (p % 2 === 0) audioCapibara.tono(BAJO_CG[Math.floor(paso / 2) % BAJO_CG.length], corchea * 0.9, 'square', 0.06, en);
      if (p % 4 === 2 || (p % 4 === 0 && Math.random() < 0.5)) {
        nota = Math.max(0, Math.min(MELODIA_CG.length - 1, nota + Math.floor(Math.random() * 5) - 2));
        audioCapibara.tono(MELODIA_CG[nota], corchea * 1.6, 'triangle', 0.07, en);
      }
      siguiente += corchea; paso += 1;
    }
  };
  return {
    iniciar() {
      const c = audioCapibara.despertar();
      if (!c || reloj) return;
      bpm = 118 + Math.floor(Math.random() * 16);   // cada ronda, un tempo un poco distinto
      siguiente = c.currentTime + 0.05;
      reloj = setInterval(programar, 25); programar();
    },
    parar() { if (reloj) clearInterval(reloj); reloj = null; },
  };
}
const SONIDO_CG = {
  corte: () => { audioCapibara.tono(900, 0.45, 'sawtooth', 0.12, 0, 60); audioCapibara.ruido(0.25, 0.3, 3000); },
  numero: () => [440, 660, 880].forEach((f, i) => audioCapibara.tono(f, 0.18, 'square', 0.1, 0.05 + i * 0.06)),
  tic: (ultimo) => audioCapibara.tono(ultimo ? 1320 : 880, ultimo ? 0.12 : 0.08, 'square', ultimo ? 0.14 : 0.1),
  fin: () => { audioCapibara.tono(160, 0.7, 'sawtooth', 0.16); audioCapibara.tono(120, 0.7, 'square', 0.1); },
};

/* =============================== REGLAS =============================== */
// Número al azar entre 2 y el máximo (que nunca pasa del total en pie); no repite el anterior si se puede.
function numeroCG(maximo, total, anterior) {
  const max = Math.max(2, Math.min(maximo, total));
  if (max <= 2) return 2;
  let n = anterior;
  while (n === anterior) n = 2 + Math.floor(Math.random() * (max - 1));
  return n;
}
function caminarCG(vel) {
  const [a, b] = CG.CAMINAR[vel] || CG.CAMINAR.lenta;
  return (a + Math.random() * (b - a)) * 1000;
}
function nuevoJuegoCG(jugadores) {
  return { fase: 'menu', reloj: 0, inicio: 0, seg: null, ronda: 0, numero: null, consigna: null, limite: 0, caminar: 0, ...nuevoEnPieCp(jugadores) };
}
const corriendoCG = (f) => f === 'caminar' || f === 'numero' || f === 'tiempo';
const enJuegoCG = (f) => corriendoCG(f) || f === 'elimina';

/* ============================ COMPONENTE ============================ */
function CongeladosNumeros({ a, estudiantes, onContinuar }) {
  const { sesion, equipos, eqV } = useEquiposCp(a, estudiantes);
  // ---- Ajustes (editor y menú) ----
  const pasos = limitarCp(a.pasosCongelados, 1, 10, 3);
  const [vel, setVel] = React.useState(() => (CG.CAMINAR[a.velocidadCongelados] ? a.velocidadCongelados : 'lenta'));
  const [tiempo, setTiempo] = React.useState(() => limitarCp(a.tiempoCongelados, 3, 15, 6));
  const [maximo, setMaximo] = React.useState(() => limitarCp(a.maxCongelados, 3, 10, 6));
  const [jugadores, setJugadores] = React.useState(() => jugadoresInicialesCp(equipos, a.jugadoresCongelados));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoCG(jugadores);
  const cfg = React.useRef({});
  cfg.current = { vel, tiempo, maximo, jugadores, pausado, nEq: eqV.length };
  const G = g.current;
  const musica = React.useRef(null);
  if (!musica.current) musica.current = crearMusicaCG();
  React.useEffect(() => () => musica.current.parar(), []);
  const seguirJuego = React.useRef(onContinuar);
  seguirJuego.current = onContinuar;
  const { raiz, tam } = useLienzoCp(CG.W, CG.H);
  const totalDe = (X) => X.enPie.reduce((s, v) => s + v, 0);

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; setFase(f); };
  // Ronda nueva: a caminar con música, durante un tiempo al azar.
  const iniciarRonda = () => {
    const X = g.current;
    if (!(X.fase === 'elimina' || X.fase === 'menu' || X.fase === 'tiempo') || cfg.current.pausado) return;
    audioCapibara.despertar();
    X.ronda += 1; X.numero = null; X.caminar = caminarCG(cfg.current.vel);
    irA('caminar'); musica.current.iniciar(); refrescar();
  };
  const empezar = () => {
    if (g.current.fase !== 'menu') return;
    const X = nuevoJuegoCG(cfg.current.jugadores);
    X.reloj = g.current.reloj; g.current = X;
    iniciarRonda();
  };
  // ¡Corte! La música se calla y aparece el número.
  const cortar = () => {
    const X = g.current;
    if (X.fase !== 'caminar' || cfg.current.pausado) return;
    musica.current.parar(); SONIDO_CG.corte();
    X.numero = numeroCG(cfg.current.maximo, totalDe(X), X.numero);
    X.consigna = consignaCG(X.ronda, X.consigna);
    X.limite = limiteCG(cfg.current.tiempo, X.ronda, !!X.consigna);
    setTimeout(SONIDO_CG.numero, 250);
    irA('numero'); refrescar();
  };
  const pausar = () => {
    const X = g.current;
    if (!corriendoCG(X.fase) || X.fase === 'tiempo' || cfg.current.pausado) return;
    cfg.current.pausado = true; setPausado(true);
    musica.current.parar(); SONIDO_CP.pausa();
  };
  // Al seguir: la música vuelve; la cuenta del número sigue donde iba.
  const seguir = () => {
    if (!cfg.current.pausado) return;
    cfg.current.pausado = false; setPausado(false);
    if (g.current.fase === 'caminar') musica.current.iniciar();
    refrescar();
  };
  const alternarPausa = () => (cfg.current.pausado ? seguir() : pausar());
  const descontar = (i, d) => {
    const X = g.current;
    if (!enJuegoCG(X.fase)) return;
    if (X.fase === 'caminar' || X.fase === 'numero') pausar();
    if (!cambiarEnPieCp(X, i, d)) { refrescar(); return; }
    if (d < 0) SONIDO_CP.elimina(); else SONIDO_CP.corrige();
    if (equiposEnPieCp(X) <= 1) fin();
    else refrescar();
  };
  const deshacer = () => {
    const X = g.current;
    if (!(enJuegoCG(X.fase) || X.fase === 'fin') || !deshacerEnPieCp(X)) return;
    if (X.fase === 'fin') { anularGanadoresCp(X, pasos); irA('elimina'); }
    SONIDO_CP.corrige(); refrescar();
  };
  const fin = () => {
    const X = g.current;
    musica.current.parar();
    registrarGanadoresCp(X, pasos);
    cfg.current.pausado = false; setPausado(false);
    SONIDO_CP.ganador(); irA('fin'); refrescar();
  };
  const terminar = () => { if (enJuegoCG(g.current.fase)) fin(); };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const enMenu = () => g.current.fase === 'menu';
  const cambiarTiempo = (d) => { if (enMenu()) setTiempo((t) => Math.max(3, Math.min(15, t + d))); };
  const cambiarMaximo = (d) => { if (enMenu()) setMaximo((m) => Math.max(3, Math.min(10, m + d))); };
  const cambiarJugadores = (i, d) => {
    if (!enMenu()) return;
    setJugadores((js) => js.map((n, k) => (k === i ? limitarCp(n + d, 1, 40, 5) : n)));
  };
  const principal = () => {
    const X = g.current;
    if (cfg.current.pausado) seguir();
    else if (X.fase === 'menu') empezar();
    else if (X.fase === 'caminar') cortar();
    else if (X.fase === 'numero') pausar();
    else if (X.fase === 'tiempo') irA('elimina');
    else if (X.fase === 'elimina') iniciarRonda();
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguirJuego.current();
  };

  // ---- Reloj: caminar (tiempo al azar), cuenta del número y «¡Tiempo!» ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current;
      if (!cfg.current.pausado && corriendoCG(X.fase)) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'caminar') {
          if (e >= X.caminar) cortar();
        } else if (X.fase === 'numero') {
          const total = X.limite || cfg.current.tiempo * 1000;
          const seg = Math.ceil((total - e) / 1000);
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_CG.tic(seg <= 3); }
          if (e >= total) { SONIDO_CG.fin(); irA('tiempo'); }
          refrescar();
        } else if (X.fase === 'tiempo') {
          if (e >= CG.TIEMPO_MS) irA('elimina');
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
      const X = g.current, k = e.key, l = k && k.length === 1 ? k.toUpperCase() : '';
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (k === ' ' || k === 'Enter' || k === 'PageDown') {
        if (e.target && /button/i.test(e.target.tagName) && k !== 'PageDown') return;
        tomar(); if (!e.repeat) principal(); return;
      }
      if (k === 'PageUp' || l === 'D') { tomar(); deshacer(); return; }
      const i = equipoDeTeclaCp(e);
      if (i >= 0 && enJuegoCG(X.fase)) {
        if (i < cfg.current.nEq) { tomar(); if (!e.repeat) descontar(i, e.shiftKey ? 1 : -1); }
        return;
      }
      if (l === 'P') { tomar(); alternarPausa(); }
      else if (l === 'C') { tomar(); cortar(); }
      else if (l === 'M') { tomar(); alternarSilencio(); }
      else if (l === 'F') { tomar(); pantallaCompletaCp(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: estado y órdenes ----
  usePublicarCp({
    juego: 'congelados', fase, pausado, silencio, vel, tiempo, maximo, jugadores, ronda: G.ronda, numero: fase === 'menu' ? null : G.numero,
    consigna: fase === 'menu' || !G.consigna ? null : G.consigna.icono + ' ' + G.consigna.texto,
    limite: fase === 'menu' ? null : Math.round((G.limite || tiempo * 1000) / 100) / 10,
    total: totalDe(G), enPie: G.enPie, inicial: G.inicial, puedeDeshacer: G.historial.length > 0, ganadores: G.ganadores,
    eqs: eqV.map((e) => ({ corto: e.corto, emoji: e.emoji, color: e.color })),
  });
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'cg-empezar') empezar();
    else if (x === 'cg-velocidad') { if (enMenu() && CG.CAMINAR[o.v]) setVel(o.v); }
    else if (x === 'cg-tiempo') cambiarTiempo(Number(o.d) || 0);
    else if (x === 'cg-maximo') cambiarMaximo(Number(o.d) || 0);
    else if (x === 'cg-jugadores') cambiarJugadores(Number(o.i), Number(o.d) || 0);
    else if (x === 'cg-ronda') { if (X.fase === 'menu') empezar(); else iniciarRonda(); }
    else if (x === 'cg-cortar') cortar();
    else if (x === 'cg-pausa') alternarPausa();
    else if (x === 'cg-descontar') descontar(Number(o.i), -1);
    else if (x === 'cg-sumar') descontar(Number(o.i), 1);
    else if (x === 'cg-deshacer') deshacer();
    else if (x === 'cg-terminar') terminar();
    else if (x === 'cg-silencio') alternarSilencio();
    else if (x === 'cg-montana') verMontana();
    else if (x === 'cg-otra') otraVez();
    else if (x === 'cg-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });

  /* ============================ INTERFAZ ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Congelados por Números" />;
  const total = totalDe(G);
  const e = G.reloj - G.inicio;
  const limite = G.limite || tiempo * 1000;
  const restante = fase === 'numero' ? Math.max(0, limite - e) : 0;
  const p = fase === 'numero' ? restante / limite : 0;
  const tabla = tablaEnPieCp(eqV, G);
  const maxAhora = Math.max(2, Math.min(maximo, total));

  return (
    <div className={'vg-cp vg-mi vg-cg fase-' + fase} ref={raiz} role="dialog" aria-label="Congelados por Números">
      <div className="vg-mi-escenario vg-cg-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>

        {/* Caminar: música y «¡Caminen!» */}
        {(fase === 'caminar' || fase === 'menu') && (
          <div className={'vg-cg-caminar' + (pausado || fase === 'menu' ? ' quieto' : '')}>
            <div className="vg-cg-eq" aria-hidden="true">{Array.from({ length: 9 }, (_, k) => <i key={k} style={{ animationDelay: (-k * 0.13).toFixed(2) + 's' }}></i>)}</div>
            <div className="vg-cg-pies" aria-hidden="true">🦫 🐸 🦜 🐝</div>
            <div className="vg-cg-camina">¡Caminen!</div>
            <div className="vg-cg-sub">Muévanse por todo el salón… ¡atentos a la música!</div>
          </div>
        )}

        {/* El número enorme y la cuenta regresiva */}
        {(fase === 'numero' || fase === 'tiempo' || fase === 'elimina') && G.numero && (
          <div className={'vg-cg-numero' + (fase === 'elimina' ? ' chico' : '') + (G.consigna ? ' con-consigna' : '')}>
            <div className="vg-cg-grupos">¡Grupos de</div>
            <b key={'n' + G.ronda}>{G.numero}</b>
            {G.consigna && <div className="vg-cg-consigna" key={'c' + G.ronda}>{G.consigna.icono} {G.consigna.texto}</div>}
            {fase === 'numero' && (
              <div className={'vg-cg-reloj' + (restante <= 3000 ? ' poco' : '')} style={{ '--p': p.toFixed(3) }}>
                <span>{Math.ceil(restante / 1000)}</span>
              </div>
            )}
          </div>
        )}
        {fase === 'tiempo' && <div className="vg-cg-tiempo">¡TIEMPO!</div>}

        {/* Arriba: ronda y total en pie */}
        {enJuegoCG(fase) && <div className="vg-ep-hud">🧊 Ronda {G.ronda} · 🧍 {total} en pie · números del 2 al {maxAhora} · ⏱ {(Math.round(limiteCG(tiempo, Math.max(1, G.ronda), false) / 100) / 10).toString().replace('.', ',')} s</div>}

        {/* Contadores grandes por equipo (abajo) */}
        {enJuegoCG(fase) && fase !== 'elimina' && <ContadoresEnPieCp eqV={eqV} E={G} conNombre clase="vg-ep-abajo" onTocar={pausar} />}

        {/* Botones (también en el celular) */}
        {corriendoCG(fase) && !pausado && (
          <div className="vg-mi-botones vg-ep-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {fase === 'caminar' && <button type="button" className="falla" onClick={cortar} title="Cortar la música (Espacio o C)">✂ Cortar música</button>}
            {fase !== 'tiempo' && <button type="button" onClick={pausar} title="Pausa (P)">⏸</button>}
          </div>
        )}

        {/* Tras el número: descontar eliminados por equipo */}
        {fase === 'elimina' && !pausado && (
          <PausaEnPieCp titulo="❄ ¿Quién quedó suelto o en un grupo incorrecto?" eqV={eqV} E={G} onCambiar={descontar} onDeshacer={deshacer}
            onTerminar={terminar} onSeguir={iniciarRonda} textoSeguir="▶ Siguiente ronda">
            <p className="vg-mi-intro">Grupos de <b>{G.numero}</b>{G.consigna ? ' ' + G.consigna.texto : ''} · 🧍 {total} en pie</p>
          </PausaEnPieCp>
        )}

        {/* Pausa general */}
        {pausado && enJuegoCG(fase) && (
          <PausaEnPieCp titulo="⏸ Pausa" eqV={eqV} E={G} onCambiar={descontar} onDeshacer={deshacer} onTerminar={terminar}
            onSeguir={seguir} textoSeguir={fase === 'caminar' ? '▶ Seguir (vuelve la música)' : '▶ Seguir'} />
        )}

        {/* Menú */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · gana el último equipo en pie (+{pasos} pasos)</div>
              <h1 className="vg-mi-titulo">🧊 Congelados por Números</h1>
              <p className="vg-mi-intro">Caminen por el salón mientras suena la música. Cuando se corte, aparece un <b>número</b>: ¡formen grupos de exactamente ese tamaño antes de que acabe el tiempo! Quien quede suelto o en un grupo incorrecto, se sienta.</p>
              <p className="vg-ep-nota">Cada ronda hay un poco menos de tiempo y, desde la ronda {CG.CONSIGNA_DESDE}, se suman consignas: {CONSIGNAS_CG.map((c) => c.texto).join(', ')}.</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-mi-fila">
                <OpcionesCp etiqueta="Caminar" valor={vel} onElegir={setVel} opciones={[['lenta', '🐢 Largo'], ['media', 'Medio'], ['rapida', '🐆 Corto']]} />
              </div>
              <div className="vg-mi-fila">
                <AjusteCp etiqueta="Para agruparse" valor={tiempo} sufijo="s" min={3} max={15} onCambiar={cambiarTiempo} />
                <AjusteCp etiqueta="Número máximo" valor={maximo} min={3} max={10} onCambiar={cambiarMaximo} />
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
            titulo={'🧊 Congelados por Números · ' + G.ronda + (G.ronda === 1 ? ' ronda' : ' rondas')}
            puedeDeshacer={G.historial.length > 0} onDeshacer={deshacer} onOtra={otraVez} onMontana={verMontana} />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CongeladosNumeros });
