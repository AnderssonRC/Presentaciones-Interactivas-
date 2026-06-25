/* student.jsx — Vista del estudiante en su celular.
   Se usa desde remote.jsx cuando el rol elegido es 'estudiante'.

   Flujo:
     1. El estudiante escribe su nombre (y grupo, si aplica) y se une.
     2. Ve un ESPEJO de lo que está en el televisor (slide/actividad).
     3. En actividades normales: botón "✋ Participar" (levantar la mano).
     4. En el Quiz: ve las opciones y responde (el más rápido correcto gana).

   El estado de la sala llega por listenRemoteSession (campo state.mirror
   y state.ronda). Las acciones del estudiante se escriben en su propio
   documento de participante (raiseHand / submitAnswer). */

function StudentView({ code }) {
  const [pid, setPid] = React.useState(null);
  const [nombre, setNombre] = React.useState('');
  const [grupo, setGrupo] = React.useState('');
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState('');
  const [state, setState] = React.useState(null);
  const [yoLevante, setYoLevante] = React.useState(false);
  const [miRespuesta, setMiRespuesta] = React.useState(null);

  // Escuchar el estado de la sala (espejo + ronda).
  React.useEffect(() => {
    if (!pid || !code || !AIP.listenRemoteSession) return;
    const unsub = AIP.listenRemoteSession(code, (data) => {
      if (data === null) { setError('La presentación terminó.'); return; }
      setState(data.state || {});
    });
    return unsub;
  }, [pid, code]);

  // Cuando empieza una ronda nueva (manos reseteadas), limpiar mi estado local.
  const fase = state && state.ronda ? state.ronda.fase : 'idle';
  React.useEffect(() => {
    if (fase === 'idle') { setYoLevante(false); }
    if (fase === 'pedir') { setYoLevante(false); }
  }, [fase]);

  // Cuando cambia la diapositiva, limpiar mi respuesta del quiz anterior.
  const idx = state ? state.idx : null;
  React.useEffect(() => { setMiRespuesta(null); }, [idx]);

  async function unirse() {
    if (!nombre.trim()) { setError('Escribe tu nombre.'); return; }
    setJoining(true); setError('');
    try {
      const id = await AIP.joinSession(code, nombre, grupo);
      setPid(id);
    } catch (e) {
      console.error(e);
      setError('No me pude unir. Revisa el código o tu internet.');
    } finally {
      setJoining(false);
    }
  }

  const levantarMano = async () => {
    setYoLevante(true);
    if (navigator.vibrate) navigator.vibrate(20);
    try { await AIP.raiseHand(code, pid); } catch (e) { console.error(e); setYoLevante(false); }
  };

  const responder = async (i) => {
    if (miRespuesta !== null) return;
    setMiRespuesta(i);
    if (navigator.vibrate) navigator.vibrate(15);
    try { await AIP.submitAnswer(code, pid, i); } catch (e) { console.error(e); }
  };

  // ----- Pantalla: unirse -----
  if (!pid) {
    return (
      <div style={svWrap}>
        <div style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}>
          <div style={{ fontSize: 40, marginBottom: 6 }}>🎓</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, margin: '0 0 4px', color: '#F2F5EF' }}>Únete a la clase</h1>
          <p style={{ color: '#9AA396', margin: '0 0 24px', fontSize: 14 }}>Sala {code}</p>
          <input value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, 24))}
            placeholder="Tu nombre" style={svInput} />
          <input value={grupo} onChange={(e) => setGrupo(e.target.value.slice(0, 24))}
            placeholder="Tu grupo (opcional)" style={svInput} />
          {error && <div style={{ color: '#F53711', fontSize: 14, margin: '4px 0 12px' }}>{error}</div>}
          <button onClick={unirse} disabled={joining || !nombre.trim()}
            style={{ ...svBtn, background: nombre.trim() ? '#11F555' : '#2A2F29', color: nombre.trim() ? '#06140A' : '#9AA396', marginTop: 6 }}>
            {joining ? 'Entrando…' : 'Entrar'}
          </button>
        </div>
      </div>
    );
  }

  const st = state || {};
  const mirror = st.mirror || {};
  const esActividad = mirror.tipo === 'actividad';
  // Quiz activo: el Presenter lo señala en st.quiz con fase 'abierta'/'cerrada'.
  const quiz = st.quiz || { fase: 'idle' };
  const quizActivo = quiz.fase === 'abierta' || quiz.fase === 'cerrada';
  const elegidoSoyYo = fase === 'sorteo' && st.ronda && st.ronda.elegido === pid;

  // ----- Pantalla: dentro de la sala -----
  return (
    <div style={{ ...svWrap, justifyContent: 'flex-start', paddingTop: 20 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <div style={{ color: '#9AA396', fontSize: 12, fontWeight: 600 }}>{nombre}{grupo ? ' · ' + grupo : ''}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#F2F5EF' }}>{st.tema || 'Clase'}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#11F555', background: '#141814', borderRadius: 10, padding: '6px 12px', border: '2px solid #2A2F29' }}>
            {(st.idx != null ? st.idx + 1 : '–')}/{st.total || '–'}
          </div>
        </div>

        {/* Espejo del contenido actual */}
        {esActividad ? (
          <div style={{ background: '#141814', border: '2px solid #2A2F29', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: mirror.color || '#116CF5', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase' }}>{mirror.nombre || 'Actividad'}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#F2F5EF', marginTop: 4 }}>{mirror.titulo}</div>
            {mirror.instrucciones && <div style={{ fontSize: 14, color: '#B9C2B5', marginTop: 8 }}>{mirror.instrucciones}</div>}
            <div style={{ fontSize: 12.5, color: '#7B857A', marginTop: 10 }}>Mira el televisor: la actividad se ve allí.</div>
          </div>
        ) : mirror.slide && typeof ContenidoSlide === 'function' ? (
          // Réplica fiel de la diapositiva (lienzo libre) escalada al ancho del celular.
          <div style={{ marginBottom: 16 }}>
            <EspejoSlide slide={mirror.slide} />
          </div>
        ) : (
          <div style={{ background: '#141814', border: '2px solid #2A2F29', borderRadius: 16, padding: 18, marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#F2F5EF' }}>{mirror.titulo || 'Contenido'}</div>
            {mirror.texto && <div style={{ fontSize: 15, color: '#B9C2B5', marginTop: 8, lineHeight: 1.4 }}>{mirror.texto}</div>}
          </div>
        )}

        {/* Quiz activo: responder con opciones (texto + color) */}
        {quizActivo ? (
          <QuizOptions quiz={quiz} onAnswer={responder} mine={miRespuesta} pid={pid} />
        ) : (
          <>
            {/* ¿Me eligieron para participar? */}
            {elegidoSoyYo && (
              <div style={{ background: '#11F555', borderRadius: 16, padding: 20, marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 30 }}>🙌</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#06140A', marginTop: 4 }}>¡Te toca participar!</div>
              </div>
            )}

            {/* Participación (actividades normales): levantar la mano */}
            {fase === 'pedir' ? (
              <button onClick={levantarMano} disabled={yoLevante}
                style={{ ...svBtn, background: yoLevante ? '#2A2F29' : '#116CF5', color: yoLevante ? '#9AA396' : '#fff', fontSize: 20, padding: '22px 0' }}>
                {yoLevante ? '✋ Mano levantada' : '✋ ¡Yo participo!'}
              </button>
            ) : (
              <div style={{ textAlign: 'center', color: '#7B857A', fontSize: 14, padding: '20px 0' }}>
                {fase === 'sorteo' && !elegidoSoyYo ? 'El docente eligió a otra persona esta vez.' : 'Mira la pantalla. Cuando el docente pida participación o lance una pregunta, aparecerá aquí.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* Opciones del quiz con texto + color (estilo Kahoot con etiqueta). */
function QuizOptions({ quiz, onAnswer, mine, pid }) {
  const OPC = [
    { c: '#F53711', s: '▲' }, { c: '#116CF5', s: '◆' },
    { c: '#F5C211', s: '●' }, { c: '#11F555', s: '■' },
  ];
  const cerrada = quiz.fase === 'cerrada';
  const opciones = quiz.opciones || [];
  const acerte = cerrada && mine != null && mine === quiz.correctIdx;
  const ganeYo = cerrada && quiz.ganador && quiz.ganador === pid;

  if (cerrada) {
    return (
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        {ganeYo ? (
          <div style={{ background: '#11F555', borderRadius: 16, padding: 22 }}>
            <div style={{ fontSize: 34 }}>🏆</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, color: '#06140A' }}>¡Fuiste el más rápido!</div>
          </div>
        ) : acerte ? (
          <div style={{ color: '#11F555', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>✓ ¡Correcto!</div>
        ) : mine != null ? (
          <div style={{ color: '#F53711', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>✗ No era esa</div>
        ) : (
          <div style={{ color: '#9AA396', fontSize: 16 }}>No respondiste a tiempo</div>
        )}
        <div style={{ color: '#9AA396', fontSize: 14, marginTop: 10 }}>Mira la pantalla para la siguiente</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {opciones.map((o, i) => {
        const col = OPC[i % 4];
        return (
          <button key={i} onClick={() => onAnswer(i)} disabled={mine !== null}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '18px 16px',
              borderRadius: 14, border: 'none', cursor: mine === null ? 'pointer' : 'default',
              background: col.c, color: '#fff', textAlign: 'left',
              opacity: mine === null || mine === i ? 1 : 0.4,
              outline: mine === i ? '3px solid #fff' : 'none',
            }}>
            <span style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800 }}>{col.s}</span>
            <span style={{ fontSize: 17, fontWeight: 700, flex: 1 }}>{o.texto}</span>
          </button>
        );
      })}
      {mine !== null && (
        <div style={{ textAlign: 'center', color: '#9AA396', fontSize: 14, marginTop: 4 }}>
          Respuesta enviada · espera el resultado
        </div>
      )}
    </div>
  );
}

const svWrap = {
  position: 'fixed', inset: 0, background: '#0B0E0B',
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: 18, boxSizing: 'border-box', overflowY: 'auto',
};
const svInput = {
  width: '100%', fontSize: 18, padding: '14px 16px', marginBottom: 12,
  borderRadius: 12, border: '2px solid #2A2F29', background: '#141814',
  color: '#F2F5EF', boxSizing: 'border-box', fontFamily: 'inherit',
};
const svBtn = {
  width: '100%', padding: '16px 0', fontSize: 18, fontWeight: 800,
  fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none', cursor: 'pointer',
};

/* Réplica fiel de una diapositiva de contenido, escalada al ancho del
   contenedor (mantiene la relación 1920×1080 de la TV). Solo lectura. */
function EspejoSlide({ slide }) {
  const boxRef = React.useRef(null);
  const [scale, setScale] = React.useState(0.18);
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / 1920);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={boxRef} style={{
      width: '100%', height: 1080 * scale, position: 'relative',
      borderRadius: 14, overflow: 'hidden', border: '2px solid #2A2F29', background: '#fff',
    }}>
      <div className="slide" style={{
        position: 'absolute', top: 0, left: 0, width: 1920, height: 1080,
        transform: 'scale(' + scale + ')', transformOrigin: 'top left',
        background: '#fff', color: '#0B0F0C',
      }}>
        <ContenidoSlide slide={slide} />
      </div>
    </div>
  );
}

Object.assign(window, { StudentView, QuizOptions, EspejoSlide });
