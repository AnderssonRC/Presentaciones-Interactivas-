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
  if (act.recurso !== 'documento') return <VigiaPresentarVideo {...props} />;
  return act.pdf && act.pdf.formato === 'epub' ? <VigiaPresentarEpub {...props} /> : <VigiaPresentarPdf {...props} />;
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
  const yt = useYouTube(act.video && act.video.id, { controls: 0, disablekb: 1, fs: 0, iv_load_policy: 3 });

  const [empezado, setEmpezado] = React.useState(false);
  const [activa, setActiva] = React.useState(null);        // activación en pantalla
  const [frase, setFrase] = React.useState('¡Alto!');      // frase que irrumpe antes de la tarjeta
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();
  const [hudVisible, setHudVisible] = React.useState(true);

  usePantallaCompleta(onExit);

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
      setFrase((f) => VigiaTipos.fraseAlAzar(f));
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
    <div className={'vigia vg-presentar tono-' + tono} onMouseMove={moverMouse} data-screen-label="Modo Vigía · Presentar">
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
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado}
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
        <SelectorTono tono={tono} setTono={setTono} />
      </div>
      <button className={'hud-btn vg-salir' + (mostrarHud && !activa ? '' : ' oculto')} onClick={onExit} title="Salir (Esc)">✕ Salir</button>
    </div>
  );
}

/* Tarjeta central con borde de luz giratoria. "Continuar el video" va fuera
   de la tarjeta, en la esquina inferior derecha, para dejarle todo el espacio. */
function TarjetaActivacion({ a, frase, estudiantes, orden, usados, onUsado, onContinuar, textoContinuar, onCambiarActivacion }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const conRuleta = ti.ruleta && a.ruleta && nombres.length > 0;
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
      <div className={'vg-tarjeta-marco' + (conRuleta ? ' con-ruleta' : '')} style={{ '--tipo': ti.color }}>
        <div className="vg-tarjeta">
          <div className="vg-tarjeta-kicker" style={{ color: ti.color }}>
            <span className="vg-tarjeta-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={22} /></span>
            {ti.titular}
          </div>
          <div className="vg-tarjeta-cuerpo">
            <div className="vg-tarjeta-contenido">
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
          </div>
        </div>
      </div>
      <button className="vg-btn vg-continuar" onClick={onContinuar}>{textoContinuar || 'Continuar el video'} <Icon name="play" size={16} /></button>
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
  if (a.tipo === 'glosario') return <ContenidoGlosario a={a} onCambiar={onCambiar} />;
  return <React.Fragment>{cita}<ContenidoBase a={a} /></React.Fragment>;
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
    return (
      <div>
        <div className={'vg-texto-pregunta' + claseLargo(texto)}>{texto || '¿…?'}</div>
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

/* Botón ☀ con su lista de tonos (se abre hacia arriba). */
function SelectorTono({ tono, setTono }) {
  const [abierto, setAbierto] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);
  const actual = TONOS_PANTALLA.find((x) => x.id === tono) || TONOS_PANTALLA[0];
  return (
    <div className="vg-tono" ref={ref}>
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

Object.assign(window, {
  VigiaPresentar, VigiaPresentarVideo, usePantallaCompleta, useUsadosRuleta, TarjetaActivacion, ContenidoActivacion,
  TONOS_PANTALLA, useTonoPresentar, SelectorTono,
});
