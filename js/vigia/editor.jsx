/* editor.jsx — Editor de Activaciones del Modo Vigía (recurso: Video).
   Mismo esquema de 3 columnas que el editor de presentaciones:
     [activaciones en orden de tiempo] [video + línea de tiempo + configuración] [tipos de activación]
   Arriba: el recurso elegido (habilita/deshabilita tipos), estudiantes de la
   ruleta y Presentar. Si aún no hay video, primero se pide el enlace.

   Documento guardado (en la colección de presentaciones, con clase 'vigia'):
     { id, clase: 'vigia', recurso: 'video', titulo, objetivo, usos, lastPresented,
       video: { url, id }, estudiantes: [..],
       activaciones: [{ id, tipo, t, texto, ruleta?, modo?, opciones?, correcta? }] } */

/* Elige el editor según el recurso y el formato (cada uno con sus propios hooks).
   Documento: EPUB si su archivo es EPUB; si no (o aún no hay archivo), PDF,
   que es el que muestra el paso de subir el archivo. */
function VigiaEditor(props) {
  const { act } = props;
  let editor;
  if (act.recurso === 'podcast') editor = <VigiaEditorPodcast {...props} />;
  else if (act.recurso === 'imagenes') editor = <VigiaEditorImagenes {...props} />;
  else if (act.recurso !== 'documento') editor = <VigiaEditorVideo {...props} />;
  else editor = act.pdf && act.pdf.formato === 'epub' && (act.pdf.driveId || act.pdf.local)
    ? <VigiaEditorEpub {...props} /> : <VigiaEditorPdf {...props} />;
  // Las listas de estudiantes guardadas llegan a EstudiantesPopover por contexto.
  return (
    <ListasCtx.Provider value={{ listas: props.listas || [], guardar: props.onGuardarListas || null }}>
      {editor}
    </ListasCtx.Provider>
  );
}

/* Listas de estudiantes guardadas (un solo documento 'vigia-listas', ver
   app.jsx): [{ id, nombre, estudiantes: [nombres], orden }]. Solo nombres. */
const ListasCtx = React.createContext({ listas: [], guardar: null });
const limpiarNombres = (arr) => (arr || []).map((s) => (s || '').trim()).filter(Boolean);
const mismaLista = (a, b) => { const x = limpiarNombres(a), y = limpiarNombres(b); return x.length === y.length && x.every((n, i) => n === y[i]); };

/* Selector de recurso de la barra superior. Solo deja cambiarlo mientras la
   activación está vacía (sin recurso ni activadores), porque cada recurso
   guarda sus datos de forma distinta. */
function RecursoChips({ act, update }) {
  const { RECURSOS, recurso, recursoListo } = VigiaTipos;
  const rec = recurso(act.recurso);
  const vacia = !recursoListo(act) && !(act.activaciones || []).length;
  return (
    <div className="vg-recursos" role="radiogroup" aria-label="Recurso">
      {RECURSOS.map((r) => {
        const bloqueado = r.pronto || (!vacia && r.id !== rec.id);
        return (
          <button key={r.id} role="radio" aria-checked={r.id === rec.id} disabled={bloqueado}
            className={'vg-recurso-chip' + (r.id === rec.id ? ' on' : '')}
            title={r.pronto ? r.nombre + ' · Próximamente' : (bloqueado ? 'Para cambiar de recurso, crea una activación nueva' : r.desc)}
            onClick={() => !bloqueado && update({ recurso: r.id })}>
            <Icon name={r.icon} size={14} /> {r.nombre}{r.pronto ? <span className="soon-tag">Pronto</span> : null}
          </button>
        );
      })}
    </div>
  );
}

