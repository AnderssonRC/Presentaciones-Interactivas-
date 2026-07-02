/* Modo Presentar — pantalla completa para el televisor o video beam.
   Incluye:
     · Marcador de equipos global (ocultable) cuando la presentación es modo 'equipos'
     · Sesión de control remoto: el celular del docente actúa como mando
       (avanzar, sumar puntos, ocultar puntaje, controlar la actividad activa)

   El control remoto funciona como un "estado espejo" en Firestore:
     - El Presenter ESCRIBE el estado (slide actual, equipos, puntajes…)
     - El celular ESCRIBE comandos; el Presenter los ESCUCHA y reacciona. */

/* Hash del PIN del mando (DJB2). Se define aquí CON GUARDIA, igual que en
   remote.jsx, para que el Presenter nunca dependa del orden de carga ni de
   que remote.jsx haya cargado sin errores. El guard `if (!window.hashPin)`
   evita la doble declaración: quien cargue primero, gana. */
if (!window.hashPin) {
  window.hashPin = function hashPin(pin) {
    const s = String(pin || '');
    if (!s) return '';
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'p' + h.toString(36);
  };
}

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

/* ---------- Confeti (sin librerías): partículas CSS que caen ---------- */
function Confeti({ activo }) {
  // Generamos las piezas una sola vez; cada una cae con retraso/posición aleatorios.
  const piezas = React.useMemo(() => {
    const cols = ['#11F555', '#F53711', '#116CF5', '#F5C211', '#A855F7', '#EC4899', '#FFFFFF'];
    return Array.from({ length: 130 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      dur: 2.6 + Math.random() * 2.4,
      size: 7 + Math.random() * 9,
      color: cols[i % cols.length],
      giro: (Math.random() * 720 - 360),
      redondo: Math.random() > 0.6,
    }));
  }, []);
  if (!activo) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 60 }}>
      {piezas.map((p) => (
        <span key={p.id} style={{
          position: 'absolute', top: '-5%', left: p.left + '%',
          width: p.size, height: p.redondo ? p.size : p.size * 0.5,
          background: p.color, borderRadius: p.redondo ? '50%' : 2,
          opacity: 0.9,
          animation: `confetiCae ${p.dur}s linear ${p.delay}s infinite`,
          ['--giro']: p.giro + 'deg',
        }} />
      ))}
    </div>
  );
}

/* ---------- Pantalla de podio (equipo ganador) ----------
   Ordena por puntaje desc. 1º grande con corona; 2º y 3º a los lados.
   Empate en 1º: ambos comparten el lugar central. Menos de 3 equipos:
   solo el ganador en grande, sin escalones laterales. */
function PodioGanador({ teams, onCerrar }) {
  const orden = [...(teams || [])].map((t, i) => ({ ...t, _i: i }))
    .sort((a, b) => (b.score || 0) - (a.score || 0) || a._i - b._i);

  const maxScore = orden.length ? (orden[0].score || 0) : 0;
  // Empatados en el primer lugar (mismo puntaje que el máximo).
  const campeones = orden.filter((t) => (t.score || 0) === maxScore);
  const hayEmpate = campeones.length > 1;
  // Si hay 3+ equipos y NO hay empate en 1º, mostramos podio de escalones.
  const podioCompleto = orden.length >= 3 && !hayEmpate;

  const Tarjeta = ({ t, lugar, alto, grande }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      {lugar === 1 && <div style={{ fontSize: grande ? 64 : 44 }}>👑</div>}
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: grande ? 52 : 34, color: '#F2F5EF', textAlign: 'center',
        maxWidth: grande ? 460 : 300, lineHeight: 1.1,
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>{t.name || ('Equipo ' + (t._i + 1))}</div>
      <div style={{
        fontFamily: 'var(--font-display)', fontWeight: 800,
        fontSize: grande ? 96 : 60, lineHeight: 1, color: t.color || '#11F555',
      }}>{t.score || 0}</div>
      {/* Escalón */}
      <div style={{
        width: grande ? 300 : 220, height: alto, marginTop: 8,
        background: 'linear-gradient(to bottom, ' + (t.color || '#11F555') + ', rgba(255,255,255,.04))',
        border: '3px solid ' + (t.color || '#11F555'),
        borderRadius: '16px 16px 0 0',
        display: 'grid', placeItems: 'center',
        boxShadow: grande ? '0 0 50px -8px ' + (t.color || '#11F555') : 'none',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: grande ? 88 : 60, color: 'rgba(11,14,11,.55)' }}>
          {lugar}º
        </span>
      </div>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 55,
      background: 'radial-gradient(1200px 600px at 50% -10%, rgba(17,108,245,.25), transparent 60%), rgba(6,8,6,.97)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 40,
    }}>
      <Confeti activo />

      <div style={{ position: 'relative', zIndex: 61, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '.24em', textTransform: 'uppercase', color: '#9AA396' }}>
          {hayEmpate ? '¡Empate en el primer lugar!' : 'Resultado final'}
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 64, color: '#F5C211', margin: '6px 0 40px' }}>
          {hayEmpate ? '🏆 ¡Campeones!' : '🏆 ¡Equipo ganador!'}
        </div>

        {hayEmpate ? (
          /* Empate: todos los campeones grandes, lado a lado */
          <div style={{ display: 'flex', gap: 50, alignItems: 'flex-end', justifyContent: 'center', flexWrap: 'wrap' }}>
            {campeones.map((t) => <Tarjeta key={t._i} t={t} lugar={1} alto={210} grande />)}
          </div>
        ) : podioCompleto ? (
          /* Podio de 3: 2º izquierda, 1º centro grande, 3º derecha */
          <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end', justifyContent: 'center' }}>
            <Tarjeta t={orden[1]} lugar={2} alto={150} />
            <Tarjeta t={orden[0]} lugar={1} alto={230} grande />
            <Tarjeta t={orden[2]} lugar={3} alto={110} />
          </div>
        ) : (
          /* Menos de 3 equipos: solo el ganador en grande */
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Tarjeta t={orden[0]} lugar={1} alto={230} grande />
          </div>
        )}
      </div>

      <button className="hud-btn" onClick={onCerrar}
        style={{ position: 'relative', zIndex: 61, marginTop: 50 }}
        title="Volver a la presentación">
        ← Volver
      </button>
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

