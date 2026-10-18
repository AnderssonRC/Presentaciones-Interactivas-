/* Actividad 'memorama' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Memorama: parejas con texto o imagen ----------
   El docente define parejas (una por línea: A = B). Cada lado puede ser texto
   o imagen (prefijo "img:"). En Presentar las cartas se barajan boca abajo;
   se voltean de a dos por clic; si forman pareja quedan reveladas. */
function MemoramaRun({ config, tool, remoteSignal }) {
  const pares = React.useMemo(() => parsePares(config.items), [config.items]);
  // Cada par genera dos cartas que comparten parId.
  const cartasBase = React.useMemo(() => {
    const arr = [];
    pares.forEach((p) => {
      arr.push({ cid: 'a' + p.id, parId: p.id, lado: p.izq });
      arr.push({ cid: 'b' + p.id, parId: p.id, lado: p.der });
    });
    const seed = (config.items || []).join('|').length + pares.length * 13;
    return barajar(arr, seed);
  }, [pares, config.items]);

  const [volteadas, setVolteadas] = React.useState([]); // cids visibles este turno (máx 2)
  const [encontradas, setEncontradas] = React.useState([]); // parId resueltos
  const [movs, setMovs] = React.useState(0);
  const [bloqueo, setBloqueo] = React.useState(false);

  const reset = () => { setVolteadas([]); setEncontradas([]); setMovs(0); setBloqueo(false); };
  React.useEffect(() => { reset(); }, [config.items]);

  const voltear = (carta) => {
    if (bloqueo) return;
    if (encontradas.includes(carta.parId)) return;
    if (volteadas.find((c) => c.cid === carta.cid)) return;
    const next = [...volteadas, carta];
    setVolteadas(next);
    if (next.length === 2) {
      setMovs((m) => m + 1);
      if (next[0].parId === next[1].parId) {
        setEncontradas((e) => [...e, next[0].parId]);
        setVolteadas([]);
      } else {
        setBloqueo(true);
        setTimeout(() => { setVolteadas([]); setBloqueo(false); }, 1100);
      }
    }
  };
  useRemoteAction(remoteSignal, { primary: reset, next: reset });

  if (!pares.length) return <FichaRun config={config} tool={tool} />;

  const total = cartasBase.length;
  const completo = encontradas.length === pares.length;
  // Distribución en columnas según cantidad (4–6 columnas).
  const cols = total <= 8 ? 4 : total <= 12 ? 4 : total <= 18 ? 6 : 6;

  const esVisible = (c) => volteadas.find((v) => v.cid === c.cid) || encontradas.includes(c.parId);

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{
        marginTop: 26, display: 'grid', gap: 18,
        gridTemplateColumns: 'repeat(' + cols + ', 230px)', justifyContent: 'center',
      }}>
        {cartasBase.map((c) => {
          const visible = esVisible(c);
          const resuelta = encontradas.includes(c.parId);
          return (
            <div key={c.cid} onClick={() => voltear(c)}
              style={{
                height: 150, borderRadius: 18, cursor: visible ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12,
                background: visible ? (resuelta ? 'rgba(17,245,85,.12)' : '#1B2018') : '#116CF5',
                border: '3px solid ' + (resuelta ? '#11F555' : visible ? '#2A2F29' : '#0B0E0B'),
                transition: 'all .2s', overflow: 'hidden', textAlign: 'center',
              }}>
              {visible ? (
                <LadoCelda lado={c.lado} />
              ) : (
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 60, color: 'rgba(255,255,255,.85)' }}>?</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: completo ? '#11F555' : '#9AA396' }}>
          {completo ? ('¡Completado en ' + movs + ' intentos! 🎉') : ('Parejas: ' + encontradas.length + ' / ' + pares.length + '  ·  Intentos: ' + movs)}
        </div>
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}

Actividades.definir('memorama', { Run: MemoramaRun });