/* Lista de estudiantes de la ruleta + orden de los nombres (barra superior). */
function EstudiantesPopover({ act, update, abierto, setAbierto }) {
  const ref = React.useRef(null);
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  React.useEffect(() => {
    if (!abierto) return;
    // Los cuadros de diálogo (vigiaPreguntar…) no cierran el panel.
    const enDialogo = (e) => !!(e.target && e.target.closest && e.target.closest('.vgd-fondo'));
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target) && !enDialogo(e)) setAbierto(false); };
    const esc = (e) => { if (e.key === 'Escape' && !document.querySelector('.vgd-fondo')) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fuera); document.removeEventListener('keydown', esc); };
  }, [abierto]);
  const orden = act.ordenNombres || 'apellidos';

  // --- Listas guardadas ---
  const { listas, guardar } = React.useContext(ListasCtx);
  const vinculada = listas.find((l) => l.id === act.listaId) || null;
  const cambiada = vinculada && !mismaLista(vinculada.estudiantes, act.estudiantes);
  const usarLista = (id) => {
    const l = listas.find((x) => x.id === id);
    if (!l) return;
    const cargar = () => update({ estudiantes: l.estudiantes.slice(), ordenNombres: l.orden || 'apellidos', listaId: l.id });
    if (estudiantes.length && !mismaLista(l.estudiantes, act.estudiantes) && !vinculada) {
      vigiaConfirmar('Los nombres que tiene ahora esta activación se reemplazarán por los de «' + l.nombre + '».',
        { titulo: 'Usar otra lista', aceptar: 'Usar «' + l.nombre + '»' }).then((ok) => { if (ok) cargar(); });
    } else cargar();
  };
  const guardarComoNueva = () => {
    if (!guardar || !estudiantes.length) return;
    vigiaPreguntar('Ponle un nombre para encontrarla rápido en cualquier activación.',
      { titulo: 'Guardar lista de estudiantes', placeholder: 'Ej.: 10°A, Filosofía 11°B', aceptar: 'Guardar lista' })
      .then((nombre) => {
        if (!nombre) return;
        const nueva = { id: AIP.uid(), nombre, estudiantes: estudiantes.slice(), orden };
        guardar([...listas, nueva]);
        update({ listaId: nueva.id });
      });
  };
  const actualizarVinculada = () => {
    if (!guardar || !vinculada) return;
    guardar(listas.map((l) => (l.id === vinculada.id ? { ...l, estudiantes: estudiantes.slice(), orden } : l)));
  };
  const borrarVinculada = async () => {
    if (!guardar || !vinculada) return;
    vigiaConfirmar('Se borrará la lista guardada «' + vinculada.nombre + '». Esta activación conserva sus nombres.',
      { titulo: 'Borrar lista', aceptar: 'Borrar', peligro: true }).then((ok) => {
      if (!ok) return;
      guardar(listas.filter((l) => l.id !== vinculada.id));
      update({ listaId: null });
    });
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn" onClick={() => setAbierto((o) => !o)} title="Lista de estudiantes para la ruleta">
        <Icon name="user" size={15} /> {vinculada ? vinculada.nombre : 'Estudiantes'} · {estudiantes.length}
      </button>
      {abierto && (
        <div className="vg-popover">
          {/* Listas guardadas: elegir una la carga aquí */}
          <div className="vg-listas">
            <div style={{ fontWeight: 800, fontSize: 13 }}>Listas guardadas</div>
            <select className="vg-listas-select" value={vinculada ? vinculada.id : ''} onChange={(e) => usarLista(e.target.value)}>
              <option value="" disabled>{listas.length ? 'Elegir una lista…' : 'Aún no hay listas guardadas'}</option>
              {listas.map((l) => <option key={l.id} value={l.id}>{l.nombre} · {limpiarNombres(l.estudiantes).length}</option>)}
            </select>
            <div className="vg-listas-acciones">
              {vinculada && cambiada && (
                <button type="button" className="vg-mini-accion on" onClick={actualizarVinculada} title="Guardar los cambios de abajo en la lista">
                  ↑ Actualizar «{vinculada.nombre}»
                </button>
              )}
              <button type="button" className="vg-mini-accion" onClick={guardarComoNueva} disabled={!estudiantes.length || !guardar}>
                + Guardar como lista nueva
              </button>
              {vinculada && (
                <button type="button" className="vg-mini-accion" onClick={borrarVinculada} title="Borrar esta lista guardada">Borrar lista</button>
              )}
            </div>
            {vinculada && !cambiada && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Usando «{vinculada.nombre}».</div>}
            {cambiada && <div style={{ fontSize: 12, color: 'var(--naranja-ink)' }}>Cambiaste nombres: puedes actualizar la lista guardada.</div>}
          </div>
          <div style={{ fontWeight: 800, marginBottom: 4 }}>Estudiantes para la ruleta</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 10 }}>
            Uno por línea (puedes pegarlos desde Excel). La ruleta no repite a nadie hasta que todos hayan pasado.
          </div>
          <textarea rows={9} value={(act.estudiantes || []).join('\n')}
            onChange={(e) => update({ estudiantes: e.target.value.split('\n').map((s) => s.replace(/^\s*\d+[.)-]?\s+/, '').replace(/\t/g, ' ')) })}
            placeholder={'Ana María López\nCarlos Pérez\n…'} className="vg-textarea" />
          <div style={{ fontWeight: 700, fontSize: 13, margin: '12px 0 6px' }}>Mi lista está escrita como</div>
          <div className="vg-segmento" role="radiogroup">
            {[['apellidos', 'Apellidos Nombres'], ['nombres', 'Nombres Apellidos']].map(([v, t]) => (
              <button key={v} role="radio" aria-checked={orden === v}
                className={orden === v ? 'on' : ''} onClick={() => update({ ordenNombres: v })}>{t}</button>
            ))}
          </div>
          {estudiantes[0] && (
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>
              En la ruleta: <strong style={{ color: 'var(--ink)' }}>{etiquetasRuleta(estudiantes, orden)[0]}</strong>
              {' '}· Al salir: <strong style={{ color: 'var(--ink)' }}>{nombreAnuncio(estudiantes[0], orden)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VigiaEditorVideo({ act, onChange, onBack, onPresent }) {
  const { TIPOS, recurso, tipo, nuevaActivacion, fmtT } = VigiaTipos;
  const rec = recurso(act.recurso);
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [selId, setSelId] = React.useState(lista[0] ? lista[0].id : null);
  const [estOpen, setEstOpen] = React.useState(false);
  const [cambiandoVideo, setCambiandoVideo] = React.useState(false);

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


  const agregar = (tipoId) => {
    yt.pause();
    const a = nuevaActivacion(tipoId, yt.tiempo);
    setActivaciones([...(act.activaciones || []), a]);
    setSelId(a.id);
  };
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar esta activación?', { aceptar: 'Sí, eliminar', peligro: true })) return;
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

        {/* Recurso (decide qué tipos se habilitan) y estudiantes de la ruleta */}
        <RecursoChips act={act} update={update} />
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />

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
              onSeek={yt.seek} onSelect={seleccionar}
              onMover={(a, t) => { cambiar({ ...a, t }); setSelId(a.id); }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)', marginTop: -8, flexWrap: 'wrap', width: '100%', maxWidth: 980 }}>
              {/* Minuto exacto donde se insertan las activaciones nuevas. */}
              <MinutoExacto tiempo={yt.tiempo} duracion={yt.duracion} onIr={(t) => { yt.seek(t); yt.pause(); }} />
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
            <TiposAgrupados lista={TIPOS} render={(t) => {
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
            }} />
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

/* Columna de tipos reunida por grupos: "Cognitivos" y "Físico-grupales"
   (título antes del primero de cada grupo). `render(t)`: la tarjeta del tipo. */
function TiposAgrupados({ lista, render }) {
  // Un bloque por grupo, en el orden en que aparecen.
  const grupos = [];
  lista.forEach((t) => {
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.id === t.grupo) ultimo.tipos.push(t);
    else grupos.push({ id: t.grupo, tipos: [t] });
  });
  return grupos.map((g) => <GrupoTipos key={g.id} grupo={g.id} tipos={g.tipos} render={render} />);
}

/* Tarjeta desplegable de un grupo ("Activadores Cognitivos"…). Abierta o
   cerrada se recuerda en este computador. */
function GrupoTipos({ grupo, tipos, render }) {
  const info = VigiaTipos.GRUPOS[grupo] || { nombre: grupo, desc: '' };
  const clave = 'vigia_grupo_' + grupo;
  const [abierto, setAbiertoEstado] = React.useState(() => { try { return localStorage.getItem(clave) !== '0'; } catch (e) { return true; } });
  const setAbierto = (v) => { setAbiertoEstado(v); try { localStorage.setItem(clave, v ? '1' : '0'); } catch (e) { /* */ } };
  return (
    <div className={'vg-grupo-card ' + grupo + (abierto ? ' abierto' : '')}>
      <button type="button" className="vg-grupo-cabeza" onClick={() => setAbierto(!abierto)} aria-expanded={abierto}>
        <span className="vg-grupo-iconos" aria-hidden="true">
          {tipos.slice(0, 3).map((t) => <span key={t.id} style={{ background: t.color }}><Icon name={t.icon} size={11} /></span>)}
        </span>
        <span style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <span className="vg-grupo-nombre">{info.titulo || 'Activadores ' + info.nombre}</span>
          <small>{info.desc} · {tipos.length}</small>
        </span>
        <span className="vg-grupo-flecha" aria-hidden="true">▾</span>
      </button>
      {abierto && <div className="vg-grupo-cuerpo">{tipos.map((t) => <React.Fragment key={t.id}>{render(t)}</React.Fragment>)}</div>}
    </div>
  );
}

/* "Insertar en el minuto [mm:ss]": escribir un minuto exacto lleva el video
   ahí (en pausa) y las activaciones nuevas se crean en ese segundo. Con
   −5s / −1s / +1s / +5s se ajusta fino. Mientras no se escribe, muestra el
   minuto actual del video. */
function MinutoExacto({ tiempo, duracion, onIr, avisoYouTube = true }) {
  const { fmtT, parseT } = VigiaTipos;
  // Opción que se activa con un botón (se recuerda en este computador).
  const [activo, setActivoEstado] = React.useState(() => {
    try { return localStorage.getItem('vigia_minuto_exacto') === '1'; } catch (e) { return false; }
  });
  const setActivo = (v) => { setActivoEstado(v); try { localStorage.setItem('vigia_minuto_exacto', v ? '1' : '0'); } catch (e) { /* */ } };
  const [texto, setTexto] = React.useState(null);   // null = mostrando el tiempo del video
  const [error, setError] = React.useState(false);
  const inicial = React.useRef(null);   // lo que mostraba al entrar al campo
  const yaConfirmado = React.useRef(false);   // Enter ya confirmó: el blur que sigue no repite
  const limite = (t) => Math.max(0, Math.min(duracion || t, t));
  const ir = (t) => { setError(false); setTexto(null); onIr(limite(Math.round(t))); };
  const confirmar = () => {
    if (yaConfirmado.current) { yaConfirmado.current = false; return; }
    if (texto === null) return;
    if (texto === inicial.current) { setTexto(null); return; }   // sin cambios: no mueve el video
    const v = parseT(texto);
    if (v === null) { setError(true); return; }
    ir(v);
  };
  if (!activo) {
    return (
      <div className="vg-minuto-exacto">
        <span>Las activaciones nuevas se insertan en <strong style={{ color: 'var(--ink)' }}>{fmtT(tiempo)}</strong>.</span>
        <button type="button" className="vg-mini-accion" onClick={() => setActivo(true)}
          title="Escribir un minuto exacto (mm:ss) y ajustarlo segundo a segundo">⏱ Minuto exacto</button>
      </div>
    );
  }
  return (
    <div className="vg-minuto-exacto-caja">
    <div className="vg-minuto-exacto">
      <button type="button" className="vg-mini-accion on" onClick={() => setActivo(false)} title="Ocultar el minuto exacto">⏱ Minuto exacto ✕</button>
      <span>Insertar en el minuto</span>
      <input type="text" inputMode="numeric" className={'vg-minuto-campo' + (error ? ' error' : '')}
        value={texto === null ? fmtT(tiempo) : texto} placeholder="mm:ss"
        onFocus={(e) => { const t = fmtT(tiempo); inicial.current = t; setTexto(t); setTimeout(() => e.target.select(), 0); }}
        onChange={(e) => { setTexto(e.target.value); setError(false); }}
        onBlur={confirmar}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); confirmar(); yaConfirmado.current = true; e.target.blur(); }
          if (e.key === 'Escape') { setTexto(null); setError(false); yaConfirmado.current = true; e.target.blur(); }
        }}
        title="Escribe el minuto exacto (p. ej. 16:40 o 1:02:15) y presiona Enter" />
      {[-5, -1, 1, 5].map((d) => (
        <button key={d} type="button" className="vg-mini-accion" onClick={() => ir(Math.floor(tiempo) + d)}
          title={(d > 0 ? 'Adelantar ' : 'Retroceder ') + Math.abs(d) + ' s'}>{(d > 0 ? '+' : '−') + Math.abs(d) + 's'}</button>
      ))}
      {error && <span style={{ color: 'var(--naranja-ink)' }}>Usa el formato mm:ss</span>}
    </div>
    {avisoYouTube && (
      <div className="vg-minuto-aviso">
        ⏳ Por cómo funciona YouTube, al saltar a un minuto exacto el video puede <strong>volver por un momento a un minuto anterior</strong>.
        Ten paciencia: espera un par de segundos a que llegue antes de volver a intentarlo.
      </div>
    )}
    </div>
  );
}

