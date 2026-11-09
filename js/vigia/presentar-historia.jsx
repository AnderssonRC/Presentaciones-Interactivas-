/* presentar-historia.jsx — Presentar el Modo Historia (Modo Vigía).
   El docente CUENTA su historia: cada diapositiva (texto palabra por palabra,
   imagen o ambas) a pantalla completa. Al avanzar desde una diapositiva con
   pausas, aparecen sus activaciones una tras otra (tarjeta, reto, juegos…);
   al cerrar la última, sigue la historia.
   Se avanza con clic, Espacio, Enter, → o Av Pág; se vuelve con ← o Re Pág.

   Historia competitiva (act.competencia = { modo: 'capibara', historia: true }):
   misma sesión de equipos del Modo Capibara (VigiaPresentar pone el marcador,
   «Ver equipos» y «Ver la montaña», con la meta del docente en la cima:
   `sesion.cima`). Fases:
     diapo → (misión) grupos «¡Busca tu equipo!» → montana → diapo siguiente …
     → meta (la montaña final) → desenlace: el equipo con más pasos resuelve
     el problema (texto del docente con {equipo}).
   Mando: estado `historia` = { fase, mision, boton, competitiva, pendientes,
   ultima, meta }; órdenes 'comenzar', 'siguiente', 'anterior', 'abrir',
   'continuar', 'hs-listos', 'hs-resortear', 'hs-inicio', 'salir'. */

