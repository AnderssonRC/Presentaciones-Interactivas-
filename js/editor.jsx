/* Editor de plantillas — 3 columnas verticales:
   [lista pequeña] [lienzo grande ~65%] [20 herramientas de actividades interactivas] */

function Editor({ pres, onChange, onBack, onPresent, theme, setTheme }) {
  const [sel, setSel] = React.useState(0);
  const [openGroup, setOpenGroup] = React.useState('evaluadoras');
  const [teamsOpen, setTeamsOpen] = React.useState(false);
  const [aulaOpen, setAulaOpen] = React.useState(false);
  const [selEl, setSelEl] = React.useState(null); // id del elemento seleccionado en el lienzo
  // Previa de animaciones en el editor: al activarla, todos los elementos
  // reproducen su animación una vez. `previewTick` re-monta el lienzo para
  // reiniciar las animaciones cada vez que se pulsa "Previsualizar".
  const [previewOn, setPreviewOn] = React.useState(false);
  const [previewTick, setPreviewTick] = React.useState(0);
  const slides = pres.slides;
  const current = slides[Math.min(sel, slides.length - 1)];

  // Dispara una previa: enciende el modo y lo apaga solo tras unos segundos
  // (las animaciones de entrada duran <1s; las continuas se cortan al apagar).
  const previewRef = React.useRef(null);
  const previsualizar = () => {
    setPreviewTick((t) => t + 1);
    setPreviewOn(true);
    if (previewRef.current) clearTimeout(previewRef.current);
    previewRef.current = setTimeout(() => setPreviewOn(false), 2600);
  };
  React.useEffect(() => () => { if (previewRef.current) clearTimeout(previewRef.current); }, []);

  // Popovers de la barra superior (Equipos y Aula): se cierran al hacer clic
  // fuera o con Escape, igual que los menús del lienzo (LzMenu). El listener
  // solo existe mientras alguno esté abierto.
  const teamsRef = React.useRef(null);
  const aulaRef = React.useRef(null);
  React.useEffect(() => {
    if (!teamsOpen && !aulaOpen) return;
    const fuera = (e) => {
      if (teamsOpen && teamsRef.current && !teamsRef.current.contains(e.target)) setTeamsOpen(false);
      if (aulaOpen && aulaRef.current && !aulaRef.current.contains(e.target)) setAulaOpen(false);
    };
    const esc = (e) => { if (e.key === 'Escape') { setTeamsOpen(false); setAulaOpen(false); } };
    document.addEventListener('mousedown', fuera);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', fuera);
      document.removeEventListener('keydown', esc);
    };
  }, [teamsOpen, aulaOpen]);

  // Al cambiar de diapositiva, soltar la selección de elemento y cortar la previa.
  React.useEffect(() => { setSelEl(null); setPreviewOn(false); }, [sel]);
  // Migra UNA sola vez la diapositiva de contenido (de titulo/texto/imagen al
  // modelo de elementos) y la persiste, para que los ids no se regeneren en
  // cada render. Sin esto, migrarContenido() crea ids nuevos en cada pintado,
  // la selección se pierde y el lienzo "vibra" / exige varios clics.
  React.useEffect(() => {
    const c = slides[Math.min(sel, slides.length - 1)];
    if (c && c.type === 'contenido' && !Array.isArray(c.elementos)) {
      const next = slides.slice();
      next[Math.min(sel, slides.length - 1)] = migrarContenido(c);
      update({ slides: next });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, current.id]);

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

  /* ---------- Lienzo libre (diapositivas de contenido) ---------- */
  // Garantiza que la diapositiva actual tenga el modelo de elementos.
  // Migra al vuelo las plantillas viejas (titulo/texto/imagen) y persiste.
  const asegurarMigrada = () => {
    if (Array.isArray(current.elementos)) return current;
    const migrada = migrarContenido(current);
    updateSlide(curIdx, migrada);
    return migrada;
  };
  // Cambia un elemento por id (lo usa el lienzo al arrastrar/redimensionar/editar
  // y también el panel de propiedades).
  const cambiarElemento = (id, next) => {
    const base = asegurarMigrada();
    const elementos = (base.elementos || []).map((el) => (el.id === id ? next : el));
    updateSlide(curIdx, { ...base, elementos });
  };
  // Añade un elemento nuevo (texto/imagen/video) y lo deja seleccionado.
  const agregarElemento = (tipo) => {
    const base = asegurarMigrada();
    const nuevo = nuevoElemento(tipo);
    nuevo.orden = (base.elementos || []).length; // se revela al final por defecto
    updateSlide(curIdx, { ...base, elementos: [...(base.elementos || []), nuevo] });
    setSelEl(nuevo.id);
  };
  // Borra el elemento seleccionado.
  const borrarElemento = (id) => {
    const base = asegurarMigrada();
    updateSlide(curIdx, { ...base, elementos: (base.elementos || []).filter((el) => el.id !== id) });
    setSelEl(null);
  };
  // Cambia el fondo de la diapositiva.
  const setFondo = (fondo) => {
    const base = asegurarMigrada();
    updateSlide(curIdx, { ...base, fondo });
  };

  // Ya no migramos en el render (lo hace el useEffect de arriba, una sola vez).
  // Si por un instante aún no se ha migrado, usamos una versión local sin
  // persistir, pero NO generamos ids nuevos en cada pintado.
  const migrada = current.type === 'contenido'
    ? (Array.isArray(current.elementos) ? current : migrarContenido(current))
    : current;
  const elementoSel = (migrada.elementos || []).find((el) => el.id === selEl) || null;

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
        <div ref={teamsRef} style={{ position: 'relative' }}>
          <button className="btn" onClick={() => { setAulaOpen(false); setTeamsOpen((o) => !o); }}
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

        {/* Panel de Aula: participación con celular + PIN del mando */}
        <div ref={aulaRef} style={{ position: 'relative' }}>
          {(() => {
            const conEstudiantes = pres.estudiantes === true;
            const mandoPin = pres.mandoPin || '';
            return (
              <React.Fragment>
                <button className="btn" onClick={() => { setTeamsOpen(false); setAulaOpen((o) => !o); }}
                  style={{ background: conEstudiantes ? 'var(--acento)' : 'transparent', color: conEstudiantes ? 'var(--acento-text)' : 'inherit', border: '1px solid var(--acento)' }}
                  title="Configurar participación y mando">
                  📱 Aula{mandoPin ? ' 🔒' : ''}
                </button>
                {aulaOpen && (
                  <div style={{
                    position: 'absolute', top: '110%', right: 0, zIndex: 60, width: 320,
                    background: 'var(--surface, #141814)', border: '1px solid var(--border, #2A2F29)',
                    borderRadius: 14, padding: 14, boxShadow: '0 20px 50px -20px rgba(0,0,0,.6)',
                  }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
                      <input type="checkbox" checked={conEstudiantes}
                        onChange={(e) => update({ estudiantes: e.target.checked })} />
                      <span style={{ fontWeight: 700 }}>Permitir participación con celular</span>
                    </label>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 14 }}>
                      Habilita que los estudiantes se unan desde su teléfono y levanten la mano.
                      Si está apagado, el televisor no mostrará la opción de pedir participación.
                    </div>

                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                        🔒 PIN del mando (docente)
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8 }}>
                        Solo tú lo conoces. Al entrar como “docente” desde el celular se pedirá este PIN,
                        así nadie que escanee el código puede tomar el control. Los estudiantes no lo necesitan.
                      </div>
                      <input type="text" inputMode="numeric" value={mandoPin}
                        onChange={(e) => update({ mandoPin: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                        placeholder="Ej: 2468 (opcional, 4–6 dígitos)"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, letterSpacing: '.12em' }} />
                      {mandoPin && (
                        <button className="btn btn-sm" style={{ marginTop: 8 }}
                          onClick={() => update({ mandoPin: '' })}>Quitar PIN</button>
                      )}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })()}
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
          {current.type === 'contenido' && (
            <LienzoToolbar
              elemento={elementoSel}
              onAgregar={agregarElemento}
              onCambiar={(next) => elementoSel && cambiarElemento(elementoSel.id, next)}
              onBorrar={() => elementoSel && borrarElemento(elementoSel.id)}
              fondo={migrada.fondo || { tipo: 'color', valor: '' }}
              onFondo={setFondo}
              totalElementos={(migrada.elementos || []).length}
              onPrevisualizar={previsualizar}
              previewOn={previewOn} />
          )}

          <ScaledSlide>
            {current.type === 'contenido' ? (
              <ContenidoSlide slide={migrada} materia={pres.materia || 'Tema'} accent={pres.color} editable
                selId={selEl} onSelect={setSelEl} onChangeEl={cambiarElemento}
                previewOn={previewOn} replay={previewTick} />
            ) : (
              <ActividadSlidePreview slide={current} />
            )}
          </ScaledSlide>

          {current.type === 'actividad' && (
            <div className="config-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="tool-ico" style={{ background: tool.color }}><Icon name={tool.icon} size={20} /></div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5 }}>Configura: {tool.nombre}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{tool.desc}</div>
                </div>
              </div>

              <EjemploCard tool={tool} current={current} curIdx={curIdx} updateSlide={updateSlide} />
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
    lluvia: 'Ideas iniciales (opcional, una por línea)',
    pares: 'Parejas (una por línea: izquierda = derecha)',
    encuesta: 'Opciones de la encuesta (una por línea)',
    debate: 'Línea 1: pregunta · Línea 2: postura A · Línea 3: postura B',
    memorama: 'Parejas (una por línea: A = B)',
    ordena: 'Pasos EN ORDEN CORRECTO (uno por línea)',
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
    lluvia: 'En vivo escribes las ideas en pantalla. Aquí puedes dejar algunas iniciales (una por línea); las repetidas crecen.',
    pares: 'Formato: izquierda = derecha. Cada lado puede ser imagen con "img:URL". Ej: Perro = Mamífero  ·  img:https://... = Planeta',
    encuesta: 'Una opción por línea. En Presentar sumas votos con +/− y las barras crecen.',
    debate: 'Tres líneas: la pregunta, el nombre de la postura A y el de la postura B. El tiempo por postura se fija en "Tiempo (segundos)".',
    memorama: 'Formato: A = B (una pareja por línea). Cada lado puede ser imagen con "img:URL". Ej: Perro = Mamífero  ·  img:https://... = Sol',
    ordena: 'Escribe los pasos en el orden CORRECTO (uno por línea). En Presentar se mostrarán barajados para que el grupo los acomode.',
  }[toolId] || 'Opcional según la actividad. Un elemento por línea.';
}

Object.assign(window, { Editor });

/* ============================================================
   Barra de herramientas del lienzo libre (diapositivas de contenido)
   Franja horizontal FIJA encima del lienzo (estilo Canva/Figma):
   cada categoría es un botón que abre su menú desplegable justo debajo.
   Solo un menú abierto a la vez. No es una columna apilada.
   ============================================================ */
function LienzoToolbar({ elemento, onAgregar, onCambiar, onBorrar, fondo, onFondo, totalElementos, onPrevisualizar, previewOn }) {
  const [menu, setMenu] = React.useState(null); // id del menú abierto
  const barraRef = React.useRef(null);
  const toggle = (id) => setMenu((m) => (m === id ? null : id));

  // Cerrar el menú al hacer clic fuera de la barra.
  React.useEffect(() => {
    if (!menu) return;
    const fuera = (e) => { if (barraRef.current && !barraRef.current.contains(e.target)) setMenu(null); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [menu]);

  // Al cambiar de elemento seleccionado, cerramos cualquier menú abierto.
  React.useEffect(() => { setMenu(null); }, [elemento && elemento.id]);

  const set = (patch) => elemento && onCambiar({ ...elemento, ...patch });
  const esTexto = elemento && elemento.tipo === 'texto';
  const hay = !!elemento;

  return (
    <div className="lienzo-bar" ref={barraRef}
      style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', overflow: 'visible' }}>
      <div className="lz-row"
        style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, width: '100%', maxWidth: '100%', minWidth: 0 }}>
        {/* --- Añadir (siempre disponible) --- */}
        <LzMenu id="add" label="＋ Añadir" abierto={menu === 'add'} onToggle={toggle}>
          <div className="lz-pop-title">Añadir al lienzo</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="lz-item" onClick={() => { onAgregar('texto'); setMenu(null); }}>＋ Texto</button>
            <button className="lz-item" onClick={() => { onAgregar('imagen'); setMenu(null); }}>🖼 Imagen</button>
            <button className="lz-item" onClick={() => { onAgregar('video'); setMenu(null); }}>🎬 Video</button>
          </div>
          <div className="lz-hint">Arrastra para mover · tirador de la esquina para agrandar.</div>
        </LzMenu>

        {/* --- Fondo (siempre disponible) --- */}
        <LzMenu id="fondo" label="🎨 Fondo" abierto={menu === 'fondo'} onToggle={toggle}>
          <FondoMenu fondo={fondo} onFondo={onFondo} />
        </LzMenu>

        {/* --- Previsualizar animaciones (siempre disponible) --- */}
        {onPrevisualizar && (
          <button
            className={'lz-btn' + (previewOn ? ' open' : '')}
            onClick={() => { setMenu(null); onPrevisualizar(); }}
            title="Reproducir las animaciones de esta diapositiva en el lienzo">
            ▶ Previsualizar
          </button>
        )}

        <span className="lz-div" />

        {/* --- Categorías del elemento seleccionado --- */}
        {esTexto && (
          <React.Fragment>
            <LzMenu id="fuente" label="Fuente" abierto={menu === 'fuente'} onToggle={toggle}>
              <div className="lz-pop-title">Fuente</div>
              <select value={elemento.font} onChange={(e) => set({ font: e.target.value })} style={selStyle}>
                {FONTS.map((f) => <option key={f.id} value={f.id}>{f.nombre}</option>)}
              </select>
            </LzMenu>

            <LzMenu id="tam" label="Tamaño" abierto={menu === 'tam'} onToggle={toggle}>
              <div className="lz-pop-title">Tamaño</div>
              <select value={elemento.size} onChange={(e) => set({ size: Number(e.target.value) })} style={selStyle}>
                {TAMANOS.map((s) => <option key={s} value={s}>{s} px</option>)}
              </select>
            </LzMenu>

            <LzMenu id="color" label="Color" abierto={menu === 'color'} onToggle={toggle}>
              <div className="lz-pop-title">Color del texto</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', maxWidth: 220 }}>
                {COLORES_TEXTO.map((c) => (
                  <button key={c} onClick={() => set({ color: c })} title={c}
                    style={{ width: 28, height: 28, borderRadius: 8, background: c, cursor: 'pointer',
                      border: elemento.color === c ? '3px solid var(--azul, #116CF5)' : '1px solid var(--line)' }} />
                ))}
                <input type="color" value={elemento.color || '#0B0F0C'} onChange={(e) => set({ color: e.target.value })}
                  title="Color personalizado"
                  style={{ width: 28, height: 28, border: '1px solid var(--line)', borderRadius: 8, background: 'none', padding: 0, cursor: 'pointer' }} />
              </div>
            </LzMenu>

            <LzMenu id="peso" label="Peso" abierto={menu === 'peso'} onToggle={toggle}>
              <div className="lz-pop-title">Grosor</div>
              <select value={elemento.peso} onChange={(e) => set({ peso: Number(e.target.value) })} style={selStyle}>
                <option value={400}>Normal</option>
                <option value={500}>Medio</option>
                <option value={600}>Semi-negrita</option>
                <option value={700}>Negrita</option>
                <option value={800}>Extra-negrita</option>
              </select>
            </LzMenu>

            <LzMenu id="align" label="Alinear" abierto={menu === 'align'} onToggle={toggle}>
              <div className="lz-pop-title">Alineación</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[['left', '⬅'], ['center', '⬌'], ['right', '➡']].map(([v, lbl]) => (
                  <button key={v} onClick={() => set({ align: v })}
                    className={'btn btn-sm' + (elemento.align === v ? ' btn-primary' : '')} style={{ flex: 1, fontSize: 16 }}>{lbl}</button>
                ))}
              </div>
            </LzMenu>

            <span className="lz-div" />
          </React.Fragment>
        )}

        {/* Contenido / URL del medio (imagen y video) */}
        {hay && !esTexto && (
          <LzMenu id="src" label={elemento.tipo === 'video' ? 'URL del video' : 'URL de la imagen'} abierto={menu === 'src'} onToggle={toggle}>
            <div className="lz-pop-title">{elemento.tipo === 'video' ? 'Video (YouTube/Vimeo)' : 'Imagen'}</div>
            <input type="text" value={elemento.valor || ''} onChange={(e) => set({ valor: e.target.value })}
              placeholder="https://…" style={{ width: 260 }} />
          </LzMenu>
        )}

        {/* Animación (cualquier elemento; "Cambio de color" solo en texto) */}
        {hay && (
          <LzMenu id="anim" label="Animación" abierto={menu === 'anim'} onToggle={toggle}>
            <div className="lz-pop-title">Animación</div>
            <select value={elemento.anim || 'none'} onChange={(e) => set({ anim: e.target.value })} style={selStyle}>
              {ANIMS.filter((a) => esTexto || a.id !== 'colorShift').map((a) => (
                <option key={a.id} value={a.id}>{a.nombre}</option>
              ))}
            </select>
            <div className="lz-hint">
              Las continuas (latido, vibrar, cambio de color) se repiten siempre.
              {elemento.anim === 'colorShift' && ' El color del texto cambia solo.'}
            </div>
          </LzMenu>
        )}

        {/* Orden de revelado */}
        {hay && (
          <LzMenu id="orden" label="Orden" abierto={menu === 'orden'} onToggle={toggle}>
            <div className="lz-pop-title">Orden de revelado</div>
            <input type="number" min="0" step="1" value={elemento.orden || 0}
              onChange={(e) => set({ orden: Math.max(0, Number(e.target.value) || 0) })} style={{ width: 120 }} />
            <div className="lz-hint">En Presentar aparecen de menor a mayor. Igual número = juntos.</div>
          </LzMenu>
        )}

        {/* Posición y tamaño exactos */}
        {hay && (
          <LzMenu id="pos" label="Posición" abierto={menu === 'pos'} onToggle={toggle}>
            <div className="lz-pop-title">Posición y tamaño</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, width: 220 }}>
              <label className="lz-mini">X<input type="number" value={elemento.x} onChange={(e) => set({ x: Number(e.target.value) })} /></label>
              <label className="lz-mini">Y<input type="number" value={elemento.y} onChange={(e) => set({ y: Number(e.target.value) })} /></label>
              <label className="lz-mini">Ancho<input type="number" value={elemento.w} onChange={(e) => set({ w: Math.max(80, Number(e.target.value)) })} /></label>
              <label className="lz-mini">Alto<input type="number" value={elemento.h} onChange={(e) => set({ h: Math.max(60, Number(e.target.value)) })} /></label>
            </div>
          </LzMenu>
        )}

        {/* Empuja el borrar/estado a la derecha (pero permite el salto de fila) */}
        <span style={{ flex: '1 1 0', minWidth: 0 }} />

        {hay ? (
          <button className="lz-del" onClick={onBorrar} title="Eliminar elemento seleccionado">🗑 Borrar</button>
        ) : (
          <span className="lz-status">
            {totalElementos === 0 ? 'Añade un elemento para empezar.' : 'Haz clic en un elemento para editarlo.'}
          </span>
        )}
      </div>
    </div>
  );
}

