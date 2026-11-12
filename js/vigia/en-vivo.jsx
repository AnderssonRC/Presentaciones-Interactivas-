/* en-vivo.jsx — Activaciones EN VIVO (Modo Vigía, durante Presentar).
   Mientras se proyecta, el docente crea una activación (pregunta, instrucción,
   creación, escritura, nota de contexto o reto) desde el televisor o desde el
   celular, y la lanza al instante o la deja lista para lanzarla después.
   Se guardan en la presentación: act.enVivo = [{ id, tipo, texto, … , enVivo: true }]
   (no son estudiantes ni puntos: solo el contenido de la activación).
     · <ActivacionesEnVivo act onChange />: botón «⚡ En vivo» (arriba a la
       derecha, bajo el chip del mando), panel con la lista y el formulario, y
       la tarjeta encima de lo que se esté proyectando. Lo monta VigiaPresentar.
     · useEnVivoPausa(reproduciendo, pausar, reproducir): video y podcast se
       detienen mientras la tarjeta está en pantalla y siguen al cerrarla.
   Mando: estado `extra.enVivo` = { panel, activa, lista, tipos, retos, hayEstudiantes };
   órdenes `vivo-panel`, `vivo-crear` { datos, lanzar }, `vivo-lanzar` { id },
   `vivo-borrar` { id }, `vivo-cerrar`. */

const TIPOS_VIVO = ['pregunta', 'instruccion', 'creacion', 'escritura', 'contexto', 'reto'];

// ¿Hay una activación en vivo en pantalla? (para que video y podcast se detengan)
const vivoEstado = { abierta: false, oyentes: new Set() };
function fijarVivoAbierta(v) {
  if (vivoEstado.abierta === v) return;
  vivoEstado.abierta = v;
  vivoEstado.oyentes.forEach((f) => f(v));
}
function useEnVivoAbierta() {
  const [v, setV] = React.useState(vivoEstado.abierta);
  React.useEffect(() => {
    vivoEstado.oyentes.add(setV); setV(vivoEstado.abierta);
    return () => { vivoEstado.oyentes.delete(setV); };
  }, []);
  return v;
}
function useEnVivoPausa(reproduciendo, pausar, reproducir) {
  const abierta = useEnVivoAbierta();
  const antes = React.useRef(abierta);
  const sonaba = React.useRef(false);
  React.useEffect(() => {
    if (abierta && !antes.current) sonaba.current = !!reproduciendo;
    if (!abierta && antes.current && sonaba.current) { sonaba.current = false; reproducir(); }
    antes.current = abierta;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta]);
  React.useEffect(() => {
    if (abierta && reproduciendo) pausar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierta, reproduciendo]);
}

// Lo que llega del formulario (pantalla o celular) -> activación lista para mostrar.
function nuevaEnVivo(d) {
  d = d || {};
  const ti = VigiaTipos.tipo(TIPOS_VIVO.includes(d.tipo) ? d.tipo : 'pregunta');
  const a = VigiaTipos.nuevaActivacion(ti.id, 0);
  delete a.t;
  a.texto = String(d.texto || '').slice(0, 1500);
  if (ti.ruleta) a.ruleta = !!d.ruleta;
  if (ti.id === 'pregunta') {
    const ops = (Array.isArray(d.opciones) ? d.opciones : []).map((o, i) => [String(o || '').slice(0, 300), i]).filter(([o]) => o.trim()).slice(0, 6);
    if (d.modo === 'cerrada' && ops.length >= 2) {
      a.modo = 'cerrada';
      a.opciones = ops.map(([o]) => o);
      a.correcta = Math.max(0, ops.findIndex(([, i]) => i === d.correcta));
    }
  }
  if (ti.id === 'reto') a.reto = VigiaTipos.reto(d.reto).id;
  a.enVivo = true;
  return a;
}
function vivoValida(d) { return !!d && (d.tipo === 'reto' || String(d.texto || '').trim().length > 0); }

