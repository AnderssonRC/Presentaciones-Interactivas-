/* Actividad 'tablero' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Tablero de números ----------
   Un tablero de casillas numeradas (una por pregunta), en orden mezclado:
   elegir un número revela la pregunta que esconde. Funciona en cualquier
   presentación (uso individual/grupal con toda la clase) y, si Modo Equipos
   está activo, además reparte turnos entre los equipos (sin repetir uno
   hasta que les toque a todos) y puntos al acertar. */
function TableroRun({ config, tool, equiposApi }) {
  const preguntas = React.useMemo(() =>
    (config.items || [])
      .map((l) => { const [p, r] = l.split('=').map((s) => (s || '').trim()); return { pregunta: p || '', respuesta: r || '' }; })
      .filter((x) => x.pregunta),
    [config.items]);
  const puntos = Math.max(1, Number(config.puntos) || 1);
  const n = preguntas.length;
  const equiposDef = equiposApi ? equiposApi.equipos : null;

  // Orden de las casillas: se mezcla una sola vez por diapositiva (no en
  // cada render), para que el número 1 no sea siempre la primera pregunta.
  const orden = React.useMemo(() => {
    const idx = preguntas.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idx[i], idx[j]] = [idx[j], idx[i]];
    }
    return idx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n]);

  const [abiertas, setAbiertas] = React.useState([]); // posiciones ya reveladas
  const [activa, setActiva] = React.useState(null);   // posición mostrada en grande
  const [verResp, setVerResp] = React.useState(false);

  // Turno del equipo (solo Modo Equipos): rota entre equipos sin repetir
  // uno hasta que a todos les haya tocado (misma regla que en la Ruleta).
  const [turnos, setTurnos] = React.useState([]);
  const [turnoId, setTurnoId] = React.useState(null);
  React.useEffect(() => {
    setTurnos([]);
    setTurnoId(equiposDef && equiposDef.length ? equiposDef[0].id : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equiposDef ? equiposDef.length : 0]);
  // Un color distinto por casilla (paleta de la ruleta), sin que dos vecinas
  // en la cuadrícula queden con el mismo color.
  const coloresTablero = React.useMemo(() => coloresSinRepetirAdyacentes(n, RULETA_PALETTE), [n]);

  if (!n) return <FichaRun config={config} tool={tool} />;

  const elegir = (pos) => {
    if (activa !== null || abiertas.includes(pos)) return;
    setActiva(pos);
    setVerResp(false);
  };

  const cerrar = () => {
    setAbiertas((prev) => [...prev, activa]);
    setActiva(null);
    setVerResp(false);
    if (equiposDef && equiposDef.length) {
      let pool = equiposDef.filter((e) => e.id !== turnoId && !turnos.includes(e.id));
      if (!pool.length) { pool = equiposDef.filter((e) => e.id !== turnoId); setTurnos([turnoId]); }
      else setTurnos((prev) => [...prev, turnoId]);
      setTurnoId((pool[0] || equiposDef[0]).id);
    }
  };
  const acerto = (equipoId) => { if (equiposApi) equiposApi.sumar(equipoId, puntos); cerrar(); };

  const reiniciar = () => { setAbiertas([]); setActiva(null); setVerResp(false); };

  const pregunta = activa != null ? preguntas[orden[activa]] : null;
  const equipoTurno = equiposDef && equiposDef.find((e) => e.id === turnoId);
  const terminado = abiertas.length >= n;

  // Casillas grandes, ocupando casi todo el ancho/alto disponible bajo el
  // encabezado (antes eran 120px fijos y sobraba media pantalla vacía).
  // Se calcula el tamaño de celda a partir del espacio real, no un valor fijo.
  const cols = n <= 4 ? n : n <= 8 ? 4 : n <= 15 ? 5 : 6;
  const rows = Math.ceil(n / cols);
  const gap = 24;
  const anchoDisp = 1680, altoDisp = equipoTurno ? 560 : 620;
  // Con pocas preguntas, deja crecer más las casillas (si no, sobra media
  // pantalla vacía); con muchas, el tope bajo evita casillas gigantes.
  const maxCelda = n <= 4 ? 340 : n <= 6 ? 300 : n <= 9 ? 260 : n <= 15 ? 220 : 180;
  const celda = Math.max(110, Math.min(
    maxCelda,
    Math.floor((anchoDisp - gap * (cols - 1)) / cols),
    Math.floor((altoDisp - gap * (rows - 1)) / rows),
  ));
  const fzNum = Math.round(celda * 0.4);

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      {equipoTurno && !pregunta && (
        <div style={{
          marginTop: 14, padding: '10px 28px', borderRadius: 14, background: equipoTurno.color, color: '#06140A',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
        }}>
          Turno: {equipoTurno.nombre}
        </div>
      )}

      {!pregunta ? (
        <React.Fragment>
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${cols}, ${celda}px)`, gap,
            marginTop: 22, justifyContent: 'center',
          }}>
            {orden.map((_, pos) => {
              const usada = abiertas.includes(pos);
              const color = coloresTablero[pos];
              return (
                <button key={pos} onClick={() => elegir(pos)} disabled={usada}
                  style={{
                    width: celda, height: celda, borderRadius: celda * 0.16, border: 'none',
                    cursor: usada ? 'default' : 'pointer', position: 'relative', overflow: 'hidden',
                    background: usada ? '#20251F' : color,
                    color: usada ? '#485044' : '#08120B',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: fzNum,
                    // Botón "de concurso": un reborde inferior que da volumen, y
                    // que se hunde (sin reborde + trasladado) al quedar usada.
                    boxShadow: usada
                      ? 'inset 0 6px 12px rgba(0,0,0,.5)'
                      : `0 ${Math.round(celda * 0.07)}px 0 rgba(0,0,0,.32), 0 ${Math.round(celda * 0.1)}px ${Math.round(celda * 0.22)}px -${Math.round(celda * 0.08)}px rgba(0,0,0,.55)`,
                    transform: usada ? `translateY(${Math.round(celda * 0.05)}px)` : 'none',
                    transition: 'transform .15s ease, filter .15s ease',
                  }}
                  onMouseEnter={(e) => { if (!usada) e.currentTarget.style.filter = 'brightness(1.08)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}>
                  {usada ? (
                    <span style={{ fontSize: fzNum * 0.9 }}>✓</span>
                  ) : (
                    <React.Fragment>
                      <span aria-hidden="true" style={{
                        position: 'absolute', top: celda * 0.06, right: celda * 0.1,
                        fontSize: fzNum * 0.42, fontWeight: 800, opacity: .3,
                      }}>?</span>
                      {pos + 1}
                    </React.Fragment>
                  )}
                </button>
              );
            })}
          </div>
          {terminado && (
            <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 22, padding: '12px 30px', marginTop: 26 }}
              onClick={reiniciar}>
              🔄 Reiniciar tablero
            </button>
          )}
        </React.Fragment>
      ) : (
        <div className="fade-up" style={{ marginTop: 26, maxWidth: 1400, width: '100%' }}>
          <div style={{
            padding: '46px 56px', borderRadius: 28, background: '#161A15',
            border: '4px solid ' + (coloresTablero[activa] || tool.color),
            boxShadow: `0 24px 60px -20px ${coloresTablero[activa] || tool.color}55`,
          }}>
            <div style={{
              display: 'inline-block', padding: '6px 18px', borderRadius: 999,
              background: coloresTablero[activa] || tool.color, color: '#08120B',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '.1em',
            }}>
              NÚMERO {activa + 1}
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 50, lineHeight: 1.25, marginTop: 18 }}>
              {pregunta.pregunta}
            </div>
            {pregunta.respuesta && (
              verResp ? (
                <div className="fade-up" style={{ marginTop: 22, fontSize: 34, fontWeight: 700, color: '#11F555' }}>Respuesta: {pregunta.respuesta}</div>
              ) : (
                <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 22, padding: '10px 28px', marginTop: 22 }}
                  onClick={() => setVerResp(true)}>
                  👁 Ver respuesta
                </button>
              )
            )}
          </div>

          {/* Modo Equipos: un botón por equipo para dar el punto a quien acertó. */}
          {equiposDef && equiposDef.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 24 }}>
              {equiposDef.map((e) => (
                <button key={e.id} onClick={() => acerto(e.id)}
                  style={{
                    padding: '14px 26px', borderRadius: 16, border: 'none', cursor: 'pointer',
                    background: e.color, color: '#06140A', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20,
                    boxShadow: '0 8px 20px -8px rgba(0,0,0,.5)',
                  }}>
                  ✓ {e.nombre} (+{puntos})
                </button>
              ))}
            </div>
          )}

          <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A', marginTop: 28 }} onClick={cerrar}>
            Cerrar y volver al tablero →
          </button>
        </div>
      )}
    </div>
  );
}

Actividades.definir('tablero', { Run: TableroRun });
