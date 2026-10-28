/* mando-celular.jsx — Mando a distancia del Modo Vigía (lado del CELULAR).
   Lo carga remote.jsx (solo en el celular) cuando la sesión es del Modo
   Vigía. Muestra lo que pasa en el televisor (estado espejo) y envía las
   órdenes con send('vigia', { accion, ... }). Trae sus propios estilos (no
   carga los del Modo Vigía, para que el celular abra rápido). */

const MANDO_CSS = `
.vgm { min-height: 100vh; min-height: 100dvh; box-sizing: border-box; padding: 14px 14px 24px; display: flex; flex-direction: column; gap: 12px;
  background: radial-gradient(500px 260px at 0% 0%, rgba(255,138,0,.16), transparent 70%), radial-gradient(500px 300px at 100% 100%, rgba(0,212,255,.12), transparent 70%), #07060A;
  color: #FFF3E6; font-family: 'Sora', system-ui, sans-serif; -webkit-tap-highlight-color: transparent; user-select: none; }
.vgm * { box-sizing: border-box; }
.vgm-cabeza { display: flex; align-items: center; gap: 10px; }
.vgm-cabeza img { width: 40px; height: 40px; border-radius: 10px; }
.vgm-cabeza strong { display: block; font-size: 16px; line-height: 1.15; }
.vgm-cabeza small { color: #B39A86; font-size: 12px; }
.vgm-estado { margin-left: auto; font-size: 11px; font-weight: 800; padding: 4px 9px; border-radius: 999px; background: rgba(61,220,151,.15); color: #3DDC97; white-space: nowrap; }
.vgm-panel { border-radius: 18px; padding: 14px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,138,0,.25); display: flex; flex-direction: column; gap: 12px; }
.vgm-panel.tarjeta { border-color: var(--c, #FF8A00); box-shadow: 0 0 24px -8px var(--c, #FF8A00); }
.vgm-kicker { font-size: 11px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: #B39A86; }
.vgm-fila { display: flex; gap: 10px; align-items: stretch; }
.vgm-fila > * { flex: 1; }
.vgm-btn { border: 0; border-radius: 16px; padding: 16px 10px; font: inherit; font-weight: 800; font-size: 16px; cursor: pointer;
  background: rgba(255,255,255,.08); color: #FFF3E6; display: flex; align-items: center; justify-content: center; gap: 6px; min-height: 58px; }
.vgm-btn:active { transform: scale(.96); background: rgba(255,255,255,.16); }
.vgm-btn.grande { min-height: 86px; font-size: 22px; background: linear-gradient(135deg, #FF8A00, #FF5A1F); color: #140800; box-shadow: 0 10px 26px -10px rgba(255,138,0,.9); }
.vgm-btn.azul { background: linear-gradient(135deg, #00D4FF, #4D94FF); color: #04121A; }
.vgm-btn.borde { background: transparent; border: 1.5px solid rgba(255,255,255,.2); }
.vgm-btn:disabled { opacity: .35; }
.vgm-progreso { height: 8px; border-radius: 999px; background: rgba(255,255,255,.12); overflow: hidden; }
.vgm-progreso span { display: block; height: 100%; background: linear-gradient(90deg, #FF8A00, #00D4FF); }
.vgm-tiempos { display: flex; justify-content: space-between; font-size: 13px; color: #B39A86; font-variant-numeric: tabular-nums; }
.vgm-lista { display: flex; flex-direction: column; gap: 8px; }
.vgm-item { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; border: 1px solid rgba(255,255,255,.1); border-radius: 14px;
  padding: 11px 12px; background: rgba(255,255,255,.03); color: inherit; font: inherit; cursor: pointer; }
.vgm-item:active { background: rgba(255,255,255,.1); }
.vgm-item.on { border-color: #FF8A00; background: rgba(255,138,0,.12); }
.vgm-item.visto { opacity: .55; }
.vgm-punto { width: 14px; height: 14px; border-radius: 50%; flex-shrink: 0; box-shadow: 0 0 10px currentColor; }
.vgm-item b { display: block; font-size: 13.5px; }
.vgm-item small { display: block; font-size: 12px; color: #B39A86; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.vgm-item .vgm-et { margin-left: auto; font-size: 12px; color: #B39A86; white-space: nowrap; font-variant-numeric: tabular-nums; }
.vgm-pie { display: flex; gap: 10px; margin-top: auto; }
.vgm-pie .vgm-btn { min-height: 50px; font-size: 14px; }
.vgm-centro { text-align: center; font-weight: 800; font-size: 18px; display: flex; flex-direction: column; justify-content: center; }
.vgm-centro small { font-size: 12px; color: #B39A86; font-weight: 600; }
.vgm-jaguar { border-color: rgba(57,255,20,.45); box-shadow: 0 0 24px -10px rgba(57,255,20,.8); }
.vgm-equipo { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: 14px; border: 1.5px solid var(--c); }
.vgm-equipo-nombre { flex: 1; min-width: 0; font-weight: 800; font-size: 14px; color: var(--c); }
.vgm-equipo .vgm-btn { min-height: 44px; min-width: 52px; padding: 8px; flex: 0 0 auto; }
.vgm-equipo .vgm-btn:not(.borde) { background: var(--c); color: #031006; }
.vgm-equipo b { min-width: 34px; text-align: center; font-size: 20px; }
.vgm-rojo { background: #FF1E3C !important; color: #fff !important; border-color: #FF1E3C !important; }
.vgm-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.vgm-chip { flex: 1 1 40%; min-height: 48px; padding: 8px 10px; border-radius: 14px; border: 1.5px solid var(--c); background: transparent;
  color: var(--c); font: inherit; font-weight: 800; font-size: 14px; cursor: pointer; }
.vgm-chip.on { background: var(--c); color: #031006; }
.vgm-chip:active { transform: scale(.96); }
/* Muro Infernal: las 9 partes del personaje con ↺ / ↻ */
.vgm-segmentos { display: flex; flex-direction: column; gap: 6px; --c: #9CD38A; }
.vgm-segmentos .vgm-equipo.on { background: rgba(156,211,138,.18); }
.vgm-mascara { text-align: center; font-weight: 900; font-size: 26px; letter-spacing: .28em; word-break: break-all; color: #39FF14; }
.vgm-campo { width: 100%; min-height: 52px; padding: 10px 14px; border-radius: 14px; border: 1.5px solid rgba(57,255,20,.5); background: rgba(0,0,0,.3); color: inherit; font: inherit; font-size: 17px; user-select: text; -webkit-user-select: text; }
.vgm-teclado { display: flex; flex-direction: column; gap: 6px; }
.vgm-teclado-fila { display: flex; gap: 4px; justify-content: center; }
.vgm-teclado-fila button { flex: 1 1 0; max-width: 40px; min-height: 46px; border: 0; border-radius: 9px; background: rgba(255,255,255,.1); color: #FFF3E6; font: inherit; font-weight: 800; font-size: 17px; padding: 0; }
.vgm-teclado-fila button:active { transform: scale(.92); background: rgba(57,255,20,.3); }
.vgm-teclado-fila button.bien { background: #39FF14; color: #031006; }
.vgm-teclado-fila button.mal { background: rgba(255,30,60,.35); color: #FFC2CB; }
.vgm-teclado-fila button:disabled { opacity: .75; }
.vgm-texto-rojo { color: #FF5A6E; }
`;

