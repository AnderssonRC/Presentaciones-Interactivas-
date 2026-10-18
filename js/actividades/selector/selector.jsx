/* Actividad 'selector' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Selector de estudiante ---------- */
function SelectorRun({ config, tool, remoteSignal }) {
  const names = (config.items || []).filter((x) => x.trim());
  const [display, setDisplay] = React.useState('¿Quién será?');
  const [picking, setPicking] = React.useState(false);
  const [picked, setPicked] = React.useState(false);
  // Guarda el intervalo y el timeout activos para poder cancelarlos si el
  // componente se desmonta a mitad de la animación (cambio de diapositiva).
  const timersRef = React.useRef({ interval: null, timeout: null });
  React.useEffect(() => () => {
    clearInterval(timersRef.current.interval);
    clearTimeout(timersRef.current.timeout);
  }, []);

  const pick = () => {
    if (picking || !names.length) return;
    setPicking(true); setPicked(false);
    let i = 0;
    const t = setInterval(() => { setDisplay(names[i % names.length]); i++; }, 90);
    timersRef.current.interval = t;
    timersRef.current.timeout = setTimeout(() => {
      clearInterval(t);
      setDisplay(names[Math.floor(Math.random() * names.length)]);
      setPicking(false); setPicked(true);
    }, 1800);
  };
  useRemoteAction(remoteSignal, { primary: pick, next: pick });
  if (!names.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{
        marginTop: 60, minWidth: 900, padding: '60px 80px', borderRadius: 28,
        border: '5px solid ' + (picked ? tool.color : '#2A2F29'),
        background: picked ? tool.color : '#141814',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 110, lineHeight: 1.1,
        color: picked ? '#06140A' : '#F2F5EF', transition: 'all .25s ease',
      }}>{display}</div>
      <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={pick} disabled={picking}>
        {picking ? 'Eligiendo…' : picked ? 'Elegir otro' : '¡Elegir!'}
      </button>
    </div>
  );
}

Actividades.definir('selector', { Run: SelectorRun });
