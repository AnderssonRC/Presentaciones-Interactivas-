/* capibara-comun.jsx — Piezas compartidas por los juegos del Modo Capibara
   (Muro Infernal, Movimiento de la Jungla…). Se carga ANTES que los juegos.

   · Audio (Web Audio, sin archivos): `audioCapibara.tono / ruido / despertar`,
     silencio compartido por todos los juegos (`silencio()`, `setSilencio(v)`).
   · Dibujo: `rrCp` (rectángulo redondeado), `circuloCp`, `lineaCp`.
   · `useLienzoCp(W, H)`: escenario que mantiene la proporción (16:9 con
     franjas; sirve en proyectores de 1024×768) y su <canvas> nítido.
   · Concursantes: `siguienteConcursanteCp(i)` = un estudiante del equipo i,
     sin repetir hasta que pasen todos (la cola vive en la sesión de equipos:
     sigue entre un juego y otro de la misma presentación).
   · Turnos: `siguienteTurnoCp(…)` = siguiente equipo en orden y su ronda.
   · Interfaz común: `SelectorPersonajeCp`, `ChipsEquiposCp`, `TablaFinalCp`,
     `MontanaFinalCp` (la montaña al terminar cada juego).
   · Jugadores en pie (juegos de eliminación: Semáforo, Verdadero o Falso…):
     `nuevoEnPieCp`, `cambiarEnPieCp`, `deshacerEnPieCp`, `registrarGanadoresCp`,
     `JugadoresEnPieCp`, `TarjetasEnPieCp`, `ContadoresEnPieCp`, `equipoDeTeclaCp`. */

