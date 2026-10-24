/* presentar.jsx — Presentar una activación de video (Modo Vigía).
   Muestra solo el video a pantalla completa. Al llegar al segundo de una
   activación, el video se detiene y aparece la tarjeta central (borde de luz
   en movimiento) con su contenido: pregunta (con ruleta), instrucción,
   creación, escritura o nota de contexto. "Continuar" reanuda el video.

   Disparo: cada 250 ms se compara el tiempo anterior con el actual; si una
   activación quedó en medio (y no fue un salto manual de más de 1,5 s), se
   dispara. Volver atrás y pasar de nuevo la vuelve a mostrar. */

/* Elige el modo Presentar según el recurso y el formato (video, PDF o EPUB). */
function VigiaPresentar(props) {
  const { act } = props;
  // --- Modo Jaguar: una sesión por presentación; al salir se muestra el ganador ---
  const conJaguar = (act.activaciones || []).some((a) => /^jg-/.test(a.tipo));
  const jaguar = useJaguarEstado();
  const [ganador, setGanador] = React.useState(null);   // null | 'salir' | 'ver'
  React.useEffect(() => { jaguarReiniciar(act.id); }, [act.id]);
  const salir = () => { if (conJaguar && jaguar.iniciado && jaguar.equipos) setGanador('salir'); else props.onExit(); };
  useOrdenMando((o) => { if (o.accion === 'jaguar-ganador' && jaguar.iniciado) setGanador('ver'); });

  const p = { ...props, onExit: salir };
  let modo;
  if (act.recurso === 'podcast') modo = <VigiaPresentarPodcast {...p} />;
  else if (act.recurso === 'imagenes') modo = <VigiaPresentarImagenes {...p} />;
  else if (act.recurso !== 'documento') modo = <VigiaPresentarVideo {...p} />;
  else modo = act.pdf && act.pdf.formato === 'epub' ? <VigiaPresentarEpub {...p} /> : <VigiaPresentarPdf {...p} />;
  return (
    <React.Fragment>
      {modo}
      {conJaguar && <MarcadorJaguar onGanador={() => setGanador('ver')} />}
      {/* Encima de la presentación (que sigue montada: "Volver" la retoma donde iba). */}
      {ganador && (
        <GanadorJaguar onSalir={() => { setGanador(null); props.onExit(); }}
          onVolver={() => setGanador(null)} />
      )}
    </React.Fragment>
  );
}

/* Pantalla completa del navegador mientras se presenta; si el docente sale
   de ella (Esc del navegador, F11), se cierra el modo Presentar. */
function usePantallaCompleta(onExit) {
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
}

/* Estudiantes ya elegidos por la ruleta en esta presentación (sin repetir
   hasta que salgan todos; luego empieza otra vuelta). */
function useUsadosRuleta(estudiantes) {
  const [usados, setUsados] = React.useState([]);
  const marcarUsado = (n) => setUsados((u) => {
    const total = (estudiantes || []).filter((s) => (s || '').trim()).length;
    const nuevos = u.includes(n) ? u : [...u, n];
    return nuevos.length >= total ? [n] : nuevos;
  });
  return [usados, marcarUsado];
}