function ActivacionesEnVivo({ act, onChange }) {
  const lista = act.enVivo || [];
  const [panel, setPanel] = React.useState(false);
  const [creando, setCreando] = React.useState(false);
  const [activa, setActiva] = React.useState(null);
  const [frase, setFrase] = React.useState('¡Alto!');
  const [vistos, setVistos] = React.useState([]);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono] = useTonoPresentar();
  const hayEstudiantes = (act.estudiantes || []).some((s) => (s || '').trim());

  const guardar = (nueva) => { if (onChange) onChange({ ...act, enVivo: nueva }); };
  const lanzar = (a) => {
    setFrase((f) => VigiaTipos.fraseAlAzar(f));
    setActiva(a);
    setPanel(false); setCreando(false);
    setVistos((v) => (v.includes(a.id) ? v : [...v, a.id]));
  };
  const crear = (datos, ahora) => {
    if (!vivoValida(datos)) return;
    const a = nuevaEnVivo(datos);
    guardar([...lista, a]);
    setCreando(false);
    if (ahora) lanzar(a);
  };
  const borrar = (id) => guardar(lista.filter((x) => x.id !== id));
  const cerrar = () => setActiva(null);

  React.useEffect(() => { fijarVivoAbierta(!!activa); }, [activa]);
  React.useEffect(() => () => fijarVivoAbierta(false), []);

  // Con la tarjeta en pantalla, el teclado es de ella: Espacio/Enter continúan y
  // Esc la cierra (sin salir de Presentar ni reanudar el video por debajo).
  React.useEffect(() => {
    if (!activa) return undefined;
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const esReto = activa.tipo === 'reto';
      if (e.key === 'Escape' || (!esReto && (e.key === ' ' || e.key === 'Enter'))) {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        cerrar();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activa]);

  // Mando: el celular ve la lista, crea, lanza, borra y cierra.
  usePublicarMando('enVivo', {
    panel: panel || creando,
    activa: activa ? itemMando(activa, '', true) : null,
    lista: lista.map((x) => itemMando(x, '', vistos.includes(x.id))),
    tipos: TIPOS_VIVO.map((id) => { const t = VigiaTipos.tipo(id); return { id, nombre: t.nombre, color: t.color, ruleta: !!t.ruleta, ruletaPorDefecto: !!t.ruletaPorDefecto, placeholder: t.placeholder || '', etiqueta: t.etiqueta || '' }; }),
    retos: VigiaTipos.RETOS.map((r) => ({ id: r.id, nombre: r.nombre })),
    hayEstudiantes,
  });
  useOrdenMando((o) => {
    if (o.accion === 'vivo-panel') { if (panel || creando) { setPanel(false); setCreando(false); } else setPanel(true); }
    else if (o.accion === 'vivo-crear') crear(o.datos, !!o.lanzar);
    else if (o.accion === 'vivo-lanzar') { const a = lista.find((x) => x.id === o.id); if (a) lanzar(a); }
    else if (o.accion === 'vivo-borrar') borrar(o.id);
    else if (o.accion === 'vivo-cerrar') cerrar();
  });

  return (
    <div className={'vigia vg-vivo tono-' + tono}>
      {!activa && (
        <button className={'vg-vivo-boton' + (panel ? ' on' : '')} onClick={() => setPanel((v) => !v)}
          title="Crear una activación ahora y lanzarla en vivo">
          ⚡ En vivo{lista.length ? <b>{lista.length}</b> : null}
        </button>
      )}
      {panel && !activa && (
        <div className="vg-vivo-panel" onKeyDown={(e) => e.stopPropagation()} role="dialog" aria-label="Activaciones en vivo">
          <div className="vg-vivo-cabeza">
            <strong>⚡ Activaciones en vivo</strong>
            <button className="vg-vivo-x" onClick={() => { setPanel(false); setCreando(false); }} aria-label="Cerrar">✕</button>
          </div>
          {!creando && (
            <React.Fragment>
              {lista.length === 0 && <div className="vg-vivo-vacio">Crea una activación y lánzala ahora mismo, o déjala lista para cuando la necesites.</div>}
              <div className="vg-vivo-lista">
                {lista.map((x) => {
                  const ti = VigiaTipos.tipo(x.tipo);
                  const texto = x.tipo === 'reto' ? VigiaTipos.reto(x.reto).nombre : x.texto;
                  return (
                    <div key={x.id} className={'vg-vivo-item' + (vistos.includes(x.id) ? ' visto' : '')} style={{ '--c': ti.color }}>
                      <span className="vg-vivo-punto"></span>
                      <span className="vg-vivo-texto"><b>{ti.nombre}{vistos.includes(x.id) ? ' ✓' : ''}</b><small>{cortoMando(texto, 90)}</small></span>
                      <button className="vg-vivo-lanzar" onClick={() => lanzar(x)} title="Lanzar ahora">▶ Lanzar</button>
                      <button className="vg-vivo-borrar" title="Borrar"
                        onClick={() => vigiaConfirmar('Se borrará esta activación en vivo.', { titulo: '¿Borrar?', aceptar: 'Borrar' }).then((ok) => { if (ok) borrar(x.id); })}>✕</button>
                    </div>
                  );
                })}
              </div>
              <button className="vg-btn vg-vivo-nueva" onClick={() => setCreando(true)}>＋ Crear activación</button>
            </React.Fragment>
          )}
          {creando && <FormEnVivo hayEstudiantes={hayEstudiantes} onCrear={crear} onCancelar={() => setCreando(false)} />}
        </div>
      )}
      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado} onContinuar={cerrar} textoContinuar="Volver a la presentación" />
      )}
    </div>
  );
}

