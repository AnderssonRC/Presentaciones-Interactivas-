/* Editor de plantillas — 3 columnas verticales:
   [lista pequeña] [lienzo grande ~65%] [20 herramientas de actividades interactivas] */

function Editor({ pres, onChange, onBack, onPresent, theme, setTheme }) {
  const [sel, setSel] = React.useState(0);
  const [openGroup, setOpenGroup] = React.useState('evaluadoras');
  const [teamsOpen, setTeamsOpen] = React.useState(false);
  const slides = pres.slides;
  const current = slides[Math.min(sel, slides.length - 1)];

  const update = (patch) => onChange({ ...pres, ...patch });

  // --- Modo equipos (propiedad de la presentación) ---
  const COLORES_EQUIPO = ['#11F555', '#F53711', '#116CF5', '#F5C211', '#A855F7', '#EC4899'];
  const esEquipos = pres.modo === 'equipos';
  const equipos = pres.equipos && pres.equipos.length
    ? pres.equipos
    : [{ name: 'Equipo Verde', color: '#11F555' }, { name: 'Equipo Naranja', color: '#F53711' }];
  const toggleEquipos = () => update({ modo: esEquipos ? 'normal' : 'equipos', equipos });
  const setEquipo = (i, patch) => {
    const next = equipos.map((t, j) => (j === i ? { ...t, ...patch } : t));
    update({ equipos: next });
  };
  const addEquipo = () => {
    if (equipos.length >= 6) return;
    update({ equipos: [...equipos, { name: 'Equipo ' + (equipos.length + 1), color: COLORES_EQUIPO[equipos.length % COLORES_EQUIPO.length] }] });
  };
  const removeEquipo = (i) => {
    if (equipos.length <= 2) return;
    update({ equipos: equipos.filter((_, j) => j !== i) });
  };
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
        <div style={{ position: 'relative' }}>
          <button className="btn" onClick={() => setTeamsOpen((o) => !o)}
            style={{ background: esEquipos ? 'var(--acento)' : 'transparent', color: esEquipos ? 'var(--acento-text)' : 'inherit', border: '1px solid var(--acento)' }}
            title="Configurar equipos">
            🏆 {esEquipos ? 'Equipos: ' + equipos.length : 'Equipos'}
          </button>
          {teamsOpen && (
            <div style={{
              position: 'absolute', top: '110%', right: 0, zIndex: 60, width: 300,
              background: 'var(--surface, #141814)', border: '1px solid var(--border, #2A2F29)',
              borderRadius: 14, padding: 14, boxShadow: '0 20px 50px -20px rgba(0,0,0,.6)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 12 }}>
                <input type="checkbox" checked={esEquipos} onChange={toggleEquipos} />
                <span style={{ fontWeight: 700 }}>Activar modo equipos</span>
              </label>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
                Muestra un marcador en el televisor y permite sumar puntos desde el celular.
              </div>
              {esEquipos && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {equipos.map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="color" value={t.color} onChange={(e) => setEquipo(i, { color: e.target.value })}
                        style={{ width: 30, height: 30, border: 'none', background: 'none', padding: 0, cursor: 'pointer', flexShrink: 0 }} />
                      <input value={t.name} onChange={(e) => setEquipo(i, { name: e.target.value })}
                        style={{ flex: 1, minWidth: 0, padding: '6px 8px', borderRadius: 8, border: '1px solid var(--border, #2A2F29)', background: 'transparent', color: 'inherit' }} />
                      {equipos.length > 2 && (
                        <button onClick={() => removeEquipo(i)} title="Quitar"
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 18, flexShrink: 0 }}>×</button>
                      )}
                    </div>
                  ))}
                  {equipos.length < 6 && (
                    <button className="btn btn-sm" onClick={addEquipo} style={{ marginTop: 4 }}>+ Agregar equipo</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
              {current.tool === 'sopa' ? (
                <SopaEditor current={current} curIdx={curIdx} updateSlide={updateSlide} />
              ) : current.tool === 'descubre' ? (
                <DescubreEditor current={current} curIdx={curIdx} updateSlide={updateSlide} setItems={setItems} />
              ) : current.tool === 'errores' ? (
                <DiferenciasEditor current={current} curIdx={curIdx} updateSlide={updateSlide} />
              ) : (
                <div className="field">
                  <label>{itemsLabel(current.tool)}</label>
                  <textarea rows="5" value={(current.config.items || []).join('\n')} onChange={setItems} placeholder="Un elemento por línea"></textarea>
                  <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>{itemsHint(current.tool)}</div>
                </div>
              )}
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

Object.assign(window, { Editor });
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
