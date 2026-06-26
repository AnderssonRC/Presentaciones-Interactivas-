/* Modo Presentar — pantalla completa para el televisor o video beam.
   Incluye:
     · Control remoto: el celular del docente actúa como mando (avanzar,
       sumar puntos, ocultar puntaje, controlar la actividad activa).
     · Estudiantes: unirse, levantar la mano, espejo de la actividad.
     · Modo equipos FUNCIONAL: marcador en el televisor + panel para SUMAR
       PUNTOS a cada equipo durante la clase, persistido (onChange) y
       controlable también desde el celular del docente.

   El control remoto funciona como un "estado espejo" en Firestore:
     - El Presenter ESCRIBE el estado (slide actual, equipos, puntajes…)
     - El celular ESCRIBE comandos; el Presenter los ESCUCHA y reacciona.

   NOTA SOBRE EQUIPOS:
     El Editor crea equipos con forma { name, color }. Internamente, este
     presenter los normaliza a { id, nombre, color, puntos } con la función
     normalizarEquipos(), para tener un id estable y un puntaje persistente.
     Los puntos se guardan dentro de pres.equipos (campo `puntos`) vía onChange,
     conservando name/color como los dejó el Editor. */

/* Hash corto y determinista del PIN del mando.
   Definido con guardia para no duplicarlo entre presenter.jsx y remote.jsx. */
if (!window.hashPin) {
  window.hashPin = function hashPin(pin) {
    const s = String(pin || '');
    if (!s) return '';
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'p' + h.toString(36);
  };
}

/* Normaliza la lista de equipos del Editor a la forma interna estable.
   Acepta tanto { name, color } (Editor) como { nombre, puntos } (legado).
   Devuelve siempre { id, nombre, color, puntos }. */
function normalizarEquipos(lista) {
  const src = (lista && lista.length)
    ? lista
    : [{ name: 'Equipo Verde', color: '#11F555' }, { name: 'Equipo Naranja', color: '#F53711' }];
  return src.slice(0, 6).map((t, i) => ({
    id: t.id != null ? t.id : i,
    nombre: t.nombre || t.name || ('Equipo ' + (i + 1)),
    color: t.color || '#11F555',
    puntos: Number.isFinite(t.puntos) ? t.puntos : (Number.isFinite(t.score) ? t.score : 0),
  }));
}