/* Formulario corto: tipo, texto (o reto), abierta / opción múltiple, ruleta. */
function FormEnVivo({ hayEstudiantes, onCrear, onCancelar }) {
  const [d, setD] = React.useState({ tipo: 'pregunta', texto: '', modo: 'abierta', opciones: ['', '', '', ''], correcta: 0, ruleta: true, reto: VigiaTipos.RETOS[0].id });
  const cambiar = (c) => setD((x) => ({ ...x, ...c }));
  const ti = VigiaTipos.tipo(d.tipo);
  const elegirTipo = (id) => { const t = VigiaTipos.tipo(id); cambiar({ tipo: id, ruleta: !!t.ruletaPorDefecto }); };
  const ok = vivoValida(d) && !(d.tipo === 'pregunta' && d.modo === 'cerrada' && d.opciones.filter((o) => o.trim()).length < 2);
  return (
    <div className="vg-vivo-form">
      <div className="vg-vivo-tipos">
        {TIPOS_VIVO.map((id) => {
          const t = VigiaTipos.tipo(id);
          return <button key={id} className={'vg-vivo-tipo' + (d.tipo === id ? ' on' : '')} style={{ '--c': t.color }} onClick={() => elegirTipo(id)}>{t.nombre}</button>;
        })}
      </div>
      {d.tipo === 'reto' && (
        <div className="vg-vivo-tipos">
          {VigiaTipos.RETOS.map((r) => (
            <button key={r.id} className={'vg-vivo-tipo' + (d.reto === r.id ? ' on' : '')} style={{ '--c': ti.color }} onClick={() => cambiar({ reto: r.id })}>{r.nombre}</button>
          ))}
        </div>
      )}
      <label className="vg-vivo-etiqueta">{ti.etiqueta}</label>
      <textarea className="vg-vivo-campo" rows={3} autoFocus value={d.texto} placeholder={ti.placeholder}
        onChange={(e) => cambiar({ texto: e.target.value })} />
      {d.tipo === 'pregunta' && (
        <React.Fragment>
          <div className="vg-vivo-tipos">
            <button className={'vg-vivo-tipo' + (d.modo === 'abierta' ? ' on' : '')} style={{ '--c': ti.color }} onClick={() => cambiar({ modo: 'abierta' })}>Abierta</button>
            <button className={'vg-vivo-tipo' + (d.modo === 'cerrada' ? ' on' : '')} style={{ '--c': ti.color }} onClick={() => cambiar({ modo: 'cerrada' })}>Opción múltiple</button>
          </div>
          {d.modo === 'cerrada' && d.opciones.map((o, i) => (
            <div key={i} className="vg-vivo-opcion">
              <button className={'vg-vivo-correcta' + (d.correcta === i ? ' on' : '')} onClick={() => cambiar({ correcta: i })}
                title="Marcar como respuesta correcta">{String.fromCharCode(65 + i)}{d.correcta === i ? ' ✓' : ''}</button>
              <input className="vg-vivo-campo" value={o} placeholder={'Opción ' + String.fromCharCode(65 + i) + (i > 1 ? ' (opcional)' : '')}
                onChange={(e) => { const ops = d.opciones.slice(); ops[i] = e.target.value; cambiar({ opciones: ops }); }} />
            </div>
          ))}
        </React.Fragment>
      )}
      {ti.ruleta && hayEstudiantes && (
        <label className="vg-vivo-check">
          <input type="checkbox" checked={!!d.ruleta} onChange={(e) => cambiar({ ruleta: e.target.checked })} />
          {ti.preguntaRuleta || 'Elegir estudiante al azar'}
        </label>
      )}
      <div className="vg-vivo-acciones">
        <button className="vg-btn vg-btn-sec" onClick={onCancelar}>Cancelar</button>
        <button className="vg-btn vg-btn-sec" disabled={!ok} onClick={() => onCrear(d, false)} title="Queda en la lista para lanzarla cuando quieras">Guardar</button>
        <button className="vg-btn" disabled={!ok} onClick={() => onCrear(d, true)}>⚡ Lanzar ahora</button>
      </div>
    </div>
  );
}

Object.assign(window, { ActivacionesEnVivo, useEnVivoPausa, useEnVivoAbierta, nuevaEnVivo });
