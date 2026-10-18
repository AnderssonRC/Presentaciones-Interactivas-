/* Actividad 'apuesta' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Apuesta de puntos ---------- */
function ApuestaRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Apuesta de puntos" />;
  const equipos = equiposApi.equipos || [];
  const preguntas = (config.items || [])
    .map((l) => { const [p, r] = l.split('=').map((s) => s.trim()); return { pregunta: p || '', respuesta: r || '' }; })
    .filter((x) => x.pregunta);

  const [qi, setQi] = React.useState(0);
  const [fase, setFase] = React.useState('apostar');
  const [apuestas, setApuestas] = React.useState({});
  const [verResp, setVerResp] = React.useState(false);

  if (!preguntas.length || !equipos.length) return <FichaRun config={config} tool={tool} />;
  const q = preguntas[qi % preguntas.length];
  const montos = [1, 2, 3, 5];

  const apostar = (eid, m) => setApuestas((a) => ({ ...a, [eid]: m }));
  const todosApostaron = equipos.every((e) => apuestas[e.id]);

  const resolver = (eid, gano) => {
    const m = apuestas[eid] || 0;
    equiposApi.sumar(eid, gano ? m : -m);
    setApuestas((a) => ({ ...a, [eid]: 0 }));
  };
  const siguiente = () => {
    setQi((i) => (i + 1) % preguntas.length);
    setFase('apostar'); setApuestas({}); setVerResp(false);
  };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ fontSize: 22, color: 'var(--muted)', marginTop: 4 }}>
        Pregunta {(qi % preguntas.length) + 1} de {preguntas.length}
      </div>

      {fase === 'apostar' && (
        <React.Fragment>
          <div style={{ marginTop: 18, fontSize: 30, color: 'var(--muted)' }}>Cada equipo elige cuántos puntos apostar:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, width: '100%', maxWidth: 1100 }}>
            {equipos.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ minWidth: 280, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: e.color }}>{e.nombre}</div>
                <span style={{ fontSize: 22, color: 'var(--muted)' }}>({e.puntos || 0} pts)</span>
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                  {montos.map((m) => (
                    <button key={m} onClick={() => apostar(e.id, m)}
                      style={{ width: 76, height: 76, borderRadius: 14, cursor: 'pointer',
                        border: apuestas[e.id] === m ? '4px solid #fff' : 'none',
                        background: apuestas[e.id] === m ? e.color : '#222722', color: apuestas[e.id] === m ? '#06140A' : '#F2F5EF',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>{m}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="act-bigbtn" style={{ background: todosApostaron ? tool.color : '#2A2F29', color: todosApostaron ? '#06140A' : '#9AA396', fontSize: 30, padding: '16px 48px', marginTop: 34 }}
            onClick={() => todosApostaron && setFase('pregunta')} disabled={!todosApostaron}>
            Mostrar la pregunta →
          </button>
        </React.Fragment>
      )}

      {fase !== 'apostar' && (
        <React.Fragment>
          <div style={{ marginTop: 24, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 54, lineHeight: 1.2, textAlign: 'center', maxWidth: 1400 }}>
            {q.pregunta}
          </div>
          {q.respuesta && (
            verResp
              ? <div className="fade-up" style={{ marginTop: 18, fontSize: 36, fontWeight: 700, color: '#11F555' }}>Respuesta: {q.respuesta}</div>
              : <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', marginTop: 18 }} onClick={() => setVerResp(true)}>👁 Ver respuesta</button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28, width: '100%', maxWidth: 1100 }}>
            {equipos.map((e) => {
              const m = apuestas[e.id];
              const resueltoEq = m === 0;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ minWidth: 280, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: e.color }}>{e.nombre}</div>
                  {!resueltoEq ? (
                    <React.Fragment>
                      <span style={{ fontSize: 24, color: 'var(--muted)' }}>apostó {m}</span>
                      <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                        <button className="act-bigbtn" style={{ background: '#11F555', color: '#06140A', fontSize: 24, padding: '10px 28px', marginTop: 0 }} onClick={() => resolver(e.id, true)}>✓ +{m}</button>
                        <button className="act-bigbtn" style={{ background: '#F53711', color: '#fff', fontSize: 24, padding: '10px 28px', marginTop: 0 }} onClick={() => resolver(e.id, false)}>✗ −{m}</button>
                      </div>
                    </React.Fragment>
                  ) : (
                    <span className="fade-up" style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 700, color: '#9AA396' }}>resuelto ✓</span>
                  )}
                </div>
              );
            })}
          </div>
          {preguntas.length > 1 && (
            <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 28, padding: '14px 44px', marginTop: 30 }} onClick={siguiente}>
              Siguiente pregunta →
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

Actividades.definir('apuesta', { Run: ApuestaRun });
