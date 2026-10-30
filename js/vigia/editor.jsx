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
    <ListasCtx.Provider value={{ listas: props.listas || [], guardar: props.onGuardarListas || null, act }}>
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
            {/* Vista previa de la activación seleccionada (o el encabezado de siempre). */}
            <VistaPrevia a={sel} act={act}>
            <div>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activación</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                Se agrega en el segundo actual del video (lo pausa). Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
              </p>
            </div>
            </VistaPrevia>
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

/* ---------- Siluetas (Silueta del grupo): tantas imágenes como se quiera ----------
   a.siluetas = [url, …]. Al presentar, cada ronda usa una que no se haya
   usado (una vez mostrada, no vuelve a aparecer en esa presentación).
   Compatibilidad: si solo existe a.imagen (versión anterior), es la primera. */
function siluetasDe(a) {
  const lista = Array.isArray(a.siluetas) ? a.siluetas : (a.imagen ? [a.imagen] : []);
  return lista;
}
function ListaSiluetas({ a, onCambiar }) {
  const lista = siluetasDe(a);
  // Se reemplaza la activación sin el campo antiguo "imagen" (Firestore no acepta valores undefined).
  const fijar = (nueva) => { const { imagen, ...resto } = a; onCambiar({ ...resto, siluetas: nueva }); };
  const cambiar = (k, url) => fijar(lista.map((u, j) => (j === k ? url : u)));
  const quitar = (k) => fijar(lista.filter((_, j) => j !== k));
  const [nueva, setNueva] = React.useState('');
  const agregar = () => {
    // Se pueden pegar varias URL a la vez (separadas por espacios o renglones).
    const urls = nueva.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
    if (!urls.length) return;
    fijar([...lista, ...urls]); setNueva('');
  };
  const validas = lista.filter((u) => u && u.trim()).length;
  return (
    <div className="vg-siluetas">
      <div className="vg-etiqueta-campo">
        <label>Siluetas · {validas}</label>
        <span style={{ flex: 1 }}></span>
        <span className="vg-jaguar-nota">Cada ronda usa una distinta; una vez usada, no vuelve a salir.</span>
      </div>
      {!validas && <span className="vg-jaguar-nota" style={{ color: 'var(--naranja-ink)' }}>Agrega al menos una imagen de silueta.</span>}
      <div className="vg-siluetas-lista">
        {lista.map((u, k) => (
          <div key={k} className="vg-silueta-item">
            <span className="vg-silueta-num">{k + 1}</span>
            <MiniImagen src={u ? urlImagen(u) : ''} vacia="Sin URL" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <CampoUrlImagen valor={u || ''} onCambiar={(url) => cambiar(k, url)} />
            </div>
            <button type="button" className="vg-mini-accion" onClick={() => quitar(k)} title="Quitar esta silueta">✕</button>
          </div>
        ))}
      </div>
      <div className="vg-url-corta">
        <input type="text" value={nueva} placeholder="Pega la URL de otra silueta (o varias separadas por espacios)"
          onChange={(e) => setNueva(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }} title={AYUDA_IMAGEN} />
        <button type="button" className="vg-mini-accion" onClick={agregar} disabled={!nueva.trim()}>+ Agregar</button>
      </div>
    </div>
  );
}

/* ---------- Mímica: una columna de palabras por equipo ----------
   Los equipos son los del PRIMER desafío Jaguar de la presentación (ahí se
   forman); a.palabrasEquipo[i] = texto con una palabra por renglón. Cada
   equipo tiene sus propias palabras, así no se repiten entre equipos. */
// Los mismos colores (y en el mismo orden) que presentar-jaguar.jsx.
const EQUIPOS_EDITOR = [['Verde', '#39FF14'], ['Azul', '#2F80FF'], ['Amarillo', '#FFE600'], ['Turquesa', '#00F0D0'], ['Lima', '#B6FF00'], ['Celeste', '#7FD8FF'],
  ['Naranja', '#FF8A00'], ['Rosado', '#FF4FD8'], ['Morado', '#A66BFF'], ['Rojo', '#FF3B4E']];
// Los equipos son una condición de TODA la presentación: los fija el primer
// desafío Jaguar (en el orden de la presentación); los demás los heredan.
function equiposDelPrimerJaguar(a, act) {
  const primero = VigiaTipos.primerJaguar((act && act.activaciones) || []);
  const max = VigiaTipos.MAX_EQUIPOS_JAGUAR;
  if (!primero || primero.id === a.id) return { n: Math.min(max, a.equipos || 2), propio: true };
  return { n: Math.min(max, primero.equipos || 2), propio: false };
}
function ListaMimica({ a, set }) {
  const { act } = React.useContext(ListasCtx);
  const { n, propio } = equiposDelPrimerJaguar(a, act);
  const listas = Array.from({ length: n }, (_, i) => ((a.palabrasEquipo || [])[i] || ''));
  const cambiar = (i, texto) => {
    const todo = Array.from({ length: Math.max(n, (a.palabrasEquipo || []).length) }, (_, k) => ((a.palabrasEquipo || [])[k] || ''));
    todo[i] = texto;
    set({ palabrasEquipo: todo });
  };
  const cuenta = (t) => t.split(/\r?\n/).filter((l) => l.trim()).length;
  return (
    <div className="vg-mimica-editor">
      <div className="vg-etiqueta-campo">
        <label>Palabras de cada equipo</label>
        <span style={{ flex: 1 }}></span>
        <span className="vg-jaguar-nota">{propio ? n + ' equipos (este es el primer desafío Jaguar)' : n + ' equipos, como en el primer desafío Jaguar'}</span>
      </div>
      <div className="vg-mimica-columnas" style={{ '--cols': Math.min(n, 3) }}>
        {listas.map((t, i) => {
          const [nombre, color] = EQUIPOS_EDITOR[i] || ['Equipo ' + (i + 1), '#39FF14'];
          return (
            <div key={i} className="vg-mimica-col" style={{ '--c': color }}>
              <div className="vg-mimica-cabeza"><span className="punto"></span>Equipo {nombre}<small>{cuenta(t)}</small></div>
              <textarea rows={5} value={t} placeholder={'Una palabra por renglón\nEj.: volcán\nfotosíntesis'}
                onChange={(e) => cambiar(i, e.target.value)} />
            </div>
          );
        })}
      </div>
      <span className="vg-jaguar-nota">Cada palabra es una ronda: aparece solo 5 segundos (se puede volver a ver) y no se repite en la presentación.</span>
    </div>
  );
}

/* ---------- Enlace de un desafío Jaguar con una activación cognitiva ----------
   Si está activado, al presentar el equipo que GANA responde esa activación
   (pregunta abierta o cerrada, instrucción, creación, escritura, nota de
   contexto o glosario). Se guarda en a.enlace = { id, tipo, texto, ... }. */
