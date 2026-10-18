/* Actividad 'sopa' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Sopa de letras ---------- */
function SopaRun({ config, tool }) {
  const ALFA = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ';
  const COLS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const DIRS_TIPO = { H: [[0,1],[0,-1]], V: [[1,0],[-1,0]], D: [[1,1],[1,-1],[-1,-1],[-1,1]] };
  const norm = (p) => p.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-ZÑ]/g,'');

  const entradas = (config.items || [])
    .map((l) => {
      let tipo = 'H', resto = l;
      const m = l.match(/^([HVD])\s*\|\s*(.*)$/i);
      if (m) { tipo = m[1].toUpperCase(); resto = m[2]; }
      const [w, pista] = resto.split('=').map((s) => s.trim());
      return { palabra: norm(w || ''), pista: (pista || '').trim(), tipo };
    })
    .filter((e) => e.palabra.length >= 2);

  const auto = Math.max(10, ...entradas.map((e) => e.palabra.length), 10) + 2;
  const size = Math.min(18, config.size || auto);
  const [seed, setSeed] = React.useState(0);

  const sopa = React.useMemo(() => {
    if (!entradas.length) return null;
    const grid = Array.from({ length: size }, () => Array(size).fill(''));
    const ubic = {};
    const cabe = (p,r,c,dr,dc) => {
      for (let i=0;i<p.length;i++){ const rr=r+dr*i,cc=c+dc*i;
        if(rr<0||cc<0||rr>=size||cc>=size) return false;
        if(grid[rr][cc] && grid[rr][cc]!==p[i]) return false; }
      return true;
    };
    for (const e of entradas) {
      const dirs = DIRS_TIPO[e.tipo] || DIRS_TIPO.H;
      for (let t=0;t<300;t++){
        const [dr,dc]=dirs[Math.floor(Math.random()*dirs.length)];
        const r=Math.floor(Math.random()*size), c=Math.floor(Math.random()*size);
        if(cabe(e.palabra,r,c,dr,dc)){
          const celdas=[];
          for(let i=0;i<e.palabra.length;i++){const rr=r+dr*i,cc=c+dc*i;grid[rr][cc]=e.palabra[i];celdas.push(rr+'-'+cc);}
          ubic[e.palabra]=celdas; break;
        }
      }
    }
    for(let r=0;r<size;r++)for(let c=0;c<size;c++)if(!grid[r][c])grid[r][c]=ALFA[Math.floor(Math.random()*ALFA.length)];
    return { grid, ubic };
  }, [entradas.map((e)=>e.tipo+e.palabra).join('|'), size, seed]);

  const [encontradas, setEncontradas] = React.useState([]);
  const [arrastrando, setArrastrando] = React.useState(false);
  const [seleccion, setSeleccion] = React.useState([]);
  const inicioRef = React.useRef(null);
  React.useEffect(() => { setEncontradas([]); setSeleccion([]); }, [seed, size]);

  if (!sopa) return <FichaRun config={config} tool={tool} />;
  const { grid, ubic } = sopa;
  const todas = entradas.length;

  const lineaEntre = (a, b) => {
    const [r1,c1]=a.split('-').map(Number), [r2,c2]=b.split('-').map(Number);
    const dr=Math.sign(r2-r1), dc=Math.sign(c2-c1);
    const lr=Math.abs(r2-r1), lc=Math.abs(c2-c1);
    if(!(lr===0||lc===0||lr===lc)) return null;
    const pasos=Math.max(lr,lc), celdas=[];
    for(let i=0;i<=pasos;i++) celdas.push((r1+dr*i)+'-'+(c1+dc*i));
    return celdas;
  };
  const empezar=(k)=>{inicioRef.current=k;setArrastrando(true);setSeleccion([k]);};
  const mover=(k)=>{ if(!arrastrando||!inicioRef.current)return; const l=lineaEntre(inicioRef.current,k); if(l)setSeleccion(l); };
  const terminar=()=>{
    if(!arrastrando)return; setArrastrando(false);
    const sel=seleccion.join(','), rev=[...seleccion].reverse().join(',');
    for(const e of entradas){ const cs=ubic[e.palabra]; if(!cs)continue;
      const obj=cs.join(',');
      if((sel===obj||rev===obj)&&!encontradas.includes(e.palabra)){ setEncontradas(f=>[...f,e.palabra]); break; } }
    setSeleccion([]); inicioRef.current=null;
  };
  const reorganizar=()=>setSeed((s)=>s+1);

  const celdaHallada={};
  encontradas.forEach(p=>(ubic[p]||[]).forEach(k=>{celdaHallada[k]=true;}));
  const gano = encontradas.length===todas;

  const cell = size<=11?52:size<=14?46:size<=16?40:34;
  const fcell = Math.round(cell*0.5);
  const lab = Math.round(cell*0.55);
  const flab = Math.round(cell*0.38);

  const grupos = [
    { tipo:'H', titulo:'Horizontales' },
    { tipo:'V', titulo:'Verticales' },
    { tipo:'D', titulo:'Diagonales' },
  ].map(g => ({ ...g, lista: entradas.filter(e=>e.tipo===g.tipo) })).filter(g=>g.lista.length);

  return (
    <div className="act-stage" style={{ flexDirection:'row', gap:46, alignItems:'flex-start', justifyContent:'center', height:'100%', overflow:'hidden' }}>
      <div style={{ flexShrink:0 }}>
        <div onMouseLeave={terminar} onMouseUp={terminar}
          style={{ display:'grid', gridTemplateColumns:`${lab}px repeat(${size}, ${cell}px)`, gap:4, userSelect:'none', touchAction:'none' }}>
          <div style={{ width:lab, height:lab }} />
          {Array.from({length:size}).map((_,c)=>(
            <div key={'col'+c} style={{ height:lab, display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:flab, color:'var(--muted)' }}>{c+1}</div>
          ))}
          {grid.map((fila,r)=>[
            <div key={'row'+r} style={{ width:lab, display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:800, fontSize:flab, color:'var(--muted)' }}>{COLS[r]||'?'}</div>,
            ...fila.map((ch,c)=>{
              const key=r+'-'+c, enSel=seleccion.includes(key), hallada=celdaHallada[key];
              return (
                <div key={key} onMouseDown={()=>empezar(key)} onMouseEnter={()=>mover(key)}
                  style={{ width:cell, height:cell, borderRadius:9, display:'grid', placeItems:'center',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:fcell, cursor:'pointer',
                    background: hallada?tool.color:enSel?'#F2D43A':'#1C201B',
                    color: hallada?'#08120B':enSel?'#08120B':'#F2F5EF', transition:'background .1s ease' }}>{ch}</div>
              );
            })
          ])}
        </div>
        <button className="act-bigbtn" style={{ background:tool.color, color:'#08120B', fontSize:24, padding:'12px 30px', marginTop:20 }} onClick={reorganizar}>
          🔀 Reorganizar
        </button>
      </div>

      <div style={{ width:420, flexShrink:0, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <ActHeader tool={tool} titulo={config.titulo} compact />
        <div style={{ marginTop:8, fontSize:24, color:'var(--muted)' }}>Encontradas: {encontradas.length}/{todas}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:16, marginTop:16, overflowY:'auto', paddingRight:8, flex:1 }}>
          {grupos.map((g)=>(
            <div key={g.tipo}>
              <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:22, color:tool.color, marginBottom:8 }}>{g.titulo}</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {g.lista.map((e,i)=>{
                  const ok=encontradas.includes(e.palabra);
                  return (
                    <div key={i} style={{ padding:'9px 14px', borderRadius:12, fontSize:21, fontWeight:700,
                      background: ok?tool.color:'#161A15', color: ok?'#08120B':'#F2F5EF',
                      textDecoration: ok?'line-through':'none', border:'2px solid '+(ok?tool.color:'#2A2F29'), transition:'all .2s ease' }}>
                      {e.pista ? e.pista : (ok ? e.palabra : '• • •')}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        {gano && <div className="fade-up" style={{ marginTop:14, fontFamily:'var(--font-display)', fontWeight:800, fontSize:36, color:'#11F555' }}>🎉 ¡Completaron la sopa!</div>}
      </div>
    </div>
  );
}
/* Editor especial para la Sopa de letras: 3 campos (H/V/D) + tamaño.
   Guarda cada palabra como "TIPO|PALABRA=pista" dentro de config.items. */
function SopaEditor({ current, curIdx, updateSlide }) {
  const items = current.config.items || [];
  const porTipo = (t) => items
    .filter((l) => new RegExp('^' + t + '\\s*\\|', 'i').test(l))
    .map((l) => l.replace(/^[HVD]\s*\|\s*/i, ''))
    .join('\n');

  const escribir = (tipo) => (e) => {
    // Conserva el texto tal cual se escribe (no quita líneas vacías mientras escribe).
    const lineas = e.target.value.split('\n');
    const otras = items.filter((l) => !new RegExp('^' + tipo + '\\s*\\|', 'i').test(l));
    const nuevas = lineas.map((x) => tipo + '|' + x);
    updateSlide(curIdx, { ...current, config: { ...current.config, items: [...otras, ...nuevas] } });
  };

  const setSize = (e) => {
    const v = Number(e.target.value);
    updateSlide(curIdx, { ...current, config: { ...current.config, size: v } });
  };

  const campos = [
    { tipo: 'H', titulo: 'Palabras Horizontales', color: '#11F555' },
    { tipo: 'V', titulo: 'Palabras Verticales', color: '#116CF5' },
    { tipo: 'D', titulo: 'Palabras Diagonales', color: '#F53711' },
  ];

  return (
    <div>
      <div className="field">
        <label>Tamaño de la cuadrícula</label>
        <select value={current.config.size || 12} onChange={setSize}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          {[10, 11, 12, 13, 14, 15, 16, 18].map((n) => (
            <option key={n} value={n}>{n} × {n} cuadros</option>
          ))}
        </select>
      </div>
      {campos.map((c) => (
        <div className="field" key={c.tipo}>
          <label style={{ color: c.color }}>{c.titulo} (una por línea)</label>
          <textarea rows="3" value={porTipo(c.tipo)} onChange={escribir(c.tipo)}
            placeholder={'PALABRA=pista (la pista es opcional)'}></textarea>
        </div>
      ))}
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>
        Formato: PALABRA=pista. La pista se muestra al grupo; la palabra queda oculta hasta encontrarla. Las palabras respetan la dirección del campo donde las escribas.
      </div>
    </div>
  );
}

Actividades.definir('sopa', { Run: SopaRun, Editor: SopaEditor });
