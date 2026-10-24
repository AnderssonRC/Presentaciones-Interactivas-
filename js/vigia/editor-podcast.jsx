/* editor-podcast.jsx — Editor de Activaciones del Modo Vigía (recurso: Podcast).
   Igual que el de video (mismas 3 columnas, línea de tiempo y tipos), pero
   en vez del video se ve la IMAGEN del podcast. Además de activaciones se
   insertan IMÁGENES en el tiempo: cada una se muestra desde su minuto hasta
   que llega la siguiente (antes de la primera, la imagen inicial).

   Documento guardado:
     { ..., recurso: 'podcast',
       podcast: { url, fuente: 'youtube'|'spotify'|'soundcloud'|'audio', id?, src,
                  imagen (inicial), portada?, imagenes: [{ id, t, url }] },
       activaciones: [{ id, tipo, t, texto, ... }] }   (como en video) */

function VigiaEditorPodcast({ act, onChange, onBack, onPresent }) {
  const { TIPOS, recurso, tipo, nuevaActivacion, fmtT } = VigiaTipos;
  const rec = recurso(act.recurso);
  const lista = (act.activaciones || []).slice().sort((x, y) => x.t - y.t);
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const p = act.podcast || {};
  const imagenes = imagenesDe(p);
  // Columna 1: activaciones e imágenes juntas, en orden de tiempo.
  const items = [...lista, ...imagenes.map((x) => ({ ...x, esImagen: true }))].sort((x, y) => x.t - y.t || (x.esImagen ? -1 : 1));

  const [selId, setSelId] = React.useState(items[0] ? items[0].id : null);
  const [estOpen, setEstOpen] = React.useState(false);
  const [cambiando, setCambiando] = React.useState(false);
  const [verReproductor, setVerReproductor] = React.useState(false);

  const hayAudio = VigiaTipos.recursoListo(act) && !cambiando;
  const rep = usePodcast(hayAudio ? p : null, { controls: 1, iv_load_policy: 3 });

  const update = (patch) => onChange({ ...act, ...patch });
  const setActivaciones = (arr) => update({ activaciones: arr.slice().sort((x, y) => x.t - y.t) });
  const setImagenes = (arr) => update({ podcast: { ...p, imagenes: arr.slice().sort((x, y) => x.t - y.t) } });
  const sel = items.find((a) => a.id === selId) || null;

  // Mientras suena, lo que se alcanza (activación o imagen) queda seleccionado.
  const prevT = React.useRef(0);
  React.useEffect(() => {
    const ant = prevT.current;
    prevT.current = rep.tiempo;
    if (!rep.reproduciendo || rep.tiempo - ant <= 0 || rep.tiempo - ant > 1.5) return;
    const alcanzada = items.find((a) => a.t > ant && a.t <= rep.tiempo);
    if (alcanzada) setSelId(alcanzada.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rep.tiempo]);

  const agregar = (tipoId) => {
    rep.pause();
    const a = nuevaActivacion(tipoId, rep.tiempo);
    setActivaciones([...(act.activaciones || []), a]);
    setSelId(a.id);
  };
  const agregarImagen = () => {
    rep.pause();
    const x = { id: AIP.uid(), t: Math.max(0, Math.round(rep.tiempo)), url: '' };
    setImagenes([...imagenes, x]);
    setSelId(x.id);
  };
  const cambiar = (a) => setActivaciones((act.activaciones || []).map((x) => (x.id === a.id ? a : x)));
  const cambiarImagen = (x) => {
    const { esImagen, ...limpia } = x;   // la marca de la lista no se guarda
    setImagenes(imagenes.map((y) => (y.id === x.id ? limpia : y)));
  };
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar esta activación?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    setActivaciones((act.activaciones || []).filter((x) => x.id !== id));
    if (selId === id) setSelId(null);
  };
  const borrarImagen = async (id) => {
    if (!await vigiaConfirmar('¿Quitar esta imagen del podcast?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    setImagenes(imagenes.filter((x) => x.id !== id));
    if (selId === id) setSelId(null);
  };
  const seleccionar = (a) => { setSelId(a.id); rep.seek(a.t); };

  return (
    <div className="editor-shell vigia vg-editor" data-screen-label="Modo Vigía · Editor de podcast">
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la activación"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo descubra con este podcast?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <RecursoChips act={act} update={update} />
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />
        <button className="btn vigia-btn-crear" onClick={() => { rep.pause(); onPresent(); }} disabled={!VigiaTipos.recursoListo(act)}
          title={VigiaTipos.recursoListo(act) ? 'Presentar el podcast con sus activaciones' : 'Primero añade el enlace del podcast'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      {!hayAudio ? (
        <PasoPodcast actual={p}
          onListo={(datos) => {
            // Se conservan las imágenes en el tiempo y la imagen inicial elegida.
            update({ podcast: { imagenes: p.imagenes || [], ...datos } });
            setCambiando(false);
          }}
          onCancelar={VigiaTipos.recursoListo(act) ? () => setCambiando(false) : null} />
      ) : (
        <div className="editor-body">
          {/* ---- columna 1: activaciones e imágenes en orden de tiempo ---- */}
          <div className="editor-list">
            <div className="kicker" style={{ padding: '2px 4px' }}>Activaciones · {lista.length} · Imágenes · {imagenes.length}</div>
            {!items.length && (
              <div style={{ fontSize: 12.5, color: 'var(--muted)', padding: '4px' }}>
                Reproduce el podcast, detente donde quieras activar al grupo o cambiar la imagen, y elige a la derecha.
              </div>
            )}
            {items.map((a) => {
              if (a.esImagen) {
                return (
                  <button key={a.id} className={'slide-thumb vg-thumb vg-thumb-img' + (a.id === selId ? ' active' : '')} onClick={() => seleccionar(a)}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.08em' }}>
                      <span className="vg-dot vg-dot-img"></span>
                      {fmtT(a.t)} · IMAGEN
                    </span>
                    {a.url
                      ? <img src={urlImagen(a.url)} alt="" className="vg-thumb-foto" referrerPolicy="no-referrer" />
                      : <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--naranja-ink)' }}>Falta la URL</span>}
                    <span className="thumb-actions">
                      <span className="thumb-action" role="button" title="Quitar" onClick={(e) => { e.stopPropagation(); borrarImagen(a.id); }}>✕</span>
                    </span>
                  </button>
                );
              }
              const ti = tipo(a.tipo);
              return (
                <button key={a.id} className={'slide-thumb vg-thumb' + (a.id === selId ? ' active' : '')} onClick={() => seleccionar(a)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.08em' }}>
                    <span className="vg-dot" style={{ background: ti.color }}></span>
                    {fmtT(a.t)} · {ti.nombre.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.texto || 'Sin texto aún'}
                  </span>
                  <span className="thumb-actions">
                    <span className="thumb-action" role="button" title="Eliminar" onClick={(e) => { e.stopPropagation(); borrar(a.id); }}>✕</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ---- columna 2: imagen del podcast + controles + línea de tiempo ---- */}
          <div className="editor-canvas-col">
            <div className="vg-video-marco">
              <PortadaPodcast img={imagenEn(p, rep.tiempo)} rep={rep} verReproductor={verReproductor}
                precargar={imagenes.map((x) => urlImagen(x.url))}
                onTam={(id, tam) => update({ podcast: conTamImagen(p, id, tam) })} />
              {rep.error && <div className="vg-video-error">{rep.error}</div>}
            </div>
            <ControlesAudio rep={rep} />
            <LineaTiempo duracion={rep.duracion} tiempo={rep.tiempo} activaciones={lista} selId={selId}
              onSeek={rep.seek} onSelect={seleccionar} imagenes={imagenes}
              onMover={(a, t) => { cambiar({ ...a, t }); setSelId(a.id); }}
              onMoverImagen={(x, t) => {
                // Se mueve con su duración: si tenía fin, el fin se corre igual.
                const movida = { ...x, t };
                if (typeof x.fin === 'number') movida.fin = x.fin + (t - x.t);
                cambiarImagen(movida); setSelId(x.id);
              }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--muted)', marginTop: -8, flexWrap: 'wrap', width: '100%', maxWidth: 980 }}>
              <MinutoExacto tiempo={rep.tiempo} duracion={rep.duracion} onIr={(t) => { rep.seek(t); rep.pause(); }} avisoYouTube={rep.esYouTube} />
              <span style={{ flex: 1 }}></span>
              {rep.reproductorVisible && (
                <button className="vg-btn-texto" onClick={() => setVerReproductor((v) => !v)}
                  title={'Muestra el reproductor de ' + rep.reproductorVisible + ' (por ejemplo, para omitir un anuncio o darle play si no arranca)'}>
                  {verReproductor ? 'Mostrar la imagen' : 'Ver ' + rep.reproductorVisible}
                </button>
              )}
              <button className="vg-btn-texto" onClick={() => setCambiando(true)}>Cambiar audio</button>
            </div>

            {sel && sel.esImagen ? (
              <ConfigImagen key={sel.id} x={sel} onCambiar={cambiarImagen}
                juntas={imagenes.filter((y) => y.id !== sel.id && Math.round(y.t) === Math.round(sel.t)).length} onBorrar={() => borrarImagen(sel.id)}
                tiempoActual={rep.tiempo} duracion={rep.duracion} onIr={() => rep.seek(sel.t)} />
            ) : sel ? (
              <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)}
                tiempoActual={rep.tiempo} duracion={rep.duracion} hayEstudiantes={estudiantes.length > 0}
                onAbrirEstudiantes={() => setEstOpen(true)} onIr={() => rep.seek(sel.t)} />
            ) : (
              <div className="config-card" style={{ color: 'var(--muted)', fontSize: 14 }}>
                Selecciona una activación o una imagen de la lista o de la línea de tiempo para editarla.
              </div>
            )}
            {/* La imagen inicial solo se edita al inicio (antes de la primera imagen). */}
            {(!imagenes.length || rep.tiempo < imagenes[0].t) && (
              <CampoImagen valor={p.imagen || ''} portada={p.portada} onCambiar={(imagen) => update({ podcast: { ...p, imagen } })} />
            )}
          </div>

          {/* ---- columna 3: imágenes y tipos de activación ---- */}
          <div className="editor-tools">
            <div>
              <div className="kicker">Imágenes del</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Podcast</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                La imagen cambia en el segundo actual y se queda hasta la siguiente.
              </p>
            </div>
            <button className="tool-card vg-tipo" onClick={agregarImagen} title={'Cambiar la imagen en ' + fmtT(rep.tiempo)}>
              <span className="tool-ico vg-ico-img"><Icon name="eye" size={19} /></span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>Imagen en {fmtT(rep.tiempo)}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>Por URL. Si ya hay una en este segundo, se ven las dos juntas.</span>
              </span>
              <span className="tool-add">+</span>
            </button>
            <div style={{ marginTop: 14 }}>
              <div className="kicker">Tipos de</div>
              <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activación</h3>
              <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
                Se agrega en el segundo actual del audio (lo pausa). Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
              </p>
            </div>
            <TiposAgrupados lista={TIPOS} render={(t) => {
              const habilitado = rec.tipos.includes(t.id);
              return (
                <button key={t.id} className={'tool-card vg-tipo' + (habilitado ? '' : ' tool-soon')} disabled={!habilitado}
                  onClick={() => habilitado && agregar(t.id)}
                  title={habilitado ? 'Añadir ' + t.nombre + ' en ' + fmtT(rep.tiempo) : 'No disponible para ' + rec.nombre}>
                  <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                  <span style={{ minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                  </span>
                  <span className="tool-add">+</span>
                </button>
              );
            }} />
          </div>
        </div>
      )}
    </div>
  );
}

/* La imagen del podcast, encima del reproductor (YouTube, Spotify o
   SoundCloud quedan tapados y solo se ven con "Ver …"). Al cambiar de imagen,
   la nueva aparece SOBRE la anterior con un fundido. Fondo: la misma imagen
   difuminada, así cualquier formato llena el marco. Mientras suena, unas
   ondas se mueven abajo. Clic en la imagen (editor): reproducir / pausar. */
/* `img`: { clave, imagenes: [{ id, src, tam }] } (imagenEn). Si hay varias
   (mismo segundo), se ven juntas, lado a lado. `onTam(ids, tam)`: si se da,
   aparece arriba a la derecha el control de tamaño (− 90 % +) al pasar el mouse. */
function PortadaPodcast({ img, rep, verReproductor, grande, titulo, precargar, onTam }) {
  const grupo = (img && img.imagenes) || [];
  const clave = (img && img.clave) || '';
  const huella = grupo.map((x) => x.src + '@' + x.tam).join('|');
  const tam = grupo[0] ? grupo[0].tam : TAM_IMAGEN;
  // Las dos últimas imágenes: la anterior queda debajo mientras entra la nueva.
  const [capas, setCapas] = React.useState([{ clave, grupo, k: 0 }]);
  React.useEffect(() => {
    setCapas((c) => {
      const u = c[c.length - 1];
      if (u.clave === clave) return [...c.slice(0, -1), { ...u, grupo }];   // mismo grupo: cambia tamaño o URL
      return [...c.slice(-1), { clave, grupo, k: u.k + 1 }];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave, huella]);
  // Terminado el fundido, la imagen anterior se retira (si no, se asomaría
  // por detrás de una nueva más pequeña).
  React.useEffect(() => {
    if (capas.length < 2) return;
    const r = setTimeout(() => setCapas((c) => c.slice(-1)), 850);
    return () => clearTimeout(r);
  }, [capas]);
  const [fallas, setFallas] = React.useState({});
  // Proporción de cada imagen (ancho / alto), para agrandarla sin deformarla.
  const [proporciones, setProporciones] = React.useState({});
  const estiloImg = (c) => {
    const r = proporciones[c.src];
    if (!r) return { maxWidth: c.tam + 'cqw', maxHeight: c.tam + 'cqh' };
    return { aspectRatio: String(r), width: 'min(' + c.tam + 'cqw, ' + (c.tam * r).toFixed(2) + 'cqh)', height: 'auto' };
  };
  // Precarga: así el cambio de imagen es inmediato al presentar.
  const clavePrecarga = (precargar || []).join('|');
  React.useEffect(() => { (precargar || []).forEach((u) => { if (u) { const i = new Image(); i.referrerPolicy = 'no-referrer'; i.src = u; } }); }, [clavePrecarga]);
  const alternar = () => (rep.reproduciendo ? rep.pause() : rep.play());
  return (
    <div className={'vg-podcast-portada' + (rep.reproduciendo ? ' sonando' : '') + (verReproductor ? ' ver-yt' : '') + (grande ? ' grande' : '')}>
      <div ref={rep.montaje} className="vg-video vg-podcast-yt"></div>
      <div className="vg-podcast-imagen vg-proyectado-medio" onClick={grande ? undefined : alternar}
        title={grande ? undefined : (rep.reproduciendo ? 'Pausar' : 'Reproducir')}>
        {capas.map((c, i) => {
          const fondo = (c.grupo.find((x) => x.src && !fallas[x.src]) || {}).src;
          return (
            <div key={c.k} className={'vg-podcast-capa' + (i === capas.length - 1 && c.k > 0 ? ' entra' : '')}>
              {fondo && <div className="vg-podcast-fondo" style={{ backgroundImage: 'url(' + JSON.stringify(fondo) + ')' }}></div>}
              <div className={'vg-podcast-grupo' + (c.grupo.length > 1 ? ' varias' : '')}>
                {c.grupo.map((x, j) => (
                  <div key={(x.id || 'inicial') + j} className="vg-podcast-hueco">
                    {x.src && !fallas[x.src] ? (
                      <img src={x.src} alt="" className="vg-podcast-img" referrerPolicy="no-referrer" style={estiloImg(x)}
                        onLoad={(e) => { const el = e.target; if (el.naturalWidth && el.naturalHeight) setProporciones((pr) => ({ ...pr, [x.src]: el.naturalWidth / el.naturalHeight })); }}
                        onError={() => setFallas((f) => ({ ...f, [x.src]: true }))} />
                    ) : (
                      <div className="vg-podcast-sin">
                        <img src={VIGIA_LOGO} alt="" />
                        {x.src && fallas[x.src] && <span>No se pudo cargar la imagen. Revisa que el enlace sea público.</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {titulo && <div className="vg-podcast-titulo">{titulo}</div>}
        {onTam && grupo.some((x) => x.src && !fallas[x.src]) && (
          <div className="vg-tam-imagen" onClick={(e) => e.stopPropagation()} role="group" aria-label="Tamaño de la imagen">
            <span>{grupo.length > 1 ? 'Imágenes' : 'Imagen'}</span>
            <button onClick={() => onTam(grupo.map((x) => x.id), tam - 10)} disabled={tam <= 20} title="Más pequeña">−</button>
            <button className="valor" onClick={() => onTam(grupo.map((x) => x.id), TAM_IMAGEN)} title="Tamaño normal">{tam}%</button>
            <button onClick={() => onTam(grupo.map((x) => x.id), tam + 10)} disabled={tam >= 100} title="Más grande">+</button>
          </div>
        )}
        <div className="vg-podcast-ondas" aria-hidden="true">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} style={{ animationDelay: (i * 0.13).toFixed(2) + 's' }}></span>)}
        </div>
      </div>
    </div>
  );
}

/* Reproducir / pausar, −10 s / +10 s y volumen (el audio no tiene controles visibles). */
function ControlesAudio({ rep }) {
  const { fmtT } = VigiaTipos;
  return (
    <div className="vg-controles-audio">
      <button className="btn btn-sm" onClick={() => rep.seek(rep.tiempo - 10)} disabled={!rep.listo} title="Retroceder 10 s">↺ 10 s</button>
      <button className="btn vigia-btn-crear" onClick={() => (rep.reproduciendo ? rep.pause() : rep.play())} disabled={!rep.listo}
        style={{ minWidth: 118, justifyContent: 'center' }}>
        {rep.reproduciendo ? '❚❚ Pausar' : <React.Fragment><Icon name="play" size={14} /> Reproducir</React.Fragment>}
      </button>
      <button className="btn btn-sm" onClick={() => rep.seek(rep.tiempo + 10)} disabled={!rep.listo} title="Adelantar 10 s">10 s ↻</button>
      <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--muted)', fontSize: 13 }}>
        {rep.listo ? fmtT(rep.tiempo) + ' / ' + (rep.duracion ? fmtT(rep.duracion) : '–:––') : 'Cargando audio…'}
      </span>
      <span style={{ flex: 1 }}></span>
      {rep.conVolumen ? (
        <React.Fragment>
          <button className="icon-btn" onClick={rep.alternarSilencio} title={rep.silencio ? 'Activar sonido' : 'Silenciar'}>
            {rep.silencio || rep.volumen === 0 ? '🔇' : rep.volumen < 50 ? '🔉' : '🔊'}
          </button>
          <input type="range" className="vg-volumen" min="0" max="100" step="5" value={rep.silencio ? 0 : rep.volumen}
            onChange={(e) => rep.setVolumen(Number(e.target.value))} title="Volumen" aria-label="Volumen" />
        </React.Fragment>
      ) : (
        <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Volumen: el del computador ({rep.reproductorVisible} no deja cambiarlo)</span>
      )}
    </div>
  );
}

const AYUDA_IMAGEN = 'Clic derecho sobre una imagen de internet → «Copiar dirección de imagen». De Google Drive: compártela como «Cualquier persona con el enlace».';

// "https://images.unsplash.com/photos/abc/foto-larga.jpg?x=1" -> "images.unsplash.com/…/foto-larga.jpg"
function enlaceCorto(url) {
  try {
    const u = new URL(url);
    const partes = u.pathname.split('/').filter(Boolean);
    const ultimo = partes.length ? decodeURIComponent(partes[partes.length - 1]) : '';
    const fin = ultimo.length > 28 ? ultimo.slice(0, 25) + '…' : ultimo;
    return u.hostname.replace(/^www\./, '') + (partes.length > 1 ? '/…/' : '/') + fin;
  } catch (e) { return url.length > 40 ? url.slice(0, 37) + '…' : url; }
}

/* Enlace de la imagen: guardado se ve CORTO (dominio/…/archivo) con
   «Cambiar»; al cambiarlo (o si está vacío) aparece el campo para pegar. */
function CampoUrlImagen({ valor, onCambiar, autoFocus, placeholder }) {
  const [editando, setEditando] = React.useState(!valor);
  const [texto, setTexto] = React.useState(valor);
  React.useEffect(() => { setTexto(valor); if (!valor) setEditando(true); }, [valor]);
  const fijar = () => {
    const t = texto.trim();
    if (t !== valor) onCambiar(t);
    if (t) setEditando(false);
  };
  if (!editando) {
    return (
      <div className="vg-url-corta">
        <span className="vg-url-texto" title={valor}>🔗 {enlaceCorto(valor)}</span>
        <button type="button" className="vg-mini-accion" onClick={() => setEditando(true)}>Cambiar</button>
      </div>
    );
  }
  return (
    <div className="vg-url-corta">
      <input type="text" value={texto} autoFocus={autoFocus || !!valor} placeholder={placeholder || 'Pega aquí la URL de la imagen'}
        onChange={(e) => setTexto(e.target.value)} onBlur={fijar} title={AYUDA_IMAGEN}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); fijar(); }
          if (e.key === 'Escape' && valor) { setTexto(valor); setEditando(false); }
        }} />
    </div>
  );
}

/* Miniatura (vista previa) de una imagen; avisa si no carga. */
function MiniImagen({ src, vacia }) {
  const [falla, setFalla] = React.useState(false);
  React.useEffect(() => { setFalla(false); }, [src]);
  return (
    <div className={'vg-img-mini' + (falla ? ' falla' : '')}>
      {src && !falla
        ? <img src={src} alt="Vista previa" referrerPolicy="no-referrer" onError={() => setFalla(true)} />
        : <span>{falla ? 'No carga: revisa que el enlace sea público' : (vacia || 'Sin imagen')}</span>}
    </div>
  );
}

/* Imagen inicial (antes de la primera imagen en el tiempo), en una sola franja. */
function CampoImagen({ valor, portada, onCambiar }) {
  return (
    <div className="config-card vg-img-editor vg-campo-imagen">
      <MiniImagen src={valor ? urlImagen(valor) : portada} vacia="Sin imagen inicial" />
      <div className="vg-img-datos">
        <div className="vg-img-cabeza">
          <strong>Imagen inicial</strong>
          <span className="vg-img-nota">desde el inicio hasta la primera imagen{!valor && portada ? ' · ahora: portada del podcast' : ''}</span>
          <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span>
          <span style={{ flex: 1 }}></span>
          {valor && <button type="button" className="vg-mini-accion" onClick={() => onCambiar('')}>Quitar</button>}
        </div>
        <CampoUrlImagen valor={valor} onCambiar={onCambiar} placeholder="URL de la imagen inicial (opcional)" />
      </div>
    </div>
  );
}

/* Minuto editable compacto: [mm:ss] + «Ahora» (+ botón extra opcional). */
function CampoMinuto({ etiqueta, valor, vacio, onFijar, onAhora, ahoraDeshabilitado, extra }) {
  const { fmtT, parseT } = VigiaTipos;
  const mostrar = typeof valor === 'number' ? fmtT(valor) : '';
  const [texto, setTexto] = React.useState(mostrar);
  React.useEffect(() => { setTexto(mostrar); }, [mostrar]);
  const fijar = () => {
    if (texto === mostrar) return;
    if (!texto.trim()) { onFijar(null); return; }
    const v = parseT(texto);
    if (v === null || onFijar(v) === false) setTexto(mostrar);
  };
  return (
    <div className="vg-img-minuto">
      <span className="vg-img-etiqueta">{etiqueta}</span>
      <input type="text" value={texto} placeholder={vacio || 'mm:ss'} onChange={(e) => setTexto(e.target.value)} onBlur={fijar}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fijar(); } }} />
      <button type="button" className="vg-mini-accion" onClick={onAhora} disabled={ahoraDeshabilitado} title="Usar el momento actual del audio">Ahora</button>
      {extra}
    </div>
  );
}

/* Configuración de una imagen en el tiempo: minuto y URL. */
function ConfigImagen({ x, onCambiar, onBorrar, tiempoActual, duracion, onIr, juntas }) {
  const { fmtT } = VigiaTipos;
  const set = (patch) => onCambiar({ ...x, ...patch });
  const ahora = Math.round(tiempoActual);
  // Fin (opcional): segundo en que deja de verse (vuelve la imagen inicial).
  const conFin = typeof x.fin === 'number';
  const quitarFin = () => { const { fin, ...resto } = x; onCambiar(resto); };
  const fijarInicio = (v) => {
    if (v === null) return false;
    const t = Math.max(0, Math.min(duracion || v, v));
    if (conFin && x.fin <= t) { const { fin, ...resto } = x; onCambiar({ ...resto, t }); } else set({ t });
  };
  const fijarFin = (v) => {
    if (v === null) { quitarFin(); return; }
    if (v <= x.t) return false;   // debe terminar después de aparecer
    set({ fin: Math.min(duracion || v, v) });
  };
  const tam = x.tam || TAM_IMAGEN;
  return (
    <div className="config-card vg-img-editor">
      <MiniImagen src={x.url ? urlImagen(x.url) : ''} vacia="Pega la URL →" />
      <div className="vg-img-datos">
        <div className="vg-img-cabeza">
          <span className="vg-ico-img vg-img-ico"><Icon name="eye" size={14} /></span>
          <strong>Imagen</strong>
          <span className="vg-img-nota">
            {juntas ? 'junto a ' + juntas + (juntas === 1 ? ' imagen más' : ' imágenes más') + ' · ' : ''}
            {conFin ? 'se ve ' + fmtT(x.fin - x.t) + ', luego vuelve la inicial' : 'hasta la siguiente imagen'}
          </span>
          <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="vg-mini-accion" onClick={onIr} title="Ir a ese minuto">▶ {fmtT(x.t)}</button>
          <button type="button" className="vg-mini-accion" onClick={onBorrar}>Quitar</button>
        </div>
        {/* Aparece y termina, uno al lado del otro. */}
        <div className="vg-img-fila">
          <CampoMinuto etiqueta="Aparece" valor={x.t} onFijar={fijarInicio} onAhora={() => fijarInicio(ahora)} />
          <CampoMinuto etiqueta="Termina" valor={conFin ? x.fin : null} vacio="—" onFijar={fijarFin}
            onAhora={() => fijarFin(ahora)} ahoraDeshabilitado={ahora <= x.t}
            extra={conFin ? <button type="button" className="vg-mini-accion" onClick={quitarFin} title="Sin fin: hasta la siguiente imagen">✕</button> : null} />
        </div>
        <div className="vg-img-fila">
          <span className="vg-img-etiqueta">Tamaño</span>
          <button type="button" className="vg-mini-accion" onClick={() => set({ tam: Math.max(20, tam - 10) })} disabled={tam <= 20}>−</button>
          <input type="range" min="20" max="100" step="5" value={tam} className="vg-img-rango"
            onChange={(e) => set({ tam: Number(e.target.value) })} aria-label="Tamaño de la imagen" />
          <button type="button" className="vg-mini-accion" onClick={() => set({ tam: Math.min(100, tam + 10) })} disabled={tam >= 100}>+</button>
          <button type="button" className="vg-mini-accion vg-img-pct" onClick={() => set({ tam: TAM_IMAGEN })} title="Volver al tamaño normal">{tam}%</button>
        </div>
        <CampoUrlImagen valor={x.url || ''} onCambiar={(url) => set({ url })} autoFocus={!x.url} />
      </div>
    </div>
  );
}

/* Plataformas que se pueden pegar (se muestran en el primer paso). */
const PLATAFORMAS_PODCAST = [
  ['YouTube', 'enlace del video'],
  ['Spotify', 'enlace del episodio'],
  ['SoundCloud', 'enlace de la pista'],
  ['Apple Podcasts', 'enlace del episodio'],
  ['iVoox', 'enlace del episodio'],
  ['Internet Archive', 'página del audio'],
  ['Google Drive / Dropbox', 'archivo compartido'],
  ['Archivo .mp3', 'enlace directo'],
];

/* Primer paso: el enlace del podcast y, si se quiere, la imagen inicial. */
function PasoPodcast({ actual, onListo, onCancelar }) {
  const [url, setUrl] = React.useState((actual && actual.url) || '');
  const [imagen, setImagen] = React.useState((actual && actual.imagen) || '');
  const [error, setError] = React.useState('');
  const [buscando, setBuscando] = React.useState(false);
  const [fallaImg, setFallaImg] = React.useState(false);
  const usar = () => {
    if (buscando) return;
    setBuscando(true); setError('');
    resolverPodcast(url).then((datos) => {
      onListo({ ...datos, imagen: imagen.trim() });
    }, (e) => { setError(e.message); setBuscando(false); });
  };
  const plataforma = plataformaPodcast(url.trim());
  const yt = idDeYouTube(url);
  const vista = imagen.trim() ? urlImagen(imagen) : (yt ? 'https://img.youtube.com/vi/' + yt + '/mqdefault.jpg' : '');
  return (
    <div className="vg-paso">
      <div className="vg-paso-card">
        <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
        <div className="kicker" style={{ color: 'var(--vigia-naranja)', marginTop: 14 }}>Paso 1 · Recurso de podcast</div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: '6px 0 6px' }}>Añade el enlace del podcast</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 12px', fontSize: 14.5 }}>
          Copia el enlace del episodio en la plataforma (botón Compartir) y pégalo aquí. Se escuchará con la imagen encima.
        </p>
        <div className="vg-plataformas">
          {PLATAFORMAS_PODCAST.map(([n, d]) => (
            <span key={n} className={plataforma && n.indexOf(plataforma) >= 0 ? 'on' : ''} title={d}>{n}</span>
          ))}
        </div>
        <label className="vg-paso-etiqueta">Enlace del podcast</label>
        <input className="vg-input" value={url} autoFocus placeholder="https://open.spotify.com/episode/…  ·  https://www.ivoox.com/…  ·  …/episodio.mp3"
          onChange={(e) => { setUrl(e.target.value); setError(''); }}
          onKeyDown={(e) => { if (e.key === 'Enter') usar(); }} />
        {plataforma && !error && (
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Se reconoce: <strong style={{ color: 'var(--ink)' }}>{plataforma}</strong>.</div>
        )}
        <label className="vg-paso-etiqueta" style={{ marginTop: 14 }}>Imagen inicial (URL, opcional)</label>
        <input className="vg-input" value={imagen} placeholder="https://…/portada.jpg  (si la dejas vacía, se usa la portada del podcast)"
          onChange={(e) => { setImagen(e.target.value); setFallaImg(false); }}
          onKeyDown={(e) => { if (e.key === 'Enter') usar(); }} />
        {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5, marginTop: 10 }}>{error}</div>}
        {vista && !fallaImg && <img src={vista} alt="Vista previa" className="vg-paso-mini" onError={() => setFallaImg(true)} referrerPolicy="no-referrer" />}
        {fallaImg && <div style={{ color: 'var(--naranja-ink)', fontSize: 13, marginTop: 8 }}>No se pudo cargar esa imagen. Revisa que el enlace sea público y lleve a la imagen.</div>}
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 12 }}>
          Después podrás agregar más imágenes que cambian en los minutos que elijas.
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
          <button className="btn vigia-btn-crear" onClick={usar} disabled={buscando}>{buscando ? 'Buscando el audio…' : 'Usar podcast'}</button>
          {onCancelar && <button className="vg-btn-texto" onClick={onCancelar}>Cancelar</button>}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  VigiaEditorPodcast, PortadaPodcast, ControlesAudio, CampoImagen, CampoUrlImagen, ConfigImagen, PasoPodcast,
  MiniImagen, CampoMinuto, enlaceCorto, AYUDA_IMAGEN,
});
