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
     `MontanaFinalCp` (la montaña al terminar cada juego). */

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

Object.assign(window, {
  audioCapibara, lineaCp, circuloCp, rrCp, useLienzoCp, siguienteConcursanteCp, siguienteTurnoCp,
  SelectorPersonajeCp, ChipsEquiposCp, TablaFinalCp, MontanaFinalCp,
});
