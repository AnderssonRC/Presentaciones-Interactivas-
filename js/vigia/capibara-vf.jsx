/* capibara-vf.jsx — Modo Capibara · «Verdadero o Falso en Movimiento» (cp-vf).

   Aparece una afirmación enorme. Izquierda del salón = VERDADERO (verde),
   derecha = FALSO (rojo). Todos los jugadores corren a un lado antes de que
   termine el tiempo (`a.tiempoVF`, 8 s). Al acabar: «¡Tiempo!» y se revela la
   respuesta con animación (y la explicación, si hay). Quienes quedaron en el
   lado incorrecto se sientan: el docente los descuenta por equipo.

   Afirmaciones: el MISMO formato de la actividad «Verdadero o falso» de la
   plataforma (js/actividades/vf): `a.afirmaciones` = líneas «Afirmación | V»
   o «Afirmación | F», con explicación opcional «Afirmación | V | Explicación».
   En el editor (`EditorAfirmacionesVF`, editor.jsx) se crean y editan, se
   importan de un JSON ([{ afirmacion, valor, explicacion }]) o se traen de las
   actividades «Verdadero o falso» del docente. Orden al azar, sin repetir en
   la partida.

   Reutiliza (no reimplementa): sesión de equipos del Jaguar, capibara-comun.jsx
   (audio y silencio común, `useLienzoCp`, jugadores en pie: `nuevoEnPieCp`,
   `cambiarEnPieCp`, `deshacerEnPieCp`, `registrarGanadoresCp`, `ContadoresEnPieCp`,
   `JugadoresEnPieCp`, `TablaFinalCp`, `MontanaFinalCp`), `equiposCapibara`,
   `EnlaceJaguar`, `fijarEstadoCapibara` y los estilos `vg-mi-*`.
   Atajos como los otros juegos: Espacio / Enter / Av Pág = acción principal
   (revelar → siguiente), P pausa, D / Re Pág deshacer, M silencio,
   F pantalla completa; 1–9 y 0 = −1 al equipo (Shift: +1).

   Secciones: AFIRMACIONES (formato) · CONFIGURACIÓN · AUDIO · TEXTO AJUSTADO ·
   COMPONENTE (estado, reloj, teclado, mando, interfaz). */

/* ======================= AFIRMACIONES (formato) ======================= */
// Una línea «Afirmación | V | Explicación» → { texto, valor, explicacion }.
// El valor se lee igual que la actividad de la plataforma: empieza con V = verdadero.
function leerAfirmacionVF(linea) {
  const p = String(linea || '').split('|');
  const texto = (p[0] || '').trim();
  if (!texto) return null;
  return { texto, valor: String(p[1] || 'V').trim().toUpperCase().startsWith('V'), explicacion: p.slice(2).join('|').trim() };
}
// Y al revés (lo que guarda el editor). Sin «|» ni saltos dentro de los campos.
function lineaAfirmacionVF(x) {
  const limpio = (s) => String(s || '').replace(/\|/g, '/').replace(/\s*\n\s*/g, ' ').trim();
  const exp = limpio(x.explicacion);
  return limpio(x.texto) + ' | ' + (x.valor ? 'V' : 'F') + (exp ? ' | ' + exp : '');
}
// JSON: [{ afirmacion, valor, explicacion }] (o { afirmaciones: [...] }, o líneas de texto).
function afirmacionesDeJSON(datos) {
  const lista = Array.isArray(datos) ? datos : (datos && (datos.afirmaciones || datos.items || datos.preguntas)) || [];
  const valor = (v) => (typeof v === 'boolean' ? v : !/^(f|falso|false|no|0)$/i.test(String(v === undefined || v === null ? 'V' : v).trim()));
  return lista.map((x) => {
    if (typeof x === 'string') return leerAfirmacionVF(x);
    if (!x || typeof x !== 'object') return null;
    const texto = String(x.afirmacion || x['afirmación'] || x.texto || x.enunciado || x.statement || '').trim();
    if (!texto) return null;
    const v = [x.valor, x.verdadero, x.respuesta, x.answer].find((k) => k !== undefined);
    return { texto, valor: valor(v), explicacion: String(x.explicacion || x['explicación'] || x.explanation || '').trim() };
  }).filter(Boolean);
}
const afirmacionesDeVF = (a) => ((a && a.afirmaciones) || []).map(leerAfirmacionVF).filter(Boolean);

