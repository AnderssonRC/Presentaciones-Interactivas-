/* presentar-imagenes.jsx — Presentar una activación de imágenes (Modo Vigía).
   Cada imagen a pantalla completa con sus activadores como íconos que
   laten. Al pasar el mouse: primer vistazo (tipo + título). Al hacer clic:
     · tarjeta PEQUEÑA junto al ícono (la imagen sigue a la vista), o
     · tarjeta GRANDE central (con la frase que irrumpe), como en video.
   Abajo, una barra que se aclara al acercarse: anterior / puntos / siguiente,
   música de fondo (si hay) y salir. Flechas ← → para cambiar de imagen.
   Tono de pantalla ("Exceso de luz") en el borde izquierdo. */

function VigiaPresentarImagenes({ act, onExit, onChange }) {
  const { tipo, fraseAlAzar } = VigiaTipos;
  const g = act.galeria || {};
  const diapos = (g.diapos || []).filter((d) => d.url);
  const m = g.musica && g.musica.activa && g.musica.url ? g.musica : null;
  const raiz = React.useRef(null);

  const [i, setI] = React.useState(0);
  const [dir, setDir] = React.useState(1);   // dirección de la transición
  const [empezado, setEmpezado] = React.useState(false);
  const [activa, setActiva] = React.useState(null);   // tarjeta grande
  const [mini, setMini] = React.useState(null);       // { a, x, y } tarjeta pequeña
  const [frase, setFrase] = React.useState('¡Alto!');
  const [vistos, setVistos] = React.useState([]);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();
  const [musicaOn, setMusicaOn] = React.useState(true);

  usePantallaCompleta(onExit);

  const diapo = diapos[Math.min(i, diapos.length - 1)] || null;
  const puntos = (act.activaciones || []).filter((a) => diapo && a.diapo === diapo.id);
  const nombres = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  // --- Música de fondo: suena desde "Comenzar"; baja al abrir una tarjeta ---
  const rep = usePodcast(m, { controls: 0 });
  const vol = (m && m.volumen) || 40;
  const sonar = musicaOn && empezado && !!m;
  React.useEffect(() => {
    if (!rep.listo) return;
    if (sonar) { rep.setVolumen(activa || mini ? Math.round(vol * 0.3) : vol); rep.play(); } else rep.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep.listo, sonar, !!(activa || mini), vol]);
  // Al terminar, vuelve a empezar (música en bucle).
  React.useEffect(() => {
    if (sonar && rep.duracion && rep.tiempo >= rep.duracion - 0.6 && !rep.reproduciendo) { rep.seek(0); rep.play(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep.tiempo, rep.reproduciendo]);

  const ir = (n) => {
    if (!diapos.length) return;
    const j = (n + diapos.length) % diapos.length;
    setDir(j >= i ? 1 : -1); setI(j); setMini(null);
  };
  const marcarVisto = (a) => setVistos((v) => (v.includes(a.id) ? v : [...v, a.id]));
  const abrir = (a, el) => {
    marcarVisto(a);
    // Tarjeta grande (el reto siempre va a pantalla completa).
    if ((a.tarjeta || 'grande') === 'grande' || esEscena(a)) { setMini(null); setFrase((f) => fraseAlAzar(f)); setActiva(a); return; }
    const r = el.getBoundingClientRect();
    setMini((x) => (x && x.a.id === a.id ? null : { a, x: r.left + r.width / 2, y: r.top + r.height / 2 }));
  };
  const cerrar = () => { setActiva(null); setMini(null); if (raiz.current) raiz.current.focus(); };
  // Glosario: la definición escrita en vivo se guarda.
  const cambiarActivacion = (a) => {
    if (onChange) onChange({ ...act, activaciones: (act.activaciones || []).map((x) => (x.id === a.id ? a : x)) });
    if (activa && activa.id === a.id) setActiva(a);
    if (mini && mini.a.id === a.id) setMini({ ...mini, a });
  };

  // --- Teclado: ← → cambian de imagen; espacio/Enter cierra; Esc cierra o sale ---
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      if (!empezado) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setEmpezado(true); } else if (e.key === 'Escape') onExit(); return; }
      if (e.key === 'Escape') { if (activa || mini) cerrar(); else onExit(); }
      else if ((e.key === ' ' || e.key === 'Enter') && (activa || mini)) { e.preventDefault(); cerrar(); }
      else if (!activa && (e.key === 'ArrowRight' || e.key === 'PageDown')) { e.preventDefault(); ir(i + 1); }
      else if (!activa && (e.key === 'ArrowLeft' || e.key === 'PageUp')) { e.preventDefault(); ir(i - 1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const total = (act.activaciones || []).filter((a) => diapos.some((d) => d.id === a.diapo)).length;

  // --- Mando a distancia (celular) ---
  // Abrir un activador de cualquier imagen (si es de otra, primero se va a ella).
  const abrirDesdeMando = (id) => {
    const a = (act.activaciones || []).find((x) => x.id === id);
    const k = a ? diapos.findIndex((d) => d.id === a.diapo) : -1;
    if (k < 0) return;
    if (!empezado) setEmpezado(true);
    const hacer = () => {
      const el = document.querySelector('[data-punto="' + id + '"] .vg-punto-boton')
        || { getBoundingClientRect: () => ({ left: window.innerWidth / 2 - 20, top: window.innerHeight / 2 - 20, width: 40, height: 40 }) };
      abrir(a, el);
    };
    if (k !== i) { ir(k); setTimeout(hacer, 500); } else setTimeout(hacer, empezado ? 0 : 300);
  };
  const enOrden = diapos.flatMap((d, k) => (act.activaciones || []).filter((a) => a.diapo === d.id).map((a) => itemMando(a, 'Imagen ' + (k + 1), vistos.includes(a.id))));
  const mando = useMandoVigia({
    recurso: 'imagenes', titulo: act.titulo || '', empezado,
    diapo: i + 1, total: diapos.length, diapoTitulo: (diapo && diapo.titulo) || '',
    activa: activa ? { id: activa.id, tipo: activa.tipo } : mini ? { id: mini.a.id, tipo: mini.a.tipo, pequena: true } : null,
    lista: enOrden, musica: m ? musicaOn : null,
  }, (accion, o) => {
    const abierta = (activa && !esEscena(activa)) || mini;
    if (accion === 'comenzar') setEmpezado(true);
    else if (accion === 'siguiente') ir(i + 1);
    else if (accion === 'anterior') ir(i - 1);
    else if (accion === 'abrir') abrirDesdeMando(o.id);
    else if (accion === 'continuar') { if (abierta) cerrar(); }
    else if (accion === 'alternar') { if (!empezado) setEmpezado(true); else if (abierta) cerrar(); else if (!activa) ir(i + 1); }
    else if (accion === 'musica') setMusicaOn((v) => !v);
    else if (accion === 'salir') onExit();
  });

  return (
    <div className={'vigia vg-presentar vg-presentar-imagenes tono-' + tono} data-screen-label="Modo Vigía · Presentar imágenes"
      ref={raiz} tabIndex={-1} style={{ outline: 'none' }}>
      {/* Música: el reproductor queda oculto. */}
      {m && <div className="vg-musica-oculta" aria-hidden="true"><div ref={rep.montaje} className="vg-video"></div></div>}

      {diapo && (
        <div key={diapo.id} className={'vg-diapo ' + (dir > 0 ? 'desde-derecha' : 'desde-izquierda')}>
          {/* Fondo: la misma imagen difuminada. */}
          <div className="vg-diapo-fondo" style={{ backgroundImage: 'url(' + JSON.stringify(urlImagen(diapo.url)) + ')' }}></div>
          <LienzoImagen url={diapo.url} onClickHoja={() => setMini(null)} className="grande">
            {empezado && puntos.map((a, k) => (
              <PuntoActivador key={a.id} a={a} visto={vistos.includes(a.id)} abierto={mini && mini.a.id === a.id}
                retraso={k * 0.12} onAbrir={abrir} />
            ))}
          </LienzoImagen>
          {diapo.titulo && <div className="vg-diapo-titulo-pres">{diapo.titulo}</div>}
        </div>
      )}

      {/* Portada antes de empezar */}
      {!empezado && (
        <div className="vg-portada">
          <img src={VIGIA_LOGO} alt="" className="vg-portada-logo" />
          <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Modo Vigía · Imágenes</div>
          <h1>{act.titulo || 'Activación'}</h1>
          {act.objetivo && <p>{act.objetivo}</p>}
          <div className="vg-portada-info">
            {diapos.length} {diapos.length === 1 ? 'imagen' : 'imágenes'} · {total} {total === 1 ? 'activador escondido' : 'activadores escondidos'}. Explora con atención.
          </div>
          <button className="vg-btn vg-btn-grande" onClick={() => setEmpezado(true)}>
            <Icon name="play" size={22} /> Comenzar{m ? ' con música' : ''}
          </button>
        </div>
      )}

      {/* Tarjeta pequeña junto al ícono */}
      {mini && (
        <MiniTarjeta key={mini.a.id} a={mini.a} x={mini.x} y={mini.y} nombres={nombres} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado} onCerrar={cerrar} onCambiar={cambiarActivacion} />
      )}

      {/* Tarjeta grande */}
      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado} onContinuar={cerrar} textoContinuar="Volver a la imagen"
          onCambiarActivacion={cambiarActivacion} />
      )}

      {/* Navegación (se aclara al acercar el mouse) */}
      {empezado && (!activa || esEscena(activa)) && (
        <div className="vg-nav-diapos">
          <button className="vg-ctrl" onClick={() => ir(i - 1)} disabled={diapos.length < 2} title="Imagen anterior (←)" aria-label="Anterior">‹</button>
          <div className="vg-nav-puntos">
            {diapos.map((d, k) => {
              const ps = (act.activaciones || []).filter((a) => a.diapo === d.id);
              const completa = ps.length > 0 && ps.every((a) => vistos.includes(a.id));
              return (
                <button key={d.id} className={'vg-nav-punto' + (k === i ? ' on' : '') + (completa ? ' completa' : '')}
                  onClick={() => ir(k)} title={(d.titulo || 'Imagen ' + (k + 1)) + (ps.length ? ' · ' + ps.length + ' activador' + (ps.length === 1 ? '' : 'es') : '')}
                  aria-label={'Ir a la imagen ' + (k + 1)}></button>
              );
            })}
          </div>
          <span className="vg-nav-num">{i + 1} / {diapos.length}</span>
          <button className="vg-ctrl" onClick={() => ir(i + 1)} disabled={diapos.length < 2} title="Imagen siguiente (→)" aria-label="Siguiente">›</button>
          {m && (
            <React.Fragment>
              <span className="vg-ctrl-sep"></span>
              <button className={'vg-ctrl vg-ctrl-musica' + (musicaOn ? ' on' : '')} onClick={() => setMusicaOn((v) => !v)}
                title={musicaOn ? 'Pausar la música de fondo' : 'Reanudar la música de fondo'} aria-label="Música de fondo">
                ♪{musicaOn ? '' : <span className="vg-tachado"></span>}
              </button>
            </React.Fragment>
          )}
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={onExit} title="Salir (Esc)" aria-label="Salir">✕</button>
        </div>
      )}
      <TonoLateral tono={tono} setTono={setTono} />
      {/* Herramientas (pincel, abajo a la izquierda): lupa, marcador, puntero, texto. */}
      <HerramientasPresentar act={act} />
      {/* Mando a distancia: chip arriba a la derecha (QR y código). */}
      <MandoBadge mando={mando} />
    </div>
  );
}