function VigiaPresentarHistoria({ act, onExit, onChange }) {
  const { fraseAlAzar } = VigiaTipos;
  const h = act.historia || {};
  const diapos = (h.diapos || []).filter(diapoConContenido);
  const competitiva = !!(h.competitiva && act.competencia);
  const lista = act.activaciones || [];
  const nombres = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const raiz = React.useRef(null);
  const sesion = useJaguarEstado();

  // portada | diapo | grupos | montana | meta | desenlace | fin
  const [fase, setFase] = React.useState('portada');
  const [i, setI] = React.useState(0);
  const [dir, setDir] = React.useState(1);
  const [activa, setActiva] = React.useState(null);
  const [frase, setFrase] = React.useState('¡Alto!');
  const [vistos, setVistos] = React.useState([]);
  const vistosRef = React.useRef([]);
  const [misionHecha, setMisionHecha] = React.useState(false);
  const [usados, marcarUsado] = useUsadosRuleta(act.estudiantes);
  const [tono, setTono] = useTonoPresentar();
  usePantallaCompleta(onExit);

  const diapo = diapos[Math.min(i, diapos.length - 1)] || null;
  const pausasDe = (d) => (d ? lista.filter((a) => a.diapo === d.id) : []);
  const pendientes = pausasDe(diapo).filter((a) => !vistos.includes(a.id));
  const esMision = (d) => competitiva && d && d.tipo === 'mision';
  const misionPendiente = fase === 'diapo' && esMision(diapo) && !misionHecha;
  const nombreMeta = ((h.meta && h.meta.nombre) || '').trim() || 'la meta';

  // --- Equipos (solo competitiva): se reparten al empezar, se muestran en la misión ---
  const asegurarEquipos = () => {
    if (!competitiva || jaguarSesion().equipos) return;
    cambiarJaguar(() => ({ equipos: jaguarRepartir(nombres, jaguarSesion().n || 2) }));
  };
  const iniciarEquipos = (mostrar) => {
    if (!competitiva) return;
    asegurarEquipos();
    if (!jaguarSesion().iniciado) { jaguarIniciar(); if (mostrar) jaguarVerGrupos(true); }
  };

  const enfocar = () => { if (raiz.current) raiz.current.focus(); };
  const ir = (j) => { setDir(j >= i ? 1 : -1); setI(j); setFase('diapo'); };
  const abrirPausa = (a) => {
    // Sin misión (o antes de ella): los equipos se forman en la primera pausa.
    if (competitiva && !jaguarSesion().iniciado) iniciarEquipos(true);
    vistosRef.current = vistosRef.current.includes(a.id) ? vistosRef.current : [...vistosRef.current, a.id];
    setVistos(vistosRef.current);
    setFrase((f) => fraseAlAzar(f));
    setActiva(a);
  };
  // Lo que sigue después de la diapositiva k: su próxima pausa, la siguiente diapositiva o el final.
  const seguirDesde = (k) => {
    const d = diapos[k];
    const p = pausasDe(d).find((a) => !vistosRef.current.includes(a.id));
    if (p) { abrirPausa(p); return; }
    if (k < diapos.length - 1) ir(k + 1);
    else setFase(competitiva ? 'meta' : 'fin');
  };
  const listos = () => { iniciarEquipos(false); jaguarVerGrupos(false); setFase('grupos'); };
  const avanzar = () => {
    if (activa) return;
    if (fase === 'portada') { asegurarEquipos(); if (diapos.length) ir(0); }
    else if (fase === 'diapo') { if (misionPendiente) listos(); else seguirDesde(i); }
    else if (fase === 'grupos') setFase('montana');
    else if (fase === 'montana') { setMisionHecha(true); setFase('diapo'); seguirDesde(i); }
    else if (fase === 'meta') setFase('desenlace');
  };
  const atras = () => {
    if (activa) return;
    if (fase === 'diapo') { if (i > 0) ir(i - 1); }
    else if (fase === 'grupos') setFase('diapo');
    else if (fase === 'montana') setFase('grupos');
    else if (fase === 'meta' || fase === 'fin') ir(diapos.length - 1);
    else if (fase === 'desenlace') setFase('meta');
  };
  const desdeInicio = () => { setActiva(null); ir(0); };
  // Al cerrar una pausa, la historia sigue sola (otra pausa o la siguiente diapositiva).
  const cerrar = () => { setActiva(null); enfocar(); seguirDesde(i); };
  const resortear = () => { if (nombres.length) jaguarRehacer(nombres); };

  // Glosario: la definición escrita en vivo se guarda.
  const cambiarActivacion = (a) => {
    if (onChange) onChange({ ...act, activaciones: lista.map((x) => (x.id === a.id ? a : x)) });
    if (activa && activa.id === a.id) setActiva(a);
  };

  // --- Teclado ---
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (activa) {
        if (esEscena(activa)) return;   // las escenas tienen sus propias teclas
        if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cerrar(); }
        return;
      }
      if (e.key === 'Escape') onExit();
      else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight' || e.key === 'PageDown') { e.preventDefault(); avanzar(); }
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); atras(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // --- Mando a distancia (los mismos botones de la pantalla) ---
  const abrirDesdeMando = (id) => {
    const a = lista.find((x) => x.id === id);
    const k = a ? diapos.findIndex((d) => d.id === a.diapo) : -1;
    if (k < 0 || activa) return;
    if (k !== i || fase !== 'diapo') { setDir(1); setI(k); setFase('diapo'); }
    abrirPausa(a);
  };
  const enOrden = diapos.flatMap((d, k) => pausasDe(d).map((a) => itemMando(a, 'Diapositiva ' + (k + 1), vistos.includes(a.id))));
  const mando = useMandoVigia({
    recurso: 'historia', titulo: act.titulo || '', empezado: fase !== 'portada',
    diapo: i + 1, total: diapos.length, diapoTitulo: resumenDiapo(diapo),
    activa: activa ? { id: activa.id, tipo: activa.tipo } : null, lista: enOrden,
    historia: {
      fase, competitiva, mision: misionPendiente, boton: misionPendiente ? ((diapo.boton || '').trim() || '¿Listos para la misión?') : '',
      pendientes: fase === 'diapo' ? pendientes.length : 0, ultima: i >= diapos.length - 1, meta: nombreMeta,
    },
  }, (accion, o) => {
    const abierta = activa && !esEscena(activa);
    if (accion === 'comenzar') { if (fase === 'portada') avanzar(); }
    else if (accion === 'siguiente') { if (abierta) cerrar(); else avanzar(); }
    else if (accion === 'anterior') atras();
    else if (accion === 'abrir') abrirDesdeMando(o.id);
    else if (accion === 'continuar') { if (abierta) cerrar(); }
    else if (accion === 'alternar') { if (abierta) cerrar(); else avanzar(); }
    else if (accion === 'hs-listos') { if (misionPendiente) listos(); }
    else if (accion === 'hs-resortear') { if (fase === 'grupos') resortear(); }
    else if (accion === 'hs-inicio') desdeInicio();
    else if (accion === 'salir') onExit();
  });

  // --- Lo que se ve ---
  let escena = null;
  if (fase === 'diapo' && diapo) {
    escena = (
      <div key={diapo.id} className={'vg-hs-escenario vg-diapo ' + (dir > 0 ? 'desde-derecha' : 'desde-izquierda')}
        onClick={() => { if (!activa && !misionPendiente) avanzar(); }}>
        <DiapoHistoria d={diapo} animar competitiva={competitiva} onListos={listos} />
      </div>
    );
  } else if (fase === 'grupos') {
    const eq = equiposCapibara(sesion.equipos || []);
    escena = (
      <div className="vg-cp fase-grupos" role="dialog" aria-label="¡Busca tu equipo!">
        <div className="vg-cp-grupos">
          <LucesCapibara n={10} />
          <div className="vg-cp-grupos-caja">
            <div className="vg-cp-kicker">🏆 Historia competitiva · {eq.length} equipos</div>
            <h1 className="vg-cp-titulo">¡Busca tu equipo!</h1>
            <div className="vg-cp-grupos-lista">
              <ListaGruposJaguar equipos={eq.map((e) => ({ ...e, nombre: e.emoji + ' ' + e.nombre }))} />
            </div>
          </div>
          <div className="vg-cp-acciones">
            {nombres.length > 0 && <button type="button" className="vg-cp-btn suave" onClick={resortear} title="Repartir de nuevo a los estudiantes (al azar)">🔀 Volver a sortear</button>}
            <button type="button" className="vg-cp-btn" onClick={avanzar}>Ver el camino hacia {nombreMeta} ›</button>
          </div>
        </div>
      </div>
    );
  } else if (fase === 'montana' || fase === 'meta') {
    escena = (
      <div className="vg-cp fase-montana" role="dialog" aria-label={'El camino hacia ' + nombreMeta}>
        <div className="vg-cp-escena-montana">
          <MontanaCapibara key={fase} equipos={sesion.equipos || []} meta={sesion.meta} />
          <div className="vg-cp-acciones sobre">
            <button type="button" className="vg-cp-btn" onClick={avanzar}>{fase === 'montana' ? '🏆 ¡A la aventura!' : '🏁 ¿Quién resolvió el problema?'}</button>
          </div>
        </div>
      </div>
    );
  } else if (fase === 'desenlace') {
    escena = <DesenlaceHistoria h={h} equipos={sesion.equipos || []} onVolver={() => ir(diapos.length - 1)} onInicio={desdeInicio} onSalir={onExit} />;
  } else if (fase === 'fin') {
    escena = (
      <div className="vg-hs-fin">
        <div className="vg-hs-fin-caja">
          <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Modo Historia</div>
          <h1>Fin</h1>
          {act.titulo && <p>{act.titulo}</p>}
          <div className="vg-hs-fin-botones">
            <button className="vg-btn vg-btn-sec" onClick={desdeInicio}>↺ Desde el inicio</button>
            <button className="vg-btn" onClick={onExit}>Salir</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={'vigia vg-presentar vg-presentar-historia tono-' + tono} data-screen-label="Modo Vigía · Presentar historia"
      ref={raiz} tabIndex={-1} style={{ outline: 'none' }}>
      {escena}

      {/* Portada antes de empezar */}
      {fase === 'portada' && (
        <div className="vg-portada">
          <img src={VIGIA_LOGO} alt="" className="vg-portada-logo" />
          <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Modo Historia{competitiva ? ' · competitiva' : ''}</div>
          <h1>{act.titulo || 'Historia'}</h1>
          {act.objetivo && <p>{act.objetivo}</p>}
          <div className="vg-portada-info">
            {diapos.length} {diapos.length === 1 ? 'diapositiva' : 'diapositivas'} · {lista.filter((a) => diapos.some((d) => d.id === a.diapo)).length} pausas
            {competitiva ? ' · los equipos suben la montaña hacia ' + nombreMeta : ''}.
          </div>
          <button className="vg-btn vg-btn-grande" onClick={avanzar}>
            <Icon name="play" size={22} /> Comenzar la historia
          </button>
        </div>
      )}

      {/* La pausa en pantalla */}
      {activa && (
        <TarjetaActivacion key={activa.id} a={activa} frase={frase} estudiantes={act.estudiantes || []} orden={act.ordenNombres || 'apellidos'}
          usados={usados} onUsado={marcarUsado} onContinuar={cerrar} textoContinuar="Seguir la historia"
          onCambiarActivacion={cambiarActivacion} />
      )}

      {/* Navegación (se aclara al acercar el mouse) */}
      {fase === 'diapo' && !activa && (
        <div className="vg-nav-diapos">
          <button className="vg-ctrl" onClick={atras} disabled={i === 0} title="Diapositiva anterior (←)" aria-label="Anterior">‹</button>
          <div className="vg-nav-puntos">
            {diapos.map((d, k) => {
              const ps = pausasDe(d);
              const completa = ps.length > 0 && ps.every((a) => vistos.includes(a.id));
              return (
                <button key={d.id} className={'vg-nav-punto' + (k === i ? ' on' : '') + (completa ? ' completa' : '') + (ps.length ? ' con-pausa' : '')}
                  onClick={() => ir(k)} title={'Diapositiva ' + (k + 1) + (ps.length ? ' · ' + ps.length + (ps.length === 1 ? ' pausa' : ' pausas') : '')}
                  aria-label={'Ir a la diapositiva ' + (k + 1)}></button>
              );
            })}
          </div>
          <span className="vg-nav-num">{i + 1} / {diapos.length}{pendientes.length ? ' · ⏸ ' + pendientes.length : ''}</span>
          <button className="vg-ctrl" onClick={avanzar} title={misionPendiente ? 'Formar los equipos' : pendientes.length ? 'Ir a la pausa (→)' : 'Siguiente (→)'} aria-label="Siguiente">›</button>
          <span className="vg-ctrl-sep"></span>
          <button className="vg-ctrl" onClick={onExit} title="Salir (Esc)" aria-label="Salir">✕</button>
        </div>
      )}
      {(fase === 'grupos' || fase === 'montana' || fase === 'meta') && (
        <button type="button" className="vg-hs-volver" onClick={atras} title="Volver (←)">‹ Volver</button>
      )}
      <TonoLateral tono={tono} setTono={setTono} />
      <HerramientasPresentar act={act} />
      <MandoBadge mando={mando} />
    </div>
  );
}

/* El desenlace: el equipo con más pasos resuelve el problema. */
function DesenlaceHistoria({ h, equipos, onVolver, onInicio, onSalir }) {
  const eq = equiposCapibara(equipos).map((e, k) => ({ ...e, k })).sort((x, y) => (y.puntos || 0) - (x.puntos || 0));
  const max = eq.length ? (eq[0].puntos || 0) : 0;
  const ganadores = eq.filter((e) => (e.puntos || 0) === max);
  const nombre = ganadores.map((e) => e.nombre).join(' y ');
  const f = h.final || {};
  const texto = String((f.texto || '').trim() || HISTORIA_FINAL_TEXTO).replace(/\{equipo\}/g, nombre || 'el equipo');
  const img = ((f.imagen || '').trim() || ((h.meta && h.meta.imagen) || '').trim());
  const confeti = React.useMemo(() => Array.from({ length: 36 }, (_, k) => ({
    x: Math.random() * 100, d: 3 + Math.random() * 4, r: -Math.random() * 6, c: ['#FFC233', '#FF8A00', '#3DDC97', '#4D94FF', '#FF5FA2'][k % 5],
  })), []);
  return (
    <div className={'vg-hs-desenlace' + (img ? ' con-imagen' : '')}>
      {img && <div className="vg-hs-fondo" style={{ backgroundImage: 'url(' + JSON.stringify(urlImagen(img)) + ')' }}></div>}
      <div className="vg-hs-confeti" aria-hidden="true">
        {confeti.map((c, k) => <span key={k} style={{ left: c.x + '%', background: c.c, animationDuration: c.d + 's', animationDelay: c.r + 's' }}></span>)}
      </div>
      <div className="vg-hs-desenlace-caja">
        <div className="vg-hs-desenlace-kicker">🏆 ¡Problema resuelto!</div>
        <h1 className="vg-hs-desenlace-nombre">
          {ganadores.map((e) => <span key={e.k} style={{ color: e.color }}>{e.emoji} {e.nombre}</span>)}
        </h1>
        <p className="vg-hs-frase">{texto.split(' ').map((p, k) => (
          <span key={k} className="vg-hs-palabra" style={{ animationDelay: (0.8 + k * 0.1).toFixed(2) + 's' }}>{p}{' '}</span>
        ))}</p>
        <div className="vg-hs-tabla">
          {eq.map((e) => (
            <span key={e.k} className={'vg-hs-tabla-chip' + ((e.puntos || 0) === max ? ' gana' : '')} style={{ '--c': e.color }}>
              {e.emoji} {e.corto} <b>{e.puntos || 0}</b>
            </span>
          ))}
        </div>
        <div className="vg-hs-fin-botones">
          <button className="vg-btn vg-btn-sec" onClick={onVolver}>‹ Volver a la historia</button>
          <button className="vg-btn vg-btn-sec" onClick={onInicio}>↺ Desde el inicio</button>
          <button className="vg-btn" onClick={onSalir}>Salir</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { VigiaPresentarHistoria, DesenlaceHistoria });
