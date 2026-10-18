/* comun.jsx — Piezas compartidas por todas las actividades + cargadores.
   Se carga al inicio (index.html). Todo lo de aquí es global: lo usan los
   <id>.jsx de cada actividad, presenter.jsx (useCountdown, fmtTime) y el editor.
   Al final: ActividadRun / ActividadEditor, que cargan bajo demanda el código
   de una actividad (ver nucleo.js) y muestran un aviso mientras llega. */
const ACT_PALETTE = ['#11F555', '#F53711', '#116CF5', '#EDEDE4'];

// Paleta ampliada para la ruleta de preguntas: con solo 4 colores (ACT_PALETTE),
// a partir de la 5ª pregunta se repetían colores y con 5+ quedaban dos números
// adyacentes del mismo color (p. ej. el 1º y el 5º, ambos verdes). Con más
// colores hay menos repetición, y coloresSinRepetirAdyacentes() se encarga de
// que dos gajos vecinos (incluyendo el cierre del círculo, último con primero)
// nunca queden del mismo color.
const RULETA_PALETTE = ['#11F555', '#F53711', '#116CF5', '#F5C211', '#A855F7', '#EC4899', '#38BDF8', '#FB923C'];
function coloresSinRepetirAdyacentes(n, palette) {
  const colores = [];
  for (let i = 0; i < n; i++) {
    let c = palette[i % palette.length];
    if (i > 0 && c === colores[i - 1]) {
      for (let k = 1; k < palette.length; k++) {
        const alt = palette[(i + k) % palette.length];
        if (alt !== colores[i - 1]) { c = alt; break; }
      }
    }
    colores.push(c);
  }
  // Cierra el círculo: si el último gajo queda del mismo color que el
  // primero, se reasigna evitando también chocar con su otro vecino.
  if (n > 2 && colores[n - 1] === colores[0]) {
    for (let k = 1; k < palette.length; k++) {
      const alt = palette[(n - 1 + k) % palette.length];
      if (alt !== colores[0] && alt !== colores[n - 2]) { colores[n - 1] = alt; break; }
    }
  }
  return colores;
}

function useCountdown(initial) {
  const [secs, setSecs] = React.useState(initial);
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => { setSecs(initial); setRunning(false); }, [initial]);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [running]);
  return [secs, running, { start: () => setRunning(true), pause: () => setRunning(false), reset: () => { setRunning(false); setSecs(initial); } }];
}
const fmtTime = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* Hook para que una actividad reaccione a comandos del control remoto.
   El Presenter pasa `remoteSignal = { action, nonce }` como prop.
   Cada vez que llega un nonce nuevo, ejecuta el handler que corresponde
   a esa acción ('primary', 'next', …). Las actividades que no reciben
   remoteSignal simplemente nunca disparan nada. */
function useRemoteAction(remoteSignal, handlers) {
  const last = React.useRef(null);
  React.useEffect(() => {
    if (!remoteSignal || !remoteSignal.nonce) return;
    if (remoteSignal.nonce === last.current) return;
    last.current = remoteSignal.nonce;
    const fn = handlers && handlers[remoteSignal.action];
    if (typeof fn === 'function') fn();
  }, [remoteSignal && remoteSignal.nonce]);
}

function ActHeader({ tool, titulo, instrucciones, compact }) {
  return (
    <div>
      <div className="act-kicker" style={{ color: tool.color, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
        <Icon name={tool.icon} size={32} /> {tool.nombre}
      </div>
      <div className="act-title" style={{ fontSize: compact ? 64 : 88 }}>{titulo}</div>
      {instrucciones ? <div className="act-instr" style={{ margin: '24px auto 0' }}>{instrucciones}</div> : null}
    </div>
  );
}

function TimerPanel({ duracion, accent }) {
  const [secs, running, ctl] = useCountdown(duracion || 120);
  const low = secs <= 10 && secs > 0;
  return (
    <div style={{ marginTop: 40 }}>
      <div className="timer-display" style={{ color: secs === 0 ? '#F53711' : low ? '#F53711' : '#F2F5EF', fontSize: 170 }}>
        {secs === 0 ? '¡Tiempo!' : fmtTime(secs)}
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28 }}>
        {!running
          ? <button className="act-bigbtn" style={{ background: accent, color: '#06140A', fontSize: 30, padding: '16px 44px' }} onClick={ctl.start}>{secs === (duracion || 120) ? 'Iniciar' : 'Continuar'}</button>
          : <button className="act-bigbtn" style={{ background: '#2A2F29', color: '#fff', fontSize: 30, padding: '16px 44px' }} onClick={ctl.pause}>Pausar</button>}
        <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 30, padding: '16px 44px' }} onClick={ctl.reset}>Reiniciar</button>
      </div>
    </div>
  );
}

/* Ficha genérica: título, instrucciones y (si está activo) temporizador.
   La usan las actividades sin contenido suficiente y las que no tienen código. */
