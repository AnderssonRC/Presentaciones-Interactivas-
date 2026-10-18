/* Actividad 'dado' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Dado didáctico ---------- */
function DadoRun({ config, tool, remoteSignal }) {
  const [val, setVal] = React.useState(null);
  const [rolling, setRolling] = React.useState(false);
  const timersRef = React.useRef({ interval: null, timeout: null });
  React.useEffect(() => () => {
    clearInterval(timersRef.current.interval);
    clearTimeout(timersRef.current.timeout);
  }, []);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let i = 0;
    const t = setInterval(() => { setVal(1 + Math.floor(Math.random() * 6)); i++; }, 100);
    timersRef.current.interval = t;
    timersRef.current.timeout = setTimeout(() => { clearInterval(t); setVal(1 + Math.floor(Math.random() * 6)); setRolling(false); }, 1400);
  };
  useRemoteAction(remoteSignal, { primary: roll, next: roll });
  const DOTS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{
        marginTop: 60, width: 340, height: 340, borderRadius: 56, background: '#F2F5EF',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: 56, gap: 10,
        transform: rolling ? 'rotate(8deg) scale(1.04)' : 'none', transition: 'transform .15s ease',
        boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)',
      }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{ display: 'grid', placeItems: 'center' }}>
            {val !== null && DOTS[val].includes(i) && <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0B0E0B' }}></div>}
          </div>
        ))}
      </div>
      <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={roll} disabled={rolling}>
        {rolling ? 'Rodando…' : val ? 'Lanzar de nuevo' : '¡Lanzar!'}
      </button>
    </div>
  );
}

Actividades.definir('dado', { Run: DadoRun });