function fmtMando(s) {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
}

/* Adivina la palabra (Modo Jaguar) en el celular: la palabra secreta para el
   docente, el turno, las vidas y un teclado para marcar la letra que dicen. */
function PalabraMando({ p, eq, orden }) {
  const [escrita, setEscrita] = React.useState('');
  const [verSecreta, setVerSecreta] = React.useState(false);
  const eTurno = p.turno !== null && p.turno !== undefined ? eq[p.turno] : null;
  const usadas = p.usadas || [];
  const aciertos = p.aciertos || [];
  const enviar = () => { if (escrita.trim()) { orden('ah-palabra', { texto: escrita.trim() }); setEscrita(''); } };
  return (
    <React.Fragment>
      <div className="vgm-kicker">Adivina la palabra · vidas {p.vidas} de {p.max}{p.total ? ' · palabras ' + p.quedan + ' de ' + p.total : ''}</div>
      {!p.hay && (
        <React.Fragment>
          {p.total > 0 && <button className="vgm-btn borde" onClick={() => orden('ah-reiniciar')}>Ya salieron todas · Usarlas de nuevo</button>}
          <input className="vgm-campo" type="text" value={escrita} maxLength={40} placeholder="Escribe la palabra secreta"
            onChange={(e) => setEscrita(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') enviar(); }} />
          <button className="vgm-btn grande" onClick={enviar} disabled={!escrita.trim()}>▶ Jugar con esta palabra</button>
        </React.Fragment>
      )}
      {p.hay && (
        <React.Fragment>
          <div className="vgm-mascara">{p.mascara}</div>
          <button className="vgm-btn borde" onClick={() => setVerSecreta((v) => !v)}>
            {verSecreta ? 'Secreta: ' + p.secreta + (p.pista ? ' · ' + p.pista : '') : '👁 Ver la palabra (solo tú)'}
          </button>
        </React.Fragment>
      )}
      {p.hay && p.fase === 'turno' && (
        <button className="vgm-btn grande" disabled={p.girando} onClick={() => orden('ah-inicio')}>{p.girando ? 'Eligiendo…' : '🎲 ¿Qué equipo empieza?'}</button>
      )}
      {p.fase === 'juego' && (
        <React.Fragment>
          {eTurno && <div className="vgm-centro" style={{ color: eTurno.color }}>Turno del {eTurno.nombre}<small>Toca la letra que dicen</small></div>}
          <div className="vgm-teclado">
            {['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'].map((fila, f) => (
              <div key={f} className="vgm-teclado-fila">
                {fila.split('').map((t) => (
                  <button key={t} disabled={usadas.includes(t)} onClick={() => orden('ah-letra', { l: t })}
                    className={usadas.includes(t) ? (aciertos.includes(t) ? 'bien' : 'mal') : ''}>{t}</button>
                ))}
              </div>
            ))}
          </div>
          <div className="vgm-fila">
            <button className="vgm-btn grande" onClick={() => orden('ah-adivino')}>¡La adivinó!</button>
            <button className="vgm-btn borde" onClick={() => orden('ah-fallo')}>Falló la palabra<br />−1 vida</button>
          </div>
          <div className="vgm-fila">
            <button className="vgm-btn borde" onClick={() => orden('ah-turno')}>Pasar turno</button>
            <button className="vgm-btn borde" onClick={() => orden('ah-revelar')}>Revelar</button>
          </div>
        </React.Fragment>
      )}
      {p.fase === 'fin' && (
        <React.Fragment>
          <div className={'vgm-centro' + (p.resultado === 'jaguar' ? ' vgm-texto-rojo' : '')}>
            {p.resultado === 'gano' ? '¡Palabra descubierta!' : p.resultado === 'jaguar' ? '¡Ganó el jaguar! (sin puntos)' : 'Palabra revelada'}
          </div>
          <button className="vgm-btn grande" onClick={() => orden('ah-otra')}>↻ Otra palabra</button>
        </React.Fragment>
      )}
    </React.Fragment>
  );
}

/* Dedos Veloces (por turnos): el celular como botón gigante. Cuenta aquí y
   envía el TOTAL del turno cada 200 ms (si una orden se pierde, la siguiente
   lo corrige). `id` cambia con cada turno: el contador vuelve a cero. */
function TocarDedosCel({ id, activo, color, orden }) {
  const [n, setN] = React.useState(0);
  const cuenta = React.useRef(0), enviado = React.useRef(0);
  React.useEffect(() => { setN(0); cuenta.current = 0; enviado.current = 0; }, [id]);
  React.useEffect(() => {
    if (!activo) return undefined;
    const t = setInterval(() => {
      if (cuenta.current !== enviado.current) { enviado.current = cuenta.current; orden('dd-toques', { id, n: cuenta.current }); }
    }, 200);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activo, id]);
  return (
    <button className="vgm-btn grande" disabled={!activo} onPointerDown={(e) => { e.preventDefault(); if (activo) { cuenta.current += 1; setN(cuenta.current); } }}
      style={{ minHeight: 200, fontSize: 40, background: activo ? color : undefined, color: '#031006', touchAction: 'manipulation' }}>
      {activo ? '👆 ' + n : 'Espera…'}
    </button>
  );
}

function VigiaMandoCelular({ code, state, send }) {
  const st = state || {};
  React.useEffect(() => {
    if (!document.getElementById('vgm-css')) {
      const s = document.createElement('style'); s.id = 'vgm-css'; s.textContent = MANDO_CSS; document.head.appendChild(s);
    }
    send('vigia', { accion: 'hola' });   // el televisor muestra "Celular conectado"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tiempo estimado entre publicaciones del televisor.
  const [, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!st.reproduciendo) return undefined;
    const iv = setInterval(() => setTick((t) => t + 1), 500);
    return () => clearInterval(iv);
  }, [st.reproduciendo]);
  const tiempo = Math.min(st.duracion || Infinity, (st.tiempo || 0) + (st.reproduciendo && st.en ? (Date.now() - st.en) / 1000 : 0));

  const orden = (accion, extra) => {
    send('vigia', { accion, ...(extra || {}) });
    if (navigator.vibrate) navigator.vibrate(12);
  };
  const lista = st.lista || [];
  const activa = st.activa || null;
  const itemActivo = activa ? lista.find((x) => x.id === activa.id) : null;
  const esMedio = st.recurso === 'video' || st.recurso === 'podcast';
  const esDoc = st.recurso === 'documento';
  const esImg = st.recurso === 'imagenes';
  const sinEmpezar = (esMedio || esImg) && !st.empezado;
  const nombreRecurso = esDoc ? (st.formato === 'epub' ? 'EPUB' : 'PDF') : esImg ? 'Imágenes' : st.recurso === 'podcast' ? 'Podcast' : 'Video';

  return (
    <div className="vgm">
      <div className="vgm-cabeza">
        <img src={VIGIA_LOGO} alt="" />
        <div style={{ minWidth: 0 }}>
          <strong>{st.titulo || 'Modo Vigía'}</strong>
          <small>Mando · {nombreRecurso} · sala {code}</small>
        </div>
        <span className="vgm-estado">● Conectado</span>
      </div>

      {sinEmpezar && (
        <button className="vgm-btn grande" onClick={() => orden('comenzar')}>▶ Comenzar</button>
      )}

      {/* Tarjeta (o reto) en pantalla */}
      {activa && (
        <div className="vgm-panel tarjeta" style={{ '--c': (itemActivo && itemActivo.color) || '#FF8A00' }}>
          <div className="vgm-kicker">En pantalla · {itemActivo ? itemActivo.nombre : 'Activación'}{activa.pequena ? ' (pequeña)' : ''}</div>
          {itemActivo && itemActivo.texto && <div style={{ fontWeight: 700, fontSize: 15 }}>{itemActivo.texto}</div>}
          {/^cp-/.test(activa.tipo) ? (
            /* Modo Capibara · historia de Jomu: los mismos botones de la pantalla */
            <React.Fragment>
              {st.capibara && st.capibara.juego === 'dedos' ? (() => {
                /* Dedos Veloces: iniciar, repetir, pausar y (por turnos) siguiente concursante */
                const c = st.capibara, eq = st.marcador || [];
                const enRonda = ['presenta', 'cuenta', 'jugando', 'congela', 'finTurno', 'resultado'].includes(c.fase);
                const eqA = c.actual !== null && c.actual !== undefined ? eq[c.actual] : null;
                return (
                  <React.Fragment>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      ⚡ Dedos Veloces · {c.modo === 'turnos' ? 'por turnos' : 'todos a la vez'}
                      {enRonda ? ' · ' + (c.desempate ? 'desempate' : 'ronda ' + c.ronda + '/' + c.rondas) : ''}
                      {enRonda && eqA ? ' · turno: ' + eqA.nombre : ''}
                    </div>
                    {enRonda && (
                      <div style={{ fontSize: 14, fontWeight: 800 }}>
                        {c.toques.map((t) => (eq[t.i] ? eq[t.i].nombre.replace(/^Equipo\s+/, '') + ': ' + (t.fijo !== undefined && c.modo === 'turnos' ? t.fijo : t.n) : '')).join(' · ')}
                      </div>
                    )}
                    {c.fase === 'menu' && (
                      <React.Fragment>
                        <div className="vgm-chips">
                          {[['simultaneo', '⌨ Todos a la vez'], ['turnos', '👆 Por turnos']].map(([v, t]) => (
                            <button key={v} className={'vgm-chip' + (c.modo === v ? ' on' : '')} style={{ '--c': '#9CD38A' }} onClick={() => orden('dd-modo', { v })}>{t}</button>
                          ))}
                        </div>
                        <div className="vgm-fila">
                          <button className="vgm-btn borde" onClick={() => orden('dd-tiempo', { d: -1 })}>−</button>
                          <div className="vgm-centro">{c.tiempo} s<small>por ronda</small></div>
                          <button className="vgm-btn borde" onClick={() => orden('dd-tiempo', { d: 1 })}>+</button>
                        </div>
                        <button className="vgm-btn grande" onClick={() => orden('dd-empezar')}>▶ ¡Empezar!</button>
                      </React.Fragment>
                    )}
                    {c.fase === 'prueba' && (
                      <React.Fragment>
                        <div style={{ fontSize: 14 }}>
                          {c.probadas.map((ok, i) => (eq[i] ? (ok ? '✓ ' : '… ') + eq[i].nombre.replace(/^Equipo\s+/, '') + ' (' + c.teclas[i] + ')' : '')).join(' · ')}
                        </div>
                        <button className="vgm-btn grande" onClick={() => orden('dd-listo')}>▶ Todo listo</button>
                        <button className="vgm-btn borde" onClick={() => orden('dd-turnos')}>👆 Sin teclado: por turnos</button>
                      </React.Fragment>
                    )}
                    {c.fase === 'presenta' && <button className="vgm-btn grande" onClick={() => orden('dd-iniciar')}>▶ {c.modo === 'turnos' ? 'Iniciar turno' : 'Iniciar ronda'}</button>}
                    {c.modo === 'turnos' && (c.fase === 'cuenta' || c.fase === 'jugando') && (
                      <TocarDedosCel id={c.idTurno} activo={c.fase === 'jugando' && !c.pausado} color={(eqA && eqA.color) || '#9CD38A'} orden={orden} />
                    )}
                    {c.fase === 'finTurno' && <button className="vgm-btn grande" onClick={() => orden('dd-siguiente')}>▶ Siguiente concursante</button>}
                    {c.fase === 'resultado' && c.ganadores.length > 1 && <button className="vgm-btn grande" onClick={() => orden('dd-desempate')}>⚔ Desempate (5 s)</button>}
                    {c.fase === 'resultado' && c.registrado && <button className="vgm-btn grande" onClick={() => orden('dd-ronda')}>{c.ronda >= c.rondas ? '🏁 Resultado final' : '▶ Siguiente ronda'}</button>}
                    {enRonda && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('dd-pausa')}>{c.pausado ? '▶ Seguir' : '⏸ Pausa'}</button>
                        {!c.registrado && <button className="vgm-btn borde" onClick={() => orden('dd-repetir')}>↻ Repetir ronda</button>}
                      </div>
                    )}
                    {enRonda && <button className="vgm-btn borde" onClick={() => orden('dd-terminar')}>🏁 Terminar juego</button>}
                    {c.fase === 'fin' && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('dd-otra')}>↻ Jugar otra vez</button>
                        <button className="vgm-btn grande" onClick={() => orden('dd-montana')}>🏔 Ver la montaña</button>
                      </div>
                    )}
                    {c.fase === 'montana' && <button className="vgm-btn grande" onClick={() => orden('dd-continuar')}>Continuar ›</button>}
                    <button className="vgm-btn borde" onClick={() => orden('dd-silencio')}>{c.silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                  </React.Fragment>
                );
              })() : st.capibara && st.capibara.juego === 'jungla' ? (() => {
                /* Movimiento de la Jungla: el mando es el centro del modo video beam.
                   FALLÓ va primero y es el botón más grande (rojo). */
                const c = st.capibara, eq = st.marcador || [];
                const enCarrera = c.fase === 'corre' || c.fase === 'anuncio';
                const enJuego = ['turno', 'corre', 'anuncio', 'fallo', 'resultado'].includes(c.fase);
                return (
                  <React.Fragment>
                    {c.modo === 'beam' && enCarrera && (
                      <button className="vgm-btn grande vgm-rojo" style={{ minHeight: 120, fontSize: 30 }} onClick={() => orden('jn-fallo')}>💥 FALLÓ</button>
                    )}
                    {c.modo === 'beam' && c.fase === 'fallo' && c.deshacer > 0 && (
                      <button className="vgm-btn grande" style={{ minHeight: 90, fontSize: 22 }} onClick={() => orden('jn-deshacer')}>↩ Deshacer ({c.deshacer})</button>
                    )}
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      🌴 Jungla · {c.modo === 'beam' ? 'equipos' : 'teclado'}
                      {enJuego && c.modo === 'beam' && eq[c.turno] ? ' · ' + eq[c.turno].nombre + (c.pasa ? ' · ' + c.pasa : '') + ' · ronda ' + c.ronda + '/' + c.rondas : ''}
                      {enJuego ? ' · ⭐ ' + c.puntos : ''}
                    </div>
                    {enJuego && c.instrucciones.length > 0 && <div style={{ fontSize: 13, opacity: 0.85 }}>{c.instrucciones.join(' · ')}</div>}
                    {c.fase === 'menu' && (
                      <React.Fragment>
                        {c.personajes.length > 0 && (
                          <div className="vgm-chips">
                            {c.personajes.map((p, i) => (
                              <button key={i} className={'vgm-chip' + (c.personaje === i ? ' on' : '')} style={{ '--c': '#9CD38A' }} onClick={() => orden('jn-personaje', { i })}>{p}</button>
                            ))}
                          </div>
                        )}
                        {c.modo === 'individual' && (
                          <div className="vgm-chips">
                            {eq.map((e, i) => (
                              <button key={i} className={'vgm-chip' + (c.equipoInd === i ? ' on' : '')} style={{ '--c': e.color }} onClick={() => orden('jn-equipo', { i })}>{e.nombre}</button>
                            ))}
                          </div>
                        )}
                        {c.modo === 'beam' && (
                          <div className="vgm-chips">
                            {[['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']].map(([v, t]) => (
                              <button key={v} className={'vgm-chip' + (c.velocidad === v ? ' on' : '')} style={{ '--c': '#9CD38A' }} onClick={() => orden('jn-velocidad', { v })}>{t}</button>
                            ))}
                          </div>
                        )}
                        <button className="vgm-btn grande" onClick={() => orden('jn-empezar')}>▶ ¡Empezar!</button>
                      </React.Fragment>
                    )}
                    {c.fase === 'turno' && <button className="vgm-btn grande" onClick={() => orden('jn-listo')}>▶ ¡A correr!</button>}
                    {c.fase === 'fallo' && c.modo === 'beam' && <button className="vgm-btn borde" onClick={() => orden('jn-siguiente')}>✓ Registrar ya</button>}
                    {c.fase === 'resultado' && (
                      <button className="vgm-btn grande" onClick={() => orden('jn-siguiente')}>{c.modo === 'beam' ? '▶ Siguiente concursante' : '↻ Reintentar'}</button>
                    )}
                    {enJuego && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('jn-pausa')}>{c.pausado ? '▶ Seguir' : '⏸ Pausa'}</button>
                        <button className="vgm-btn borde" onClick={() => orden('jn-reiniciar')}>↻ Reiniciar turno</button>
                        {c.modo === 'beam' && <button className="vgm-btn borde" onClick={() => orden('jn-saltar')}>⏭ Saltar turno</button>}
                      </div>
                    )}
                    {enJuego && <button className="vgm-btn borde" onClick={() => orden('jn-terminar')}>🏁 Terminar juego</button>}
                    {c.fase === 'fin' && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('jn-otra')}>↻ Jugar otra vez</button>
                        <button className="vgm-btn grande" onClick={() => orden('jn-montana')}>🏔 Ver la montaña</button>
                      </div>
                    )}
                    {c.fase === 'montana' && <button className="vgm-btn grande" onClick={() => orden('jn-continuar')}>Continuar ›</button>}
                    <button className="vgm-btn borde" onClick={() => orden('jn-silencio')}>{c.silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                  </React.Fragment>
                );
              })() : st.capibara && st.capibara.juego === 'muro' ? (() => {
                /* Muro Infernal: los mismos botones de la pantalla */
                const c = st.capibara, eq = st.marcador || [];
                const enJuego = ['turno', 'previa', 'muro', 'juez', 'exito', 'fallo'].includes(c.fase);
                return (
                  <React.Fragment>
                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                      🔥 Muro Infernal · {c.modo === 'beam' ? 'equipos' : 'individual'}
                      {enJuego && c.modo === 'beam' && eq[c.turno] ? ' · turno: ' + eq[c.turno].nombre + ' · ronda ' + c.ronda + '/' + c.rondas : ''}
                      {enJuego && c.modo === 'individual' ? ' · ⭐ ' + c.puntos + ' · ' + '♥'.repeat(Math.max(0, c.vidas)) : ''}
                      {enJuego && c.pose ? ' · pose: ' + c.pose : ''}
                    </div>
                    {c.fase === 'menu' && (
                      <React.Fragment>
                        {c.personajes.length > 0 && (
                          <div className="vgm-chips">
                            {c.personajes.map((p, i) => (
                              <button key={i} className={'vgm-chip' + (c.personaje === i ? ' on' : '')} style={{ '--c': '#9CD38A' }} onClick={() => orden('mu-personaje', { i })}>{p}</button>
                            ))}
                          </div>
                        )}
                        {c.modo === 'individual' && (
                          <div className="vgm-chips">
                            {eq.map((e, i) => (
                              <button key={i} className={'vgm-chip' + (c.equipoInd === i ? ' on' : '')} style={{ '--c': e.color }} onClick={() => orden('mu-equipo', { i })}>{e.nombre}</button>
                            ))}
                          </div>
                        )}
                        {c.modo === 'beam' && (
                          <div className="vgm-fila">
                            <button className="vgm-btn borde" onClick={() => orden('mu-tiempo', { d: -1 })}>−</button>
                            <div className="vgm-centro">{c.tiempo} s<small>por muro</small></div>
                            <button className="vgm-btn borde" onClick={() => orden('mu-tiempo', { d: 1 })}>+</button>
                          </div>
                        )}
                        <button className="vgm-btn grande" onClick={() => orden('mu-empezar')}>▶ ¡Empezar!</button>
                      </React.Fragment>
                    )}
                    {c.fase === 'turno' && <button className="vgm-btn grande" onClick={() => orden('mu-listo')}>▶ ¡Que venga el muro!</button>}
                    {(c.fase === 'previa' || c.fase === 'muro') && <button className="vgm-btn grande" onClick={() => orden('mu-listo')}>✓ ¡Listo!</button>}
                    {c.fase === 'juez' && (
                      <div className="vgm-fila">
                        <button className="vgm-btn grande" onClick={() => orden('mu-juez', { ok: true })}>✓ ¡Sí, pasó!</button>
                        <button className="vgm-btn borde" onClick={() => orden('mu-juez', { ok: false })}>✗ ¡Al agua!</button>
                      </div>
                    )}
                    {/* Mover al personaje desde el celular */}
                    {(c.fase === 'previa' || c.fase === 'muro') && c.segmentos.length > 0 && (
                      <div className="vgm-segmentos">
                        {c.segmentos.map((s, k) => (
                          <div key={k} className={'vgm-equipo' + (c.seg === k ? ' on' : '')}>
                            <span className="vgm-equipo-nombre">{k + 1}. {s}</span>
                            <button className="vgm-btn borde" onClick={() => orden('mu-seg', { k, d: -1 })}>↺</button>
                            <button className="vgm-btn" onClick={() => orden('mu-seg', { k, d: 1 })}>↻</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {enJuego && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('mu-pausa')}>{c.pausado ? '▶ Seguir' : '⏸ Pausa'}</button>
                        <button className="vgm-btn borde" onClick={() => orden('mu-repetir')}>↻ Repetir</button>
                        <button className="vgm-btn borde" onClick={() => orden('mu-saltar')}>⏭ {c.modo === 'beam' ? 'Saltar turno' : 'Otro muro'}</button>
                      </div>
                    )}
                    {enJuego && <button className="vgm-btn borde" onClick={() => orden('mu-terminar')}>🏁 Terminar juego</button>}
                    {c.fase === 'fin' && (
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('mu-otra')}>↻ Jugar otra vez</button>
                        <button className="vgm-btn grande" onClick={() => orden('mu-montana')}>🏔 Ver la montaña</button>
                      </div>
                    )}
                    {c.fase === 'montana' && <button className="vgm-btn grande" onClick={() => orden('mu-continuar')}>Continuar ›</button>}
                    <button className="vgm-btn borde" onClick={() => orden('mu-silencio')}>{c.silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                  </React.Fragment>
                );
              })() : (() => {
                const c = st.capibara;
                const fase = c ? c.fase || 'historia' : 'historia';
                return (
                  <React.Fragment>
                    <div style={{ fontSize: 13, opacity: 0.8 }}>
                      {fase === 'grupos' ? '¡Busca tu equipo!' : fase === 'montana' ? '🏔 El camino hacia Jomu' : c ? 'Historia · paso ' + (c.paso + 1) + ' de ' + c.total : 'Historia'}
                    </div>
                    {fase === 'grupos' && <button className="vgm-btn borde" onClick={() => orden('cp-resortear')}>🔀 Volver a sortear</button>}
                    <div className="vgm-fila">
                      <button className="vgm-btn borde" onClick={() => orden('cp-anterior')} disabled={!c || (fase === 'historia' && c.paso === 0)}>‹ Anterior</button>
                      {fase === 'grupos' ? <button className="vgm-btn grande" onClick={() => orden('cp-siguiente')}>Ver el camino hacia Jomu ›</button>
                        : fase === 'montana' ? <button className="vgm-btn grande" onClick={() => orden('cp-siguiente')}>🌿 ¡A la aventura!</button>
                        : c && c.final ? <button className="vgm-btn grande" onClick={() => orden('cp-listos')}>🌿 ¿Listos aventureros de las llanuras?</button>
                        : <button className="vgm-btn grande" onClick={() => orden('cp-siguiente')}>Siguiente ›</button>}
                    </div>
                  </React.Fragment>
                );
              })()}
            </React.Fragment>
          ) : activa.tipo === 'reto' || /^jg-/.test(activa.tipo) ? (
            <div className="vgm-fila">
              {activa.tipo === 'reto' && <button className="vgm-btn azul" onClick={() => orden('reto-sortear')}>↻ Sortear</button>}
              <button className="vgm-btn grande" onClick={() => orden('reto-terminar')}>{activa.tipo === 'reto' ? 'Terminar reto' : 'Terminar desafío'}</button>
            </div>
          ) : (
            <button className="vgm-btn grande" onClick={() => orden('continuar')}>{esMedio ? '▶ Continuar' : '✓ Cerrar tarjeta'}</button>
          )}
          {/* Video de YouTube de la tarjeta: los mismos botones de la pantalla */}
          {itemActivo && itemActivo.video && (
            <div className="vgm-fila">
              <button className="vgm-btn azul" onClick={() => orden('video-tarjeta', { cmd: 'alternar' })}>▶ / ❚❚ Video</button>
              <button className="vgm-btn borde" onClick={() => orden('video-tarjeta', { cmd: 'inicio' })}>↺ Inicio</button>
              <button className="vgm-btn borde" onClick={() => orden('video-tarjeta', { cmd: 'agrandar' })}>⛶ Agrandar</button>
            </div>
          )}
          {!activa.pequena && !/^cp-/.test(activa.tipo) && (
            <div className="vgm-fila">
              <button className="vgm-btn borde" onClick={() => orden('letra', { dir: -1 })}>A−</button>
              <button className="vgm-btn borde" onClick={() => orden('letra', { dir: 0 })}>Aa</button>
              <button className="vgm-btn borde" onClick={() => orden('letra', { dir: 1 })}>A+</button>
            </div>
          )}
        </div>
      )}

      {/* Video / podcast */}
      {esMedio && !sinEmpezar && (
        <div className="vgm-panel">
          <div className="vgm-progreso"><span style={{ width: (st.duracion ? Math.min(100, (tiempo / st.duracion) * 100) : 0) + '%' }}></span></div>
          <div className="vgm-tiempos"><span>{fmtMando(tiempo)}</span><span>{st.duracion ? fmtMando(st.duracion) : '–:––'}</span></div>
          <div className="vgm-fila">
            <button className="vgm-btn" onClick={() => orden('saltar', { seg: -10 })}>↺ 10 s</button>
            <button className="vgm-btn grande" style={{ flex: 1.4 }} onClick={() => orden('alternar')}>{st.reproduciendo ? '❚❚' : '▶'}</button>
            <button className="vgm-btn" onClick={() => orden('saltar', { seg: 10 })}>10 s ↻</button>
          </div>
          {st.volumen !== null && st.volumen !== undefined && (
            <div className="vgm-fila">
              <button className="vgm-btn borde" onClick={() => orden('volumen', { delta: -10 })}>🔉 −</button>
              <button className="vgm-btn borde" onClick={() => orden('silencio')}>{st.volumen === 0 ? '🔇' : st.volumen + '%'}</button>
              <button className="vgm-btn borde" onClick={() => orden('volumen', { delta: 10 })}>🔊 +</button>
            </div>
          )}
        </div>
      )}

      {/* Documento (PDF / EPUB) */}
      {esDoc && (
        <div className="vgm-panel">
          <button className="vgm-btn grande" onClick={() => orden('siguiente')} disabled={!lista.length}>
            {activa ? 'Cerrar y seguir' : 'Siguiente activador'}{st.pendientes ? ' · ' + st.pendientes + ' por ver' : ''}
          </button>
          <div className="vgm-fila">
            <button className="vgm-btn" onClick={() => orden('desplazar', { dir: -1 })}>▲ Subir</button>
            <button className="vgm-btn" onClick={() => orden('desplazar', { dir: 1 })}>▼ Bajar</button>
          </div>
          <div className="vgm-fila">
            <button className="vgm-btn borde" onClick={() => orden('zoom', { dir: -1 })}>− Alejar</button>
            <button className="vgm-btn borde" onClick={() => orden('zoom', { dir: 0 })}>{st.formato === 'epub' ? (st.letra || '') + ' px' : (st.zoom || 100) + '%'}</button>
            <button className="vgm-btn borde" onClick={() => orden('zoom', { dir: 1 })}>+ Acercar</button>
          </div>
          {st.musica !== null && st.musica !== undefined && (
            <button className="vgm-btn borde" onClick={() => orden('musica')}>{st.musica ? '♪ Pausar la música' : '♪ Reanudar la música'}</button>
          )}
        </div>
      )}

      {/* Imágenes */}
      {esImg && !sinEmpezar && (
        <div className="vgm-panel">
          <div className="vgm-fila">
            <button className="vgm-btn" onClick={() => orden('anterior')} disabled={(st.total || 0) < 2}>‹ Anterior</button>
            <div className="vgm-centro">{st.diapo || 1} / {st.total || 1}{st.diapoTitulo ? <small>{st.diapoTitulo}</small> : null}</div>
            <button className="vgm-btn" onClick={() => orden('siguiente')} disabled={(st.total || 0) < 2}>Siguiente ›</button>
          </div>
          {st.musica !== null && st.musica !== undefined && (
            <button className="vgm-btn borde" onClick={() => orden('musica')}>{st.musica ? '♪ Pausar la música' : '♪ Reanudar la música'}</button>
          )}
        </div>
      )}

      {/* Modo Jaguar: los MISMOS botones del desafío que está en el televisor */}
      {st.jaguarDesafio && st.marcador && (() => {
        const d = st.jaguarDesafio;
        const eq = st.marcador;
        const enfr = d.enfrentan || [];
        return (
          <div className="vgm-panel vgm-jaguar">
            <div className="vgm-kicker" style={{ color: '#39FF14' }}>✊ Desafío en pantalla</div>
            {/* Inicio del Modo Jaguar: "¡Busca tu equipo!" con los estudiantes de cada equipo */}
            {d.grupos && (
              <React.Fragment>
                <div className="vgm-kicker">¡Busca tu equipo! · {eq.length} equipos</div>
                <button className="vgm-btn grande" onClick={() => orden('continuar')}>¡A luchar! ▶</button>
                <button className="vgm-btn borde" onClick={() => orden('jg-resortear')}>🔀 Volver a sortear</button>
              </React.Fragment>
            )}
            {d.ppt === 'elegir' && (
              <React.Fragment>
                <div className="vgm-fila">
                  <button className="vgm-btn borde" onClick={() => orden('ppt-cantidad', { n: enfr.length - 1 })} disabled={enfr.length <= 2}>−</button>
                  <div className="vgm-centro">{enfr.length}<small>equipos se enfrentan</small></div>
                  <button className="vgm-btn borde" onClick={() => orden('ppt-cantidad', { n: enfr.length + 1 })} disabled={enfr.length >= eq.length}>+</button>
                </div>
                <div className="vgm-chips">
                  {eq.map((e, i) => (
                    <button key={i} className={'vgm-chip' + (enfr.includes(i) ? ' on' : '')} style={{ '--c': e.color }}
                      onClick={() => orden('ppt-equipo', { i })}>{e.nombre}</button>
                  ))}
                </div>
                <button className="vgm-btn grande" onClick={() => orden('ppt-jugar')}>✊ ¡Piedra, papel o tijera!</button>
              </React.Fragment>
            )}
            {d.ppt === 'jugando' && <div className="vgm-centro">Piedra… papel… tijera…</div>}
            {/* Silueta del grupo: los botones de cada tarjeta */}
            {d.silueta && (() => {
              const s = d.silueta;
              const e = s.equipo !== null && s.equipo !== undefined ? eq[s.equipo] : null;
              return (
                <React.Fragment>
                  <div className="vgm-kicker">Silueta del grupo · paso {s.paso} de 4 · siluetas {s.quedan} de {s.siluetas}</div>
                  {s.paso === 1 && s.siluetas > 0 && !s.quedan && (
                    <button className="vgm-btn borde" onClick={() => orden('sil-reiniciar')}>Ya se usaron todas · Usarlas de nuevo</button>
                  )}
                  {s.paso === 1 && !e && <button className="vgm-btn grande" disabled={s.girando} onClick={() => orden('sil-azar')}>{s.girando ? 'Eligiendo…' : '🎲 ¿Qué grupo lo hace?'}</button>}
                  {s.paso === 1 && e && (
                    <React.Fragment>
                      <div className="vgm-centro" style={{ color: e.color }}>Le toca al {e.nombre}<small>Ronda {s.ronda} de {s.total}</small></div>
                      <button className="vgm-btn grande" onClick={() => orden('sil-continuar')}>▶ ¡Listos! (3, 2, 1)</button>
                    </React.Fragment>
                  )}
                  {s.paso === 2 && <div className="vgm-centro">3… 2… 1…</div>}
                  {s.paso === 3 && <button className="vgm-btn borde" onClick={() => orden('sil-saltar')}>Silueta en pantalla · Terminar ya</button>}
                  {s.paso === 4 && e && (
                    <React.Fragment>
                      <div className="vgm-equipo" style={{ '--c': e.color }}>
                        <span className="vgm-equipo-nombre">{e.nombre}</span>
                        <button className="vgm-btn borde" onClick={() => orden('punto', { i: s.equipo, delta: -1 })} disabled={!e.puntos}>−</button>
                        <b>{e.puntos}</b>
                        <button className="vgm-btn" onClick={() => orden('punto', { i: s.equipo, delta: 1 })}>+1</button>
                      </div>
                      <div className="vgm-fila">
                        <button className={'vgm-btn' + (s.resultado === 'si' ? ' grande' : ' borde')} onClick={() => orden('sil-resultado', { ok: true })}>¡Lo lograron!</button>
                        <button className={'vgm-btn borde' + (s.resultado === 'no' ? ' vgm-rojo' : '')} onClick={() => orden('sil-resultado', { ok: false })}>No lo lograron</button>
                      </div>
                      {s.resultado && <button className="vgm-btn borde" onClick={() => orden('sil-otro')}>↻ Otro grupo</button>}
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })()}
            {/* Adivina la palabra: teclado, turnos y la palabra secreta (solo la ve el docente) */}
            {d.palabra && <PalabraMando p={d.palabra} eq={eq} orden={orden} />}
            {/* Mímica: el docente ve la palabra; los mismos botones que en pantalla */}
            {d.mimica && (() => {
              const m = d.mimica;
              const e = eq[m.equipo];
              const varios = (m.participantes || []).length > 1;
              return (
                <React.Fragment>
                  <div className="vgm-kicker">Mímica · tarjeta {m.paso} de 2 · palabras {m.quedan} de {m.total}</div>
                  {e && <div className="vgm-centro" style={{ color: e.color }}>Turno del {e.nombre}<small>{m.palabra ? 'Palabra: ' + m.palabra : 'Sin palabras para este equipo'}</small></div>}
                  {m.paso === 1 && (
                    <React.Fragment>
                      {!m.palabra && m.total > 0 && <button className="vgm-btn borde" onClick={() => orden('mm-reiniciar')}>Ya se usaron todas · Usarlas de nuevo</button>}
                      <button className="vgm-btn grande" disabled={!m.palabra} onClick={() => orden('mm-ver')}>{m.viendo ? '👁 En pantalla… (otra vez)' : '👁 Ver palabra (5 s)'}</button>
                      <div className="vgm-fila">
                        <button className="vgm-btn borde" onClick={() => orden('mm-siguiente')}>⏭ Siguiente palabra</button>
                        <button className="vgm-btn borde" disabled={!m.palabra} onClick={() => orden('mm-correcto')}>¿Correcto? ▶</button>
                      </div>
                    </React.Fragment>
                  )}
                  {m.paso === 2 && (
                    <React.Fragment>
                      <div className="vgm-fila">
                        <button className={'vgm-btn' + (m.resultado === 'si' ? ' grande' : ' borde')} onClick={() => orden('mm-resultado', { ok: true })}>🏆 ¡Ganador! +1</button>
                        <button className={'vgm-btn borde' + (m.resultado === 'no' ? ' vgm-rojo' : '')} onClick={() => orden('mm-resultado', { ok: false })}>No la adivinaron</button>
                      </div>
                      <button className="vgm-btn borde" onClick={() => orden('mm-siguiente')}>⏭ Siguiente palabra</button>
                    </React.Fragment>
                  )}
                  {varios && m.paso === 1 && (
                    <React.Fragment>
                      <div className="vgm-kicker">¿Quién hace la mímica?</div>
                      <div className="vgm-chips">
                        {m.participantes.filter((i) => eq[i]).map((i) => (
                          <button key={i} className={'vgm-chip' + (m.equipo === i ? ' on' : '')} style={{ '--c': eq[i].color }}
                            onClick={() => orden('mm-turno', { i })}>{eq[i].nombre}{m.equipo === i ? ' 🎭' : ''}</button>
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                  {varios && <button className="vgm-btn borde" onClick={() => orden('mm-cambio')}>⇄ Cambio de equipo</button>}
                </React.Fragment>
              );
            })()}
            {/* Haz un origami: tarjeta 1 (reto, temporizador opcional) y 2 (¿Ganadores?) */}
            {d.origami && (() => {
              const g = d.origami;
              const ganadores = g.ganadores || [];
              const r = g.restante || 0;
              return (
                <React.Fragment>
                  <div className="vgm-kicker">Haz un origami · tarjeta {g.paso} de 2</div>
                  {g.paso === 1 && g.conReloj && (
                    <div className="vgm-centro">{g.tiempo ? '¡Tiempo!' : '⏱ ' + Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0')}<small>{g.corriendo ? 'corriendo' : r < g.total ? 'en pausa' : 'listo para empezar'}</small></div>
                  )}
                  {g.paso === 1 && g.conReloj && !g.tiempo && (
                    g.corriendo
                      ? <button className="vgm-btn borde" onClick={() => orden('og-pausar')}>❚❚ Pausar</button>
                      : <button className="vgm-btn grande" onClick={() => orden('og-empezar')}>▶ {r < g.total ? 'Seguir' : 'Empezar'}</button>
                  )}
                  {g.paso === 1 && !g.tiempo && (
                    <button className={'vgm-btn' + (g.conReloj ? ' borde' : ' grande')} onClick={() => orden('og-ganadores')}>¿Ganadores? ▶</button>
                  )}
                  {g.paso === 2 && (
                    <React.Fragment>
                      <div className="vgm-kicker">Toca los que lo lograron (+1 cada uno)</div>
                      <div className="vgm-chips">
                        {(g.participantes || []).filter((i) => eq[i]).map((i) => (
                          <button key={i} className={'vgm-chip' + (ganadores.includes(i) ? ' on' : '')} style={{ '--c': eq[i].color }}
                            onClick={() => orden('og-ganador', { i })}>{eq[i].nombre}{ganadores.includes(i) ? ' ✓' : ''} · {eq[i].puntos}</button>
                        ))}
                      </div>
                      <button className="vgm-btn borde" onClick={() => orden('og-otra')}>↻ Otra ronda</button>
                    </React.Fragment>
                  )}
                </React.Fragment>
              );
            })()}
            {/* Responde en cuaderno o tablero: 1 pregunta · 2 responder · 3 ¿ganador? (con cronómetro) */}
            {d.cuaderno && (() => {
              const g = d.cuaderno;
              const r = g.restante || 0;
              const elegibles = (g.participantes || []).filter((i) => eq[i]);
              return (
                <React.Fragment>
                  <div className="vgm-kicker">{g.videobeam ? 'Responde en el tablero' : 'Responde en el cuaderno'} · tarjeta {g.paso} de 3</div>
                  {g.paso < 3 && (
                    <div className="vgm-centro">{g.tiempo ? '¡Tiempo!' : '⏱ ' + Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0')}<small>{g.corriendo ? 'corriendo' : r < g.total ? 'en pausa' : 'listo para empezar'}</small></div>
                  )}
                  {g.paso < 3 && !g.tiempo && (
                    g.corriendo
                      ? <button className="vgm-btn borde" onClick={() => orden('cq-pausar')}>❚❚ Pausar</button>
                      : <button className="vgm-btn borde" onClick={() => orden('cq-empezar')}>▶ {r < g.total ? 'Seguir' : 'Empezar'}</button>
                  )}
                  {g.paso === 1 && <button className="vgm-btn grande" onClick={() => orden('cq-responder')}>{g.videobeam ? 'Mostrar recuadros ▶' : 'Responder ▶'}</button>}
                  {g.paso >= 2 && (
                    <React.Fragment>
                      <div className="vgm-kicker">{g.paso === 2 ? 'Elige al ganador (+1 punto)' : '¿Ganador? Toca para cambiarlo'}</div>
                      <div className="vgm-chips">
                        {elegibles.map((i) => (
                          <button key={i} className={'vgm-chip' + (d.ganador === i ? ' on' : '')} style={{ '--c': eq[i].color }}
                            onClick={() => orden('cq-ganador', { i })}>{eq[i].nombre}{d.ganador === i ? ' ✓' : ''} · {eq[i].puntos}</button>
                        ))}
                      </div>
                    </React.Fragment>
                  )}
                  {g.paso === 2 && <button className="vgm-btn borde" onClick={() => orden('cq-ganador-paso')}>¿Ganador? ▶</button>}
                  {g.paso === 3 && (
                    <div className="vgm-fila">
                      <button className="vgm-btn borde" onClick={() => orden('cq-volver')}>← {g.videobeam ? 'Recuadros' : 'Pregunta'}</button>
                      <button className="vgm-btn borde" onClick={() => orden('cq-otra')}>↻ Otra ronda</button>
                    </div>
                  )}
                </React.Fragment>
              );
            })()}
            {d.pideGanador && (
              <React.Fragment>
                <div className="vgm-kicker">¿Quién ganó? (+1 punto)</div>
                <div className="vgm-chips">
                  {(d.elegibles || []).filter((i) => eq[i]).map((i) => (
                    <button key={i} className={'vgm-chip' + (d.ganador === i ? ' on' : '')} style={{ '--c': eq[i].color }}
                      onClick={() => orden('jg-ganador', { i })}>{eq[i].nombre}{d.ganador === i ? ' ✓' : ''}</button>
                  ))}
                </div>
              </React.Fragment>
            )}
            {(d.ppt === 'resultado' || d.duelo) && (
              <div className="vgm-fila">
                {d.ppt === 'resultado' && <button className="vgm-btn borde" onClick={() => orden('ppt-jugar')}>Empate: otra vez</button>}
                <button className="vgm-btn borde" onClick={() => orden('jg-enfrentar')}>{d.ppt ? '↻ Nuevo enfrentamiento' : '⚔ Enfrentar equipos'}</button>
              </div>
            )}
            {d.ganador !== null && d.ganador !== undefined && d.enlace && eq[d.ganador] && (
              <div className="vgm-equipo" style={{ '--c': eq[d.ganador].color }}>
                <span className="vgm-equipo-nombre">🔗 Responde {eq[d.ganador].nombre}</span>
                <button className="vgm-btn borde" onClick={() => orden('punto', { i: d.ganador, delta: -1 })} disabled={!eq[d.ganador].puntos}>−</button>
                <b>{eq[d.ganador].puntos}</b>
                <button className="vgm-btn" onClick={() => orden('punto', { i: d.ganador, delta: 1 })}>+1</button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Modo Jaguar: marcador con − / + y el ganador */}
      {st.marcador && st.marcador.length > 0 && (
        <div className="vgm-panel vgm-jaguar">
          <div className="vgm-kicker" style={{ color: st.modoEquipos === 'capibara' ? '#9CD38A' : '#39FF14' }}>
            {st.modoEquipos === 'capibara' ? '🏔 Pasos hacia Jomu' + (st.metaCapibara ? ' · meta ' + st.metaCapibara : '') : '✊ Marcador · Modo Jaguar'}
          </div>
          {st.marcador.map((e, i) => (
            <div key={i} className="vgm-equipo" style={{ '--c': e.color }}>
              <span className="vgm-equipo-nombre">{e.nombre}</span>
              <button className="vgm-btn borde" onClick={() => orden('punto', { i, delta: -1 })} disabled={!e.puntos}>−</button>
              <b>{e.puntos}</b>
              <button className="vgm-btn" onClick={() => orden('punto', { i, delta: 1 })}>{st.modoEquipos === 'capibara' ? '+1 paso' : '+1'}</button>
            </div>
          ))}
          <button className="vgm-btn borde" onClick={() => orden('jaguar-grupos')}>{st.jaguarGrupos ? '✕ Cerrar los equipos en pantalla' : '👥 Ver equipos en pantalla'}</button>
          {st.modoEquipos === 'capibara' && (
            <button className="vgm-btn borde" onClick={() => orden('cp-montana')}>{st.capibaraMontana ? '✕ Cerrar la montaña en pantalla' : '🏔 Ver la montaña en pantalla'}</button>
          )}
          {/* También aquí, en el celular: quién está en cada equipo. */}
          <details className="vgm-grupos">
            <summary>Estudiantes de cada equipo</summary>
            {st.marcador.map((e, i) => (
              <div key={i} className="vgm-grupo" style={{ borderLeft: '4px solid ' + e.color, padding: '4px 0 4px 10px', margin: '6px 0' }}>
                <b style={{ color: e.color }}>{e.nombre}</b>
                <div style={{ fontSize: 14, opacity: 0.9 }}>{(e.miembros || []).length ? e.miembros.join(' · ') : 'Sin estudiantes'}</div>
              </div>
            ))}
          </details>
          {st.modoEquipos !== 'capibara' && <button className="vgm-btn borde" onClick={() => orden('jaguar-ganador')}>🏁 Finalizar lucha</button>}
        </div>
      )}

      {/* Activaciones: tocar una la abre en el televisor */}
      {lista.length > 0 && (
        <div className="vgm-panel">
          <div className="vgm-kicker">Activaciones · toca una para abrirla</div>
          <div className="vgm-lista">
            {lista.map((x) => (
              <button key={x.id} className={'vgm-item' + (activa && activa.id === x.id ? ' on' : '') + (x.visto ? ' visto' : '')}
                onClick={() => orden('abrir', { id: x.id })}>
                <span className="vgm-punto" style={{ background: x.color, color: x.color }}></span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <b>{x.nombre}{x.visto ? ' ✓' : ''}</b>
                  {x.texto && <small>{x.texto}</small>}
                </span>
                <span className="vgm-et">{x.etiqueta}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="vgm-pie">
        <button className="vgm-btn borde" onClick={() => orden('tono')}>☀ Tono</button>
        <button className="vgm-btn borde" onClick={() => vigiaConfirmar('Se cerrará el modo Presentar en el televisor.', { titulo: '¿Salir?', aceptar: 'Salir' }).then((ok) => { if (ok) orden('salir'); })}>✕ Salir</button>
      </div>
    </div>
  );
}

Object.assign(window, { VigiaMandoCelular });