function VigiaPresentarVideo({ act, onExit }) {
  const { tipo, fmtT } = VigiaTipos;
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  // Controles NATIVOS de YouTube: volumen, subtítulos (CC, que se pueden
  // arrastrar), configuración y "Omitir anuncio" se manejan dentro del video.
  // fs: 0 -> sin el botón de pantalla completa de YouTube (ya lo está la app).
  const yt = useYouTube(act.video && act.video.id, { controls: 1, fs: 0, iv_load_policy: 3 });
  const raiz = React.useRef(null);

  const [empezado, setEmpezado] = React.useState(false);
  const [activa, setActiva] = React.useState(null);        // activación en pantalla
  const [frase, setFrase] = React.useState('¡Alto!');      // frase que irrumpe antes de la tarjeta
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();

  usePantallaCompleta(onExit);

  // --- Disparo de activaciones ---
  const prevT = React.useRef(0);
  React.useEffect(() => {
    const ant = prevT.current;
    prevT.current = yt.tiempo;
    if (activa || !yt.reproduciendo) return;
    // Mientras pasa un anuncio no se dispara nada (por si YouTube informa el
    // tiempo del anuncio en vez del del video).
    if (yt.videoActual && yt.videoActual() && yt.videoActual() !== act.video.id) return;
    const avance = yt.tiempo - ant;
    if (avance <= 0 || avance > 1.5) return;   // pausa o salto manual
    const alcanzada = lista.find((a) => a.t > ant && a.t <= yt.tiempo + 0.05);
    if (alcanzada) {
      yt.pause();
      yt.seek(alcanzada.t);
      setFrase((f) => VigiaTipos.fraseAlAzar(f));
      setActiva(alcanzada);
      // Si el foco estaba dentro del video (tras usar sus controles), el
      // teclado no llegaría a la app: se recupera para espacio / Esc.
      if (document.activeElement && document.activeElement.tagName === 'IFRAME') document.activeElement.blur();
      if (raiz.current) raiz.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yt.tiempo]);

  // Mientras haya una tarjeta o un reto en pantalla, el video queda DETENIDO
  // (aunque YouTube intente seguir tras el salto).
  React.useEffect(() => {
    if (activa && yt.reproduciendo) yt.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activa, yt.reproduciendo]);

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

  // --- Barra inferior que se oculta sola (así el grupo no ve en la línea de
  //     tiempo cuándo viene la próxima activación). Reaparece al pasar el
  //     mouse por la franja de abajo y no se oculta mientras esté encima. ---
  const [barraVisible, setBarraVisible] = React.useState(true);
  const ocultarBarra = React.useRef(null);
  const mostrarBarra = (ms) => {
    setBarraVisible(true);
    clearTimeout(ocultarBarra.current);
    ocultarBarra.current = setTimeout(() => setBarraVisible(false), ms || 2500);
  };
  const mantenerBarra = () => { setBarraVisible(true); clearTimeout(ocultarBarra.current); };
  React.useEffect(() => { mostrarBarra(3500); return () => clearTimeout(ocultarBarra.current); }, []);

  // --- Subtítulos (controles propios, además de los de YouTube) ---
  const [conSubtitulos, setConSubtitulos] = React.useState(false);
  const [tamSub, setTamSub] = React.useState(1);   // -1 a 3
  const alternarSubtitulos = () => { const v = !conSubtitulos; setConSubtitulos(v); yt.subtitulos(v); if (v) yt.tamanoSubtitulos(tamSub); };
  const cambiarTamSub = (d) => { const n = Math.max(-1, Math.min(3, tamSub + d)); setTamSub(n); if (!conSubtitulos) { setConSubtitulos(true); yt.subtitulos(true); } yt.tamanoSubtitulos(n); };

  const total = Math.max(yt.duracion || 0, 1);
  const barra = React.useRef(null);
  const saltar = (e) => {
    const r = barra.current.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * total;
    prevT.current = t;
    yt.seek(t);
  };
  // Clic en una marca de la barra: el video va a ESE segundo, se pausa y se
  // abre su tarjeta directamente (sin depender de que el video "pase" por ahí).
  const abrirMarca = (a) => {
    yt.pause();
    yt.seek(a.t);
    prevT.current = a.t + 0.1;   // al continuar, no vuelve a dispararse la misma
    if (!empezado) setEmpezado(true);
    setFrase((f) => VigiaTipos.fraseAlAzar(f));
    setActiva(a);
  };

  // --- Mando a distancia (celular): estado que ve y órdenes que envía ---
  const mando = useMandoVigia({
    recurso: 'video', titulo: act.titulo || '', empezado, reproduciendo: yt.reproduciendo,
    tiempo: Math.floor(yt.tiempo), duracion: Math.floor(yt.duracion || 0), volumen: yt.silencio ? 0 : yt.volumen,
    activa: activa ? { id: activa.id, tipo: activa.tipo } : null,
    lista: lista.map((a) => itemMando(a, fmtT(a.t))),
  }, (accion, o) => {
    if (accion === 'comenzar') { if (!empezado) comenzar(); }
    else if (accion === 'alternar') alternar();
    else if (accion === 'continuar') { if (activa && !esEscena(activa)) continuar(); }
    else if (accion === 'saltar') { const t = Math.max(0, yt.tiempo + (o.seg || 0)); prevT.current = t; yt.seek(t); }
    else if (accion === 'abrir') { const a = lista.find((x) => x.id === o.id); if (a) abrirMarca(a); }
    else if (accion === 'volumen') yt.setVolumen((yt.silencio ? 0 : yt.volumen) + (o.delta || 0));
    else if (accion === 'silencio') yt.alternarSilencio();
    else if (accion === 'salir') onExit();
  });

  return (
    <div className={'vigia vg-presentar tono-' + tono} data-screen-label="Modo Vigía · Presentar"
      ref={raiz} tabIndex={-1} style={{ outline: 'none' }}>
      {/* El video ocupa todo MENOS la franja de abajo (barra de la app). Nada
          de la app queda encima del video: sus controles (volumen, subtítulos,
          configuración, omitir anuncio, arriba o abajo) siempre responden. */}
      <div className="vg-video-zona">
        <div className="vg-presentar-video vg-proyectado-medio">
          <div ref={yt.montaje} className="vg-video"></div>
        </div>
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
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado}
          onContinuar={continuar} />
      )}

      {/* Barra de la app en su PROPIA franja inferior (fuera del video):
          reproducir, línea de tiempo con las activaciones, volumen,
          subtítulos y salir. */}
      {/* Con un reto en pantalla la barra sigue disponible (el reto deja libre esta franja). */}
      {(!activa || esEscena(activa)) && (
        <div className={'vg-barra-video' + (barraVisible ? '' : ' oculta')}
          onMouseEnter={mantenerBarra} onMouseMove={mantenerBarra} onMouseLeave={() => mostrarBarra(900)}>
          <button className="vg-ctrl" onClick={alternar} title="Reproducir / pausar (espacio)" aria-label="Reproducir o pausar">
            {yt.reproduciendo ? '❚❚' : '▶'}
          </button>
          <span className="vg-hud-tiempo">{fmtT(yt.tiempo)}</span>
          <div className="vg-hud-barra" ref={barra} onClick={saltar} title="Clic para ir a ese momento">
            <div className="vg-linea-progreso" style={{ width: (yt.tiempo / total) * 100 + '%' }}></div>
            {lista.map((a) => (
              <button key={a.id} className="vg-hud-marca vg-hud-marca-boton" style={{ left: (a.t / total) * 100 + '%', background: tipo(a.tipo).color }}
                onClick={(e) => { e.stopPropagation(); abrirMarca(a); }}
                title={'Abrir: ' + tipo(a.tipo).nombre + ' · ' + fmtT(a.t)} aria-label={'Abrir activación del minuto ' + fmtT(a.t)}></button>
            ))}
          </div>
          <span className="vg-hud-tiempo">{yt.duracion ? fmtT(yt.duracion) : '–:––'}</span>
          <span className="vg-ctrl-sep"></span>
          {/* Volumen */}
          <button className="vg-ctrl" onClick={yt.alternarSilencio} title={yt.silencio ? 'Activar sonido' : 'Silenciar'} aria-label="Silencio">
            {yt.silencio || yt.volumen === 0 ? '🔇' : yt.volumen < 50 ? '🔉' : '🔊'}
          </button>
          <input type="range" className="vg-volumen" min="0" max="100" step="5" value={yt.silencio ? 0 : yt.volumen}
            onChange={(e) => yt.setVolumen(Number(e.target.value))} title={'Volumen: ' + (yt.silencio ? 0 : yt.volumen) + '%'} aria-label="Volumen" />
          <span className="vg-ctrl-sep"></span>
          {/* Subtítulos */}
          <button className={'vg-ctrl vg-ctrl-cc' + (conSubtitulos ? ' on' : '')} onClick={alternarSubtitulos}
            title={(conSubtitulos ? 'Ocultar subtítulos' : 'Mostrar subtítulos (si el video los tiene)')
              + '. Color y fondo: en el video, ⚙ Configuración → Subtítulos → Opciones (YouTube lo recuerda en este computador).'}
            aria-label="Subtítulos">CC</button>
          <button className="vg-ctrl vg-ctrl-chico" onClick={() => cambiarTamSub(-1)} disabled={tamSub <= -1} title="Subtítulos más pequeños">A−</button>
          <button className="vg-ctrl vg-ctrl-chico" onClick={() => cambiarTamSub(1)} disabled={tamSub >= 3} title="Subtítulos más grandes">A+</button>
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={onExit} title="Salir (Esc)" aria-label="Salir">✕</button>
        </div>
      )}
      {/* Tono de pantalla: aparece al acercar el mouse al borde izquierdo. */}
      <TonoLateral tono={tono} setTono={setTono} />
      {/* Herramientas (pincel, abajo a la izquierda): lupa, marcador, puntero, texto. */}
      <HerramientasPresentar act={act} />
      {/* Mando a distancia: chip arriba a la derecha (QR y código). */}
      <MandoBadge mando={mando} />
    </div>
  );
}

