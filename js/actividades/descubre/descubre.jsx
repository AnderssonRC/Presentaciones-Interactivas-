/* Actividad 'descubre' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Descubre la palabra (Wordle) ---------- */
function DescubreRun({ config, tool }) {
  const norm = (s) => s.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-ZÑ]/g,'');
  const palabras = (config.items || [])
    .map((l) => { const [w, pista] = l.split('=').map((s) => s.trim()); return { palabra: norm(w || ''), pista: (pista || '').trim() }; })
    .filter((e) => e.palabra.length >= 2);

  const MAX = Math.max(2, Math.min(10, Number(config.intentos) || 6));

  const [qi, setQi] = React.useState(0);
  const [intentos, setIntentos] = React.useState([]); // palabras ya enviadas
  const [actual, setActual] = React.useState('');       // lo que se está escribiendo

  if (!palabras.length) return <FichaRun config={config} tool={tool} />;
  const objetivo = palabras[qi % palabras.length].palabra;
  const pista = palabras[qi % palabras.length].pista;
  const LEN = objetivo.length;

  const evaluar = (intento) => {
    const res = Array(LEN).fill('gris');
    const rest = {};
    for (let i=0;i<LEN;i++){ if(intento[i]===objetivo[i]) res[i]='verde'; else rest[objetivo[i]]=(rest[objetivo[i]]||0)+1; }
    for (let i=0;i<LEN;i++){ if(res[i]==='verde')continue; const c=intento[i]; if(rest[c]>0){ res[i]='amarillo'; rest[c]--; } }
    return res;
  };

  const gano = intentos.includes(objetivo);
  const perdio = !gano && intentos.length >= MAX;
  const terminado = gano || perdio;

  const enviar = () => {
    if (actual.length !== LEN || terminado) return;
    setIntentos((arr) => [...arr, actual]);
    setActual('');
  };
  const escribir = (c) => {
    if (terminado) return;
    if (actual.length < LEN) setActual((s) => s + c);
  };
  const borrar = () => setActual((s) => s.slice(0, -1));
  const siguiente = () => { setQi((qi+1)%palabras.length); setIntentos([]); setActual(''); };

  // teclado físico
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter') { if (terminado && palabras.length>1) siguiente(); else enviar(); return; }
      if (e.key === 'Backspace') { borrar(); return; }
      if (e.key.length === 1 && /[a-zA-ZñÑ]/.test(e.key)) escribir(norm(e.key));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actual, terminado, qi, intentos]);

  // color de cada tecla (el mejor estado conseguido)
  const colorTecla = {};
  intentos.forEach((intento) => {
    const ev = evaluar(intento);
    intento.split('').forEach((c, i) => {
      const prev = colorTecla[c];
      const nuevo = ev[i];
      const rank = { verde:3, amarillo:2, gris:1 };
      if (!prev || rank[nuevo] > rank[prev]) colorTecla[c] = nuevo;
    });
  });

  const bg = { verde:'#11F555', amarillo:'#F2C037', gris:'#3A413A' };
  const filas = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
  // Tamaño de casilla: se reduce si la palabra es larga (ancho) o hay muchos intentos (alto).
  const muchosIntentos = MAX > 8;
  const altoGrid = muchosIntentos ? 720 : 520; // si el teclado va al lado, la cuadrícula puede ser más alta
  const porAncho = Math.floor(((muchosIntentos ? 760 : 1200) - (LEN - 1) * 8) / LEN);
  const porAlto = Math.floor((altoGrid - (MAX - 1) * 8) / MAX);
  const cell = Math.max(40, Math.min(84, porAncho, porAlto));
  const ladoALado = MAX > 8; // con muchos intentos, teclado a la derecha

  // construir las filas a mostrar: intentos pasados + fila actual + vacías
  const filasMostrar = [];
  for (let r = 0; r < MAX; r++) {
    if (r < intentos.length) filasMostrar.push({ texto: intentos[r], ev: evaluar(intentos[r]), activa:false });
    else if (r === intentos.length && !terminado) filasMostrar.push({ texto: actual, ev: null, activa:true });
    else filasMostrar.push({ texto: '', ev: null, activa:false });
  }

  return (
    <div className="act-stage" style={{ justifyContent:'flex-start', paddingTop:14, height:'100%', overflow:'hidden' }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      {pista && !terminado && (
        <div style={{ marginTop:10, fontSize:30, color:'var(--muted)' }}><span style={{ fontWeight:700 }}>Pista:</span> {pista}</div>
      )}

      {/* Cuadrícula + teclado: lado a lado si hay muchos intentos */}
      <div style={{ display:'flex', flexDirection: ladoALado ? 'row' : 'column', gap: ladoALado ? 60 : 0, alignItems:'center', justifyContent:'center', marginTop:16 }}>
      {/* Cuadrícula de intentos */}
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filasMostrar.map((fila, r) => (
          <div key={r} style={{ display:'flex', gap:8, justifyContent:'center' }}>
            {Array.from({ length: LEN }).map((_, c) => {
              const ch = fila.texto[c] || '';
              const color = fila.ev ? bg[fila.ev[c]] : (fila.activa && ch ? '#1C201B' : 'transparent');
              const borde = fila.ev ? color : (fila.activa ? tool.color : '#3A413A');
              return (
                <div key={c} style={{
                  width:cell, height:cell, borderRadius:10, display:'grid', placeItems:'center',
                  fontFamily:'var(--font-display)', fontWeight:800, fontSize:Math.round(cell*0.5),
                  background: fila.ev ? color : (ch ? '#1C201B' : 'transparent'),
                  border:'3px solid ' + borde, color:'#F2F5EF', transition:'all .15s ease',
                }}>{ch}</div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Teclado (dentro del wrapper flex) */}
      {!terminado && (
        <div style={{ marginTop: ladoALado ? 0 : 18, display:'flex', flexDirection:'column', gap:7, alignItems:'center' }}>
          {filas.map((fila, fi) => (
            <div key={fi} style={{ display:'flex', gap:7 }}>
              {fi === 2 && (
                <button onClick={enviar} disabled={actual.length !== LEN}
                  style={{ minWidth:74, height:74, borderRadius:10, border:'none', cursor:'pointer',
                    background: actual.length===LEN ? tool.color : '#2A2F29', color: actual.length===LEN ? '#06140A':'#9AA396',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:20 }}>ENVIAR</button>
              )}
              {fila.split('').map((c) => (
                <button key={c} onClick={() => escribir(c)}
                  style={{ width:58, height:74, borderRadius:10, border:'none', cursor:'pointer',
                    background: colorTecla[c] ? bg[colorTecla[c]] : '#222722',
                    color: colorTecla[c] && colorTecla[c]!=='gris' ? '#06140A' : '#F2F5EF',
                    fontFamily:'var(--font-display)', fontWeight:800, fontSize:28 }}>{c}</button>
              ))}
              {fi === 2 && (
                <button onClick={borrar}
                  style={{ minWidth:74, height:74, borderRadius:10, border:'none', cursor:'pointer',
                    background:'#2A2F29', color:'#F2F5EF', fontSize:30 }}>⌫</button>
              )}
            </div>
          ))}
        </div>
      )}
      </div>

      {/* Resultado */}
      {terminado && (
        <div className="fade-up" style={{ marginTop:24, fontFamily:'var(--font-display)', fontWeight:800, fontSize:44, color: gano ? '#11F555' : '#F53711' }}>
          {gano ? '🎉 ¡La descubrieron!' : 'Era: ' + objetivo}
        </div>
      )}

      {/* Siguiente palabra */}
      {terminado && palabras.length > 1 && (
        <button className="act-bigbtn fade-up" style={{ background:'#F2F5EF', color:'#08120B', fontSize:28, padding:'14px 40px', marginTop:24 }} onClick={siguiente}>
          Siguiente palabra ({(qi % palabras.length)+1}/{palabras.length})
        </button>
      )}
    </div>
  );
}

/* Editor especial para Descubre la palabra: palabras + número de intentos. */
function DescubreEditor({ current, curIdx, updateSlide, setItems }) {
  const setIntentos = (e) => {
    const v = Number(e.target.value);
    updateSlide(curIdx, { ...current, config: { ...current.config, intentos: v } });
  };
  return (
    <div>
      <div className="field">
        <label>Número de intentos</label>
        <select value={current.config.intentos || 6} onChange={setIntentos}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line)', background: 'var(--surface2)', color: 'var(--ink)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
            <option key={n} value={n}>{n} intentos</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Palabras a adivinar (una por línea)</label>
        <textarea rows="5" value={(current.config.items || []).join('\n')} onChange={setItems}
          placeholder="PALABRA=pista (la pista es opcional)"></textarea>
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>
          Formato: PALABRA=pista. Cada palabra puede tener distinta longitud. Ej: ELEFANTE=Animal con trompa
        </div>
      </div>
    </div>
  );
  }

Actividades.definir('descubre', { Run: DescubreRun, Editor: DescubreEditor });
