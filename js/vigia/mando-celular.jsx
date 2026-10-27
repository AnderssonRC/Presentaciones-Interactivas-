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
          {activa.tipo === 'reto' || /^jg-/.test(activa.tipo) ? (
            <div className="vgm-fila">
              {activa.tipo === 'reto' && <button className="vgm-btn azul" onClick={() => orden('reto-sortear')}>↻ Sortear</button>}
              <button className="vgm-btn grande" onClick={() => orden('reto-terminar')}>{activa.tipo === 'reto' ? 'Terminar reto' : 'Terminar desafío'}</button>
            </div>
          ) : (
            <button className="vgm-btn grande" onClick={() => orden('continuar')}>{esMedio ? '▶ Continuar' : '✓ Cerrar tarjeta'}</button>
          )}
          {!activa.pequena && (
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
          <div className="vgm-kicker" style={{ color: '#39FF14' }}>✊ Marcador · Modo Jaguar</div>
          {st.marcador.map((e, i) => (
            <div key={i} className="vgm-equipo" style={{ '--c': e.color }}>
              <span className="vgm-equipo-nombre">{e.nombre}</span>
              <button className="vgm-btn borde" onClick={() => orden('punto', { i, delta: -1 })} disabled={!e.puntos}>−</button>
              <b>{e.puntos}</b>
              <button className="vgm-btn" onClick={() => orden('punto', { i, delta: 1 })}>+1</button>
            </div>
          ))}
          <button className="vgm-btn borde" onClick={() => orden('jaguar-ganador')}>🏁 Finalizar lucha</button>
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