/* Tarjeta central con borde de luz giratoria. "Continuar el video" va fuera
   de la tarjeta, en la esquina inferior derecha, para dejarle todo el espacio. */
function TarjetaActivacion(props) {
  // El "Reto de activación" (físico-grupal) tiene su propia escena: el cóndor
  // retador con rayos y luego el reto a pantalla completa (presentar-reto.jsx).
  if (props.a.tipo === 'reto') return <RetoActivacion {...props} />;
  // Modo Jaguar (equipos): el jaguar, su voz y los equipos (presentar-jaguar.jsx).
  if (/^jg-/.test(props.a.tipo)) return <JaguarActivacion {...props} />;
  return <TarjetaActivacionBase {...props} />;
}
function TarjetaActivacionBase({ a, frase, estudiantes, orden, usados, onUsado, onContinuar, textoContinuar, onCambiarActivacion }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const sorteo = ti.ruleta && a.ruleta && nombres.length > 0;
  // Pregunta cerrada: la pregunta y sus opciones necesitan todo el ancho, así
  // que en vez de la ruleta va un recuadro compacto de nombres (SelectorNombres)
  // entre la pregunta y las opciones. Los demás tipos conservan la ruleta.
  const opcionesValidas = (a.opciones || []).filter((o) => (o || '').trim()).length;
  const esCerrada = a.tipo === 'pregunta' && a.modo === 'cerrada' && opcionesValidas >= 2;
  const esAbierta = a.tipo === 'pregunta' && !esCerrada;
  // Pregunta cerrada: recuadro de nombres EN LA CABECERA (primero "¡Pregunta!",
  // luego se reemplaza por "¿Quién responde?" + nombres).
  const selector = sorteo && esCerrada
    ? <SelectorNombres nombres={nombres} usados={usados} onElegido={onUsado} titulo={ti.preguntaRuleta} orden={orden} clase="en-cabecera" />
    : null;
  // Pregunta abierta: recuadro de nombres vertical A LA DERECHA (donde iba la ruleta).
  const selectorLateral = sorteo && esAbierta
    ? <SelectorNombres nombres={nombres} usados={usados} onElegido={onUsado} titulo={ti.preguntaRuleta} orden={orden} clase="lateral" />
    : null;
  // Los demás tipos con sorteo (Creación, Nota de contexto, Glosario) conservan la ruleta.
  const conRuleta = sorteo && !esCerrada && !esAbierta;
  const dosColumnas = conRuleta || !!selectorLateral;
  // Tamaño de la letra de ESTA tarjeta (A− / A+, esquina superior derecha).
  const [escala, setEscala] = React.useState(1);
  const cambiarEscala = (dir) => setEscala((e) => {
    if (dir === 0) return 1;
    const i = ESCALAS_TARJETA.indexOf(e);
    return ESCALAS_TARJETA[Math.max(0, Math.min(ESCALAS_TARJETA.length - 1, (i < 0 ? 3 : i) + dir))];
  });
  // Desde el mando: letra más grande / normal / más pequeña.
  useOrdenMando((o) => { if (o.accion === 'letra') cambiarEscala(o.dir || 0); });
  // "Girar otra vez" va debajo del texto: la ruleta avisa su estado y gira
  // cuando cambia `giro`.
  const [giro, setGiro] = React.useState(0);
  const [ruleta, setRuleta] = React.useState({ girando: false, elegido: null });
  return (
    <div className="vg-velo">
      {/* La letra se ajusta al largo de la frase para que siempre quepa. */}
      <div className="vg-alto" aria-hidden="true"
        style={{ fontSize: 'min(14vw, 240px, ' + (150 / Math.max((frase || '').length, 1)).toFixed(2) + 'vw)' }}>
        {frase || '¡Alto!'}
      </div>
      {/* --ancho: al agrandar la letra, la tarjeta gana ANCHO (no alto): el
          texto ocupa los lados, que suelen tener espacio libre. */}
      <div className={'vg-tarjeta-marco' + (dosColumnas ? ' con-ruleta' : '') + (esCerrada ? ' cerrada' : '')}
        style={{ '--tipo': ti.color, '--ancho': Math.max(1, escala) }}>
        <div className="vg-tarjeta">
          {/* Letra más pequeña / normal / más grande (solo esta tarjeta). */}
          <div className="vg-tarjeta-letra" role="group" aria-label="Tamaño de la letra">
            <button onClick={() => cambiarEscala(-1)} disabled={escala <= ESCALAS_TARJETA[0]} title="Letra más pequeña">A−</button>
            <button onClick={() => cambiarEscala(0)} title={'Tamaño normal (ahora ' + Math.round(escala * 100) + '%)'} className="normal">Aa</button>
            <button onClick={() => cambiarEscala(1)} disabled={escala >= ESCALAS_TARJETA[ESCALAS_TARJETA.length - 1]} title="Letra más grande">A+</button>
          </div>
          <CabeceraTarjeta ti={ti} selector={selector} />
          <div className="vg-tarjeta-cuerpo">
            <div className="vg-tarjeta-contenido" style={{ zoom: escala }}>
              <ContenidoActivacion a={a} onCambiar={onCambiarActivacion} />
              {conRuleta && (
                <button className="vg-girar-otra" onClick={() => setGiro((g) => g + 1)}
                  style={{ visibility: ruleta.elegido && !ruleta.girando ? 'visible' : 'hidden' }}>
                  ↻ Girar otra vez
                </button>
              )}
            </div>
            {conRuleta && (
              <RuletaEstudiantes nombres={nombres} usados={usados} onElegido={onUsado} titulo={ti.preguntaRuleta} orden={orden}
                giroExterno={giro} onEstado={setRuleta} girarOtraFuera />
            )}
            {selectorLateral}
          </div>
        </div>
      </div>
      <button className="vg-btn vg-continuar" onClick={onContinuar}>{textoContinuar || 'Continuar el video'} <Icon name="play" size={16} /></button>
    </div>
  );
}

