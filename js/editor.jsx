/* Editor de plantillas — 3 columnas verticales:
   [lista pequeña] [lienzo grande ~65%] [20 herramientas de actividades interactivas] */

function Editor({ pres, onChange, onBack, onPresent, theme, setTheme }) {
  const [sel, setSel] = React.useState(0);
  const [openGroup, setOpenGroup] = React.useState('evaluadoras');
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

  const addContenido = () => {
    const s = { id: AIP.uid(), type: 'contenido', titulo: 'Nueva plantilla', texto: '' };
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
              <button key={s.id} className={'slide-thumb' + (i === curIdx ? ' active' : '')} onClick={() => setSel(i)}>
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
          <ScaledSlide>
            {current.type === 'contenido' ? (
              <ContenidoSlide slide={current} materia={pres.materia || 'Tema'} accent={pres.color} editable
                onChange={(s) => updateSlide(curIdx, s)} />
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
              <div className="field">
                <label>Instrucciones para el grupo</label>
                <textarea rows="2" value={current.config.instrucciones} onChange={setCfg('instrucciones')}></textarea>
              </div>
              <div className="field">
                <label>{itemsLabel(current.tool)}</label>
                <textarea rows="5" value={(current.config.items || []).join('\n')} onChange={setItems} placeholder="Un elemento por línea"></textarea>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{itemsHint(current.tool)}</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13.5 }}>
              Haz clic sobre el título o el texto de la plantilla para editarlos · Arrastra una imagen al recuadro
            </div>
          )}
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

function itemsLabel(toolId) {
  return {
    ruleta: 'Preguntas de la ruleta (una por línea)',
    completa: 'Palabras (una por línea)',
    elige: 'Preguntas (una por línea)',
    vf: 'Afirmaciones (una por línea)',
    problema: 'Enunciado del problema',
    selector: 'Nombres de estudiantes (uno por línea)',
    marcador: 'Nombres de los equipos (uno por línea)',
  }[toolId] || 'Elementos de la actividad (uno por línea)';
}
function itemsHint(toolId) {
  return {
    completa: 'Formato: PALABR_=A → usa "_" para la letra oculta y "=" para la respuesta.',
    elige: 'Formato: Pregunta|Respuesta correcta|Distractor 1|Distractor 2',
    vf: 'Formato: Afirmación|V  o  Afirmación|F',
    ruleta: 'Cada línea es un sector de la ruleta.',
    problema: 'La primera línea se muestra en grande durante la actividad.',
  }[toolId] || 'Opcional según la actividad. Un elemento por línea.';
}

Object.assign(window, { Editor });
