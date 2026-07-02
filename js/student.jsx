/* student.jsx — Vista del estudiante en su celular.
   Se usa desde remote.jsx cuando el rol elegido es 'estudiante'.

   Flujo:
     1. El estudiante escribe su nombre (y grupo, si aplica) y se une.
     2. Ve un ESPEJO de lo que está en el televisor (slide/actividad).
     3. En actividades normales: botón "✋ Participar" (levantar la mano).
     4. En el Quiz: ve las opciones y responde (el más rápido correcto gana).

   El estado de la sala llega por listenRemoteSession (campo state.mirror
   y state.ronda). Las acciones del estudiante se escriben en su propio
   documento de participante (raiseHand / submitAnswer).

   CAMBIOS:
     - El espejo de una ACTIVIDAD ahora monta la MISMA actividad que el TV
       (ActivityRuntimes[tool]) en modo solo-lectura, escalada al celular.
       El estudiante ve la actividad completa con todas sus opciones; sigue
       resolviéndose en el televisor (los arrastres del TV no se reflejan).
     - Si la actividad no trae config, cae al espejo del slide o a la tarjeta.
     - La pantalla de unirse (nombre/grupo) se ajusta al celular. */

function StudentView({ code }) {
  const [pid, setPid] = React.useState(null);
  const [nombre, setNombre] = React.useState('');
  const [grupo, setGrupo] = React.useState('');
  const [joining, setJoining] = React.useState(false);
  const [error, setError] = React.useState('');
  const [state, setState] = React.useState(null);
  const [yoLevante, setYoLevante] = React.useState(false);
  const [miRespuesta, setMiRespuesta] = React.useState(null);

  // Alto real del celular (px). innerHeight sí descuenta la barra del navegador,
  // a diferencia de 100vh. Sirve para que la pantalla de unirse llene la
  // pantalla sin quedar tapada cuando aparece el teclado.
  const [vh, setVh] = React.useState(
    (typeof window !== 'undefined' && window.innerHeight) ? window.innerHeight + 'px' : '100vh'
  );
  React.useEffect(() => {
    const upd = () => setVh((window.innerHeight || 0) + 'px');
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);

  // Escuchar el estado de la sala (espejo + ronda).
  React.useEffect(() => {
    if (!pid || !code || !AIP.listenRemoteSession) return;
    const unsub = AIP.listenRemoteSession(code, (data) => {
      if (data === null) {
        // Sin esto, el mensaje de error nunca se ve: solo se pinta en la
        // pantalla de unirse (!pid), pero el estudiante ya estaba dentro.
        setError('La presentación terminó.');
        setState(null);
        setPid(null);
        return;
      }
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

  // ----- Pantalla: unirse (ajustada al celular) -----
  if (!pid) {
    return (
      <div style={{ ...svJoinWrap, minHeight: vh }}>
        <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>🎓</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 1.1, margin: '0 0 6px', color: '#F2F5EF' }}>Únete a la clase</h1>
          <p style={{ color: '#9AA396', margin: '0 0 28px', fontSize: 16 }}>Sala {code}</p>
          <input value={nombre} onChange={(e) => setNombre(e.target.value.slice(0, 24))}
            onKeyDown={(e) => { if (e.key === 'Enter' && nombre.trim()) unirse(); }}
            placeholder="Tu nombre" style={svInputBig} />
          <input value={grupo} onChange={(e) => setGrupo(e.target.value.slice(0, 24))}
            onKeyDown={(e) => { if (e.key === 'Enter' && nombre.trim()) unirse(); }}
            placeholder="Tu grupo (opcional)" style={svInputBig} />
          {error && <div style={{ color: '#F53711', fontSize: 15, margin: '6px 0 14px' }}>{error}</div>}
          <button onClick={unirse} disabled={joining || !nombre.trim()}
            style={{ ...svBtnBig, background: nombre.trim() ? '#11F555' : '#2A2F29', color: nombre.trim() ? '#06140A' : '#9AA396', marginTop: 8 }}>
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

  // ¿La actividad trae config y existe su Runtime para montarla en el celular?
  const runtimes = (typeof ActivityRuntimes !== 'undefined') ? ActivityRuntimes : null;
  const ActRuntime = (esActividad && runtimes)
    ? (runtimes[mirror.tool] || runtimes.default)
    : null;
  const actividadMontable = !!(esActividad && mirror.config && ActRuntime);
  // Metadatos de la herramienta (color/nombre) si el presenter los expone.
  const toolMeta = (esActividad && typeof AIP !== 'undefined' && AIP.toolById)
    ? AIP.toolById(mirror.tool) : null;

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
        {actividadMontable ? (
          // La MISMA actividad del TV, montada en el celular en solo-lectura.
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: mirror.color || '#116CF5', fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
              {mirror.nombre || 'Actividad'}
            </div>
            <EspejoActividad Runtime={ActRuntime} config={mirror.config} tool={toolMeta} />
          </div>
        ) : esActividad ? (
          // Actividad sin config reflejable: tarjeta con título e instrucciones.
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
/* Pantalla de unirse: ocupa todo el alto del celular y centra el formulario.
   Usa min-height con la unidad dinámica del móvil (dvh) en lugar de
   `position: fixed`, para que al aparecer el teclado el formulario no quede
   tapado y se pueda desplazar con normalidad. Respaldo a vh por compatibilidad. */
const svJoinWrap = {
  minHeight: '100vh', background: '#0B0E0B',
  display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '24px 20px', boxSizing: 'border-box',
};
const svInput = {
  width: '100%', fontSize: 18, padding: '14px 16px', marginBottom: 12,
  borderRadius: 12, border: '2px solid #2A2F29', background: '#141814',
  color: '#F2F5EF', boxSizing: 'border-box', fontFamily: 'inherit',
};
/* Inputs y botón más grandes para la pantalla de unirse en celular. */
const svInputBig = {
  width: '100%', fontSize: 20, padding: '18px 18px', marginBottom: 14,
  borderRadius: 14, border: '2px solid #2A2F29', background: '#141814',
  color: '#F2F5EF', boxSizing: 'border-box', fontFamily: 'inherit',
};
const svBtn = {
  width: '100%', padding: '16px 0', fontSize: 18, fontWeight: 800,
  fontFamily: 'var(--font-display)', borderRadius: 14, border: 'none', cursor: 'pointer',
};
const svBtnBig = {
  width: '100%', padding: '20px 0', fontSize: 20, fontWeight: 800,
  fontFamily: 'var(--font-display)', borderRadius: 16, border: 'none', cursor: 'pointer',
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

/* Espejo de una ACTIVIDAD: monta el mismo Runtime que el TV, en modo
   solo-lectura (la actividad se resuelve en el TV). Mantiene el lienzo
   1920×1080 del televisor.

   - En su sitio: se muestra COMPLETO escalado al ancho (nunca se corta).
   - Al TOCARLO: se abre a pantalla completa GIRADO 90°, de modo que la
     actividad (horizontal) aprovecha todo el ALTO del celular vertical y se
     ve grande y legible. Se cierra tocando de nuevo o con el botón ✕. */
function EspejoActividad({ Runtime, config, tool }) {
  const boxRef = React.useRef(null);
  const [scale, setScale] = React.useState(0.18);
  const [full, setFull] = React.useState(false);

  // Escala "en su sitio": llena el ancho, siempre completo (sin recortes).
  React.useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale((el.clientWidth || 1) / 1920);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Al abrir pantalla completa, bloquea el scroll del fondo.
  React.useEffect(() => {
    if (!full) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [full]);

  if (typeof Runtime !== 'function') return null;
  const contenido = <Runtime config={config} tool={tool} remoteSignal={{ action: null, nonce: null }} />;

  return (
    <React.Fragment>
      {/* Vista en su sitio: completa, tocable para ampliar. */}
      <div ref={boxRef} onClick={() => setFull(true)}
        style={{
          width: '100%', height: 1080 * scale, position: 'relative', cursor: 'pointer',
          borderRadius: 14, overflow: 'hidden', border: '2px solid #2A2F29', background: '#0B0E0B',
        }}>
        {/* Capa que bloquea toques sobre la actividad (solo lectura) pero deja
            que el toque del contenedor abra la pantalla completa. */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 5 }} />
        <div className="slide" style={{
          position: 'absolute', top: 0, left: 0, width: 1920, height: 1080,
          transform: 'scale(' + scale + ')', transformOrigin: 'top left',
          background: '#0B0E0B', color: '#F2F5EF', pointerEvents: 'none',
        }}>
          {contenido}
        </div>
        {/* Pista visual de que se puede ampliar. */}
        <div style={{
          position: 'absolute', right: 8, bottom: 8, zIndex: 6,
          background: 'rgba(0,0,0,.55)', color: '#F2F5EF', fontSize: 12, fontWeight: 700,
          padding: '4px 10px', borderRadius: 999, pointerEvents: 'none',
        }}>⤢ Toca para ampliar</div>
      </div>

      {/* Pantalla completa GIRADA 90°. */}
      {full && <EspejoFullscreen onClose={() => setFull(false)}>{contenido}</EspejoFullscreen>}
    </React.Fragment>
  );
}

/* Capa de pantalla completa que rota el lienzo 1920×1080 noventa grados y lo
   escala para llenar el celular vertical: el ancho del lienzo (1920) ocupa el
   ALTO de la pantalla, y el alto del lienzo (1080) ocupa el ANCHO. Así la
   actividad horizontal se ve grande y completa, leída de lado. */
function EspejoFullscreen({ children, onClose }) {
  const [dims, setDims] = React.useState({ w: 0, h: 0 });
  React.useEffect(() => {
    const upd = () => setDims({ w: window.innerWidth || 0, h: window.innerHeight || 0 });
    upd();
    window.addEventListener('resize', upd);
    return () => window.removeEventListener('resize', upd);
  }, []);
  // Al rotar 90°, el lienzo (1920 ancho × 1080 alto) encaja contra la pantalla
  // (h alto × w ancho): el 1920 se compara con la altura, el 1080 con el ancho.
  const escala = Math.min((dims.h || 1) / 1920, (dims.w || 1) / 1080);
  return (
    <div onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: '#0B0E0B',
        display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
      }}>
      <div style={{
        width: 1920, height: 1080, position: 'relative',
        transform: 'rotate(90deg) scale(' + escala + ')', transformOrigin: 'center center',
        background: '#0B0E0B', color: '#F2F5EF', pointerEvents: 'none', flexShrink: 0,
      }}>
        <div className="slide" style={{ width: 1920, height: 1080, background: '#0B0E0B', color: '#F2F5EF' }}>
          {children}
        </div>
      </div>
      {/* Botón de cerrar (no rotado, siempre arriba a la derecha). */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: 'fixed', top: 14, right: 14, zIndex: 10000,
          width: 46, height: 46, borderRadius: 999, border: 'none', cursor: 'pointer',
          background: 'rgba(0,0,0,.6)', color: '#F2F5EF', fontSize: 22, fontWeight: 800,
        }}>✕</button>
      {/* Aviso de cómo cerrar. */}
      <div style={{
        position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 10000,
        background: 'rgba(0,0,0,.6)', color: '#B9C2B5', fontSize: 13, fontWeight: 600,
        padding: '6px 14px', borderRadius: 999, whiteSpace: 'nowrap',
      }}>Toca para cerrar</div>
    </div>
  );
}

Object.assign(window, { StudentView, QuizOptions, EspejoSlide, EspejoActividad, EspejoFullscreen });