// Pasos de tamaño de letra de una tarjeta (1 = normal). Se aplica con `zoom`,
// así el texto se reacomoda en vez de solo estirarse.
const ESCALAS_TARJETA = [0.7, 0.8, 0.9, 1, 1.12, 1.25, 1.4, 1.6];

/* Cabecera de la tarjeta: ícono + título del tipo ("¡Pregunta!"…), con
   tipografía de títulos (Fraunces) y dos destellos. Si hay `selector`
   (pregunta cerrada con estudiantes), el título se ve primero y a los
   ~2,8 s se REEMPLAZA (sube y se desvanece) por "¿Quién responde?" + el
   recuadro de nombres, que entra desde abajo. Clic en el título: adelanta. */
const CABECERA_ESPERA_MS = 2800;
function CabeceraTarjeta({ ti, selector }) {
  const [fase, setFase] = React.useState('titulo');   // 'titulo' | 'quien'
  React.useEffect(() => {
    if (!selector) return;
    const t = setTimeout(() => setFase('quien'), CABECERA_ESPERA_MS);
    return () => clearTimeout(t);
  }, [!!selector]);
  const titulo = (
    <div className={'vg-tarjeta-kicker' + (selector && fase === 'quien' ? ' sale' : '')}
      onClick={selector ? () => setFase('quien') : undefined} aria-hidden={selector && fase === 'quien' ? 'true' : undefined}>
      <span className="vg-tarjeta-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={22} /></span>
      <span className="vg-destello" aria-hidden="true">✦</span>
      <span className="vg-titulo-texto">{ti.titular}</span>
      <span className="vg-destello dos" aria-hidden="true">✦</span>
    </div>
  );
  if (!selector) return titulo;
  return (
    <div className="vg-cabecera">
      {titulo}
      {fase === 'quien' && <div className="vg-cabecera-quien">{selector}</div>}
    </div>
  );
}

