/* Actividad 'pulsador' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Pulsador por turnos ---------- */
function PulsadorRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Pulsador por turnos" />;
  const equipos = equiposApi.equipos || [];
  const preguntas = (config.items || [])
    .map((l) => { const [p, r] = l.split('=').map((s) => s.trim()); return { pregunta: p || '', respuesta: r || '' }; })
    .filter((x) => x.pregunta);
  const puntos = Math.max(1, Number(config.puntos) || 1);

  const [qi, setQi] = React.useState(0);
  const [pulso, setPulso] = React.useState(null);
  const [bloqueados, setBloqueados] = React.useState([]);
  const [verResp, setVerResp] = React.useState(false);
  const [resuelto, setResuelto] = React.useState(false);

  if (!preguntas.length || !equipos.length) return <FichaRun config={config} tool={tool} />;
  const q = preguntas[qi % preguntas.length];

  const pulsar = (e) => { if (!bloqueados.includes(e.id) && !resuelto) setPulso(e); };
  const acierto = () => { if (pulso) { equiposApi.sumar(pulso.id, puntos); setResuelto(true); } };
  const error = () => {
    if (!pulso) return;
    setBloqueados((b) => [...b, pulso.id]);
    setPulso(null);
  };
  const siguiente = () => {
    setQi((i) => (i + 1) % preguntas.length);
    setPulso(null); setBloqueados([]); setVerResp(false); setResuelto(false);
  };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ fontSize: 22, color: 'var(--muted)', marginTop: 4 }}>
        Pregunta {(qi % preguntas.length) + 1} de {preguntas.length} · vale {puntos} {puntos === 1 ? 'punto' : 'puntos'}
      </div>

      <div style={{ marginTop: 26, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.2, textAlign: 'center', maxWidth: 1400 }}>
        {q.pregunta}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginTop: 36, maxWidth: 1500 }}>
        {equipos.map((e) => {
          const fuera = bloqueados.includes(e.id);
          const activo = pulso && pulso.id === e.id;
          return (
            <button key={e.id} onClick={() => pulsar(e)} disabled={fuera || resuelto}
              style={{ minWidth: 220, padding: '24px 30px', borderRadius: 20, cursor: fuera ? 'not-allowed' : 'pointer',
                border: activo ? '5px solid #fff' : '5px solid transparent',
                background: fuera ? '#2A2F29' : e.color, color: fuera ? '#5A6157' : '#06140A',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34,
                opacity: fuera ? 0.5 : 1, transform: activo ? 'scale(1.05)' : 'none', transition: 'all .15s ease' }}>
              {fuera ? '✗ ' : ''}{e.nombre}
            </button>
          );
        })}
      </div>

      {q.respuesta && (
        verResp
          ? <div className="fade-up" style={{ marginTop: 24, fontSize: 38, fontWeight: 700, color: '#11F555' }}>Respuesta: {q.respuesta}</div>
          : <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', marginTop: 24 }} onClick={() => setVerResp(true)}>👁 Ver respuesta</button>
      )}

      {pulso && !resuelto && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 30 }}>
          <span style={{ fontSize: 30, fontWeight: 700 }}>Pulsó <b style={{ color: pulso.color }}>{pulso.nombre}</b>:</span>
          <button className="act-bigbtn" style={{ background: '#11F555', color: '#06140A', fontSize: 28, padding: '14px 38px', marginTop: 0 }} onClick={acierto}>✓ Acertó (+{puntos})</button>
          <button className="act-bigbtn" style={{ background: '#F53711', color: '#fff', fontSize: 28, padding: '14px 38px', marginTop: 0 }} onClick={error}>✗ Falló</button>
        </div>
      )}
      {resuelto && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 30 }}>
          <div className="fade-up" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: '#11F555' }}>🎉 +{puntos} para {pulso.nombre}</div>
          {preguntas.length > 1 && <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 28, padding: '14px 40px' }} onClick={siguiente}>Siguiente →</button>}
        </div>
      )}
    </div>
  );
}

Actividades.definir('pulsador', { Run: PulsadorRun });
