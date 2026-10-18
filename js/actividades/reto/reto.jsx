/* Actividad 'reto' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Reto relámpago: rutina de pasos ---------- */
function RetoRun({ config, tool }) {
  const pasos = (config.items || [])
    .map((l) => {
      const [texto, url] = l.split('=').map((s) => s.trim());
      return { texto: texto || '', url: url || '' };
    })
    .filter((p) => p.texto);

  const [completados, setCompletados] = React.useState([]); // índices hechos
  const [abierto, setAbierto] = React.useState(null); // índice del reto abierto

  if (!pasos.length) return <FichaRun config={config} tool={tool} />;

  const marcar = (i) => {
    if (!completados.includes(i)) setCompletados((c) => [...c, i]);
    setAbierto(null);
  };
  const todoListo = completados.length === pasos.length;

  // detectar tipo de URL
  const tipoMedia = (url) => {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.match(/youtube\.com|youtu\.be/)) return 'youtube';
    if (u.match(/\.(mp4|webm|ogg)(\?|$)/)) return 'video';
    return 'imagen';
  };
  const youtubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/);
    return m ? m[1] : '';
  };

  // ---- Vista de un reto abierto ----
  if (abierto !== null) {
    const p = pasos[abierto];
    const tipo = tipoMedia(p.url);
    return (
      <div className="act-stage" style={{ justifyContent:'center' }}>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:34, color:tool.color, letterSpacing:'.1em' }}>
          RETO {abierto + 1} DE {pasos.length}
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:64, lineHeight:1.15, marginTop:18, maxWidth:1400, textAlign:'center' }}>
          {p.texto}
        </div>
        {p.url && tipo === 'imagen' && (
          <img src={p.url} alt="" style={{ marginTop:32, maxHeight:440, maxWidth:'80%', borderRadius:18, objectFit:'contain' }} />
        )}
        {p.url && tipo === 'video' && (
          <video src={p.url} controls autoPlay style={{ marginTop:32, maxHeight:440, maxWidth:'80%', borderRadius:18 }} />
        )}
        {p.url && tipo === 'youtube' && (
          <iframe width="760" height="428" style={{ marginTop:32, borderRadius:18, border:'none' }}
            src={'https://www.youtube.com/embed/' + youtubeId(p.url) + '?autoplay=1'}
            allow="autoplay; encrypted-media" allowFullScreen></iframe>
        )}
        <div style={{ display:'flex', gap:20, marginTop:40 }}>
          <button className="act-bigbtn" style={{ background:'#11F555', color:'#06140A', fontSize:32, padding:'18px 50px' }} onClick={() => marcar(abierto)}>
            ✓ Completado
          </button>
          <button className="act-bigbtn" style={{ background:'transparent', color:'#9AA396', border:'3px solid #2A2F29', fontSize:30, padding:'18px 40px' }} onClick={() => setAbierto(null)}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ---- Vista de la rutina (botones numerados) ----
  return (
    <div className="act-stage" style={{ justifyContent:'center' }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={todoListo ? '' : config.instrucciones} compact />

      {todoListo ? (
        <div className="fade-up" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:64, color:'#11F555', marginTop:40 }}>
          🎉 ¡Rutina completada!
        </div>
      ) : (
        <div style={{ marginTop:20, fontSize:28, color:'var(--muted)' }}>
          {completados.length}/{pasos.length} completados
        </div>
      )}

      <div style={{ display:'flex', flexWrap:'wrap', gap:28, marginTop:50, justifyContent:'center', maxWidth:1400 }}>
        {pasos.map((p, i) => {
          const hecho = completados.includes(i);
          return (
            <button key={i} onClick={() => setAbierto(i)}
              style={{
                width:170, height:170, borderRadius:28, border:'none', cursor:'pointer',
                fontFamily:'var(--font-display)', fontWeight:800, fontSize:74,
                background: hecho ? '#11F555' : tool.color,
                color:'#06140A', position:'relative',
                opacity: hecho ? 0.55 : 1, transition:'all .2s ease',
                boxShadow:'0 10px 28px -12px rgba(0,0,0,.6)',
              }}>
              {hecho ? '✓' : (i + 1)}
            </button>
          );
        })}
      </div>

      {todoListo && (
        <button className="act-bigbtn fade-up" style={{ background:'#F2F5EF', color:'#08120B', fontSize:28, padding:'16px 44px', marginTop:44 }} onClick={() => setCompletados([])}>
          Reiniciar rutina
        </button>
      )}
    </div>
  );
}

Actividades.definir('reto', { Run: RetoRun });
