/* remote.jsx — El celular como control remoto de la presentación.
   Se renderiza cuando la URL trae ?remote=CÓDIGO (ver app.jsx).

   Flujo:
     1. Si la URL ya trae el código, intenta entrar directo.
     2. Si no, pide el código de 4 dígitos que aparece en el televisor.
     3. Una vez dentro, escucha el estado espejo y envía comandos.

   No requiere que el celular tenga sesión iniciada: solo necesita el código.
   (Las reglas de Firestore permiten leer/escribir la sesión por su código). */

/* Mismo hash del PIN que usa el presenter (definido con guardia para no
   duplicarlo si ambos archivos se cargan). Permite validar el PIN del mando
   sin que el PIN viaje en claro por el estado espejo. */
if (!window.hashPin) {
  window.hashPin = function hashPin(pin) {
    const s = String(pin || '');
    if (!s) return '';
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return 'p' + h.toString(36);
  };
}

function RemoteControl({ initialCode }) {
  const [code, setCode] = React.useState(initialCode || '');
  const [input, setInput] = React.useState('');
  const [connected, setConnected] = React.useState(false);
  const [rol, setRol] = React.useState(null); // null | 'docente' | 'estudiante'
  const [state, setState] = React.useState(null);
  const [error, setError] = React.useState('');
  const [connecting, setConnecting] = React.useState(false);
  const [flash, setFlash] = React.useState('');
  const [pinInput, setPinInput] = React.useState(''); // PIN que escribe quien dice ser docente
  const [pinError, setPinError] = React.useState('');

  // Intento de conexión automático si vino el código en la URL.
  React.useEffect(() => {
    if (initialCode) tryConnect(initialCode);
    // eslint-disable-next-line
  }, []);

  // Escuchar el estado espejo una vez conectados.
  React.useEffect(() => {
    if (!connected || !code || !AIP.listenRemoteSession) return;
    const unsub = AIP.listenRemoteSession(code, (data) => {
      if (data === null) {
        // La sesión se cerró (el docente salió de Presentar).
        setConnected(false);
        setError('La presentación terminó o el código ya no es válido.');
        return;
      }
      setState(data.state || {});
    });
    return unsub;
  }, [connected, code]);

  async function tryConnect(c) {
    const clean = String(c || '').trim();
    if (!/^\d{4}$/.test(clean)) { setError('El código son 4 dígitos.'); return; }
    setConnecting(true); setError('');
    try {
      const sess = await AIP.getRemoteSession(clean);
      if (!sess) { setError('No encontré esa presentación. Revisa el código.'); setConnecting(false); return; }
      setCode(clean);
      setConnected(true);
    } catch (e) {
      console.error(e);
      setError('No me pude conectar. ¿Tienes internet?');
    } finally {
      setConnecting(false);
    }
  }

  const send = (type, payload) => {
    if (!code) return;
    AIP.sendRemoteCommand(code, type, payload).catch((e) => console.error('[remote] envío:', e));
  };
  const buzz = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 700); if (navigator.vibrate) navigator.vibrate(15); };

  // Datos de seguridad/permicos que publica el presenter en el estado espejo.
  const permiteEstudiantes = state ? state.permiteEstudiantes === true : false;
  const mandoHash = state ? (state.mandoHash || '') : '';

  // Intentar entrar como docente: si hay PIN configurado, validarlo.
  const entrarComoDocente = () => {
    if (mandoHash) {
      if (window.hashPin(pinInput) !== mandoHash) {
        setPinError('PIN incorrecto.');
        if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
        return;
      }
    }
    setPinError(''); setPinInput('');
    setRol('docente');
  };

  // ----- Una vez conectado, si aún no se eligió rol: selector -----
  if (connected && !rol) {
    // Esperar el primer estado espejo para conocer permisos y PIN antes de
    // ofrecer los roles (evita mostrar el acceso docente sin pedir PIN).
    if (state === null) {
      return (
        <div style={rcWrap}>
          <div style={{ textAlign: 'center', color: '#9AA396' }}>
            <div style={{ fontSize: 34, marginBottom: 10 }}>📡</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Conectando con la sala…</div>
          </div>
        </div>
      );
    }
    return (
      <div style={rcWrap}>
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>👋</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 6px', color: '#F2F5EF' }}>Sala {code}</h1>
          <p style={{ color: '#9AA396', margin: '0 0 28px', fontSize: 15 }}>¿Cómo vas a entrar?</p>

          {permiteEstudiantes && (
            <button onClick={() => setRol('estudiante')}
              style={{ width: '100%', padding: '20px 0', marginBottom: 14, fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none', background: '#11F555', color: '#06140A', cursor: 'pointer' }}>
              🎓 Soy estudiante
            </button>
          )}

          {/* Acceso docente: si hay PIN, se pide antes de entrar al mando. */}
          {mandoHash ? (
            <div style={{ textAlign: 'left' }}>
              <div style={{ color: '#9AA396', fontSize: 13, fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
                🔒 Acceso del docente
              </div>
              <input
                value={pinInput} type="password" inputMode="numeric"
                onChange={(e) => { setPinInput(e.target.value.replace(/\D/g, '').slice(0, 6)); setPinError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') entrarComoDocente(); }}
                placeholder="PIN del mando"
                style={{ width: '100%', textAlign: 'center', fontSize: 30, letterSpacing: '.3em', fontFamily: 'var(--font-display)', fontWeight: 800, padding: '14px 0', borderRadius: 14, border: '2px solid #2A2F29', background: '#141814', color: '#F2F5EF', boxSizing: 'border-box', marginBottom: 10 }} />
              {pinError && <div style={{ color: '#F53711', fontSize: 14, marginBottom: 10, textAlign: 'center' }}>{pinError}</div>}
              <button onClick={entrarComoDocente} disabled={!pinInput}
                style={{ width: '100%', padding: '18px 0', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none', background: pinInput ? '#116CF5' : '#2A2F29', color: pinInput ? '#fff' : '#9AA396', cursor: pinInput ? 'pointer' : 'default' }}>
                🧑‍🏫 Entrar como docente
              </button>
            </div>
          ) : (
            <button onClick={() => setRol('docente')}
              style={{ width: '100%', padding: '20px 0', fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', borderRadius: 14, border: '2px solid #2A2F29', background: 'transparent', color: '#F2F5EF', cursor: 'pointer' }}>
              🧑‍🏫 Soy el docente (mando)
            </button>
          )}

          {!permiteEstudiantes && (
            <p style={{ color: '#7B857A', fontSize: 12.5, marginTop: 18 }}>
              La participación de estudiantes está desactivada en esta presentación.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ----- Modo estudiante: vista propia -----
  if (connected && rol === 'estudiante') {
    return <StudentView code={code} />;
  }

  // ----- Pantalla de conexión -----
  if (!connected) {
    return (
      <div style={rcWrap}>
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 46, marginBottom: 8 }}>📱</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, margin: '0 0 6px', color: '#F2F5EF' }}>Entrar a la sala</h1>
          <p style={{ color: '#9AA396', margin: '0 0 28px', fontSize: 15 }}>Escribe el código que aparece en el televisor.</p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric" pattern="\d*" placeholder="0000"
            style={{
              width: '100%', textAlign: 'center', fontSize: 48, letterSpacing: '.3em',
              fontFamily: 'var(--font-display)', fontWeight: 800, padding: '16px 0',
              borderRadius: 16, border: '2px solid #2A2F29', background: '#141814',
              color: '#F2F5EF', boxSizing: 'border-box', marginBottom: 16,
            }}
          />
          {error && <div style={{ color: '#F53711', fontSize: 14, marginBottom: 14 }}>{error}</div>}
          <button
            onClick={() => tryConnect(input)} disabled={connecting || input.length !== 4}
            style={{
              width: '100%', padding: '16px 0', fontSize: 18, fontWeight: 800,
              fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none',
              background: input.length === 4 ? '#11F555' : '#2A2F29',
              color: input.length === 4 ? '#06140A' : '#9AA396',
              cursor: input.length === 4 ? 'pointer' : 'default',
            }}>
            {connecting ? 'Conectando…' : 'Conectar'}
          </button>
        </div>
      </div>
    );
  }

  // ----- Panel de control (conectado) -----
  const st = state || {};
  const teams = st.teams || [];
  const esEquipos = st.modo === 'equipos';
  const enActividad = !!st.activity;

  return (
    <div style={{ ...rcWrap, justifyContent: 'flex-start', paddingTop: 18 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Cabecera con estado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#9AA396', fontSize: 12, fontWeight: 600, letterSpacing: '.06em' }}>CONECTADO · {code}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: '#F2F5EF' }}>
              {st.tema || 'Presentación'}
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#11F555',
            background: '#141814', borderRadius: 10, padding: '6px 12px', border: '2px solid #2A2F29',
          }}>{(st.idx != null ? st.idx + 1 : '–')}/{st.total || '–'}</div>
        </div>

        {/* Indicador de actividad / diapositiva actual */}
        <div style={{
          background: enActividad ? 'rgba(17,108,245,.12)' : '#141814',
          border: '2px solid ' + (enActividad ? '#116CF5' : '#2A2F29'),
          borderRadius: 14, padding: 14, marginBottom: 16, color: '#F2F5EF',
        }}>
          <div style={{ fontSize: 12, color: '#9AA396', fontWeight: 600 }}>
            {enActividad ? 'ACTIVIDAD EN PANTALLA' : 'DIAPOSITIVA'}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17 }}>
            {enActividad ? (st.activity.titulo || 'Actividad') : 'Contenido'}
          </div>
        </div>

        {/* Navegación */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button onClick={() => { send('prev'); buzz('◀'); }} style={navBtn('#2A2F29', '#F2F5EF')}>◀ Atrás</button>
          <button onClick={() => { send('next'); buzz('▶'); }} style={navBtn('#11F555', '#06140A')}>Avanzar ▶</button>
        </div>

        {/* Controles de la actividad activa */}
        {enActividad && (
          <div style={{ marginBottom: 16 }}>
            <div style={rcLabel}>Actividad</div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { send('activity', { action: 'primary' }); buzz('●'); }}
                style={navBtn('#116CF5', '#fff')}>Acción principal</button>
              <button onClick={() => { send('activity', { action: 'next' }); buzz('→'); }}
                style={navBtn('#2A2F29', '#F2F5EF')}>Siguiente paso</button>
            </div>
            <div style={{ color: '#9AA396', fontSize: 12, marginTop: 8 }}>
              Ej.: girar la ruleta, revelar respuesta, lanzar el dado.
            </div>
          </div>
        )}

        {/* Puntaje por equipos */}
        {esEquipos && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={rcLabel}>Puntaje</div>
              <button onClick={() => { send('toggleScores'); buzz(st.hideScores ? '👁' : '🙈'); }}
                style={{
                  background: 'transparent', border: '1px solid #2A2F29', color: '#9AA396',
                  borderRadius: 10, padding: '6px 12px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                {st.hideScores ? '👁 Mostrar en TV' : '🙈 Ocultar en TV'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
              {teams.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: '#141814', borderRadius: 14, padding: '10px 12px',
                  border: '2px solid ' + (t.color || '#2A2F29'),
                }}>
                  <div style={{ width: 12, height: 36, borderRadius: 4, background: t.color || '#11F555', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0, color: '#F2F5EF', fontWeight: 700, fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {t.name || ('Equipo ' + (i + 1))}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: t.color || '#11F555', minWidth: 36, textAlign: 'center' }}>
                    {t.score || 0}
                  </div>
                  <button onClick={() => { send('score', { team: i, delta: -1 }); buzz('−'); }}
                    style={ptBtn('#1C201B', '#9AA396')}>−</button>
                  <button onClick={() => { send('score', { team: i, delta: 1 }); buzz('+'); }}
                    style={ptBtn(t.color || '#11F555', '#06140A')}>+</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Salir */}
        <button onClick={() => { if (window.confirm('¿Terminar la presentación en el televisor?')) send('exit'); }}
          style={{
            width: '100%', padding: '12px 0', marginTop: 8, fontSize: 15, fontWeight: 700,
            fontFamily: 'var(--font-display)', borderRadius: 12, border: '1px solid #2A2F29',
            background: 'transparent', color: '#9AA396', cursor: 'pointer',
          }}>
          ✕ Terminar presentación
        </button>
      </div>

      {/* Confirmación visual del último comando */}
      {flash && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(17,245,85,.92)', color: '#06140A', fontWeight: 800,
          fontFamily: 'var(--font-display)', fontSize: 28, borderRadius: 16,
          width: 64, height: 64, display: 'grid', placeItems: 'center', zIndex: 50,
        }}>{flash}</div>
      )}
    </div>
  );
}

const rcWrap = {
  position: 'fixed', inset: 0, background: '#0B0E0B',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  justifyContent: 'center', padding: 18, boxSizing: 'border-box',
  overflowY: 'auto',
};
const rcLabel = { color: '#9AA396', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', marginBottom: 4 };
const navBtn = (bg, fg) => ({
  flex: 1, padding: '18px 0', fontSize: 17, fontWeight: 800,
  fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none',
  background: bg, color: fg, cursor: 'pointer',
});
const ptBtn = (bg, fg) => ({
  width: 44, height: 44, fontSize: 26, fontWeight: 800, flexShrink: 0,
  borderRadius: 10, border: 'none', background: bg, color: fg, cursor: 'pointer',
});

Object.assign(window, { RemoteControl });