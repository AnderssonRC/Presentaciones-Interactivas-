/* Actividad 'ordena' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Ordena los pasos ----------
   El docente escribe los pasos EN ORDEN CORRECTO (uno por línea).
   En Presentar se muestran barajados; el grupo los arrastra y suelta para
   reordenar y pulsa "Comprobar": cada paso se marca verde (posición correcta)
   o rojo (incorrecta). config.items = pasos en su orden correcto. */
function OrdenaRun({ config, tool, remoteSignal }) {
  // Cada paso lleva su índice correcto (orden en que lo escribió el docente).
  const pasosCorrectos = React.useMemo(
    () => (config.items || []).map((t, i) => ({ id: i, texto: (t || '').trim() })).filter((p) => p.texto),
    [config.items]
  );
  const seed = React.useMemo(() => (config.items || []).join('|').length + pasosCorrectos.length * 11, [config.items]);

  // Orden inicial barajado (estable mientras no cambie la actividad).
  const inicial = React.useMemo(() => barajar(pasosCorrectos, seed), [pasosCorrectos, seed]);
  const [orden, setOrden] = React.useState(inicial);
  const [comprobado, setComprobado] = React.useState(false);
  const arrastreRef = React.useRef(null);

  const reset = () => { setOrden(barajar(pasosCorrectos, seed + Math.floor(Math.random() * 999))); setComprobado(false); };
  React.useEffect(() => { setOrden(inicial); setComprobado(false); }, [inicial]);

  if (!pasosCorrectos.length) return <FichaRun config={config} tool={tool} />;

  // Reordenar al soltar: mueve el paso arrastrado a la posición del destino.
  const soltarEn = (destinoId) => {
    const origenId = arrastreRef.current;
    arrastreRef.current = null;
    if (origenId == null || origenId === destinoId) return;
    setOrden((prev) => {
      const arr = prev.slice();
      const from = arr.findIndex((p) => p.id === origenId);
      const to = arr.findIndex((p) => p.id === destinoId);
      if (from < 0 || to < 0) return prev;
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
    setComprobado(false);
  };

  const aciertos = orden.filter((p, i) => p.id === i).length;
  const completo = comprobado && aciertos === orden.length;

  useRemoteAction(remoteSignal, { primary: () => setComprobado(true), next: reset });

  const colorPaso = (p, i) => {
    if (!comprobado) return { border: '3px solid #2A2F29', background: '#141814' };
    return p.id === i
      ? { border: '3px solid #11F555', background: 'rgba(17,245,85,.12)' }
      : { border: '3px solid #F53711', background: 'rgba(245,55,17,.12)' };
  };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ width: 1300, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orden.map((p, i) => (
          <div key={p.id} draggable={!comprobado}
            onDragStart={() => { arrastreRef.current = p.id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltarEn(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 22, padding: '20px 26px',
              borderRadius: 18, cursor: comprobado ? 'default' : 'grab',
              ...colorPaso(p, i), transition: 'all .15s',
            }}>
            <div style={{
              width: 58, height: 58, flexShrink: 0, borderRadius: 14,
              background: tool.color, color: '#06140A', display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
            }}>{i + 1}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: '#F2F5EF' }}>{p.texto}</div>
            {comprobado && (
              <div style={{ fontSize: 34, fontWeight: 800, color: p.id === i ? '#11F555' : '#F53711' }}>
                {p.id === i ? '✓' : '✗'}
              </div>
            )}
            {!comprobado && <div style={{ fontSize: 30, color: '#5C6359' }}>⠿</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 18 }}>
        {!comprobado ? (
          <button className="act-bigbtn" onClick={() => setComprobado(true)}
            style={{ background: tool.color, color: '#06140A', fontSize: 28, padding: '12px 40px', margin: 0 }}>
            Comprobar
          </button>
        ) : (
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: completo ? '#11F555' : '#9AA396' }}>
            {completo ? '¡Orden correcto! 🎉' : (aciertos + ' / ' + orden.length + ' en su lugar')}
          </div>
        )}
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          {comprobado ? 'Intentar de nuevo' : 'Barajar'}
        </button>
      </div>
      {!comprobado && (
        <div style={{ color: '#7B857A', fontSize: 22, marginTop: 10 }}>
          Arrastra los pasos para ponerlos en orden y pulsa Comprobar.
        </div>
      )}
    </div>
  );
}

Actividades.definir('ordena', { Run: OrdenaRun });
