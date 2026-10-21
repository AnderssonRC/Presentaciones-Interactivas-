/* presentar-podcast.jsx — Presentar una activación de podcast (Modo Vigía).
   Se proyecta la IMAGEN del podcast a pantalla completa (con su fondo
   difuminado y unas ondas mientras suena). Al llegar al segundo de una
   activación, el audio se detiene y aparece la misma tarjeta que en video
   (TarjetaActivacion, presentar.jsx). Barra inferior que se oculta sola y
   tono de pantalla ("Exceso de luz") en el borde izquierdo. */

function VigiaPresentarPodcast({ act, onExit, onChange }) {
  const { tipo, fmtT } = VigiaTipos;
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  const p = act.podcast || {};
  const rep = usePodcast(p, { controls: 1, fs: 0, iv_load_policy: 3 });
  const raiz = React.useRef(null);

  const [empezado, setEmpezado] = React.useState(false);
  const [activa, setActiva] = React.useState(null);
  const [frase, setFrase] = React.useState('¡Alto!');
  const [verYouTube, setVerYouTube] = React.useState(false);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();

  usePantallaCompleta(onExit);

  // --- Disparo de activaciones (como en video) ---
  const prevT = React.useRef(0);
  React.useEffect(() => {
    const ant = prevT.current;
    prevT.current = rep.tiempo;
    if (activa || !rep.reproduciendo) return;
    if (rep.esYouTube && rep.videoActual() && rep.videoActual() !== p.id) return;   // anuncio
    const avance = rep.tiempo - ant;
    if (avance <= 0 || avance > 1.5) return;
    const alcanzada = lista.find((a) => a.t > ant && a.t <= rep.tiempo + 0.05);
    if (alcanzada) abrir(alcanzada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep.tiempo]);

  const abrir = (a) => {
    rep.pause();
    rep.seek(a.t);
    prevT.current = a.t + 0.1;
    if (!empezado) setEmpezado(true);
    setVerYouTube(false);
    setFrase((f) => VigiaTipos.fraseAlAzar(f));
    setActiva(a);
    if (document.activeElement && document.activeElement.tagName === 'IFRAME') document.activeElement.blur();
    if (raiz.current) raiz.current.focus();
  };
  const continuar = () => {
    prevT.current = activa ? activa.t + 0.1 : rep.tiempo;
    setActiva(null);
    rep.play();
  };
  const comenzar = () => { setEmpezado(true); prevT.current = rep.tiempo; rep.play(); };
  const alternar = () => {
    if (activa) { continuar(); return; }
    if (!empezado) { comenzar(); return; }
    rep.reproduciendo ? rep.pause() : rep.play();
  };

  // --- Teclado: espacio = reproducir/pausar/continuar; flechas = ±10 s; Esc = salir ---
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alternar(); }
      else if (!activa && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const t = rep.tiempo + (e.key === 'ArrowLeft' ? -10 : 10);
        prevT.current = t; rep.seek(t);
      }
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Barra inferior que se oculta sola (no adelanta las activaciones) ---
  const [barraVisible, setBarraVisible] = React.useState(true);
  const ocultarBarra = React.useRef(null);
  const mostrarBarra = (ms) => {
    setBarraVisible(true);
    clearTimeout(ocultarBarra.current);
    ocultarBarra.current = setTimeout(() => setBarraVisible(false), ms || 2500);
  };
  const mantenerBarra = () => { setBarraVisible(true); clearTimeout(ocultarBarra.current); };
  React.useEffect(() => { mostrarBarra(3500); return () => clearTimeout(ocultarBarra.current); }, []);

  const total = Math.max(rep.duracion || 0, 1);
  const barra = React.useRef(null);
  const saltar = (e) => {
    const r = barra.current.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * total;
    prevT.current = t;
    rep.seek(t);
  };

  return (
    <div className={'vigia vg-presentar vg-presentar-podcast tono-' + tono} data-screen-label="Modo Vigía · Presentar podcast"
      ref={raiz} tabIndex={-1} style={{ outline: 'none' }}>
      <div className="vg-video-zona">
        {/* La imagen cambia sola según el minuto (imágenes en el tiempo). */}
        <PortadaPodcast img={imagenEn(p, rep.tiempo)} rep={rep} verReproductor={verYouTube} grande titulo={act.titulo}
          precargar={imagenesDe(p).map((x) => urlImagen(x.url))}
          onTam={onChange ? (id, tam) => onChange({ ...act, podcast: conTamImagen(p, id, tam) }) : null} />
      </div>

      {rep.error && <div className="vg-video-error vg-presentar-error">{rep.error}</div>}

      {!empezado && !rep.error && (
        <div className="vg-portada">
          <img src={VIGIA_LOGO} alt="" className="vg-portada-logo" />
          <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Modo Vigía · Podcast</div>
          <h1>{act.titulo || 'Activación'}</h1>
          {act.objetivo && <p>{act.objetivo}</p>}
          <div className="vg-portada-info">{lista.length} {lista.length === 1 ? 'activación' : 'activaciones'} te esperan en este podcast. Escucha con atención.</div>
          <button className="vg-btn vg-btn-grande" onClick={comenzar} disabled={!rep.listo}>
            <Icon name="play" size={22} /> {rep.listo ? 'Comenzar' : 'Cargando audio…'}
          </button>
        </div>
      )}

      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado} onContinuar={continuar} textoContinuar="Continuar el podcast" />
      )}

      {!activa && (
        <div className={'vg-barra-video' + (barraVisible ? '' : ' oculta')}
          onMouseEnter={mantenerBarra} onMouseMove={mantenerBarra} onMouseLeave={() => mostrarBarra(900)}>
          <button className="vg-ctrl" onClick={alternar} title="Reproducir / pausar (espacio)" aria-label="Reproducir o pausar">
            {rep.reproduciendo ? '❚❚' : '▶'}
          </button>
          <span className="vg-hud-tiempo">{fmtT(rep.tiempo)}</span>
          <div className="vg-hud-barra" ref={barra} onClick={saltar} title="Clic para ir a ese momento (flechas: ±10 s)">
            <div className="vg-linea-progreso" style={{ width: (rep.tiempo / total) * 100 + '%' }}></div>
            {lista.map((a) => (
              <button key={a.id} className="vg-hud-marca vg-hud-marca-boton" style={{ left: (a.t / total) * 100 + '%', background: tipo(a.tipo).color }}
                onClick={(e) => { e.stopPropagation(); abrir(a); }}
                title={'Abrir: ' + tipo(a.tipo).nombre + ' · ' + fmtT(a.t)} aria-label={'Abrir activación del minuto ' + fmtT(a.t)}></button>
            ))}
            {/* Imágenes en el tiempo: ícono sobre la línea (clic: ir a ese minuto). */}
            {imagenesDe(p).filter((x) => x.url).map((x, i, todas) => (
              <button key={x.id} className="vg-hud-img" style={{
                left: (x.t / total) * 100 + '%',
                // Varias en el mismo segundo: una al lado de la otra.
                transform: 'translateX(calc(-50% + ' + todas.slice(0, i).filter((y) => Math.round(y.t) === Math.round(x.t)).length * 26 + 'px))',
              }}
                onClick={(e) => { e.stopPropagation(); prevT.current = x.t; rep.seek(x.t); }}
                title={'Imagen · ' + fmtT(x.t) + (typeof x.fin === 'number' ? ' a ' + fmtT(x.fin) : '')} aria-label={'Ir a la imagen del minuto ' + fmtT(x.t)}>
                <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
                  <circle cx="9" cy="9.5" r="1.8" fill="currentColor" />
                  <path d="M4 18l5.5-5.5 3.5 3.5 2.5-2.5L20 18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          <span className="vg-hud-tiempo">{rep.duracion ? fmtT(rep.duracion) : '–:––'}</span>
          <span className="vg-ctrl-sep"></span>
          {rep.conVolumen && (
            <React.Fragment>
              <button className="vg-ctrl" onClick={rep.alternarSilencio} title={rep.silencio ? 'Activar sonido' : 'Silenciar'} aria-label="Silencio">
                {rep.silencio || rep.volumen === 0 ? '🔇' : rep.volumen < 50 ? '🔉' : '🔊'}
              </button>
              <input type="range" className="vg-volumen" min="0" max="100" step="5" value={rep.silencio ? 0 : rep.volumen}
                onChange={(e) => rep.setVolumen(Number(e.target.value))} title={'Volumen: ' + (rep.silencio ? 0 : rep.volumen) + '%'} aria-label="Volumen" />
            </React.Fragment>
          )}
          {rep.reproductorVisible && (
            <React.Fragment>
              <span className="vg-ctrl-sep"></span>
              <button className={'vg-ctrl vg-ctrl-cc' + (verYouTube ? ' on' : '')} onClick={() => setVerYouTube((v) => !v)}
                title={'Muestra el reproductor de ' + rep.reproductorVisible + ' (por ejemplo, para omitir un anuncio o darle play si no arranca)'}>
                {rep.reproductorVisible === 'YouTube' ? 'YT' : rep.reproductorVisible === 'Spotify' ? 'SP' : 'SC'}
              </button>
            </React.Fragment>
          )}
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={onExit} title="Salir (Esc)" aria-label="Salir">✕</button>
        </div>
      )}
      <TonoLateral tono={tono} setTono={setTono} />
      {/* Herramientas (pincel, abajo a la izquierda): lupa, marcador, puntero, texto. */}
      <HerramientasPresentar />
    </div>
  );
}

Object.assign(window, { VigiaPresentarPodcast });