/* =========================== CONFIGURACIÓN =========================== */
const VF = { ALTO_MS: 900 };   // «¡Tiempo!» antes de revelar
const limitarVF = (v, a, b, d) => Math.max(a, Math.min(b, Number(v) || d));
function barajarVF(n) {
  const o = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; }
  return o;
}

/* =============================== AUDIO =============================== */
const SONIDO_VF = {
  tic: (fuerte) => audioCapibara.tono(fuerte ? 1180 : 880, fuerte ? 0.12 : 0.05, 'square', fuerte ? 0.14 : 0.06),
  tiempo: () => { audioCapibara.tono(220, 0.6, 'sawtooth', 0.16, 0, 110); audioCapibara.ruido(0.3, 0.2, 900); },
  redoble: () => { for (let k = 0; k < 8; k++) audioCapibara.ruido(0.05, 0.1 + k * 0.02, 1800, k * 0.045); },
  verdadero: () => [523, 659, 784, 1047].forEach((f, i) => audioCapibara.tono(f, 0.3, 'triangle', 0.17, 0.4 + i * 0.08)),
  falso: () => [392, 311, 262].forEach((f, i) => audioCapibara.tono(f, 0.32, 'square', 0.12, 0.4 + i * 0.13)),
  elimina: () => audioCapibara.tono(300, 0.35, 'sawtooth', 0.12, 0, 90),
  corrige: () => audioCapibara.tono(700, 0.15, 'sine', 0.12, 0, 1000),
  pausa: () => audioCapibara.tono(440, 0.18, 'sine', 0.12, 0, 330),
  ganador: () => [523, 659, 784, 1047, 1319].forEach((f, i) => audioCapibara.tono(f, 0.25, 'triangle', 0.17, i * 0.1)),
};

/* =========================== TEXTO AJUSTADO ===========================
   El texto ocupa su caja con la letra MÁS GRANDE que quepa (búsqueda
   binaria): corto = enorme, largo = más chico. Se vuelve a medir al cambiar
   el tamaño de la pantalla y cuando llega la fuente. */
function TextoAjustadoVF({ texto, min, max, className }) {
  const caja = React.useRef(null), txt = React.useRef(null);
  React.useLayoutEffect(() => {
    const c = caja.current, t = txt.current;
    if (!c || !t) return undefined;
    const ajustar = () => {
      const W = c.clientWidth, H = c.clientHeight;
      if (!W || !H) return;
      let lo = min || 16, hi = Math.max(lo + 1, Math.min(max || 200, H));
      while (hi - lo > 1) {
        const m = Math.floor((lo + hi) / 2);
        t.style.fontSize = m + 'px';
        if (t.scrollWidth <= W + 1 && t.offsetHeight <= H + 1) lo = m; else hi = m;
      }
      t.style.fontSize = lo + 'px';
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(c);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
    return () => ro.disconnect();
  }, [texto, min, max]);
  return (
    <div ref={caja} className={'vg-vf-ajuste' + (className ? ' ' + className : '')}>
      <div ref={txt} className="vg-vf-ajuste-txt">{texto}</div>
    </div>
  );
}

function nuevoJuegoVF(jugadores, n) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, seg: null, orden: barajarVF(n), pos: -1, finDesde: null,
    antesRonda: jugadores.slice(),   // en pie al empezar la afirmación (por si todos caen a la vez)
    ...nuevoEnPieCp(jugadores),      // jugadores en pie (capibara-comun.jsx)
  };
}

