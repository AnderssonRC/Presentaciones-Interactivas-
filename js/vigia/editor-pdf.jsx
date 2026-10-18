/* editor-pdf.jsx — Editor de Activaciones para el recurso Documento (PDF).
   Mismo esquema de 3 columnas que el editor de video:
     [activadores en orden de lectura] [PDF con sus marcas] [tipos + configuración]
   Para agregar: se elige un tipo a la derecha y se arrastra sobre el texto del
   PDF. Queda un rectángulo de color traslúcido con su número y se abre encima
   del PDF una tarjeta flotante para editarlo. La marca se mueve arrastrándola
   y cambia de tamaño con las asas de sus esquinas.
   El texto del PDF no se lee solo: el PDF tiene una capa de texto
   seleccionable; el docente lo selecciona, lo copia y lo pega (`fragmento`).

   Datos propios del documento:
     pdf: { driveId, jsonId, nombre }   (PDF y JSON de marcas en tu Google Drive, ver drive.jsx;
                                         las activaciones viejas pueden tener url o local)
     activaciones: [{ id, tipo, pagina, x, y, w, h, fragmento, texto, termino?, definicion?, … }] */

function VigiaEditorPdf({ act, onChange, onBack, onPresent }) {
  const { TIPOS, recurso, tipo, nuevaActivacion, ordenLectura, recursoListo } = VigiaTipos;
  const rec = recurso(act.recurso);
  const lista = ordenLectura(act.activaciones);
  const numeros = {};
  lista.forEach((a, i) => { numeros[a.id] = i + 1; });
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [selId, setSelId] = React.useState(lista[0] ? lista[0].id : null);
  const [estOpen, setEstOpen] = React.useState(false);
  const [cambiando, setCambiando] = React.useState(false);
  const [tipoMarcar, setTipoMarcar] = React.useState(null);   // tipo elegido, esperando el arrastre
  const [pdfDoc, setPdfDoc] = React.useState(null);
  const [error, setError] = React.useState(null);              // { motivo, mensaje }
  const [recarga, setRecarga] = React.useState(0);
  const colRef = React.useRef(null);
  const refPaginas = React.useRef({});
  const ancho = useAnchoDe(colRef, 64, 1100);

  const update = (patch) => onChange({ ...act, ...patch });
  const pdf = act.pdf || {};
  const hayPdf = recursoListo(act) && !cambiando;
  // El JSON de marcas en Drive se mantiene al día solo (2,5 s después del último cambio).
  const estadoDrive = useSincronizarMarcas(act, onChange);

  // Abrir el PDF (copia local de este navegador o enlace).
  React.useEffect(() => {
    if (!hayPdf) { setPdfDoc(null); return; }
    let vivo = true, doc = null;
    setPdfDoc(null); setError(null);
    abrirPdf(act.id, pdf)
      .then((d) => { doc = d; if (vivo) setPdfDoc(d); else d.destroy(); })
      .catch((e) => { if (vivo) setError({ motivo: e.motivo, mensaje: e.message }); });
    return () => { vivo = false; if (doc) doc.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hayPdf, pdf.driveId, pdf.url, pdf.local, recarga]);

  // Tarjeta de edición flotante encima del PDF (id del activador abierto).
  const [editorId, setEditorId] = React.useState(null);

  // Esc cancela el modo "marcar" o cierra la tarjeta flotante.
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

  // Marca nueva: el texto NO se lee del PDF (quedaba con letras separadas);
  // el docente lo selecciona en el PDF, lo copia y lo pega en la tarjeta.
  const marcar = (pagina, rect) => {
    const tipoId = tipoMarcar;
    if (!tipoId) return;
    setTipoMarcar(null);
    const a = nuevaActivacion(tipoId, Object.assign({ pagina, fragmento: '' }, rect));
    onChange({ ...act, activaciones: [...(act.activaciones || []), a] });
    setSelId(a.id);
    setEditorId(a.id);
  };
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  // Mover / cambiar de tamaño una marca (arrastre o asas en el PDF).
  const cambiarMarca = (id, rect) => setActivaciones((act.activaciones || []).map((x) => (x.id === id ? { ...x, ...rect } : x)));
  const borrar = (id) => {
    if (!window.confirm('¿Eliminar este activador?')) return;
    setActivaciones((act.activaciones || []).filter((x) => x.id !== id));
    if (selId === id) setSelId(null);
    if (editorId === id) setEditorId(null);
  };

  // Contenido de la tarjeta flotante: la misma configuración, compacta.
  const renderEditor = (a) => {
    const ti = tipo(a.tipo);
    return (
      <div className="vg-flotante-card" style={{ '--tipo': ti.color }}>
        <div className="vg-flotante-cab">
          <span className="vg-num-mini" style={{ background: ti.color }}>{numeros[a.id]}</span>
          <strong>{ti.nombre}</strong>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}>· pág. {a.pagina || 1}</span>
          <span style={{ flex: 1 }}></span>
          <button className="vg-flotante-cerrar" onClick={() => setEditorId(null)} title="Cerrar (Esc)">✕</button>
        </div>
        <div className="vg-flotante-ayuda">
          Arrastra la marca para moverla; usa las esquinas para cambiar su tamaño.
        </div>
        <ConfigActivacion a={a} onCambiar={cambiar} onBorrar={() => borrar(a.id)} compacto
          conTiempo={false} ubicacion={'Página ' + (a.pagina || 1) + ' · N.º ' + numeros[a.id]}
          onIr={() => irA(a)} hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
      </div>
    );
  };
  // Desplaza el PDF hasta el activador.
  const irA = (a) => {
    const col = colRef.current, nodo = refPaginas.current[a.pagina || 1];
    if (!col || !nodo) return;
    const rc = col.getBoundingClientRect(), rn = nodo.getBoundingClientRect();
    col.scrollTo({ top: col.scrollTop + (rn.top - rc.top) + (a.y || 0) * rn.height - 140, behavior: 'smooth' });
  };
  // Desde la lista: lleva el PDF hasta la marca y abre su tarjeta.
  const seleccionar = (a) => { setSelId(a.id); setEditorId(a.id); irA(a); };

  const tipoM = tipoMarcar ? tipo(tipoMarcar) : null;

  return (
    <div className="editor-shell vigia vg-editor" data-screen-label="Modo Vigía · Editor PDF">
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
        <button className="btn vigia-btn-crear" onClick={onPresent} disabled={!recursoListo(act)}
          title={recursoListo(act) ? 'Presentar el documento con sus activadores' : 'Primero añade el PDF'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      {!hayPdf ? (
        <PasoPdf act={act} hayMarcas={lista.length > 0}
          onListo={(nuevoPdf) => { update({ pdf: nuevoPdf }); setCambiando(false); setRecarga((n) => n + 1); }}
          onCancelar={recursoListo(act) ? () => setCambiando(false) : null} />
      ) : (
        <div className="editor-body vg-editor-pdf">
          {/* ---- columna 1: activadores en orden de lectura ---- */}
          <div className="editor-list">
            <div className="kicker" style={{ padding: '2px 4px' }}>Activadores · {lista.length}</div>
            {!lista.length && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px' }}>
                Elige un tipo a la derecha y arrastra sobre el texto del PDF para marcarlo.
              </div>
            )}
            {lista.map((a) => {
              const ti = tipo(a.tipo);
              return (
                <button key={a.id} className={'slide-thumb vg-thumb' + (a.id === selId ? ' active' : '')} onClick={() => seleccionar(a)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.08em' }}>
                    <span className="vg-num-mini" style={{ background: ti.color }}>{numeros[a.id]}</span>
                    PÁG. {a.pagina || 1} · {ti.nombre.toUpperCase()}
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

          {/* ---- columna 2: el PDF con sus marcas ---- */}
          <div className="editor-canvas-col vg-pdf-col" ref={colRef}>
            {tipoM && (
              <div className="vg-marcar-aviso" style={{ '--tipo': tipoM.color }}>
                <span className="vg-dot" style={{ background: tipoM.color }}></span>
                Arrastra sobre el texto del PDF para marcar: <strong>{tipoM.nombre}</strong>
                <button className="vg-btn-texto" onClick={() => setTipoMarcar(null)}>Cancelar (Esc)</button>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)', width: '100%', maxWidth: 1100 }}>
              <Icon name="memorama" size={15} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {pdf.nombre || pdf.url}{pdf.driveId ? ' · en tu Drive' : (pdf.local ? ' · solo en este navegador' : '')}
              </span>
              <EstadoMarcasDrive estado={estadoDrive} />
              <span style={{ flex: 1 }}></span>
              <button className="vg-btn-texto" onClick={() => setCambiando(true)}>Cambiar PDF</button>
            </div>
            {error ? (
              <ErrorPdf error={error} act={act}
                onSubido={(nuevoPdf) => { update({ pdf: nuevoPdf }); setRecarga((n) => n + 1); }}
                onReintentar={() => setRecarga((n) => n + 1)} />
            ) : !pdfDoc ? (
              <div className="vg-pdf-estado">Abriendo el PDF…</div>
            ) : (
              <VisorPdf pdf={pdfDoc} ancho={ancho} marcas={lista} numeros={numeros} selId={selId}
                modoMarcar={!!tipoMarcar} colorMarcar={tipoM && tipoM.color}
                onMarcar={marcar} onClickMarca={(a) => { setSelId(a.id); setEditorId(a.id); }} refPaginas={refPaginas}
                editable capaTexto onCambiarMarca={cambiarMarca}
                editorId={editorId} renderEditor={renderEditor} onClickFondo={() => setEditorId(null)} />
            )}
          </div>

          {/* ---- columna 3: tipos + configuración del seleccionado ---- */}
          <div className="editor-tools">
            <div>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activador</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                Elige uno y arrastra sobre el texto del PDF. Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
              </p>
            </div>
            {TIPOS.filter((t) => rec.tipos.includes(t.id)).map((t) => (
              <button key={t.id} className={'tool-card vg-tipo' + (tipoMarcar === t.id ? ' on' : '')}
                onClick={() => setTipoMarcar((m) => (m === t.id ? null : t.id))}
                title={'Marcar en el PDF: ' + t.nombre}>
                <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                </span>
                <span className="tool-add">+</span>
              </button>
            ))}
            {sel && (
              <div style={{ marginTop: 10 }}>
                <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)}
                  conTiempo={false} ubicacion={'Página ' + (sel.pagina || 1) + ' · N.º ' + numeros[sel.id]}
                  onIr={() => irA(sel)} hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* Primer paso: el PDF se guarda en tu Google Drive ("Res Cogitans/PDFs").
   Se puede subir uno nuevo o elegir uno que la app ya subió antes. */
function PasoPdf({ act, hayMarcas, onListo, onCancelar }) {
  const d = useDrive();
  const [lista, setLista] = React.useState(null);     // PDF ya subidos (null = sin cargar)
  const [errorLista, setErrorLista] = React.useState('');
  React.useEffect(() => {
    if (!d.conectado) { setLista(null); return; }
    let vivo = true;
    listarPdfsDrive().then((l) => { if (vivo) setLista(l); }).catch((e) => { if (vivo) setErrorLista(e.message); });
    return () => { vivo = false; };
  }, [d.conectado]);

  const pdfActual = act.pdf || {};
  const elegir = (f) => onListo({ driveId: f.id, nombre: f.name, jsonId: pdfActual.jsonId || '' });

  return (
    <div className="vg-paso">
      <div className="vg-paso-card">
        <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
        <div className="kicker" style={{ color: 'var(--vigia-naranja)', marginTop: 14 }}>Paso 1 · Recurso: documento PDF</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 6px' }}>Añade el PDF</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14.5 }}>
          Se guarda en tu Google Drive, en la carpeta <strong style={{ color: 'var(--ink)' }}>Res Cogitans/PDFs</strong>, junto con un archivo
          con sus marcas. Así lo tienes en el computador personal y en el del colegio.
        </p>

        {!d.conectado ? (
          <div className="vg-drive-pedir">
            <DriveSesion />
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>
              La app solo podrá ver los archivos que ella misma cree en tu Drive.
            </div>
          </div>
        ) : (
          <React.Fragment>
            <SubirPdf act={act} onSubido={onListo} />
            <div className="vg-o"><span>o elige uno que ya subiste</span></div>
            {errorLista ? (
              <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5 }}>{errorLista}</div>
            ) : lista === null ? (
              <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Buscando en tu Drive…</div>
            ) : !lista.length ? (
              <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Aún no hay PDF en «Res Cogitans/PDFs».</div>
            ) : (
              <div className="vg-drive-lista">
                {lista.map((f) => (
                  <button key={f.id} className={'vg-drive-item' + (f.id === pdfActual.driveId ? ' on' : '')} onClick={() => elegir(f)}>
                    <Icon name="memorama" size={16} />
                    <span className="vg-drive-nombre">{f.name}</span>
                    <span className="vg-drive-tam">{f.size ? (Number(f.size) / 1048576).toFixed(1) + ' MB' : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </React.Fragment>
        )}

        {hayMarcas && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 14 }}>
            Los activadores ya creados se conservan en las mismas posiciones (página y lugar).
          </div>
        )}
        {onCancelar && <button className="vg-btn-texto" style={{ marginTop: 14 }} onClick={onCancelar}>Cancelar</button>}
      </div>
    </div>
  );
}

/* Sube un PDF del computador a tu Drive (y deja una copia en caché aquí). */
function SubirPdf({ act, onSubido, texto }) {
  const d = useDrive();
  const input = React.useRef(null);
  const [subiendo, setSubiendo] = React.useState(false);
  const [error, setError] = React.useState('');
  if (!d.conectado) return <DriveSesion />;
  const elegir = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/pdf$/i.test(f.type) && !/\.pdf$/i.test(f.name)) { setError('El archivo debe ser un PDF.'); return; }
    setSubiendo(true); setError('');
    subirPdfDrive(f)
      .then((x) => guardarPdfLocal(claveCacheDrive(x.id), f).catch(() => null)
        .then(() => onSubido({ driveId: x.id, nombre: x.name || f.name, jsonId: (act.pdf && act.pdf.jsonId) || '' })))
      .catch((er) => setError(er.message || 'No se pudo subir el PDF a tu Drive.'))
      .finally(() => setSubiendo(false));
  };
  return (
    <div>
      <input ref={input} type="file" accept="application/pdf,.pdf" style={{ display: 'none' }} onChange={elegir} />
      <button className="btn vigia-btn-crear" onClick={() => input.current && input.current.click()} disabled={subiendo}>
        <Icon name="mas" size={15} /> {subiendo ? 'Subiendo a tu Drive…' : (texto || 'Subir un PDF a mi Drive')}
      </button>
      {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

/* Qué hacer cuando el PDF no se puede abrir. Si falta la sesión de Drive,
   al conectarla se reintenta solo. */
function ErrorPdf({ error, act, onSubido, onReintentar }) {
  const d = useDrive();
  const sinSesion = error.motivo === 'drive-sesion';
  React.useEffect(() => { if (sinSesion && d.conectado) onReintentar(); }, [sinSesion, d.conectado]);
  const titulo = sinSesion ? 'Conecta tu Google Drive'
    : error.motivo === 'drive-error' ? 'No se pudo abrir el PDF de tu Drive'
    : error.motivo === 'sin-archivo' ? 'Este PDF se subió solo a otro computador'
    : error.motivo === 'enlace' ? 'No se pudo abrir el enlace del PDF' : 'No se pudo abrir el PDF';
  return (
    <div className="vg-paso-card" style={{ maxWidth: 560 }}>
      <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>{titulo}</h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>
        {sinSesion ? 'El PDF está guardado en tu Drive. Inicia sesión para abrirlo (después queda en caché en este computador).'
          : error.motivo === 'sin-archivo' || error.motivo === 'enlace'
            ? 'Súbelo a tu Google Drive y quedará disponible en tus dos computadores. Los activadores se conservan.'
            : error.mensaje}
      </p>
      {sinSesion ? <DriveSesion /> : <SubirPdf act={act} onSubido={onSubido} texto="Subir el PDF a mi Drive" />}
      {!sinSesion && (
        <button className="vg-btn-texto" style={{ marginTop: 12 }} onClick={onReintentar}>Reintentar</button>
      )}
    </div>
  );
}

/* Estado del JSON de marcas en Drive (barra del editor). */
function EstadoMarcasDrive({ estado }) {
  if (!estado) return null;
  const txt = {
    'sin-sesion': 'Marcas sin guardar en Drive (conéctalo)',
    pendiente: 'Cambios por guardar en Drive…',
    guardando: 'Guardando marcas en Drive…',
    guardado: 'Marcas guardadas en Drive ✓',
    error: 'No se pudieron guardar las marcas en Drive',
  }[estado];
  return <span className={'vg-drive-estado ' + estado}>{txt}</span>;
}

Object.assign(window, { VigiaEditorPdf, PasoPdf, SubirPdf, ErrorPdf, EstadoMarcasDrive });
