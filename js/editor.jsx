/* Editor de plantillas — 3 columnas verticales:
   [lista pequeña] [lienzo grande ~65%] [20 herramientas de actividades interactivas] */

function Editor({ pres, onChange, onBack, onPresent, theme, setTheme }) {
  const [sel, setSel] = React.useState(0);
  const [openGroup, setOpenGroup] = React.useState('evaluadoras');
  const [selEl, setSelEl] = React.useState(null); // id del elemento seleccionado en el lienzo
  const slides = pres.slides;
  const current = slides[Math.min(sel, slides.length - 1)];

  const update = (patch) => onChange({ ...pres, ...patch });
  const updateSlides = (next, nextSel) => {
    update({ slides: next });
    if (nextSel !== undefined) setSel(nextSel);
  };
  const updateSlide = (i, slide) => {
    const next = slides.slice(); next[i] = slide; updateSlides(next);
  };

  /* ---- Modo Equipos ---- */
  const esEquipos = pres.modo === 'equipos';
  const equipos = pres.equipos || [];
  const setEquipos = (next) => update({ equipos: next });
  const cambiarEquipo = (id, patch) => setEquipos(equipos.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const agregarEquipo = () => {
    if (equipos.length >= 6) return;
    const nuevos = AIP.equiposPreset(equipos.length + 1);
    setEquipos([...equipos, { ...nuevos[equipos.length], puntos: 0 }]);
  };
  const quitarEquipo = (id) => { if (equipos.length > 2) setEquipos(equipos.filter((e) => e.id !== id)); };

  const addContenido = () => {
    const s = {
      id: AIP.uid(), type: 'contenido',
      fondo: { tipo: 'color', valor: '' },
      elementos: [
        { id: AIP.uid(), tipo: 'texto', valor: 'Nuevo título', x: 130, y: 150, w: 1100, h: 200,
          color: '#0B0F0C', font: "'Sora', sans-serif", size: 104, peso: 800, align: 'left', anim: 'slideUp' },
      ],
    };
    const next = slides.slice(); next.splice(sel + 1, 0, s);
    updateSlides(next, sel + 1);
  };
  const addActividad = (toolId) => {
    const s = { id: AIP.uid(), type: 'actividad', tool: toolId, config: AIP.defaultConfig(toolId) };
    const next = slides.slice(); next.splice(sel + 1, 0, s);
    updateSlides(next, sel + 1);
  };
  const removeSlide = (i) => {
    if (slides.length <= 1) return;
    const next = slides.slice(); next.splice(i, 1);
    updateSlides(next, Math.max(0, Math.min(sel, next.length - 1)));
  };
  const moveSlide = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const next = slides.slice();
    const [s] = next.splice(i, 1); next.splice(j, 0, s);
    updateSlides(next, sel === i ? j : sel);
  };

  const curIdx = Math.min(sel, slides.length - 1);
  const tool = current.type === 'actividad' ? AIP.toolById(current.tool) : null;

  const setCfg = (k) => (e) => {
    const v = k === 'duracion' ? Number(e.target.value) : e.target.value;
    updateSlide(curIdx, { ...current, config: { ...current.config, [k]: v } });
  };
  const setItems = (e) => {
    updateSlide(curIdx, { ...current, config: { ...current.config, items: e.target.value.split('\n') } });
  };
  // Carga el ejemplo modelo de la actividad actual en su configuración.
  const aplicarEjemplo = () => {
    const ej = window.actEjemplo && window.actEjemplo(current.tool);
    if (!ej || !ej.ejemplo) return;
    updateSlide(curIdx, { ...current, config: { ...current.config, ...ej.ejemplo } });
  };

  /* ---- edición del lienzo libre (plantillas de contenido) ---- */
  // Garantiza que la plantilla actual tenga elementos/fondo antes de editarla.
  const lienzoActual = current.type === 'contenido' ? migrarContenido(current) : null;
  const elsActuales = lienzoActual ? (lienzoActual.elementos || []) : [];
  const elSeleccionado = elsActuales.find((x) => x.id === selEl) || null;
  // Posición del elemento seleccionado dentro de la secuencia de aparición.
  const ordenInfo = (() => {
    const ordenados = elsActuales.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const pos = elSeleccionado ? ordenados.findIndex((x) => x.id === elSeleccionado.id) : -1;
    return { pos, total: ordenados.length };
  })();

  const guardarLienzo = (cambios) => {
    updateSlide(curIdx, { ...lienzoActual, ...cambios });
  };
  const agregarElemento = (tipo) => {
    const nuevo = nuevoElemento(tipo);
    const maxOrden = elsActuales.reduce((m, x) => Math.max(m, x.orden || 0), -1);
    nuevo.orden = maxOrden + 1;
    guardarLienzo({ elementos: [...elsActuales, nuevo] });
    setSelEl(nuevo.id);
  };
  const cambiarElemento = (id, next) => {
    guardarLienzo({ elementos: elsActuales.map((x) => (x.id === id ? next : x)) });
  };
  const patchSeleccionado = (patch) => {
    if (!elSeleccionado) return;
    cambiarElemento(elSeleccionado.id, { ...elSeleccionado, ...patch });
  };
  // Mueve el orden de aparición del elemento seleccionado intercambiándolo con el vecino.
  const moverOrden = (dir) => {
    if (!elSeleccionado) return;
    const ordenados = elsActuales.slice().sort((a, b) => (a.orden || 0) - (b.orden || 0));
    const pos = ordenados.findIndex((x) => x.id === elSeleccionado.id);
    const destino = pos + dir;
    if (destino < 0 || destino >= ordenados.length) return;
    const a = ordenados[pos], b = ordenados[destino];
    const oa = a.orden || 0, ob = b.orden || 0;
    guardarLienzo({
      elementos: elsActuales.map((x) => {
        if (x.id === a.id) return { ...x, orden: ob };
        if (x.id === b.id) return { ...x, orden: oa };
        return x;
      }),
    });
  };
  const borrarSeleccionado = () => {
    if (!elSeleccionado) return;
    guardarLienzo({ elementos: elsActuales.filter((x) => x.id !== elSeleccionado.id) });
    setSelEl(null);
  };
  const setFondo = (parche) => {
    guardarLienzo({ fondo: { ...(lienzoActual.fondo || { tipo: 'color', valor: '' }), ...parche } });
  };

  return (
    <div className="editor-shell" data-screen-label="Editor de plantillas">
      {/* barra superior */}
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al inicio"><Icon name="atras" size={17} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={pres.tema} onChange={(e) => update({ tema: e.target.value })} placeholder="Tema de la presentación"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%' }} />
          <input value={pres.objetivo} onChange={(e) => update({ objetivo: e.target.value })} placeholder="Objetivo de aprendizaje…"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="btn btn-primary" onClick={onPresent}><Icon name="play" size={15} /> Presentar</button>
      </div>

      <div className="editor-body">
        {/* ---- columna 1: lista de plantillas creadas (pequeña) ---- */}
        <div className="editor-list">
          <div className="kicker" style={{ padding: '2px 4px' }}>Plantillas · {slides.length}</div>
          {slides.map((s, i) => {
            const t = s.type === 'actividad' ? AIP.toolById(s.tool) : null;
            return (
              <button key={s.id} className={'slide-thumb' + (i === curIdx ? ' active' : '')} onClick={() => { setSel(i); setSelEl(null); }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--muted)', letterSpacing: '.1em' }}>
                  {String(i + 1).padStart(2, '0')} · {t ? 'ACTIVIDAD' : 'CONTENIDO'}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                  {t && <span style={{ width: 9, height: 9, borderRadius: 3, background: t.color, flexShrink: 0 }}></span>}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.type === 'actividad' ? s.config.titulo : (s.titulo || 'Sin título')}
                  </span>
                </span>
                <span className="thumb-actions">
                  <span className="thumb-action" role="button" title="Subir" onClick={(e) => { e.stopPropagation(); moveSlide(i, -1); }}>↑</span>
                  <span className="thumb-action" role="button" title="Bajar" onClick={(e) => { e.stopPropagation(); moveSlide(i, 1); }}>↓</span>
                  <span className="thumb-action" role="button" title="Eliminar" onClick={(e) => { e.stopPropagation(); removeSlide(i); }}>✕</span>
                </span>
              </button>
            );
          })}
          <button className="btn btn-sm" style={{ justifyContent: 'center', marginTop: 4 }} onClick={addContenido}>
            <Icon name="mas" size={14} /> Plantilla
          </button>
        </div>

        {/* ---- columna 2: lienzo grande (~65%) ---- */}
        <div className="editor-canvas-col">
          {/* Barra de herramientas POR ENCIMA de la plantilla (solo contenido) */}
          {current.type === 'contenido' && (
            <div className="canvas-toolbar">
              <button className="ct-btn" onClick={() => agregarElemento('texto')}><Icon name="mas" size={14} /> Texto</button>
              <button className="ct-btn" onClick={() => agregarElemento('imagen')}><Icon name="eye" size={14} /> Imagen</button>
              <button className="ct-btn" onClick={() => agregarElemento('video')}><Icon name="tv" size={14} /> Video</button>
              <span className="sep" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.06em', textTransform: 'uppercase' }}>Fondo</span>
              <select value={(lienzoActual.fondo || {}).tipo || 'color'}
                onChange={(e) => setFondo({ tipo: e.target.value, valor: '' })}
                style={{ borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', padding: '8px 10px', fontSize: 13.5 }}>
                <option value="color">Color</option>
                <option value="url">Imagen (URL)</option>
              </select>
              {((lienzoActual.fondo || {}).tipo || 'color') === 'url' ? (
                <input className="ct-url" placeholder="URL de la imagen de plantilla…"
                  value={(lienzoActual.fondo || {}).valor || ''} onChange={(e) => setFondo({ valor: e.target.value })} />
              ) : (
                <input type="color" className="color-dot" title="Color de fondo"
                  value={(lienzoActual.fondo || {}).valor || '#ffffff'} onChange={(e) => setFondo({ valor: e.target.value })} />
              )}
            </div>
          )}

          {/* Panel del elemento seleccionado — ENCIMA de la plantilla */}
          {current.type === 'contenido' && (
            <ElementoPanel el={elSeleccionado} onPatch={patchSeleccionado} onDelete={borrarSeleccionado}
              onMover={moverOrden} ordenInfo={ordenInfo} />
          )}

          <ScaledSlide>
            {current.type === 'contenido' ? (
              <ContenidoSlide slide={lienzoActual} editable
                selId={selEl} onSelect={setSelEl} onChangeEl={cambiarElemento} />
            ) : (
              <ActividadSlidePreview slide={current} />
            )}
          </ScaledSlide>

          {current.type === 'actividad' ? (
            <div className="config-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="tool-ico" style={{ background: tool.color }}><Icon name={tool.icon} size={20} /></div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>Configura: {tool.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{tool.desc}</div>
                </div>
              </div>

              <EjemploCard tool={tool} onUsar={aplicarEjemplo} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label>Título en pantalla</label>
                  <input type="text" value={current.config.titulo} onChange={setCfg('titulo')} />
                </div>
                <div className="field">
                  <label>Tiempo (segundos)</label>
                  <input type="number" min="10" step="10" value={current.config.duracion} onChange={setCfg('duracion')} />
                </div>
              </div>

              {esEquipos && (
                AIP.esCompetible(current.tool) ? (
                  <div className="field" style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--azul)', background: 'color-mix(in oklch, var(--azul) 8%, var(--surface))' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name="trofeo" size={15} /> Puntos por ganar esta actividad</label>
                    <input type="number" min="1" max="20" value={current.config.puntos || 1}
                      onChange={(e) => updateSlide(curIdx, { ...current, config: { ...current.config, puntos: Math.max(1, Number(e.target.value) || 1) } })}
                      style={{ width: 110 }} />
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
                      Al presentar, tocarás el equipo ganador y se le sumarán estos puntos.
                    </div>
                  </div>
                ) : (
                  <div className="field" style={{ padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--line)', background: 'var(--surface2)', color: 'var(--muted)', fontSize: 13 }}>
                    Esta actividad no reparte puntos (no tiene un ganador claro). Sirve como apoyo dentro de la competencia.
                  </div>
                )
              )}
              <div className="field">
                <label>Instrucciones para el grupo</label>
                <textarea rows="2" value={current.config.instrucciones} onChange={setCfg('instrucciones')}></textarea>
              </div>
              {current.tool === 'sopa' ? (
                <SopaEditor current={current} curIdx={curIdx} updateSlide={updateSlide} />
              ) : current.tool === 'descubre' ? (
                <DescubreEditor current={current} curIdx={curIdx} updateSlide={updateSlide} setItems={setItems} />
              ) : current.tool === 'errores' ? (
                <DiferenciasEditor current={current} curIdx={curIdx} updateSlide={updateSlide} />
              ) : (
                <div className="field">
                  <label>{itemsLabel(current.tool)}</label>
                  <textarea rows="5" value={(current.config.items || []).join('\n')} onChange={setItems}
                    placeholder={ejemploPlaceholder(current.tool)}></textarea>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{itemsHint(current.tool)}</div>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* ---- columna 3: Grupos de Interacciones (menú desplegable) ---- */}
        <div className="editor-tools">
          <div>
            <div className="kicker">Grupos de</div>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Interacciones</h3>
            <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
              Abre un grupo y haz clic en una actividad para añadirla después de la plantilla seleccionada.
            </p>
          </div>

          {/* Modo Equipos: editor de equipos + actividades competibles */}
          {esEquipos && (
            <React.Fragment>
              <EquiposEditor equipos={equipos} onCambiar={cambiarEquipo} onAgregar={agregarEquipo} onQuitar={quitarEquipo} />
              <GrupoEquipos openGroup={openGroup} setOpenGroup={setOpenGroup} onAdd={addActividad} />
            </React.Fragment>
          )}

          {AIP.GROUPS.map((g) => {
            const tools = AIP.groupTools(g);
            const isOpen = openGroup === g.id;
            const total = tools.length;
            const listas = tools.filter((t) => !t.soon).length;
            return (
              <div key={g.id} className={'group-block' + (isOpen ? ' open' : '')}>
                <button className="group-head" onClick={() => setOpenGroup(isOpen ? null : g.id)}
                  aria-expanded={isOpen}>
                  <span className="group-ico" style={{ background: g.color }}><Icon name={g.icon} size={18} /></span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>{g.nombre}</span>
                    <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {listas} {listas === 1 ? 'disponible' : 'disponibles'}{total > listas ? ' · ' + (total - listas) + ' próximamente' : ''}
                    </span>
                  </span>
                  <span className="group-caret"><Icon name="flecha" size={16} /></span>
                </button>

                <div className="group-body">
                  {tools.map((t) => (
                    <button key={t.id} className={'tool-card' + (t.soon ? ' tool-soon' : '')}
                      onClick={() => { if (!t.soon) addActividad(t.id); }}
                      disabled={t.soon}
                      title={t.soon ? t.nombre + ' · Próximamente' : 'Añadir ' + t.nombre}>
                      <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                      <span style={{ minWidth: 0 }}>
                        <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</span>
                      </span>
                      {t.soon
                        ? <span className="soon-tag">Pronto</span>
                        : <span className="tool-add">+</span>}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
/* Editor especial para Descubre la palabra: palabras + número de intentos. */
function DescubreEditor({ current, curIdx, updateSlide, setItems }) {
  const setIntentos = (e) => {
    const v = Number(e.target.value);
    updateSlide(curIdx, { ...current, config: { ...current.config, intentos: v } });
  };
  return (
    <div>
      <div className="field">
        <label>Número de intentos</label>
        <select value={current.config.intentos || 6} onChange={setIntentos}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n} intentos</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Palabras a adivinar (una por línea)</label>
        <textarea rows="5" value={(current.config.items || []).join('\n')} onChange={setItems}
          placeholder="PALABRA=pista (la pista es opcional)"></textarea>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
          Formato: PALABRA=pista. Cada palabra puede tener distinta longitud. Ej: ELEFANTE=Animal con trompa
        </div>
      </div>
    </div>
  );
}

function itemsLabel(toolId) {
  return {
    ruleta: 'Preguntas de la ruleta (una por línea)',
    completa: 'Palabras (una por línea)',
    elige: 'Preguntas (una por línea)',
    vf: 'Afirmaciones (una por línea)',
    problema: 'Enunciado del problema',
    selector: 'Nombres de estudiantes (uno por línea)',
    marcador: 'Nombres de los equipos (uno por línea)',
    ahorcado: 'Palabras a adivinar (una por línea)',
    reto    : 'Pasos de la rutina (uno por línea)',
    organiza: 'Párrafos con palabras entre [corchetes] (uno por línea)',
    descubre: 'Palabras a adivinar (una por línea)',
    stop: 'Categorías del cuadro (una por línea)',
    acertijo: 'Acertijos (uno por línea)',
  }[toolId] || 'Elementos de la actividad (uno por línea)';
}
function itemsHint(toolId) {
  return {
    completa: 'Formato: PALABR_=A → usa "_" para la letra oculta y "=" para la respuesta.',
    elige: 'Formato: Pregunta|Respuesta correcta|Distractor 1|Distractor 2',
    vf: 'Formato: Afirmación|V  o  Afirmación|F',
    ruleta: 'Cada línea es un sector de la ruleta.',
    problema: 'La primera línea se muestra en grande durante la actividad.',
    ahorcado: 'Formato: PALABRA=pista (la pista es opcional). Ej: ELEFANTE=Animal con trompa',
    reto    : 'Formato: Reto = URL de imagen o video (la URL es opcional). Ej: 10 sentadillas = https://...',
    organiza: 'Marca con [corchetes] las palabras a ordenar. Ej: El gato [come] pescado y [duerme] mucho.',
    descubre: 'Formato: PALABRA=pista. Para fijar los intentos, escribe el número en el campo "Tiempo (segundos)".',
    stop: 'Una categoría por línea. Ej: Nombre, País, Animal, Color, Comida.',
    acertijo: 'Formato: enunciado | respuesta | URL (la URL es opcional). Ej: Vuela de noche y duerme de día | murciélago | https://...',
  }[toolId] || 'Opcional según la actividad. Un elemento por línea.';
}

/* Texto fantasma del área de ítems: muestra cómo se ve un par de líneas
   reales del ejemplo modelo, para que el docente sepa qué escribir. */
function ejemploPlaceholder(toolId) {
  const ej = window.actEjemplo && window.actEjemplo(toolId);
  const items = ej && ej.ejemplo && ej.ejemplo.items;
  if (items && items.length) return 'Por ejemplo:\n' + items.slice(0, 2).join('\n');
  return 'Un elemento por línea';
}

Object.assign(window, { Editor });

/* Tarjeta "Cómo funciona + Ejemplo": explica la actividad de forma sencilla,
   muestra un ejemplo modelo sobre un tema real y permite cargarlo de un clic. */
function EjemploCard({ tool, onUsar }) {
  const [abierto, setAbierto] = React.useState(true);
  const guia = window.actEjemplo && window.actEjemplo(tool.id);
  if (!guia) return null;
  const ej = guia.ejemplo || {};
  const items = ej.items || [];

  return (
    <div style={{
      border: '1.5px solid ' + tool.color, borderRadius: 14, overflow: 'hidden',
      background: 'color-mix(in oklch, ' + tool.color + ' 8%, var(--surface))',
    }}>
      <button onClick={() => setAbierto((a) => !a)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
          background: 'transparent', border: 'none', textAlign: 'left' }}>
        <span style={{ fontSize: 20 }}>💡</span>
        <span style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14.5 }}>
          Cómo funciona y un ejemplo
        </span>
        <span style={{ color: 'var(--muted)', fontSize: 13, transform: abierto ? 'rotate(90deg)' : 'none', transition: 'transform .15s' }}>▸</span>
      </button>

      {abierto && (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>{guia.que}</div>

          {guia.comoVe && (
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--ink)' }}>En pantalla:</strong> {guia.comoVe}
            </div>
          )}

          <div style={{ fontSize: 13, lineHeight: 1.5, padding: '10px 12px', borderRadius: 10,
            background: 'var(--surface2)', border: '1px solid var(--line)' }}>
            <strong>Cómo escribirlo:</strong> {guia.formato}
          </div>

          {items.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
                Ejemplo modelo
              </div>
              <div style={{ fontFamily: 'var(--font-mono, ui-monospace, monospace)', fontSize: 12.5, lineHeight: 1.7,
                background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: '10px 14px',
                whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {items.slice(0, 4).join('\n')}{items.length > 4 ? '\n…' : ''}
              </div>
            </div>
          )}

          <button className="btn btn-sm" onClick={onUsar}
            style={{ alignSelf: 'flex-start', background: tool.color, color: '#06140A', border: 'none', fontWeight: 700 }}>
            ✨ Usar este ejemplo
          </button>
        </div>
      )}
    </div>
  );
}

/* Panel contextual: aparece al seleccionar un elemento del lienzo (ENCIMA de la plantilla).
   Todos los estilos son menús desplegables. Incluye control de orden de aparición. */
function ElementoPanel({ el, onPatch, onDelete, onMover, ordenInfo }) {
  if (!el) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13.5, padding: '10px 0' }}>
        Usa la barra de arriba para añadir texto, imagen o video · Haz clic en un elemento para darle estilo y animación · Arrástralo para moverlo
      </div>
    );
  }
  const esTexto = el.tipo === 'texto';
  const selStyle = { borderRadius: 9, border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--ink)', padding: '8px 10px', fontSize: 13.5, fontWeight: 600 };
  const Campo = ({ label, children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</label>
      {children}
    </div>
  );

  return (
    <div className="el-panel">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15 }}>
          {esTexto ? 'Caja de texto' : el.tipo === 'imagen' ? 'Imagen' : 'Video'}
          {ordenInfo && ordenInfo.pos >= 0 && (
            <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--muted)', marginLeft: 10 }}>
              Aparición {ordenInfo.pos + 1} de {ordenInfo.total}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => onMover(-1)} disabled={!ordenInfo || ordenInfo.pos <= 0}
            style={{ opacity: (!ordenInfo || ordenInfo.pos <= 0) ? .4 : 1 }} title="Aparece antes">↑ Antes</button>
          <button className="btn btn-sm" onClick={() => onMover(1)} disabled={!ordenInfo || ordenInfo.pos >= ordenInfo.total - 1}
            style={{ opacity: (!ordenInfo || ordenInfo.pos >= ordenInfo.total - 1) ? .4 : 1 }} title="Aparece después">↓ Después</button>
          <button className="btn btn-sm" onClick={onDelete} title="Eliminar elemento">✕</button>
        </div>
      </div>

      {!esTexto && (
        <div className="field" style={{ marginBottom: 0 }}>
          <label>{el.tipo === 'imagen' ? 'URL de la imagen' : 'URL del video (YouTube, Vimeo o .mp4)'}</label>
          <input type="text" value={el.valor || ''} placeholder="https://…"
            onChange={(e) => onPatch({ valor: e.target.value })} />
        </div>
      )}

      <div className="row">
        {esTexto && (
          <React.Fragment>
            <Campo label="Tipografía">
              <select style={selStyle} value={el.font} onChange={(e) => onPatch({ font: e.target.value })}>
                {FONTS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </Campo>
            <Campo label="Tamaño">
              <select style={selStyle} value={el.size} onChange={(e) => onPatch({ size: Number(e.target.value) })}>
                {TAMANOS.map((s) => <option key={s} value={s}>{s} px</option>)}
              </select>
            </Campo>
            <Campo label="Peso">
              <select style={selStyle} value={el.peso} onChange={(e) => onPatch({ peso: Number(e.target.value) })}>
                <option value={400}>Normal</option>
                <option value={600}>Media</option>
                <option value={800}>Negrita</option>
              </select>
            </Campo>
            <Campo label="Alineación">
              <select style={selStyle} value={el.align} onChange={(e) => onPatch({ align: e.target.value })}>
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </Campo>
            <Campo label="Color">
              <select style={selStyle} value={COLORES_TEXTO.includes(el.color) ? el.color : '__custom'}
                onChange={(e) => { if (e.target.value !== '__custom') onPatch({ color: e.target.value }); }}>
                {COLORES_TEXTO.map((c) => <option key={c} value={c}>{nombreColor(c)}</option>)}
                <option value="__custom">Personalizado…</option>
              </select>
            </Campo>
            <Campo label=" ">
              <input type="color" className="color-dot" value={el.color || '#000000'}
                onChange={(e) => onPatch({ color: e.target.value })} title="Color personalizado" />
            </Campo>
          </React.Fragment>
        )}
        <Campo label="Animación">
          <select style={selStyle} value={el.anim || 'none'} onChange={(e) => onPatch({ anim: e.target.value })}>
            {ANIMS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </Campo>
      </div>
    </div>
  );
}

function nombreColor(hex) {
  return {
    '#0B0F0C': 'Negro', '#FFFFFF': 'Blanco', '#F53711': 'Naranja',
    '#11F555': 'Verde', '#116CF5': 'Azul', '#F5C211': 'Amarillo', '#9B30FF': 'Morado',
  }[hex] || hex;
}

/* Panel para definir los equipos de la competencia (nombre, color, quitar/añadir).
   Los puntos se editan jugando en el presentador, no aquí. */
function EquiposEditor({ equipos, onCambiar, onAgregar, onQuitar }) {
  const [abierto, setAbierto] = React.useState(true);
  const PALETA = ['#F53711', '#116CF5', '#11F555', '#F5C211', '#9B30FF', '#FF6B9D'];
  return (
    <div className="group-block open" style={{ border: '1.5px solid var(--azul)' }}>
      <button className="group-head" onClick={() => setAbierto((a) => !a)} aria-expanded={abierto}>
        <span className="group-ico" style={{ background: 'var(--azul)' }}><Icon name="trofeo" size={18} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>Equipos de la competencia</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{equipos.length} equipos · edítalos aquí</span>
        </span>
        <span className="group-caret"><Icon name="flecha" size={16} /></span>
      </button>
      {abierto && (
        <div className="group-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {equipos.map((e) => (
            <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <select value={PALETA.includes(e.color) ? e.color : PALETA[0]}
                onChange={(ev) => onCambiar(e.id, { color: ev.target.value })}
                style={{ width: 34, height: 34, padding: 0, border: 'none', background: e.color, borderRadius: 8, cursor: 'pointer', appearance: 'none' }}
                title="Color del equipo">
                {PALETA.map((c) => <option key={c} value={c} style={{ background: '#fff' }}>{nombreColor(c)}</option>)}
              </select>
              <input type="text" value={e.nombre} onChange={(ev) => onCambiar(e.id, { nombre: ev.target.value })}
                style={{ flex: 1, minWidth: 0, border: '1px solid var(--line)', borderRadius: 8, padding: '7px 10px', fontSize: 13.5, background: 'var(--bg)', color: 'var(--ink)' }} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, minWidth: 30, textAlign: 'center', color: e.color }}>{e.puntos || 0}</span>
              {equipos.length > 2 && (
                <button className="btn btn-sm" onClick={() => onQuitar(e.id)} title="Quitar equipo" style={{ padding: '4px 9px' }}>✕</button>
              )}
            </div>
          ))}
          {equipos.length < 6 && (
            <button className="btn btn-sm" onClick={onAgregar} style={{ alignSelf: 'flex-start' }}>+ Añadir equipo</button>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Los puntos se suman durante la presentación al tocar al ganador.</div>
        </div>
      )}
    </div>
  );
}

/* Grupo especial "Modo Equipos": actividades nativas de equipo + reutilizables. */
function GrupoEquipos({ openGroup, setOpenGroup, onAdd }) {
  const isOpen = openGroup === 'equipos';
  const tools = AIP.equiposTools();
  const nativas = tools.filter((t) => AIP.esSoloEquipos(t.id));
  const reusadas = tools.filter((t) => !AIP.esSoloEquipos(t.id));
  const renderTool = (t) => (
    <button key={t.id} className="tool-card" onClick={() => onAdd(t.id)} title={'Añadir ' + t.nombre}>
      <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
        <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</span>
      </span>
      <span className="tool-add">+</span>
    </button>
  );
  return (
    <div className={'group-block' + (isOpen ? ' open' : '')}>
      <button className="group-head" onClick={() => setOpenGroup(isOpen ? null : 'equipos')} aria-expanded={isOpen}>
        <span className="group-ico" style={{ background: '#F5C211' }}><Icon name="trofeo" size={18} /></span>
        <span style={{ minWidth: 0, flex: 1 }}>
          <span style={{ display: 'block', fontWeight: 800, fontSize: 14 }}>Actividades de equipos</span>
          <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)' }}>{nativas.length} por turnos · {reusadas.length} reutilizables</span>
        </span>
        <span className="group-caret"><Icon name="flecha" size={16} /></span>
      </button>
      <div className="group-body">
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#F5C211', margin: '2px 0 6px' }}>⚡ Por turnos de equipo</div>
        {nativas.map(renderTool)}
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', margin: '12px 0 6px' }}>Con ganador (asignas el punto)</div>
        {reusadas.map(renderTool)}
      </div>
    </div>
  );
}
/* Editor especial para Encuentra las diferencias:
   modo + URLs + marcar puntos con clic sobre la imagen. */
function DiferenciasEditor({ current, curIdx, updateSlide }) {
  const cfg = current.config;
  const modo = cfg.modo || 'dos';
  const puntos = Array.isArray(cfg.puntos) ? cfg.puntos : [];

  const set = (cambios) => updateSlide(curIdx, { ...current, config: { ...cfg, ...cambios } });

  const marcar = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    set({ puntos: [...puntos, { x, y }] });
  };
  const borrarPunto = (i, ev) => {
    ev.stopPropagation();
    set({ puntos: puntos.filter((_, j) => j !== i) });
  };

  const imgRef = cfg.img1 || '';

  return (
    <div>
      <div className="field">
        <label>Modo de imágenes</label>
        <select value={modo} onChange={(e) => set({ modo: e.target.value })}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <option value="dos">Dos imágenes separadas (original y modificada)</option>
          <option value="una">Una sola imagen (ya tiene las dos mitades)</option>
        </select>
      </div>

      <div className="field">
        <label>{modo === 'dos' ? 'URL de la imagen 1 (izquierda)' : 'URL de la imagen'}</label>
        <input type="text" value={cfg.img1 || ''} onChange={(e) => set({ img1: e.target.value })} placeholder="https://..." />
      </div>

      {modo === 'dos' && (
        <div className="field">
          <label>URL de la imagen 2 (derecha, la modificada)</label>
          <input type="text" value={cfg.img2 || ''} onChange={(e) => set({ img2: e.target.value })} placeholder="https://..." />
        </div>
      )}

      {imgRef ? (
        <div className="field">
          <label>Haz clic sobre la imagen para marcar cada diferencia ({puntos.length} marcadas)</label>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', border: '2px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair' }}
            onClick={marcar}>
            <img src={imgRef} style={{ display: 'block', maxWidth: '100%', maxHeight: 360, userSelect: 'none' }} alt="" />
            {puntos.map((p, i) => (
              <div key={i} onClick={(ev) => borrarPunto(i, ev)} title="Clic para borrar"
                style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: 26, height: 26, marginLeft: -13, marginTop: -13,
                  borderRadius: '50%', background: 'rgba(245,55,17,.85)', border: '2px solid #fff', color: '#fff',
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{i + 1}</div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
            Clic en la imagen para añadir una diferencia. Clic en un círculo rojo para borrarlo. Marca el mismo lugar donde está la diferencia.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Pega una URL de imagen arriba para poder marcar las diferencias.</div>
      )}
    </div>
  );
}
