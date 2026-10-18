/* presentar.jsx — Presentar una activación de video (Modo Vigía).
   Muestra solo el video a pantalla completa. Al llegar al segundo de una
   activación, el video se detiene y aparece la tarjeta central (borde de luz
   en movimiento) con su contenido: pregunta (con ruleta), instrucción,
   creación, escritura o nota de contexto. "Continuar" reanuda el video.

   Disparo: cada 250 ms se compara el tiempo anterior con el actual; si una
   activación quedó en medio (y no fue un salto manual de más de 1,5 s), se
   dispara. Volver atrás y pasar de nuevo la vuelve a mostrar. */

function VigiaPresentar({ act, onExit }) {
  const { tipo, fmtT } = VigiaTipos;
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  const yt = useYouTube(act.video && act.video.id, { controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3 });

  const [empezado, setEmpezado] = React.useState(false);
  const [activa, setActiva] = React.useState(null);        // activación en pantalla
  const [usados, setUsados] = React.useState([]);          // estudiantes que ya salieron en la ruleta
  const [hudVisible, setHudVisible] = React.useState(true);

  // --- Pantalla completa del navegador (igual que el Presenter) ---
  React.useEffect(() => {
    const el = document.documentElement;
    const pedir = el.requestFullscreen || el.webkitRequestFullscreen;
    if (pedir) { try { const r = pedir.call(el); if (r && r.catch) r.catch(() => {}); } catch (e) { /* sin gesto */ } }
    const onFs = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement)) onExit(); };
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      const salir = document.exitFullscreen || document.webkitExitFullscreen;
      if (salir && (document.fullscreenElement || document.webkitFullscreenElement)) {
        try { const r = salir.call(document); if (r && r.catch) r.catch(() => {}); } catch (e) { /* ignora */ }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Disparo de activaciones ---
  const prevT = React.useRef(0);
  React.useEffect(() => {
    const ant = prevT.current;
    prevT.current = yt.tiempo;
    if (activa || !yt.reproduciendo) return;
    const avance = yt.tiempo - ant;
    if (avance <= 0 || avance > 1.5) return;   // pausa o salto manual
    const alcanzada = lista.find((a) => a.t > ant && a.t <= yt.tiempo + 0.05);
    if (alcanzada) {
      yt.pause();
      yt.seek(alcanzada.t);
      setActiva(alcanzada);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yt.tiempo]);

  const continuar = () => {
    prevT.current = activa ? activa.t + 0.1 : yt.tiempo;
    setActiva(null);
    yt.play();
  };
  const comenzar = () => { setEmpezado(true); prevT.current = yt.tiempo; yt.play(); };
  const alternar = () => {
    if (activa) { continuar(); return; }
    if (!empezado) { comenzar(); return; }
    yt.reproduciendo ? yt.pause() : yt.play();
  };

  // --- Teclado: espacio = reproducir/pausar/continuar; Esc = salir ---
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alternar(); }
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- HUD que se oculta solo mientras el video corre ---
  const ocultarRef = React.useRef(null);
  const moverMouse = () => {
    setHudVisible(true);
    clearTimeout(ocultarRef.current);
    ocultarRef.current = setTimeout(() => setHudVisible(false), 2600);
  };
  React.useEffect(() => { moverMouse(); return () => clearTimeout(ocultarRef.current); }, []);
  const mostrarHud = hudVisible || !yt.reproduciendo;

  const total = Math.max(yt.duracion || 0, 1);
  const barra = React.useRef(null);
  const saltar = (e) => {
    const r = barra.current.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * total;
    prevT.current = t;
    yt.seek(t);
  };

  return (
    <div className="vigia vg-presentar" onMouseMove={moverMouse} data-screen-label="Modo Vigía · Presentar">
      <div className="vg-presentar-video">
        <div ref={yt.montaje} className="vg-video"></div>
        {/* Capa encima del iframe: el clic lo maneja la app (no YouTube). */}
        <div className="vg-presentar-capa" onClick={alternar}></div>
      </div>

      {yt.error && <div className="vg-video-error vg-presentar-error">{yt.error}</div>}

      {/* Portada antes de empezar */}
      {!empezado && !yt.error && (
        <div className="vg-portada">
          <img src={VIGIA_LOGO} alt="" className="vg-portada-logo" />
          <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Modo Vigía</div>
          <h1>{act.titulo || 'Activación'}</h1>
          {act.objetivo && <p>{act.objetivo}</p>}
          <div className="vg-portada-info">{lista.length} {lista.length === 1 ? 'activación' : 'activaciones'} te esperan en este video. Mantente despierto.</div>
          <button className="vg-btn vg-btn-grande" onClick={comenzar} disabled={!yt.listo}>
            <Icon name="play" size={22} /> {yt.listo ? 'Comenzar' : 'Cargando video…'}
          </button>
        </div>
      )}

      {/* Tarjeta de la activación */}
      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} estudiantes={act.estudiantes || []}
          usados={usados} onUsado={(n) => setUsados((u) => {
            const lista2 = (act.estudiantes || []).filter((s) => (s || '').trim());
            const nuevos = u.includes(n) ? u : [...u, n];
            return nuevos.length >= lista2.length ? [n] : nuevos;   // vuelta completa: empieza otra
          })}
          onContinuar={continuar} />
      )}

      {/* HUD */}
      <div className={'vg-hud' + (mostrarHud && !activa ? '' : ' oculto')}>
        <button className="hud-btn" onClick={alternar} title="Reproducir / pausar (espacio)">
          {yt.reproduciendo ? '❚❚' : '▶'}
        </button>
        <span className="vg-hud-tiempo">{fmtT(yt.tiempo)}</span>
        <div className="vg-hud-barra" ref={barra} onClick={saltar}>
          <div className="vg-linea-progreso" style={{ width: (yt.tiempo / total) * 100 + '%' }}></div>
          {lista.map((a) => (
            <span key={a.id} className="vg-hud-marca" style={{ left: (a.t / total) * 100 + '%', background: tipo(a.tipo).color }}
              title={fmtT(a.t) + ' · ' + tipo(a.tipo).nombre}></span>
          ))}
        </div>
        <span className="vg-hud-tiempo">{yt.duracion ? fmtT(yt.duracion) : '–:––'}</span>
      </div>
      <button className={'hud-btn vg-salir' + (mostrarHud && !activa ? '' : ' oculto')} onClick={onExit} title="Salir (Esc)">✕ Salir</button>
    </div>
  );
}