function EnlaceEditor({ a, set }) {
  const cognitivos = VigiaTipos.TIPOS.filter((t) => t.grupo === 'cognitivo');
  const enlace = a.enlace || null;
  const nuevo = (tipoId) => {
    const e = VigiaTipos.nuevaActivacion(tipoId, {});
    delete e.ruleta;   // el enlazado lo responde el equipo ganador: sin ruleta
    return e;
  };
  return (
    <div className={'vg-enlace-editor' + (enlace ? ' on' : '')}>
      <label className="vg-jaguar-duelo">
        <input type="checkbox" checked={!!enlace}
          onChange={(e) => set({ enlace: e.target.checked ? nuevo('pregunta') : null })} />
        <span>🔗 Enlazar con una activación cognitiva</span>
      </label>
      <span className="vg-jaguar-nota">El equipo que gane responde la activación enlazada; ahí mismo se le suman (o quitan) puntos.</span>
      {enlace && (
        <React.Fragment>
          <div className="vg-enlace-tipos" role="radiogroup" aria-label="Tipo de la activación enlazada">
            {cognitivos.map((t) => (
              <button key={t.id} type="button" role="radio" aria-checked={enlace.tipo === t.id}
                className={'vg-enlace-tipo-op' + (enlace.tipo === t.id ? ' on' : '')} style={{ '--tipo': t.color }}
                onClick={() => enlace.tipo !== t.id && set({ enlace: { ...nuevo(t.id), texto: enlace.texto || '' } })}>
                <Icon name={t.icon} size={14} /> {t.nombre}
              </button>
            ))}
          </div>
          <ConfigActivacion key={enlace.id} a={enlace} onCambiar={(e) => set({ enlace: e })} onBorrar={() => set({ enlace: null })}
            conTiempo={false} compacto sinFragmento anidada hayEstudiantes={false} onAbrirEstudiantes={() => {}} />
        </React.Fragment>
      )}
    </div>
  );
}

/* ---------- Vista previa de la activación seleccionada ----------
   Arriba de la columna de tipos: la tarjeta tal como se verá al presentar,
   en miniatura (se actualiza al escribir). "Ver en grande" la muestra a
   pantalla completa, con su animación (Reto y Modo Jaguar, con su escena).
   Sin activación seleccionada, muestra el encabezado de siempre (children). */
function VistaPrevia({ a, act, children }) {
  const [grande, setGrande] = React.useState(false);
  if (!a || a.esImagen) return children;
  const ti = VigiaTipos.tipo(a.tipo);
  const escena = VigiaTipos.esEscena(a);
  return (
    <div className="vg-previa">
      <div className="vg-previa-cabeza">
        <span className="vg-previa-punto" style={{ background: ti.color }}></span>
        <span className="vg-previa-titulo" title={'Vista previa · ' + ti.nombre}>Vista previa</span>
        <span style={{ flex: 1 }}></span>
        <button type="button" className="vg-mini-accion" onClick={() => setGrande(true)} title="Verla como al presentar">⤢ Ver en grande</button>
      </div>
      <EscenarioMini onClick={() => setGrande(true)}>
        {escena
          ? <PreviaEscenaMini a={a} ti={ti} />
          : <TarjetaActivacion key={a.id} a={a} frase="" estudiantes={[]} orden={act.ordenNombres || 'apellidos'}
              usados={[]} onUsado={() => {}} onContinuar={() => {}} />}
      </EscenarioMini>
      {grande && <PreviaGrande a={a} act={act} onCerrar={() => setGrande(false)} />}
    </div>
  );
}

/* Un "escenario" del tamaño de la pantalla, reducido para caber en la columna
   (así las medidas en vw/vh de las tarjetas se ven en la misma proporción). */