/* Contenido según el tipo de activación. `onCambiar` (opcional) guarda
   cambios hechos en vivo, como la definición del Glosario. En documentos, el
   texto marcado en el PDF (`fragmento`) se cita arriba. */
/* La letra se ajusta al largo del texto (pegado o escrito) para que se vea
   COMPLETO dentro de la tarjeta: clases " largo", " muy-largo", " extra". */
function claseLargo(texto, base) {
  const n = String(texto || '').length;
  const b = base || 1;   // textos que ya tienen letra pequeña aguantan más
  return n > 700 * b ? ' extra' : n > 380 * b ? ' muy-largo' : n > 170 * b ? ' largo' : '';
}

function ContenidoActivacion({ a, onCambiar }) {
  const cita = a.fragmento && a.tipo !== 'glosario' && a.tipo !== 'escritura'
    ? <div className={'vg-cita' + claseLargo(a.fragmento, 1.6)}>«{a.fragmento}»</div> : null;
  const img = <ImagenActivacion a={a} />;
  if (a.tipo === 'glosario') return <React.Fragment>{img}<ContenidoGlosario a={a} onCambiar={onCambiar} /></React.Fragment>;
  return <React.Fragment>{img}{cita}<ContenidoBase a={a} /></React.Fragment>;
}

/* Imagen opcional del activador (URL puesta en el editor), arriba del texto.
   Clic: la agranda a pantalla completa; otro clic la devuelve. */