/* Botón de categoría + su menú desplegable (popover anclado debajo).
   El popover se ancla a la izquierda del botón por defecto, pero si se saldría
   por el borde derecho del lienzo, se ancla a la derecha. La detección se hace
   al abrir, midiendo la posición real del botón y del contenedor de la barra. */
function LzMenu({ id, label, abierto, onToggle, children }) {
  const refBtn = React.useRef(null);
  const refPop = React.useRef(null);
  // 'left' (por defecto) o 'right': de qué lado del botón se alinea el popover.
  const [lado, setLado] = React.useState('left');

  React.useLayoutEffect(() => {
    if (!abierto || !refBtn.current || !refPop.current) return;
    const barra = refBtn.current.closest('.lienzo-bar') || document.body;
    const limite = barra.getBoundingClientRect();
    const btn = refBtn.current.getBoundingClientRect();
    const anchoPop = refPop.current.offsetWidth || 260;
    // Si alineado a la izquierda del botón se sale por la derecha del límite,
    // lo alineamos a la derecha del botón.
    if (btn.left + anchoPop > limite.right - 8) setLado('right');
    else setLado('left');
  }, [abierto, children]);

  const estiloPop = {
    position: 'absolute', top: '110%', zIndex: 70,
    ...(lado === 'right' ? { right: 0 } : { left: 0 }),
  };

  return (
    <div className="lz-menu" style={{ position: 'relative' }}>
      <button ref={refBtn} className={'lz-btn' + (abierto ? ' open' : '')} onClick={() => onToggle(id)} aria-expanded={abierto}>
        {label}<span className="lz-caret">▾</span>
      </button>
      {abierto && (
        <div ref={refPop} className="lz-pop" style={estiloPop} onMouseDown={(e) => e.stopPropagation()}>
          {children}
        </div>
      )}
    </div>
  );
}