function EscenarioMini({ children, onClick }) {
  const ref = React.useRef(null);
  const [vista, setVista] = React.useState({ esc: 0.2, w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const medir = () => setVista({ esc: el.clientWidth / window.innerWidth, w: window.innerWidth, h: window.innerHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    window.addEventListener('resize', medir);
    return () => { ro.disconnect(); window.removeEventListener('resize', medir); };
  }, []);
  return (
    <div ref={ref} className="vg-previa-marco" style={{ aspectRatio: vista.w + ' / ' + vista.h }} onClick={onClick} title="Clic para ver en grande">
      <div className="vigia vg-previa-escena tono-normal" style={{ width: vista.w, height: vista.h, transform: 'scale(' + vista.esc + ')' }}>
        {children}
      </div>
    </div>
  );
}

/* Miniatura fija de las escenas (sin animaciones ni sonido en la columna). */
function PreviaEscenaMini({ a, ti }) {
  const { act } = React.useContext(ListasCtx);
  const nEq = equiposDelPrimerJaguar(a, act).n;
  const kEnf = VigiaTipos.enfrentarDe(a);
  if (a.tipo === 'reto') {
    const r = VigiaTipos.reto(a.reto);
    return (
      <div className="vg-previa-escena-fija reto">
        <img src="condor-retador.webp" alt="" />
        <div className="k">Reto de activación</div>
        <div className="t">{r.titulo}</div>
        <div className="d">{r.desc}</div>
        {a.texto && <div className="d extra">{a.texto}</div>}
      </div>
    );
  }
  if (ti.capibara) {
    return (
      <div className="vg-previa-escena-fija capibara">
        <img src="capibara-iniciar.jpg" alt="" />
        <div className="k">🌿 Modo Capibara</div>
        <div className="t">{ti.nombre}</div>
        <div className="d">{ti.historia ? 'Tu misión: liberarlo con tu inteligencia y rapidez.' : ti.proposito}</div>
        <div className="d extra">{nEq + ' equipos'}{ti.historia ? ' · ' + VigiaTipos.metaCapibara(act.activaciones) + ' pasos hasta Jomu' : ''}</div>
      </div>
    );
  }
  return (
    <div className="vg-previa-escena-fija jaguar">
      <img src="jaguar-equipos.webp" alt="" />
      <div className="k">✊ Modo Jaguar</div>
      <div className="t">{ti.propia ? (a.tituloPropio || 'Actividad propia') : ti.nombre}</div>
      {a.texto && <div className="d">{a.texto}</div>}
      <div className="d extra">{nEq + ' equipos'}{kEnf ? ' · ⚔ de ' + kEnf + ' en ' + kEnf : ' · todos juntos'}{ti.palabra && typeof palabrasDe === 'function' ? ' · ' + palabrasDe(a).length + ' palabras' : ''}{ti.mimica ? ' · ' + (a.palabrasEquipo || []).reduce((s, t) => s + (t || '').split('\n').filter((l) => l.trim()).length, 0) + ' palabras de mímica' : ''}</div>
      {a.enlace && <div className="d extra">🔗 El ganador responde: {VigiaTipos.tipo(a.enlace.tipo).nombre}{a.enlace.texto ? ' · «' + a.enlace.texto.slice(0, 60) + '»' : ''}</div>}
    </div>
  );
}

/* Vista previa a pantalla completa: la activación tal como sale al presentar
   (Continuar o Esc la cierran). */
function PreviaGrande({ a, act, onCerrar }) {
  // Modo Jaguar: la vista previa empieza siempre desde el inicio (con el jaguar
  // y su voz). Se reinicia ANTES de pintar la escena. La frase, una sola vez.
  const [frase] = React.useState(() => {
    if (/^(jg|cp)-/.test(a.tipo) && window.jaguarReiniciar) {
      jaguarReiniciar('vista-previa', VigiaTipos.equiposJaguar(act.activaciones, a),
        /^cp-/.test(a.tipo) ? { modo: 'capibara', meta: VigiaTipos.metaCapibara(act.activaciones) } : null);
    }
    return VigiaTipos.fraseAlAzar();
  });
  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); onCerrar(); } };
    window.addEventListener('keydown', esc, true);
    return () => window.removeEventListener('keydown', esc, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return ReactDOM.createPortal(
    <div className="vigia vg-previa-grande tono-normal">
      <TarjetaActivacion a={a} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
        usados={[]} onUsado={() => {}} onContinuar={onCerrar} textoContinuar="Cerrar vista previa" />
      <button className="vg-previa-cerrar" onClick={onCerrar} title="Cerrar vista previa (Esc)">✕ Cerrar vista previa</button>
    </div>,
    document.body);
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
        {info.imagen
          ? <img className="vg-grupo-imagen" src={info.imagen} alt="" aria-hidden="true" draggable="false" />
          : <span className="vg-grupo-iconos" aria-hidden="true">
              {tipos.slice(0, 3).map((t) => <span key={t.id} style={{ background: t.color }}><Icon name={t.icon} size={11} /></span>)}
            </span>}
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
function ConfigActivacion({ a, onCambiar, onBorrar, tiempoActual, duracion, hayEstudiantes, onAbrirEstudiantes, onIr, conTiempo = true, ubicacion, compacto, onReleer, sinFragmento, anidada }) {
  const { tipo, fmtT, parseT } = VigiaTipos;
  const ti = tipo(a.tipo);
  const set = (patch) => onCambiar({ ...a, ...patch });
  // Modo Jaguar: solo el PRIMER desafío elige los equipos (los demás los heredan).
  const { act: actCtx } = React.useContext(ListasCtx);
  const { n: nEquipos, propio: jaguarPropio } = equiposDelPrimerJaguar(a, actCtx);
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
  // Video de YouTube opcional (abierto de una vez en los tipos con `pideVideo`, como imitar una escena).
  const [conVideo, setConVideo] = React.useState(!!a.youtube || !!ti.pideVideo);
  const quitarVideo = () => { const { youtube, ...resto } = a; onCambiar(resto); setConVideo(false); };
  const idVideo = a.youtube ? idDeYouTube(a.youtube) : null;

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
          {jaguarPropio ? (
            /* PRIMER desafío Jaguar: aquí se eligen los equipos de toda la presentación. */
            <div className="vg-jaguar-aviso vg-jaguar-inicio">
              <span className="vg-jaguar-aviso-ico"><Icon name="puno" size={16} /></span>
              <div className="vg-jaguar-inicio-cuerpo">
                <strong>¡Aquí empieza el Modo Jaguar! ¿Cuántos equipos habrá?</strong>
                <span>Se eligen una sola vez y valen para <strong>toda la presentación</strong>: al iniciar, los estudiantes de la lista
                  se reparten por color y aparecen en pantalla («¡Busca tu equipo!»). Los demás desafíos usan estos mismos equipos.</span>
                <div className="vg-segmento vg-jaguar-n" role="radiogroup" aria-label="Número de equipos">
                  {Array.from({ length: VigiaTipos.MAX_EQUIPOS_JAGUAR - 1 }, (_, k) => k + 2).map((n) => (
                    <button key={n} role="radio" aria-checked={nEquipos === n} className={nEquipos === n ? 'on' : ''}
                      onClick={() => set({ equipos: n, ...(VigiaTipos.enfrentarDe(a) > n ? { enfrentar: n, duelo: true } : {}) })}>{n}</button>
                  ))}
                </div>
                <div className="vg-jaguar-colores">
                  {EQUIPOS_EDITOR.slice(0, nEquipos).map(([nombre, color]) => (
                    <span key={nombre} style={{ '--c': color }}><i></i>{nombre}</span>
                  ))}
                </div>
                {!hayEstudiantes && onAbrirEstudiantes && (
                  <button className="btn btn-sec" style={{ alignSelf: 'flex-start' }} onClick={onAbrirEstudiantes}>Agregar la lista de estudiantes</button>
                )}
              </div>
            </div>
          ) : (
            <div className="vg-jaguar-aviso">
              <span className="vg-jaguar-aviso-ico"><Icon name="puno" size={16} /></span>
              <span>
                <strong>👥 {nEquipos} equipos</strong>, elegidos en el primer desafío del Modo Jaguar. Los equipos, sus estudiantes y sus puntos
                se mantienen en toda la presentación («¡Que siga la LUCHA!»); al salir de Presentar se muestra al ganador.
              </span>
            </div>
          )}
          {ti.propia && (
            <React.Fragment>
              <label>Nombre de tu actividad</label>
              <input type="text" value={a.tituloPropio || ''} maxLength={70} placeholder="Ej.: Carrera de conceptos"
                onChange={(e) => set({ tituloPropio: e.target.value })} />
            </React.Fragment>
          )}
          {ti.palabra && (() => {
            // Una palabra por renglón; la pista va después de "=". Cada una sale una sola vez.
            const texto = typeof a.listaPalabras === 'string' ? a.listaPalabras : (a.palabra || '');
            const cuantas = typeof palabrasDe === 'function' ? palabrasDe({ listaPalabras: texto }).length
              : texto.split(/\r?\n/).filter((l) => l.trim()).length;
            return (
              <React.Fragment>
                <div className="vg-etiqueta-campo" style={{ marginTop: ti.propia ? 10 : 0 }}>
                  <label>Palabras secretas · {cuantas}</label>
                  <span style={{ flex: 1 }}></span>
                  <span className="vg-jaguar-nota">Una por renglón · pista opcional después de «=»</span>
                </div>
                <textarea rows={Math.min(8, Math.max(3, texto.split('\n').length + 1))} value={texto}
                  placeholder={'democracia = Gobierno del pueblo\nconstitución\nsufragio = Otra forma de decir voto'}
                  onChange={(e) => set({ listaPalabras: e.target.value })} />
                <span className="vg-jaguar-nota">
                  Los equipos dicen letras por turnos: si fallan, pierden una vida y pasa el turno. Cada palabra sale una sola vez en la presentación.
                  {!cuantas && ' Si la dejas vacía, la escribes al presentar (oculta) o desde el celular.'}
                </span>
              </React.Fragment>
            );
          })()}
          {ti.silueta && (
            <div className="vg-jaguar-fila">
              <span>Temporizador</span>
              <input type="number" min="5" max="180" step="5" value={a.tiempoSilueta || 20} style={{ width: 80 }}
                onChange={(e) => set({ tiempoSilueta: Math.max(5, Math.min(180, Number(e.target.value) || 20)) })} />
              <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos · la silueta se ve los primeros 7 s</span>
            </div>
          )}
          {ti.silueta && <ListaSiluetas a={a} onCambiar={onCambiar} />}
          {ti.mimica && <ListaMimica a={a} set={set} />}
          {/* Origami: sin cronómetro por defecto; el temporizador es opcional. */}
          {ti.dosTarjetas && (
            <div className="vg-jaguar-fila">
              <label className="vg-jaguar-duelo" style={{ margin: 0 }}>
                <input type="checkbox" checked={!!a.temporizador} onChange={(e) => set({ temporizador: e.target.checked })} />
                <span>⏱ Temporizador</span>
              </label>
              {a.temporizador ? (
                <React.Fragment>
                  <input type="number" min="10" max="900" step="10" value={a.tiempoReto || 120} style={{ width: 80 }}
                    onChange={(e) => set({ tiempoReto: Math.max(10, Math.min(900, Number(e.target.value) || 120)) })} />
                  <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos · al terminar pasa a «¿Ganadores?»</span>
                </React.Fragment>
              ) : (
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>Sin cronómetro: tú decides cuándo pasar a «¿Ganadores?»</span>
              )}
            </div>
          )}
          {/* Responde en cuaderno o tablero: pantalla del salón y cronómetro. */}
          {ti.cuaderno && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Pantalla del salón</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Pantalla del salón">
                  {[['videobeam', '📽 Videobeam'], ['televisor', '📺 Televisor']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.pantalla || 'videobeam') === v} className={(a.pantalla || 'videobeam') === v ? 'on' : ''}
                      onClick={() => set({ pantalla: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <span className="vg-jaguar-nota">
                {(a.pantalla || 'videobeam') === 'videobeam'
                  ? 'Videobeam: cada equipo tiene un recuadro grande proyectado en el tablero para escribir su respuesta; tú eliges el ganador tocando su recuadro.'
                  : 'Televisor: solo aparece la pregunta; los equipos responden en el cuaderno y tú eliges el ganador.'}
              </span>
              <div className="vg-jaguar-fila">
                <span>⏱ Cronómetro</span>
                <input type="number" min="10" max="900" step="10" value={a.tiempoReto || 180} style={{ width: 80 }}
                  onChange={(e) => set({ tiempoReto: Math.max(10, Math.min(900, Number(e.target.value) || 180)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos para responder</span>
              </div>
            </React.Fragment>
          )}
          {/* Enfrentar equipos: todos juntos o de 2 en 2, de 3 en 3, de 4 en 4. */}
          <div className="vg-jaguar-fila">
            <span>⚔ Enfrentar equipos</span>
            <div className="vg-segmento" role="radiogroup" aria-label="Cómo se enfrentan los equipos">
              {[[0, 'Todos juntos'], [2, 'De 2 en 2'], [3, 'De 3 en 3'], [4, 'De 4 en 4']].map(([v, txt]) => {
                const actual = VigiaTipos.enfrentarDe(a);
                return (
                  <button key={v} role="radio" aria-checked={actual === v} className={actual === v ? 'on' : ''}
                    disabled={v > nEquipos} title={v > nEquipos ? 'Solo hay ' + nEquipos + ' equipos' : ''}
                    onClick={() => set({ enfrentar: v, duelo: v > 0 })}>{txt}</button>
                );
              })}
            </div>
          </div>
          {/* Enlace: el equipo que gane responde una activación cognitiva. */}
          <EnlaceEditor a={a} set={set} />
          {/* Por ahora en el Modo Jaguar solo aparece lo que se debe hacer (sin nombres de estudiantes). */}
          <span className="vg-jaguar-nota">
            Al presentar, «👥 Ver equipos» muestra en cualquier momento los estudiantes de cada equipo. Los puntos se suman en el desafío, en el marcador (arriba a la izquierda) o desde el celular.
          </span>
        </div>
      )}

      {/* Modo Capibara: las mismas reglas de equipos del Modo Jaguar (número de
          equipos, lista de estudiantes, enlace) + los pasos hasta Jomu. */}
      {ti.capibara && (
        <div className="field vg-jaguar-config vg-capibara-config">
          {jaguarPropio ? (
            <div className="vg-jaguar-aviso vg-jaguar-inicio">
              <span className="vg-jaguar-aviso-ico" aria-hidden="true">🌿</span>
              <div className="vg-jaguar-inicio-cuerpo">
                <strong>¡Aquí empiezan los equipos! ¿Cuántos equipos habrá?</strong>
                <span>Se eligen una sola vez y valen para <strong>toda la presentación</strong>: después de la historia, los estudiantes
                  de la lista se reparten por color («¡Busca tu equipo!») y cada equipo recibe su camino en la montaña hacia Jomu.</span>
                <div className="vg-segmento vg-jaguar-n" role="radiogroup" aria-label="Número de equipos">
                  {Array.from({ length: VigiaTipos.MAX_EQUIPOS_JAGUAR - 1 }, (_, k) => k + 2).map((n) => (
                    <button key={n} role="radio" aria-checked={nEquipos === n} className={nEquipos === n ? 'on' : ''}
                      onClick={() => set({ equipos: n })}>{n}</button>
                  ))}
                </div>
                <div className="vg-jaguar-colores">
                  {EQUIPOS_EDITOR.slice(0, nEquipos).map(([nombre, color], i) => (
                    <span key={nombre} style={{ '--c': color }}><i></i>{(window.PALETA_CAPIBARA && PALETA_CAPIBARA[i] ? PALETA_CAPIBARA[i][1] + ' ' : '') + nombre}</span>
                  ))}
                </div>
                {!hayEstudiantes && onAbrirEstudiantes && (
                  <button className="btn btn-sec" style={{ alignSelf: 'flex-start' }} onClick={onAbrirEstudiantes}>Agregar la lista de estudiantes</button>
                )}
              </div>
            </div>
          ) : (
            <div className="vg-jaguar-aviso">
              <span className="vg-jaguar-aviso-ico" aria-hidden="true">🌿</span>
              <span>
                <strong>👥 {nEquipos} equipos</strong>, elegidos en la primera actividad con equipos. Los equipos, sus estudiantes y sus pasos
                se mantienen en toda la presentación.
              </span>
            </div>
          )}
          {ti.historia && (
            <div className="vg-jaguar-fila">
              <span>🏔 Pasos hasta Jomu</span>
              <input type="number" min="3" max="30" value={a.metaCapibara || VigiaTipos.META_CAPIBARA} style={{ width: 80 }}
                onChange={(e) => set({ metaCapibara: Math.max(3, Math.min(30, Number(e.target.value) || VigiaTipos.META_CAPIBARA)) })} />
              <span style={{ fontWeight: 600, color: 'var(--muted)' }}>cada reto superado = 1 paso del equipo en la montaña</span>
            </div>
          )}
          {/* Muro Infernal: modo de juego y sus ajustes. */}
          {ti.muro && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Modo de juego</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Modo de juego">
                  {[['beam', '📽 Video beam (equipos)'], ['individual', '⌨ Teclado y mouse (individual)']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.modoMuro || 'beam') === v} className={(a.modoMuro || 'beam') === v ? 'on' : ''}
                      onClick={() => set({ modoMuro: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              {(a.modoMuro || 'beam') === 'beam' ? (
                <React.Fragment>
                  <div className="vg-jaguar-fila">
                    <span>¿Quién hace la pose?</span>
                    <div className="vg-segmento" role="radiogroup" aria-label="Quién hace la pose">
                      {[['docente', '🧍 El estudiante, con su cuerpo'], ['auto', '🖱 El personaje en pantalla']].map(([v, txt]) => (
                        <button key={v} role="radio" aria-checked={(a.juezMuro || 'docente') === v} className={(a.juezMuro || 'docente') === v ? 'on' : ''}
                          onClick={() => set({ juezMuro: v })}>{txt}</button>
                      ))}
                    </div>
                  </div>
                  <span className="vg-jaguar-nota">
                    {(a.juezMuro || 'docente') === 'docente'
                      ? 'Un estudiante de cada equipo pasa al frente e imita con su cuerpo la pose del muro. Cuando el muro llega, tú decides: ✓ pasó o ✗ al agua.'
                      : 'El equipo mueve al personaje en pantalla (clic en cada parte, teclado o presentador). Al llegar el muro, la pose se revisa sola.'}
                  </span>
                  <div className="vg-jaguar-fila">
                    <span>⏱ Tiempo por muro</span>
                    <input type="number" min="6" max="60" value={a.tiempoMuro || 15} style={{ width: 80 }}
                      onChange={(e) => set({ tiempoMuro: Math.max(6, Math.min(60, Number(e.target.value) || 15)) })} />
                    <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos (cada ronda llega un poco más rápido)</span>
                  </div>
                  <div className="vg-jaguar-fila">
                    <span>Rondas</span>
                    <input type="number" min="1" max="6" value={a.rondasMuro || 3} style={{ width: 80 }}
                      onChange={(e) => set({ rondasMuro: Math.max(1, Math.min(6, Number(e.target.value) || 3)) })} />
                    <span style={{ fontWeight: 600, color: 'var(--muted)' }}>un muro por equipo en cada ronda · 3 vidas por equipo</span>
                  </div>
                </React.Fragment>
              ) : (
                <span className="vg-jaguar-nota">
                  Un estudiante juega con el mouse (clic: girar 45°, clic derecho: al revés) o el teclado (1–9 eligen la parte, ← → la giran, Espacio: ¡Listo!).
                  3 vidas; los muros llegan cada vez más rápido. Antes de empezar se elige su equipo: cada muro superado es un paso hacia Jomu.
                </span>
              )}
              {((a.modoMuro || 'beam') === 'individual' || (a.juezMuro || 'docente') === 'auto') && (
                <div className="vg-jaguar-fila">
                  <span>Tolerancia</span>
                  <div className="vg-segmento" role="radiogroup" aria-label="Tolerancia">
                    {[[0, 'Exacta'], [45, 'Flexible (±45°)']].map(([v, txt]) => (
                      <button key={v} role="radio" aria-checked={(a.toleranciaMuro || 0) === v} className={(a.toleranciaMuro || 0) === v ? 'on' : ''}
                        onClick={() => set({ toleranciaMuro: v })}>{txt}</button>
                    ))}
                  </div>
                </div>
              )}
              <span className="vg-jaguar-nota">Cada muro superado = 1 paso del equipo hacia Jomu. Las poses no se repiten en la presentación.</span>
            </React.Fragment>
          )}
          {/* Dedos Veloces: modo, segundos, rondas y la tecla de cada equipo. */}
          {ti.dedos && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Modo de juego</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Modo de juego">
                  {[['auto', '✨ Automático'], ['simultaneo', '⌨ Simultáneo (teclado)'], ['turnos', '👆 Por turnos']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.modoDedos || 'auto') === v} className={(a.modoDedos || 'auto') === v ? 'on' : ''}
                      onClick={() => set({ modoDedos: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <span className="vg-jaguar-nota">
                {(a.modoDedos || 'auto') === 'auto' ? 'Con teclado juegan todos a la vez (cada uno con su tecla); en pantallas táctiles, por turnos con un botón gigante.'
                  : (a.modoDedos === 'simultaneo' ? 'Todos a la vez, cada concursante con su tecla. Antes de la primera ronda se prueban las teclas.'
                    : 'Un concursante a la vez toca un botón gigante en pantalla (o el celular del docente).')}
              </span>
              <div className="vg-jaguar-fila">
                <span>⏱ Tiempo</span>
                <input type="number" min="3" max="60" value={a.tiempoDedos || 10} style={{ width: 80 }}
                  onChange={(e) => set({ tiempoDedos: Math.max(3, Math.min(60, Number(e.target.value) || 10)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos por ronda (el desempate dura 5 s)</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>Rondas</span>
                <input type="number" min="1" max="10" value={a.rondasDedos || 3} style={{ width: 80 }}
                  onChange={(e) => set({ rondasDedos: Math.max(1, Math.min(10, Number(e.target.value) || 3)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>cada ronda ganada = 1 paso hacia Jomu</span>
              </div>
              {(a.modoDedos || 'auto') !== 'turnos' && (
                <div className="vg-jaguar-fila">
                  <span>Teclas</span>
                  {EQUIPOS_EDITOR.slice(0, nEquipos).map(([nombre, color], i) => {
                    const teclas = a.teclasDedos || ['Q', 'O', 'Z', 'K', 'T', 'B', 'Y', 'H', 'X', 'U'];
                    return (
                      <input key={nombre} type="text" maxLength={1} value={teclas[i] || ''} title={'Tecla del equipo ' + nombre}
                        style={{ width: 46, textAlign: 'center', fontWeight: 900, textTransform: 'uppercase', borderColor: color, borderWidth: 2 }}
                        onChange={(e) => {
                          const t = (e.target.value || '').toUpperCase().replace(/[^A-Z0-9Ñ]/g, '');
                          if (/^[PRNMFLD]$/.test(t)) return;   // atajos de la plataforma
                          const nuevas = teclas.slice(); nuevas[i] = t; set({ teclasDedos: nuevas });
                        }} />
                    );
                  })}
                  <span style={{ fontWeight: 600, color: 'var(--muted)' }}>separadas entre sí · no P, R, N, M, F, L ni D (atajos)</span>
                </div>
              )}
            </React.Fragment>
          )}
          {/* Semáforo: velocidad, cambios por color nuevo, trampas, jugadores por equipo y pasos del ganador. */}
          {ti.semaforo && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Velocidad inicial</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Velocidad inicial">
                  {[['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.velocidadSemaforo || 'lenta') === v} className={(a.velocidadSemaforo || 'lenta') === v ? 'on' : ''}
                      onClick={() => set({ velocidadSemaforo: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <div className="vg-jaguar-fila">
                <span>Color nuevo cada</span>
                <input type="number" min="3" max="20" value={a.cambiosSemaforo || 6} style={{ width: 80 }}
                  onChange={(e) => set({ cambiosSemaforo: Math.max(3, Math.min(20, Number(e.target.value) || 6)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>cambios (amarillo, azul, morado, naranja…)</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>Colores trampa</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Colores trampa">
                  {[[true, 'Sí'], [false, 'No']].map(([v, txt]) => (
                    <button key={txt} role="radio" aria-checked={(a.trampasSemaforo !== false) === v} className={(a.trampasSemaforo !== false) === v ? 'on' : ''}
                      onClick={() => set({ trampasSemaforo: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <div className="vg-jaguar-fila">
                <span>🧍 Jugadores por equipo</span>
                <input type="number" min="0" max="40" value={a.jugadoresSemaforo || 0} style={{ width: 80 }}
                  onChange={(e) => set({ jugadoresSemaforo: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>0 = los integrantes de cada equipo (se puede cambiar al empezar)</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>🏔 Pasos del ganador</span>
                <input type="number" min="1" max="10" value={a.pasosSemaforo || 3} style={{ width: 80 }}
                  onChange={(e) => set({ pasosSemaforo: Math.max(1, Math.min(10, Number(e.target.value) || 3)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>para el último equipo en pie</span>
              </div>
              {/* Colores propios: el docente crea sus instrucciones (color + ícono + acción). Salen en este orden. */}
              {(() => {
                const propios = a.coloresSemaforo || [];
                const cambiar = (k, cambio) => set({ coloresSemaforo: propios.map((c, j) => (j === k ? { ...c, ...cambio } : c)) });
                const mover = (k, d) => {
                  const j = k + d;
                  if (j < 0 || j >= propios.length) return;
                  const l = propios.slice(); [l[k], l[j]] = [l[j], l[k]]; set({ coloresSemaforo: l });
                };
                const SUGERIDOS = ['#FF00FF', '#7CFF00', '#00FFC8', '#8B4A1C', '#FFFFFF', '#000000'];
                const agregar = () => set({ coloresSemaforo: propios.concat([{
                  id: 'p' + AIP.uid(), color: SUGERIDOS[propios.length % SUGERIDOS.length], icono: '⭐', accion: '', detalle: '',
                }]) });
                const tintaDe = (window.tintaSemaforo || (() => '#FFFFFF'));
                return (
                  <React.Fragment>
                    <div className="vg-jaguar-fila">
                      <span>🎨 Colores nuevos</span>
                      <div className="vg-segmento" role="radiogroup" aria-label="Colores nuevos">
                        {[['todos', 'Los míos + los del juego'], ['propios', 'Solo los míos']].map(([v, txt]) => (
                          <button key={v} role="radio" aria-checked={(a.soloPropiosSemaforo ? 'propios' : 'todos') === v} className={(a.soloPropiosSemaforo ? 'propios' : 'todos') === v ? 'on' : ''}
                            onClick={() => set({ soloPropiosSemaforo: v === 'propios' })}>{txt}</button>
                        ))}
                      </div>
                    </div>
                    <span className="vg-jaguar-nota">
                      Verde (moverse) y rojo (congelarse) están siempre. Tus colores salen primero, en este orden
                      {a.soloPropiosSemaforo ? '.' : '; después, amarillo, azul, morado, naranja, rosado y celeste.'}
                      {' '}Usa colores fuertes y acciones seguras para el salón.
                    </span>
                    {propios.map((c, k) => (
                      <div key={c.id} className="vg-jaguar-fila vg-sf-propio">
                        <input type="color" value={c.color || '#FF00FF'} title="Color" aria-label="Color" onChange={(e) => cambiar(k, { color: e.target.value })} />
                        <input type="text" value={c.icono || ''} maxLength={4} placeholder="⭐" title="Ícono (un emoji)" aria-label="Ícono"
                          style={{ width: 52, textAlign: 'center', fontSize: 20 }} onChange={(e) => cambiar(k, { icono: e.target.value })} />
                        <input type="text" value={c.accion || ''} maxLength={24} placeholder="¡Salta!" aria-label="Acción"
                          style={{ width: 150, fontWeight: 800 }} onChange={(e) => cambiar(k, { accion: e.target.value })} />
                        <input type="text" value={c.detalle || ''} maxLength={60} placeholder="Explicación corta (opcional)" aria-label="Explicación"
                          style={{ flex: '1 1 160px', minWidth: 120 }} onChange={(e) => cambiar(k, { detalle: e.target.value })} />
                        {/* Vista previa: así se verá en pantalla */}
                        <span className="vg-sf-muestra" style={{ background: c.color, color: tintaDe(c.color) }} title="Vista previa">
                          {c.icono || '⭐'} {c.accion || '¿Acción?'}
                        </span>
                        <button type="button" className="vg-mini-accion" onClick={() => mover(k, -1)} disabled={k === 0} title="Subir" aria-label="Subir">↑</button>
                        <button type="button" className="vg-mini-accion" onClick={() => mover(k, 1)} disabled={k === propios.length - 1} title="Bajar" aria-label="Bajar">↓</button>
                        <button type="button" className="vg-mini-accion" onClick={() => set({ coloresSemaforo: propios.filter((_, j) => j !== k) })} title="Quitar" aria-label="Quitar">✕</button>
                      </div>
                    ))}
                    <div className="vg-jaguar-fila">
                      <button type="button" className="vg-mini-accion" onClick={agregar} disabled={propios.length >= 12}>+ Agregar color</button>
                      {propios.some((c) => !(c.accion || '').trim()) && <span className="vg-jaguar-nota">Los colores sin acción no salen en el juego.</span>}
                      {a.soloPropiosSemaforo && !propios.some((c) => (c.accion || '').trim()) && <span className="vg-jaguar-nota">Sin colores propios, el juego será solo verde y rojo.</span>}
                    </div>
                  </React.Fragment>
                );
              })()}
              <span className="vg-jaguar-nota">
                Pausa (celular, Espacio o P) para descontar a los eliminados de cada equipo; «+1» y «Deshacer» corrigen un error.
              </span>
            </React.Fragment>
          )}
          {/* Verdadero o Falso en Movimiento: tiempo, jugadores, pasos y las afirmaciones. */}
          {ti.vfMovimiento && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>⏱ Tiempo para correr</span>
                <input type="number" min="3" max="60" value={a.tiempoVF || 8} style={{ width: 80 }}
                  onChange={(e) => set({ tiempoVF: Math.max(3, Math.min(60, Number(e.target.value) || 8)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos por afirmación (se puede cambiar al empezar)</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>🧍 Jugadores por equipo</span>
                <input type="number" min="0" max="40" value={a.jugadoresVF || 0} style={{ width: 80 }}
                  onChange={(e) => set({ jugadoresVF: Math.max(0, Math.min(40, Number(e.target.value) || 0)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>0 = los integrantes de cada equipo (se puede cambiar al empezar)</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>🏔 Pasos del ganador</span>
                <input type="number" min="1" max="10" value={a.pasosVF || 3} style={{ width: 80 }}
                  onChange={(e) => set({ pasosVF: Math.max(1, Math.min(10, Number(e.target.value) || 3)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>para el último equipo en pie</span>
              </div>
              <EditorAfirmacionesVF a={a} set={set} />
            </React.Fragment>
          )}
          {/* Espejo en Vivo: velocidad inicial, rondas y segundos por paso. */}
          {ti.espejo && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Velocidad inicial</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Velocidad inicial">
                  {[['lenta', '🐢 Lenta'], ['media', 'Media'], ['rapida', '🐆 Rápida']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.velocidadEspejo || 'lenta') === v} className={(a.velocidadEspejo || 'lenta') === v ? 'on' : ''}
                      onClick={() => set({ velocidadEspejo: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <span className="vg-jaguar-nota">
                La silueta va cada vez más rápido y mueve más partes a la vez. Todos siguen la misma coreografía.
                Cuando el estudiante pierde el ritmo, presiona «SE DESCONECTÓ» (celular, Espacio o Av Pág); «Deshacer» (Re Pág) si fue un error.
              </span>
              <div className="vg-jaguar-fila">
                <span>Rondas</span>
                <input type="number" min="1" max="6" value={a.rondasEspejo || 1} style={{ width: 80 }}
                  onChange={(e) => set({ rondasEspejo: Math.max(1, Math.min(6, Number(e.target.value) || 1)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>un concursante por equipo en cada ronda</span>
              </div>
              <div className="vg-jaguar-fila">
                <span>🏔 1 paso cada</span>
                <input type="number" min="5" max="60" value={a.segPorPasoEspejo || 15} style={{ width: 80 }}
                  onChange={(e) => set({ segPorPasoEspejo: Math.max(5, Math.min(60, Number(e.target.value) || 15)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>segundos aguantados (suma del equipo, al final del juego)</span>
              </div>
            </React.Fragment>
          )}
          {/* Movimiento de la Jungla: modo, velocidad inicial, escalada, rondas y pasos. */}
          {ti.jungla && (
            <React.Fragment>
              <div className="vg-jaguar-fila">
                <span>Modo de juego</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Modo de juego">
                  {[['beam', '📽 Video beam (equipos)'], ['individual', '⌨ Teclado (individual)']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.modoJungla || 'beam') === v} className={(a.modoJungla || 'beam') === v ? 'on' : ''}
                      onClick={() => set({ modoJungla: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <span className="vg-jaguar-nota">
                {(a.modoJungla || 'beam') === 'beam'
                  ? 'Un estudiante por equipo se para frente a la proyección y se mueve de verdad: izquierda, centro o derecha, y hace la acción de cada animal. El juego corre solo; tú presionas «FALLÓ» (celular, Espacio o el botón grande del presentador) cuando se equivoca.'
                  : 'Un estudiante juega con el teclado: ← → cambian de carril, ↑ salta, ↓ se agacha y cada animal tiene su tecla. El juego revisa solo.'}
              </span>
              <div className="vg-jaguar-fila">
                <span>🐢 Velocidad inicial</span>
                <div className="vg-segmento" role="radiogroup" aria-label="Velocidad inicial">
                  {[['lenta', 'Lenta'], ['media', 'Media'], ['rapida', 'Rápida']].map(([v, txt]) => (
                    <button key={v} role="radio" aria-checked={(a.velocidadJungla || 'lenta') === v} className={(a.velocidadJungla || 'lenta') === v ? 'on' : ''}
                      onClick={() => set({ velocidadJungla: v })}>{txt}</button>
                  ))}
                </div>
              </div>
              <div className="vg-jaguar-fila">
                <span>Nueva instrucción cada</span>
                <input type="number" min="3" max="30" value={a.rachaJungla || 8} style={{ width: 80 }}
                  onChange={(e) => set({ rachaJungla: Math.max(3, Math.min(30, Number(e.target.value) || 8)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>objetos superados seguidos (se suma un animal: ave = saltar, cerdo = agacharse…)</span>
              </div>
              {(a.modoJungla || 'beam') === 'beam' && (
                <div className="vg-jaguar-fila">
                  <span>Rondas</span>
                  <input type="number" min="1" max="6" value={a.rondasJungla || 2} style={{ width: 80 }}
                    onChange={(e) => set({ rondasJungla: Math.max(1, Math.min(6, Number(e.target.value) || 2)) })} />
                  <span style={{ fontWeight: 600, color: 'var(--muted)' }}>un concursante por equipo en cada ronda</span>
                </div>
              )}
              <div className="vg-jaguar-fila">
                <span>🏔 1 paso cada</span>
                <input type="number" min="3" max="50" value={a.objetosPorPaso || 10} style={{ width: 80 }}
                  onChange={(e) => set({ objetosPorPaso: Math.max(3, Math.min(50, Number(e.target.value) || 10)) })} />
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>objetos superados (pasos del equipo hacia Jomu)</span>
              </div>
            </React.Fragment>
          )}
          {/* Enlace: el equipo que supere el reto responde una activación cognitiva (en los juegos, no en la historia). */}
          {!ti.historia && <EnlaceEditor a={a} set={set} />}
          <span className="vg-jaguar-nota">
            Al presentar, «👥 Ver equipos» y «🏔 Ver la montaña» están en el marcador (arriba a la izquierda) y en el celular.
            Allí también se suman o quitan pasos.{ti.historia ? ' El enlace con preguntas se elige en cada juego del Modo Capibara.' : ''}
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

      {ti.historia ? (
        /* Modo Capibara: la historia de Jomu ya viene escrita. */
        <div className="field vg-capibara-nota">
          🌿 La historia ya viene escrita: «Jomu… ¡Corre!!», el lazo de los cazadores y la jaula,
          con sus tres imágenes. Termina con el botón «¿Listos aventureros de las llanuras?».
        </div>
      ) : (
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
      )}

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

      {/* Imagen del activador (opcional, por URL). La Silueta usa su propia lista. */}
      {!ti.silueta && <div className="field">
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
      </div>}

      {/* Video de YouTube (opcional): se ve y se reproduce dentro de la tarjeta al presentar. */}
      {!ti.silueta && !ti.mimica && <div className="field">
        {!conVideo ? (
          <button type="button" className="vg-mini-accion vg-agregar-img" onClick={() => setConVideo(true)}
            title="Mostrar un video de YouTube en la tarjeta al presentar">▶ Agregar video de YouTube</button>
        ) : (
          <div className="vg-act-img-editor">
            <div className="vg-etiqueta-campo">
              <label>Video de YouTube en la tarjeta</label>
              <span style={{ flex: 1 }}></span>
              <button type="button" className="vg-mini-accion" onClick={quitarVideo}>✕ Quitar video</button>
            </div>
            <div className="vg-act-img-fila">
              <MiniImagen src={idVideo ? 'https://img.youtube.com/vi/' + idVideo + '/mqdefault.jpg' : ''} vacia="Pega el enlace →" />
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input type="text" value={a.youtube || ''} autoFocus={!a.youtube} placeholder="https://www.youtube.com/watch?v=…"
                  onChange={(e) => set({ youtube: e.target.value.trim() })} />
                <span style={{ fontSize: 12, color: a.youtube && !idVideo ? 'var(--naranja-ink)' : 'var(--muted)' }}>
                  {a.youtube && !idVideo
                    ? 'Ese enlace no parece de YouTube (youtube.com/watch?v=… o youtu.be/…).'
                    : 'Se reproduce dentro de la tarjeta (también desde el celular). Si el enlace trae el minuto (…&t=90), empieza ahí.'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>}

      {ti.ruleta && !anidada && (
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

      {compacto && !anidada && (
        <button className="btn btn-sm" style={{ alignSelf: 'flex-start' }} onClick={onBorrar}>Eliminar activador</button>
      )}
    </div>
  );
}

/* ============ Verdadero o Falso en Movimiento · editor de afirmaciones ============
   Guarda `a.afirmaciones` en el MISMO formato de la actividad «Verdadero o
   falso» de la plataforma: una línea «Afirmación | V | Explicación (opcional)»
   (lectura y escritura en capibara-vf.jsx: leerAfirmacionVF / lineaAfirmacionVF).
   Formas de cargar: fila por fila, como texto (una por línea), importar un JSON
   ([{ afirmacion, valor, explicacion }]) o traerlas de las actividades
   «Verdadero o falso» del docente. También se descargan como JSON. */
function EditorAfirmacionesVF({ a, set }) {
  const leer = window.leerAfirmacionVF, escribir = window.lineaAfirmacionVF;
  /* Cada fila tal cual, SIN recortar espacios (se guarda con cada tecla: si se
     recortara, no se podría escribir un espacio al final). El separador es « | »;
     el juego sí recorta al leer. Las filas sin afirmación el juego las ignora. */
  const limpio = (s) => String(s || '').replace(/\|/g, '/').replace(/\r?\n/g, ' ');
  const leerFila = (l) => {
    const p = String(l || '').split('|');
    return { texto: (p[0] || '').replace(/ $/, ''), valor: String(p[1] || 'V').trim().toUpperCase().startsWith('V'), explicacion: p.slice(2).join('/').replace(/^ /, '') };
  };
  const filaTexto = (x) => limpio(x.texto) + ' | ' + (x.valor ? 'V' : 'F') + (x.explicacion ? ' | ' + limpio(x.explicacion) : '');
  const items = (a.afirmaciones || []).map(leerFila);
  const guardar = (lista) => set({ afirmaciones: lista.map(filaTexto) });
  const cambiar = (k, cambio) => guardar(items.map((x, j) => (j === k ? { ...x, ...cambio } : x)));
  const mover = (k, d) => {
    const j = k + d;
    if (j < 0 || j >= items.length) return;
    const l = items.slice(); [l[k], l[j]] = [l[j], l[k]]; guardar(l);
  };
  const sumar = (nuevas, origen) => {
    if (!nuevas.length) { vigiaAviso('No se encontraron afirmaciones en ' + origen + '.', { titulo: 'Nada que agregar' }); return; }
    guardar(items.filter((x) => x.texto).concat(nuevas));
    vigiaAviso('Se agregaron ' + nuevas.length + (nuevas.length === 1 ? ' afirmación' : ' afirmaciones') + ' desde ' + origen + '.', { titulo: 'Listo' });
  };
  // Como texto: una por línea (el formato de la plataforma).
  const [comoTexto, setComoTexto] = React.useState(false);
  const [texto, setTexto] = React.useState('');
  const abrirTexto = () => { setTexto(items.filter((x) => x.texto).map(escribir).join('\n')); setComoTexto(true); };
  const aplicarTexto = () => {
    const t = texto.trim();
    let lista = null;
    if (/^[[{]/.test(t)) { try { lista = window.afirmacionesDeJSON(JSON.parse(t)); } catch (e) { lista = null; } }   // también acepta JSON pegado
    if (!lista) lista = t.split(/\r?\n/).map(leer).filter(Boolean);
    guardar(lista); setComoTexto(false);
  };
  // Importar / descargar JSON.
  const archivo = React.useRef(null);
  const importar = (ev) => {
    const f = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    const lector = new FileReader();
    lector.onload = () => {
      try { sumar(window.afirmacionesDeJSON(JSON.parse(String(lector.result || ''))), '«' + f.name + '»'); }
      catch (e) { vigiaAviso('El archivo no es un JSON válido. Revisa que tenga la forma [{ "afirmacion": "…", "valor": true, "explicacion": "…" }].', { titulo: 'No se pudo leer' }); }
    };
    lector.readAsText(f);
  };
  const descargar = () => {
    const datos = items.filter((x) => x.texto).map((x) => ({ afirmacion: x.texto, valor: x.valor, ...(x.explicacion ? { explicacion: x.explicacion } : {}) }));
    const url = URL.createObjectURL(new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' }));
    const enlace = document.createElement('a');
    enlace.href = url; enlace.download = (a.texto || 'afirmaciones').trim().slice(0, 40).replace(/[^\wáéíóúñ -]/gi, '') + '.json';
    document.body.appendChild(enlace); enlace.click(); enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };
  // Traer de las actividades «Verdadero o falso» de la plataforma (mismo formato).
  const [actividades, setActividades] = React.useState(null);   // null | 'cargando' | [{ nombre, items }]
  const buscarActividades = () => {
    setActividades('cargando');
    Promise.resolve(AIP.loadPresentations()).then((pres) => {
      const encontradas = [];
      (pres || []).forEach((p) => (p.slides || []).forEach((s) => {
        if (s && s.type === 'actividad' && s.tool === 'vf' && s.config && (s.config.items || []).length) {
          encontradas.push({ nombre: (p.titulo || p.title || 'Presentación') + ' · ' + (s.config.titulo || 'Verdadero o falso'), items: s.config.items });
        }
      }));
      setActividades(encontradas);
    }).catch(() => { setActividades(null); vigiaAviso('No se pudieron cargar tus presentaciones. Revisa la conexión.', { titulo: 'Sin conexión' }); });
  };

  return (
    <div className="vg-vf-editor">
      <div className="vg-jaguar-fila">
        <span>✔✗ Afirmaciones ({items.filter((x) => x.texto).length})</span>
        <span style={{ fontWeight: 600, color: 'var(--muted)' }}>salen al azar y no se repiten en la partida</span>
      </div>
      {comoTexto ? (
        <React.Fragment>
          <span className="vg-jaguar-nota">Una por línea: <b>Afirmación | V</b> o <b>Afirmación | F</b>, y si quieres <b>| explicación</b>. También puedes pegar un JSON.</span>
          <textarea className="vg-vf-texto" value={texto} rows={Math.min(14, Math.max(5, texto.split('\n').length + 1))}
            placeholder={'Las ballenas son mamíferos | V | Respiran aire y amamantan a sus crías\nLas arañas son insectos | F | Tienen ocho patas: son arácnidos'}
            onChange={(e) => setTexto(e.target.value)} />
          <div className="vg-jaguar-fila">
            <button type="button" className="vg-mini-accion on" onClick={aplicarTexto}>✓ Aplicar</button>
            <button type="button" className="vg-mini-accion" onClick={() => setComoTexto(false)}>Cancelar</button>
          </div>
        </React.Fragment>
      ) : (
        <React.Fragment>
          {items.map((x, k) => (
            <div key={k} className={'vg-vf-fila' + (x.valor ? ' es-v' : ' es-f')}>
              <span className="vg-vf-n">{k + 1}</span>
              <div className="vg-vf-campos">
                <AreaTexto value={x.texto} onChange={(e) => cambiar(k, { texto: e.target.value })} minRows={1} max={220} placeholder="Escribe la afirmación…" aria-label={'Afirmación ' + (k + 1)} />
                <input type="text" value={x.explicacion} maxLength={200} placeholder="Explicación breve al revelar (opcional)" aria-label="Explicación"
                  onChange={(e) => cambiar(k, { explicacion: e.target.value })} />
              </div>
              <div className="vg-segmento" role="radiogroup" aria-label="Respuesta">
                {[[true, '✔ V'], [false, '✗ F']].map(([v, txt]) => (
                  <button key={txt} type="button" role="radio" aria-checked={x.valor === v} className={x.valor === v ? 'on' : ''} onClick={() => cambiar(k, { valor: v })}>{txt}</button>
                ))}
              </div>
              <div className="vg-vf-acciones">
                <button type="button" className="vg-mini-accion" onClick={() => mover(k, -1)} disabled={k === 0} title="Subir" aria-label="Subir">↑</button>
                <button type="button" className="vg-mini-accion" onClick={() => mover(k, 1)} disabled={k === items.length - 1} title="Bajar" aria-label="Bajar">↓</button>
                <button type="button" className="vg-mini-accion" onClick={() => guardar(items.filter((_, j) => j !== k))} title="Quitar" aria-label="Quitar">✕</button>
              </div>
            </div>
          ))}
          {!items.length && <span className="vg-jaguar-nota">Aún no hay afirmaciones. Agrégalas una por una, pégalas como texto o impórtalas.</span>}
          <div className="vg-jaguar-fila">
            <button type="button" className="vg-mini-accion" onClick={() => guardar(items.concat([{ texto: '', valor: true, explicacion: '' }]))}>+ Agregar afirmación</button>
            <button type="button" className="vg-mini-accion" onClick={abrirTexto}>✎ Editar como texto</button>
            <button type="button" className="vg-mini-accion" onClick={() => archivo.current && archivo.current.click()}>⬆ Importar JSON</button>
            <button type="button" className="vg-mini-accion" onClick={descargar} disabled={!items.some((x) => x.texto)}>⬇ Descargar JSON</button>
            <button type="button" className="vg-mini-accion" onClick={buscarActividades} disabled={actividades === 'cargando'}>
              {actividades === 'cargando' ? 'Buscando…' : '📚 Traer de mis «Verdadero o falso»'}
            </button>
            <input ref={archivo} type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={importar} />
          </div>
          {Array.isArray(actividades) && (
            <div className="vg-vf-traer">
              {actividades.length ? actividades.map((x, k) => (
                <button key={k} type="button" className="vg-mini-accion" onClick={() => { sumar(x.items.map(leer).filter(Boolean), '«' + x.nombre + '»'); setActividades(null); }}>
                  {x.nombre} ({x.items.length})
                </button>
              )) : <span className="vg-jaguar-nota">No tienes actividades «Verdadero o falso» en tus presentaciones.</span>}
              <button type="button" className="vg-btn-texto" onClick={() => setActividades(null)}>Cerrar</button>
            </div>
          )}
          <span className="vg-jaguar-nota">JSON: [{'{'} "afirmacion": "Las ballenas son mamíferos", "valor": true, "explicacion": "…" {'}'}]</span>
        </React.Fragment>
      )}
    </div>
  );
}

Object.assign(window, { AreaTexto, EtiquetaCampo, VigiaEditor, EditorAfirmacionesVF, VigiaEditorVideo, RecursoChips, EstudiantesPopover, PasoEnlace, MinutoExacto, LineaTiempo, ConfigActivacion, TiposAgrupados, VistaPrevia, siluetasDe });
