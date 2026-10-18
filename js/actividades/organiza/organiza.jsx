/* Actividad 'organiza' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Organiza la frase ---------- */
function OrganizaRun({ config, tool }) {
  // Cada línea es un ejercicio; las palabras entre [corchetes] son los huecos.
  const ejercicios = (config.items || [])
    .map((linea) => {
      const segmentos = [], huecos = [];
      const re = /\[([^\]]+)\]/g;
      let lastIndex = 0, huecoIdx = 0, match;
      while ((match = re.exec(linea)) !== null) {
        if (match.index > lastIndex) segmentos.push({ tipo: 'texto', valor: linea.slice(lastIndex, match.index) });
        const palabra = match[1].trim();
        segmentos.push({ tipo: 'hueco', idx: huecoIdx, correcta: palabra });
        huecos.push(palabra);
        huecoIdx++;
        lastIndex = re.lastIndex;
      }
      if (lastIndex < linea.length) segmentos.push({ tipo: 'texto', valor: linea.slice(lastIndex) });
      return { segmentos, huecos };
    })
    .filter((e) => e.huecos.length > 0);

  const [qi, setQi] = React.useState(0);
  const [puestasIds, setPuestasIds] = React.useState({}); // { huecoIdx: fichaId }
  const [comprobado, setComprobado] = React.useState(false);
  const arrastreRef = React.useRef(null);

  if (!ejercicios.length) return <FichaRun config={config} tool={tool} />;
  const ej = ejercicios[qi % ejercicios.length];

  // Tamaño de letra de la frase proporcional a su longitud (en palabras):
  // frases cortas se ven grandes y llamativas; frases largas se reducen para
  // que quepan cómodamente dentro del marco.
  const totalPalabras = ej.segmentos.reduce((acc, s) => {
    if (s.tipo === 'hueco') return acc + 1;
    return acc + s.valor.trim().split(/\s+/).filter(Boolean).length;
  }, 0);
  const fontFrase = totalPalabras <= 6 ? 64 : totalPalabras <= 10 ? 52 : totalPalabras <= 14 ? 44 : totalPalabras <= 20 ? 38 : 32;
  const huecoAncho = Math.round(fontFrase * 3.4);
  // Color del marco: cambia con cada frase nueva, para que se note el cambio de ejercicio.
  const colorMarco = RULETA_PALETTE[(qi % ejercicios.length) % RULETA_PALETTE.length];

  // banco de palabras desordenadas (las correctas, mezcladas) — fijo por ejercicio
  const banco = React.useMemo(() => {
    return ej.huecos.map((p, i) => ({ id: i, palabra: p })).sort(() => Math.random() - 0.5);
  }, [qi]);

  const soltarEn = (huecoIdx) => {
    const fichaId = arrastreRef.current;
    if (fichaId == null) return;
    const ficha = banco.find((b) => b.id === fichaId);
    if (!ficha) return;
    setPuestasIds((p) => {
      const nuevo = { ...p };
      for (const k in nuevo) if (nuevo[k] === fichaId) delete nuevo[k];
      nuevo[huecoIdx] = fichaId;
      return nuevo;
    });
    setComprobado(false);
    arrastreRef.current = null;
  };

  const quitarDeHueco = (huecoIdx) => {
    setPuestasIds((p) => { const n = { ...p }; delete n[huecoIdx]; return n; });
    setComprobado(false);
  };

  const fichaEnHueco = (huecoIdx) => {
    const id = puestasIds[huecoIdx];
    if (id == null) return null;
    return banco.find((b) => b.id === id);
  };
  const fichasDisponibles = banco.filter((b) => !Object.values(puestasIds).includes(b.id));

  const todosLlenos = ej.huecos.every((_, i) => puestasIds[i] != null);
  const correcto = ej.huecos.every((correcta, i) => {
    const f = fichaEnHueco(i);
    return f && f.palabra === correcta;
  });

  const siguiente = () => {
    setQi((qi + 1) % ejercicios.length);
    setPuestasIds({}); setComprobado(false);
  };
  const reiniciar = () => { setPuestasIds({}); setComprobado(false); };

  return (
    <div className="act-stage" style={{ justifyContent:'flex-start', paddingTop:20, height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      {ejercicios.length > 1 && (
        <div style={{ fontSize:24, color:'var(--muted)', marginTop:6 }}>Ejercicio {(qi % ejercicios.length) + 1} de {ejercicios.length}</div>
      )}

      {/* Zona scrollable: párrafo + banco */}
      <div style={{ flex:1, overflowY:'auto', width:'100%', maxWidth:1600, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', paddingRight:10 }}>
      {/* Párrafo con huecos, centrado y con marco para que resalte */}
      <div style={{
        marginTop:20, maxWidth:1500, width:'100%', boxSizing:'border-box', fontSize:fontFrase, lineHeight:1.75, textAlign:'center',
        padding:'38px 50px', borderRadius:26, border:'3px solid ' + colorMarco,
        background:'rgba(255,255,255,.045)', boxShadow:'0 0 46px -12px ' + colorMarco, transition:'border-color .3s ease, box-shadow .3s ease',
      }}>
        {ej.segmentos.map((s, i) => {
          if (s.tipo === 'texto') return <span key={i}>{s.valor}</span>;
          const f = fichaEnHueco(s.idx);
          const ok = comprobado && f && f.palabra === s.correcta;
          const mal = comprobado && (!f || f.palabra !== s.correcta);
          return (
            <span key={i}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => soltarEn(s.idx)}
              onClick={() => f && quitarDeHueco(s.idx)}
              style={{
                display:'inline-block', textAlign:'center', minWidth:huecoAncho, padding:'4px 14px', margin:'0 6px',
                borderRadius:10, cursor: f ? 'pointer' : 'default',
                border:'2px dashed ' + (ok ? '#11F555' : mal ? '#F53711' : (f ? tool.color : '#5A6157')),
                background: ok ? 'rgba(17,245,85,.15)' : mal ? 'rgba(245,55,17,.15)' : (f ? 'rgba(255,255,255,.06)' : 'transparent'),
                fontWeight:700, verticalAlign:'middle', lineHeight:1.2,
              }}>
              {f ? f.palabra : '\u00A0\u00A0\u00A0'}
            </span>
          );
        })}
      </div>
      </div>

      {/* Banco de palabras desordenadas (fijo, fuera del scroll) */}
      <div style={{ marginTop:18, paddingTop:18, borderTop:'2px solid #2A2F29', width:'100%', maxWidth:1500, flexShrink:0 }}>
        <div style={{ fontSize:20, color:'var(--muted)', marginBottom:14, textAlign:'left' }}>Arrastra las palabras a su lugar:</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:16, justifyContent:'flex-start', minHeight:70 }}>
          {fichasDisponibles.map((b) => (
            <div key={b.id} draggable
              onDragStart={() => { arrastreRef.current = b.id; }}
              style={{
                padding:'12px 24px', borderRadius:14, background:tool.color, color:'#06140A',
                fontFamily:'var(--font-display)', fontWeight:800, fontSize:32, cursor:'grab',
                boxShadow:'0 8px 22px -10px rgba(0,0,0,.6)',
              }}>{b.palabra}</div>
          ))}
          {fichasDisponibles.length === 0 && !comprobado && (
            <div style={{ fontSize:26, color:'var(--muted)' }}>Todas las palabras colocadas. Pulsa Comprobar.</div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div style={{ display:'flex', gap:18, marginTop:20, flexShrink:0 }}>
        <button className="act-bigbtn" style={{ background: todosLlenos ? '#11F555' : '#2A2F29', color: todosLlenos ? '#06140A' : '#9AA396', fontSize:30, padding:'16px 44px' }}
          onClick={() => todosLlenos && setComprobado(true)} disabled={!todosLlenos}>
          Comprobar
        </button>
        <button className="act-bigbtn" style={{ background:'transparent', color:'#9AA396', border:'3px solid #2A2F29', fontSize:28, padding:'16px 36px' }} onClick={reiniciar}>
          Reiniciar
        </button>
        {comprobado && correcto && ejercicios.length > 1 && (
          <button className="act-bigbtn fade-up" style={{ background:'#F2F5EF', color:'#08120B', fontSize:30, padding:'16px 44px' }} onClick={siguiente}>
            Siguiente →
          </button>
        )}
      </div>

      {/* Resultado */}
      {comprobado && (
        <div className="fade-up" style={{ marginTop:30, fontFamily:'var(--font-display)', fontWeight:800, fontSize:48, color: correcto ? '#11F555' : '#F53711' }}>
          {correcto ? '🎉 ¡Correcto!' : 'Hay palabras mal ubicadas, revisa las rojas'}
        </div>
      )}
    </div>
  );
}

Actividades.definir('organiza', { Run: OrganizaRun });