function ImagenActivacion({ a }) {
  const [falla, setFalla] = React.useState(false);
  const [grande, setGrande] = React.useState(false);
  React.useEffect(() => { setFalla(false); }, [a.imagen]);
  if (!a.imagen || falla) return null;
  const src = urlImagen(a.imagen);
  return (
    <React.Fragment>
      <div className="vg-act-imagen" onClick={() => setGrande(true)} title="Clic para agrandar">
        <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setFalla(true)} />
      </div>
      {/* En <body>: la tarjeta tiene zoom/animaciones que encerrarían un position: fixed. */}
      {grande && ReactDOM.createPortal(
        <div className="vg-act-imagen-grande" onClick={(e) => { e.stopPropagation(); setGrande(false); }} title="Clic para cerrar">
          <img src={src} alt="" referrerPolicy="no-referrer" />
        </div>, document.body)}
    </React.Fragment>
  );
}

/* Glosario: la palabra señalada y una hoja donde el docente escribe en vivo
   la definición que construye el grupo (grande, para que todos la copien). */
function ContenidoGlosario({ a, onCambiar }) {
  const [definicion, setDefinicion] = React.useState(a.definicion || '');
  const escribir = (v) => { setDefinicion(v); if (onCambiar) onCambiar({ ...a, definicion: v }); };
  return (
    <div className="vg-glosario">
      <div className={'vg-glosario-termino' + claseLargo(a.termino || a.fragmento, 0.15)}>{a.termino || a.fragmento || 'Palabra'}</div>
      {a.texto && <div className={'vg-glosario-pista' + claseLargo(a.texto)}>{a.texto}</div>}
      <div className="vg-glosario-etiqueta">Definición entre todos</div>
      {/* La hoja crece con lo que se escribe o pega (AreaTexto, editor.jsx). */}
      <div className={'vg-hoja vg-hoja-editable' + claseLargo(definicion, 0.6)}>
        <AreaTexto value={definicion} onChange={(e) => escribir(e.target.value)} minRows={3} max={2000}
          placeholder="Escribe aquí lo que propone el grupo…" spellCheck="true" style={{ resize: 'none' }} />
      </div>
    </div>
  );
}

