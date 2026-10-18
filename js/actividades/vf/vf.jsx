/* Actividad 'vf' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Verdadero o falso ---------- */
function VFRun({ config, tool, remoteSignal }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim())).filter((p) => p[0]);
  const [qi, setQi] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);
  const [text, a] = items.length ? items[qi % items.length] : ['', 'V'];
  const answer = (a || 'V').toUpperCase().startsWith('V') ? 'V' : 'F';
  const next = () => { setQi((qi + 1) % Math.max(items.length, 1)); setChosen(null); };
  const reveal = () => { if (chosen === null) setChosen(answer); };
  useRemoteAction(remoteSignal, { primary: reveal, next });
  if (!items.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={'"' + text + '"'} instrucciones={chosen === null ? config.instrucciones : ''} compact />
      <div style={{ display: 'flex', gap: 30, marginTop: 70 }}>
        {['V', 'F'].map((v) => (
          <button key={v} className={'act-option' + (chosen !== null ? (v === answer ? ' correct' : (v === chosen ? ' wrong' : '')) : '')}
            style={{ minWidth: 320, whiteSpace: 'nowrap', textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 48 }}
            onClick={() => chosen === null && setChosen(v)}>
            {v === 'V' ? 'Verdadero' : 'Falso'}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 50 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: chosen === answer ? '#11F555' : '#F53711' }}>
            {chosen === answer ? '¡Correcto!' : 'Era ' + (answer === 'V' ? 'verdadero' : 'falso')}
          </div>
          {items.length > 1 && <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px', marginTop: 0 }} onClick={next}>Siguiente ({(qi % items.length) + 1}/{items.length})</button>}
        </div>
      )}
    </div>
  );
}

Actividades.definir('vf', { Run: VFRun });
