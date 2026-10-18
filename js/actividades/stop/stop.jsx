/* Actividad 'stop' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Stop (juego de categorías) ---------- */
function StopRun({ config, tool }) {
  const categorias = (config.items || []).map((s) => s.trim()).filter(Boolean);
  const [letra, setLetra] = React.useState(null);
  const [animando, setAnimando] = React.useState(false);
  const [respuestas, setRespuestas] = React.useState({}); // { "cat": "texto" }
  const [stop, setStop] = React.useState(false);
  const [usadas, setUsadas] = React.useState([]); // letras ya jugadas

  if (!categorias.length) return <FichaRun config={config} tool={tool} />;

  const ABC = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');

  const elegirLetra = (L) => {
    setLetra(L);
    setAnimando(true);
    setRespuestas({});
    setStop(false);
    if (!usadas.includes(L)) setUsadas((u) => [...u, L]);
    // la animación dura ~1.4s; luego queda pequeña al lado
    setTimeout(() => setAnimando(false), 1400);
  };

  // El docente puede pulsar una letra del teclado físico (genera sorpresa).
  const norm = (s) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-ZÑ]/g, '');
  React.useEffect(() => {
    const onKey = (e) => {
      if (letra) return; // ya hay una letra en juego
      if (e.key && e.key.length === 1) {
        const L = e.key === 'ñ' || e.key === 'Ñ' ? 'Ñ' : norm(e.key);
        if (L && L.length === 1) elegirLetra(L);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [letra]);

  const setResp = (cat, val) => setRespuestas((r) => ({ ...r, [cat]: val }));

  return (
    <div className="act-stage" style={{ justifyContent:'flex-start', paddingTop:16, height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />

      {/* Selector de letras */}
      {!letra && (
        <div style={{ marginTop:0, flex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:28, color:'var(--muted)', marginBottom:16, textAlign:'center' }}>Pulsa una letra en el teclado… o elígela aquí:</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:12, justifyContent:'center', maxWidth:1000 }}>
            {ABC.map((L) => {
              const yaUsada = usadas.includes(L);
              return (
                <button key={L} onClick={() => elegirLetra(L)}
                  style={{ width:96, height:96, borderRadius:16, cursor:'pointer', position:'relative',
                    border: yaUsada ? '3px solid ' + tool.color : 'none',
                    background: yaUsada ? 'transparent' : tool.color,
                    color: yaUsada ? tool.color : '#06140A',
                    opacity: yaUsada ? 0.55 : 1,
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:46 }}>{L}</button>
              );
            })}
          </div>
          {usadas.length > 0 && (
            <div style={{ marginTop:18, display:'flex', alignItems:'center', gap:14 }}>
              <span style={{ fontSize:20, color:'var(--muted)' }}>Ya jugadas: {usadas.join(' · ')}</span>
              <button onClick={() => setUsadas([])}
                style={{ background:'transparent', color:'#9AA396', border:'2px solid #2A2F29', borderRadius:10, padding:'6px 16px', fontSize:16, cursor:'pointer' }}>
                Reiniciar
              </button>
            </div>
          )}
        </div>
      )}

      {/* Letra grande animada (centro -> se encoge al lado) */}
      {letra && animando && (
        <div style={{
          position:'fixed', inset:0, display:'grid', placeItems:'center', zIndex:5, pointerEvents:'none',
          animation:'stopLetra 1.4s ease forwards',
        }}>
          <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:520, color:tool.color, lineHeight:1 }}>{letra}</div>
        </div>
      )}

      {/* Cuadro de juego + STOP, centrado verticalmente */}
      {letra && !animando && (
        <div style={{ flex:1, width:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:26, overflow:'hidden' }}>
          <div style={{ display:'flex', gap:36, alignItems:'flex-start', width:'100%', justifyContent:'center' }}>
            {/* letra pequeña al lado */}
            <div style={{ flexShrink:0, textAlign:'center' }}>
              <div style={{ fontSize:22, color:'var(--muted)', letterSpacing:'.1em' }}>LETRA</div>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:180, color:tool.color, lineHeight:1 }}>{letra}</div>
              <button className="act-bigbtn" style={{ background:'transparent', color:'#9AA396', border:'3px solid #2A2F29', fontSize:24, padding:'12px 28px', marginTop:10 }}
                onClick={() => { setLetra(null); setRespuestas({}); setStop(false); }}>
                Otra letra
              </button>
            </div>

            {/* tabla de categorías */}
            <div style={{ flex:'0 1 1000px', maxHeight:620, overflowY:'auto', borderRadius:16, border:'2px solid #2A2F29' }}>
              {categorias.map((cat, i) => (
                <div key={i} style={{ display:'flex', alignItems:'stretch', borderBottom: i < categorias.length-1 ? '2px solid #2A2F29' : 'none' }}>
                  <div style={{ width:300, flexShrink:0, padding:'18px 22px', background:'#161A15', display:'flex', alignItems:'center',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:30, color:'#F2F5EF' }}>{cat}</div>
                  <input value={respuestas[cat] || ''} onChange={(e) => setResp(cat, e.target.value)}
                    disabled={stop}
                    placeholder={stop ? '' : 'Escribe con ' + letra + '…'}
                    style={{ flex:1, border:'none', background: stop ? '#10130F' : '#1C201B', color:'#F2F5EF',
                      fontSize:30, padding:'0 22px', fontFamily:'var(--font-body)', outline:'none' }} />
                </div>
              ))}
            </div>
          </div>

          <button className="act-bigbtn" style={{ background: stop ? '#2A2F29' : '#F53711', color: stop ? '#9AA396' : '#FFF', fontSize:34, padding:'18px 60px', fontFamily:'var(--font-display)', fontWeight:800 }}
            onClick={() => setStop(!stop)}>
            {stop ? 'Seguir editando' : '✋ ¡STOP!'}
          </button>
        </div>
      )}
    </div>
  );
}

Actividades.definir('stop', { Run: StopRun });
