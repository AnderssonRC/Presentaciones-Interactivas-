/* Actividad 'encuesta' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Encuesta rápida: votación en vivo ----------
   El docente define las opciones (una por línea). En Presentar cada opción
   tiene botones +/− para sumar votos; las barras crecen por porcentaje y se
   ve el total. Sin generación automática: el conteo lo lleva el docente. */
function EncuestaRun({ config, tool, remoteSignal }) {
  const opciones = (config.items || []).filter((x) => x.trim());
  const [votos, setVotos] = React.useState(opciones.map(() => 0));
  React.useEffect(() => { setVotos(opciones.map(() => 0)); }, [config.items]);

  if (!opciones.length) return <FichaRun config={config} tool={tool} />;

  const total = votos.reduce((a, b) => a + b, 0);
  const bump = (i, d) => setVotos((v) => v.map((x, j) => (j === i ? Math.max(0, x + d) : x)));
  const reset = () => setVotos(opciones.map(() => 0));
  const maxV = Math.max(1, ...votos);

  // Control remoto: acción principal reinicia el conteo.
  useRemoteAction(remoteSignal, { primary: reset, next: reset });

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ width: 1400, marginTop: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {opciones.map((op, i) => {
          const v = votos[i];
          const pct = total ? Math.round((v / total) * 100) : 0;
          const color = ACT_PALETTE[i % ACT_PALETTE.length];
          const lider = v === maxV && v > 0;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 22,
              background: '#141814', border: '3px solid ' + (lider ? color : '#2A2F29'),
              borderRadius: 20, padding: '16px 22px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: '#F2F5EF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color }}>{pct}%</span>
                </div>
                <div style={{ height: 26, borderRadius: 13, background: '#0B0E0B', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 13, transition: 'width .4s cubic-bezier(.2,.8,.2,1)' }} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 46, minWidth: 70, textAlign: 'center', color }}>{v}</div>
              <button onClick={() => bump(i, -1)} style={encBtn('#1C201B', '#9AA396')}>−</button>
              <button onClick={() => bump(i, 1)} style={encBtn(color, '#06140A')}>+</button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: '#9AA396' }}>
          Total de votos: <span style={{ color: '#F2F5EF' }}>{total}</span>
        </div>
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}
const encBtn = (bg, fg) => ({
  width: 64, height: 64, fontSize: 40, fontWeight: 800, flexShrink: 0,
  borderRadius: 14, border: 'none', background: bg, color: fg, cursor: 'pointer',
  fontFamily: 'var(--font-display)',
});

Actividades.definir('encuesta', { Run: EncuestaRun });