/* ============================ COMPONENTE ============================ */
function VerdaderoFalsoMovimiento({ a, estudiantes, onContinuar }) {
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
  const [lista] = React.useState(() => afirmacionesDeVF(a));
  const pasos = limitarVF(a.pasosVF, 1, 10, 3);
  const [tiempo, setTiempo] = React.useState(() => limitarVF(a.tiempoVF, 3, 60, 8));
  const [jugadores, setJugadores] = React.useState(() => jugadoresInicialesCp(equipos, a.jugadoresVF));
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoVF(jugadores, lista.length);
  const cfg = React.useRef({});
  cfg.current = { tiempo, jugadores, pausado, nEq: eqV.length };
  const G = g.current;
  const seguirJuego = React.useRef(onContinuar);
  seguirJuego.current = onContinuar;
  const { raiz, tam } = useLienzoCp(1600, 900);
  const reloj = React.useRef(null), anillo = React.useRef(null);

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; X.seg = null; setFase(f); };
  const enRonda = (f) => f === 'afirmacion' || f === 'tiempo' || f === 'revela';
  const afActual = () => { const X = g.current; return X.pos >= 0 && X.pos < X.orden.length ? lista[X.orden[X.pos]] : null; };
  const quedan = () => g.current.orden.length - g.current.pos - 1;
  const mostrarSiguiente = () => {
    const X = g.current;
    X.pos += 1; X.antesRonda = X.enPie.slice();
    irA('afirmacion'); refrescar();
  };
  const empezar = () => {
    if (!lista.length || g.current.fase !== 'menu') return;
    audioCapibara.despertar();
    const X = nuevoJuegoVF(cfg.current.jugadores, lista.length);
    X.reloj = g.current.reloj; g.current = X;
    mostrarSiguiente();
  };
  const revelar = () => {
    const X = g.current;
    if (X.fase !== 'afirmacion' && X.fase !== 'tiempo') return;
    cfg.current.pausado = false; setPausado(false);
    const af = afActual();
    irA('revela'); SONIDO_VF.redoble();
    if (af && af.valor) SONIDO_VF.verdadero(); else SONIDO_VF.falso();
    refrescar();
  };
  // Siguiente afirmación; si queda un equipo (o ninguna afirmación), el final.
  const siguiente = () => {
    const X = g.current;
    if (X.fase !== 'revela') return;
    if (equiposEnPieCp(X) <= 1 || quedan() <= 0) fin();
    else mostrarSiguiente();
  };
  // Descontar (−1) o corregir (+1): tras revelar.
  const descontar = (i, d) => {
    const X = g.current;
    if (X.fase !== 'revela' || !cambiarEnPieCp(X, i, d)) return;
    if (d < 0) SONIDO_VF.elimina(); else SONIDO_VF.corrige();
    refrescar();
  };
  const puedeDeshacer = () => {
    const X = g.current;
    return X.historial.length > 0 && (X.fase === 'revela' || (X.fase === 'fin' && X.finDesde === 'revela'));
  };
  // Deshacer el último descuento. Desde el final, también quita los pasos y vuelve a la revelación.
  const deshacer = () => {
    const X = g.current;
    if (!puedeDeshacer()) return;
    if (X.fase === 'fin') { anularGanadoresCp(X, pasos); irA('revela'); }
    deshacerEnPieCp(X); SONIDO_VF.corrige(); refrescar();
  };
  // Final: gana quien tenga más en pie. Si todos cayeron en la misma afirmación,
  // cuenta cómo estaban antes de ella.
  const fin = () => {
    const X = g.current;
    X.finDesde = X.fase;
    const base = equiposEnPieCp(X) ? X : { ...X, enPie: X.antesRonda };
    registrarGanadoresCp(base, pasos);
    X.ganadores = base.ganadores; X.registrado = base.registrado;
    cfg.current.pausado = false; setPausado(false);
    SONIDO_VF.ganador(); irA('fin'); refrescar();
  };
  const terminar = () => { if (enRonda(g.current.fase)) fin(); };
  const pausar = () => {
    if (g.current.fase !== 'afirmacion' || cfg.current.pausado) return;
    cfg.current.pausado = true; setPausado(true); SONIDO_VF.pausa();
  };
  const seguir = () => { if (cfg.current.pausado) { cfg.current.pausado = false; setPausado(false); } };
  const alternarPausa = () => (cfg.current.pausado ? seguir() : pausar());
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const cambiarTiempo = (d) => { if (g.current.fase === 'menu') setTiempo((t) => limitarVF(t + d, 3, 60, 8)); };
  const cambiarJugadores = (i, d) => {
    if (g.current.fase !== 'menu') return;
    setJugadores((js) => js.map((n, k) => (k === i ? limitarVF(n + d, 1, 40, 5) : n)));
  };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  const principal = () => {
    const X = g.current;
    if (cfg.current.pausado) seguir();
    else if (X.fase === 'menu') empezar();
    else if (X.fase === 'afirmacion' || X.fase === 'tiempo') revelar();
    else if (X.fase === 'revela') siguiente();
    else if (X.fase === 'fin') verMontana();
    else if (X.fase === 'montana') seguirJuego.current();
  };

  // ---- Reloj: tiempo para correr, «¡Tiempo!» y revelación ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current, T = cfg.current.tiempo * 1000;
      if (!cfg.current.pausado && (X.fase === 'afirmacion' || X.fase === 'tiempo')) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'afirmacion') {
          const seg = Math.ceil((T - e) / 1000);
          if (seg !== X.seg && seg > 0) { X.seg = seg; SONIDO_VF.tic(seg <= 3); }
          if (e >= T) { SONIDO_VF.tiempo(); irA('tiempo'); refrescar(); }
        } else if (e >= VF.ALTO_MS) revelar();
      }
      // número y anillo del tiempo, sin volver a pintar React
      if (X.fase === 'afirmacion') {
        const resto = Math.max(0, T - (X.reloj - X.inicio));
        if (reloj.current) reloj.current.textContent = String(Math.ceil(resto / 1000));
        if (anillo.current) {
          anillo.current.style.setProperty('--p', (resto / T).toFixed(3));
          anillo.current.classList.toggle('poco', resto < 3000);
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
      const i = equipoDeTeclaCp(e);   // 1–9 y 0: −1 al equipo; con Shift, +1
      if (i >= 0 && X.fase === 'revela') {
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
  // El celular del docente ve la respuesta ANTES de revelar (solo él lo ve).
  const af = afActual();
  const estadoMando = {
    juego: 'vf', fase, pausado, silencio, tiempo, jugadores,
    n: G.pos + 1, total: lista.length, quedan: quedan(),
    afirmacion: enRonda(fase) && af ? { texto: af.texto, valor: af.valor } : null,
    enPie: G.enPie, inicial: G.inicial, puedeDeshacer: puedeDeshacer(), ganadores: G.ganadores,
    unEquipo: equiposEnPieCp(G) <= 1,
    eqs: eqV.map((e) => ({ corto: e.corto, emoji: e.emoji, color: e.color })),
  };
  const claveMando = JSON.stringify(estadoMando);
  React.useEffect(() => { fijarEstadoCapibara(estadoMando); }, [claveMando]);   // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'vf-empezar') empezar();
    else if (x === 'vf-tiempo') cambiarTiempo(Number(o.d) || 0);
    else if (x === 'vf-jugadores') cambiarJugadores(Number(o.i), Number(o.d) || 0);
    else if (x === 'vf-revelar') revelar();
    else if (x === 'vf-siguiente') siguiente();
    else if (x === 'vf-descontar') descontar(Number(o.i), -1);
    else if (x === 'vf-sumar') descontar(Number(o.i), 1);
    else if (x === 'vf-deshacer') deshacer();
    else if (x === 'vf-pausa') alternarPausa();
    else if (x === 'vf-terminar') terminar();
    else if (x === 'vf-silencio') alternarSilencio();
    else if (x === 'vf-montana') verMontana();
    else if (x === 'vf-otra') otraVez();
    else if (x === 'vf-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') principal();
  });

  /* ============================ INTERFAZ ============================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Verdadero o Falso" />;
  const revela = fase === 'revela' && af;
  const capa = fase === 'menu' || fase === 'fin' || (pausado && fase === 'afirmacion');
  const todosCayeron = G.ganadores.length > 0 && !equiposEnPieCp(G);
  const tabla = tablaEnPieCp(eqV, todosCayeron ? { ...G, enPie: G.antesRonda } : G);
  const unGanador = G.ganadores.length === 1 ? eqV[G.ganadores[0]] : null;

  return (
    <div className={'vg-cp vg-mi vg-vf' + (revela ? ' revela ' + (af.valor ? 'es-v' : 'es-f') : '')} ref={raiz}
      style={{ '--u': tam.u }} role="dialog" aria-label="Verdadero o Falso en Movimiento">
      {/* Los dos lados del salón (ícono + palabra: no depende solo del color) */}
      <div className="vg-vf-lado v"><div className="vg-vf-etiqueta"><span className="ico" aria-hidden="true">✔</span>VERDADERO<small>◀ a la izquierda</small></div></div>
      <div className="vg-vf-lado f"><div className="vg-vf-etiqueta"><span className="ico" aria-hidden="true">✗</span>FALSO<small>a la derecha ▶</small></div></div>

      {enRonda(fase) && af && (
        <React.Fragment>
          {/* La afirmación: tan grande como quepa */}
          <div key={'a' + G.pos} className={'vg-vf-tarjeta' + (revela ? (af.valor ? ' es-v' : ' es-f') : '')}>
            <span className="vg-vf-num">{G.pos + 1} / {lista.length}</span>
            <TextoAjustadoVF texto={af.texto} min={18} max={230} />
            {revela && <span className="vg-vf-ayuda">−1 a quienes quedaron en el lado incorrecto (o teclas 1–9) · D deshace</span>}
          </div>
          {fase === 'afirmacion' && (
            <div className="vg-vf-reloj" ref={anillo} style={{ '--p': 1 }} aria-label="Tiempo">
              <b ref={reloj}>{tiempo}</b>
            </div>
          )}
          {fase === 'tiempo' && <div className="vg-vf-alto">¡Tiempo! ¡Quietos!</div>}
          {revela && <div key={'r' + G.pos} className={'vg-vf-sello ' + (af.valor ? 'v' : 'f')}>{af.valor ? '✔ ¡VERDADERO!' : '✗ ¡FALSO!'}</div>}
          {revela && af.explicacion && (
            <div key={'e' + G.pos} className="vg-vf-explica"><TextoAjustadoVF texto={'💡 ' + af.explicacion} min={14} max={52} /></div>
          )}

          {/* Pie: botones (también en el celular) y, debajo, el contador grande por equipo
              (tras revelar, con −1 / +1). Juntos: crecen hacia arriba sin taparse. */}
          <div className="vg-vf-pie">
          {!pausado && (
            <div className="vg-mi-botones vg-vf-botones">
              <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
              {fase === 'afirmacion' && <button type="button" onClick={pausar} title="Pausa (P)">⏸</button>}
              {(fase === 'afirmacion' || fase === 'tiempo') && <button type="button" className="listo" onClick={revelar} title="Espacio o Av Pág">👁 Revelar</button>}
              {revela && puedeDeshacer() && <button type="button" onClick={deshacer} title="Deshacer (D o Re Pág)">↩</button>}
              {revela && <button type="button" onClick={terminar} title="Terminar juego">🏁</button>}
              {revela && (
                <button type="button" className="listo" onClick={siguiente} title="Espacio o Av Pág">
                  {equiposEnPieCp(G) <= 1 || quedan() <= 0 ? '🏁 Ver ganador' : '▶ Siguiente'}
                </button>
              )}
            </div>
          )}
          <ContadoresEnPieCp eqV={eqV} E={G} grande onCambiar={revela ? descontar : undefined} clase="vg-vf-equipos" />
          </div>
        </React.Fragment>
      )}

      {/* Menú, pausa y final: tarjetas del Capibara sobre un velo */}
      {capa && <div className="vg-vf-velo" aria-hidden="true"></div>}
      {capa && (
        <div className="vg-mi-escenario vg-vf-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>
          {fase === 'menu' && (
            <div className="vg-mi-capa">
              <div className="vg-mi-tarjeta menu">
                <div className="vg-cp-kicker">🌿 Modo Capibara · {eqV.length} equipos · {lista.length} {lista.length === 1 ? 'afirmación' : 'afirmaciones'} al azar</div>
                <h1 className="vg-mi-titulo vg-vf-titulo">✔ Verdadero o Falso ✗<small>en movimiento</small></h1>
                <p className="vg-mi-intro">¡Corre al lado correcto antes de que se acabe el tiempo! Izquierda = verdadero · derecha = falso. Gana el último equipo con jugadores en pie.</p>
                {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
                {!lista.length && <p className="vg-vf-falta">Aún no hay afirmaciones: agrégalas en el editor de esta activación.</p>}
                <div className="vg-mi-ajuste">
                  <span>⏱ Tiempo para correr</span>
                  <button type="button" onClick={() => cambiarTiempo(-1)} disabled={tiempo <= 3} aria-label="Menos tiempo">−</button>
                  <b>{tiempo} s</b>
                  <button type="button" onClick={() => cambiarTiempo(1)} disabled={tiempo >= 60} aria-label="Más tiempo">+</button>
                </div>
                <div className="vg-mi-sub">🧍 Jugadores en pie por equipo</div>
                <JugadoresEnPieCp eqV={eqV} jugadores={jugadores} onCambiar={cambiarJugadores} />
                <div className="vg-mi-fila">
                  <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                  <button type="button" className="vg-cp-btn grande" onClick={empezar} disabled={!lista.length}>▶ ¡Empezar!</button>
                </div>
              </div>
            </div>
          )}

          {pausado && fase === 'afirmacion' && (
            <div className="vg-mi-capa">
              <div className="vg-mi-tarjeta">
                <h2>⏸ Pausa</h2>
                <div className="vg-mi-columna">
                  <button type="button" className="vg-cp-btn grande" onClick={seguir}>▶ Seguir</button>
                  <button type="button" className="vg-cp-btn suave" onClick={revelar}>👁 Revelar ya</button>
                  <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
                </div>
              </div>
            </div>
          )}

          {fase === 'fin' && (
            <div className="vg-mi-capa">
              <div className="vg-mi-tarjeta fin">
                <h1 className="vg-mi-titulo">
                  {unGanador ? unGanador.emoji + ' ¡Ganó el ' + unGanador.nombre + '!' : G.ganadores.length > 1 ? '¡Empate! ' + G.ganadores.map((i) => eqV[i].emoji).join(' ') : '¡Fin del juego!'}
                </h1>
                {G.ganadores.length > 0 && <p className="vg-mi-sub">+{pasos} {pasos === 1 ? 'paso' : 'pasos'} hacia Jomu{todosCayeron ? ' · todos cayeron en la última: cuenta cómo estaban antes' : ''}</p>}
                <TablaFinalCp filas={tabla} />
                {unGanador && a.enlace && equipos[G.ganadores[0]] && (
                  <EnlaceJaguar enlace={a.enlace} equipo={equipos[G.ganadores[0]]} i={G.ganadores[0]} id={a.id} />
                )}
                <div className="vg-mi-fila">
                  {puedeDeshacer() && <button type="button" className="vg-cp-btn suave" onClick={deshacer}>↩ Deshacer el último</button>}
                  <button type="button" className="vg-cp-btn suave" onClick={otraVez}>↻ Jugar otra vez</button>
                  <button type="button" className="vg-cp-btn grande" onClick={verMontana}>🏔 Ver la montaña</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VerdaderoFalsoMovimiento, TextoAjustadoVF, leerAfirmacionVF, lineaAfirmacionVF, afirmacionesDeJSON });