/* ---------- Panel manual de puntos (¿Quién acertó?) ----------
   Disponible en cualquier actividad de una presentación modo-equipos.
   Permite sumar/restar puntos a mano sin depender de la actividad activa. */
function PanelPuntos({ teams, onPunto, onCerrar }) {
  if (!teams || !teams.length) return null;
  return (
    <div style={{
      position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)',
      width: 320, zIndex: 36, background: 'rgba(11,14,11,.92)', backdropFilter: 'blur(10px)',
      border: '2px solid #11F555', borderRadius: 20, padding: 18, color: '#F2F5EF',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>🏅 ¿Quién acertó?</div>
        <button onClick={onCerrar} style={{ background: 'transparent', border: 'none', color: '#9AA396', fontSize: 18, cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {teams.map((t, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: '#141814', borderRadius: 14, padding: '8px 10px',
            border: '2px solid ' + (t.color || '#2A2F29'),
          }}>
            <div style={{ width: 10, height: 34, borderRadius: 4, background: t.color || '#11F555', flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {t.name || ('Equipo ' + (i + 1))}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: t.color || '#11F555', minWidth: 32, textAlign: 'center' }}>
              {t.score || 0}
            </div>
            <button onClick={() => onPunto(i, -1)} style={{ width: 40, height: 40, fontSize: 24, fontWeight: 800, borderRadius: 10, border: 'none', background: '#1C201B', color: '#9AA396', cursor: 'pointer' }}>−</button>
            <button onClick={() => onPunto(i, 1)} style={{ width: 40, height: 40, fontSize: 24, fontWeight: 800, borderRadius: 10, border: 'none', background: t.color || '#11F555', color: '#06140A', cursor: 'pointer' }}>+</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Máximo "orden" de revelado de una plantilla de contenido. Las actividades
// y las plantillas sin elementos no tienen pasos (devuelven 0).
function maxPaso(slide) {
  if (!slide || slide.type !== 'contenido') return 0;
  const els = Array.isArray(slide.elementos) ? slide.elementos : [];
  if (!els.length) return 0;
  return els.reduce((m, el) => Math.max(m, el.orden || 0), 0);
}

function Presenter({ pres, onExit }) {
  const [idx, setIdx] = React.useState(0);
  // `paso` = cuántos niveles de animación se han revelado en el slide actual.
  // Avanza con → / espacio antes de pasar al siguiente slide.
  const [paso, setPaso] = React.useState(0);
  // `replay` fuerza re-montaje del lienzo para reanimar al entrar a un slide.
  const [replay, setReplay] = React.useState(0);
  const [scale, setScale] = React.useState(0.5);
  const slides = pres.slides;

  // --- Equipos (modo 'equipos') ---
  const esEquipos = pres.modo === 'equipos';
  // Pantalla de podio del equipo ganador (manual o automática al final).
  const [verPodio, setVerPodio] = React.useState(false);
  // Panel manual de puntos (¿Quién acertó?), disponible en cualquier actividad.
  const [verPuntos, setVerPuntos] = React.useState(false);

  // Avanzar: primero revela el siguiente elemento; si ya se reveló todo,
  // pasa al siguiente slide y reinicia los pasos. En modo equipos, al intentar
  // pasar de la última diapositiva, se muestra el podio automáticamente.
  const avanzar = React.useCallback(() => {
    setIdx((i) => {
      const tope = maxPaso(slides[Math.min(i, slides.length - 1)]);
      let saltar = false;
      setPaso((p) => {
        if (p < tope) return p + 1;       // revelar siguiente elemento
        saltar = true; return p;          // ya está todo: marcamos salto de slide
      });
      if (saltar) {
        if (i < slides.length - 1) {
          setPaso(0); setReplay((r) => r + 1);
          return i + 1;
        }
        // Estamos en la última diapositiva y ya se reveló todo.
        if (esEquipos) setVerPodio(true);   // mostrar ganador
      }
      return i;
    });
  }, [slides, esEquipos]);

  // Retroceder: oculta el último elemento revelado; si ya está en 0,
  // vuelve al slide anterior mostrándolo completo.
  const retroceder = React.useCallback(() => {
    setIdx((i) => {
      let bajar = false;
      setPaso((p) => {
        if (p > 0) return p - 1;          // ocultar último elemento
        bajar = true; return p;
      });
      if (bajar && i > 0) {
        const prev = i - 1;
        setPaso(maxPaso(slides[prev]));   // slide anterior completo
        setReplay((r) => r + 1);
        return prev;
      }
      return i;
    });
  }, [slides]);

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

  // Ref del intervalo del sorteo, para poder limpiarlo si el docente sale
  // de Presentar (o cambia de diapositiva) a mitad de la animación.
  const sorteoRef = React.useRef(null);
  React.useEffect(() => () => { if (sorteoRef.current) clearInterval(sorteoRef.current); }, []);

  // --- Estudiantes / participación ---
  // Coincide con el checkbox del editor (editor.jsx: pres.estudiantes === true):
  // desactivado por defecto, el docente lo enciende explícitamente.
  const conEstudiantes = pres.estudiantes === true;
  const [participants, setParticipants] = React.useState([]);
  // Ronda de participación: 'idle' | 'pedir' (manos abiertas) | 'sorteo' (ya hay elegido)
  const [ronda, setRonda] = React.useState('idle');
  const [elegido, setElegido] = React.useState(null); // pid del sorteado
  const [sorteando, setSorteando] = React.useState(false);

  React.useEffect(() => { setIdx(0); setPaso(0); setReplay((r) => r + 1); setVerPodio(false); }, [pres.id]);

  React.useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Navegación con teclado (sigue funcionando junto al control remoto).
  React.useEffect(() => {
    const onKey = (e) => {
      // Con el podio abierto, Esc/Izquierda lo cierran; lo demás se ignora.
      if (verPodio) {
        if (e.key === 'Escape' || e.key === 'ArrowLeft') { e.preventDefault(); setVerPodio(false); }
        return;
      }
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); avanzar(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); retroceder(); }
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avanzar, retroceder, onExit, verPodio]);

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
    if (sorteoRef.current) clearInterval(sorteoRef.current);
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
    sorteoRef.current = t;
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
      // Se llama vía ref (ver abajo) para no depender de una versión
      // congelada de handleRemoteCommand (evita leer verPodio/idx viejos).
      handleRemoteCommandRef.current(cmd);
      AIP.clearRemoteCommand(remoteCode);
    });
    return unsub;
  }, [remoteCode, slides.length]);

  // Procesa un comando entrante del celular.
  const handleRemoteCommandRef = React.useRef(null);
  const handleRemoteCommand = (cmd) => {
    switch (cmd.type) {
      case 'next':
        avanzar(); break;
      case 'prev':
        if (verPodio) { setVerPodio(false); break; }
        retroceder(); break;
      case 'goto':
        if (typeof cmd.payload === 'number') {
          setVerPodio(false);
          const destino = Math.max(0, Math.min(cmd.payload, slides.length - 1));
          setIdx(destino); setPaso(maxPaso(slides[destino])); setReplay((r) => r + 1);
        }
        break;
      case 'score': {
        const { team, delta } = cmd.payload || {};
        setTeams((prev) => prev.map((t, i) => (i === team ? { ...t, score: Math.max(0, (t.score || 0) + (delta || 0)) } : t)));
        break;
      }
      case 'toggleScores':
        setHideScores((h) => (typeof cmd.payload === 'boolean' ? cmd.payload : !h)); break;
      case 'podium':
        // El celular puede pedir mostrar/ocultar el podio del ganador.
        setVerPodio((v) => (typeof cmd.payload === 'boolean' ? cmd.payload : !v)); break;
      case 'exit':
        onExit(); break;
      case 'activity':
        // Reenvía una "acción de actividad" a la actividad activa vía señal.
        setRemoteSignal({ action: (cmd.payload && cmd.payload.action) || 'primary', nonce: cmd.nonce });
        break;
      default: break;
    }
  };
  handleRemoteCommandRef.current = handleRemoteCommand;

  // Escribir el estado espejo en Firestore cada vez que cambia algo relevante.
  React.useEffect(() => {
    if (!remoteCode || !AIP.updateRemoteState) return;
    const slide = slides[Math.min(idx, slides.length - 1)];
    const isAct = slide.type === 'actividad';
    const t = isAct ? AIP.toolById(slide.tool) : null;
    const cfg = slide.config || {};
    // 'mirror' = lo que el estudiante ve en su celular. Incluye `config`
    // (para montar el mismo Runtime de la actividad, EspejoActividad en
    // student.jsx) o `slide` (para replicar el lienzo libre con EspejoSlide).
    const mirror = isAct
      ? { tipo: 'actividad', tool: slide.tool, nombre: t && t.nombre, color: t && t.color,
          titulo: cfg.titulo || '', instrucciones: cfg.instrucciones || '', config: cfg }
      : { tipo: 'contenido', titulo: slide.titulo || '', texto: slide.texto || '', slide };
    // Ronda de Quiz/Kahoot: se abre automáticamente para la actividad "elige"
    // (opción múltiple), tomando la primera pregunta configurada.
    // Formato de cada línea en 'elige': "Pregunta|Correcta|Distractor1|Distractor2".
    const primeraPregunta = isAct && slide.tool === 'elige' ? (cfg.items || [])[0] : null;
    const quiz = primeraPregunta
      ? { fase: 'abierta',
          opciones: primeraPregunta.split('|').slice(1).map((txt) => ({ texto: (txt || '').trim() })),
          correctIdx: 0 }
      : { fase: 'idle' };
    AIP.updateRemoteState(remoteCode, {
      idx,
      total: slides.length,
      tema: pres.tema || '',
      modo: esEquipos ? 'equipos' : 'normal',
      // Permisos/seguridad que remote.jsx lee para mostrar "Soy estudiante"
      // y para pedir el PIN antes de entrar como docente.
      permiteEstudiantes: conEstudiantes,
      mandoHash: (pres.mandoPin && typeof window.hashPin === 'function') ? window.hashPin(pres.mandoPin) : '',
      hideScores,
      podio: verPodio,
      activity: isAct ? { tool: slide.tool, titulo: cfg.titulo || (t && t.nombre) || '' } : null,
      teams: esEquipos ? teams : [],
      mirror,
      quiz,
      // Estado de la ronda de participación para los estudiantes.
      ronda: { fase: ronda, elegido },
    });
  }, [remoteCode, idx, slides.length, hideScores, teams, esEquipos, ronda, elegido, verPodio, conEstudiantes, pres.mandoPin]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const isAct = slide.type === 'actividad';
  const tool = isAct ? AIP.toolById(slide.tool) : null;
  const Runtime = isAct ? (ActivityRuntimes[slide.tool] || ActivityRuntimes.default) : null;

  // API que consumen las actividades de equipo (RetaEquipoRun, PulsadorRun,
  // ApuestaRun, RecuadrosRun). Esperan { equipos, sumar(id,pts), color(id) }
  // con cada equipo en forma { id, nombre, color, puntos }. Nuestro estado
  // `teams` usa { name, color, score }, así que mapeamos usando el índice como id.
  // Solo se entrega en modo equipos; en presentaciones normales es undefined
  // y las actividades muestran su aviso "solo Modo Equipos".
  const equiposApi = React.useMemo(() => {
    if (!esEquipos) return undefined;
    return {
      equipos: teams.map((t, i) => ({ id: i, nombre: t.name || ('Equipo ' + (i + 1)), color: t.color, puntos: t.score || 0 })),
      sumar: (id, pts) => setTeams((prev) => prev.map((t, i) => (i === id ? { ...t, score: Math.max(0, (t.score || 0) + pts) } : t))),
      color: (id) => (teams[id] && teams[id].color) || '#11F555',
    };
  }, [esEquipos, teams]);

  // Estado de los botones ← / → (deshabilitado al inicio / al final).
  const inicioTotal = idx === 0 && paso === 0;
  const finalTotal = idx === slides.length - 1 && paso >= maxPaso(slide) && (!esEquipos || verPodio);

  return (
    <div className="presenter-overlay" data-screen-label={'Presentar · ' + String(idx + 1).padStart(2, '0')}>
      <div className="presenter-stagewrap">
        <div className="slide" key={slide.id} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center', background: isAct ? '#0B0E0B' : '#FFFFFF', color: isAct ? '#F2F5EF' : '#0B0F0C' }}>
          {isAct
            ? <Runtime config={slide.config} tool={tool} remoteSignal={remoteSignal} equiposApi={equiposApi} />
            : <ContenidoSlide slide={slide} materia={pres.materia || 'Tema'} accent={pres.color} pasoActual={paso} replay={replay} />}
        </div>
      </div>

      {/* Marcador de equipos (solo modo equipos) */}
      {esEquipos && <TeamScoreboard teams={teams} hidden={hideScores} />}

      {/* Pantalla del equipo ganador (podio) */}
      {esEquipos && verPodio && <PodioGanador teams={teams} onCerrar={() => setVerPodio(false)} />}

      {/* Tarjeta de conexión del control remoto */}
      {badgeVisible && <RemoteBadge code={remoteCode} onClose={() => setBadgeVisible(false)} count={participants.length} />}

      {/* Panel de participación (sorteo de manos levantadas) */}
      {ronda !== 'idle' && (
        <ParticipationPanel
          fase={ronda} participants={participants} elegido={elegido}
          sorteando={sorteando} onSortear={sortear} onCerrar={cerrarParticipacion} />
      )}

      {/* Panel manual de puntos (¿Quién acertó?) — solo modo equipos */}
      {esEquipos && verPuntos && (
        <PanelPuntos
          teams={teams}
          onPunto={(i, d) => setTeams((prev) => prev.map((t, j) => (j === i ? { ...t, score: Math.max(0, (t.score || 0) + d) } : t)))}
          onCerrar={() => setVerPuntos(false)} />
      )}

      {/* HUD fuera del escenario escalado.
          `hud-top-right` (styles.css) permite que la fila haga wrap alineada a
          la derecha para que "Salir" nunca quede cortado por el borde. */}
      <div className="presenter-hud hud-top-right" style={{ top: 18, right: 18, gap: 8 }}>
        {conEstudiantes && ronda === 'idle' && (
          <button className="hud-btn" onClick={abrirParticipacion} title="Pedir participación">
            ✋ Pedir participación
          </button>
        )}
        {esEquipos && (
          <button className="hud-btn" onClick={() => setVerPuntos((v) => !v)} title="Sumar puntos manualmente">
            🏅 {verPuntos ? 'Cerrar puntos' : 'Dar puntos'}
          </button>
        )}
        {esEquipos && (
          <button className="hud-btn" onClick={() => setHideScores((h) => !h)} title="Ocultar/mostrar puntaje">
            {hideScores ? '👁 Mostrar puntaje' : '🙈 Ocultar puntaje'}
          </button>
        )}
        {esEquipos && (
          <button className="hud-btn" onClick={() => setVerPodio((v) => !v)} title="Mostrar el equipo ganador">
            🏆 {verPodio ? 'Cerrar ganador' : 'Ver ganador'}
          </button>
        )}
        {!badgeVisible && remoteCode && (
          <button className="hud-btn" onClick={() => setBadgeVisible(true)} title="Mostrar código de control">📱 {remoteCode}</button>
        )}
        <button className="hud-btn" onClick={onExit} title="Salir (Esc)">✕ Salir</button>
      </div>
      {/* Píldora informativa (tema · página): fondo oscuro para leerse
          sobre diapositivas blancas. */}
      <div className="presenter-hud hud-info" style={{ bottom: 18, left: 18, fontSize: 14, fontWeight: 600, gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-display)' }}>{pres.tema}</span>
        <span style={{ opacity: .6 }}>·</span>
        <span>{idx + 1} / {slides.length}</span>
      </div>
      <div className="presenter-hud" style={{ bottom: 18, right: 18 }}>
        <button className="hud-btn" onClick={retroceder} disabled={inicioTotal}>←</button>
        <button className="hud-btn" onClick={avanzar} disabled={finalTotal}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { Presenter, TeamScoreboard, RemoteBadge, ParticipationPanel, PodioGanador, Confeti, PanelPuntos });
