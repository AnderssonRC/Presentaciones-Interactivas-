/* editor-epub.jsx — Editor de Activaciones para libros EPUB (recurso Documento).
   Mismo esquema de 3 columnas que el editor PDF:
     [activadores en orden de lectura] [capítulo del libro con sus marcas] [tipos + configuración]
   Para marcar: se selecciona el texto con el mouse y se toca un tipo (o al
   revés: tipo primero y luego seleccionar). El texto seleccionado se guarda
   tal cual como `fragmento` (en EPUB el texto sale limpio).
   La marca se reubica con "Ajustar a la selección" en su tarjeta flotante.
   Datos de cada activador: { cap, ini, fin, fragmento, … } (ver epub.jsx). */

function VigiaEditorEpub({ act, onChange, onBack, onPresent }) {
  const { TIPOS, recurso, tipo, nuevaActivacion, ordenLectura, recursoListo } = VigiaTipos;
  const rec = recurso(act.recurso);
  const lista = ordenLectura(act.activaciones);
  const numeros = {};
  lista.forEach((a, i) => { numeros[a.id] = i + 1; });
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const archivo = act.pdf || {};

  const [libro, setLibro] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [recarga, setRecarga] = React.useState(0);
  const [cambiando, setCambiando] = React.useState(false);
  const [capitulo, setCapitulo] = React.useState(() => (lista[0] && typeof lista[0].cap === 'number' ? lista[0].cap : 0));
  const [selId, setSelId] = React.useState(lista[0] ? lista[0].id : null);
  const [editorId, setEditorId] = React.useState(null);
  const [tipoMarcar, setTipoMarcar] = React.useState(null);
  const [haySeleccion, setHaySeleccion] = React.useState(false);
  const [irA, setIrA] = React.useState(null);
  const [estOpen, setEstOpen] = React.useState(false);
  const contenidoRef = React.useRef(null);
  const seleccion = React.useRef(null);   // última selección de texto válida en el libro

  const update = (patch) => onChange({ ...act, ...patch });
  const estadoDrive = useSincronizarMarcas(act, onChange);

  React.useEffect(() => {
    if (cambiando) return;
    let vivo = true, l = null;
    setLibro(null); setError(null);
    abrirEpub(act.id, archivo)
      .then((x) => { l = x; if (vivo) setLibro(x); else x.destruir(); })
      .catch((e) => { if (vivo) setError({ motivo: e.motivo, mensaje: e.message }); });
    return () => { vivo = false; if (l) l.destruir(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archivo.driveId, archivo.local, recarga, cambiando]);

  // Esc: cancela el modo marcar o cierra la tarjeta flotante.
  React.useEffect(() => {
    if (!tipoMarcar && !editorId) return;
    const esc = (e) => {
      if (e.key !== 'Escape' || (e.target && /input|textarea/i.test(e.target.tagName))) return;
      if (tipoMarcar) setTipoMarcar(null); else setEditorId(null);
    };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [tipoMarcar, editorId]);

  const setActivaciones = (arr) => update({ activaciones: arr });
  const sel = lista.find((a) => a.id === selId) || null;
  const pedirIr = (a) => setIrA((p) => ({ id: a.id, n: (p ? p.n : 0) + 1 }));

  const crearDesdeSeleccion = (tipoId, s) => {
    const a = nuevaActivacion(tipoId, { cap: capitulo, ini: s.ini, fin: s.fin, fragmento: s.texto });
    onChange({ ...act, activaciones: [...(act.activaciones || []), a] });
    setSelId(a.id); setEditorId(a.id); setTipoMarcar(null);
    seleccion.current = null; setHaySeleccion(false);
    if (window.getSelection) window.getSelection().removeAllRanges();
  };
  // Al soltar el mouse en el texto: se recuerda la selección; si ya había un tipo elegido, se marca.
  const alSoltar = () => {
    const s = seleccionEn(contenidoRef.current);
    seleccion.current = s;
    setHaySeleccion(!!s);
    if (s && tipoMarcar) crearDesdeSeleccion(tipoMarcar, s);
  };
  const elegirTipo = (tipoId) => {
    const s = seleccion.current || seleccionEn(contenidoRef.current);
    if (s) crearDesdeSeleccion(tipoId, s);
    else setTipoMarcar((m) => (m === tipoId ? null : tipoId));
  };
  // "Ajustar a la selección": la marca pasa al texto seleccionado ahora, y el
  // texto citado en la tarjeta se actualiza con él.
  const ajustar = (a) => {
    const s = seleccion.current || seleccionEn(contenidoRef.current);
    if (!s) return;
    cambiar({ ...a, cap: capitulo, ini: s.ini, fin: s.fin, fragmento: s.texto });
    seleccion.current = null; setHaySeleccion(false);
    if (window.getSelection) window.getSelection().removeAllRanges();
  };
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  const borrar = (id) => {
    if (!window.confirm('¿Eliminar este activador?')) return;
    setActivaciones((act.activaciones || []).filter((x) => x.id !== id));
    if (selId === id) setSelId(null);
    if (editorId === id) setEditorId(null);
  };
  // Desde la lista: abre su capítulo, desplaza hasta la marca y abre su tarjeta.
  const seleccionar = (a) => {
    if (typeof a.cap === 'number' && a.cap !== capitulo) setCapitulo(a.cap);
    setSelId(a.id); setEditorId(a.id); pedirIr(a);
  };

  const conteo = {};
  lista.forEach((a) => { conteo[a.cap] = (conteo[a.cap] || 0) + 1; });
  // (Marcas sin capítulo: vienen de un PDF anterior; se pueden reubicar con "Ajustar a la selección".)
  const tituloCap = (i) => (typeof i !== 'number' ? 'Sin ubicar en el libro'
    : (libro && libro.capitulos[i] && libro.capitulos[i].titulo) || 'Sección ' + (i + 1));
  const tipoM = tipoMarcar ? tipo(tipoMarcar) : null;

  const renderEditor = (a) => {
    const ti = tipo(a.tipo);
    return (
      <div className="vg-flotante-card" style={{ '--tipo': ti.color }}>
        <div className="vg-flotante-cab">
          <span className="vg-num-mini" style={{ background: ti.color }}>{numeros[a.id]}</span>
          <strong>{ti.nombre}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>· {tituloCap(a.cap)}</span>
          <span style={{ flex: 1 }}></span>
          <button className="vg-flotante-cerrar" onClick={() => setEditorId(null)} title="Cerrar (Esc)">✕</button>
        </div>
        <div className="vg-flotante-ayuda">
          Para mover la marca, selecciona otro texto y toca{' '}
          <button className="vg-btn-texto" onClick={() => ajustar(a)} disabled={!haySeleccion}
            title={haySeleccion ? 'Mover la marca al texto seleccionado' : 'Primero selecciona el texto en el libro'}>
            Ajustar a la selección
          </button>.
        </div>
        <ConfigActivacion a={a} onCambiar={cambiar} onBorrar={() => borrar(a.id)} compacto
          conTiempo={false} ubicacion={tituloCap(a.cap) + ' · N.º ' + numeros[a.id]}
          onIr={() => pedirIr(a)} hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
      </div>
    );
  };

  return (
    <div className="editor-shell vigia vg-editor" data-screen-label="Modo Vigía · Editor EPUB">
      {/* ---- barra superior ---- */}
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la activación"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo descubra con esta lectura?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <RecursoChips act={act} update={update} />
        <DriveSesion compacto />
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />
        <button className="btn vigia-btn-crear" onClick={onPresent} disabled={!recursoListo(act)}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      {cambiando ? (
        <PasoPdf act={act} hayMarcas={false}
          onListo={(nuevo) => { update({ pdf: nuevo }); setCambiando(false); setRecarga((n) => n + 1); }}
          onCancelar={() => setCambiando(false)} />
      ) : (
        <div className="editor-body vg-editor-pdf">
          {/* ---- columna 1: activadores en orden de lectura ---- */}
          <div className="editor-list">
            <div className="kicker" style={{ padding: '2px 4px' }}>Activadores · {lista.length}</div>
            {!lista.length && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px' }}>
                Selecciona un texto del libro con el mouse y toca un tipo a la derecha.
              </div>
            )}
            {lista.map((a) => {
              const ti = tipo(a.tipo);
              return (
                <button key={a.id} className={'slide-thumb vg-thumb' + (a.id === selId ? ' active' : '')} onClick={() => seleccionar(a)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.08em', minWidth: 0 }}>
                    <span className="vg-num-mini" style={{ background: ti.color }}>{numeros[a.id]}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ti.nombre.toUpperCase()} · {tituloCap(a.cap)}</span>
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.termino || a.texto || a.fragmento || 'Sin texto aún'}
                  </span>
                  <span className="thumb-actions">
                    <span className="thumb-action" role="button" title="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(a.id); }}>✕</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- columna 2: el libro ----
              La tarjeta de edición va ANCLADA al área visible (siempre a la vista). */}
          <div className="vg-col-envoltura">
          {editorId && lista.some((a) => a.id === editorId) && (
            <div className="vg-dock derecha" onMouseUp={(e) => e.stopPropagation()}>
              {renderEditor(lista.find((a) => a.id === editorId))}
            </div>
          )}
          <div className="editor-canvas-col vg-pdf-col vg-epub-col">
            {tipoM && (
              <div className="vg-marcar-aviso" style={{ '--tipo': tipoM.color }}>
                <span className="vg-dot" style={{ background: tipoM.color }}></span>
                Selecciona con el mouse el texto para: <strong>{tipoM.nombre}</strong>
                <button className="vg-btn-texto" onClick={() => setTipoMarcar(null)}>Cancelar (Esc)</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)', width: '100%', maxWidth: 760 }}>
              <Icon name="memorama" size={15} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {(libro && libro.titulo) || archivo.nombre} · EPUB {archivo.driveId ? 'en tu Drive' : 'en este computador'}
              </span>
              <EstadoMarcasDrive estado={estadoDrive} />
              <span style={{ flex: 1 }}></span>
              <BotonRespaldo act={act} />
              <button className="vg-btn-texto" onClick={() => setCambiando(true)}>Cambiar archivo</button>
            </div>
            {error ? (
              <ErrorPdf error={error} act={act}
                onSubido={(nuevo) => { update({ pdf: nuevo }); setRecarga((n) => n + 1); }}
                onReintentar={() => setRecarga((n) => n + 1)} />
            ) : !libro ? (
              <div className="vg-pdf-estado">Abriendo el libro…</div>
            ) : (
              <React.Fragment>
                <NavCapitulos libro={libro} capitulo={capitulo} conteo={conteo}
                  setCapitulo={(i) => { setCapitulo(i); setEditorId(null); seleccion.current = null; setHaySeleccion(false); }} />
                <LectorEpub libro={libro} capitulo={capitulo} marcas={lista} numeros={numeros} selId={selId} tamano={19}
                  contenidoRef={contenidoRef} onSoltar={alSoltar} irA={irA}
                  onClickMarca={(id) => { setSelId(id); setEditorId(id); }} onClickFondo={() => setEditorId(null)}
                  clase={tipoMarcar ? 'marcando' : ''} />
              </React.Fragment>
            )}
          </div>
          </div>

          {/* ---- columna 3: tipos + configuración del seleccionado ---- */}
          <div className="editor-tools">
            <div>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activador</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                {haySeleccion
                  ? <span style={{ color: 'var(--ink)' }}>Texto seleccionado: toca un tipo para marcarlo.</span>
                  : 'Selecciona un texto del libro y toca un tipo (o toca el tipo y luego selecciona).'}
              </p>
            </div>
            <TiposAgrupados lista={TIPOS.filter((t) => rec.tipos.includes(t.id))} render={(t) => (
              <button key={t.id} className={'tool-card vg-tipo' + (tipoMarcar === t.id ? ' on' : '')}
                onMouseDown={(e) => e.preventDefault()}   /* no perder la selección del texto al hacer clic */
                onClick={() => elegirTipo(t.id)} title={'Marcar como ' + t.nombre}>
                <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                </span>
                <span className="tool-add">+</span>
              </button>
            )} />
            {sel && (
              <div style={{ marginTop: 10 }}>
                <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)}
                  conTiempo={false} ubicacion={tituloCap(sel.cap) + ' · N.º ' + numeros[sel.id]}
                  onIr={() => seleccionar(sel)} hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { VigiaEditorEpub });
