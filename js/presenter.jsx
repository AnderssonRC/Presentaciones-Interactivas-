/* Modo Presentar — pantalla completa para el televisor o video beam */
function Presenter({ pres, onChange, onExit }) {
  const [idx, setIdx] = React.useState(0);
  const [paso, setPaso] = React.useState(0); // paso de aparición dentro de la plantilla actual
  const [scale, setScale] = React.useState(0.5);
  const slides = pres.slides;

  const esEquipos = pres.modo === 'equipos';
  // Puntos en vivo: estado local para respuesta instantánea, persistido vía onChange.
  const [equipos, setEquipos] = React.useState(pres.equipos || []);
  // Recuerda a qué actividad (por id de slide) ya se le asignó ganador, para evitar doble conteo.
  const [otorgado, setOtorgado] = React.useState({}); // { slideId: equipoId }

  React.useEffect(() => { setIdx(0); setPaso(0); }, [pres.id]);
  React.useEffect(() => { setEquipos(pres.equipos || []); }, [pres.id]);

  React.useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const isAct = slide.type === 'actividad';

  const maxPaso = React.useMemo(() => {
    if (slide.type !== 'contenido') return 0;
    const m = migrarContenido(slide);
    return (m.elementos || []).reduce((a, e) => Math.max(a, e.orden || 0), 0);
  }, [slide]);

  const avanzar = React.useCallback(() => {
    if (!isAct && paso < maxPaso) { setPaso((p) => p + 1); return; }
    if (idx < slides.length - 1) { setIdx(idx + 1); setPaso(0); }
  }, [isAct, paso, maxPaso, idx, slides.length]);

  const retroceder = React.useCallback(() => {
    if (!isAct && paso > 0) { setPaso((p) => p - 1); return; }
    if (idx > 0) {
      const prev = slides[idx - 1];
      let pp = 0;
      if (prev.type === 'contenido') {
        const m = migrarContenido(prev);
        pp = (m.elementos || []).reduce((a, e) => Math.max(a, e.orden || 0), 0);
      }
      setIdx(idx - 1); setPaso(pp);
    }
  }, [isAct, paso, idx, slides]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') avanzar();
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') retroceder();
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [avanzar, retroceder, onExit]);

  // Persiste los puntos (estado local -> presentación -> Firestore vía onChange del padre).
  const persistirEquipos = (next) => {
    setEquipos(next);
    if (onChange) onChange({ ...pres, equipos: next });
  };

  // Suma los puntos de la actividad al equipo elegido. NO revierte a nadie:
  // tocar otro equipo simplemente le suma a ese también. Marca a quién se le dio
  // por última vez solo para resaltar el botón, no para quitar puntos.
  const sumarPunto = (equipoId) => {
    const valor = Math.max(1, Number(slide.config && slide.config.puntos) || 1);
    const next = equipos.map((e) => (e.id === equipoId ? { ...e, puntos: (e.puntos || 0) + valor } : e));
    setOtorgado((o) => ({ ...o, [slide.id]: equipoId }));
    persistirEquipos(next);
  };

  // Ajuste manual de puntos desde el marcador (corrige errores: +1 / −1).
  const ajustarPunto = (equipoId, delta) => {
    const next = equipos.map((e) => (e.id === equipoId ? { ...e, puntos: Math.max(0, (e.puntos || 0) + delta) } : e));
    persistirEquipos(next);
  };

  const reiniciarPuntos = () => {
    if (!window.confirm('Solo para el profe: ¿reiniciar todos los puntos a cero?')) return;
    setOtorgado({});
    persistirEquipos(equipos.map((e) => ({ ...e, puntos: 0 })));
  };

  const tool = isAct ? AIP.toolById(slide.tool) : null;
  const Runtime = isAct ? (ActivityRuntimes[slide.tool] || ActivityRuntimes.default) : null;
  const enInicio = idx === 0 && paso === 0;
  const enFinal = idx === slides.length - 1 && (isAct || paso >= maxPaso);

  // ¿Esta actividad reparte puntos?
  const repartePuntos = esEquipos && isAct && AIP.esCompetible(slide.tool);
  const ganadorActual = otorgado[slide.id] || null;
  const valorActividad = Math.max(1, Number(slide.config && slide.config.puntos) || 1);
  const lider = equipos.length ? Math.max(...equipos.map((e) => e.puntos || 0)) : 0;

  // Mostrar/ocultar el marcador lateral (visible por defecto en modo equipos).
  const [verMarcador, setVerMarcador] = React.useState(true);
  const [editandoPuntos, setEditandoPuntos] = React.useState(false); // botones ± en el marcador
  const marcadorAncho = esEquipos && verMarcador ? 340 : 0;

  // Posición arrastrable del panel "sumar puntos". null = posición por defecto
  // (esquina inferior derecha, encima de la navegación, sin tapar el contenido).
  const [panelPos, setPanelPos] = React.useState(null);
  const arrastrePanel = (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const rect = e.currentTarget.closest('.panel-puntos').getBoundingClientRect();
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

  // ¿Es una actividad diseñada SOLO para equipos? (reparte puntos por sí misma)
  const esActEquipo = isAct && ['retaEquipo', 'pulsador', 'apuesta', 'recuadros'].includes(slide.tool);

  // API que reciben las actividades de equipo para sumar puntos directamente.
  const equiposApi = {
    equipos,
    sumar: (equipoId, pts) => {
      const next = equipos.map((e) => (e.id === equipoId ? { ...e, puntos: Math.max(0, (e.puntos || 0) + pts) } : e));
      persistirEquipos(next);
    },
    color: (equipoId) => (equipos.find((e) => e.id === equipoId) || {}).color,
  };

  // El escenario se recalcula restando el ancho del marcador (se reescala más pequeño).
  const escalaUtil = esEquipos
    ? Math.min((window.innerWidth - marcadorAncho) / 1920, window.innerHeight / 1080)
    : scale;

  return (
    <div className="presenter-overlay" data-screen-label={'Presentar · ' + String(idx + 1).padStart(2, '0')}>
      {/* Marcador lateral izquierdo (modo equipos) */}
      {esEquipos && verMarcador && (
        <aside className="score-side">
          <div className="score-side-head">
            <span className="kicker" style={{ color: 'rgba(255,255,255,.6)' }}>Marcador</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={'hud-btn' + (editandoPuntos ? ' on' : '')} onClick={() => setEditandoPuntos((v) => !v)}
                title={editandoPuntos ? 'Terminar edición' : 'Editar puntos'} style={{ padding: '4px 10px', fontSize: 14 }}>
                {editandoPuntos ? '✓' : '✎'}
              </button>
              <button className="hud-btn" onClick={() => setVerMarcador(false)} title="Ocultar marcador" style={{ padding: '4px 10px', fontSize: 13 }}>‹</button>
            </div>
          </div>
          <div className="score-side-list">
            {[...equipos].sort((a, b) => (b.puntos || 0) - (a.puntos || 0)).map((e) => {
              const esLider = (e.puntos || 0) === lider && lider > 0;
              return (
                <div key={e.id} className={'score-side-team' + (esLider ? ' lider' : '')} style={{ '--team': e.color }}>
                  <span className="score-side-rank" style={{ background: e.color }} />
                  <span className="score-side-name">{e.nombre}</span>
                  {editandoPuntos ? (
                    <div className="score-edit">
                      <button onClick={() => ajustarPunto(e.id, -1)} title="Restar un punto">−</button>
                      <span className="score-side-pts" style={{ minWidth: 44 }}>{e.puntos || 0}</span>
                      <button onClick={() => ajustarPunto(e.id, +1)} title="Sumar un punto">+</button>
                    </div>
                  ) : (
                    <React.Fragment>
                      <span className="score-side-pts">{e.puntos || 0}</span>
                      {esLider && <span className="score-crown">👑</span>}
                    </React.Fragment>
                  )}
                </div>
              );
            })}
          </div>
          {/* Reinicio discreto: solo aparece en modo edición, pequeño y al fondo */}
          {editandoPuntos && (
            <button className="hud-btn" onClick={reiniciarPuntos}
              style={{ fontSize: 11.5, padding: '6px 10px', marginTop: 'auto', opacity: .6 }}
              title="Solo para el profe">⟳ Reiniciar todo</button>
          )}
        </aside>
      )}
      {esEquipos && !verMarcador && (
        <button className="score-show" onClick={() => setVerMarcador(true)} title="Mostrar marcador">🏆 ›</button>
      )}

      <div className="presenter-stagewrap" style={{ left: marcadorAncho }}>
        <div className="slide" key={slide.id} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${escalaUtil})`, transformOrigin: 'center', background: isAct ? '#0B0E0B' : '#FFFFFF', color: isAct ? '#F2F5EF' : '#0B0F0C' }}>
          {isAct
            ? <Runtime config={slide.config} tool={tool} equiposApi={esEquipos ? equiposApi : null} />
            : <ContenidoSlide slide={slide} replay={idx} pasoActual={paso} />}
        </div>
      </div>

      {/* HUD: salir */}
      <div className="presenter-hud" style={{ top: 18, right: 18 }}>
        <button className="hud-btn" onClick={onExit} title="Salir (Esc)">✕ Salir</button>
      </div>

      {/* Sumar puntos: panel ARRASTRABLE. Por defecto abajo a la derecha, sobre
          la navegación, sin tapar el contenido. El docente puede moverlo. */}
      {repartePuntos && !esActEquipo && (
        <div className="presenter-hud panel-puntos"
          style={panelPos
            ? { left: panelPos.left, top: panelPos.top, flexDirection: 'column', alignItems: 'stretch', gap: 8, background: 'rgba(11,14,11,.88)', padding: '10px 14px', borderRadius: 16, backdropFilter: 'blur(6px)' }
            : { bottom: 78, right: 18, flexDirection: 'column', alignItems: 'stretch', gap: 8, background: 'rgba(11,14,11,.88)', padding: '10px 14px', borderRadius: 16, backdropFilter: 'blur(6px)' }}>
          {/* Asa de arrastre */}
          <div className="panel-grip" onPointerDown={arrastrePanel} title="Arrastra para mover">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#F2F5EF', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>
              <span style={{ color: 'rgba(255,255,255,.45)', fontSize: 16, cursor: 'grab' }}>⠿</span>
              🏆 ¿Quién acertó? <span style={{ color: '#F5C211' }}>+{valorActividad}</span>
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 360 }}>
            {equipos.map((e) => (
              <button key={e.id} onClick={() => sumarPunto(e.id)}
                style={{ border: ganadorActual === e.id ? '3px solid #fff' : '3px solid transparent', background: e.color, color: '#06140A', borderRadius: 12, padding: '8px 14px', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                +{valorActividad} {e.nombre}
              </button>
            ))}
          </div>
          {panelPos && (
            <button onClick={() => setPanelPos(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,.45)', fontSize: 11.5, cursor: 'pointer', textAlign: 'center' }}>
              ↺ Volver a su lugar
            </button>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="presenter-hud" style={{ bottom: 18, right: 18 }}>
        <button className="hud-btn" onClick={retroceder} disabled={enInicio} style={{ opacity: enInicio ? .35 : 1 }}>←</button>
        <button className="hud-btn" onClick={avanzar} disabled={enFinal} style={{ opacity: enFinal ? .35 : 1 }}>→</button>
      </div>
      <div className="presenter-hud" style={{ bottom: 18, left: marcadorAncho + 18, color: 'rgba(255,255,255,.55)', fontSize: 14, fontWeight: 600 }}>
        <span style={{ fontFamily: 'var(--font-display)' }}>{pres.tema}</span>
        <span style={{ opacity: .6 }}>·</span>
        <span>{idx + 1} / {slides.length}</span>
      </div>
    </div>
  );
}

Object.assign(window, { Presenter });