function ContenidoBase({ a }) {
  const [elegida, setElegida] = React.useState(null);
  const [revelada, setRevelada] = React.useState(false);
  const texto = a.texto || '';

  if (a.tipo === 'pregunta') {
    const opciones = (a.opciones || []).map((o) => (o || '').trim()).filter(Boolean);
    const cerrada = a.modo === 'cerrada' && opciones.length >= 2;
    const correcta = Math.min(a.correcta || 0, opciones.length - 1);
    // Cerrada: pregunta y opciones comparten la tarjeta, así que la letra baja
    // antes (según el largo de la pregunta y de la opción más larga).
    const masLarga = opciones.reduce((m, o) => Math.max(m, o.length), 0);
    const claseOpciones = masLarga > 140 ? ' extra' : masLarga > 80 ? ' muy-largo' : masLarga > 40 ? ' largo' : '';
    return (
      <div>
        <div className={'vg-texto-pregunta' + (cerrada ? ' cerrada' + claseLargo(texto, 0.55) : claseLargo(texto))}>{texto || '¿…?'}</div>
        {cerrada && (
          <React.Fragment>
            <div className={'vg-opciones' + claseOpciones}>
              {opciones.map((o, i) => {
                const estado = revelada ? (i === correcta ? ' correcta' : (i === elegida ? ' incorrecta' : ' apagada')) : (i === elegida ? ' elegida' : '');
                return (
                  <button key={i} className={'vg-opcion' + estado} onClick={() => !revelada && setElegida(i)}>
                    <span className="vg-opcion-letra">{String.fromCharCode(65 + i)}</span>{o}
                  </button>
                );
              })}
            </div>
            {/* Se oculta sin quitarse, para no cambiar la altura de la tarjeta. */}
            <button className="vg-btn-texto vg-revelar" onClick={() => setRevelada(true)}
              style={{ visibility: revelada ? 'hidden' : 'visible' }}>Revelar respuesta</button>
          </React.Fragment>
        )}
      </div>
    );
  }
  if (a.tipo === 'escritura') {
    return <div className={'vg-hoja' + claseLargo(texto, 0.6)}><p>{texto}</p></div>;
  }
  if (a.tipo === 'contexto') {
    return <div className={'vg-texto-contexto' + claseLargo(texto, 1.5)}>{texto}</div>;
  }
  // instruccion y creacion
  return <div className={'vg-texto-grande' + claseLargo(texto)}>{texto}</div>;
}

/* ---------- Tono de pantalla ("Exceso de luz") ----------
   Para probar qué se ve mejor en cada video beam o televisor. Se aplica a lo
   que se proyecta (documento, video y tarjetas) y se recuerda en este
   computador (cada salón tiene su proyector). Atajo: tecla L. */
