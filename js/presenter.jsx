/* Modo Presentar — pantalla completa para el televisor o video beam.
   Incluye:
     · Marcador de equipos global (ocultable) cuando la presentación es modo 'equipos'
     · Sesión de control remoto: el celular del docente actúa como mando
       (avanzar, sumar puntos, ocultar puntaje, controlar la actividad activa)

   El control remoto funciona como un "estado espejo" en Firestore:
     - El Presenter ESCRIBE el estado (slide actual, equipos, puntajes…)
     - El celular ESCRIBE comandos; el Presenter los ESCUCHA y reacciona. */

/* ---------- Marcador global de equipos ---------- */
function TeamScoreboard({ teams, hidden, accentText }) {
  if (!teams || !teams.length) return null;
  return (
    <div
      className="tv-scoreboard"
      style={{
        position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', gap: 12, zIndex: 30,
        transition: 'opacity .35s ease, transform .35s ease',
        opacity: hidden ? 0 : 1, pointerEvents: 'none',
        transformOrigin: 'left center',
      }}
    >
      {teams.map((t, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          background: 'rgba(11,14,11,.78)', backdropFilter: 'blur(8px)',
          borderRadius: 16, padding: '10px 16px 10px 12px',
          border: '2px solid ' + (t.color || '#2A2F29'),
          minWidth: 190,
        }}>
          <div style={{
            width: 18, height: 44, borderRadius: 6, background: t.color || '#11F555', flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
              color: '#F2F5EF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{t.name || ('Equipo ' + (i + 1))}</div>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38,
            lineHeight: 1, color: t.color || '#11F555', minWidth: 54, textAlign: 'right',
          }}>{t.score || 0}</div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Tarjeta de conexión (código + QR) ---------- */
function RemoteBadge({ code, onClose, count }) {
  if (!code) return null;
  // QR generado por servicio externo simple; el celular abre la URL del control.
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

function Presenter({ pres, onExit }) {
  const [idx, setIdx] = React.useState(0);
  const [scale, setScale] = React.useState(0.5);
  const slides = pres.slides;

  // --- Equipos (modo 'equipos') ---
  const esEquipos = pres.modo === 'equipos';
  const equiposBase = React.useMemo(() => {
    const src = (pres.equipos && pres.equipos.length)
      ? pres.equipos
      : [{ name: 'Equipo Verde', color: '#11F555' }, { name: 'Equipo Naranja', color: '#F53711' }];
    return src.slice(0, 6).map((t) => ({ name: t.name, color: t.color, score: 0 }));
  }, [pres.id]);
  const [teams, setTeams] = React.useState(equiposBase);
  const [hideScores, setHideScores] = React.useState(false);
  React.useEffect(() => { setTeams(equiposBase); setHideScores(false); }, [equiposBase]);

  // --- Control remoto ---
  const [remoteCode, setRemoteCode] = React.useState(null);
  const [badgeVisible, setBadgeVisible] = React.useState(true);
  // Señal que las actividades pueden observar para reaccionar a comandos del celular.
  const [remoteSignal, setRemoteSignal] = React.useState({ action: null, nonce: null });
  const lastNonce = React.useRef(null);

  // --- Estudiantes / participación ---
  // Permitir estudiantes: por ahora siempre activo si la presentación lo marca,
  // o si el docente lo activa en vivo. Lo dejamos activo por defecto.
  const conEstudiantes = pres.estudiantes !== false;
  const [participants, setParticipants] = React.useState([]);
  // Ronda de participación: 'idle' | 'pedir' (manos abiertas) | 'sorteo' (ya hay elegido)
  const [ronda, setRonda] = React.useState('idle');
  const [elegido, setElegido] = React.useState(null); // pid del sorteado
  const [sorteando, setSorteando] = React.useState(false);

  React.useEffect(() => { setIdx(0); }, [pres.id]);

  React.useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Navegación con teclado (sigue funcionando junto al control remoto).
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

  // Escuchar la lista de estudiantes que se han unido.
  React.useEffect(() => {
    if (!remoteCode || !conEstudiantes || !AIP.listenParticipants) return;
    const unsub = AIP.listenParticipants(remoteCode, (list) => setParticipants(list || []));
    return unsub;
  }, [remoteCode, conEstudiantes]);

  // Abrir ronda de participación: limpia manos y abre el periodo de "levantar la mano".
  const abrirParticipacion = () => {
    setElegido(null);
    setRonda('pedir');
    if (AIP.resetRound) AIP.resetRound(remoteCode);
  };
  // Sortear entre quienes levantaron la mano.
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
      if (cmd.nonce === lastNonce.current) return; // ya procesado
      lastNonce.current = cmd.nonce;
      handleRemoteCommand(cmd);
      AIP.clearRemoteCommand(remoteCode);
    });
    return unsub;
  }, [remoteCode, slides.length]);

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
        const { team, delta } = cmd.payload || {};
        setTeams((prev) => prev.map((t, i) => (i === team ? { ...t, score: Math.max(0, (t.score || 0) + (delta || 0)) } : t)));
        break;
      }
      case 'toggleScores':
        setHideScores((h) => (typeof cmd.payload === 'boolean' ? cmd.payload : !h)); break;
      case 'exit':
        onExit(); break;
      case 'activity':
        // Reenvía una "acción de actividad" a la actividad activa vía señal.
        setRemoteSignal({ action: (cmd.payload && cmd.payload.action) || 'primary', nonce: cmd.nonce });
        break;
      default: break;
    }
  };

  // Escribir el estado espejo en Firestore cada vez que cambia algo relevante.
  React.useEffect(() => {
    if (!remoteCode || !AIP.updateRemoteState) return;
    const slide = slides[Math.min(idx, slides.length - 1)];
    const isAct = slide.type === 'actividad';
    const t = isAct ? AIP.toolById(slide.tool) : null;
    const cfg = slide.config || {};
    // 'mirror' = lo que el estudiante ve en su celular (versión ligera del slide).
    const mirror = isAct
      ? { tipo: 'actividad', tool: slide.tool, nombre: t && t.nombre, color: t && t.color,
          titulo: cfg.titulo || '', instrucciones: cfg.instrucciones || '' }
      : { tipo: 'contenido', titulo: slide.titulo || '', texto: slide.texto || '' };
    AIP.updateRemoteState(remoteCode, {
      idx,
      total: slides.length,
      tema: pres.tema || '',
      modo: esEquipos ? 'equipos' : 'normal',
      hideScores,
      activity: isAct ? { tool: slide.tool, titulo: cfg.titulo || (t && t.nombre) || '' } : null,
      teams: esEquipos ? teams : [],
      mirror,
      // Estado de la ronda de participación para los estudiantes.
      ronda: { fase: ronda, elegido },
    });
  }, [remoteCode, idx, slides.length, hideScores, teams, esEquipos, ronda, elegido]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const isAct = slide.type === 'actividad';
  const tool = isAct ? AIP.toolById(slide.tool) : null;
  const Runtime = isAct ? (ActivityRuntimes[slide.tool] || ActivityRuntimes.default) : null;

  return (
    <div className="presenter-overlay" data-screen-label={'Presentar · ' + String(idx + 1).padStart(2, '0')}>
      <div className="presenter-stagewrap">
        <div className="slide" key={slide.id} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center', background: isAct ? '#0B0E0B' : '#FFFFFF', color: isAct ? '#F2F5EF' : '#0B0F0C' }}>
          {isAct
            ? <Runtime config={slide.config} tool={tool} remoteSignal={remoteSignal} />
            : <ContenidoSlide slide={slide} materia={pres.materia || 'Tema'} accent={pres.color} />}
        </div>
      </div>

      {/* Marcador de equipos (solo modo equipos) */}
      {esEquipos && <TeamScoreboard teams={teams} hidden={hideScores} />}

      {/* Tarjeta de conexión del control remoto */}
      {badgeVisible && <RemoteBadge code={remoteCode} onClose={() => setBadgeVisible(false)} count={participants.length} />}

      {/* Panel de participación (sorteo de manos levantadas) */}
      {ronda !== 'idle' && (
        <ParticipationPanel
          fase={ronda} participants={participants} elegido={elegido}
          sorteando={sorteando} onSortear={sortear} onCerrar={cerrarParticipacion} />
      )}

      {/* HUD fuera del escenario escalado */}
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

Object.assign(window, { Presenter, TeamScoreboard, RemoteBadge, ParticipationPanel });
