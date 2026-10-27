/* editor-imagenes.jsx — Editor de Activaciones del Modo Vigía (recurso: Imágenes).
   Inspirado en las presentaciones interactivas tipo Genially: una o varias
   imágenes (como diapositivas) y, SOBRE cada una, activadores en forma de
   ícono que se arrastran a su lugar. Cada activador abre al presentar una
   tarjeta PEQUEÑA (junto al ícono) o GRANDE (la tarjeta central de siempre);
   al pasar el mouse se ve un primer vistazo (tipo y título).
     [imágenes]  [imagen con sus íconos + configuración]  [tipos + música de fondo]

   Documento guardado:
     { ..., recurso: 'imagenes',
       galeria: { diapos: [{ id, url, titulo? }],
                  musica: { url, fuente, id?, src, activa, volumen } | null },
       activaciones: [{ id, tipo, diapo, x, y (0–1 sobre la imagen), tarjeta: 'pequena'|'grande', titulo?, texto, ... }] } */

/* La imagen ajustada al espacio (completa, sin deformar) y una capa encima
   del MISMO tamaño que la imagen: ahí van los íconos (x, y en fracciones). */
function LienzoImagen({ url, hojaRef, onClickHoja, children, className }) {
  const [prop, setProp] = React.useState(null);   // ancho / alto
  const [falla, setFalla] = React.useState(false);
  React.useEffect(() => { setProp(null); setFalla(false); }, [url]);
  const src = urlImagen(url || '');
  return (
    <div className={'vg-lienzo ' + (className || '')}>
      {!src || falla ? (
        <div className="vg-lienzo-falla">
          <img src={VIGIA_LOGO} alt="" />
          <span>{src ? 'No se pudo cargar la imagen. Revisa que el enlace sea público y lleve a la imagen.' : 'Sin imagen'}</span>
        </div>
      ) : (
        <div className="vg-lienzo-hoja" ref={hojaRef} onClick={onClickHoja}
          style={prop ? { aspectRatio: String(prop), width: 'min(100cqw, ' + (100 * prop).toFixed(3) + 'cqh)' } : { visibility: 'hidden' }}>
          <img src={src} alt="" draggable="false" referrerPolicy="no-referrer" className="vg-proyectado-doc"
            onLoad={(e) => { const el = e.target; if (el.naturalWidth && el.naturalHeight) setProp(el.naturalWidth / el.naturalHeight); }}
            onError={() => setFalla(true)} />
          {prop && children}
        </div>
      )}
    </div>
  );
}

// Texto corto para el primer vistazo de un activador.
function vistazoDe(a) {
  if (a.titulo && a.titulo.trim()) return a.titulo.trim();
  const t = (a.tipo === 'glosario' ? a.termino || a.texto : a.texto || '').trim();
  return t.length > 70 ? t.slice(0, 67) + '…' : t;
}

