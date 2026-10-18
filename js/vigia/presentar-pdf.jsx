/* presentar-pdf.jsx — Presentar un documento PDF (Modo Vigía).
   El PDF ocupa TODA la pantalla con sus activadores numerados (rectángulo de
   color traslúcido sobre el texto). Sin barra superior: solo una pastilla de
   controles abajo a la derecha (acercar/alejar, siguiente activador, salir)
   que se oculta sola cuando no se mueve el mouse.
   Al tocar un activador, o con "Siguiente" (→ / espacio), irrumpe una frase al
   azar y aparece la tarjeta central. Los ya abiertos quedan atenuados.
   Lo que se escribe en vivo (definición del Glosario) se guarda con onChange. */

// Niveles de acercamiento (1 = el PDF ocupa el ancho de la pantalla, hasta 1150 px).
const ZOOM_PASOS = [0.6, 0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2, 2.5];

function VigiaPresentarPdf({ act, onExit, onChange }) {
  const { ordenLectura, fraseAlAzar } = VigiaTipos;
  const lista = ordenLectura(act.activaciones);
  const numeros = {};
  lista.forEach((a, i) => { numeros[a.id] = i + 1; });

  const [pdfDoc, setPdfDoc] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [recarga, setRecarga] = React.useState(0);
  const [activaId, setActivaId] = React.useState(null);
  const [vistos, setVistos] = React.useState([]);
  const [frase, setFrase] = React.useState('¡Alto!');
  const [zoom, setZoom] = React.useState(1);
  const [controles, setControles] = React.useState(true);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();
  const scroll = React.useRef(null);
  const refPaginas = React.useRef({});
  const anchoBase = useAnchoDe(scroll, 80, 1150);
  const ancho = Math.round(anchoBase * zoom);
  const activa = lista.find((a) => a.id === activaId) || null;

  usePantallaCompleta(onExit);
  // Lo escrito en vivo (definiciones del Glosario) también llega al JSON de marcas en Drive.
  useSincronizarMarcas(act, onChange);

  React.useEffect(() => {
    let vivo = true, doc = null;
    setPdfDoc(null); setError(null);
    abrirPdf(act.id, act.pdf)
      .then((d) => { doc = d; if (vivo) setPdfDoc(d); else d.destroy(); })
      .catch((e) => { if (vivo) setError({ motivo: e.motivo, mensaje: e.message }); });
    return () => { vivo = false; if (doc) doc.destroy(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarga]);

  // --- Acercar / alejar, conservando la parte del texto que se estaba leyendo ---
  const proporcionScroll = React.useRef(null);
  const cambiarZoom = (dir) => {
    const col = scroll.current;
    if (col && col.scrollHeight) proporcionScroll.current = (col.scrollTop + col.clientHeight / 2) / col.scrollHeight;
    setZoom((z) => {
      const i = ZOOM_PASOS.indexOf(z);
      if (dir === 0) return 1;
      return ZOOM_PASOS[Math.max(0, Math.min(ZOOM_PASOS.length - 1, (i < 0 ? 3 : i) + dir))];
    });
  };
  React.useLayoutEffect(() => {
    const col = scroll.current, p = proporcionScroll.current;
    if (!col || p === null) return;
    proporcionScroll.current = null;
    col.scrollTop = Math.max(0, p * col.scrollHeight - col.clientHeight / 2);
    col.scrollLeft = Math.max(0, (col.scrollWidth - col.clientWidth) / 2);
  }, [zoom]);

  // --- Controles que se ocultan solos ---
  const ocultarRef = React.useRef(null);
  const mostrarControles = () => {
    setControles(true);
    clearTimeout(ocultarRef.current);
    ocultarRef.current = setTimeout(() => setControles(false), 2800);
  };
  React.useEffect(() => { mostrarControles(); return () => clearTimeout(ocultarRef.current); }, []);

  const abrir = (a) => { setFrase((f) => fraseAlAzar(f)); setActivaId(a.id); };
  const cerrar = () => {
    if (activa) setVistos((v) => (v.includes(activa.id) ? v : [...v, activa.id]));
    setActivaId(null);
  };
  const irA = (a, luego) => {
    const col = scroll.current, nodo = refPaginas.current[a.pagina || 1];
    if (!col || !nodo) { if (luego) luego(); return; }
    const rc = col.getBoundingClientRect(), rn = nodo.getBoundingClientRect();
    const destino = col.scrollTop + (rn.top - rc.top) + ((a.y || 0) + (a.h || 0) / 2) * rn.height - rc.height / 2;
    col.scrollTo({ top: Math.max(0, destino), behavior: 'smooth' });
    if (luego) setTimeout(luego, 650);   // deja ver dónde está antes de abrir la tarjeta
  };
  // Siguiente activador sin ver (en orden de lectura); si ya se vieron todos, vuelve al primero.
  const siguiente = () => {
    if (!lista.length) return;
    const pendiente = lista.find((a) => !vistos.includes(a.id)) || lista[0];
    irA(pendiente, () => abrir(pendiente));
  };

  // Teclado: → / espacio = siguiente o cerrar tarjeta; + / − / 0 = acercar, alejar, restablecer; Esc = salir.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); activa ? cerrar() : siguiente(); }
      else if (!activa && (e.key === '+' || e.key === '=')) { e.preventDefault(); cambiarZoom(1); }
      else if (!activa && (e.key === '-' || e.key === '_')) { e.preventDefault(); cambiarZoom(-1); }
      else if (!activa && e.key === '0') { e.preventDefault(); cambiarZoom(0); }
      else if (e.key === 'Escape') { activa ? cerrar() : onExit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Guarda en vivo un cambio de la activación (definición del glosario).
  const cambiarActivacion = (nueva) => {
    if (!onChange) return;
    onChange({ ...act, activaciones: (act.activaciones || []).map((x) => (x.id === nueva.id ? nueva : x)) });
  };

  const pendientes = lista.filter((a) => !vistos.includes(a.id)).length;
  // Los vistos se muestran atenuados (PaginaPdf les pone la clase "visto").
  const marcas = lista.map((a) => (vistos.includes(a.id) ? { ...a, _visto: true } : a));
  const zoomMin = zoom <= ZOOM_PASOS[0], zoomMax = zoom >= ZOOM_PASOS[ZOOM_PASOS.length - 1];

  return (
    <div className={'vigia vg-presentar vg-presentar-pdf tono-' + tono} data-screen-label="Modo Vigía · Presentar PDF"
      onMouseMove={mostrarControles} onWheel={mostrarControles}>
      {/* Documento a pantalla completa */}
      <div className="vg-pdf-scroll" ref={scroll}>
        {error ? (
          <ErrorPdf error={error} act={act}
            onSubido={(nuevoPdf) => { if (onChange) onChange({ ...act, pdf: nuevoPdf }); setRecarga((n) => n + 1); }}
            onReintentar={() => setRecarga((n) => n + 1)} />
        ) : !pdfDoc ? (
          <div className="vg-pdf-estado">Abriendo el documento…</div>
        ) : (
          <VisorPdf pdf={pdfDoc} ancho={ancho} marcas={marcas} numeros={numeros} selId={activaId}
            onClickMarca={(a) => abrir(a)} refPaginas={refPaginas} />
        )}
      </div>

      {/* Controles flotantes (se ocultan solos) */}
      {!activa && (
        <div className={'vg-pdf-controles' + (controles ? '' : ' oculto')} onMouseEnter={mostrarControles}>
          <button className="vg-ctrl" onClick={() => cambiarZoom(-1)} disabled={zoomMin} title="Alejar (−)" aria-label="Alejar">−</button>
          <button className="vg-ctrl vg-ctrl-zoom" onClick={() => cambiarZoom(0)} title="Tamaño normal (0)">{Math.round(zoom * 100)}%</button>
          <button className="vg-ctrl" onClick={() => cambiarZoom(1)} disabled={zoomMax} title="Acercar (+)" aria-label="Acercar">+</button>
          <span className="vg-ctrl-sep"></span>
          <SelectorTono tono={tono} setTono={setTono} />
          {lista.length > 0 && (
            <React.Fragment>
              <span className="vg-ctrl-sep"></span>
              <button className="vg-ctrl vg-ctrl-sig" onClick={siguiente}
                title={(pendientes ? pendientes + ' de ' + lista.length + ' por descubrir' : 'Todos descubiertos') + ' · → o espacio'}>
                {pendientes ? pendientes + '/' + lista.length : '✓'} <Icon name="flecha" size={16} />
              </button>
            </React.Fragment>
          )}
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={onExit} title="Salir (Esc)" aria-label="Salir">✕</button>
        </div>
      )}

      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []}
          orden={act.ordenNombres || 'apellidos'} usados={usados} onUsado={marcarUsado}
          onContinuar={cerrar} textoContinuar="Volver al documento" onCambiarActivacion={cambiarActivacion} />
      )}
    </div>
  );
}

Object.assign(window, { VigiaPresentarPdf });
