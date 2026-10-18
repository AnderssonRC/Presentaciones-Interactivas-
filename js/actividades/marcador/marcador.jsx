/* Actividad 'marcador' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Marcador de equipos ---------- */
function MarcadorRun({ config, tool }) {
  const teams = (config.items || []).filter((x) => x.trim()).slice(0, 4);
  const [scores, setScores] = React.useState(teams.map(() => 0));
  if (!teams.length) return <FichaRun config={config} tool={tool} />;
  const bump = (i, d) => setScores(scores.map((s, j) => (j === i ? Math.max(0, s + d) : s)));
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ display: 'flex', gap: 36, marginTop: 70 }}>
        {teams.map((t, i) => (
          <div key={i} style={{ width: 360, borderRadius: 26, overflow: 'hidden', border: '3px solid #2A2F29', background: '#141814' }}>
            <div style={{ background: ACT_PALETTE[i % ACT_PALETTE.length], color: '#08120B', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, padding: '18px 10px' }}>{t}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, lineHeight: 1, padding: '36px 0' }}>{scores[i]}</div>
            <div style={{ display: 'flex' }}>
              <button onClick={() => bump(i, -1)} style={{ flex: 1, fontSize: 44, padding: '14px 0', background: '#1C201B', color: '#9AA396', border: 'none', fontWeight: 800 }}>−</button>
              <button onClick={() => bump(i, 1)} style={{ flex: 1, fontSize: 44, padding: '14px 0', background: ACT_PALETTE[i % ACT_PALETTE.length], color: '#08120B', border: 'none', fontWeight: 800 }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Actividades.definir('marcador', { Run: MarcadorRun });