function VigiaEditorImagenes({ act, onChange, onBack, onPresent }) {
  const { TIPOS, recurso, tipo, nuevaActivacion } = VigiaTipos;
  const rec = recurso(act.recurso);
  const g = act.galeria || { diapos: [], musica: null };
  const diapos = g.diapos || [];
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [diapoId, setDiapoId] = React.useState(diapos[0] ? diapos[0].id : null);
  const [selId, setSelId] = React.useState(null);
  const [estOpen, setEstOpen] = React.useState(false);
  const [nuevaUrl, setNuevaUrl] = React.useState('');
  const [arrastre, setArrastre] = React.useState(null);   // { id, x, y }
  const hoja = React.useRef(null);

  const diapo = diapos.find((d) => d.id === diapoId) || diapos[0] || null;
  const enDiapo = (act.activaciones || []).filter((a) => diapo && a.diapo === diapo.id);
  const sel = enDiapo.find((a) => a.id === selId) || null;

  const update = (patch) => onChange({ ...act, ...patch });
  const setGaleria = (patch) => update({ galeria: { ...g, ...patch } });
  const setDiapos = (arr) => setGaleria({ diapos: arr });
  const cambiar = (a) => update({ activaciones: (act.activaciones || []).map((x) => (x.id === a.id ? a : x)) });

  // --- Imágenes (diapositivas) ---
  const agregarImagenes = () => {
    const urls = nuevaUrl.split(/\s+/).map((s) => s.trim()).filter((s) => /^https?:\/\//i.test(s));
    if (!urls.length) return;
    const nuevas = urls.map((url) => ({ id: AIP.uid(), url, titulo: '' }));
    setDiapos([...diapos, ...nuevas]);
    setDiapoId(nuevas[0].id); setSelId(null); setNuevaUrl('');
  };
  const cambiarDiapo = (d) => setDiapos(diapos.map((x) => (x.id === d.id ? d : x)));
  const moverDiapo = (id, dir) => {
    const i = diapos.findIndex((x) => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= diapos.length) return;
    const arr = diapos.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
    setDiapos(arr);
  };
  const borrarDiapo = async (id) => {
    const n = (act.activaciones || []).filter((a) => a.diapo === id).length;
    if (!await vigiaConfirmar('¿Quitar esta imagen' + (n ? ' y sus ' + n + ' activador' + (n === 1 ? '' : 'es') : '') + '?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    onChange({ ...act, galeria: { ...g, diapos: diapos.filter((x) => x.id !== id) }, activaciones: (act.activaciones || []).filter((a) => a.diapo !== id) });
    if (diapoId === id) { const resto = diapos.filter((x) => x.id !== id); setDiapoId(resto[0] ? resto[0].id : null); }
    setSelId(null);
  };

  // --- Activadores ---
  const agregar = (tipoId) => {
    if (!diapo) return;
    const n = enDiapo.length;
    // En el centro (un poco corridos si ya hay otros), luego se arrastra.
    const donde = { diapo: diapo.id, x: 0.5 + ((n % 5) - 2) * 0.05, y: 0.5 + (Math.floor(n / 5) % 3 - 1) * 0.08 };
    const a = { ...nuevaActivacion(tipoId, donde), tarjeta: 'grande', titulo: '' };
    update({ activaciones: [...(act.activaciones || []), a] });
    setSelId(a.id);
  };
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar este activador?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    update({ activaciones: (act.activaciones || []).filter((x) => x.id !== id) });
    if (selId === id) setSelId(null);
  };

  // Arrastrar un ícono sobre la imagen (clic sin mover = seleccionarlo).
  const empezarArrastre = (e, a) => {
    if (e.button !== 0 || !hoja.current) return;
    e.preventDefault(); e.stopPropagation();
    const x0 = e.clientX, y0 = e.clientY;
    let movido = false, pos = { x: a.x, y: a.y };
    const mover = (ev) => {
      if (!movido && Math.hypot(ev.clientX - x0, ev.clientY - y0) < 4) return;
      movido = true;
      const r = hoja.current.getBoundingClientRect();
      pos = { x: Math.max(0, Math.min(1, (ev.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (ev.clientY - r.top) / r.height)) };
      setArrastre({ id: a.id, ...pos });
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setArrastre(null);
      if (movido) cambiar({ ...a, x: Number(pos.x.toFixed(4)), y: Number(pos.y.toFixed(4)) });
      setSelId(a.id);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  const cuenta = (id) => (act.activaciones || []).filter((a) => a.diapo === id).length;

  return (
    <div className="editor-shell vigia vg-editor" data-screen-label="Modo Vigía · Editor de imágenes">
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la activación"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo descubra en estas imágenes?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <RecursoChips act={act} update={update} />
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />
        <button className="btn vigia-btn-crear" onClick={onPresent} disabled={!VigiaTipos.recursoListo(act)}
          title={VigiaTipos.recursoListo(act) ? 'Presentar las imágenes con sus activadores' : 'Primero añade una imagen'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      <div className="editor-body">
        {/* ---- columna 1: imágenes (como diapositivas) ---- */}
        <div className="editor-list">
          <div className="kicker" style={{ padding: '2px 4px' }}>Imágenes · {diapos.length}</div>
          {diapos.map((d, i) => (
            <button key={d.id} className={'slide-thumb vg-thumb vg-diapo-thumb' + (diapo && d.id === diapo.id ? ' active' : '')}
              onClick={() => { setDiapoId(d.id); setSelId(null); }}>
              <span className="vg-diapo-num">{i + 1}</span>
              <MiniImagen src={urlImagen(d.url)} vacia="Sin imagen" />
              <span className="vg-diapo-pie">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{d.titulo || 'Imagen ' + (i + 1)}</span>
                <span className="vg-diapo-cuenta" title="Activadores">{cuenta(d.id)}</span>
              </span>
              <span className="thumb-actions">
                {i > 0 && <span className="thumb-action" role="button" title="Subir" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, -1); }}>▲</span>}
                {i < diapos.length - 1 && <span className="thumb-action" role="button" title="Bajar" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, 1); }}>▼</span>}
                <span className="thumb-action" role="button" title="Quitar" onClick={(e) => { e.stopPropagation(); borrarDiapo(d.id); }}>✕</span>
              </span>
            </button>
          ))}
          <div className="vg-agregar-imagen">
            <input type="text" value={nuevaUrl} placeholder="Pega la URL de una imagen"
              onChange={(e) => setNuevaUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') agregarImagenes(); }}
              title={AYUDA_IMAGEN + ' Puedes pegar varias URL separadas por espacios.'} />
            <button className="btn btn-sm vigia-btn-crear" onClick={agregarImagenes} disabled={!nuevaUrl.trim()}>+ Agregar</button>
          </div>
        </div>

        {/* ---- columna 2: la imagen con sus activadores + configuración ---- */}
        <div className="editor-canvas-col">
          {!diapo ? (
            <div className="vg-lienzo-marco vg-lienzo-vacio">
              <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
              <strong>Agrega tu primera imagen</strong>
              <span>Pega su URL en la columna de la izquierda (mapa, infografía, foto, obra de arte…). Luego pon activadores encima.</span>
            </div>
          ) : (
            <React.Fragment>
              <div className="vg-lienzo-marco">
                <LienzoImagen url={diapo.url} hojaRef={hoja} onClickHoja={() => setSelId(null)}>
                  {enDiapo.map((a) => {
                    const ti = tipo(a.tipo);
                    const pos = arrastre && arrastre.id === a.id ? arrastre : a;
                    return (
                      <button key={a.id} className={'vg-punto' + (a.id === selId ? ' sel' : '') + (arrastre && arrastre.id === a.id ? ' moviendo' : '') + ((a.tarjeta || 'grande') === 'pequena' ? ' chica' : '')}
                        style={{ left: pos.x * 100 + '%', top: pos.y * 100 + '%', '--tipo': ti.color }}
                        onPointerDown={(e) => empezarArrastre(e, a)} onClick={(e) => e.stopPropagation()}
                        title={ti.nombre + (vistazoDe(a) ? ': ' + vistazoDe(a) : '') + ' · Arrastra para moverlo'}>
                        <Icon name={ti.icon} size={18} />
                      </button>
                    );
                  })}
                </LienzoImagen>
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--muted)', width: '100%', maxWidth: 980, marginTop: -6 }}>
                Elige un tipo a la derecha: aparece en el centro de la imagen. <strong style={{ color: 'var(--ink)' }}>Arrástralo</strong> a su lugar y haz clic para editarlo.
              </div>

              {sel ? (
                <ConfigPunto key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)}
                  hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
              ) : (
                <ConfigDiapo d={diapo} n={diapos.indexOf(diapo) + 1} onCambiar={cambiarDiapo} onBorrar={() => borrarDiapo(diapo.id)} />
              )}
            </React.Fragment>
          )}
        </div>

        {/* ---- columna 3: tipos de activación + música de fondo ---- */}
        <div className="editor-tools">
          {/* Vista previa de la activación seleccionada (o el encabezado de siempre). */}
          <VistaPrevia a={sel} act={act}>
          <div>
            <div className="kicker">Tipos de</div>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Activación</h3>
            <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
              Se agrega como ícono sobre la imagen. Recurso: <strong style={{ color: 'var(--ink)' }}>{rec.nombre}</strong>.
            </p>
          </div>
          </VistaPrevia>
          <TiposAgrupados lista={TIPOS} render={(t) => {
            const habilitado = rec.tipos.includes(t.id) && !!diapo;
            return (
              <button key={t.id} className={'tool-card vg-tipo' + (habilitado ? '' : ' tool-soon')} disabled={!habilitado}
                onClick={() => habilitado && agregar(t.id)}
                title={!diapo ? 'Primero agrega una imagen' : habilitado ? 'Añadir ' + t.nombre + ' sobre la imagen' : 'No disponible para ' + rec.nombre}>
                <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                </span>
                <span className="tool-add">+</span>
              </button>
            );
          }} />
          <MusicaFondo musica={g.musica} onCambiar={(musica) => setGaleria({ musica })} />
        </div>
      </div>
    </div>
  );
}

