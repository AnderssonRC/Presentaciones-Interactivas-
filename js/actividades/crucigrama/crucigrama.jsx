/* Actividad 'crucigrama' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Crucigrama ---------- */
function CrucigramaRun({ config, tool }) {
  const norm = (p) => p.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-ZÑ]/g,'');
  const entradas = (config.items || [])
    .map((l) => { const [w, pista] = l.split('=').map((s) => s.trim()); return { palabra: norm(w || ''), pista: (pista || '').trim() }; })
    .filter((e) => e.palabra.length >= 2);

  const [seed, setSeed] = React.useState(0);

  const cruci = React.useMemo(() => {
    const palabras = entradas.map((e) => e.palabra);
    if (!palabras.length) return null;
    const pistaDe = {}; entradas.forEach((e) => { pistaDe[e.palabra] = e.pista; });
    const orden = [...palabras].sort((a, b) => b.length - a.length);
    const colocadas = [], ocupado = {};
    const key = (r, c) => r + ',' + c;
    const intentar = (p, r, c, horiz) => {
      let cruces = 0;
      for (let i=0;i<p.length;i++){
        const rr=horiz?r:r+i, cc=horiz?c+i:c, ex=ocupado[key(rr,cc)];
        if(ex){ if(ex!==p[i]) return null; cruces++; }
        else { if(horiz){ if(ocupado[key(rr-1,cc)]||ocupado[key(rr+1,cc)]) return null; }
               else { if(ocupado[key(rr,cc-1)]||ocupado[key(rr,cc+1)]) return null; } }
      }
      const aR=horiz?r:r-1,aC=horiz?c-1:c,dR=horiz?r:r+p.length,dC=horiz?c+p.length:c;
      if(ocupado[key(aR,aC)]||ocupado[key(dR,dC)]) return null;
      return cruces;
    };
    const poner = (p, r, c, horiz) => {
      const celdas=[];
      for(let i=0;i<p.length;i++){ const rr=horiz?r:r+i,cc=horiz?c+i:c; ocupado[key(rr,cc)]=p[i]; celdas.push({r:rr,c:cc}); }
      colocadas.push({ palabra:p, r, c, horizontal:horiz, celdas, pista:pistaDe[p] });
    };
    poner(orden[0], 0, 0, true);
    for (let idx=1; idx<orden.length; idx++){
      const p=orden[idx]; let mejor=null;
      for(const col of colocadas)
        for(let i=0;i<col.palabra.length;i++)
          for(let j=0;j<p.length;j++){
            if(col.palabra[i]!==p[j]) continue;
            const cr=col.celdas[i].r, cc=col.celdas[i].c, horiz=!col.horizontal;
            const r0=horiz?cr:cr-j, c0=horiz?cc-j:cc;
            const cz=intentar(p,r0,c0,horiz);
            if(cz!==null&&cz>=1){ if(!mejor||cz>mejor.cruces) mejor={r:r0,c:c0,horiz,cruces:cz}; }
          }
      if(mejor) poner(p,mejor.r,mejor.c,mejor.horiz);
    }
    let minR=Infinity,minC=Infinity,maxR=-Infinity,maxC=-Infinity;
    for(const k in ocupado){ const [r,c]=k.split(',').map(Number);
      minR=Math.min(minR,r);minC=Math.min(minC,c);maxR=Math.max(maxR,r);maxC=Math.max(maxC,c); }
    const rows=maxR-minR+1, cols=maxC-minC+1;
    const grid=Array.from({length:rows},()=>Array(cols).fill(null));
    colocadas.forEach((col)=>{
      const pl = norm(col.palabra);
      col.r-=minR; col.c-=minC;
      col.celdas=col.celdas.map((cel)=>({r:cel.r-minR,c:cel.c-minC}));
      col.celdas.forEach((cel, i)=>{ grid[cel.r][cel.c]=pl[i]; });
    });
    // numerar: cada celda que inicia una palabra recibe número
    const numero = {}; let n = 0;
    const inicios = colocadas.map((col) => col.celdas[0].r + ',' + col.celdas[0].c);
    // ordenar por posición (arriba-izquierda primero) para numeración clásica
    const ordenadas = [...colocadas].sort((a,b)=> a.celdas[0].r - b.celdas[0].r || a.celdas[0].c - b.celdas[0].c);
    const numDe = {};
    for (const col of ordenadas) {
      const k = col.celdas[0].r + ',' + col.celdas[0].c;
      if (!(k in numero)) { n++; numero[k] = n; }
      col.num = numero[k];
    }
    return { grid, rows, cols, colocadas, numero };
  }, [entradas.map((e)=>e.palabra).join('|'), seed]);

  // letras escritas por celda: { "r,c": "X" }
  const [letras, setLetras] = React.useState({});
  const [activa, setActiva] = React.useState(null); // "r,c"
  React.useEffect(() => { setLetras({}); setActiva(null); }, [seed]);

  // teclado físico para la celda activa
  React.useEffect(() => {
    const onKey = (e) => {
      if (!activa) return;
      if (e.key === 'Backspace') { setLetras((L)=>{ const n={...L}; delete n[activa]; return n; }); return; }
      if (e.key.length === 1 && /[a-zA-ZñÑ]/.test(e.key)) {
        const c = norm(e.key);
        setLetras((L) => ({ ...L, [activa]: c }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activa]);

  if (!cruci) return <FichaRun config={config} tool={tool} />;
  const { grid, rows, cols, colocadas, numero } = cruci;

  // ¿celda correcta?
  const correcta = (r, c) => grid[r][c] && letras[r+','+c] === grid[r][c];
  const completo = colocadas.every((col) => col.celdas.every((cel) => letras[cel.r+','+cel.c] === grid[cel.r][cel.c]));

  const horiz = colocadas.filter((c)=>c.horizontal).sort((a,b)=>a.num-b.num);
  const verti = colocadas.filter((c)=>!c.horizontal).sort((a,b)=>a.num-b.num);

  // Tamaño de casilla adaptado al espacio disponible.
  // Zona de la cuadrícula deja margen seguro para el panel de pistas (derecha).
  const anchoDisp = 920, altoDisp = 780;
  const porAncho = Math.floor((anchoDisp - (cols - 1) * 3) / cols);
  const porAlto = Math.floor((altoDisp - (rows - 1) * 3) / rows);
  const cell = Math.max(38, Math.min(96, porAncho, porAlto));
  const fcell = Math.round(cell * 0.5);

  return (
    <div className="act-stage" style={{ flexDirection:'row', gap:40, alignItems:'center', justifyContent:'space-between', height:'100%', overflow:'hidden', width:'100%', padding:'0 60px' }}>
      {/* Cuadrícula */}
      <div style={{ flex:'1 1 0', minWidth:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols}, ${cell}px)`, gap:3 }}>
          {grid.map((fila, r) => fila.map((ch, c) => {
            if (!ch) return <div key={r+'-'+c} style={{ width:cell, height:cell }} />;
            const k = r+','+c;
            const num = numero[k];
            const esActiva = activa === k;
            const ok = correcta(r, c);
            return (
              <div key={r+'-'+c} onClick={() => setActiva(k)}
                style={{ width:cell, height:cell, position:'relative', borderRadius:6, cursor:'pointer',
                  background: ok ? tool.color : '#F2F5EF',
                  border: esActiva ? '3px solid '+tool.color : '1px solid #999',
                  display:'grid', placeItems:'center',
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:fcell,
                  color: ok ? '#08120B' : '#0B0E0B', transition:'all .1s ease' }}>
                {num && <span style={{ position:'absolute', top:2, left:4, fontSize:Math.round(cell*0.22), fontWeight:700, color:'#555' }}>{num}</span>}
                {letras[k] || ''}
              </div>
            );
          }))}
        </div>
        <button className="act-bigbtn" style={{ background:tool.color, color:'#08120B', fontSize:22, padding:'10px 26px', marginTop:20 }} onClick={()=>setSeed((s)=>s+1)}>
          🔀 Reorganizar
        </button>
      </div>

      {/* Pistas */}
      <div style={{ width:520, flexShrink:0, maxHeight:'100%', display:'flex', flexDirection:'column', overflow:'hidden', textAlign:'left' }}>
        <ActHeader tool={tool} titulo={config.titulo} compact />
        {completo && <div className="fade-up" style={{ marginTop:10, fontFamily:'var(--font-display)', fontWeight:800, fontSize:36, color:'#11F555' }}>🎉 ¡Crucigrama completo!</div>}
        <div style={{ marginTop:14, overflowY:'auto', paddingRight:14, flex:1 }}>
          {[{t:'Horizontales', lista:horiz}, {t:'Verticales', lista:verti}].map((g)=> g.lista.length ? (
            <div key={g.t} style={{ marginBottom:22 }}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:25, color:tool.color, marginBottom:12, textAlign:'left' }}>{g.t}</div>
              {g.lista.map((col)=>{
                const resuelta = col.celdas.every((cel)=>letras[cel.r+','+cel.c]===grid[cel.r][cel.c]);
                return (
                  <div key={col.num+col.palabra} style={{ display:'flex', gap:12, marginBottom:11, fontSize:28, lineHeight:1.35, textAlign:'left',
                    color: resuelta ? '#11F555' : '#F2F5EF', textDecoration: resuelta?'line-through':'none' }}>
                    <span style={{ fontWeight:800, color:tool.color, minWidth:30, flexShrink:0 }}>{col.num}.</span>
                    <span style={{ flex:1 }}>{col.pista || '(' + col.palabra.length + ' letras)'}</span>
                  </div>
                );
              })}
            </div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}

Actividades.definir('crucigrama', { Run: CrucigramaRun });
