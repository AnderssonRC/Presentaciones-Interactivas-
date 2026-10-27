/* editor-pdf.jsx — Editor de Activaciones para el recurso Documento (PDF).
   Mismo esquema de 3 columnas que el editor de video:
     [activadores en orden de lectura] [PDF con sus marcas] [tipos + configuración]
   Para agregar: se elige un tipo a la derecha y se arrastra sobre el texto del
   PDF. Queda un rectángulo de color traslúcido con su número y se abre encima
   del PDF una tarjeta flotante para editarlo. La marca se mueve arrastrándola
   y cambia de tamaño con las asas de sus esquinas.
   El texto que queda debajo de la marca se lee solo (`fragmento`, ver
   textoEnRect en pdf.jsx) y se puede corregir, borrar o volver a leer. El PDF
   tiene además una capa de texto seleccionable para copiar y pegar a mano.

   Datos propios del documento:
     pdf: { driveId, jsonId, nombre }   (PDF y JSON de marcas en tu Google Drive, ver drive.jsx;
                                         las activaciones viejas pueden tener url o local)
     activaciones: [{ id, tipo, pagina, x, y, w, h, fragmento, texto, termino?, definicion?, … }] */

// Pasos de tamaño del PDF en el editor (1 = ancho de la columna, hasta 1100 px).
const ZOOM_EDITOR = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];

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
  const anchoBase = useAnchoDe(colRef, 64, 1100);
  // Tamaño del PDF en el editor (− / + abajo a la izquierda, o Ctrl + rueda):
  // más grande = más fácil marcar con precisión. Se recuerda en este computador.
  const [zoom, setZoomEstado] = React.useState(() => {
    try { const z = Number(localStorage.getItem('vigia_zoom_editor_pdf')); return ZOOM_EDITOR.includes(z) ? z : 1; } catch (e) { return 1; }
  });
  const ancho = Math.round(anchoBase * zoom);
  const proporcionZoom = React.useRef(null);
  const cambiarZoom = (dir) => {
    const col = colRef.current;
    // Conserva a la vista la parte del PDF que se estaba mirando.
    if (col && col.scrollHeight) proporcionZoom.current = (col.scrollTop + col.clientHeight / 2) / col.scrollHeight;
    setZoomEstado((z) => {
      const i = ZOOM_EDITOR.indexOf(z);
      const n = dir === 0 ? 1 : ZOOM_EDITOR[Math.max(0, Math.min(ZOOM_EDITOR.length - 1, (i < 0 ? 3 : i) + dir))];
      try { localStorage.setItem('vigia_zoom_editor_pdf', String(n)); } catch (e) { /* */ }
      return n;
    });
  };
  React.useLayoutEffect(() => {
    const col = colRef.current, p = proporcionZoom.current;
    if (!col || p === null) return;
    proporcionZoom.current = null;
    col.scrollTop = Math.max(0, p * col.scrollHeight - col.clientHeight / 2);
    col.scrollLeft = Math.max(0, (col.scrollWidth - col.clientWidth) / 2);
  }, [zoom]);
  // Ctrl + rueda del mouse sobre el PDF: acercar / alejar.
  React.useEffect(() => {
    const col = colRef.current;
    if (!col) return undefined;
    const rueda = (e) => { if (!e.ctrlKey) return; e.preventDefault(); cambiarZoom(e.deltaY < 0 ? 1 : -1); };
    col.addEventListener('wheel', rueda, { passive: false });
    return () => col.removeEventListener('wheel', rueda);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colRef.current]);

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

  // Texto del PDF que queda debajo de una marca (lectura automática; el
  // docente lo corrige, lo borra o lo vuelve a leer desde la tarjeta).
  const leerTexto = (pagina, rect) => (pdfDoc
    ? pdfDoc.getPage(pagina).then((page) => textoEnRect(page, rect)).catch(() => '')
    : Promise.resolve(''));

  // Marca nueva: se lee el texto de debajo y se precarga en la tarjeta
  // (también como palabra del Glosario o texto de Escritura).
  const marcar = (pagina, rect) => {
    const tipoId = tipoMarcar;
    if (!tipoId) return;
    setTipoMarcar(null);
    leerTexto(pagina, rect).then((fragmento) => {
      const a = nuevaActivacion(tipoId, Object.assign({ pagina, fragmento }, rect));
      onChange({ ...act, activaciones: [...(act.activaciones || []), a] });
      setSelId(a.id);
      setEditorId(a.id);
    });
  };
  // "Leer de nuevo" (p. ej. después de mover o agrandar la marca).
  const releer = (a) => leerTexto(a.pagina || 1, a).then((fragmento) => cambiar({ ...a, fragmento }));
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  // Mover / cambiar de tamaño una marca (arrastre o asas en el PDF).
  const cambiarMarca = (id, rect) => setActivaciones((act.activaciones || []).map((x) => (x.id === id ? { ...x, ...rect } : x)));
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar este activador?', { aceptar: 'Sí, eliminar', peligro: true })) return;
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
          Arrastra la marca para moverla; usa las esquinas para cambiar su tamaño (luego «Leer de nuevo» toma el texto nuevo).
        </div>
        <ConfigActivacion a={a} onCambiar={cambiar} onBorrar={() => borrar(a.id)} compacto onReleer={() => releer(a)}
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

          {/* ---- columna 2: el PDF con sus marcas ----
              La tarjeta de edición va ANCLADA al área visible (fuera del
              desplazamiento): siempre a la vista, sin tener que bajar. */}
          <div className="vg-col-envoltura">
          {editorId && lista.some((a) => a.id === editorId) && (() => {
            const ed = lista.find((a) => a.id === editorId);
            const lado = (ed.x || 0) + (ed.w || 0) / 2 > 0.5 ? 'izquierda' : 'derecha';   // lado contrario a la marca
            return (
              <div className={'vg-dock ' + lado} onPointerDown={(e) => e.stopPropagation()}>
                {renderEditor(ed)}
              </div>
            );
          })()}
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
                {pdf.nombre || pdf.url}{pdf.driveId ? ' · en tu Drive' : (pdf.local ? ' · en este computador' : '')}
              </span>
              <EstadoMarcasDrive estado={estadoDrive} />
              <span style={{ flex: 1 }}></span>
              <BotonRespaldo act={act} />
              <button className="vg-btn-texto" onClick={() => setCambiando(true)}>Cambiar archivo</button>
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
                onClickFondo={() => setEditorId(null)} />
            )}
            {/* Tamaño del PDF: fijo abajo a la izquierda mientras se desplaza. */}
            {pdfDoc && !error && (
              <div className="vg-zoom-editor" role="group" aria-label="Tamaño del PDF">
                <button onClick={() => cambiarZoom(-1)} disabled={zoom <= ZOOM_EDITOR[0]} title="Achicar el PDF (Ctrl + rueda)">−</button>
                <button className="valor" onClick={() => cambiarZoom(0)} title="Tamaño normal">{Math.round(zoom * 100)}%</button>
                <button onClick={() => cambiarZoom(1)} disabled={zoom >= ZOOM_EDITOR[ZOOM_EDITOR.length - 1]} title="Agrandar el PDF (Ctrl + rueda)">+</button>
              </div>
            )}
          </div>
          </div>

          {/* ---- columna 3: tipos + configuración del seleccionado ---- */}
          <div className="editor-tools">
            {/* Vista previa de la activación seleccionada (o el encabezado de siempre). */}
            <VistaPrevia a={sel} act={act}>
            <div>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activador</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                Elige uno y arrastra sobre el texto del PDF. Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
              </p>
            </div>
            </VistaPrevia>
            <TiposAgrupados lista={TIPOS.filter((t) => rec.tipos.includes(t.id))} render={(t) => (
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
            )} />
            {/* Música de fondo (opcional), igual que en Imágenes. */}
            <MusicaFondo musica={act.musica} onCambiar={(musica) => update({ musica })} />
            {sel && (
              <div style={{ marginTop: 10 }}>
                <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)} onReleer={() => releer(sel)}
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
  const elegir = (f) => onListo({ driveId: f.id, nombre: f.name, jsonId: pdfActual.jsonId || '', formato: formatoDeArchivo(f.name, f.mimeType) });

  return (
    <div className="vg-paso">
      <div className="vg-paso-card">
        <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
        <div className="kicker" style={{ color: 'var(--vigia-naranja)', marginTop: 14 }}>Paso 1 · Recurso: documento</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 6px' }}>Añade el PDF o EPUB</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14.5 }}>
          Guárdalo en tu Google Drive (carpeta <strong style={{ color: 'var(--ink)' }}>Res Cogitans/PDFs</strong>, con un archivo
          de sus marcas) para tenerlo en tus dos computadores, o solo en este computador.
        </p>

        <div className="vg-opcion-titulo">En Google Drive</div>
        {!d.configurado ? (
          <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Drive no está configurado en esta app (falta el ID de cliente).</div>
        ) : !d.conectado ? (
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
              <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>Aún no hay PDF ni EPUB en «Res Cogitans/PDFs».</div>
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

        {/* Sin Drive: el archivo queda en este computador. Para llevarlo a otro,
            se usa "Descargar respaldo" y allá "Importar respaldo". */}
        <div className="vg-opcion-titulo" style={{ marginTop: 22 }}>Solo en este computador</div>
        <SubirLocal act={act} onListo={(pdf) => onListo({ ...pdf, driveId: '', jsonId: '' })} />
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
          Sin cuenta de Drive. La plataforma lo encuentra sola en este computador. Para llevarlo a otro, usa
          «Descargar respaldo» y allá «Importar respaldo». También puedes elegir aquí un respaldo <strong>.vigia.zip</strong>.
        </div>

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
    if (!/(pdf|epub)/i.test(f.type) && !/\.(pdf|epub)$/i.test(f.name)) { setError('El archivo debe ser un PDF o un EPUB.'); return; }
    setSubiendo(true); setError('');
    subirPdfDrive(f)
      .then((x) => guardarPdfLocal(claveCacheDrive(x.id), f).catch(() => null)
        .then(() => onSubido({ driveId: x.id, nombre: x.name || f.name, jsonId: (act.pdf && act.pdf.jsonId) || '', formato: formatoDeArchivo(f.name, f.type) })))
      .catch((er) => setError(er.message || 'No se pudo subir el PDF a tu Drive.'))
      .finally(() => setSubiendo(false));
  };
  return (
    <div>
      <input ref={input} type="file" accept="application/pdf,.pdf,application/epub+zip,.epub" style={{ display: 'none' }} onChange={elegir} />
      <button className="btn vigia-btn-crear" onClick={() => input.current && input.current.click()} disabled={subiendo}>
        <Icon name="mas" size={15} /> {subiendo ? 'Subiendo a tu Drive…' : (texto || 'Subir un PDF o EPUB a mi Drive')}
      </button>
      {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

/* Qué hacer cuando el documento no se puede abrir. Siempre se ofrece la
   salida local: elegir el archivo (o su respaldo .vigia.zip) desde este
   computador, sin Drive. Si falta la sesión de Drive, al conectarla se
   reintenta solo. */
function ErrorPdf({ error, act, onSubido, onReintentar }) {
  const d = useDrive();
  const sinSesion = error.motivo === 'drive-sesion';
  const enDrive = !!(act.pdf && act.pdf.driveId);
  React.useEffect(() => { if (sinSesion && d.conectado) onReintentar(); }, [sinSesion, d.conectado]);
  const titulo = sinSesion ? 'Conecta tu Google Drive o usa una copia de este computador'
    : error.motivo === 'drive-error' ? 'No se pudo abrir el documento de tu Drive'
    : error.motivo === 'sin-archivo' ? 'El documento no está en este computador'
    : error.motivo === 'enlace' ? 'No se pudo abrir el enlace del PDF' : 'No se pudo abrir el documento';
  return (
    <div className="vg-paso-card" style={{ maxWidth: 580 }}>
      <h3 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 6px' }}>{titulo}</h3>
      <p style={{ color: 'var(--muted)', fontSize: 14, margin: '0 0 16px' }}>
        {sinSesion ? 'El documento está en tu Drive. Inicia sesión para abrirlo (después queda guardado en este computador), o elige una copia desde aquí.'
          : error.mensaje}
      </p>
      {sinSesion && <DriveSesion />}
      {!sinSesion && d.conectado && !enDrive && (error.motivo === 'sin-archivo' || error.motivo === 'enlace') && (
        <SubirPdf act={act} onSubido={onSubido} texto="Subir el documento a mi Drive" />
      )}
      <div className="vg-o"><span>desde este computador</span></div>
      {/* El archivo o su respaldo: queda guardado aquí; se conservan los activadores (y los datos de Drive, si los tenía). */}
      <SubirLocal act={act} onListo={onSubido} conservar texto="Elegir el archivo o su respaldo (.vigia.zip)" />
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
