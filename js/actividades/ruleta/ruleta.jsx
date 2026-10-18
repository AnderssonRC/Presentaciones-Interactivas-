/* Actividad 'ruleta' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Ruleta de preguntas ----------
   En Modo Equipos, además de la pregunta, cada giro decide a qué equipo le
   toca responder (con los colores/nombres reales del marcador). Dos reglas
   de "no repetir":
     - Preguntas: no vuelve a salir una ya usada hasta que salgan todas.
     - Equipos: no le vuelve a tocar a uno hasta que le haya tocado a todos.
   Al agotarse cualquiera de las dos, empieza una vuelta nueva (se limpia y
   puede volver a repetirse desde cero). */
function RuletaRun({ config, tool, remoteSignal, equiposApi }) {
  const items = (config.items || []).filter((x) => x.trim());
  const n = Math.max(items.length, 1);
  const equiposDef = equiposApi ? equiposApi.equipos : null;
  // Un color por gajo, sin que dos vecinos (ni el último con el primero)
  // queden repetidos.
  const coloresRueda = React.useMemo(() => coloresSinRepetirAdyacentes(n, RULETA_PALETTE), [n]);

  const [rot, setRot] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  // Índices de preguntas ya salidas en esta vuelta.
  const [usadas, setUsadas] = React.useState([]);
  // Ids de equipo a los que ya les tocó en esta vuelta, y a quién le tocó
  // en el último giro (se revela junto con la pregunta, no antes).
  const [turnos, setTurnos] = React.useState([]);
  const [equipoTurno, setEquipoTurno] = React.useState(null);
  // Id de equipo que se muestra "pasando rápido" mientras gira la ruleta.
  const [cicloEquipo, setCicloEquipo] = React.useState(null);

  const seg = 360 / n;
  const cx = 330, cy = 330, r = 312;
  const timeoutRef = React.useRef(null);
  const cicloRef = React.useRef(null);
  React.useEffect(() => () => { clearTimeout(timeoutRef.current); clearInterval(cicloRef.current); }, []);

  // Si cambia el banco de preguntas o el número de equipos, empieza una
  // vuelta nueva (evita arrastrar índices/ids que ya no existen).
  React.useEffect(() => { setUsadas([]); }, [config.items]);
  React.useEffect(() => { setTurnos([]); setEquipoTurno(null); }, [equiposDef ? equiposDef.length : 0]);

  const spin = () => {
    if (spinning) return;
    setResult(null);

    // Próxima pregunta: sin repetir hasta agotar el banco.
    let poolP = items.map((_, i) => i).filter((i) => !usadas.includes(i));
    const nuevaVueltaP = !poolP.length;
    if (nuevaVueltaP) poolP = items.map((_, i) => i);
    const idx = poolP[Math.floor(Math.random() * poolP.length)];

    // Próximo equipo (solo en Modo Equipos): sin repetir hasta que a todos
    // les haya tocado una vez.
    let equipoId = null, nuevaVueltaE = false;
    if (equiposDef && equiposDef.length) {
      let poolE = equiposDef.filter((e) => !turnos.includes(e.id));
      nuevaVueltaE = !poolE.length;
      if (nuevaVueltaE) poolE = equiposDef;
      equipoId = poolE[Math.floor(Math.random() * poolE.length)].id;
    }

    // Gira hasta detenerse exactamente sobre el segmento de `idx` (con un
    // pequeño margen aleatorio para que no caiga siempre justo al centro).
    const centro = idx * seg + seg / 2;
    const jitter = (Math.random() - 0.5) * seg * 0.5;
    const objetivo = ((centro + jitter) % 360 + 360) % 360;
    const modActual = ((rot % 360) + 360) % 360;
    const modObjetivo = ((360 - objetivo) % 360 + 360) % 360;
    const next = (rot - modActual) + 1440 + modObjetivo;
    setRot(next);
    setSpinning(true);

    // Mientras gira, pasa rápido por los equipos (mismo efecto que el
    // sorteo de "Formar grupos"), hasta asentarse cuando termina el giro.
    clearInterval(cicloRef.current);
    if (equiposDef && equiposDef.length) {
      let k = 0;
      cicloRef.current = setInterval(() => {
        setCicloEquipo(equiposDef[k % equiposDef.length].id);
        k++;
      }, 110);
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearInterval(cicloRef.current);
      setUsadas((prev) => (nuevaVueltaP ? [idx] : [...prev, idx]));
      if (equipoId != null) setTurnos((prev) => (nuevaVueltaE ? [equipoId] : [...prev, equipoId]));
      setResult(idx);
      setEquipoTurno(equipoId);
      setSpinning(false);
    }, 4200);
  };
  useRemoteAction(remoteSignal, { primary: spin, next: spin });

  const arc = (i) => {
    if (n === 1) return null;
    const a0 = ((-90 + i * seg) * Math.PI) / 180, a1 = ((-90 + (i + 1) * seg) * Math.PI) / 180;
    return `M ${cx},${cy} L ${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A ${r},${r} 0 ${seg > 180 ? 1 : 0} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
  };

  return (
    <div className="act-stage" style={{ flexDirection: 'row', gap: 110, textAlign: 'left', justifyContent: 'center' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="660" height="660" viewBox="0 0 660 660" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(.12,.68,.16,1)' : 'none' }}>
          {n === 1
            ? <circle cx={cx} cy={cy} r={r} fill={coloresRueda[0]} />
            : items.map((q, i) => <path key={i} d={arc(i)} fill={coloresRueda[i]} stroke="#0B0E0B" strokeWidth="5" />)}
          {items.map((q, i) => {
            const am = ((-90 + (i + 0.5) * seg) * Math.PI) / 180;
            return <text key={'t' + i} x={cx + r * 0.66 * Math.cos(am)} y={cy + r * 0.66 * Math.sin(am)} textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontWeight="800" fontSize="54" fill="#08120B">{i + 1}</text>;
          })}
          <circle cx={cx} cy={cy} r="56" fill="#0B0E0B" stroke="#F2F5EF" strokeWidth="6" />
        </svg>
        <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '26px solid transparent', borderRight: '26px solid transparent', borderTop: '46px solid #F2F5EF', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))' }}></div>
      </div>
      <div style={{ maxWidth: 860 }}>
        <ActHeader tool={tool} titulo={config.titulo} compact />
        <div className="act-instr" style={{ marginTop: 18 }}>{config.instrucciones}</div>

        {items.length > 1 && (
          <div style={{ marginTop: 14, fontSize: 14, color: '#7B857A' }}>
            Sin repetir hasta que salgan todas · quedan {items.length - usadas.length} de {items.length}
          </div>
        )}

        {result !== null && (
          <div className="fade-up" style={{ marginTop: 24, padding: '40px 46px', borderRadius: 22, background: coloresRueda[result], color: '#08120B' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '.18em' }}>PREGUNTA {result + 1}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1.15, marginTop: 10 }}>{items[result]}</div>
          </div>
        )}

        {/* Modo Equipos: a qué equipo le toca responder esta pregunta.
            Mientras gira, pasa rápido por todos; al terminar, se revela el
            elegido junto con la pregunta (no antes, para no arruinar la
            sorpresa). Los puntos abajo muestran a quién ya le tocó en esta
            vuelta (no se repite hasta que le toque a todos). */}
        {equiposDef && equiposDef.length > 0 && (() => {
          const activoId = spinning ? cicloEquipo : equipoTurno;
          const activo = equiposDef.find((e) => e.id === activoId);
          return (
            <div style={{ marginTop: 28 }}>
              <div style={{
                display: 'inline-block', padding: '14px 30px', borderRadius: 16,
                background: activo ? activo.color : '#2A2F29',
                color: activo ? '#08120B' : '#9AA396',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30,
                transition: spinning ? 'none' : 'background .15s ease',
              }}>
                {spinning
                  ? '🎯 ' + (activo ? activo.nombre : '…')
                  : (activo ? ('Responde: ' + activo.nombre) : 'El próximo giro asigna equipo')}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
                {equiposDef.map((e) => (
                  <span key={e.id} title={e.nombre} style={{
                    width: 14, height: 14, borderRadius: '50%', border: '2px solid ' + e.color,
                    background: turnos.includes(e.id) ? e.color : 'transparent',
                    display: 'inline-block',
                  }} />
                ))}
                <span style={{ fontSize: 13, color: '#7B857A', marginLeft: 4 }}>
                  {turnos.length} de {equiposDef.length} ya respondieron esta vuelta
                </span>
              </div>
            </div>
          );
        })()}

        <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={spin} disabled={spinning}>
          {spinning ? 'Girando…' : result !== null ? 'Girar de nuevo' : '¡Girar!'}
        </button>
      </div>
    </div>
  );
}

Actividades.definir('ruleta', { Run: RuletaRun });