/* ---------- Marcador de equipos en el televisor ---------- */
function TeamScoreboard({ equipos, hidden }) {
  if (!equipos || !equipos.length) return null;
  const lider = equipos.reduce((m, e) => Math.max(m, e.puntos || 0), 0);
  return (
    <div style={{
      position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
      display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30,
      transition: 'opacity .35s ease', opacity: hidden ? 0 : 1, pointerEvents: 'none',
    }}>
      {[...equipos].sort((a, b) => (b.puntos || 0) - (a.puntos || 0)).map((e) => {
        const esLider = (e.puntos || 0) === lider && lider > 0;
        return (
          <div key={e.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(11,14,11,.78)', backdropFilter: 'blur(8px)',
            borderRadius: 16, padding: '10px 16px 10px 12px',
            border: '2px solid ' + (esLider ? e.color : '#2A2F29'), minWidth: 210,
          }}>
            <div style={{ width: 18, height: 44, borderRadius: 6, background: e.color, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              color: '#F2F5EF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {e.nombre}
            </div>
            {esLider && <span style={{ fontSize: 20 }}>👑</span>}
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 1,
              color: e.color, minWidth: 54, textAlign: 'right' }}>{e.puntos || 0}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Panel ARRASTRABLE para sumar puntos por equipo ---------- */
/* Aparece en modo equipos. Permite sumar/restar puntos a cada equipo durante
   cualquier actividad. El docente puede moverlo para que no tape el contenido. */
function PanelPuntos({ equipos, valor, onSumar, onAjustar, pos, onMover, onReset }) {
  if (!equipos || !equipos.length) return null;
  const base = pos
    ? { left: pos.left, top: pos.top }
    : { bottom: 78, right: 18 };
  return (
    <div style={{
      position: 'fixed', zIndex: 40, ...base,
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 8,
      background: 'rgba(11,14,11,.92)', backdropFilter: 'blur(8px)',
      padding: '10px 14px', borderRadius: 16, border: '2px solid #2A2F29', maxWidth: 380,
    }}>
      {/* Asa de arrastre */}
      <div onPointerDown={onMover} title="Arrastra para mover"
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'grab',
          color: '#F2F5EF', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
        <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 16 }}>⠿</span>
        🏆 ¿Quién acertó? <span style={{ color: '#F5C211' }}>+{valor}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {equipos.map((e) => (
          <div key={e.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <button onClick={() => onSumar(e.id)}
              style={{ border: 'none', background: e.color, color: '#06140A', borderRadius: 12,
                padding: '8px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15,
                cursor: 'pointer', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              +{valor} {e.nombre}
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button onClick={() => onAjustar(e.id, -1)} title="Restar 1"
                style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: '#1C201B',
                  color: '#9AA396', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>−</button>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18,
                color: e.color, minWidth: 22, textAlign: 'center' }}>{e.puntos || 0}</span>
              <button onClick={() => onAjustar(e.id, 1)} title="Sumar 1"
                style={{ width: 26, height: 26, borderRadius: 8, border: 'none', background: e.color,
                  color: '#06140A', fontWeight: 800, fontSize: 16, cursor: 'pointer' }}>+</button>
            </div>
          </div>
        ))}
      </div>
      {pos && (
        <button onClick={onReset}
          style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.45)',
            fontSize: 11.5, cursor: 'pointer', textAlign: 'center' }}>
          ↺ Volver a su lugar
        </button>
      )}
    </div>
  );
}

/* ---------- Tarjeta de conexión (código + QR) ---------- */
function RemoteBadge({ code, onClose, count }) {
  if (!code) return null;
  const remoteUrl = location.origin + location.pathname + '?remote=' + code;
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(remoteUrl);
  return (
    <div style={{
      position: 'absolute', top: 18, left: 18, zIndex: 30,
      background: 'rgba(11,14,11,.82)', backdropFilter: 'blur(8px)',
      border: '2px solid #2A2F29', borderRadius: 18, padding: 16,
      display: 'flex', alignItems: 'center', gap: 16, maxWidth: 360,
    }}>
      <img src={qr} alt="QR del control remoto" width="90" height="90"
        style={{ borderRadius: 10, background: '#fff', flexShrink: 0 }} />
      <div style={{ color: '#F2F5EF' }}>
        <div style={{ fontSize: 12, color: '#9AA396', fontWeight: 600, letterSpacing: '.08em' }}>SALA · CÓDIGO</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, letterSpacing: '.12em', lineHeight: 1.05 }}>{code}</div>
        {count != null && count > 0
          ? <div style={{ fontSize: 13, color: '#11F555', marginTop: 4, fontWeight: 700 }}>👥 {count} conectado{count === 1 ? '' : 's'}</div>
          : <div style={{ fontSize: 12, color: '#9AA396', marginTop: 4 }}>Escanea el QR o entra con el código</div>}
      </div>
      <button onClick={onClose} title="Ocultar"
        style={{ background: 'transparent', border: 'none', color: '#9AA396', fontSize: 20, cursor: 'pointer', alignSelf: 'flex-start' }}>✕</button>
    </div>
  );
}