/* Ícono de un activador sobre la imagen: late hasta que se abre; al pasar
   el mouse muestra el primer vistazo (tipo + título). */
function PuntoActivador({ a, visto, abierto, retraso, onAbrir }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const texto = vistazoDe(a);
  const arriba = a.y > 0.22;   // el vistazo va arriba del ícono (o abajo si está muy arriba)
  return (
    <div className={'vg-punto-pres' + (visto ? ' visto' : '') + (abierto ? ' abierto' : '')} data-punto={a.id}
      style={{ left: a.x * 100 + '%', top: a.y * 100 + '%', '--tipo': ti.color, animationDelay: retraso + 's' }}>
      <button className="vg-punto vg-punto-boton" onClick={(e) => { e.stopPropagation(); onAbrir(a, e.currentTarget); }}
        aria-label={ti.nombre + (texto ? ': ' + texto : '')}>
        <Icon name={ti.icon} size={22} />
      </button>
      <div className={'vg-vistazo ' + (arriba ? 'arriba' : 'abajo') + (a.x > 0.75 ? ' a-la-izquierda' : a.x < 0.25 ? ' a-la-derecha' : '')} aria-hidden="true">
        <span className="vg-vistazo-tipo"><Icon name={ti.icon} size={12} /> {ti.nombre}{(a.tarjeta || 'grande') === 'pequena' ? '' : ' · tarjeta grande'}</span>
        {texto && <span className="vg-vistazo-texto">{texto}</span>}
      </div>
    </div>
  );
}

