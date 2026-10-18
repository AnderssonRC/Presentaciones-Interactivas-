/* Actividad 'pares' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Une los pares ----------
   El docente define parejas en el editor (una por línea: izquierda = derecha).
   Cada lado puede ser texto o imagen (prefijo "img:" + URL).
   En Presentar: se barajan ambas columnas; se resuelve por clic
   (clic en un ítem de la izquierda y luego en su pareja a la derecha). */

function ParesRun({ config, tool, remoteSignal }) {
  const pares = React.useMemo(() => parsePares(config.items), [config.items]);
  const seed = React.useMemo(() => (config.items || []).join('|').length + pares.length * 7, [config.items]);

  // Columnas barajadas de forma independiente.
  const colIzq = React.useMemo(() => barajar(pares.map((p) => p.id), seed + 1), [pares, seed]);
  const colDer = React.useMemo(() => barajar(pares.map((p) => p.id), seed + 2), [pares, seed]);
  const byId = React.useMemo(() => Object.fromEntries(pares.map((p) => [p.id, p])), [pares]);

  const [selIzq, setSelIzq] = React.useState(null);     // id elegido en la izquierda
  const [resueltos, setResueltos] = React.useState([]); // ids ya emparejados
  const [errorPar, setErrorPar] = React.useState(null); // id que parpadea en rojo

  const reset = () => { setSelIzq(null); setResueltos([]); setErrorPar(null); };
  React.useEffect(() => { reset(); }, [config.items]);

  const elegirIzq = (id) => { if (resueltos.includes(id)) return; setSelIzq(id); setErrorPar(null); };
  const elegirDer = (id) => {
    if (resueltos.includes(id)) return;
    if (selIzq == null) return;
    if (selIzq === id) {
      setResueltos((r) => [...r, id]); setSelIzq(null);
    } else {
      setErrorPar(id);
      setTimeout(() => setErrorPar(null), 600);
      setSelIzq(null);
    }
  };

  // Control remoto: acción principal = reiniciar el ejercicio.
  useRemoteAction(remoteSignal, { primary: reset, next: reset });

  if (!pares.length) return <FichaRun config={config} tool={tool} />;
  const completo = resueltos.length === pares.length;

  const celdaBase = {
    width: 560, minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px 22px', borderRadius: 18, border: '3px solid #2A2F29', background: '#141814',
    color: '#F2F5EF', cursor: 'pointer', boxSizing: 'border-box', transition: 'all .15s',
  };
  const estiloIzq = (id) => {
    if (resueltos.includes(id)) return { ...celdaBase, borderColor: '#11F555', background: 'rgba(17,245,85,.12)', cursor: 'default' };
    if (selIzq === id) return { ...celdaBase, borderColor: '#116CF5', background: 'rgba(17,108,245,.16)' };
    return celdaBase;
  };
  const estiloDer = (id) => {
    if (resueltos.includes(id)) return { ...celdaBase, borderColor: '#11F555', background: 'rgba(17,245,85,.12)', cursor: 'default' };
    if (errorPar === id) return { ...celdaBase, borderColor: '#F53711', background: 'rgba(245,55,17,.16)' };
    return celdaBase;
  };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ display: 'flex', gap: 80, marginTop: 30, alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {colIzq.map((id) => (
            <div key={'i' + id} style={estiloIzq(id)} onClick={() => elegirIzq(id)}>
              <LadoCelda lado={byId[id].izq} />
            </div>
          ))}
        </div>
        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {colDer.map((id) => (
            <div key={'d' + id} style={estiloDer(id)} onClick={() => elegirDer(id)}>
              <LadoCelda lado={byId[id].der} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: completo ? '#11F555' : '#9AA396' }}>
          {completo ? '¡Todos los pares unidos! 🎉' : (resueltos.length + ' / ' + pares.length + ' unidos')}
        </div>
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}

Actividades.definir('pares', { Run: ParesRun });
