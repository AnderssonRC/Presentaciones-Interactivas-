/* editor-historia.jsx — Editor del Modo Historia (Modo Vigía, recurso: Historia).
   El docente crea sus propias diapositivas (texto que aparece palabra por
   palabra, imagen o ambas) para CONTAR una historia, y después de cualquier
   diapositiva agrega PAUSAS (cualquier activación: pregunta, reto, juegos…).
     [diapositivas]  [vista previa + configuración]  [tipo de historia + pausas]

   Historia competitiva («al estilo Capibara, con tu propia historia»): equipos
   (la misma sesión del Modo Capibara), cada pausa suma pasos en la montaña
   hacia la META que el docente define (nombre + imagen en la cima). Una
   diapositiva de «Misión» forma los equipos y muestra la montaña. Al final,
   el equipo con más pasos «resuelve el problema» (desenlace del docente).

   Documento guardado:
     { ..., recurso: 'historia',
       historia: { diapos: [{ id, tipo: 'escena'|'mision', antes?, texto, grito?, imagen?, boton? }],
                   competitiva, meta: { nombre, imagen }, final: { texto, imagen } },
       competencia: { modo: 'capibara', equipos, meta, historia: true } | null,   // solo la competitiva
       activaciones: [{ id, tipo, diapo, texto, ... }] }   // pausa DESPUÉS de esa diapositiva */

const HISTORIA_FINAL_TEXTO = 'Gracias a su inteligencia y su rapidez, {equipo} resolvió el problema.';
const historiaDe = (act) => act.historia || { diapos: [] };
const diapoConContenido = (d) => !!(d && ((d.texto || '').trim() || (d.imagen || '').trim() || (d.antes || '').trim()));
// Texto corto de una diapositiva (miniaturas, mando).
function resumenDiapo(d) {
  const t = ((d && (d.texto || d.antes)) || '').trim().replace(/\s+/g, ' ');
  return t.length > 60 ? t.slice(0, 57) + '…' : t;
}

/* Una diapositiva tal como se ve al presentar. `animar`: las palabras aparecen
   una a una (en el editor, quieta). `onListos`: el botón de la misión.
   Mide con unidades del contenedor (cqw/cqh): sirve igual en el editor y en Presentar. */
function DiapoHistoria({ d, animar, onListos, competitiva }) {
  if (!d) return null;
  const img = (d.imagen || '').trim() ? urlImagen(d.imagen) : '';
  const texto = (d.texto || '').trim();
  const antes = (d.antes || '').trim();
  const mision = d.tipo === 'mision' && competitiva;
  const palabras = (t, retraso, paso) => (animar
    ? String(t).split(' ').map((p, i) => (
        <span key={i} className="vg-hs-palabra" style={{ animationDelay: (retraso + i * (paso || 0.1)).toFixed(2) + 's' }}>{p}{' '}</span>))
    : t);
  const retrasoTexto = antes ? 1.2 : 0.3;
  const cuerpo = (
    <React.Fragment>
      {antes && <p className="vg-hs-antes">{palabras(antes, 0.2, 0.22)}</p>}
      {texto && (d.grito
        ? <p className="vg-hs-frase"><span className={'vg-hs-grito' + (animar ? ' animar' : '')} style={{ animationDelay: retrasoTexto + 's' }}>{texto}</span></p>
        : <p className="vg-hs-frase">{palabras(texto, retrasoTexto)}</p>)}
      {mision && (
        <button type="button" className="vg-hs-listos" onClick={(e) => { e.stopPropagation(); if (onListos) onListos(); }}>
          🏆 {(d.boton || '').trim() || '¿Listos para la misión?'}
        </button>
      )}
    </React.Fragment>
  );
  return (
    <div className={'vg-hs-diapo' + (img ? ' con-imagen' : ' solo-texto') + (mision ? ' mision' : '') + (d.grito ? ' con-grito' : '') + (animar ? ' animar' : '')}>
      {img ? (
        <React.Fragment>
          <div className="vg-hs-fondo" style={{ backgroundImage: 'url(' + JSON.stringify(img) + ')' }}></div>
          <img className="vg-hs-img vg-proyectado-doc" src={img} alt="" draggable="false" referrerPolicy="no-referrer" />
          <div className="vg-hs-vineta" aria-hidden="true"></div>
          {(texto || antes || mision) && <div className="vg-hs-caja vg-proyectado-doc">{cuerpo}</div>}
        </React.Fragment>
      ) : (
        <div className="vg-hs-hoja">
          <div className="vg-hs-caja grande">{texto || antes || mision ? cuerpo : <p className="vg-hs-antes">Diapositiva vacía</p>}</div>
        </div>
      )}
    </div>
  );
}