/* ---------- Panel de participación (sorteo de manos) ---------- */
function ParticipationPanel({ fase, participants, elegido, sorteando, onSortear, onCerrar }) {
  const manos = participants.filter((p) => p.hand).sort((a, b) => (a.handAt || 0) - (b.handAt || 0));
  const elegidoP = participants.find((p) => p.pid === elegido);
  const etiqueta = (p) => p.grupo ? (p.nombre + ' · ' + p.grupo) : p.nombre;
  return (
    <div style={{
      position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
      width: 340, zIndex: 35, background: 'rgba(11,14,11,.92)', backdropFilter: 'blur(10px)',
      border: '2px solid #116CF5', borderRadius: 20, padding: 18, color: '#F2F5EF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>✋ Participación</div>
        <button onClick={onCerrar} style={{ background: 'transparent', border: 'none', color: '#9AA396', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>

      {fase === 'sorteo' && elegidoP ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 13, color: '#9AA396', fontWeight: 600, letterSpacing: '.08em' }}>PARTICIPA</div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, color: '#11F555', lineHeight: 1.15, margin: '8px 0 4px' }}>
            {elegidoP.nombre}
          </div>
          {elegidoP.grupo && <div style={{ fontSize: 16, color: '#B9C2B5' }}>{elegidoP.grupo}</div>}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: '#9AA396', marginBottom: 10 }}>
          {manos.length ? (manos.length + ' levantaron la mano') : 'Esperando que levanten la mano…'}
        </div>
      )}

      {fase !== 'sorteo' && (
        <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {manos.map((p, i) => (
            <div key={p.pid} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              background: '#141814', borderRadius: 10, fontSize: 14,
            }}>
              <span style={{ color: '#7B857A', fontWeight: 700, minWidth: 18 }}>{i + 1}</span>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etiqueta(p)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {fase === 'sorteo' ? (
          <button onClick={onSortear} disabled={!manos.length || sorteando}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: '#116CF5', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 15, cursor: 'pointer' }}>
            🎲 Sortear otro
          </button>
        ) : (
          <button onClick={onSortear} disabled={!manos.length || sorteando}
            style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: 'none', background: manos.length ? '#11F555' : '#2A2F29', color: manos.length ? '#06140A' : '#9AA396', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 15, cursor: manos.length ? 'pointer' : 'default' }}>
            {sorteando ? 'Sorteando…' : '🎲 Sortear'}
          </button>
        )}
      </div>
    </div>
  );
}

