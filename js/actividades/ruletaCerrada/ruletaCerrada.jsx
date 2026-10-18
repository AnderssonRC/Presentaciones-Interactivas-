/* Actividad 'ruletaCerrada' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Ruleta de opción múltiple ----------
   Como la Ruleta de preguntas, pero de "opción cerrada": cada pregunta trae
   sus opciones (igual formato que "Elige la respuesta"). Además de la
   pregunta, cada giro decide quién responde:
     - Modo Equipos activo: sortea un EQUIPO (sin repetir hasta que a todos
       les toque). Acertar suma `puntos`; fallar los resta.
     - Sin Modo Equipos: sortea un ESTUDIANTE de la lista configurada (mismo
       sorteo sin repetir), solo para elegir quién responde — sin puntaje.
   `responsables` unifica ambos casos para reusar la misma lógica de turnos. */
function RuletaCerradaRun({ config, tool, remoteSignal, equiposApi }) {
  const preguntas = React.useMemo(() =>
    (config.items || [])
      .map((l) => l.split('|').map((s) => s.trim()).filter(Boolean))
      .filter((p) => p.length >= 3)
      .map((p) => ({ pregunta: p[0], correcta: p[1], distractores: p.slice(2) })),
    [config.items]);
  const puntos = Math.max(1, Number(config.puntos) || 2);
  const n = preguntas.length;
  const modoEquipos = !!(equiposApi && equiposApi.equipos && equiposApi.equipos.length);
  const estudiantes = React.useMemo(() =>
    (config.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean),
    [config.estudiantes]);
  // Un solo arreglo de "responsables" para no duplicar la lógica de turnos:
  // equipos del marcador si Modo Equipos está activo, o la lista de
  // estudiantes configurada si no.
  const responsables = React.useMemo(() => {
    if (modoEquipos) return equiposApi.equipos.map((e) => ({ id: e.id, nombre: e.nombre, color: e.color }));
    return estudiantes.map((nom, i) => ({ id: i, nombre: nom, color: RULETA_PALETTE[i % RULETA_PALETTE.length] }));
  }, [modoEquipos, equiposApi, estudiantes]);
  const coloresRueda = React.useMemo(() => coloresSinRepetirAdyacentes(n, RULETA_PALETTE), [n]);

  const [rot, setRot] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState(null); // índice de pregunta
  const [opciones, setOpciones] = React.useState([]); // opciones barajadas de la pregunta actual
  const [chosen, setChosen] = React.useState(null);
  const [usadas, setUsadas] = React.useState([]);
  const [turnos, setTurnos] = React.useState([]);
  const [respActual, setRespActual] = React.useState(null);
  const [ciclo, setCiclo] = React.useState(null);

  const seg = 360 / Math.max(n, 1);
  const cx = 330, cy = 330, r = 312;
  const timeoutRef = React.useRef(null);
  const cicloRef = React.useRef(null);
  React.useEffect(() => () => { clearTimeout(timeoutRef.current); clearInterval(cicloRef.current); }, []);
  React.useEffect(() => { setUsadas([]); }, [config.items]);
  React.useEffect(() => { setTurnos([]); setRespActual(null); }, [responsables.length, modoEquipos]);

  if (!n) return <FichaRun config={config} tool={tool} />;

  const spin = () => {
    if (spinning) return;
    setResult(null); setChosen(null);

    let poolP = preguntas.map((_, i) => i).filter((i) => !usadas.includes(i));
    const nuevaVueltaP = !poolP.length;
    if (nuevaVueltaP) poolP = preguntas.map((_, i) => i);
    const idx = poolP[Math.floor(Math.random() * poolP.length)];

    let respId = null, nuevaVueltaR = false;
    if (responsables.length) {
      let poolR = responsables.filter((rp) => !turnos.includes(rp.id));
      nuevaVueltaR = !poolR.length;
      if (nuevaVueltaR) poolR = responsables;
      respId = poolR[Math.floor(Math.random() * poolR.length)].id;
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

    // Mientras gira, pasa rápido por los responsables hasta asentarse.
    clearInterval(cicloRef.current);
    if (responsables.length) {
      let k = 0;
      cicloRef.current = setInterval(() => {
        setCiclo(responsables[k % responsables.length].id);
        k++;
      }, 110);
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      clearInterval(cicloRef.current);
      setUsadas((prev) => (nuevaVueltaP ? [idx] : [...prev, idx]));
      if (respId != null) setTurnos((prev) => (nuevaVueltaR ? [respId] : [...prev, respId]));
      const p = preguntas[idx];
      setOpciones([p.correcta, ...p.distractores].sort(() => Math.random() - 0.5));
      setResult(idx);
      setRespActual(respId);
      setSpinning(false);
    }, 4200);
  };
  useRemoteAction(remoteSignal, { primary: spin, next: spin });

  const arc = (i) => {
    if (n === 1) return null;
    const a0 = ((-90 + i * seg) * Math.PI) / 180, a1 = ((-90 + (i + 1) * seg) * Math.PI) / 180;
    return `M ${cx},${cy} L ${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A ${r},${r} 0 ${seg > 180 ? 1 : 0} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
  };

  const pregunta = result != null ? preguntas[result] : null;
  const responsable = responsables.find((rp) => rp.id === (spinning ? ciclo : respActual));

  // Al elegir una opción: si hay un equipo respondiendo (Modo Equipos), le
  // suma o resta los puntos según acierte o falle. Sin equipos, solo revela.
  const elegirOpcion = (i) => {
    if (chosen !== null || !pregunta) return;
    setChosen(i);
    if (modoEquipos && respActual != null && equiposApi) {
      const acerto = opciones[i] === pregunta.correcta;
      equiposApi.sumar(respActual, acerto ? puntos : -puntos);
    }
  };

  return (
    <div className="act-stage" style={{ flexDirection: 'row', gap: 100, textAlign: 'left', justifyContent: 'center' }}>
      <div style={{ position: 'relative', flexShrink: 0, filter: 'drop-shadow(0 22px 40px rgba(0,0,0,.55))' }}>
        <svg width="660" height="660" viewBox="0 0 660 660" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(.12,.68,.16,1)' : 'none' }}>
          <defs>
            <radialGradient id="rcg-gloss" cx="35%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#fff" stopOpacity=".38" />
              <stop offset="45%" stopColor="#fff" stopOpacity=".1" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="rcg-hub" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#454C42" />
              <stop offset="100%" stopColor="#0B0E0B" />
            </radialGradient>
          </defs>
          {/* aro exterior */}
          <circle cx={cx} cy={cy} r={r + 12} fill="#0B0E0B" />
          {n === 1
            ? <circle cx={cx} cy={cy} r={r} fill={coloresRueda[0]} />
            : preguntas.map((_, i) => <path key={i} d={arc(i)} fill={coloresRueda[i]} stroke="#0B0E0B" strokeWidth="4" />)}
          {preguntas.map((_, i) => {
            const am = ((-90 + (i + 0.5) * seg) * Math.PI) / 180;
            return <text key={'t' + i} x={cx + r * 0.66 * Math.cos(am)} y={cy + r * 0.66 * Math.sin(am)} textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontWeight="800" fontSize="54" fill="#08120B">{i + 1}</text>;
          })}
          {/* clavos decorativos en el borde, como una ruleta de concurso real */}
          {n > 1 && preguntas.map((_, i) => {
            const am = ((-90 + i * seg) * Math.PI) / 180;
            return <circle key={'peg' + i} cx={cx + (r - 8) * Math.cos(am)} cy={cy + (r - 8) * Math.sin(am)} r="6.5" fill="#F2F5EF" opacity=".85" />;
          })}
          {/* brillo superior, para que no se vea plana */}
          <circle cx={cx} cy={cy} r={r} fill="url(#rcg-gloss)" />
          <circle cx={cx} cy={cy} r="58" fill="url(#rcg-hub)" stroke="#F2F5EF" strokeWidth="6" />
          <circle cx={cx} cy={cy} r="9" fill="#F2F5EF" opacity=".55" />
        </svg>
        {/* puntero con forma de gota, más vistoso que un triángulo plano */}
        <svg width="76" height="86" viewBox="0 0 76 86" style={{ position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.55))' }}>
          <path d="M38 84 C20 58 8 42 8 27 A30 30 0 0 1 68 27 C68 42 56 58 38 84 Z" fill="#F2F5EF" />
          <circle cx="38" cy="27" r="11" fill="#0B0E0B" opacity=".18" />
        </svg>
      </div>
      <div style={{ maxWidth: 900 }}>
        <ActHeader tool={tool} titulo={config.titulo} compact />
        <div className="act-instr" style={{ marginTop: 14 }}>{config.instrucciones}</div>

        {n > 1 && (
          <div style={{ marginTop: 12, fontSize: 14, color: '#7B857A' }}>
            Preguntas sin repetir hasta que salgan todas · quedan {n - usadas.length} de {n}
          </div>
        )}

        {/* A quién le toca responder (equipo o estudiante). Mientras gira,
            pasa rápido por todos; se revela junto con la pregunta. */}
        {responsables.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{
              display: 'inline-block', padding: '12px 26px', borderRadius: 16,
              background: responsable ? responsable.color : '#2A2F29',
              color: responsable ? '#08120B' : '#9AA396',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26,
              transition: spinning ? 'none' : 'background .15s ease',
            }}>
              {spinning
                ? '🎯 ' + (responsable ? responsable.nombre : '…')
                : (responsable ? ('Responde: ' + responsable.nombre) : 'El próximo giro elige quién responde')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {responsables.map((rp) => (
                <span key={rp.id} title={rp.nombre} style={{
                  width: 13, height: 13, borderRadius: '50%', border: '2px solid ' + rp.color,
                  background: turnos.includes(rp.id) ? rp.color : 'transparent', display: 'inline-block',
                }} />
              ))}
              <span style={{ fontSize: 12.5, color: '#7B857A', marginLeft: 4 }}>
                {turnos.length} de {responsables.length} ya {modoEquipos ? 'respondieron' : 'pasaron'} esta vuelta
              </span>
            </div>
          </div>
        )}

        {pregunta && (
          <div className="fade-up" style={{ marginTop: 22 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 38, lineHeight: 1.2 }}>
              {pregunta.pregunta}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 18 }}>
              {opciones.map((o, i) => (
                <button key={i}
                  className={'act-option' + (chosen !== null ? (o === pregunta.correcta ? ' correct' : (i === chosen ? ' wrong' : '')) : '')}
                  style={{ fontSize: 24, padding: '16px 20px' }}
                  onClick={() => elegirOpcion(i)}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginRight: 14, opacity: .65 }}>{String.fromCharCode(65 + i)}</span>{o}
                </button>
              ))}
            </div>
            {chosen !== null && (
              <div className="fade-up" style={{ marginTop: 18, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: opciones[chosen] === pregunta.correcta ? '#11F555' : '#F53711' }}>
                {opciones[chosen] === pregunta.correcta
                  ? '¡Correcto!' + (modoEquipos && respActual != null ? ` (+${puntos})` : '')
                  : 'Era: ' + pregunta.correcta + (modoEquipos && respActual != null ? ` (−${puntos})` : '')}
              </div>
            )}
          </div>
        )}

        <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A', marginTop: 26 }} onClick={spin} disabled={spinning}>
          {spinning ? 'Girando…' : result !== null ? 'Girar de nuevo' : '¡Girar!'}
        </button>
      </div>
    </div>
  );
}

/* Editor de Ruleta de opción múltiple: preguntas de opción múltiple + una
   lista aparte de estudiantes (para el sorteo de "quién responde" cuando la
   presentación NO está en Modo Equipos; con Modo Equipos activo, sortea
   entre los equipos y esa lista de nombres se ignora). */
function RuletaCerradaEditor({ current, curIdx, updateSlide, setItems }) {
  const setEstudiantes = (e) => {
    updateSlide(curIdx, { ...current, config: { ...current.config, estudiantes: e.target.value.split('\n') } });
  };
  return (
    <div>
      <div className="field">
        <label>Preguntas de opción múltiple (una por línea)</label>
        <textarea rows="6" value={(current.config.items || []).join('\n')} onChange={setItems}
          placeholder={'Pregunta|Respuesta correcta|Distractor 1|Distractor 2'}></textarea>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
          Formato: Pregunta|Respuesta correcta|Distractor 1|Distractor 2 (de 2 a 4 opciones). La PRIMERA opción después de la pregunta es siempre la correcta; el juego las mezcla solo.
        </div>
      </div>
      <div className="field">
        <label>Estudiantes para el modo individual (uno por línea)</label>
        <textarea rows="5" value={(current.config.estudiantes || []).join('\n')} onChange={setEstudiantes}
          placeholder={'Ana\nCarlos\nMaría…'}></textarea>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
          Solo se usa cuando la presentación NO está en Modo Equipos: cada giro también sortea quién responde, de esta lista. Si Modo Equipos está activo, sortea entre los equipos del marcador en su lugar (esta lista se ignora).
        </div>
      </div>
    </div>
  );
}

Actividades.definir('ruletaCerrada', { Run: RuletaCerradaRun, Editor: RuletaCerradaEditor });