/* Línea de tiempo: marcas de las activaciones + cabezal; clic para saltar.
   Las marcas se pueden ARRASTRAR a otro segundo (`onMover(item, t)` guarda
   el cambio); un clic sin arrastrar las selecciona.
   `imagenes` (podcast, opcional): miniaturas bajo la barra donde cambia la
   imagen (también arrastrables, con `onMoverImagen`). */
function LineaTiempo({ duracion, tiempo, activaciones, selId, onSeek, onSelect, imagenes, onMover, onMoverImagen }) {
  const { tipo, fmtT } = VigiaTipos;
  const [arrastre, setArrastre] = React.useState(null);   // { id, t } mientras se arrastra
  const total = Math.max(duracion || 0, ...activaciones.map((a) => a.t + 5), ...(imagenes || []).map((x) => x.t + 5), 1);
  const pct = (t) => Math.min(100, Math.max(0, (t / total) * 100)) + '%';
  const tDe = (item) => (arrastre && arrastre.id === item.id ? arrastre.t : item.t);
  const barra = React.useRef(null);
  const saltar = (e) => {
    const r = barra.current.getBoundingClientRect();
    onSeek(((e.clientX - r.left) / r.width) * total);
  };
  // Arrastrar una marca: se mueve con el mouse (segundo a segundo) y al
  // soltar se guarda. Si casi no se movió, cuenta como clic (seleccionar).
  const empezarArrastre = (e, item, onMov) => {
    if (e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX;
    let movido = false, tFinal = item.t;
    const mover = (ev) => {
      if (!movido && Math.abs(ev.clientX - x0) < 4) return;
      movido = true;
      const r = barra.current.getBoundingClientRect();
      const ancho = duracion || total;
      tFinal = Math.round(Math.max(0, Math.min(ancho, ((ev.clientX - r.left) / r.width) * total)));
      setArrastre({ id: item.id, t: tFinal });
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setArrastre(null);
      if (movido && onMov) { if (tFinal !== item.t) onMov(item, tFinal); }
      else onSelect(item);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };
  // Imágenes del mismo segundo: miniaturas una al lado de la otra (no encimadas).
  const imgs = (imagenes || []).map((x) => ({ ...x, t: tDe(x) })).sort((a, b) => a.t - b.t);
  const lado = {};
  const posLado = (x) => { const k = Math.round(x.t); lado[k] = (lado[k] || 0) + 1; return lado[k] - 1; };
  return (
    <div className={'vg-linea' + (arrastre ? ' arrastrando' : '')}>
      {/* Minuto al que va la marca que se arrastra. */}
      {arrastre && <span className="vg-marca-hora" style={{ left: pct(arrastre.t) }}>{fmtT(arrastre.t)}</span>}
      <div className="vg-linea-barra" ref={barra} onClick={saltar} title="Clic para ir a ese momento">
        <div className="vg-linea-progreso" style={{ width: pct(tiempo) }}></div>
        {activaciones.map((a) => {
          const ti = tipo(a.tipo);
          const t = tDe(a);
          const moviendo = arrastre && arrastre.id === a.id;
          return (
            <button key={a.id} className={'vg-marca' + (a.id === selId ? ' sel' : '') + (moviendo ? ' moviendo' : '') + (onMover ? ' movible' : '')}
              style={{ left: pct(t), background: ti.color }}
              onPointerDown={(e) => empezarArrastre(e, a, onMover)}
              onClick={(e) => e.stopPropagation()}
              title={fmtT(a.t) + ' · ' + ti.nombre + (a.texto ? ': ' + a.texto : '') + (onMover ? ' · Arrastra para moverla' : '')}>
              <Icon name={ti.icon} size={13} />
            </button>
          );
        })}
        <div className="vg-linea-cabezal" style={{ left: pct(tiempo) }}></div>
      </div>
      {imgs.length > 0 && (
        <div className="vg-linea-imagenes">
          {/* Tramo en que se ve cada imagen: hasta su fin, la siguiente (de otro segundo) o el final. */}
          {imgs.map((x) => {
            const sig = imgs.find((y) => Math.round(y.t) > Math.round(x.t));
            const fin = Math.min(typeof x.fin === 'number' ? x.fin + (x.t - (imagenes.find((y) => y.id === x.id) || x).t) : total, sig ? sig.t : total);
            const ini = Math.min(100, Math.max(0, (x.t / total) * 100));
            return <span key={'tramo' + x.id} className={'vg-img-tramo' + (x.id === selId ? ' sel' : '')}
              style={{ left: ini + '%', width: Math.max(0, Math.min(100, (fin / total) * 100) - ini) + '%' }}></span>;
          })}
          {imgs.map((x) => {
            const n = posLado(x);
            const moviendo = arrastre && arrastre.id === x.id;
            return (
              <button key={x.id} className={'vg-marca-img' + (x.id === selId ? ' sel' : '') + (moviendo ? ' moviendo' : '') + (onMoverImagen ? ' movible' : '')}
                style={{ left: pct(x.t), transform: 'translateX(calc(-50% + ' + n * 44 + 'px))' }}
                onPointerDown={(e) => empezarArrastre(e, (imagenes.find((y) => y.id === x.id) || x), onMoverImagen)}
                title={fmtT(x.t) + ' · Imagen' + (onMoverImagen ? ' · Arrastra para moverla' : '')}>
                {x.url ? <img src={urlImagen(x.url)} alt="" referrerPolicy="no-referrer" draggable="false" /> : <Icon name="eye" size={12} />}
              </button>
            );
          })}
        </div>
      )}
      <div className="vg-linea-tiempos">
        <span>{fmtT(tiempo)}</span>
        <span>{duracion ? fmtT(duracion) : '–:––'}</span>
      </div>
    </div>
  );
}

/* Campo de texto que CRECE con su contenido: al pegar un texto largo se ve
   completo (hasta `max` px; desde ahí, barra de desplazamiento). */
function AreaTexto({ value, onChange, minRows = 2, max = 360, ...resto }) {
  const ref = React.useRef(null);
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(max, el.scrollHeight + 2) + 'px';
    el.style.overflowY = el.scrollHeight + 2 > max ? 'auto' : 'hidden';
  }, [value, max]);
  return <textarea ref={ref} rows={minRows} value={value} onChange={onChange} {...resto} style={{ resize: 'vertical', ...(resto.style || {}) }} />;
}

