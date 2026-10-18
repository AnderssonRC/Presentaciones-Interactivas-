/* Actividad 'recuadros' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Recuadros por equipo ---------- */
/* Cada recuadro es su PROPIO componente con estado estable, para que el
   <input> de la fase "escribir" no pierda el foco en cada tecla (antes el
   recuadro se reconciliaba dentro de un Fragment sin key estable y el campo
   se "reiniciaba", dando la sensación de que no dejaba escribir). */
function RecuadroEquipo({ equipo, preguntas, puntosPorAcierto, equiposApi }) {
  const e = equipo;
  const [fase, setFase] = React.useState('jugando'); // jugando | escribir | resultado
  const [qIdx, setQIdx] = React.useState(0);
  const [abierto, setAbierto] = React.useState(false);
  const [texto, setTexto] = React.useState('');
  const [resultado, setResultado] = React.useState(null);

  const hash = (str) => { let s = 2166136261; for (let k = 0; k < str.length; k++) { s ^= str.charCodeAt(k); s = Math.imul(s, 16777619) >>> 0; } return s; };
  const prng = (seed) => () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };

  const ordenDeEquipo = React.useMemo(() => {
    const rand = prng(hash(String(e.id) + '#orden'));
    const idx = preguntas.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  }, [e.id, preguntas.length]);

  const barajarOpciones = (qReal) => {
    const rand = prng(hash(String(e.id) + '#' + qReal + '#opts'));
    const ops = preguntas[qReal].opciones.map((o, i) => ({ o, esCorrecta: i === 0 }));
    for (let i = ops.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ops[i], ops[j]] = [ops[j], ops[i]]; }
    const idxCorrecta = ops.findIndex((x) => x.esCorrecta);
    return { opciones: ops.map((x) => x.o), letraCorrecta: 'ABCDE'[idxCorrecta] };
  };
  const secuenciaCorrecta = () => ordenDeEquipo.map((qReal) => barajarOpciones(qReal).letraCorrecta);

  const continuar = () => {
    if (qIdx < ordenDeEquipo.length - 1) { setQIdx(qIdx + 1); setAbierto(false); }
    else { setFase('escribir'); setAbierto(true); }
  };
  const comprobar = () => {
    const correctas = secuenciaCorrecta();
    const escritas = (texto || '').toUpperCase().replace(/[^A-E]/g, '').split('');
    let aciertos = 0;
    correctas.forEach((c, i) => { if (escritas[i] === c) aciertos++; });
    const sumados = aciertos * puntosPorAcierto;
    if (sumados > 0) equiposApi.sumar(e.id, sumados);
    setResultado({ aciertos, total: correctas.length, sumados, correctas });
    setFase('resultado');
  };

  const estaAbierto = abierto || fase !== 'jugando';
  const anchoCerrado = 260, anchoAbierto = 560;

  // Recuadro cerrado (tarjeta para tocar)
  if (!estaAbierto) {
    return (
      <div onClick={() => setAbierto(true)}
        style={{
          width: anchoCerrado, minHeight: 260, maxWidth: '92vw',
          borderRadius: 24, background: e.color, color: '#06140A',
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          cursor: 'pointer', boxShadow: '0 14px 34px -14px rgba(0,0,0,.6)', transition: 'width .25s ease',
        }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, textAlign: 'center' }}>{e.nombre}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>👆 Tocar</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, opacity: .7 }}>{Math.min(qIdx + 1, ordenDeEquipo.length)}/{ordenDeEquipo.length}</span>
        </div>
      </div>
    );
  }

  const cabecera = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: '#06140A' }}>{e.nombre}</span>
      {fase === 'jugando' && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'rgba(6,20,10,.6)' }}>{Math.min(qIdx + 1, ordenDeEquipo.length)}/{ordenDeEquipo.length}</span>}
    </div>
  );

  let cuerpo = null;
  if (fase === 'jugando') {
    const qReal = ordenDeEquipo[qIdx];
    const { opciones } = barajarOpciones(qReal);
    cuerpo = (
      <div className="fade-up" style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1.2, color: '#06140A' }}>{preguntas[qReal].pregunta}</div>
        <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
          {opciones.map((o, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 12, background: 'rgba(6,20,10,.14)' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#06140A' }}>{'ABCDE'[i]}</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: '#06140A' }}>{o}</span>
            </div>
          ))}
        </div>
        <button onClick={continuar}
          style={{ marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#06140A', color: e.color, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
          {qIdx < ordenDeEquipo.length - 1 ? 'Continuar →' : 'Terminé, escribir →'}
        </button>
      </div>
    );
  } else if (fase === 'escribir') {
    cuerpo = (
      <div className="fade-up" style={{ marginTop: 14 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#06140A' }}>Escribe tu secuencia</div>
        <div style={{ fontSize: 16, color: 'rgba(6,20,10,.65)', marginTop: 4 }}>Ejemplo: A, C, B, D</div>
        <input value={texto}
          onChange={(ev) => setTexto(ev.target.value)}
          onClick={(ev) => ev.stopPropagation()}
          onPointerDown={(ev) => ev.stopPropagation()}
          autoFocus
          placeholder="A, C, B…"
          style={{ marginTop: 12, width: '100%', boxSizing: 'border-box', fontSize: 34, padding: '14px 18px', borderRadius: 12, textAlign: 'center',
            letterSpacing: '.2em', textTransform: 'uppercase', border: '3px solid #06140A', background: 'rgba(255,255,255,.5)',
            color: '#06140A', fontFamily: 'var(--font-display)', fontWeight: 800, outline: 'none' }} />
        <button onClick={comprobar} disabled={!(texto || '').replace(/[^A-Ea-e]/g, '')}
          style={{ marginTop: 14, width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
            background: '#06140A', color: e.color, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
          Comprobar
        </button>
      </div>
    );
  } else if (fase === 'resultado' && resultado) {
    const r = resultado;
    cuerpo = (
      <div className="fade-up" style={{ marginTop: 14, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, color: '#06140A' }}>{r.aciertos}/{r.total}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, color: '#06140A', marginTop: 4 }}>
          {r.sumados > 0 ? '+' + r.sumados + ' puntos 🎉' : 'Sin puntos'}
        </div>
        <div style={{ fontSize: 18, color: 'rgba(6,20,10,.7)', marginTop: 10 }}>
          Correcto: <b style={{ letterSpacing: '.12em' }}>{r.correctas.join(', ')}</b>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      width: anchoAbierto, maxWidth: '92vw', borderRadius: 24, padding: '22px 24px',
      background: e.color, color: '#06140A',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch',
      boxShadow: '0 14px 34px -14px rgba(0,0,0,.6)', transition: 'width .25s ease',
    }}>
      {cabecera}{cuerpo}
    </div>
  );
}

function RecuadrosRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Recuadros por equipo" />;
  const equipos = (equiposApi.equipos || []).slice(0, 5);
  const preguntas = (config.items || [])
    .map((l) => l.split('|').map((s) => s.trim()).filter(Boolean))
    .filter((p) => p.length >= 3)
    .map((p) => ({ pregunta: p[0], correcta: p[1], opciones: p.slice(1) }));
  const puntosPorAcierto = Math.max(1, Number(config.puntos) || 2);

  if (preguntas.length < 1 || !equipos.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 16, height: '100%', overflow: 'auto' }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{ fontSize: 20, color: 'var(--muted)', marginTop: 4 }}>
        {preguntas.length} preguntas · {puntosPorAcierto} {puntosPorAcierto === 1 ? 'punto' : 'puntos'} por acierto
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 30, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 1640 }}>
        {equipos.map((e) => (
          <RecuadroEquipo key={e.id} equipo={e} preguntas={preguntas}
            puntosPorAcierto={puntosPorAcierto} equiposApi={equiposApi} />
        ))}
      </div>
    </div>
  );
}

Actividades.definir('recuadros', { Run: RecuadrosRun });
