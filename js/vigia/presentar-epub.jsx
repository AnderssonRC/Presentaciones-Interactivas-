/* presentar-epub.jsx — Presentar un libro EPUB (Modo Vigía).
   El capítulo ocupa toda la pantalla con letra grande y sus activadores
   resaltados y numerados. Pastilla de controles abajo a la derecha (se oculta
   sola): capítulo, tamaño de letra, siguiente activador y salir.
   Al tocar un activador, o con "Siguiente" (→ / espacio), irrumpe una frase
   al azar y aparece la tarjeta central. Los ya abiertos quedan atenuados. */

// Tamaños de letra (px) para "acercar / alejar": el texto se reacomoda.
const EPUB_TAMANOS = [18, 21, 24, 28, 32, 38, 44, 52];

function VigiaPresentarEpub({ act, onExit, onChange }) {
  const { ordenLectura, fraseAlAzar } = VigiaTipos;
  const lista = ordenLectura(act.activaciones);
  const numeros = {};
  lista.forEach((a, i) => { numeros[a.id] = i + 1; });

  const [libro, setLibro] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [recarga, setRecarga] = React.useState(0);
  const [capitulo, setCapitulo] = React.useState(() => (lista[0] && typeof lista[0].cap === 'number' ? lista[0].cap : 0));
  const [activaId, setActivaId] = React.useState(null);
  const [vistos, setVistos] = React.useState([]);
  const [frase, setFrase] = React.useState('¡Alto!');
  const [tamano, setTamano] = React.useState(28);
  const [irA, setIrA] = React.useState(null);
  const [controles, setControles] = React.useState(true);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();
  const scroll = React.useRef(null);
  const activa = lista.find((a) => a.id === activaId) || null;

  usePantallaCompleta(onExit);
  useSincronizarMarcas(act, onChange);

  React.useEffect(() => {
    let vivo = true, l = null;
    setLibro(null); setError(null);
    abrirEpub(act.id, act.pdf)
      .then((x) => { l = x; if (vivo) setLibro(x); else x.destruir(); })
      .catch((e) => { if (vivo) setError({ motivo: e.motivo, mensaje: e.message }); });
    return () => { vivo = false; if (l) l.destruir(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recarga]);

  // Controles que se ocultan solos.
  const ocultarRef = React.useRef(null);
  const mostrarControles = () => {
    setControles(true);
    clearTimeout(ocultarRef.current);
    ocultarRef.current = setTimeout(() => setControles(false), 2800);
  };
  React.useEffect(() => { mostrarControles(); return () => clearTimeout(ocultarRef.current); }, []);

  // Tamaño de letra conservando la parte del texto que se estaba leyendo.
  const proporcion = React.useRef(null);
  const cambiarTamano = (dir) => {
    const col = scroll.current;
    if (col && col.scrollHeight) proporcion.current = (col.scrollTop + col.clientHeight / 2) / col.scrollHeight;
    setTamano((t) => {
      if (dir === 0) return 28;
      const i = EPUB_TAMANOS.indexOf(t);
      return EPUB_TAMANOS[Math.max(0, Math.min(EPUB_TAMANOS.length - 1, (i < 0 ? 3 : i) + dir))];
    });
  };
  React.useLayoutEffect(() => {
    const col = scroll.current, p = proporcion.current;
    if (!col || p === null) return;
    proporcion.current = null;
    col.scrollTop = Math.max(0, p * col.scrollHeight - col.clientHeight / 2);
  }, [tamano]);

  const irCapitulo = (i) => { setCapitulo(i); if (scroll.current) scroll.current.scrollTop = 0; };
  const abrir = (id) => { setFrase((f) => fraseAlAzar(f)); setActivaId(id); };
  const cerrar = () => {
    if (activa) setVistos((v) => (v.includes(activa.id) ? v : [...v, activa.id]));
    setActivaId(null);
  };
  // Siguiente activador sin ver (en orden de lectura); si ya se vieron todos, vuelve al primero.
  const siguiente = () => {
    if (!lista.length) return;
    const p = lista.find((a) => !vistos.includes(a.id)) || lista[0];
    if (typeof p.cap === 'number' && p.cap !== capitulo) setCapitulo(p.cap);
    setIrA((x) => ({ id: p.id, n: (x ? x.n : 0) + 1 }));
    setTimeout(() => abrir(p.id), 750);   // deja ver dónde está antes de abrir la tarjeta
  };

  // Teclado: → / espacio = siguiente o cerrar; + / − / 0 = letra; Esc = salir.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); activa ? cerrar() : siguiente(); }
      else if (!activa && (e.key === '+' || e.key === '=')) { e.preventDefault(); cambiarTamano(1); }
      else if (!activa && (e.key === '-' || e.key === '_')) { e.preventDefault(); cambiarTamano(-1); }
      else if (!activa && e.key === '0') { e.preventDefault(); cambiarTamano(0); }
      else if (e.key === 'Escape') { activa ? cerrar() : onExit(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const cambiarActivacion = (nueva) => {
    if (!onChange) return;
    onChange({ ...act, activaciones: (act.activaciones || []).map((x) => (x.id === nueva.id ? nueva : x)) });
  };

  const pendientes = lista.filter((a) => !vistos.includes(a.id)).length;
  const marcas = lista.map((a) => (vistos.includes(a.id) ? { ...a, _visto: true } : a));
  const conteo = {};
  lista.forEach((a) => { conteo[a.cap] = (conteo[a.cap] || 0) + 1; });

  // --- Música de fondo (opcional): baja mientras hay una tarjeta abierta ---
  const musica = useMusicaFondo(act.musica, !!libro, !!activa);

  // --- Mando a distancia (celular) ---
  const abrirDesdeMando = (p) => {
    if (activa) cerrar();
    if (typeof p.cap === 'number' && p.cap !== capitulo) setCapitulo(p.cap);
    setIrA((x) => ({ id: p.id, n: (x ? x.n : 0) + 1 }));
    setTimeout(() => abrir(p.id), 750);
  };
  const mando = useMandoVigia({
    recurso: 'documento', formato: 'epub', titulo: act.titulo || '', letra: tamano, pendientes, capitulo: capitulo + 1,
    activa: activa ? { id: activa.id, tipo: activa.tipo } : null,
    musica: musica.hay ? musica.on : null,
    lista: lista.map((a) => itemMando(a, 'N.º ' + numeros[a.id] + ' · cap. ' + ((a.cap || 0) + 1), vistos.includes(a.id))),
  }, (accion, o) => {
    if (accion === 'siguiente' || accion === 'alternar') { if (activa) { if (!esEscena(activa)) cerrar(); } else siguiente(); }
    else if (accion === 'abrir') { const p = lista.find((x) => x.id === o.id); if (p) abrirDesdeMando(p); }
    else if (accion === 'continuar') { if (activa && !esEscena(activa)) cerrar(); }
    else if (accion === 'zoom') cambiarTamano(o.dir || 0);
    else if (accion === 'desplazar') { if (scroll.current) scroll.current.scrollBy({ top: (o.dir || 1) * scroll.current.clientHeight * 0.6, behavior: 'smooth' }); }
    else if (accion === 'musica') musica.setOn((v) => !v);
    else if (accion === 'salir') onExit();
  });

  return (
    <div className={'vigia vg-presentar vg-presentar-pdf vg-presentar-epub tono-' + tono} data-screen-label="Modo Vigía · Presentar EPUB"
      onMouseMove={mostrarControles} onWheel={mostrarControles}>
      <div className="vg-pdf-scroll" ref={scroll}>
        {error ? (
          <ErrorPdf error={error} act={act}
            onSubido={(nuevo) => { if (onChange) onChange({ ...act, pdf: nuevo }); setRecarga((n) => n + 1); }}
            onReintentar={() => setRecarga((n) => n + 1)} />
        ) : !libro ? (
          <div className="vg-pdf-estado">Abriendo el libro…</div>
        ) : (
          <LectorEpub libro={libro} capitulo={capitulo} marcas={marcas} numeros={numeros} selId={activaId}
            tamano={tamano} irA={irA} onClickMarca={(id) => abrir(id)} clase="presentar" />
        )}
      </div>

      {(!activa || esEscena(activa)) && libro && (
        <div className={'vg-pdf-controles' + (controles ? '' : ' oculto')} onMouseEnter={mostrarControles}>
          <NavCapitulos libro={libro} capitulo={capitulo} setCapitulo={irCapitulo} conteo={conteo} compacto />
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={() => cambiarTamano(-1)} disabled={tamano <= EPUB_TAMANOS[0]} title="Letra más pequeña (−)" aria-label="Letra más pequeña">−</button>
          <button className="vg-ctrl vg-ctrl-zoom" onClick={() => cambiarTamano(0)} title="Tamaño normal (0)">Aa</button>
          <button className="vg-ctrl" onClick={() => cambiarTamano(1)} disabled={tamano >= EPUB_TAMANOS[EPUB_TAMANOS.length - 1]} title="Letra más grande (+)" aria-label="Letra más grande">+</button>
          {lista.length > 0 && (
            <React.Fragment>
              <span className="vg-ctrl-sep"></span>
              <button className="vg-ctrl vg-ctrl-sig" onClick={siguiente}
                title={(pendientes ? pendientes + ' de ' + lista.length + ' por descubrir' : 'Todos descubiertos') + ' · → o espacio'}>
                {pendientes ? pendientes + '/' + lista.length : '✓'} <Icon name="flecha" size={16} />
              </button>
            </React.Fragment>
          )}
          {musica.hay && (
            <React.Fragment>
              <span className="vg-ctrl-sep"></span>
              <button className={'vg-ctrl vg-ctrl-musica' + (musica.on ? ' on' : '')} onClick={() => musica.setOn((v) => !v)}
                title={musica.on ? 'Pausar la música de fondo' : 'Reanudar la música de fondo'} aria-label="Música de fondo">
                ♪{musica.on ? '' : <span className="vg-tachado"></span>}
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
          onContinuar={cerrar} textoContinuar="Volver al libro" onCambiarActivacion={cambiarActivacion} />
      )}
      {/* Tono de pantalla: aparece al acercar el mouse al borde izquierdo. */}
      <TonoLateral tono={tono} setTono={setTono} />
      {/* Herramientas (pincel, abajo a la izquierda): lupa, marcador, puntero, texto. */}
      <HerramientasPresentar act={act} />
      {/* Mando a distancia: chip arriba a la derecha (QR y código). */}
      <MandoBadge mando={mando} />
      {/* Música de fondo: el reproductor existe pero no se ve. */}
      {musica.hay && <div className="vg-musica-oculta" aria-hidden="true"><div ref={musica.rep.montaje} className="vg-video"></div></div>}
    </div>
  );
}

Object.assign(window, { VigiaPresentarEpub });