/* Tarjeta central con borde de luz giratoria. */
function TarjetaActivacion({ a, estudiantes, usados, onUsado, onContinuar }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const conRuleta = ti.ruleta && a.ruleta && nombres.length > 0;
  return (
    <div className="vg-velo">
      <div className="vg-alto" aria-hidden="true">¡ALTO!</div>
      <div className={'vg-tarjeta-marco' + (conRuleta ? ' con-ruleta' : '')} style={{ '--tipo': ti.color }}>
        <div className="vg-tarjeta">
          <div className="vg-tarjeta-kicker" style={{ color: ti.color }}>
            <span className="vg-tarjeta-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={22} /></span>
            {ti.titular}
          </div>
          <div className="vg-tarjeta-cuerpo">
            <div className="vg-tarjeta-contenido">
              <ContenidoActivacion a={a} />
            </div>
            {conRuleta && (
              <RuletaEstudiantes nombres={nombres} usados={usados} onElegido={onUsado} titulo={ti.preguntaRuleta} />
            )}
          </div>
          <div className="vg-tarjeta-pie">
            <button className="vg-btn" onClick={onContinuar}>Continuar el video <Icon name="play" size={16} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Contenido según el tipo de activación. */
function ContenidoActivacion({ a }) {
  const [elegida, setElegida] = React.useState(null);
  const [revelada, setRevelada] = React.useState(false);
  const texto = a.texto || '';

  if (a.tipo === 'pregunta') {
    const opciones = (a.opciones || []).map((o) => (o || '').trim()).filter(Boolean);
    const cerrada = a.modo === 'cerrada' && opciones.length >= 2;
    const correcta = Math.min(a.correcta || 0, opciones.length - 1);
    return (
      <div>
        <div className="vg-texto-pregunta">{texto || '¿…?'}</div>
        {cerrada && (
          <React.Fragment>
            <div className="vg-opciones">
              {opciones.map((o, i) => {
                const estado = revelada ? (i === correcta ? ' correcta' : (i === elegida ? ' incorrecta' : ' apagada')) : (i === elegida ? ' elegida' : '');
                return (
                  <button key={i} className={'vg-opcion' + estado} onClick={() => !revelada && setElegida(i)}>
                    <span className="vg-opcion-letra">{String.fromCharCode(65 + i)}</span>{o}
                  </button>
                );
              })}
            </div>
            {!revelada && (
              <button className="vg-btn-texto vg-revelar" onClick={() => setRevelada(true)}>Revelar respuesta</button>
            )}
          </React.Fragment>
        )}
      </div>
    );
  }
  if (a.tipo === 'escritura') {
    return <div className="vg-hoja"><p>{texto}</p></div>;
  }
  if (a.tipo === 'contexto') {
    return <div className="vg-texto-contexto">{texto}</div>;
  }
  // instruccion y creacion
  return <div className="vg-texto-grande">{texto}</div>;
}

Object.assign(window, { VigiaPresentar, TarjetaActivacion, ContenidoActivacion });
