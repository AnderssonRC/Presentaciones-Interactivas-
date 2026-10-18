/* Actividad 'completa' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Completa la palabra ---------- */
function CompletaRun({ config, tool }) {
  const items = (config.items || []).filter((x) => x.includes('=') && x.includes('_'));
  const [qi, setQi] = React.useState(0);
  const [solved, setSolved] = React.useState(false);
  const [wrong, setWrong] = React.useState([]);
  if (!items.length) return <FichaRun config={config} tool={tool} />;
  const [word, ans] = items[qi % items.length].split('=').map((s) => s.trim());
  const answer = (ans || 'A').charAt(0).toUpperCase();

  const options = React.useMemo(() => {
    const pool = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').filter((c) => c !== answer);
    const decoys = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    return [answer, ...decoys].sort(() => Math.random() - 0.5);
  }, [qi]);

  const pick = (c) => {
    if (solved) return;
    if (c === answer) { setSolved(true); } else if (!wrong.includes(c)) { setWrong([...wrong, c]); }
  };
  const next = () => { setQi((qi + 1) % items.length); setSolved(false); setWrong([]); };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{ display: 'flex', gap: 18, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
        {word.split('').map((ch, i) => (
          <div key={i} style={{
            width: 110, height: 130, borderRadius: 16, display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72,
            background: ch === '_' ? (solved ? tool.color : 'transparent') : '#1A1E19',
            border: ch === '_' ? '4px dashed ' + (solved ? tool.color : '#5A6157') : '4px solid transparent',
            color: ch === '_' ? '#06140A' : '#F2F5EF',
            transition: 'all .3s ease',
          }}>{ch === '_' ? (solved ? answer : '?') : ch}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 56 }}>
        {options.map((c) => (
          <button key={c} className={'act-option' + (solved && c === answer ? ' correct' : wrong.includes(c) ? ' wrong' : '')}
            style={{ width: 130, height: 110, fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', padding: 0 }}
            onClick={() => pick(c)}>{c}</button>
        ))}
      </div>
      {solved && items.length > 1 && (
        <button className="act-bigbtn fade-up" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px' }} onClick={next}>
          Siguiente palabra ({(qi % items.length) + 1}/{items.length})
        </button>
      )}
    </div>
  );
}

Actividades.definir('completa', { Run: CompletaRun });