function FichaRun({ config, tool }) {
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} />
      {AIP.tiempoHabilitado(config, tool.id) && <TimerPanel duracion={config.duracion} accent={tool.color} />}
    </div>
  );
}

/* Parejas "izquierda = derecha" (texto o "img:URL"): Une los pares y Memorama. */
function parseLado(s) {
  const t = (s || '').trim();
  if (/^img:/i.test(t)) return { tipo: 'imagen', valor: t.replace(/^img:/i, '').trim() };
  return { tipo: 'texto', valor: t };
}
function parsePares(items) {
  return (items || [])
    .map((l) => (l || '').trim())
    .filter(Boolean)
    .map((l, i) => {
      const [izq, der] = l.split('=');
      return { id: i, izq: parseLado(izq), der: parseLado(der || '') };
    })
    .filter((p) => p.izq.valor && p.der.valor);
}
// Baraja con índice estable (mismo orden mientras no cambie la actividad).
function barajar(arr, seed) {
  const a = arr.slice();
  let s = seed || 1;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function LadoCelda({ lado }) {
  if (lado.tipo === 'imagen') {
    return <img src={lado.valor} alt="" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 12, display: 'block', margin: '0 auto' }} />;
  }
  return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, lineHeight: 1.15 }}>{lado.valor}</span>;
}

/* Aviso de las actividades que solo funcionan en Modo Equipos. */
function SinEquipos({ texto }) {
  return (
    <div className="act-stage" style={{ justifyContent: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#F5C211', textAlign: 'center' }}>🏆 {texto}</div>
      <div style={{ fontSize: 26, color: 'var(--muted)', marginTop: 16 }}>Esta actividad solo funciona en presentaciones de Modo Equipos.</div>
    </div>
  );
}

/* ============================================================
   Carga bajo demanda del código de una actividad
   ============================================================ */

// Devuelve [modulo, error] de una actividad; dispara su carga si falta.
function useModuloActividad(id) {
  const [estado, setEstado] = React.useState(() => ({ id, mod: Actividades.modulo(id), error: null }));
  React.useEffect(() => {
    let vivo = true;
    const ya = Actividades.modulo(id);
    if (ya) { setEstado({ id, mod: ya, error: null }); return; }
    setEstado({ id, mod: null, error: null });
    Actividades.cargar(id)
      .then((mod) => { if (vivo) setEstado({ id, mod, error: null }); })
      .catch((error) => { if (vivo) setEstado({ id, mod: null, error }); });
    return () => { vivo = false; };
  }, [id]);
  // Si cambió el id y el efecto aún no corrió, no devolver el módulo anterior.
  if (estado.id !== id) return [Actividades.modulo(id), null];
  return [estado.mod, estado.error];
}

/* La actividad en Presentar (o en el espejo del celular). Recibe `toolId`
   y pasa todo lo demás (config, tool, remoteSignal, equiposApi…) a su Run.
   Sin código propio, o sin Run, usa la ficha genérica. */
function ActividadRun({ toolId, ...props }) {
  const [mod, error] = useModuloActividad(toolId);
  if (error) {
    return (
      <div className="act-stage" style={{ justifyContent: 'center' }}>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#F53711' }}>No se pudo cargar la actividad</div>
        <div style={{ fontSize: 24, color: '#9AA396', marginTop: 14 }}>Revisa la conexión a internet y vuelve a entrar a esta diapositiva.</div>
      </div>
    );
  }
  if (!mod) {
    return (
      <div className="act-stage" style={{ justifyContent: 'center' }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', border: '9px solid rgba(154,163,150,.25)', borderTopColor: (props.tool && props.tool.color) || '#11F555', animation: 'aip-spin 0.9s linear infinite' }} />
        <div style={{ fontSize: 30, color: '#9AA396', marginTop: 26, fontWeight: 600 }}>Cargando actividad…</div>
      </div>
    );
  }
  const Run = mod.Run || FichaRun;
  return <Run {...props} />;
}

/* Configuración propia de una actividad en el editor (si su meta.js dice
   `editorPropio: true`). Recibe las mismas props que el editor pasaba antes
   a cada editor especial: current, curIdx, updateSlide, setItems,
   esEquipos, numEquipos. */
function ActividadEditor({ toolId, ...props }) {
  const [mod, error] = useModuloActividad(toolId);
  if (error) return <div style={{ fontSize: 13, color: 'var(--naranja-ink)' }}>No se pudo cargar la configuración de esta actividad. Revisa tu conexión.</div>;
  if (!mod) return <div style={{ fontSize: 13, color: 'var(--muted)' }}>Cargando configuración…</div>;
  if (!mod.Editor) return null;
  const Ed = mod.Editor;
  return <Ed {...props} />;
}

Object.assign(window, {
  ACT_PALETTE, RULETA_PALETTE, coloresSinRepetirAdyacentes, useCountdown, fmtTime, useRemoteAction,
  ActHeader, TimerPanel, FichaRun, parseLado, parsePares, barajar, LadoCelda, SinEquipos,
  useModuloActividad, ActividadRun, ActividadEditor,
});