/* Datos de una imagen: título (se ve al presentar) y su URL. */
function ConfigDiapo({ d, n, onCambiar, onBorrar }) {
  return (
    <div className="config-card vg-img-editor">
      <MiniImagen src={urlImagen(d.url)} />
      <div className="vg-img-datos">
        <div className="vg-img-cabeza">
          <span className="vg-ico-img vg-img-ico"><Icon name="eye" size={14} /></span>
          <strong>Imagen {n}</strong>
          <span className="vg-img-nota">haz clic en un ícono para editarlo</span>
          <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="vg-mini-accion" onClick={onBorrar}>Quitar</button>
        </div>
        <input type="text" className="vg-diapo-titulo" value={d.titulo || ''} placeholder="Título de la imagen (opcional, se ve al presentar)"
          onChange={(e) => onCambiar({ ...d, titulo: e.target.value })} />
        <CampoUrlImagen valor={d.url || ''} onCambiar={(url) => url && onCambiar({ ...d, url })} />
      </div>
    </div>
  );
}

/* Configuración de un activador: tamaño de su tarjeta, título del primer
   vistazo y lo de siempre (ConfigActivacion en modo compacto). */
function ConfigPunto({ a, onCambiar, onBorrar, hayEstudiantes, onAbrirEstudiantes }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const tarjeta = a.tarjeta || 'grande';
  return (
    <div className="config-card vg-config vg-config-punto" style={{ borderColor: ti.color + '66' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div className="tool-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={20} /></div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>{ti.nombre}</div>
          <div style={{ fontSize: 13, color: 'var(--muted)' }}>{ti.proposito}</div>
        </div>
        {!esEscena(a) && <div className="vg-segmento" role="radiogroup" aria-label="Tamaño de la tarjeta">
          {[['pequena', 'Tarjeta pequeña'], ['grande', 'Tarjeta grande']].map(([v, t]) => (
            <button key={v} role="radio" aria-checked={tarjeta === v} className={tarjeta === v ? 'on' : ''}
              onClick={() => onCambiar({ ...a, tarjeta: v })}
              title={v === 'pequena' ? 'Se abre junto al ícono, sin tapar la imagen' : 'La tarjeta central, con la frase que irrumpe'}>{t}</button>
          ))}
        </div>}
      </div>
      <div className="field">
        <label>Primer vistazo (al pasar el mouse)</label>
        <input type="text" value={a.titulo || ''} maxLength={80} onChange={(e) => onCambiar({ ...a, titulo: e.target.value })}
          placeholder={'Ej.: ' + (a.tipo === 'pregunta' ? '¿Qué ves en el río?' : a.tipo === 'glosario' ? 'Una palabra clave' : 'Mira esta zona')} />
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>Si lo dejas vacío, se muestra el comienzo del texto.</div>
      </div>
      <ConfigActivacion a={a} onCambiar={onCambiar} onBorrar={onBorrar} conTiempo={false} compacto sinFragmento
        hayEstudiantes={hayEstudiantes} onAbrirEstudiantes={onAbrirEstudiantes} />
    </div>
  );
}

/* Música de fondo (opcional): un enlace de YouTube, Spotify, SoundCloud,
   iVoox, MP3… (las mismas plataformas del Podcast) y un interruptor. */
function MusicaFondo({ musica, onCambiar }) {
  const m = musica || null;
  const [texto, setTexto] = React.useState((m && m.url) || '');
  const [buscando, setBuscando] = React.useState(false);
  const [error, setError] = React.useState('');
  const [probando, setProbando] = React.useState(false);
  const usar = () => {
    if (!texto.trim() || buscando) return;
    setBuscando(true); setError('');
    resolverPodcast(texto).then((d) => {
      const { portada, titulo, ...datos } = d;
      onCambiar({ ...datos, activa: true, volumen: (m && m.volumen) || 40 });
      setBuscando(false);
    }, (e) => { setError(e.message); setBuscando(false); });
  };
  const activa = !!(m && m.activa);
  return (
    <div className="vg-musica">
      <div className="vg-musica-cabeza">
        <span className="vg-musica-ico">♪</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 14 }}>Música de fondo</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>Opcional · baja sola al abrir una tarjeta</div>
        </div>
        {m && (
          <button type="button" role="switch" aria-checked={activa} className={'vg-interruptor' + (activa ? ' on' : '')}
            onClick={() => onCambiar({ ...m, activa: !activa })} title={activa ? 'Desactivar la música' : 'Activar la música'}><span></span></button>
        )}
      </div>
      {m && m.url ? (
        <div className="vg-url-corta">
          <span className="vg-url-texto" title={m.url}>{plataformaPodcast(m.url) || 'Audio'} · {enlaceCorto(m.url)}</span>
          <button type="button" className="vg-mini-accion" onClick={() => { setProbando(false); onCambiar(null); setTexto(''); }}>Quitar</button>
        </div>
      ) : (
        <div className="vg-url-corta">
          <input type="text" value={texto} placeholder="Enlace de YouTube, Spotify, SoundCloud, MP3…"
            onChange={(e) => { setTexto(e.target.value); setError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') usar(); }} />
          <button type="button" className="vg-mini-accion" onClick={usar} disabled={buscando || !texto.trim()}>{buscando ? '…' : 'Usar'}</button>
        </div>
      )}
      {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 12.5 }}>{error}</div>}
      {m && m.url && (
        <div className="vg-musica-fila">
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>Volumen</span>
          <input type="range" min="5" max="100" step="5" value={m.volumen || 40} style={{ flex: 1, minWidth: 0 }}
            onChange={(e) => onCambiar({ ...m, volumen: Number(e.target.value) })} aria-label="Volumen de la música" />
          <span style={{ fontSize: 12, minWidth: 34, textAlign: 'right' }}>{m.volumen || 40}%</span>
          <button type="button" className={'vg-mini-accion' + (probando ? ' on' : '')} onClick={() => setProbando((p) => !p)}>
            {probando ? '❚❚ Parar' : '▶ Probar'}
          </button>
        </div>
      )}
      {probando && m && <PruebaMusica m={m} />}
    </div>
  );
}

/* Reproduce la música mientras se prueba en el editor (el reproductor queda oculto). */
function PruebaMusica({ m }) {
  const rep = usePodcast(m, { controls: 0 });
  React.useEffect(() => { if (rep.listo) { rep.setVolumen(m.volumen || 40); rep.play(); } }, [rep.listo]);
  React.useEffect(() => { if (rep.listo) rep.setVolumen(m.volumen || 40); }, [m.volumen]);
  return (
    <React.Fragment>
      <div className="vg-musica-oculta" aria-hidden="true"><div ref={rep.montaje} className="vg-video"></div></div>
      <div style={{ fontSize: 12, color: rep.error ? 'var(--naranja-ink)' : 'var(--muted)' }}>
        {rep.error || (rep.listo ? (rep.reproduciendo ? 'Sonando…' : 'Lista') : 'Cargando…')}
        {!rep.conVolumen && rep.listo ? ' · ' + rep.reproductorVisible + ' no deja cambiar el volumen' : ''}
      </div>
    </React.Fragment>
  );
}

Object.assign(window, { LienzoImagen, vistazoDe, VigiaEditorImagenes, ConfigDiapo, ConfigPunto, MusicaFondo, PruebaMusica });
