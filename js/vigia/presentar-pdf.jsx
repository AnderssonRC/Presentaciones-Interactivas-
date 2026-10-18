/* presentar-pdf.jsx — Presentar un documento PDF (Modo Vigía).
   El PDF ocupa la pantalla con sus activadores numerados (rectángulo de color
   traslúcido sobre el texto). Al tocar uno, o con "Siguiente activador"
   (→ / espacio), irrumpe una frase al azar y aparece la tarjeta central.
   Los activadores ya abiertos quedan marcados como vistos.
   Lo que se escribe en vivo (definición del Glosario) se guarda con onChange. */

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
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const scroll = React.useRef(null);
  const refPaginas = React.useRef({});
  const ancho = useAnchoDe(scroll, 80, 1150);
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

  // Teclado: → / espacio = siguiente o cerrar tarjeta; Esc = salir.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); activa ? cerrar() : siguiente(); }
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

  return (
    <div className="vigia vg-presentar vg-presentar-pdf" data-screen-label="Modo Vigía · Presentar PDF">
      {/* Barra superior */}
      <div className="vg-pdf-barra">
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{act.titulo || 'Documento'}</div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            {lista.length ? (pendientes ? pendientes + ' de ' + lista.length + ' activadores por descubrir' : '¡Todos los activadores descubiertos!') : 'Sin activadores'}
          </div>
        </div>
        {lista.length > 0 && (
          <button className="vg-btn" onClick={siguiente} title="Siguiente activador (→ o espacio)">
            Siguiente activador <Icon name="flecha" size={16} />
          </button>
        )}
        <DriveSesion compacto />
        <button className="hud-btn" onClick={onExit} title="Salir (Esc)">✕ Salir</button>
      </div>

      {/* Documento */}
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

      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []}
          orden={act.ordenNombres || 'apellidos'} usados={usados} onUsado={marcarUsado}
          onContinuar={cerrar} textoContinuar="Volver al documento" onCambiarActivacion={cambiarActivacion} />
      )}
    </div>
  );
}

Object.assign(window, { VigiaPresentarPdf });