/* Etiqueta de un campo con acciones rápidas a la derecha: "Borrar" (vacía el
   campo, útil cuando el texto se leyó mal) y, si se da, "Leer de nuevo". */
function EtiquetaCampo({ texto, valor, onBorrar, onReleer }) {
  const [leyendo, setLeyendo] = React.useState(false);
  return (
    <div className="vg-etiqueta-campo">
      <label>{texto}</label>
      <span style={{ flex: 1 }}></span>
      {onReleer && (
        <button type="button" className="vg-mini-accion" disabled={leyendo}
          onClick={() => { setLeyendo(true); Promise.resolve(onReleer()).finally(() => setLeyendo(false)); }}
          title="Volver a tomar el texto que queda debajo de la marca">
          {leyendo ? 'Leyendo…' : '↻ Leer de nuevo'}
        </button>
      )}
      {valor && onBorrar && (
        <button type="button" className="vg-mini-accion" onClick={onBorrar} title="Borrar todo el texto de este campo">✕ Borrar</button>
      )}
    </div>
  );
}

/* Configuración de una activación. Sirve para los dos recursos:
     · Video (conTiempo): minuto en que aparece.
     · Documento (conTiempo={false}): `ubicacion` ("Página 2 · N.º 3") y el
       texto marcado (`fragmento`: leído solo del PDF o tomado de la selección
       en el EPUB), que se cita en la tarjeta. `onReleer`: vuelve a leerlo.
   `compacto`: versión para la tarjeta flotante sobre el documento (sin
   encabezado ni ubicación, que la tarjeta ya muestra). */