/* Tarjeta pequeña: se abre al lado del ícono (hacia donde hay más espacio). */
function MiniTarjeta({ a, x, y, nombres, orden, usados, onUsado, onCerrar, onCambiar }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const ancho = Math.min(460, window.innerWidth * 0.92);
  const izquierda = x > window.innerWidth / 2;
  const left = Math.max(12, Math.min(window.innerWidth - ancho - 12, izquierda ? x - 34 - ancho : x + 34));
  const top = Math.max(12, Math.min(window.innerHeight * 0.45, y - 70));
  const sorteo = ti.ruleta && a.ruleta && nombres.length > 0;
  return (
    <div className="vg-mini-tarjeta" style={{ left, top, width: ancho, '--tipo': ti.color }} role="dialog" aria-label={ti.nombre}
      onClick={(e) => e.stopPropagation()}>
      <div className="vg-mini-cabeza">
        <span className="vg-tarjeta-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={16} /></span>
        <span className="vg-mini-titulo">{ti.titular}</span>
        <span style={{ flex: 1 }}></span>
        <button className="vg-mini-cerrar" onClick={onCerrar} title="Cerrar (Esc)" aria-label="Cerrar">✕</button>
      </div>
      <div className="vg-mini-cuerpo">
        <div className="vg-mini-contenido"><ContenidoActivacion a={a} onCambiar={onCambiar} /></div>
        {sorteo && (
          <SelectorNombres nombres={nombres} usados={usados} onElegido={onUsado} titulo={ti.preguntaRuleta} orden={orden} clase="en-mini" />
        )}
      </div>
    </div>
  );
}

Object.assign(window, { VigiaPresentarImagenes, PuntoActivador, MiniTarjeta });