/* Contenido del menú "Fondo". */
function FondoMenu({ fondo, onFondo }) {
  const tipo = fondo.tipo || 'color';
  return (
    <div style={{ width: 240 }}>
      <div className="lz-pop-title">Fondo de la diapositiva</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <button className={'btn btn-sm' + (tipo === 'color' ? ' btn-primary' : '')}
          onClick={() => onFondo({ tipo: 'color', valor: fondo.valor || '' })}>Color</button>
        <button className={'btn btn-sm' + (tipo === 'url' ? ' btn-primary' : '')}
          onClick={() => onFondo({ tipo: 'url', valor: tipo === 'url' ? fondo.valor : '' })}>Imagen</button>
        {fondo.valor && <button className="btn btn-sm" onClick={() => onFondo({ tipo, valor: '' })}>Quitar</button>}
      </div>
      {tipo === 'color' ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input type="color" value={fondo.valor || '#ffffff'} onChange={(e) => onFondo({ tipo: 'color', valor: e.target.value })}
            style={{ width: 38, height: 34, border: 'none', background: 'none', padding: 0, cursor: 'pointer' }} />
          <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>Color del lienzo</span>
        </div>
      ) : (
        <input type="text" value={fondo.valor || ''} placeholder="https://… (URL de imagen)"
          onChange={(e) => onFondo({ tipo: 'url', valor: e.target.value })} style={{ width: '100%' }} />
      )}
    </div>
  );
}