const TONOS_PANTALLA = [
  { id: 'normal',    nombre: 'Normal',             desc: 'Colores originales' },
  { id: 'luz',       nombre: 'Exceso de luz',      desc: 'Tarjetas claras y texto más oscuro, para salones con mucha luz' },
  { id: 'contraste', nombre: 'Alto contraste',     desc: 'Negro y blanco intensos, para proyectores débiles' },
  { id: 'calido',    nombre: 'Tono cálido',        desc: 'Menos azul, más suave para la vista' },
];
function useTonoPresentar() {
  const [tono, setTonoState] = React.useState(() => {
    try { const t = localStorage.getItem('vigia_tono'); return TONOS_PANTALLA.some((x) => x.id === t) ? t : 'normal'; } catch (e) { return 'normal'; }
  });
  const setTono = (t) => { setTonoState(t); try { localStorage.setItem('vigia_tono', t); } catch (e) { /* sin almacenamiento */ } };
  const siguienteTono = () => {
    const i = TONOS_PANTALLA.findIndex((x) => x.id === tono);
    setTono(TONOS_PANTALLA[(i + 1) % TONOS_PANTALLA.length].id);
  };
  // Desde el mando: siguiente tono.
  useOrdenMando((o) => { if (o.accion === 'tono') siguienteTono(); });
  // Tecla L: pasa al siguiente tono.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.key === 'l' || e.key === 'L') { e.preventDefault(); siguienteTono(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  return [tono, setTono];
}

/* Botón ☀ con su lista de tonos. `hacia`: 'arriba' (por defecto) o
   'derecha' (desde el borde izquierdo). `onAbierto` avisa si el menú está abierto. */
function SelectorTono({ tono, setTono, hacia, onAbierto }) {
  const [abierto, setAbierto] = React.useState(false);
  React.useEffect(() => { if (onAbierto) onAbierto(abierto); }, [abierto]);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);
  const actual = TONOS_PANTALLA.find((x) => x.id === tono) || TONOS_PANTALLA[0];
  return (
    <div className={'vg-tono' + (hacia === 'derecha' ? ' hacia-derecha' : '')} ref={ref}>
      <button className={'vg-ctrl vg-ctrl-tono' + (tono !== 'normal' ? ' on' : '')} onClick={() => setAbierto((v) => !v)}
        title={'Exceso de luz / tono de pantalla: ' + actual.nombre + ' (tecla L)'} aria-label="Tono de pantalla">
        ☀
      </button>
      {abierto && (
        <div className="vg-tono-menu" role="menu">
          <div className="vg-tono-titulo">Tono de pantalla</div>
          {TONOS_PANTALLA.map((t) => (
            <button key={t.id} role="menuitemradio" aria-checked={t.id === tono}
              className={'vg-tono-op' + (t.id === tono ? ' on' : '')} onClick={() => setTono(t.id)}>
              <span className={'vg-tono-muestra tono-' + t.id}></span>
              <span style={{ minWidth: 0 }}>
                <strong>{t.nombre}</strong>
                <span>{t.desc}</span>
              </span>
            </button>
          ))}
          <div className="vg-tono-ayuda">Prueba cada uno y deja el que mejor se lea desde el fondo del salón. Tecla L para cambiar rápido.</div>
        </div>
      )}
    </div>
  );
}

/* El botón ☀ en el BORDE IZQUIERDO de Presentar: invisible hasta que el
   mouse se acerca a ese borde; se oculta al retirarlo (salvo con el menú
   abierto). Va en TODOS los modos Presentar del Modo Vigía. */
function TonoLateral({ tono, setTono }) {
  const [cerca, setCerca] = React.useState(false);
  const [menu, setMenu] = React.useState(false);
  const visible = cerca || menu;
  return (
    <div className={'vg-tono-lateral' + (visible ? ' visible' : '')}
      onMouseEnter={() => setCerca(true)} onMouseLeave={() => setCerca(false)}>
      <div className="vg-tono-lateral-boton">
        <SelectorTono tono={tono} setTono={setTono} hacia="derecha" onAbierto={setMenu} />
        <span className="vg-tono-lateral-etiqueta">Tono</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  VigiaPresentar, VigiaPresentarVideo, usePantallaCompleta, useUsadosRuleta, TarjetaActivacion, ContenidoActivacion, ImagenActivacion,
  TONOS_PANTALLA, useTonoPresentar, SelectorTono, TonoLateral, ESCALAS_TARJETA,
});
