/* capibara-dedos.jsx — Modo Capibara · «Dedos Veloces» (cp-dedos).

   Gana quien presione más veces en el tiempo límite (`a.tiempoDedos`, 10 s).
   Cuenta regresiva «3, 2, 1, ¡YA!» (antes no cuenta nada). Al terminar se
   congela, se muestra al ganador de la ronda y gana 1 paso hacia Jomu
   (`jaguarPunto`). Empate: desempate de 5 s solo entre los empatados.
   `a.rondasDedos` rondas; al final, tabla (rondas ganadas), enlace y montaña.

   Modos (`a.modoDedos`: 'auto' | 'simultaneo' | 'turnos'):
     · simultáneo: cada concursante con su tecla (`a.teclasDedos`, cambiables
       en el editor y en la prueba). keydown ignorando `event.repeat`. Antes
       de la primera ronda, prueba de teclas (los teclados no siempre leen
       varias teclas juntas).
     · por turnos: un concursante a la vez con un botón gigante (clic, toque,
       Espacio o el celular del docente); su resultado queda fijo en el marcador.
     · auto: por turnos si el dispositivo es táctil (pointer: coarse) o si en
       la prueba se toca la pantalla sin haber usado el teclado.

   Reutiliza (no reimplementa): sesión de equipos del Jaguar, capibara-comun.jsx
   (audio y silencio común, escenario 16:9 `useLienzoCp`, concursantes
   `siguienteConcursanteCp`, `TablaFinalCp`, `MontanaFinalCp`), `equiposCapibara`,
   `EnlaceJaguar`, el estado del mando `fijarEstadoCapibara` y los estilos
   `vg-mi-*`. Atajos iguales a los otros juegos: Espacio / Enter / Av Pág =
   acción principal, P pausa, R repetir ronda, N siguiente concursante,
   M silencio, F pantalla completa (por eso las teclas de los equipos no
   pueden ser P, R, N, M, F, L ni D).

   Secciones: CONFIGURACIÓN · DETECCIÓN DE MODO · AUDIO · MODO SIMULTÁNEO ·
   MODO POR TURNOS · MARCADOR (componente y su interfaz). */

/* =========================== CONFIGURACIÓN =========================== */
const DD = {
  CUENTA_MS: 3000, YA_MS: 700, CONGELA_MS: 1300, DESEMPATE_MS: 5000,
  TECLAS: ['Q', 'O', 'Z', 'K', 'T', 'B', 'Y', 'H', 'X', 'U'],
  ATAJOS: ['P', 'R', 'N', 'M', 'F', 'L', 'D'],
};
const teclaDD = (e) => (e.key && e.key.length === 1 ? e.key.toUpperCase() : e.key);
const limitarDD = (v, a, b, d) => Math.max(a, Math.min(b, Number(v) || d));

/* ========================= DETECCIÓN DE MODO ========================= */
function detectarModoDD(pref) {
  if (pref === 'simultaneo' || pref === 'turnos') return pref;
  try {
    if (window.matchMedia && matchMedia('(pointer: coarse)').matches && !matchMedia('(any-pointer: fine)').matches) return 'turnos';
  } catch (e) { /* */ }
  return 'simultaneo';
}

/* =============================== AUDIO =============================== */
let ultimoToqueDD = 0;
const SONIDO_DD = {
  cuenta: () => audioCapibara.tono(660, 0.12, 'square', 0.12),
  ya: () => audioCapibara.tono(990, 0.4, 'square', 0.16),
  // Toque: muy corto y sin amontonarse (máximo uno cada 45 ms).
  toque: () => { const t = performance.now(); if (t - ultimoToqueDD < 45) return; ultimoToqueDD = t; audioCapibara.tono(1300, 0.025, 'triangle', 0.035); },
  final: () => audioCapibara.tono(240, 0.5, 'sawtooth', 0.18, 0, 110),
  ganador: () => [523, 659, 784, 1047, 1319].forEach((f, i) => audioCapibara.tono(f, 0.25, 'triangle', 0.17, i * 0.1)),
};

function nuevoJuegoDD(n) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, ronda: 1, desempate: false, intento: 0,
    participantes: [], concursantes: {}, toques: {}, cel: {}, turnoIdx: 0, fijos: {},
    ganadores: [], registrado: false, probadas: {}, cambiando: null, vioTeclado: false, seg: null,
    eq: Array.from({ length: n }, () => ({ puntos: 0, toques: 0 })),
  };
}