function Presenter({ pres, onChange, onExit }) {
  const [idx, setIdx] = React.useState(0);
  const [scale, setScale] = React.useState(0.5);
  const slides = pres.slides;

  // --- Equipos (modo 'equipos') ---
  const esEquipos = pres.modo === 'equipos';
  // Estado local de equipos normalizado { id, nombre, color, puntos }.
  const [equipos, setEquipos] = React.useState(() => normalizarEquipos(pres.equipos));
  const [hideScores, setHideScores] = React.useState(false);
  // Re-sincroniza si cambia la presentación (otra clase) — conserva puntos guardados.
  React.useEffect(() => { setEquipos(normalizarEquipos(pres.equipos)); }, [pres.id]);

  // Persistir equipos: estado local -> presentación (Firestore vía onChange del padre).
  // Guarda conservando name/color del Editor y añadiendo puntos.
  const persistirEquipos = (next) => {
    setEquipos(next);
    if (onChange) {
      const guardar = next.map((e) => ({ name: e.nombre, color: e.color, puntos: e.puntos }));
      onChange({ ...pres, equipos: guardar });
    }
  };

  // Valor de la actividad actual (cuántos puntos vale acertar).
  const slideActual = slides[Math.min(idx, slides.length - 1)];
  const valorActividad = Math.max(1, Number(slideActual && slideActual.config && slideActual.config.puntos) || 1);

  // Sumar el valor de la actividad a un equipo (botón "¿quién acertó?").
  const sumarPunto = (equipoId) => {
    persistirEquipos(equipos.map((e) => (e.id === equipoId ? { ...e, puntos: (e.puntos || 0) + valorActividad } : e)));
  };
  // Ajuste fino ±1 desde el panel o el marcador.
  const ajustarPunto = (equipoId, delta) => {
    persistirEquipos(equipos.map((e) => (e.id === equipoId ? { ...e, puntos: Math.max(0, (e.puntos || 0) + delta) } : e)));
  };

  // Panel de puntos arrastrable: posición (null = esquina por defecto).
  const [panelPos, setPanelPos] = React.useState(null);
  const arrastrePanel = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const panel = e.currentTarget.parentElement;
    const rect = panel.getBoundingClientRect();
    const ox = rect.left, oy = rect.top;
    const move = (ev) => {
      const nx = Math.max(8, Math.min(window.innerWidth - rect.width - 8, ox + (ev.clientX - startX)));
      const ny = Math.max(8, Math.min(window.innerHeight - rect.height - 8, oy + (ev.clientY - startY)));
      setPanelPos({ left: nx, top: ny });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  /* API que reciben las 4 actividades de equipo (Reta, Pulsador, Apuesta,
     Recuadros) para sumar puntos directamente al MISMO marcador. Así no hay
     dos sistemas de puntos: estas actividades escriben en `equipos` y se
     persiste igual que el panel manual. `sumar` admite deltas negativos
     (lo usa Apuesta cuando un equipo pierde su apuesta).

     IMPORTANTE: el objeto que recibe la actividad debe ser ESTABLE (misma
     identidad entre renders), o el render memorizado de la actividad se
     remontaría al sumar puntos (las tarjetas "se moverían"). Por eso usamos
     un ref que siempre apunta a los datos/lógica más recientes, y exponemos
     un `equiposApi` cuya identidad nunca cambia. */
  const equiposRef = React.useRef({ equipos, onChange, pres });
  equiposRef.current = { equipos, onChange, pres };
  const equiposApi = React.useRef({
    get equipos() { return equiposRef.current.equipos; },
    sumar: (equipoId, pts) => {
      setEquipos((prev) => {
        const next = prev.map((e) => (e.id === equipoId ? { ...e, puntos: Math.max(0, (e.puntos || 0) + (pts || 0)) } : e));
        const oc = equiposRef.current.onChange, pr = equiposRef.current.pres;
        if (oc) oc({ ...pr, equipos: next.map((e) => ({ name: e.nombre, color: e.color, puntos: e.puntos })) });
        return next;
      });
    },
    color: (equipoId) => { const e = equiposRef.current.equipos.find((x) => x.id === equipoId); return e ? e.color : '#11F555'; },
  }).current;

  // --- Control remoto ---
  const [remoteCode, setRemoteCode] = React.useState(null);
  const [badgeVisible, setBadgeVisible] = React.useState(true);
  const [remoteSignal, setRemoteSignal] = React.useState({ action: null, nonce: null });
  const lastNonce = React.useRef(null);

  // --- Estudiantes / participación ---
  const conEstudiantes = pres.estudiantes === true;
  const [participants, setParticipants] = React.useState([]);
  const [ronda, setRonda] = React.useState('idle'); // 'idle' | 'pedir' | 'sorteo'
  const [elegido, setElegido] = React.useState(null);
  const [sorteando, setSorteando] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [pres.id]);

  React.useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Navegación con teclado.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setIdx((i) => Math.min(i + 1, slides.length - 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length, onExit]);

  // Crear la sesión remota al entrar al modo Presentar.
  React.useEffect(() => {
    let vivo = true;
    let code = null;
    if (AIP.createRemoteSession) {
      AIP.createRemoteSession({}).then(({ code: c }) => {
        if (!vivo) { AIP.closeRemoteSession(c); return; }
        code = c;
        setRemoteCode(c);
      }).catch((e) => console.error('[remote] no se pudo crear sesión:', e));
    }
    return () => { vivo = false; if (code) AIP.closeRemoteSession(code); };
  }, [pres.id]);

  // Escuchar la lista de estudiantes.
  React.useEffect(() => {
    if (!remoteCode || !conEstudiantes || !AIP.listenParticipants) return;
    const unsub = AIP.listenParticipants(remoteCode, (list) => setParticipants(list || []));
    return unsub;
  }, [remoteCode, conEstudiantes]);

  const abrirParticipacion = () => {
    setElegido(null);
    setRonda('pedir');
    if (AIP.resetRound) AIP.resetRound(remoteCode);
  };
  const sortear = () => {
    const manos = participants.filter((p) => p.hand);
    if (!manos.length || sorteando) return;
    setSorteando(true);
    let n = 0;
    const t = setInterval(() => {
      setElegido(manos[Math.floor(Math.random() * manos.length)].pid);
      n++;
      if (n > 12) {
        clearInterval(t);
        setElegido(manos[Math.floor(Math.random() * manos.length)].pid);
        setSorteando(false);
        setRonda('sorteo');
      }
    }, 110);
  };
  const cerrarParticipacion = () => { setRonda('idle'); setElegido(null); };

  // Escuchar comandos del celular.
  React.useEffect(() => {
    if (!remoteCode || !AIP.listenRemoteSession) return;
    const unsub = AIP.listenRemoteSession(remoteCode, (data) => {
      if (!data || !data.command) return;
      const cmd = data.command;
      if (cmd.nonce === lastNonce.current) return;
      lastNonce.current = cmd.nonce;
      handleRemoteCommand(cmd);
      AIP.clearRemoteCommand(remoteCode);
    });
    return unsub;
  }, [remoteCode, slides.length, equipos, valorActividad]);

  // Procesa un comando entrante del celular.
  const handleRemoteCommand = (cmd) => {
    switch (cmd.type) {
      case 'next':
        setIdx((i) => Math.min(i + 1, slides.length - 1)); break;
      case 'prev':
        setIdx((i) => Math.max(i - 1, 0)); break;
      case 'goto':
        if (typeof cmd.payload === 'number') setIdx(Math.max(0, Math.min(cmd.payload, slides.length - 1))); break;
      case 'score': {
        // Suma/resta puntos a un equipo por su índice (desde el celular).
        const { team, delta } = cmd.payload || {};
        setEquipos((prev) => {
          const next = prev.map((e, i) => (i === team ? { ...e, puntos: Math.max(0, (e.puntos || 0) + (delta || 0)) } : e));
          if (onChange) onChange({ ...pres, equipos: next.map((e) => ({ name: e.nombre, color: e.color, puntos: e.puntos })) });
          return next;
        });
        break;
      }
      case 'toggleScores':
        setHideScores((h) => (typeof cmd.payload === 'boolean' ? cmd.payload : !h)); break;
      case 'exit':
        onExit(); break;
      case 'activity':
        setRemoteSignal({ action: (cmd.payload && cmd.payload.action) || 'primary', nonce: cmd.nonce });
        break;
      default: break;
    }
  };

  // Escribir el estado espejo en Firestore.
  React.useEffect(() => {
    if (!remoteCode || !AIP.updateRemoteState) return;
    const slide = slides[Math.min(idx, slides.length - 1)];
    const isAct = slide.type === 'actividad';
    const t = isAct ? AIP.toolById(slide.tool) : null;
    const cfg = slide.config || {};
    const mirror = isAct
      ? { tipo: 'actividad', tool: slide.tool, nombre: t && t.nombre, color: t && t.color,
          titulo: cfg.titulo || '', instrucciones: cfg.instrucciones || '',
          config: slide.config || {} }
      : { tipo: 'contenido', titulo: slide.titulo || '', texto: slide.texto || '',
          slide: { id: slide.id, type: 'contenido', titulo: slide.titulo || '', texto: slide.texto || '',
                   imagen: slide.imagen || null, elementos: slide.elementos || null, fondo: slide.fondo || null } };
    // Para el celular: equipos con índice (para el comando 'score' por índice).
    const teamsMirror = esEquipos ? equipos.map((e) => ({ name: e.nombre, color: e.color, score: e.puntos })) : [];
    AIP.updateRemoteState(remoteCode, {
      idx,
      total: slides.length,
      tema: pres.tema || '',
      modo: esEquipos ? 'equipos' : 'normal',
      hideScores,
      activity: isAct ? { tool: slide.tool, titulo: cfg.titulo || (t && t.nombre) || '' } : null,
      teams: teamsMirror,
      mirror,
      permiteEstudiantes: conEstudiantes,
      mandoHash: window.hashPin(pres.mandoPin || ''),
      ronda: { fase: ronda, elegido },
    });
  }, [remoteCode, idx, slides.length, hideScores, equipos, esEquipos, ronda, elegido, conEstudiantes]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const isAct = slide.type === 'actividad';
  const tool = isAct ? AIP.toolById(slide.tool) : null;
  // ¿Esta actividad es de las que reparten puntos por equipo?
  const ACTS_EQUIPO = ['retaEquipo', 'pulsador', 'apuesta', 'recuadros'];
  const esActEquipo = isAct && ACTS_EQUIPO.includes(slide.tool);

  /* Render de la diapositiva/actividad MEMORIZADO.
     Clave del arreglo: sumar puntos cambia `equipos` y persiste `pres`, lo que
     antes remontaba la actividad y la reiniciaba (las tarjetas "se movían").
     Aquí el contenido del escenario solo se recalcula cuando cambia el slide
     en sí (su id/herramienta/contenido) o llega una señal del control remoto —
     NUNCA cuando cambian los puntos. Así la actividad conserva su estado.
     Usamos una FIRMA del slide (texto), no su referencia de objeto, porque al
     persistir la presentación el objeto se vuelve a crear aunque su contenido
     sea idéntico. equiposApi es estable (ref), así que no rompe la memo. */
  const slideSig = React.useMemo(() => {
    try { return JSON.stringify(slide); } catch (e) { return slide.id; }
  }, [slide]);
  const escenario = React.useMemo(() => {
    if (isAct) {
      const Runtime = ActivityRuntimes[slide.tool] || ActivityRuntimes.default;
      // Solo las actividades de equipo reciben equiposApi; el resto, remoteSignal.
      return esActEquipo
        ? <Runtime config={slide.config} tool={tool} equiposApi={esEquipos ? equiposApi : null} remoteSignal={remoteSignal} />
        : <Runtime config={slide.config} tool={tool} remoteSignal={remoteSignal} />;
    }
    return <ContenidoSlide slide={slide} materia={pres.materia || 'Tema'} accent={pres.color} />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slideSig, isAct, slide.tool, esActEquipo, esEquipos, remoteSignal, pres.materia, pres.color]);

  return (
    <div className="presenter-overlay" data-screen-label={'Presentar · ' + String(idx + 1).padStart(2, '0')}>
      <div className="presenter-stagewrap">
        <div className="slide" key={slide.id} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center', background: isAct ? '#0B0E0B' : '#FFFFFF', color: isAct ? '#F2F5EF' : '#0B0F0C' }}>
          {escenario}
        </div>
      </div>

      {/* Marcador de equipos */}
      {esEquipos && <TeamScoreboard equipos={equipos} hidden={hideScores} />}

      {/* Panel para sumar puntos por equipo (modo equipos).
          Se oculta durante las actividades de equipo, que ya reparten puntos
          por sí mismas, para no duplicar controles. */}
      {esEquipos && !hideScores && !esActEquipo && (
        <PanelPuntos
          equipos={equipos} valor={valorActividad}
          onSumar={sumarPunto} onAjustar={ajustarPunto}
          pos={panelPos} onMover={arrastrePanel} onReset={() => setPanelPos(null)} />
      )}

      {/* Tarjeta de conexión del control remoto */}
      {badgeVisible && <RemoteBadge code={remoteCode} onClose={() => setBadgeVisible(false)} count={participants.length} />}

      {/* Panel de participación (sorteo de manos) */}
      {ronda !== 'idle' && (
        <ParticipationPanel
          fase={ronda} participants={participants} elegido={elegido}
          sorteando={sorteando} onSortear={sortear} onCerrar={cerrarParticipacion} />
      )}

      {/* HUD superior derecho */}
      <div className="presenter-hud" style={{ top: 18, right: 18, gap: 8 }}>
        {conEstudiantes && ronda === 'idle' && (
          <button className="hud-btn" onClick={abrirParticipacion} title="Pedir participación">
            ✋ Pedir participación
          </button>
        )}
        {esEquipos && (
          <button className="hud-btn" onClick={() => setHideScores((h) => !h)} title="Ocultar/mostrar puntaje">
            {hideScores ? '👁 Mostrar puntaje' : '🙈 Ocultar puntaje'}
          </button>
        )}
        {!badgeVisible && remoteCode && (
          <button className="hud-btn" onClick={() => setBadgeVisible(true)} title="Mostrar código de control">📱 {remoteCode}</button>
        )}
        <button className="hud-btn" onClick={onExit} title="Salir (Esc)">✕ Salir</button>
      </div>

      <div className="presenter-hud" style={{ bottom: 18, left: 18, color: 'rgba(255,255,255,.55)', fontSize: 14, fontWeight: 600 }}>
        <span style={{ fontFamily: 'var(--font-display)' }}>{pres.tema}</span>
        <span style={{ opacity: .6 }}>·</span>
        <span>{idx + 1} / {slides.length}</span>
      </div>
      <div className="presenter-hud" style={{ bottom: 18, right: 18 }}>
        <button className="hud-btn" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={{ opacity: idx === 0 ? .35 : 1 }}>←</button>
        <button className="hud-btn" onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1} style={{ opacity: idx === slides.length - 1 ? .35 : 1 }}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { Presenter, TeamScoreboard, PanelPuntos, RemoteBadge, ParticipationPanel, normalizarEquipos });