function VigiaEditorHistoria({ act, onChange, onBack, onPresent }) {
  const { TIPOS, tipo, nuevaActivacion } = VigiaTipos;
  const h = historiaDe(act);
  const diapos = h.diapos || [];
  const competitiva = !!(h.competitiva && act.competencia);
  const lista = act.activaciones || [];
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [diapoId, setDiapoId] = React.useState(diapos[0] ? diapos[0].id : null);
  const [selId, setSelId] = React.useState(null);   // pausa seleccionada
  const [verFinal, setVerFinal] = React.useState(false);   // configurar la meta y el desenlace
  const [estOpen, setEstOpen] = React.useState(false);

  const diapo = diapos.find((d) => d.id === diapoId) || diapos[0] || null;
  const pausas = lista.filter((a) => diapo && a.diapo === diapo.id);
  const sel = lista.find((a) => a.id === selId) || null;

  const update = (patch) => onChange({ ...act, ...patch });
  const setHistoria = (patch) => update({ historia: { ...h, ...patch } });
  const setDiapos = (arr) => setHistoria({ diapos: arr });
  const cambiarDiapo = (d) => setDiapos(diapos.map((x) => (x.id === d.id ? d : x)));
  const cambiar = (a) => update({ activaciones: lista.map((x) => (x.id === a.id ? a : x)) });

  // --- Diapositivas ---
  const agregarDiapo = (tipoD) => {
    const d = tipoD === 'mision'
      ? { id: AIP.uid(), tipo: 'mision', texto: 'Tu misión: resolver el problema con tu inteligencia y rapidez.', imagen: '', boton: '¿Listos para la misión?' }
      : { id: AIP.uid(), tipo: 'escena', antes: '', texto: '', imagen: '' };
    // Se agrega después de la diapositiva elegida.
    const k = diapo ? diapos.findIndex((x) => x.id === diapo.id) + 1 : diapos.length;
    const arr = diapos.slice(); arr.splice(k, 0, d);
    setDiapos(arr);
    setDiapoId(d.id); setSelId(null); setVerFinal(false);
  };
  const moverDiapo = (id, dir) => {
    const i = diapos.findIndex((x) => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= diapos.length) return;
    const arr = diapos.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
    setDiapos(arr);
  };
  const borrarDiapo = async (id) => {
    const n = lista.filter((a) => a.diapo === id).length;
    if (!await vigiaConfirmar('¿Quitar esta diapositiva' + (n ? ' y sus ' + n + (n === 1 ? ' pausa' : ' pausas') : '') + '?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    onChange({ ...act, historia: { ...h, diapos: diapos.filter((x) => x.id !== id) }, activaciones: lista.filter((a) => a.diapo !== id) });
    if (diapoId === id) { const resto = diapos.filter((x) => x.id !== id); setDiapoId(resto[0] ? resto[0].id : null); }
    setSelId(null);
  };

  // --- Pausas (activaciones después de la diapositiva) ---
  const agregar = (tipoId) => {
    if (!diapo) return;
    const a = nuevaActivacion(tipoId, { diapo: diapo.id });
    // En la competitiva, los juegos con equipos usan el número de la competencia.
    if (competitiva && typeof a.equipos === 'number') a.equipos = act.competencia.equipos || 3;
    if (competitiva && typeof a.metaCapibara === 'number') a.metaCapibara = act.competencia.meta || VigiaTipos.META_CAPIBARA;
    update({ activaciones: [...lista, a] });
    setSelId(a.id); setVerFinal(false);
  };
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar esta pausa?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    update({ activaciones: lista.filter((x) => x.id !== id) });
    if (selId === id) setSelId(null);
  };
  const moverPausa = (id, dir) => {
    const mias = pausas.map((a) => a.id);
    const i = mias.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= mias.length) return;
    const ia = lista.findIndex((a) => a.id === mias[i]), ja = lista.findIndex((a) => a.id === mias[j]);
    const arr = lista.slice(); [arr[ia], arr[ja]] = [arr[ja], arr[ia]];
    update({ activaciones: arr });
  };

  // --- Historia competitiva (misma sesión de equipos del Modo Capibara) ---
  const primero = VigiaTipos.primerJaguar(lista);
  const equipos = Math.max(2, Math.min(VigiaTipos.MAX_EQUIPOS_JAGUAR, (primero && primero.equipos) || (act.competencia && act.competencia.equipos) || 3));
  const meta = Math.max(3, Math.min(30, (act.competencia && act.competencia.meta) || VigiaTipos.META_CAPIBARA));
  const fijarCompetitiva = async (on) => {
    if (on === competitiva) return;
    if (on) {
      const jaguar = lista.filter((x) => /^jg-/.test(x.tipo || '')).length;
      if (jaguar && !await vigiaConfirmar('Esta historia tiene ' + jaguar + (jaguar === 1 ? ' desafío' : ' desafíos') + ' del Modo Jaguar. Se conservan, pero la competencia usa los pasos en la montaña.',
        { titulo: 'Historia competitiva', aceptar: 'Sí, hacerla competitiva' })) return;
      const conMision = diapos.some((d) => d.tipo === 'mision');
      const mision = { id: AIP.uid(), tipo: 'mision', texto: 'Tu misión: resolver el problema con tu inteligencia y rapidez.', imagen: '', boton: '¿Listos para la misión?' };
      update({
        historia: { ...h, competitiva: true, diapos: conMision ? diapos : [...diapos, mision], meta: h.meta || { nombre: '', imagen: '' }, final: h.final || { texto: HISTORIA_FINAL_TEXTO, imagen: '' } },
        competencia: { modo: 'capibara', equipos, meta, historia: true },
      });
      if (!conMision) { setDiapoId(mision.id); setSelId(null); setVerFinal(false); }
    } else {
      if (!await vigiaConfirmar('Las pausas ya no sumarán pasos y no habrá equipos ni montaña (lo que escribiste de la meta y el desenlace se conserva).',
        { titulo: '¿Volver a historia normal?', aceptar: 'Sí, historia normal' })) return;
      update({ historia: { ...h, competitiva: false }, competencia: null });
      setVerFinal(false);
    }
  };
  const fijarEquipos = (n) => {
    const v = Math.max(2, Math.min(VigiaTipos.MAX_EQUIPOS_JAGUAR, n));
    update({
      competencia: { ...act.competencia, equipos: v },
      activaciones: lista.map((x) => (typeof x.equipos === 'number' && /^(jg|cp)-/.test(x.tipo || '') ? { ...x, equipos: v } : x)),
    });
  };
  const fijarMeta = (m) => {
    const v = Math.max(3, Math.min(30, m));
    update({
      competencia: { ...act.competencia, meta: v },
      activaciones: lista.map((x) => (typeof x.metaCapibara === 'number' ? { ...x, metaCapibara: v } : x)),
    });
  };

  // Tipos: en la competitiva no aparecen el Modo Jaguar ni la historia de Jomu (la historia es la tuya).
  const tipos = TIPOS.filter((t) => !competitiva || (t.grupo !== 'jaguar' && t.id !== 'cp-historia'));
  const cuenta = (id) => lista.filter((a) => a.diapo === id).length;
  const idx = diapo ? diapos.indexOf(diapo) : -1;

  return (
    <div className="editor-shell vigia vg-editor vg-editor-historia" data-screen-label="Modo Vigía · Editor de historia">
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la historia"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo aprenda con esta historia?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />
        <button className="btn vigia-btn-crear" onClick={onPresent} disabled={!VigiaTipos.recursoListo(act)}
          title={VigiaTipos.recursoListo(act) ? 'Contar la historia con sus pausas' : 'Primero escribe una diapositiva'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      <div className="editor-body">
        {/* ---- columna 1: diapositivas ---- */}
        <div className="editor-list">
          <div className="kicker" style={{ padding: '2px 4px' }}>Diapositivas · {diapos.length}</div>
          {diapos.map((d, i) => {
            const img = (d.imagen || '').trim() ? urlImagen(d.imagen) : '';
            const esMision = d.tipo === 'mision';
            return (
              <button key={d.id} className={'slide-thumb vg-thumb vg-diapo-thumb vg-hs-thumb' + (diapo && d.id === diapo.id && !verFinal ? ' active' : '') + (esMision ? ' mision' : '')}
                onClick={() => { setDiapoId(d.id); setSelId(null); setVerFinal(false); }}>
                <span className="vg-diapo-num">{i + 1}</span>
                {img ? <MiniImagen src={img} vacia="Sin imagen" />
                  : <span className="vg-hs-thumb-texto">{resumenDiapo(d) || 'Sin texto'}</span>}
                <span className="vg-diapo-pie">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {esMision ? (competitiva ? '🏆 Misión' : 'Misión (solo en la competitiva)') : resumenDiapo(d) || 'Diapositiva ' + (i + 1)}
                  </span>
                  <span className="vg-diapo-cuenta" title="Pausas después de esta diapositiva">⏸ {cuenta(d.id)}</span>
                </span>
                <span className="thumb-actions">
                  {i > 0 && <span className="thumb-action" role="button" title="Subir" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, -1); }}>▲</span>}
                  {i < diapos.length - 1 && <span className="thumb-action" role="button" title="Bajar" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, 1); }}>▼</span>}
                  <span className="thumb-action" role="button" title="Quitar" onClick={(e) => { e.stopPropagation(); borrarDiapo(d.id); }}>✕</span>
                </span>
              </button>
            );
          })}
          {competitiva && (
            <button className={'slide-thumb vg-thumb vg-hs-thumb vg-hs-thumb-final' + (verFinal ? ' active' : '')}
              onClick={() => { setVerFinal(true); setSelId(null); }}>
              <span className="vg-hs-thumb-texto">🏁 La meta y el desenlace</span>
              <span className="vg-diapo-pie"><span>Quién resuelve el problema</span></span>
            </button>
          )}
          <div className="vg-hs-agregar">
            <button className="btn btn-sm vigia-btn-crear" onClick={() => agregarDiapo('escena')}>+ Diapositiva</button>
            {competitiva && <button className="btn btn-sm" onClick={() => agregarDiapo('mision')} title="Aquí se forman los equipos y se ve la montaña">+ Misión</button>}
          </div>
        </div>

        {/* ---- columna 2: vista previa + configuración ---- */}
        <div className="editor-canvas-col">
          {verFinal && competitiva ? (
            <ConfigFinalHistoria h={h} setHistoria={setHistoria} />
          ) : !diapo ? (
            <div className="vg-lienzo-marco vg-lienzo-vacio">
              <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
              <strong>Empieza tu historia</strong>
              <span>Crea tu primera diapositiva con «+ Diapositiva»: escribe lo que quieres contar y, si quieres, agrega una imagen. Luego pon pausas con los tipos de la derecha.</span>
              <button className="btn vigia-btn-crear" onClick={() => agregarDiapo('escena')}>+ Primera diapositiva</button>
            </div>
          ) : (
            <React.Fragment>
              <div className="vg-hs-marco">
                <DiapoHistoria d={diapo} competitiva={competitiva || diapo.tipo === 'mision'} />
              </div>
              <PausasDiapo pausas={pausas} selId={selId} onElegir={(id) => setSelId(id === selId ? null : id)} onMover={moverPausa} />
              {sel ? (
                <div className="config-card vg-config" style={{ borderColor: tipo(sel.tipo).color + '66' }}>
                  <button type="button" className="vg-btn-texto" onClick={() => setSelId(null)} style={{ alignSelf: 'flex-start' }}>← Volver a la diapositiva {idx + 1}</button>
                  <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)} conTiempo={false} compacto sinFragmento
                    hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
                </div>
              ) : (
                <ConfigDiapoHistoria d={diapo} n={idx + 1} competitiva={competitiva} onCambiar={cambiarDiapo} onBorrar={() => borrarDiapo(diapo.id)} />
              )}
            </React.Fragment>
          )}
        </div>

        {/* ---- columna 3: tipo de historia + pausas ---- */}
        <div className="editor-tools">
          <div className={'vg-hs-modo' + (competitiva ? ' on' : '')}>
            <div className="vg-segmento vg-hs-segmento" role="radiogroup" aria-label="Tipo de historia">
              <button role="radio" aria-checked={!competitiva} className={!competitiva ? 'on' : ''} onClick={() => fijarCompetitiva(false)}>📖 Historia</button>
              <button role="radio" aria-checked={competitiva} className={competitiva ? 'on' : ''} onClick={() => fijarCompetitiva(true)}>🏆 Competitiva</button>
            </div>
            {!competitiva ? (
              <p className="vg-competencia-nota">Cuenta tu historia y detenla con pausas. ¿Quieres equipos? Elige «Competitiva»: los equipos suben una montaña hacia tu meta y el que gane resuelve el problema.</p>
            ) : (
              <React.Fragment>
                <div className="vg-competencia-fila">
                  <span>Equipos</span>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarEquipos(equipos - 1)} disabled={equipos <= 2} aria-label="Menos equipos">−</button>
                  <b>{equipos}</b>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarEquipos(equipos + 1)} disabled={equipos >= VigiaTipos.MAX_EQUIPOS_JAGUAR} aria-label="Más equipos">+</button>
                </div>
                <div className="vg-competencia-fila">
                  <span>Pasos hasta la meta</span>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarMeta(meta - 1)} disabled={meta <= 3} aria-label="Menos pasos">−</button>
                  <b>{meta}</b>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarMeta(meta + 1)} disabled={meta >= 30} aria-label="Más pasos">+</button>
                </div>
                <p className="vg-competencia-nota">
                  En la diapositiva de <b>Misión</b> se forman los equipos y se ve la montaña. Cada pausa suma 1 paso al equipo que gane
                  (los juegos del Modo Capibara suman los suyos). Al final, el equipo con más pasos resuelve el problema.
                </p>
                <button type="button" className="vg-mini-accion" onClick={() => { setVerFinal(true); setSelId(null); }}>🏁 Meta y desenlace</button>
              </React.Fragment>
            )}
          </div>
          <div>
            <div className="kicker">Agregar una</div>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Pausa</h3>
            <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
              {diapo ? <React.Fragment>Aparece al terminar la <strong style={{ color: 'var(--ink)' }}>diapositiva {idx + 1}</strong>.</React.Fragment> : 'Primero crea una diapositiva.'}
            </p>
          </div>
          <TiposAgrupados lista={tipos} render={(t) => {
            const habilitado = !!diapo;
            return (
              <button key={t.id} className={'tool-card vg-tipo' + (habilitado ? '' : ' tool-soon')} disabled={!habilitado}
                onClick={() => habilitado && agregar(t.id)}
                title={!diapo ? 'Primero crea una diapositiva' : 'Pausa después de la diapositiva ' + (idx + 1) + ': ' + t.nombre}>
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
    </div>
  );
}

/* Pausas de la diapositiva (en orden; se ven una tras otra al terminarla). */
function PausasDiapo({ pausas, selId, onElegir, onMover }) {
  if (!pausas.length) {
    return <div className="vg-hs-pausas vacia">Sin pausas: al avanzar, pasa directo a la siguiente diapositiva. Agrega una con los tipos de la derecha.</div>;
  }
  return (
    <div className="vg-hs-pausas">
      <span className="vg-hs-pausas-titulo">⏸ Pausas al terminar esta diapositiva</span>
      {pausas.map((a, i) => {
        const ti = VigiaTipos.tipo(a.tipo);
        const txt = vistazoDe(a);
        return (
          <span key={a.id} className={'vg-hs-pausa' + (a.id === selId ? ' sel' : '')} style={{ '--tipo': ti.color }}>
            <button type="button" className="vg-hs-pausa-btn" onClick={() => onElegir(a.id)} title={'Editar: ' + ti.nombre}>
              <span className="vg-hs-pausa-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={13} /></span>
              <b>{i + 1}.</b> {ti.nombre}{txt ? <small>{txt}</small> : null}
            </button>
            {pausas.length > 1 && (
              <span className="vg-hs-pausa-mover">
                <button type="button" onClick={() => onMover(a.id, -1)} disabled={i === 0} aria-label="Antes">‹</button>
                <button type="button" onClick={() => onMover(a.id, 1)} disabled={i === pausas.length - 1} aria-label="Después">›</button>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* Datos de una diapositiva: texto previo, texto, grito, imagen y (misión) el botón. */
function ConfigDiapoHistoria({ d, n, competitiva, onCambiar, onBorrar }) {
  const set = (patch) => onCambiar({ ...d, ...patch });
  const mision = d.tipo === 'mision';
  return (
    <div className="config-card vg-hs-config">
      <div className="vg-img-cabeza">
        <strong>{mision ? '🏆 Misión' : 'Diapositiva ' + n}</strong>
        <span className="vg-img-nota">{mision ? (competitiva ? 'aquí se forman los equipos y se ve la montaña' : 'solo se usa en la historia competitiva') : 'el texto aparece palabra por palabra'}</span>
        <span style={{ flex: 1 }}></span>
        <button type="button" className="vg-mini-accion" onClick={onBorrar}>Quitar</button>
      </div>
      {!mision && (
        <div className="field">
          <label>Texto previo (opcional, más pequeño)</label>
          <input type="text" value={d.antes || ''} maxLength={120} placeholder="Ej.: Horas después…" onChange={(e) => set({ antes: e.target.value })} />
        </div>
      )}
      <div className="field">
        <label>{mision ? 'La misión (el problema que deben resolver)' : 'Lo que cuentas'}</label>
        <textarea rows={3} value={d.texto || ''} maxLength={400}
          placeholder={mision ? 'Tu misión: encontrar el tesoro antes de que llegue la tormenta.' : 'Había una vez, en un pueblo junto al río…'}
          onChange={(e) => set({ texto: e.target.value })} />
      </div>
      {mision ? (
        <div className="field">
          <label>Texto del botón</label>
          <input type="text" value={d.boton || ''} maxLength={60} placeholder="¿Listos para la misión?" onChange={(e) => set({ boton: e.target.value })} />
        </div>
      ) : (
        <label className="vg-hs-check">
          <input type="checkbox" checked={!!d.grito} onChange={(e) => set({ grito: e.target.checked })} />
          <span><b>¡Grito!</b> El texto aparece de golpe, grande y temblando (para frases cortas: «¡Corre!»).</span>
        </label>
      )}
      <div className="field">
        <label>Imagen (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
        <CampoUrlImagen valor={d.imagen || ''} onCambiar={(url) => set({ imagen: url })} placeholder="Pega la URL de una imagen" />
        {d.imagen && <button type="button" className="vg-btn-texto" onClick={() => set({ imagen: '' })}>Quitar la imagen</button>}
      </div>
    </div>
  );
}

/* La meta (lo que hay en la cima de la montaña) y el desenlace (el equipo ganador resuelve el problema). */
function ConfigFinalHistoria({ h, setHistoria }) {
  const m = h.meta || { nombre: '', imagen: '' };
  const f = h.final || { texto: HISTORIA_FINAL_TEXTO, imagen: '' };
  const setM = (patch) => setHistoria({ meta: { ...m, ...patch } });
  const setF = (patch) => setHistoria({ final: { ...f, ...patch } });
  const ejemplo = { id: 'final', tipo: 'escena', antes: '🏆 ¡Problema resuelto!', texto: (f.texto || HISTORIA_FINAL_TEXTO).replace(/\{equipo\}/g, 'el Equipo Verde'), imagen: f.imagen || m.imagen || '' };
  return (
    <React.Fragment>
      <div className="vg-hs-marco"><DiapoHistoria d={ejemplo} /></div>
      <div className="config-card vg-hs-config">
        <div className="vg-img-cabeza"><strong>🏔 La meta</strong><span className="vg-img-nota">lo que hay en la cima de la montaña</span></div>
        <div className="field">
          <label>¿Hacia dónde van los equipos?</label>
          <input type="text" value={m.nombre || ''} maxLength={40} placeholder="el tesoro perdido" onChange={(e) => setM({ nombre: e.target.value })} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>Se lee «El camino hacia <b>{(m.nombre || '').trim() || 'la meta'}</b>».</div>
        </div>
        <div className="field">
          <label>Imagen de la meta (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
          <CampoUrlImagen valor={m.imagen || ''} onCambiar={(url) => setM({ imagen: url })} placeholder="URL de la imagen en la cima" />
        </div>
      </div>
      <div className="config-card vg-hs-config">
        <div className="vg-img-cabeza"><strong>🏁 El desenlace</strong><span className="vg-img-nota">el equipo ganador resuelve el problema</span></div>
        <div className="field">
          <label>¿Cómo termina la historia?</label>
          <textarea rows={3} value={f.texto || ''} maxLength={400} placeholder={HISTORIA_FINAL_TEXTO} onChange={(e) => setF({ texto: e.target.value })} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>Escribe <b>{'{equipo}'}</b> donde va el nombre del equipo ganador.</div>
        </div>
        <div className="field">
          <label>Imagen del final (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
          <CampoUrlImagen valor={f.imagen || ''} onCambiar={(url) => setF({ imagen: url })} placeholder="URL de la imagen del final" />
        </div>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, {
  VigiaEditorHistoria, DiapoHistoria, PausasDiapo, ConfigDiapoHistoria, ConfigFinalHistoria,
  diapoConContenido, resumenDiapo, historiaDe, HISTORIA_FINAL_TEXTO,
});