function ConfigActivacion({ a, onCambiar, onBorrar, tiempoActual, duracion, hayEstudiantes, onAbrirEstudiantes, onIr, conTiempo = true, ubicacion, compacto, onReleer, sinFragmento }) {
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

  // Imagen opcional (solo por URL): se activa con un botón y se muestra en la tarjeta.
  const [conImagen, setConImagen] = React.useState(!!a.imagen || !!ti.pideImagen);
  const quitarImagen = () => { const { imagen, ...resto } = a; onCambiar(resto); setConImagen(false); };

  const opciones = a.opciones && a.opciones.length ? a.opciones : ['', ''];
  const setOpcion = (i, v) => set({ opciones: opciones.map((o, j) => (j === i ? v : o)) });
  // Al quitar una opción, la correcta sigue apuntando a la misma (o a la A si era esa).
  const quitarOpcion = (i) => {
    const c = a.correcta || 0;
    set({ opciones: opciones.filter((_, j) => j !== i), correcta: c === i ? 0 : (c > i ? c - 1 : c) });
  };

  return (
    <div className={'config-card vg-config' + (compacto ? ' compacto' : '')} style={{ borderColor: ti.color + '66' }}>
      {!compacto && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="tool-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={20} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>{ti.nombre}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ti.proposito}</div>
          </div>
          <button className="btn btn-sm" onClick={onBorrar}>Eliminar</button>
        </div>
      )}

      {compacto ? null : conTiempo ? (
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
      ) : (
        <div className="field">
          <label>Ubicación en el documento</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', fontSize: 14 }}>
            <strong>{ubicacion}</strong>
            <button className="btn btn-sm" onClick={onIr}>Ver en el PDF</button>
          </div>
        </div>
      )}

      {!conTiempo && !sinFragmento && (
        <div className="field">
          <EtiquetaCampo texto="Texto marcado (opcional)" valor={a.fragmento}
            onBorrar={() => set({ fragmento: '' })} onReleer={onReleer} />
          <AreaTexto minRows={3} value={a.fragmento || ''} onChange={(e) => set({ fragmento: e.target.value })}
            placeholder="Escribe o pega aquí el fragmento (también puedes seleccionarlo en el documento y copiarlo)" />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
            Se tomó solo del documento: revísalo y corrige lo que haga falta. Se cita en la tarjeta al presentar; si queda vacío, no se muestra.
          </div>
        </div>
      )}

      {a.tipo === 'glosario' && (
        <div className="field">
          <EtiquetaCampo texto="Palabra o término" valor={a.termino} onBorrar={() => set({ termino: '' })} />
          <input type="text" value={a.termino || ''} onChange={(e) => set({ termino: e.target.value })} placeholder="Ej.: fotosíntesis" />
        </div>
      )}

      {/* Modo Jaguar: equipos, duelo por un punto, palabra secreta o actividad propia */}
      {ti.jaguar && (
        <div className="field vg-jaguar-config">
          <div className="vg-jaguar-aviso">
            <span className="vg-jaguar-aviso-ico"><Icon name="puno" size={16} /></span>
            <span>
              <strong>El Modo Jaguar dura toda la presentación.</strong> Empieza con el primer desafío (el jaguar con su voz),
              los equipos y sus puntos se mantienen en los siguientes («¡Que siga la LUCHA!») y <strong>termina mostrando al equipo ganador</strong> al salir de Presentar.
            </span>
          </div>
          {ti.propia && (
            <React.Fragment>
              <label>Nombre de tu actividad</label>
              <input type="text" value={a.tituloPropio || ''} maxLength={70} placeholder="Ej.: Carrera de conceptos"
                onChange={(e) => set({ tituloPropio: e.target.value })} />
            </React.Fragment>
          )}
          {ti.palabra && (
            <React.Fragment>
              <label style={{ marginTop: ti.propia ? 10 : 0 }}>Palabra secreta</label>
              <input type="text" value={a.palabra || ''} maxLength={40} placeholder="Ej.: democracia"
                onChange={(e) => set({ palabra: e.target.value })} />
              <span className="vg-jaguar-nota">Se muestra como espacios _ _ _ y los equipos proponen letras.</span>
            </React.Fragment>
          )}
          <div className="vg-jaguar-fila">
            <span title="Los equipos se forman en el primer desafío y se mantienen toda la presentación">Equipos (se forman en el primer desafío)</span>
            <div className="vg-segmento" role="radiogroup" aria-label="Número de equipos">
              {[2, 3, 4, 5, 6].map((n) => (
                <button key={n} role="radio" aria-checked={(a.equipos || 2) === n} className={(a.equipos || 2) === n ? 'on' : ''}
                  onClick={() => set({ equipos: n })}>{n}</button>
              ))}
            </div>
          </div>
          <label className="vg-jaguar-duelo">
            <input type="checkbox" checked={!!a.duelo} onChange={(e) => set({ duelo: e.target.checked })} />
            <span>⚔ Se enfrentan dos equipos por un punto</span>
          </label>
          <span className="vg-jaguar-nota" style={{ color: hayEstudiantes ? undefined : 'var(--naranja-ink)' }}>
            {hayEstudiantes
              ? 'Al presentar, los estudiantes se reparten al azar en los equipos. Los puntos se suman en el desafío, en el marcador (arriba a la izquierda) o desde el celular.'
              : <React.Fragment>Sin estudiantes, los equipos aparecen sin nombres. <button className="vg-btn-texto" onClick={onAbrirEstudiantes}>Agrégalos</button></React.Fragment>}
          </span>
        </div>
      )}

      {a.tipo === 'reto' && (
        <div className="field">
          <label>Reto</label>
          <div className="vg-retos">
            {VigiaTipos.RETOS.map((r) => (
              <button key={r.id} type="button" className={'vg-reto-op' + ((a.reto || 'puesto') === r.id ? ' on' : '')}
                onClick={() => set({ reto: r.id })} title={r.desc}>
                <strong>{r.nombre}</strong>
                <span>{r.desc}</span>
              </button>
            ))}
          </div>
          {VigiaTipos.reto(a.reto).usa === 'grupos' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, fontSize: 13 }}>
              <span>Estudiantes por grupo</span>
              <input type="number" min="2" max="10" value={a.tamGrupo || 4} style={{ width: 70 }}
                onChange={(e) => set({ tamGrupo: Math.max(2, Math.min(10, Number(e.target.value) || 4)) })} />
            </div>
          )}
          <div style={{ fontSize: 12.5, color: hayEstudiantes ? 'var(--muted)' : 'var(--naranja-ink)', marginTop: 6 }}>
            {hayEstudiantes
              ? 'Al presentar, las ' + ({ parejas: 'parejas', grupos: 'grupos', orden: 'posiciones del salón' })[VigiaTipos.reto(a.reto).usa] + ' se sortean con la lista de estudiantes.'
              : <React.Fragment>Sin estudiantes solo se muestra el reto. <button className="vg-btn-texto" onClick={onAbrirEstudiantes}>Agrégalos para sortear parejas o grupos</button></React.Fragment>}
          </div>
        </div>
      )}

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
        <EtiquetaCampo texto={ti.etiqueta} valor={a.texto} onBorrar={() => set({ texto: '' })} />
        <AreaTexto minRows={a.tipo === 'contexto' || a.tipo === 'escritura' ? 4 : 3} value={a.texto || ''}
          onChange={(e) => set({ texto: e.target.value })} placeholder={ti.placeholder} />
        {a.tipo === 'escritura' && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
            Se mostrará grande, en una hoja rayada fácil de leer desde el fondo del salón. Mejor frases cortas.
          </div>
        )}
      </div>

      {a.tipo === 'glosario' && (
        <div className="field">
          <EtiquetaCampo texto="Definición construida en clase" valor={a.definicion} onBorrar={() => set({ definicion: '' })} />
          <AreaTexto minRows={3} value={a.definicion || ''} onChange={(e) => set({ definicion: e.target.value })}
            placeholder="Se escribe en vivo al presentar, con los aportes del grupo. Queda guardada aquí." />
        </div>
      )}

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

      {/* Imagen del activador (opcional, por URL) */}
      <div className="field">
        {!conImagen ? (
          <button type="button" className="vg-mini-accion vg-agregar-img" onClick={() => setConImagen(true)}
            title="Mostrar una imagen en la tarjeta al presentar">🖼 Agregar imagen (URL)</button>
        ) : (
          <div className="vg-act-img-editor">
            <div className="vg-etiqueta-campo">
              <label>Imagen en la tarjeta (URL)</label>
              <span style={{ flex: 1 }}></span>
              <button type="button" className="vg-mini-accion" onClick={quitarImagen}>✕ Quitar imagen</button>
            </div>
            <div className="vg-act-img-fila">
              <MiniImagen src={a.imagen ? urlImagen(a.imagen) : ''} vacia="Pega la URL →" />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <CampoUrlImagen valor={a.imagen || ''} onCambiar={(url) => set({ imagen: url })} autoFocus={!a.imagen} />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Se muestra en la tarjeta al presentar. {AYUDA_IMAGEN}</span>
              </div>
            </div>
          </div>
        )}
      </div>

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

      {compacto && (
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBorrar}>Eliminar activador</button>
      )}
    </div>
  );
}

Object.assign(window, { AreaTexto, EtiquetaCampo, VigiaEditor, VigiaEditorVideo, RecursoChips, EstudiantesPopover, PasoEnlace, MinutoExacto, LineaTiempo, ConfigActivacion, TiposAgrupados });