const selStyle = {
  width: '100%', minWidth: 180, padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)',
  background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14,
};

Object.assign(window, { LienzoToolbar, LzMenu, FondoMenu });

/* Tarjeta "Cómo funciona + Ejemplo": lee window.ACT_EJEMPLOS (examples.js).
   Muestra qué hace la actividad, qué ve el grupo y el formato. Permite
   precargar un ejemplo real con un clic, sin pisar lo que el docente ya escribió
   salvo que confirme. */
function EjemploCard({ tool, current, curIdx, updateSlide }) {
  const guia = (window.actEjemplo && window.actEjemplo(tool.id)) || null;
  const [abierto, setAbierto] = React.useState(false);
  if (!guia) return null;

  const usarEjemplo = () => {
    const ej = guia.ejemplo || {};
    const hayContenido =
      (current.config.items && current.config.items.length &&
        current.config.items.some((x) => (x || '').trim())) ||
      (current.config.titulo && current.config.titulo.trim());
    if (hayContenido && !window.confirm('Esto reemplazará lo que ya escribiste con el ejemplo. ¿Continuar?')) return;
    updateSlide(curIdx, {
      ...current,
      config: { ...current.config, ...ej, items: ej.items ? ej.items.slice() : current.config.items },
    });
  };

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', margin: '4px 0 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <Icon name="rayo" size={16} />
          <strong style={{ fontSize: 13.5 }}>Cómo funciona</strong>
        </div>
        <button onClick={() => setAbierto((v) => !v)}
          style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12.5, fontWeight: 700 }}>
          {abierto ? 'Ocultar' : 'Ver ejemplo'}
        </button>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 13, lineHeight: 1.4 }}>{guia.que}</p>
      {guia.comoVe && (
        <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.4 }}>
          <strong>En pantalla:</strong> {guia.comoVe}
        </p>
      )}

      {abierto && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed var(--line)' }}>
          {guia.formato && (
            <p style={{ margin: '0 0 8px', fontSize: 12.5, lineHeight: 1.4 }}>
              <strong>Formato:</strong> {guia.formato}
            </p>
          )}
          {guia.ejemplo && (
            <div style={{ fontSize: 12.5, color: 'var(--muted)' }}>
              <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                Ejemplo: {guia.ejemplo.titulo || tool.nombre}
              </div>
              {(guia.ejemplo.items || []).slice(0, 4).map((it, i) => (
                <div key={i} style={{ fontFamily: 'var(--font-mono, monospace)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{it}</div>
              ))}
            </div>
          )}
          {guia.ejemplo && (
            <button onClick={usarEjemplo}
              style={{ marginTop: 10, background: tool.color, color: '#fff', border: 'none', borderRadius: 9, padding: '8px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              Usar este ejemplo
            </button>
          )}
        </div>
      )}
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