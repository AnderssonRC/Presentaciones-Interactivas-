/* Actividad 'grupos' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Formar grupos (sorteo aleatorio de la lista) ---------- */
function GruposRun({ config, tool, remoteSignal, equiposApi, gruposGuardados, onGrupos }) {
  const GCOLS = ['#11F555', '#F53711', '#116CF5', '#F5C211', '#A855F7', '#EC4899', '#38BDF8', '#FB923C'];
  // En Modo Equipos, los grupos son los equipos del marcador (mismo nombre y
  // color): así el sorteo reparte directamente en "Equipo Verde", "Equipo
  // Naranja"... en vez de "Grupo 1", "Grupo 2", y los integrantes quedan
  // guardados en el equipo sin tener que escribirlos a mano.
  const equiposDef = equiposApi ? equiposApi.equipos : null;
  // Limpieza pensada para listas pegadas desde Excel: quita numeración
  // inicial ("1. ", "12) ", "3 - "), tabulaciones y líneas vacías.
  const nombres = React.useMemo(() =>
    (config.items || [])
      .map((s) => String(s).replace(/\t/g, ' ').replace(/^\s*\d+\s*[.)\-–]?\s*/, '').trim())
      .filter(Boolean),
    [config.items]);
  const n = equiposDef ? equiposDef.length : Math.max(2, Math.min(Number(config.numGrupos) || 3, 8));
  // Si ya se había sorteado antes en esta diapositiva (el docente avanzó y
  // volvió), arrancamos mostrando ese mismo resultado en vez del botón inicial.
  const [grupos, setGrupos] = React.useState(gruposGuardados || null);
  const [girando, setGirando] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => () => { if (ref.current) clearInterval(ref.current); }, []);

  const sortear = () => {
    if (!nombres.length || girando) return;
    setGirando(true);
    let pasos = 0;
    if (ref.current) clearInterval(ref.current);
    ref.current = setInterval(() => {
      const m = [...nombres];                       // Fisher-Yates
      for (let i = m.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [m[i], m[j]] = [m[j], m[i]];
      }
      const gs = Array.from({ length: n }, () => []);
      m.forEach((nom, i) => gs[i % n].push(nom));   // reparto balanceado
      setGrupos(gs);
      if (++pasos > 10) {
        clearInterval(ref.current); setGirando(false);
        // Persiste el resultado en el Presenter para que sobreviva si el
        // docente retrocede y vuelve a esta diapositiva.
        if (onGrupos) onGrupos(gs);
        // En Modo Equipos, deja los integrantes guardados en el marcador
        // (y por lo tanto en el historial) sin pasos adicionales.
        if (equiposApi && equiposApi.asignarMiembros) equiposApi.asignarMiembros(gs);
      }
    }, 120);
  };
  useRemoteAction(remoteSignal, { primary: sortear, next: sortear });

  /* ===== ANTES del sorteo: portada centrada clásica ===== */
  if (!grupos) {
    return (
      <div className="act-stage" style={{ justifyContent: 'center' }}>
        <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
        <div style={{ marginTop: 30, color: '#9AA396', fontSize: 34, fontFamily: 'var(--font-display)' }}>
          {equiposDef
            ? (nombres.length + ' estudiantes · ' + n + ' equipos')
            : (nombres.length + ' estudiantes · ' + n + ' grupos')}
        </div>
        <button className="act-bigbtn" style={{ background: tool.color, color: '#fff' }}
          onClick={sortear} disabled={girando || !nombres.length}>
          {girando ? 'Sorteando…' : '🎲 Formar los grupos'}
        </button>
      </div>
    );
  }

  /* ===== DESPUÉS del sorteo: layout compacto que SIEMPRE cabe =====
     El lienzo mide fijo 1920×1080, así que calculamos el alto disponible
     y de ahí el tamaño de letra: nada se corta por overflow. */
  const cols = n <= 3 ? n : n === 4 ? 2 : n <= 6 ? 3 : 4;
  const rows = Math.ceil(n / cols);
  // 1080 − padding vertical (44+40) − fila superior (~80) − separación (24)
  const altoGrid = 1080 - 84 - 80 - 24;
  const altoTarjeta = (altoGrid - 22 * (rows - 1)) / rows;
  // Dentro de la tarjeta: padding (32) + cabecera "Grupo N" (~48)
  const altoNombres = altoTarjeta - 80;
  const maxPorGrupo = Math.ceil(nombres.length / n);
  // Si con una columna la letra bajaría de 20px, partimos en 2 columnas.
  const colInterno = (altoNombres / maxPorGrupo / 1.35) < 20 ? 2 : 1;
  const porCol = Math.ceil(maxPorGrupo / colInterno);
  const fz = Math.max(18, Math.min(38, Math.floor(altoNombres / porCol / 1.35)));

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', padding: '44px 70px 40px', textAlign: 'left' }}>
      {/* Fila superior: título compacto a la izquierda, botón a la derecha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 24 }}>
        <div style={{ minWidth: 0 }}>
          <div className="act-kicker" style={{ color: tool.color, fontSize: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon name={tool.icon} size={24} /> {tool.nombre}
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {config.titulo}
          </div>
        </div>
        <button className="act-bigbtn" onClick={sortear} disabled={girando}
          style={{ background: tool.color, color: '#fff', marginTop: 0, fontSize: 26, padding: '14px 34px', flexShrink: 0 }}>
          {girando ? 'Sorteando…' : '🎲 Sortear de nuevo'}
        </button>
      </div>

      {/* Rejilla de grupos: llena el alto restante sin desbordarse */}
      <div style={{ flex: 1, minHeight: 0, width: '100%', marginTop: 24, display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 22 }}>
        {grupos.map((g, i) => {
          const eq = equiposDef && equiposDef[i];
          const gcolor = eq ? eq.color : GCOLS[i % GCOLS.length];
          const gnombre = eq ? eq.nombre : ('Grupo ' + (i + 1));
          return (
          <div key={i} style={{ borderRadius: 22, border: '3px solid ' + gcolor,
            background: 'rgba(255,255,255,.04)', padding: '14px 20px', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
              color: gcolor, marginBottom: 8, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {gnombre} <span style={{ fontSize: 20, color: '#9AA396', fontWeight: 600 }}>· {g.length}</span>
            </div>
            <div style={{ flex: 1, minHeight: 0, columnCount: colInterno, columnGap: 24 }}>
              {g.map((nom, j) => (
                <div key={j} style={{ fontSize: fz, lineHeight: 1.35, color: '#F2F5EF',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nom}</div>
              ))}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

  /* Editor de Formar grupos: número de grupos + lista de nombres (pegada de Excel). */
function GruposEditor({ current, curIdx, updateSlide, setItems, esEquipos, numEquipos }) {
  const setN = (e) => updateSlide(curIdx, { ...current, config: { ...current.config, numGrupos: Number(e.target.value) } });
  return (
    <div>
      {esEquipos ? (
        <div className="field">
          <label>Número de grupos</label>
          <div style={{ fontSize: 13, color: 'var(--muted)', padding: '9px 0' }}>
            Como el Modo Equipos está activo, se formarán exactamente <strong>{numEquipos} grupos</strong> —
            uno por cada equipo del marcador (nombre y color incluidos). Los integrantes de cada equipo
            se actualizarán solos al sortear, sin que tengas que escribirlos en "🏆 Equipos".
          </div>
        </div>
      ) : (
        <div className="field">
          <label>Número de grupos</label>
          <select value={current.config.numGrupos || 3} onChange={setN}
            style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
            {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n} grupos</option>)}
          </select>
        </div>
      )}
      <div className="field">
        <label>Lista de estudiantes (un nombre por línea)</label>
        <textarea rows="8" value={(current.config.items || []).join('\n')} onChange={setItems}
          placeholder={'Pega aquí tu lista desde Excel\nAna María López\nCarlos Pérez Ruiz\n…'}></textarea>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
          Copia la columna de nombres en Excel y pégala aquí tal cual: la numeración (1., 2)…), las tabulaciones y las líneas vacías se limpian solas. Los nombres completos caben: la letra se ajusta en pantalla.
        </div>
      </div>
    </div>
  );
}

Actividades.definir('grupos', { Run: GruposRun, Editor: GruposEditor });