function DedosVeloces({ a, estudiantes, onContinuar }) {
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

  const rondas = limitarDD(a.rondasDedos, 1, 10, 3);
  const [modo, setModo] = React.useState(() => detectarModoDD(a.modoDedos));
  const [tiempo, setTiempo] = React.useState(() => limitarDD(a.tiempoDedos, 3, 60, 10));
  const [teclas, setTeclas] = React.useState(() => eqV.map((_, i) => String(((a.teclasDedos || [])[i]) || DD.TECLAS[i] || i).toUpperCase()));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [ver, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoDD(eqV.length);
  const cfg = React.useRef({});
  cfg.current = { modo, tiempo, rondas, teclas, pausado, nEq: eqV.length };
  const G = g.current;
  const seguir = React.useRef(onContinuar);
  seguir.current = onContinuar;
  const { raiz, tam } = useLienzoCp(1600, 900);
  const reloj = React.useRef(null), barra = React.useRef(null);

  // ---- Reglas comunes ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; setFase(f); };
  const toquesDe = (i) => (g.current.toques[i] || 0) + (g.current.cel[i] || 0);
  const duracion = () => (g.current.desempate ? DD.DESEMPATE_MS : cfg.current.tiempo * 1000);
  const actual = () => { const X = g.current; return X.participantes[X.turnoIdx]; };   // por turnos
  const limpiarToques = () => {
    const X = g.current;
    X.participantes.forEach((i) => { X.toques[i] = 0; X.cel[i] = 0; delete X.fijos[i]; });
    X.turnoIdx = 0; X.intento += 1;
  };
  const elegirConcursantes = () => {
    const X = g.current;
    X.concursantes = {};
    X.participantes.forEach((i) => { X.concursantes[i] = siguienteConcursanteCp(i); });   // los elige la plataforma
  };
  const empezar = () => {
    const C = cfg.current;
    audioCapibara.despertar();
    const X = nuevoJuegoDD(C.nEq);
    X.reloj = g.current.reloj; X.vioTeclado = g.current.vioTeclado;
    g.current = X;
    X.participantes = Array.from({ length: C.nEq }, (_, i) => i);
    elegirConcursantes(); limpiarToques();
    irA(C.modo === 'simultaneo' ? 'prueba' : 'presenta'); refrescar();
  };
  const listoPrueba = () => { if (g.current.fase === 'prueba') { g.current.cambiando = null; irA('presenta'); refrescar(); } };
  const aTurnos = () => { setModo('turnos'); cfg.current.modo = 'turnos'; const X = g.current; if (X.fase === 'prueba') { X.cambiando = null; irA('presenta'); } refrescar(); };
  // Iniciar ronda (simultáneo) o turno (por turnos): cuenta regresiva.
  const iniciar = () => {
    const X = g.current;
    if (X.fase !== 'presenta') return;
    if (cfg.current.modo === 'simultaneo') X.participantes.forEach((i) => { X.toques[i] = 0; X.cel[i] = 0; });
    else { const i = actual(); X.toques[i] = 0; X.cel[i] = 0; }
    audioCapibara.despertar(); irA('cuenta'); refrescar();
  };
  const tocar = (i) => {
    const X = g.current;
    if (X.fase !== 'jugando' || cfg.current.pausado || !X.participantes.includes(i)) return;
    if (cfg.current.modo === 'turnos' && i !== actual()) return;
    X.toques[i] = (X.toques[i] || 0) + 1;
    SONIDO_DD.toque(); refrescar();
  };
  // Fin del tiempo → resultado de la ronda (o del turno).
  const resolver = () => {
    const X = g.current;
    const max = Math.max(0, ...X.participantes.map(toquesDe));
    X.ganadores = max > 0 ? X.participantes.filter((i) => toquesDe(i) === max) : [];
    if (X.ganadores.length === 1) registrar(X.ganadores[0]);
    else SONIDO_DD.final();
    irA('resultado'); refrescar();
  };
  const registrar = (i) => {
    const X = g.current;
    if (X.registrado) return;
    X.registrado = true;
    X.eq[i].puntos += 1;
    X.participantes.forEach((k) => { X.eq[k].toques += toquesDe(k); });
    jaguarPunto(i, 1);   // 1 paso hacia Jomu (sistema existente)
    SONIDO_DD.ganador();
  };
  const desempatar = () => {
    const X = g.current;
    if (X.fase !== 'resultado' || X.ganadores.length < 2) return;
    X.participantes = X.ganadores.slice(); X.desempate = true; X.registrado = false; X.ganadores = [];
    limpiarToques(); irA('presenta'); refrescar();
  };
  const siguienteRonda = () => {
    const X = g.current, C = cfg.current;
    if (X.fase !== 'resultado' || !X.registrado) return;
    if (X.ronda >= C.rondas) { fin(); return; }
    X.ronda += 1; X.desempate = false; X.registrado = false; X.ganadores = [];
    X.participantes = Array.from({ length: C.nEq }, (_, i) => i);
    elegirConcursantes(); limpiarToques(); irA('presenta'); refrescar();
  };
  // Por turnos: al terminar un turno, el siguiente concursante (o el resultado).
  const siguienteConcursante = () => {
    const X = g.current;
    if (X.fase !== 'finTurno') return;
    if (X.turnoIdx < X.participantes.length - 1) { X.turnoIdx += 1; irA('presenta'); refrescar(); }
    else resolver();
  };
  const repetir = () => {
    const X = g.current;
    if (X.registrado || !['presenta', 'cuenta', 'jugando', 'congela', 'finTurno', 'resultado'].includes(X.fase)) return;
    setPausado(false); cfg.current.pausado = false;
    X.ganadores = []; limpiarToques(); irA('presenta'); refrescar();
  };
  const alternarPausa = () => {
    if (!['cuenta', 'jugando'].includes(g.current.fase)) return;
    setPausado((p) => { cfg.current.pausado = !p; return !p; });
  };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const fin = () => { setPausado(false); cfg.current.pausado = false; SONIDO_DD.ganador(); irA('fin'); refrescar(); };
  const terminar = () => { if (!['menu', 'fin', 'montana'].includes(g.current.fase)) fin(); };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  const principal = () => {
    const X = g.current;
    if (X.fase === 'menu') empezar();
    else if (X.fase === 'prueba') listoPrueba();
    else if (X.fase === 'presenta') iniciar();
    else if (X.fase === 'finTurno') siguienteConcursante();
    else if (X.fase === 'resultado') { if (X.ganadores.length > 1) desempatar(); else if (X.registrado) siguienteRonda(); else repetir(); }
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguir.current();
  };

  // ---- Reloj: cuenta regresiva, tiempo y congelado ----
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
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_DD.cuenta(); refrescar(); }
          if (e >= DD.CUENTA_MS) { SONIDO_DD.ya(); irA('jugando'); }
        } else if (X.fase === 'jugando' && e >= duracion()) { SONIDO_DD.final(); irA('congela'); }
        else if (X.fase === 'congela' && e >= DD.CONGELA_MS) {
          if (C.modo === 'turnos') { const i = actual(); X.fijos[i] = toquesDe(i); irA('finTurno'); refrescar(); }
          else resolver();
        }
      }
      // tiempo restante (texto grande y barra) sin volver a pintar React
      const e = X.reloj - X.inicio;
      const resto = X.fase === 'jugando' ? Math.max(0, duracion() - e) : X.fase === 'cuenta' || X.fase === 'presenta' ? duracion() : 0;
      if (reloj.current) reloj.current.textContent = (resto / 1000).toFixed(1);
      if (barra.current) {
        barra.current.style.transform = 'scaleX(' + (resto / duracion()).toFixed(3) + ')';
        barra.current.classList.toggle('poco', X.fase === 'jugando' && resto < 3000);
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================= MODO SIMULTÁNEO =========================
     Cada equipo con su tecla. keydown sin repetición automática. En la
     prueba: presionar marca la tecla como detectada; tocar una columna
     permite cambiar su tecla (la siguiente que se presione). */
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const X = g.current, C = cfg.current, t = teclaDD(e), l = typeof t === 'string' && t.length === 1 ? t : '';
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      X.vioTeclado = true;
      // Cambiar la tecla de un equipo (prueba)
      if (X.fase === 'prueba' && X.cambiando !== null && l) {
        tomar();
        if (/^[A-Z0-9Ñ]$/.test(l) && !DD.ATAJOS.includes(l) && !C.teclas.some((k, j) => k === l && j !== X.cambiando)) {
          const nuevas = C.teclas.slice(); nuevas[X.cambiando] = l; setTeclas(nuevas); X.probadas[X.cambiando] = false;
        }
        X.cambiando = null; refrescar(); return;
      }
      const idx = C.modo === 'simultaneo' && l ? C.teclas.indexOf(l) : -1;
      if (idx >= 0 && idx < C.nEq && X.fase !== 'menu' && X.fase !== 'fin' && X.fase !== 'montana') {
        tomar();
        if (e.repeat) return;   // mantener presionada = un solo toque
        if (X.fase === 'prueba') { X.probadas[idx] = true; SONIDO_DD.toque(); refrescar(); }
        else tocar(idx);
        return;
      }
      // Por turnos con teclado o presentador: Espacio / Enter / Av Pág también tocan el botón.
      const esPrincipal = e.key === ' ' || e.key === 'Enter' || e.key === 'PageDown';
      if (esPrincipal) {
        if (e.target && /button/i.test(e.target.tagName) && e.key !== 'PageDown' && X.fase !== 'jugando') return;
        tomar();
        if (e.repeat) return;
        if (X.fase === 'jugando' && C.modo === 'turnos') tocar(actual());
        else if (X.fase !== 'jugando' && X.fase !== 'cuenta' && X.fase !== 'congela') principal();
        return;
      }
      if (l === 'P') { tomar(); alternarPausa(); }
      else if (l === 'R') { tomar(); repetir(); }
      else if (l === 'N') { tomar(); siguienteConcursante(); }
      else if (l === 'M') { tomar(); alternarSilencio(); }
      else if (l === 'F') { tomar(); pantallaCompleta(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================= MODO POR TURNOS =========================
     Botón gigante (clic o toque). En «auto», si en la prueba se toca la
     pantalla sin haber usado el teclado, se pasa solo a por turnos. */
  const onTocarBoton = (ev) => { ev.preventDefault(); tocar(actual()); };
  const onTocarPrueba = (ev) => {
    if (ev.pointerType === 'touch' && !g.current.vioTeclado && a.modoDedos !== 'simultaneo') aTurnos();
  };

  // ---- Mando: estado y órdenes ----
  const idTurno = G.ronda + '.' + (G.desempate ? 1 : 0) + '.' + G.turnoIdx + '.' + G.intento;
  React.useEffect(() => {
    fijarEstadoCapibara({
      juego: 'dedos', fase, modo, pausado, silencio, tiempo, ronda: G.ronda, rondas, desempate: G.desempate,
      participantes: G.participantes, actual: modo === 'turnos' ? actual() : null, idTurno,
      toques: G.participantes.map((i) => ({ i, n: toquesDe(i), fijo: G.fijos[i] })), ganadores: G.ganadores, registrado: G.registrado,
      probadas: eqV.map((_, i) => !!G.probadas[i]), teclas,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pausado, silencio, tiempo, modo, teclas, ver]);
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'dd-empezar') { if (X.fase === 'menu') empezar(); }
    else if (x === 'dd-modo') { if (X.fase === 'menu' && (o.v === 'simultaneo' || o.v === 'turnos')) setModo(o.v); }
    else if (x === 'dd-tiempo') { if (X.fase === 'menu') setTiempo((t) => limitarDD(t + (o.d || 0), 3, 60, 10)); }
    else if (x === 'dd-listo') listoPrueba();
    else if (x === 'dd-turnos') aTurnos();
    else if (x === 'dd-iniciar') iniciar();
    else if (x === 'dd-repetir') repetir();
    else if (x === 'dd-pausa') alternarPausa();
    else if (x === 'dd-siguiente') siguienteConcursante();
    else if (x === 'dd-desempate') desempatar();
    else if (x === 'dd-ronda') siguienteRonda();
    else if (x === 'dd-terminar') terminar();
    else if (x === 'dd-silencio') alternarSilencio();
    else if (x === 'dd-montana') verMontana();
    else if (x === 'dd-otra') otraVez();
    else if (x === 'dd-continuar') { if (X.fase === 'montana') onContinuar(); }
    // Toques desde el celular (por turnos): llegan como total acumulado del turno, así no se pierden.
    else if (x === 'dd-toques') {
      // (se aceptan hasta 0,6 s después del final: lo que tarda en llegar desde el celular)
      const aTiempo = X.fase === 'jugando' || (X.fase === 'congela' && X.reloj - X.inicio < 600);
      if (aTiempo && cfg.current.modo === 'turnos' && o.id === idTurnoActual() && !cfg.current.pausado) {
        const i = actual(), n = Math.max(0, Number(o.n) || 0);
        if (n > (X.cel[i] || 0)) { X.cel[i] = n; SONIDO_DD.toque(); refrescar(); }
      }
    }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });
  function idTurnoActual() { const X = g.current; return X.ronda + '.' + (X.desempate ? 1 : 0) + '.' + X.turnoIdx + '.' + X.intento; }

  /* ============================ MARCADOR ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Dedos Veloces" />;
  const enRonda = ['presenta', 'cuenta', 'jugando', 'congela', 'finTurno', 'resultado', 'prueba'].includes(fase);
  const maxToques = Math.max(20, ...G.participantes.map(toquesDe));
  const quien = modo === 'turnos' && G.participantes.length ? actual() : null;
  const eqQuien = quien !== null ? eqV[quien] : null;
  const unGanador = G.ganadores.length === 1 ? eqV[G.ganadores[0]] : null;
  const tabla = eqV.map((e, i) => ({ ...e, i, ...G.eq[i] })).sort((x, y) => y.puntos - x.puntos || y.toques - x.toques);
  const ganadorFinal = tabla[0] && tabla[0].puntos > 0 ? tabla[0].i : null;
  const empateFinal = tabla.length > 1 && tabla[0].puntos > 0 && tabla[0].puntos === tabla[1].puntos;
  const congelado = fase === 'congela' || fase === 'resultado' || fase === 'finTurno';
  const rankingRonda = G.participantes.map((i) => ({ ...eqV[i], i, puntos: toquesDe(i), detalle: G.concursantes[i] || '' }))
    .sort((x, y) => y.puntos - x.puntos);

  return (
    <div className="vg-cp vg-mi vg-dd" ref={raiz} role="dialog" aria-label="Dedos Veloces">
      <div className="vg-mi-escenario vg-dd-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>

        {/* Cabecera: ronda y tiempo enorme */}
        {enRonda && fase !== 'prueba' && (
          <div className="vg-dd-cabeza">
            <span className="vg-mi-ronda">{G.desempate ? '⚔ Desempate' : 'Ronda ' + G.ronda + '/' + rondas}</span>
            <span className="vg-dd-reloj" ref={reloj}>{(duracion() / 1000).toFixed(1)}</span>
            <span className="vg-dd-seg">s</span>
          </div>
        )}
        {enRonda && fase !== 'prueba' && <div className="vg-mi-tiempo vg-dd-barra"><i ref={barra}></i></div>}

        {/* ---- Simultáneo: una columna por equipo que crece en tiempo real ---- */}
        {modo === 'simultaneo' && enRonda && (
          <div className="vg-dd-columnas">
            {eqV.map((e, i) => {
              const juega = G.participantes.includes(i);
              const n = toquesDe(i);
              const gano = fase === 'resultado' && G.ganadores.length === 1 && G.ganadores[0] === i;
              return (
                <div key={i} className={'vg-dd-col' + (juega ? '' : ' fuera') + (gano ? ' gano' : '') + (fase === 'prueba' && G.probadas[i] ? ' ok' : '')}
                  style={{ '--c': e.color }} onPointerDown={fase === 'prueba' ? onTocarPrueba : undefined}
                  onClick={fase === 'prueba' ? () => { g.current.cambiando = i; refrescar(); } : undefined}>
                  {gano && <div className="vg-dd-corona" aria-hidden="true">👑</div>}
                  <div className="vg-dd-col-cabeza"><span className="emo">{e.emoji}</span><strong>{e.corto}</strong></div>
                  <div className="vg-dd-nombre">{G.concursantes[i] || ''}</div>
                  {fase === 'prueba' ? (
                    <div className="vg-dd-prueba">{G.cambiando === i ? 'Presiona la nueva tecla…' : G.probadas[i] ? '✓ ¡Detectada!' : 'Presiona tu tecla'}</div>
                  ) : (
                    <div className="vg-dd-tubo"><i style={{ height: Math.min(100, (n / maxToques) * 100) + '%' }}></i><b>{n}</b></div>
                  )}
                  <kbd className="vg-dd-tecla">{teclas[i]}</kbd>
                </div>
              );
            })}
          </div>
        )}

        {/* ---- Por turnos: botón gigante y marcador fijo de todos los equipos ---- */}
        {modo === 'turnos' && enRonda && eqQuien && (
          <React.Fragment>
            <div className="vg-dd-turno-nombre" style={{ '--c': eqQuien.color }}>
              <span className="emo">{eqQuien.emoji}</span> {eqQuien.corto}{G.concursantes[quien] ? ' · ' + G.concursantes[quien] : ''}
            </div>
            <button type="button" className={'vg-dd-boton' + (fase === 'jugando' ? ' activo' : '')} style={{ '--c': eqQuien.color }}
              onPointerDown={onTocarBoton} disabled={fase !== 'jugando'} aria-label="Tocar">
              <b>{toquesDe(quien)}</b>
              <span>{fase === 'jugando' ? '¡TOCA!' : congelado ? '¡Tiempo!' : 'Espera…'}</span>
            </button>
            <div className="vg-dd-marcador">
              {G.participantes.map((i) => (
                <div key={i} className={'vg-dd-fijo' + (i === quien && !['resultado'].includes(fase) ? ' ahora' : '') + (fase === 'resultado' && G.ganadores.length === 1 && G.ganadores[0] === i ? ' gano' : '')}
                  style={{ '--c': eqV[i].color }}>
                  <span className="emo">{eqV[i].emoji}</span><b>{G.fijos[i] !== undefined ? G.fijos[i] : '—'}</b>
                </div>
              ))}
            </div>
          </React.Fragment>
        )}

        {/* Cuenta regresiva: 3, 2, 1, ¡YA! */}
        {fase === 'cuenta' && <div key={'c' + G.seg} className="vg-dd-cuenta">{G.seg || 3}</div>}
        {fase === 'jugando' && G.reloj - G.inicio < DD.YA_MS && <div className="vg-dd-cuenta ya">¡YA!</div>}
        {fase === 'congela' && <div className="vg-mi-aviso grande">¡Tiempo!</div>}

        {/* Botones (también en el celular) */}
        {enRonda && fase !== 'prueba' && (
          <div className="vg-mi-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {(fase === 'cuenta' || fase === 'jugando') && <button type="button" onClick={alternarPausa} title="Pausa (P)">⏸</button>}
            {!G.registrado && fase !== 'cuenta' && fase !== 'jugando' && <button type="button" onClick={repetir} title="Repetir ronda (R)">↻</button>}
            {fase === 'presenta' && <button type="button" className="listo" onClick={iniciar} title="Espacio">▶ {modo === 'turnos' ? 'Iniciar turno' : 'Iniciar ronda'}</button>}
            {fase === 'finTurno' && (
              <button type="button" className="listo" onClick={siguienteConcursante} title="Siguiente (N o Espacio)">
                {G.turnoIdx < G.participantes.length - 1 ? '▶ Siguiente concursante' : '🏁 Ver resultado'}
              </button>
            )}
          </div>
        )}

        {/* Por turnos: quién pasa */}
        {fase === 'presenta' && modo === 'turnos' && eqQuien && (
          <div className="vg-dd-aviso-turno" style={{ '--c': eqQuien.color }}>
            Pasa al frente{G.concursantes[quien] ? ': ' + G.concursantes[quien] : ''}
          </div>
        )}

        {/* Prueba de teclas (antes de la primera ronda) */}
        {fase === 'prueba' && (
          <div className="vg-dd-prueba-cabeza">
            <h2>Prueba de teclas</h2>
            <p>Cada concursante presiona su tecla, todos a la vez. Toca una columna para cambiar su tecla.</p>
            <div className="vg-mi-fila">
              <button type="button" className="vg-cp-btn suave" onClick={aTurnos}>👆 Sin teclado: por turnos</button>
              <button type="button" className="vg-cp-btn grande" onClick={listoPrueba}>▶ Todo listo</button>
            </div>
          </div>
        )}

        {/* Resultado de la ronda */}
        {fase === 'resultado' && (
          <div className="vg-mi-capa abajo">
            <div className="vg-mi-tarjeta vg-dd-resultado" style={unGanador ? { '--c': unGanador.color } : undefined}>
              {unGanador ? (
                <h2>👑 ¡Ganó el {unGanador.nombre}!</h2>
              ) : G.ganadores.length > 1 ? (
                <h2>¡Empate! {G.ganadores.map((i) => eqV[i].emoji).join(' ')}</h2>
              ) : <h2>Nadie tocó…</h2>}
              {unGanador && <p>{G.concursantes[G.ganadores[0]] ? G.concursantes[G.ganadores[0]] + ' · ' : ''}{toquesDe(G.ganadores[0])} toques · +1 paso hacia Jomu</p>}
              {modo === 'turnos' && <TablaFinalCp filas={rankingRonda.map((e) => ({ ...e, detalle: e.detalle + ' · toques' }))} />}
              <div className="vg-mi-fila">
                {G.ganadores.length > 1 && <button type="button" className="vg-cp-btn grande" onClick={desempatar}>⚔ Desempate (5 s)</button>}
                {G.registrado && <button type="button" className="vg-cp-btn grande" onClick={siguienteRonda}>{G.ronda >= rondas ? '🏁 Resultado final' : '▶ Siguiente ronda'}</button>}
                {!G.registrado && G.ganadores.length === 0 && <button type="button" className="vg-cp-btn grande" onClick={repetir}>↻ Repetir ronda</button>}
              </div>
            </div>
          </div>
        )}

        {pausado && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>Pausa</h2>
              <div className="vg-mi-columna">
                <button type="button" className="vg-cp-btn grande" onClick={alternarPausa}>▶ Seguir</button>
                <button type="button" className="vg-cp-btn suave" onClick={repetir}>↻ Repetir ronda (R)</button>
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
              <h1 className="vg-mi-titulo vg-dd-titulo">⚡ Dedos Veloces ⚡</h1>
              <p className="vg-mi-intro">¡Gana quien presione más veces antes de que se acabe el tiempo!</p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              <div className="vg-mi-ajuste">
                {[['simultaneo', '⌨ Todos a la vez'], ['turnos', '👆 Por turnos']].map(([v, txt]) => (
                  <button key={v} type="button" className={'vg-jn-vel' + (modo === v ? ' on' : '')} onClick={() => setModo(v)}>{txt}</button>
                ))}
              </div>
              <div className="vg-mi-ajuste">
                <span>⏱ Tiempo</span>
                <button type="button" onClick={() => setTiempo((t) => limitarDD(t - 1, 3, 60, 10))} disabled={tiempo <= 3} aria-label="Menos tiempo">−</button>
                <b>{tiempo} s</b>
                <button type="button" onClick={() => setTiempo((t) => limitarDD(t + 1, 3, 60, 10))} disabled={tiempo >= 60} aria-label="Más tiempo">+</button>
              </div>
              {modo === 'simultaneo' && (
                <div className="vg-dd-teclas-menu">
                  {eqV.map((e, i) => <span key={i} style={{ '--c': e.color }}><span className="emo">{e.emoji}</span><kbd>{teclas[i]}</kbd></span>)}
                </div>
              )}
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final */}
        {fase === 'fin' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta fin">
              <h1 className="vg-mi-titulo">{ganadorFinal === null ? '¡Fin del juego!' : empateFinal ? '¡Empate!' : eqV[ganadorFinal].emoji + ' ¡Ganó el ' + eqV[ganadorFinal].nombre + '!'}</h1>
              <TablaFinalCp filas={tabla.map((e) => ({ ...e, detalle: (e.puntos === 1 ? '1 ronda' : e.puntos + ' rondas') + ' · ' + e.toques + ' toques' }))} />
              {ganadorFinal !== null && a.enlace && equipos[ganadorFinal] && (
                <EnlaceJaguar enlace={a.enlace} equipo={equipos[ganadorFinal]} i={ganadorFinal} id={a.id} />
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

Object.assign(window, { DedosVeloces });
