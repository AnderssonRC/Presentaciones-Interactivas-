/* Actividad 'acertijo' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Acertijo ---------- */
function AcertijoRun({ config, tool }) {
  // Cada item: "enunciado | respuesta | URL"  (URL opcional)
  const acertijos = (config.items || [])
    .map((l) => {
      const partes = l.split('|').map((s) => s.trim());
      return { enunciado: partes[0] || '', respuesta: partes[1] || '', url: partes[2] || '' };
    })
    .filter((a) => a.enunciado && a.respuesta);

  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  const [qi, setQi] = React.useState(0);
  const [texto, setTexto] = React.useState('');
  const [estado, setEstado] = React.useState(null); // null | 'bien' | 'mal'

  if (!acertijos.length) return <FichaRun config={config} tool={tool} />;
  const a = acertijos[qi % acertijos.length];

  const tipoMedia = (url) => {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.match(/youtube\.com|youtu\.be/)) return 'youtube';
    if (u.match(/\.(mp4|webm|ogg)(\?|$)/)) return 'video';
    return 'imagen';
  };
  const youtubeId = (url) => { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/); return m ? m[1] : ''; };
  const tipo = tipoMedia(a.url);

  const comprobar = () => {
    if (!texto.trim()) return;
    setEstado(norm(texto) === norm(a.respuesta) ? 'bien' : 'mal');
  };
  const siguiente = () => { setQi((qi + 1) % acertijos.length); setTexto(''); setEstado(null); };

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Enter') { if (estado === 'bien' && acertijos.length > 1) siguiente(); else comprobar(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [texto, estado, qi]);

  return (
    <div className="act-stage" style={{ justifyContent:'flex-start', paddingTop:16, height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      {acertijos.length > 1 && (
        <div style={{ fontSize:22, color:'var(--muted)', marginTop:4 }}>Acertijo {(qi % acertijos.length) + 1} de {acertijos.length}</div>
      )}

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:22, width:'100%', overflow:'hidden' }}>
        {/* Enunciado */}
        <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:52, lineHeight:1.2, textAlign:'center', maxWidth:1400 }}>
          {a.enunciado}
        </div>

        {/* Media opcional */}
        {a.url && tipo === 'imagen' && (
          <img src={a.url} alt="" style={{ maxHeight:360, maxWidth:'70%', borderRadius:16, objectFit:'contain' }} />
        )}
        {a.url && tipo === 'video' && (
          <video src={a.url} controls style={{ maxHeight:360, maxWidth:'70%', borderRadius:16 }} />
        )}
        {a.url && tipo === 'youtube' && (
          <iframe width="640" height="360" style={{ borderRadius:16, border:'none' }}
            src={'https://www.youtube.com/embed/' + youtubeId(a.url)} allow="encrypted-media" allowFullScreen></iframe>
        )}

        {/* Campo de respuesta */}
        <input value={texto} onChange={(e) => { setTexto(e.target.value); setEstado(null); }}
          placeholder="Escribe la respuesta…"
          style={{ width:680, maxWidth:'90%', fontSize:38, padding:'18px 26px', borderRadius:16, textAlign:'center',
            border:'3px solid ' + (estado === 'bien' ? '#11F555' : estado === 'mal' ? '#F53711' : '#2A2F29'),
            background:'#1C201B', color:'#F2F5EF', fontFamily:'var(--font-body)', outline:'none' }} />

        {/* Resultado */}
        {estado === 'bien' && (
          <div className="fade-up" style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:40, color:'#11F555' }}>🎉 ¡Correcto!</div>
        )}
        {estado === 'mal' && (
          <div className="fade-up" style={{ fontSize:32, fontWeight:700, color:'#F53711' }}>Inténtalo de nuevo…</div>
        )}
      </div>

      {/* Botones */}
      <div style={{ display:'flex', gap:16, marginTop:10, flexShrink:0 }}>
        <button className="act-bigbtn" style={{ background: texto.trim() ? tool.color : '#2A2F29', color: texto.trim() ? '#06140A' : '#9AA396', fontSize:30, padding:'14px 44px' }}
          onClick={comprobar} disabled={!texto.trim()}>
          Comprobar
        </button>
        {estado === 'bien' && acertijos.length > 1 && (
          <button className="act-bigbtn fade-up" style={{ background:'#F2F5EF', color:'#08120B', fontSize:30, padding:'14px 44px' }} onClick={siguiente}>
            Siguiente →
          </button>
        )}
      </div>
    </div>
  );
}

Actividades.definir('acertijo', { Run: AcertijoRun });
