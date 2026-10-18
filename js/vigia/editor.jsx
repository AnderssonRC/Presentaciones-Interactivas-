/* editor.jsx — Editor de Activaciones del Modo Vigía (recurso: Video).
   Mismo esquema de 3 columnas que el editor de presentaciones:
     [activaciones en orden de tiempo] [video + línea de tiempo + configuración] [tipos de activación]
   Arriba: el recurso elegido (habilita/deshabilita tipos), estudiantes de la
   ruleta y Presentar. Si aún no hay video, primero se pide el enlace.

   Documento guardado (en la colección de presentaciones, con clase 'vigia'):
     { id, clase: 'vigia', recurso: 'video', titulo, objetivo, usos, lastPresented,
       video: { url, id }, estudiantes: [..],
       activaciones: [{ id, tipo, t, texto, ruleta?, modo?, opciones?, correcta? }] } */

function VigiaEditor({ act, onChange, onBack, onPresent }) {
  const { TIPOS, RECURSOS, recurso, tipo, nuevaActivacion, fmtT } = VigiaTipos;
  const rec = recurso(act.recurso);
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [selId, setSelId] = React.useState(lista[0] ? lista[0].id : null);
  const [estOpen, setEstOpen] = React.useState(false);
  const [cambiandoVideo, setCambiandoVideo] = React.useState(false);
  const estRef = React.useRef(null);

  // Con el paso del enlace abierto no hay reproductor: el id va en null para
  // que, al volver, el reproductor se monte de nuevo en su contenedor.
  const hayVideo = !!(act.video && act.video.id) && !cambiandoVideo;
  const yt = useYouTube(hayVideo ? act.video.id : null, { controls: 1 });

  const update = (patch) => onChange({ ...act, ...patch });
  const setActivaciones = (arr) => update({ activaciones: arr.slice().sort((x, y) => x.t - y.t) });
  const sel = lista.find((a) => a.id === selId) || null;

  // Mientras el video avanza, la activación que se alcanza queda seleccionada
  // (así se ve "aparecer" en la lista y en la línea de tiempo).
  const prevT = React.useRef(0);
  React.useEffect(() => {
    const ant = prevT.current;
    prevT.current = yt.tiempo;
    if (!yt.reproduciendo || yt.tiempo - ant <= 0 || yt.tiempo - ant > 1.5) return;
    const alcanzada = lista.find((a) => a.t > ant && a.t <= yt.tiempo);
    if (alcanzada) setSelId(alcanzada.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yt.tiempo]);

  // Popover de estudiantes: se cierra con clic fuera o Escape.
  React.useEffect(() => {
    if (!estOpen) return;
    const fuera = (e) => { if (estRef.current && !estRef.current.contains(e.target)) setEstOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setEstOpen(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [estOpen]);

  const agregar = (tipoId) => {
    yt.pause();
    const a = nuevaActivacion(tipoId, yt.tiempo);
    setActivaciones([...(act.activaciones || []), a]);
    setSelId(a.id);
  };
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  const borrar = (id) => {
    if (!window.confirm('¿Eliminar esta activación?')) return;
    setActivaciones((act.activaciones || []).filter((x) => x.id !== id));
    if (selId === id) setSelId(null);
  };
  const seleccionar = (a) => { setSelId(a.id); yt.seek(a.t); };

  return (
    <div className="editor-shell vigia vg-editor" data-screen-label="Modo Vigía · Editor">
      {/* ---- barra superior ---- */}
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la activación"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo descubra con este recurso?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>

        {/* Recurso: decide qué tipos de activación se habilitan */}
        <div className="vg-recursos" role="radiogroup" aria-label="Recurso">
          {RECURSOS.map((r) => (
            <button key={r.id} role="radio" aria-checked={r.id === rec.id} disabled={r.pronto}
              className={'vg-recurso-chip' + (r.id === rec.id ? ' on' : '')}
              title={r.pronto ? r.nombre + ' · Próximamente' : r.desc}
              onClick={() => !r.pronto && update({ recurso: r.id })}>
              <Icon name={r.icon} size={14} /> {r.nombre}{r.pronto ? <span className="soon-tag">Pronto</span> : null}
            </button>
          ))}
        </div>

        {/* Estudiantes de la ruleta */}
        <div ref={estRef} style={{ position: 'relative' }}>
          <button className="btn" onClick={() => setEstOpen((o) => !o)} title="Lista de estudiantes para la ruleta">
            <Icon name="user" size={15} /> Estudiantes · {estudiantes.length}
          </button>
          {estOpen && (
            <div className="vg-popover">
              <div style={{ fontWeight: 800, marginBottom: 4 }}>Estudiantes para la ruleta</div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
                Uno por línea (puedes pegarlos desde Excel). La ruleta los usa en Preguntas, Creaciones y Notas de contexto, sin repetir hasta que todos hayan pasado.
              </div>
              <textarea rows={9} value={(act.estudiantes || []).join('\n')}
                onChange={(e) => update({ estudiantes: e.target.value.split('\n').map((s) => s.replace(/^\s*\d+[.)-]?\s+/, '').replace(/\t/g, ' ')) })}
                placeholder={'Ana María López\nCarlos Pérez\n…'} className="vg-textarea" />
            </div>
          )}
        </div>

        <button className="btn vigia-btn-crear" onClick={() => { yt.pause(); onPresent(); }} disabled={!(act.video && act.video.id)}
          title={act.video && act.video.id ? 'Presentar el video con sus activaciones' : 'Primero añade el enlace del video'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      {!hayVideo ? (
        <PasoEnlace actual={act.video && act.video.url}
          onListo={(url, id) => { update({ video: { url, id } }); setCambiandoVideo(false); }}
          onCancelar={act.video && act.video.id ? () => setCambiandoVideo(false) : null} />
      ) : (
        <div className="editor-body">
          {/* ---- columna 1: activaciones en orden de tiempo ---- */}
          <div className="editor-list">
            <div className="kicker" style={{ padding: '2px 4px' }}>Activaciones · {lista.length}</div>
            {!lista.length && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px' }}>
                Reproduce el video, detente donde quieras activar al grupo y elige un tipo a la derecha.
              </div>
            )}
            {lista.map((a) => {
              const ti = tipo(a.tipo);
              return (
                <button key={a.id} className={'slide-thumb vg-thumb' + (a.id === selId ? ' active' : '')} onClick={() => seleccionar(a)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.08em' }}>
                    <span className="vg-dot" style={{ background: ti.color }}></span>
                    {fmtT(a.t)} · {ti.nombre.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.texto || 'Sin texto aún'}
                  </span>
                  <span className="thumb-actions">
                    <span className="thumb-action" role="button" title="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(a.id); }}>✕</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- columna 2: video + línea de tiempo + configuración ---- */}
          <div className="editor-canvas-col">
            <div className="vg-video-marco">
              <div ref={yt.montaje} className="vg-video"></div>
              {yt.error && <div className="vg-video-error">{yt.error}</div>}
            </div>
            <LineaTiempo duracion={yt.duracion} tiempo={yt.tiempo} activaciones={lista} selId={selId}
              onSeek={yt.seek} onSelect={seleccionar} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)', marginTop: -8 }}>
              <span>Las activaciones nuevas se insertan en <strong style={{ color: 'var(--ink)' }}>{fmtT(yt.tiempo)}</strong>.</span>
              <span style={{ flex: 1 }}></span>
              <button className="vg-btn-texto" onClick={() => setCambiandoVideo(true)}>Cambiar video</button>
            </div>

            {sel ? (
              <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)}
                tiempoActual={yt.tiempo} duracion={yt.duracion} hayEstudiantes={estudiantes.length > 0}
                onAbrirEstudiantes={() => setEstOpen(true)} onIr={() => yt.seek(sel.t)} />
            ) : (
              <div className="config-card" style={{ color: 'var(--muted)', fontSize: 14 }}>
                Selecciona una activación de la lista o de la línea de tiempo para editarla.
              </div>
            )}
          </div>

          {/* ---- columna 3: tipos de activación ---- */}
          <div className="editor-tools">
            <div>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activación</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                Se agrega en el segundo actual del video (lo pausa). Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
              </p>
            </div>
            {TIPOS.map((t) => {
              const habilitado = rec.tipos.includes(t.id);
              return (
                <button key={t.id} className={'tool-card vg-tipo' + (habilitado ? '' : ' tool-soon')} disabled={!habilitado}
                  onClick={() => habilitado && agregar(t.id)}
                  title={habilitado ? 'Añadir ' + t.nombre + ' en ' + fmtT(yt.tiempo) : 'No disponible para ' + rec.nombre}>
                  <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                  </span>
                  <span className="tool-add">+</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Primer paso: pegar el enlace de YouTube. */
function PasoEnlace({ actual, onListo, onCancelar }) {
  const [url, setUrl] = React.useState(actual || '');
  const [error, setError] = React.useState('');
  const usar = () => {
    const id = idDeYouTube(url);
    if (!id) { setError('Ese enlace no parece de YouTube. Copia la dirección del video (youtube.com/watch?v=… o youtu.be/…).'); return; }
    onListo(url.trim(), id);
  };
  const id = idDeYouTube(url);
  return (
    <div className="vg-paso">
      <div className="vg-paso-card">
        <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
        <div className="kicker" style={{ color: 'var(--vigia-naranja)', marginTop: 14 }}>Paso 1 · Recurso de video</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 6px' }}>Añade el enlace del video</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14.5 }}>
          Por ahora, videos de YouTube: documentales, clases, entrevistas… Luego marcarás en su línea de tiempo dónde se detiene para activar al grupo.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="vg-input" value={url} autoFocus placeholder="https://www.youtube.com/watch?v=…"
            onChange={(e) => { setUrl(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') usar(); }} />
          <button className="btn vigia-btn-crear" onClick={usar}>Usar video</button>
        </div>
        {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5, marginTop: 10 }}>{error}</div>}
        {id && !error && (
          <img src={'https://img.youtube.com/vi/' + id + '/mqdefault.jpg'} alt="Vista previa del video" className="vg-paso-mini" />
        )}
        {onCancelar && <button className="vg-btn-texto" style={{ marginTop: 14 }} onClick={onCancelar}>Cancelar</button>}
      </div>
    </div>
  );
}

/* Línea de tiempo: marcas de las activaciones + cabezal; clic para saltar. */
function LineaTiempo({ duracion, tiempo, activaciones, selId, onSeek, onSelect }) {
  const { tipo, fmtT } = VigiaTipos;
  const total = Math.max(duracion || 0, ...activaciones.map((a) => a.t + 5), 1);
  const pct = (t) => Math.min(100, Math.max(0, (t / total) * 100)) + '%';
  const barra = React.useRef(null);
  const saltar = (e) => {
    const r = barra.current.getBoundingClientRect();
    onSeek(((e.clientX - r.left) / r.width) * total);
  };
  return (
    <div className="vg-linea">
      <div className="vg-linea-barra" ref={barra} onClick={saltar} title="Clic para ir a ese momento">
        <div className="vg-linea-progreso" style={{ width: pct(tiempo) }}></div>
        {activaciones.map((a) => {
          const ti = tipo(a.tipo);
          return (
            <button key={a.id} className={'vg-marca' + (a.id === selId ? ' sel' : '')}
              style={{ left: pct(a.t), background: ti.color }}
              onClick={(e) => { e.stopPropagation(); onSelect(a); }}
              title={fmtT(a.t) + ' · ' + ti.nombre + (a.texto ? ': ' + a.texto : '')}>
              <Icon name={ti.icon} size={13} />
            </button>
          );
        })}
        <div className="vg-linea-cabezal" style={{ left: pct(tiempo) }}></div>
      </div>
      <div className="vg-linea-tiempos">
        <span>{fmtT(tiempo)}</span>
        <span>{duracion ? fmtT(duracion) : '–:––'}</span>
      </div>
    </div>
  );
}

/* Configuración de la activación seleccionada. */
function ConfigActivacion({ a, onCambiar, onBorrar, tiempoActual, duracion, hayEstudiantes, onAbrirEstudiantes, onIr }) {
  const { tipo, fmtT, parseT } = VigiaTipos;
  const ti = tipo(a.tipo);
  const set = (patch) => onCambiar({ ...a, ...patch });
  const [tTexto, setTTexto] = React.useState(fmtT(a.t));
  React.useEffect(() => { setTTexto(fmtT(a.t)); }, [a.t]);
  const fijarT = (txt) => {
    const v = parseT(txt);
    if (v === null) { setTTexto(fmtT(a.t)); return; }
    set({ t: Math.max(0, Math.min(duracion || v, v)) });
  };

  const opciones = a.opciones && a.opciones.length ? a.opciones : ['', ''];
  const setOpcion = (i, v) => set({ opciones: opciones.map((o, j) => (j === i ? v : o)) });
  // Al quitar una opción, la correcta sigue apuntando a la misma (o a la A si era esa).
  const quitarOpcion = (i) => {
    const c = a.correcta || 0;
    set({ opciones: opciones.filter((_, j) => j !== i), correcta: c === i ? 0 : (c > i ? c - 1 : c) });
  };

  return (
    <div className="config-card vg-config" style={{ borderColor: ti.color + '66' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="tool-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={20} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>{ti.nombre}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ti.proposito}</div>
        </div>
        <button className="btn btn-sm" onClick={onBorrar}>Eliminar</button>
      </div>

      <div className="field">
        <label>Aparece en el minuto</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" value={tTexto} style={{ maxWidth: 110 }}
            onChange={(e) => setTTexto(e.target.value)} onBlur={(e) => fijarT(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fijarT(e.target.value); }} />
          <button className="btn btn-sm" onClick={() => set({ t: Math.round(tiempoActual) })}>Usar el momento actual ({fmtT(tiempoActual)})</button>
          <button className="btn btn-sm" onClick={onIr}>Ir a {fmtT(a.t)}</button>
        </div>
      </div>

      {a.tipo === 'pregunta' && (
        <div className="field">
          <label>Tipo de pregunta</label>
          <div className="vg-segmento" role="radiogroup">
            {[['abierta', 'Abierta'], ['cerrada', 'Cerrada (opción múltiple)']].map(([v, t]) => (
              <button key={v} role="radio" aria-checked={(a.modo || 'abierta') === v}
                className={(a.modo || 'abierta') === v ? 'on' : ''} onClick={() => set({ modo: v })}>{t}</button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>{ti.etiqueta}</label>
        <textarea rows={a.tipo === 'contexto' || a.tipo === 'escritura' ? 5 : 3} value={a.texto || ''}
          onChange={(e) => set({ texto: e.target.value })} placeholder={ti.placeholder}></textarea>
        {a.tipo === 'escritura' && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
            Se mostrará grande, en una hoja rayada fácil de leer desde el fondo del salón. Mejor frases cortas.
          </div>
        )}
      </div>

      {a.tipo === 'pregunta' && a.modo === 'cerrada' && (
        <div className="field">
          <label>Opciones (marca la correcta)</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {opciones.map((o, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className={'vg-correcta' + ((a.correcta || 0) === i ? ' on' : '')} onClick={() => set({ correcta: i })}
                  title="Marcar como correcta">{String.fromCharCode(65 + i)}</button>
                <input type="text" value={o} onChange={(e) => setOpcion(i, e.target.value)} placeholder={'Opción ' + String.fromCharCode(65 + i)} />
                {opciones.length > 2 && (
                  <button className="thumb-action" title="Quitar opción" onClick={() => quitarOpcion(i)}>✕</button>
                )}
              </div>
            ))}
            {opciones.length < 4 && (
              <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => set({ opciones: [...opciones, ''] })}>+ Opción</button>
            )}
          </div>
        </div>
      )}

      {ti.ruleta && (
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!a.ruleta} onChange={(e) => set({ ruleta: e.target.checked })} />
            Usar la ruleta: {ti.preguntaRuleta}
          </label>
          {a.ruleta && !hayEstudiantes && (
            <div style={{ fontSize: 12.5, color: 'var(--naranja-ink)', marginTop: 6 }}>
              Aún no hay estudiantes. <button className="vg-btn-texto" onClick={onAbrirEstudiantes}>Agrégalos aquí</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VigiaEditor, PasoEnlace, LineaTiempo, ConfigActivacion });