/* ============================== AUDIO ============================== */
let audioCtxCp = null;
let silencioCp = false;
function despertarAudioCp() {
  try {
    if (!audioCtxCp) audioCtxCp = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtxCp.state === 'suspended') audioCtxCp.resume();
    return audioCtxCp;
  } catch (e) { return null; }
}
function tonoCp(f, dur, tipo, vol, en, fFin) {
  const c = silencioCp ? null : despertarAudioCp();
  if (!c) return;
  const t0 = c.currentTime + (en || 0);
  const o = c.createOscillator(), g = c.createGain();
  o.type = tipo || 'sine'; o.frequency.setValueAtTime(f, t0);
  if (fFin) o.frequency.exponentialRampToValueAtTime(fFin, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol || 0.2, t0 + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.05);
}
function ruidoCp(dur, vol, frec, en) {
  const c = silencioCp ? null : despertarAudioCp();
  if (!c) return;
  const t0 = c.currentTime + (en || 0);
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
  src.buffer = buf; f.type = 'lowpass'; f.frequency.value = frec || 1200;
  g.gain.setValueAtTime(vol || 0.3, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(g); g.connect(c.destination); src.start(t0);
}
const audioCapibara = {
  tono: tonoCp, ruido: ruidoCp, despertar: despertarAudioCp,
  silencio: () => silencioCp,
  setSilencio: (v) => { silencioCp = !!v; return silencioCp; },
};

/* ============================== DIBUJO ============================== */
function lineaCp(ctx, p, q, w, color) {
  ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
}
function circuloCp(ctx, x, y, r, relleno, borde, ancho) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
  if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = ancho || 5; ctx.stroke(); }
}
function rrCp(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

/* ====================== ESCENARIO 16:9 Y LIENZO ======================
   raiz: el contenedor a pantalla completa · lienzo: el <canvas> ·
   tam: { w, h, u } (u = px de pantalla por unidad del lienzo lógico). */
function useLienzoCp(W, H) {
  W = W || 1600; H = H || 900;
  const raiz = React.useRef(null), lienzo = React.useRef(null);
  const [tam, setTam] = React.useState({ w: W, h: H, u: 1 });
  React.useLayoutEffect(() => {
    const medir = () => {
      const el = raiz.current;
      if (!el) return;
      const u = Math.min(el.clientWidth / W, el.clientHeight / H) || 1;
      setTam({ w: Math.round(W * u), h: Math.round(H * u), u });
    };
    medir();
    const ro = new ResizeObserver(medir);
    if (raiz.current) ro.observe(raiz.current);
    return () => ro.disconnect();
  }, []);
  React.useEffect(() => {
    const c = lienzo.current;
    if (!c) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(tam.w * dpr); c.height = Math.round(tam.h * dpr);
  }, [tam.w, tam.h]);
  return { raiz, lienzo, tam };
}

/* ====================== CONCURSANTES Y TURNOS ====================== */
// Un estudiante del equipo i (sin repetir hasta que pasen todos los del equipo).
function siguienteConcursanteCp(i) {
  const s = jaguarSesion();
  const miembros = ((s.equipos || [])[i] || {}).miembros || [];
  if (!miembros.length) return null;
  const colas = { ...(s.colasConcursantes || {}) };
  let cola = (colas[i] || []).filter((n) => miembros.includes(n));
  if (!cola.length) cola = miembros.slice().sort(() => Math.random() - 0.5);
  const nombre = cola.shift();
  colas[i] = cola;
  cambiarJaguar(() => ({ colasConcursantes: colas }));
  return nombre;
}
/* Siguiente equipo en orden a partir de `turno`; al dar la vuelta sube la
   ronda. `puede(i)`: si el equipo i sigue en juego. null = se acabó. */
function siguienteTurnoCp(turno, ronda, n, rondas, puede) {
  for (let k = 1; k <= n; k++) {
    const i = (turno + k) % n, r = ronda + Math.floor((turno + k) / n);
    if (r > rondas) return null;
    if (!puede || puede(i)) return { turno: i, ronda: r };
  }
  return null;
}

/* ========================= INTERFAZ COMÚN ========================= */
// Elegir concursante (los personajes dibujados del Muro Infernal).
function SelectorPersonajeCp({ valor, onElegir }) {
  const lista = window.PERSONAJES_MURO || [];
  return (
    <div className="vg-mi-personajes" role="radiogroup" aria-label="Concursante">
      {lista.map((p, i) => (
        <button key={p.id} type="button" role="radio" aria-checked={valor === i} className={valor === i ? 'on' : ''} onClick={() => onElegir(i)}>
          {window.RetratoMI ? <RetratoMI pj={p} /> : null}<span>{p.nombre}</span>
        </button>
      ))}
    </div>
  );
}
// Elegir equipo (modo individual). equipos: los de equiposCapibara().
function ChipsEquiposCp({ equipos, valor, onElegir }) {
  return (
    <div className="vg-mi-chips">
      {equipos.map((e, i) => (
        <button key={i} type="button" className={'vg-cp-chip' + (valor === i ? ' on' : '')} style={{ '--c': e.color }} onClick={() => onElegir(i)}>
          <span className="emo">{e.emoji}</span><strong>{e.corto}</strong>
        </button>
      ))}
    </div>
  );
}
// Tabla de posiciones. filas: [{ i, emoji, corto, color, puntos, detalle }] ya ordenadas.
function TablaFinalCp({ filas }) {
  return (
    <div className="vg-mi-tabla">
      {filas.map((e, k) => (
        <div key={e.i} className="vg-mi-tabla-fila" style={{ '--c': e.color }}>
          <span className="pos">{k + 1}</span><span className="emo">{e.emoji}</span>
          <strong>{e.corto}</strong><b>{e.puntos}</b>
          <small>{e.detalle}</small>
        </div>
      ))}
    </div>
  );
}
// Al terminar un juego: la montaña (cuánto avanzó cada equipo) y «Continuar».
function MontanaFinalCp({ equipos, meta, onContinuar, titulo }) {
  return (
    <div className="vg-cp vg-mi" role="dialog" aria-label={(titulo || 'Juego') + ': la montaña'}>
      <MontanaCapibara equipos={equipos} meta={meta} />
      <div className="vg-cp-acciones sobre">
        <button type="button" className="vg-cp-btn" onClick={onContinuar}>Continuar ›</button>
      </div>
    </div>
  );
}

/* =================== JUGADORES EN PIE (juegos de eliminación) ===================
   Semáforo, Verdadero o Falso en Movimiento… Cada equipo empieza con N jugadores
   en pie; el docente descuenta (−1) o corrige (+1, hasta los del inicio) y puede
   deshacer. Gana el último equipo en pie (o el que tenga más, si se termina antes).
   El estado `E` vive dentro del estado del juego (sus campos se mezclan en él).
   En Vigía solo se guardan nombres: esto queda en memoria. */
// Jugadores al empezar: `fijo` (editor) o los integrantes del equipo (o 5).
function jugadoresInicialesCp(equipos, fijo) {
  const lim = (v) => Math.max(1, Math.min(40, Number(v) || 5));
  return (equipos || []).map((e) => lim(fijo || ((e && e.miembros) || []).length || 5));
}
function nuevoEnPieCp(jugadores) {
  return { enPie: jugadores.slice(), inicial: jugadores.slice(), fuera: {}, ordenFuera: 0, historial: [], ganadores: [], registrado: false };
}
// d = −1 descuenta, +1 corrige. Devuelve true si cambió algo.
function cambiarEnPieCp(E, i, d) {
  if (i < 0 || i >= E.enPie.length) return false;
  const nuevo = Math.max(0, Math.min(E.inicial[i], E.enPie[i] + d));
  if (nuevo === E.enPie[i]) return false;
  E.historial.push({ i, antes: E.enPie[i], fuera: E.fuera[i] });
  E.enPie[i] = nuevo;
  if (nuevo === 0) { E.ordenFuera += 1; E.fuera[i] = E.ordenFuera; } else delete E.fuera[i];
  return true;
}
function deshacerEnPieCp(E) {
  const h = E.historial.pop();
  if (!h) return false;
  E.enPie[h.i] = h.antes;
  if (h.fuera) E.fuera[h.i] = h.fuera; else delete E.fuera[h.i];
  return true;
}
const equiposEnPieCp = (E) => E.enPie.filter((n) => n > 0).length;
// Ganadores (más jugadores en pie; empate = todos) y sus pasos hacia Jomu (una sola vez).
function registrarGanadoresCp(E, pasos) {
  const max = Math.max(0, ...E.enPie);
  E.ganadores = max > 0 ? E.enPie.map((n, k) => (n === max ? k : -1)).filter((k) => k >= 0) : [];
  if (!E.registrado && E.ganadores.length) { E.registrado = true; E.ganadores.forEach((k) => jaguarPunto(k, pasos)); }
}
// Al deshacer desde el final: devuelve los pasos.
function anularGanadoresCp(E, pasos) {
  if (E.registrado) E.ganadores.forEach((k) => jaguarPunto(k, -pasos));
  E.registrado = false; E.ganadores = [];
}
// Filas para TablaFinalCp: más en pie primero; empate → el que cayó después.
function tablaEnPieCp(eqV, E) {
  return eqV.map((e, i) => ({ ...e, i, puntos: E.enPie[i], detalle: E.enPie[i] + ' de ' + E.inicial[i] + ' en pie' }))
    .sort((x, y) => y.puntos - x.puntos || (E.fuera[y.i] || 0) - (E.fuera[x.i] || 0));
}
// Menú: jugadores en pie por equipo (− n +).
function JugadoresEnPieCp({ eqV, jugadores, onCambiar }) {
  return (
    <div className="vg-ep-jug">
      {eqV.map((e, i) => (
        <span key={i} style={{ '--c': e.color }}>
          <span className="emo">{e.emoji}</span>
          <button type="button" onClick={() => onCambiar(i, -1)} disabled={jugadores[i] <= 1} aria-label={'Menos jugadores en ' + e.nombre}>−</button>
          <b>{jugadores[i]}</b>
          <button type="button" onClick={() => onCambiar(i, 1)} disabled={jugadores[i] >= 40} aria-label={'Más jugadores en ' + e.nombre}>+</button>
        </span>
      ))}
    </div>
  );
}
// Tarjetas grandes por equipo con −1 / +1 (pausa del Semáforo…). Tecla = 1–9, 0.
function TarjetasEnPieCp({ eqV, E, onCambiar }) {
  return (
    <div className="vg-ep-tarjetas">
      {eqV.map((e, i) => (
        <div key={i} className={'vg-ep-tarjeta' + (E.enPie[i] ? '' : ' fuera')} style={{ '--c': e.color }}>
          <div className="cab"><span className="emo">{e.emoji}</span><strong>{e.corto}</strong><kbd>{i === 9 ? 0 : i + 1}</kbd></div>
          <b>{E.enPie[i]}</b>
          <small>de {E.inicial[i]} en pie</small>
          <div className="fila">
            <button type="button" className="menos" onClick={() => onCambiar(i, -1)} disabled={!E.enPie[i]} aria-label={'Descontar 1 a ' + e.nombre}>−1</button>
            <button type="button" className="mas" onClick={() => onCambiar(i, 1)} disabled={E.enPie[i] >= E.inicial[i]} aria-label={'Devolver 1 a ' + e.nombre}>+1</button>
          </div>
        </div>
      ))}
    </div>
  );
}
/* Contadores por equipo (fila de chips). `onTocar(i)`: al tocar un chip.
   `onCambiar(i, d)`: muestra − y + en cada chip. `grande`: contador enorme. */
function ContadoresEnPieCp({ eqV, E, onTocar, onCambiar, grande, clase }) {
  return (
    <div className={'vg-ep-equipos' + (grande ? ' grande' : '') + (clase ? ' ' + clase : '')}>
      {eqV.map((e, i) => (
        <div key={i} className={'vg-ep-eq' + (E.enPie[i] ? '' : ' fuera')} style={{ '--c': e.color }}
          onClick={onTocar ? () => onTocar(i) : undefined} role={onTocar ? 'button' : undefined}
          title={'Tecla ' + (i === 9 ? 0 : i + 1) + (onCambiar ? ' (Shift + tecla: +1)' : '')}>
          {onCambiar && <button type="button" className="menos" onClick={(ev) => { ev.stopPropagation(); onCambiar(i, -1); }} disabled={!E.enPie[i]} aria-label={'Descontar 1 a ' + e.nombre}>−1</button>}
          <span className="emo">{e.emoji}</span><b>{E.enPie[i]}</b><small>🧍</small>
          {onCambiar && <button type="button" className="mas" onClick={(ev) => { ev.stopPropagation(); onCambiar(i, 1); }} disabled={E.enPie[i] >= E.inicial[i]} aria-label={'Devolver 1 a ' + e.nombre}>+1</button>}
        </div>
      ))}
    </div>
  );
}
// Teclas 1–9 y 0 (fila o teclado numérico) → índice del equipo, o -1.
function equipoDeTeclaCp(e) {
  const m = /^(?:Digit|Numpad)(\d)$/.exec((e && e.code) || '');
  return m ? (m[1] === '0' ? 9 : Number(m[1]) - 1) : -1;
}

Object.assign(window, {
  audioCapibara, lineaCp, circuloCp, rrCp, useLienzoCp, siguienteConcursanteCp, siguienteTurnoCp,
  SelectorPersonajeCp, ChipsEquiposCp, TablaFinalCp, MontanaFinalCp,
  jugadoresInicialesCp, nuevoEnPieCp, cambiarEnPieCp, deshacerEnPieCp, equiposEnPieCp, registrarGanadoresCp, anularGanadoresCp,
  tablaEnPieCp, JugadoresEnPieCp, TarjetasEnPieCp, ContadoresEnPieCp, equipoDeTeclaCp,
});
