/* Actividad 'errores' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Encuentra las diferencias ---------- */
function DiferenciasRun({ config, tool }) {
  // config.modo: 'dos' (dos imágenes) | 'una' (una imagen dividida)
  // config.img1, config.img2: URLs (en modo 'una' solo se usa img1)
  // config.puntos: [{x, y}] en porcentaje (0-100) sobre la imagen mostrada
  const modo = config.modo || 'dos';
  const img1 = config.img1 || '';
  const img2 = config.img2 || '';
  const puntos = Array.isArray(config.puntos) ? config.puntos : [];
  const RADIO = 6; // % de tolerancia para acertar

  const [encontradas, setEncontradas] = React.useState([]); // índices acertados
  const [fallo, setFallo] = React.useState(null); // {x,y} de un clic fallido (parpadea)

  if ((!img1) || !puntos.length) return <FichaRun config={config} tool={tool} />;

  const total = puntos.length;
  const gano = encontradas.length === total;

  const clicEn = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    // ¿cerca de algún punto no encontrado?
    let acerto = -1;
    puntos.forEach((p, i) => {
      if (encontradas.includes(i)) return;
      const dist = Math.hypot(p.x - x, p.y - y);
      if (dist <= RADIO && acerto === -1) acerto = i;
    });
    if (acerto >= 0) {
      setEncontradas((arr) => [...arr, acerto]);
      setFallo(null);
    } else {
      setFallo({ x, y });
      setTimeout(() => setFallo(null), 600);
    }
  };

  // marcadores de aciertos (círculos sobre la imagen)
  const Marcadores = () => (
    <>
      {encontradas.map((i) => (
        <div key={i} style={{ position:'absolute', left: puntos[i].x + '%', top: puntos[i].y + '%',
          width:54, height:54, marginLeft:-27, marginTop:-27, borderRadius:'50%',
          border:'5px solid #11F555', boxShadow:'0 0 16px rgba(17,245,85,.7)', pointerEvents:'none' }} />
      ))}
      {fallo && (
        <div style={{ position:'absolute', left: fallo.x + '%', top: fallo.y + '%',
          width:40, height:40, marginLeft:-20, marginTop:-20, borderRadius:'50%',
          border:'4px solid #F53711', pointerEvents:'none', animation:'fade-up .3s' }}>
          <div style={{ position:'absolute', inset:0, display:'grid', placeItems:'center', color:'#F53711', fontSize:30, fontWeight:800 }}>✕</div>
        </div>
      )}
    </>
  );

  const imgStyle = { display:'block', width:'100%', height:'100%', objectFit:'contain', userSelect:'none', pointerEvents:'none' };

  return (
    <div className="act-stage" style={{ justifyContent:'flex-start', paddingTop:8, height:'100%', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:24, flexShrink:0 }}>
        <div className="act-kicker" style={{ color: tool.color, display:'flex', alignItems:'center', gap:10, fontSize:22 }}>
          <Icon name={tool.icon} size={24} /> {config.titulo}
        </div>
        <div style={{ fontSize:26, fontWeight:800, color: gano ? '#11F555' : 'var(--muted)' }}>
          {gano ? '🎉 ¡Todas encontradas!' : 'Encontradas: ' + encontradas.length + '/' + total}
        </div>
      </div>

      {/* Imágenes */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap: modo === 'dos' ? 18 : 0, marginTop:10, width:'100%', overflow:'hidden' }}>
        {modo === 'dos' ? (
          <>
            <div onClick={clicEn} style={{ position:'relative', flex:'0 1 49%', maxHeight:'100%', cursor:'crosshair', borderRadius:14, overflow:'hidden', border:'2px solid #2A2F29' }}>
              <img src={img1} style={imgStyle} alt="" />
              <Marcadores />
            </div>
            <div onClick={clicEn} style={{ position:'relative', flex:'0 1 49%', maxHeight:'100%', cursor:'crosshair', borderRadius:14, overflow:'hidden', border:'2px solid #2A2F29' }}>
              <img src={img2 || img1} style={imgStyle} alt="" />
              <Marcadores />
            </div>
          </>
        ) : (
          <div onClick={clicEn} style={{ position:'relative', maxWidth:'100%', maxHeight:'100%', cursor:'crosshair', borderRadius:14, overflow:'hidden', border:'2px solid #2A2F29' }}>
            <img src={img1} style={imgStyle} alt="" />
            <Marcadores />
          </div>
        )}
      </div>

      <button className="act-bigbtn" style={{ background:'transparent', color:'#9AA396', border:'2px solid #2A2F29', fontSize:20, padding:'8px 24px', marginTop:8, flexShrink:0 }}
        onClick={() => setEncontradas([])}>
        Reiniciar
      </button>
    </div>
  );
}

/* Editor especial para Encuentra las diferencias:
   modo + URLs + marcar puntos con clic sobre la imagen. */
function DiferenciasEditor({ current, curIdx, updateSlide }) {
  const cfg = current.config;
  const modo = cfg.modo || 'dos';
  const puntos = Array.isArray(cfg.puntos) ? cfg.puntos : [];

  const set = (cambios) => updateSlide(curIdx, { ...current, config: { ...cfg, ...cambios } });

  const marcar = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    set({ puntos: [...puntos, { x, y }] });
  };
  const borrarPunto = (i, ev) => {
    ev.stopPropagation();
    set({ puntos: puntos.filter((_, j) => j !== i) });
  };

  const imgRef = cfg.img1 || '';

  return (
    <div>
      <div className="field">
        <label>Modo de imágenes</label>
        <select value={modo} onChange={(e) => set({ modo: e.target.value })}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          <option value="dos">Dos imágenes separadas (original y modificada)</option>
          <option value="una">Una sola imagen (ya tiene las dos mitades)</option>
        </select>
      </div>

      <div className="field">
        <label>{modo === 'dos' ? 'URL de la imagen 1 (izquierda)' : 'URL de la imagen'}</label>
        <input type="text" value={cfg.img1 || ''} onChange={(e) => set({ img1: e.target.value })} placeholder="https://..." />
      </div>

      {modo === 'dos' && (
        <div className="field">
          <label>URL de la imagen 2 (derecha, la modificada)</label>
          <input type="text" value={cfg.img2 || ''} onChange={(e) => set({ img2: e.target.value })} placeholder="https://..." />
        </div>
      )}

      {imgRef ? (
        <div className="field">
          <label>Haz clic sobre la imagen para marcar cada diferencia ({puntos.length} marcadas)</label>
          <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', border: '2px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair' }}
            onClick={marcar}>
            <img src={imgRef} style={{ display: 'block', maxWidth: '100%', maxHeight: 360, userSelect: 'none' }} alt="" />
            {puntos.map((p, i) => (
              <div key={i} onClick={(ev) => borrarPunto(i, ev)} title="Clic para borrar"
                style={{ position: 'absolute', left: p.x + '%', top: p.y + '%', width: 26, height: 26, marginLeft: -13, marginTop: -13,
                  borderRadius: '50%', background: 'rgba(245,55,17,.85)', border: '2px solid #fff', color: '#fff',
                  display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{i + 1}</div>
            ))}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
            Clic en la imagen para añadir una diferencia. Clic en un círculo rojo para borrarlo. Marca el mismo lugar donde está la diferencia.
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Pega una URL de imagen arriba para poder marcar las diferencias.</div>
      )}
    </div>
  );
}

Actividades.definir('errores', { Run: DiferenciasRun, Editor: DiferenciasEditor });
