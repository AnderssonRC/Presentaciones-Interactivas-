/* Actividades interactivas — versiones funcionales para el modo Presentar */
const ACT_PALETTE = ['#11F555', '#F53711', '#116CF5', '#EDEDE4'];

function useCountdown(initial) {
  const [secs, setSecs] = React.useState(initial);
  const [running, setRunning] = React.useState(false);
  React.useEffect(() => { setSecs(initial); setRunning(false); }, [initial]);
  React.useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setSecs((s) => { if (s <= 1) { setRunning(false); return 0; } return s - 1; }), 1000);
    return () => clearInterval(t);
  }, [running]);
  return [secs, running, { start: () => setRunning(true), pause: () => setRunning(false), reset: () => { setRunning(false); setSecs(initial); } }];
}
const fmtTime = (s) => Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');

/* Hook para que una actividad reaccione a comandos del control remoto.
   El Presenter pasa `remoteSignal = { action, nonce }` como prop.
   Cada vez que llega un nonce nuevo, ejecuta el handler que corresponde
   a esa acción ('primary', 'next', …). Las actividades que no reciben
   remoteSignal simplemente nunca disparan nada. */
function useRemoteAction(remoteSignal, handlers) {
  const last = React.useRef(null);
  React.useEffect(() => {
    if (!remoteSignal || !remoteSignal.nonce) return;
    if (remoteSignal.nonce === last.current) return;
    last.current = remoteSignal.nonce;
    const fn = handlers && handlers[remoteSignal.action];
    if (typeof fn === 'function') fn();
  }, [remoteSignal && remoteSignal.nonce]);
}

function ActHeader({ tool, titulo, instrucciones, compact }) {
  return (
    <div>
      <div className="act-kicker" style={{ color: tool.color, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
        <Icon name={tool.icon} size={32} /> {tool.nombre}
      </div>
      <div className="act-title" style={{ fontSize: compact ? 64 : 88 }}>{titulo}</div>
      {instrucciones ? <div className="act-instr" style={{ margin: '24px auto 0' }}>{instrucciones}</div> : null}
    </div>
  );
}

function TimerPanel({ duracion, accent }) {
  const [secs, running, ctl] = useCountdown(duracion || 120);
  const low = secs <= 10 && secs > 0;
  return (
    <div style={{ marginTop: 40 }}>
      <div className="timer-display" style={{ color: secs === 0 ? '#F53711' : low ? '#F53711' : '#F2F5EF', fontSize: 170 }}>
        {secs === 0 ? '¡Tiempo!' : fmtTime(secs)}
      </div>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 28 }}>
        {!running
          ? <button className="act-bigbtn" style={{ background: accent, color: '#06140A', fontSize: 30, padding: '16px 44px' }} onClick={ctl.start}>{secs === (duracion || 120) ? 'Iniciar' : 'Continuar'}</button>
          : <button className="act-bigbtn" style={{ background: '#2A2F29', color: '#fff', fontSize: 30, padding: '16px 44px' }} onClick={ctl.pause}>Pausar</button>}
        <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 30, padding: '16px 44px' }} onClick={ctl.reset}>Reiniciar</button>
      </div>
    </div>
  );
}

/* ---------- Ruleta de preguntas ---------- */
function RuletaRun({ config, tool, remoteSignal }) {
  const items = (config.items || []).filter((x) => x.trim());
  const n = Math.max(items.length, 1);
  const [rot, setRot] = React.useState(0);
  const [spinning, setSpinning] = React.useState(false);
  const [result, setResult] = React.useState(null);
  const seg = 360 / n;
  const cx = 330, cy = 330, r = 312;

  const spin = () => {
    if (spinning) return;
    setResult(null);
    const next = rot + 1440 + Math.random() * 360;
    setRot(next); setSpinning(true);
    setTimeout(() => {
      const local = ((360 - (next % 360)) % 360 + 360) % 360;
      setResult(Math.min(Math.floor(local / seg), n - 1));
      setSpinning(false);
    }, 4200);
  };
  useRemoteAction(remoteSignal, { primary: spin, next: spin });

  const arc = (i) => {
    if (n === 1) return null;
    const a0 = ((-90 + i * seg) * Math.PI) / 180, a1 = ((-90 + (i + 1) * seg) * Math.PI) / 180;
    return `M ${cx},${cy} L ${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} A ${r},${r} 0 ${seg > 180 ? 1 : 0} 1 ${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
  };

  return (
    <div className="act-stage" style={{ flexDirection: 'row', gap: 110, textAlign: 'left', justifyContent: 'center' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <svg width="660" height="660" viewBox="0 0 660 660" style={{ transform: `rotate(${rot}deg)`, transition: spinning ? 'transform 4.2s cubic-bezier(.12,.68,.16,1)' : 'none' }}>
          {n === 1
            ? <circle cx={cx} cy={cy} r={r} fill={ACT_PALETTE[0]} />
            : items.map((q, i) => <path key={i} d={arc(i)} fill={ACT_PALETTE[i % ACT_PALETTE.length]} stroke="#0B0E0B" strokeWidth="5" />)}
          {items.map((q, i) => {
            const am = ((-90 + (i + 0.5) * seg) * Math.PI) / 180;
            return <text key={'t' + i} x={cx + r * 0.66 * Math.cos(am)} y={cy + r * 0.66 * Math.sin(am)} textAnchor="middle" dominantBaseline="central"
              fontFamily="var(--font-display)" fontWeight="800" fontSize="54" fill="#08120B">{i + 1}</text>;
          })}
          <circle cx={cx} cy={cy} r="56" fill="#0B0E0B" stroke="#F2F5EF" strokeWidth="6" />
        </svg>
        <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '26px solid transparent', borderRight: '26px solid transparent', borderTop: '46px solid #F2F5EF', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,.5))' }}></div>
      </div>
      <div style={{ maxWidth: 740 }}>
        <ActHeader tool={tool} titulo={config.titulo} compact />
        <div className="act-instr" style={{ marginTop: 18 }}>{config.instrucciones}</div>
        {result !== null && (
          <div className="fade-up" style={{ marginTop: 36, padding: '40px 46px', borderRadius: 22, background: ACT_PALETTE[result % ACT_PALETTE.length], color: '#08120B' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 26, letterSpacing: '.18em' }}>PREGUNTA {result + 1}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52, lineHeight: 1.15, marginTop: 10 }}>{items[result]}</div>
          </div>
        )}
        <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={spin} disabled={spinning}>
          {spinning ? 'Girando…' : result !== null ? 'Girar de nuevo' : '¡Girar!'}
        </button>
      </div>
    </div>
  );
}

/* ---------- Completa la palabra ---------- */
function CompletaRun({ config, tool }) {
  const items = (config.items || []).filter((x) => x.includes('=') && x.includes('_'));
  const [qi, setQi] = React.useState(0);
  const [solved, setSolved] = React.useState(false);
  const [wrong, setWrong] = React.useState([]);
  if (!items.length) return <FichaRun config={config} tool={tool} />;
  const [word, ans] = items[qi % items.length].split('=').map((s) => s.trim());
  const answer = (ans || 'A').charAt(0).toUpperCase();

  const options = React.useMemo(() => {
    const pool = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('').filter((c) => c !== answer);
    const decoys = pool.sort(() => Math.random() - 0.5).slice(0, 2);
    return [answer, ...decoys].sort(() => Math.random() - 0.5);
  }, [qi]);

  const pick = (c) => {
    if (solved) return;
    if (c === answer) { setSolved(true); } else if (!wrong.includes(c)) { setWrong([...wrong, c]); }
  };
  const next = () => { setQi((qi + 1) % items.length); setSolved(false); setWrong([]); };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{ display: 'flex', gap: 18, marginTop: 64, flexWrap: 'wrap', justifyContent: 'center' }}>
        {word.split('').map((ch, i) => (
          <div key={i} style={{
            width: 110, height: 130, borderRadius: 16, display: 'grid', placeItems: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 72,
            background: ch === '_' ? (solved ? tool.color : 'transparent') : '#1A1E19',
            border: ch === '_' ? '4px dashed ' + (solved ? tool.color : '#5A6157') : '4px solid transparent',
            color: ch === '_' ? '#06140A' : '#F2F5EF',
            transition: 'all .3s ease',
          }}>{ch === '_' ? (solved ? answer : '?') : ch}</div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 22, marginTop: 56 }}>
        {options.map((c) => (
          <button key={c} className={'act-option' + (solved && c === answer ? ' correct' : wrong.includes(c) ? ' wrong' : '')}
            style={{ width: 130, height: 110, fontSize: 56, fontFamily: 'var(--font-display)', fontWeight: 800, textAlign: 'center', padding: 0 }}
            onClick={() => pick(c)}>{c}</button>
        ))}
      </div>
      {solved && items.length > 1 && (
        <button className="act-bigbtn fade-up" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px' }} onClick={next}>
          Siguiente palabra ({(qi % items.length) + 1}/{items.length})
        </button>
      )}
    </div>
  );
}

/* ---------- Elige la respuesta ---------- */
function EligeRun({ config, tool, remoteSignal }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim()).filter(Boolean)).filter((p) => p.length >= 3);
  const [qi, setQi] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);
  const [q, correct, ...rest] = items.length ? items[qi % items.length] : ['', '', ''];
  const options = React.useMemo(() => items.length ? [correct, ...rest].sort(() => Math.random() - 0.5) : [], [qi, items.length]);
  const next = () => { setQi((qi + 1) % Math.max(items.length, 1)); setChosen(null); };
  const reveal = () => { if (chosen === null && options.length) setChosen(options.indexOf(correct)); };
  useRemoteAction(remoteSignal, { primary: reveal, next });
  if (!items.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={q} compact />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 70, width: '100%', maxWidth: 1380 }}>
        {options.map((o, i) => (
          <button key={i}
            className={'act-option' + (chosen !== null ? (o === correct ? ' correct' : (i === chosen ? ' wrong' : '')) : '')}
            onClick={() => chosen === null && setChosen(i)}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, marginRight: 22, opacity: .65 }}>{String.fromCharCode(65 + i)}</span>{o}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 50 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: options[chosen] === correct ? '#11F555' : '#F53711' }}>
            {options[chosen] === correct ? '¡Correcto!' : 'La respuesta era: ' + correct}
          </div>
          {items.length > 1 && <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px', marginTop: 0 }} onClick={next}>Siguiente ({(qi % items.length) + 1}/{items.length})</button>}
        </div>
      )}
    </div>
  );
}

/* ---------- Verdadero o falso ---------- */
function VFRun({ config, tool, remoteSignal }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim())).filter((p) => p[0]);
  const [qi, setQi] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);
  const [text, a] = items.length ? items[qi % items.length] : ['', 'V'];
  const answer = (a || 'V').toUpperCase().startsWith('V') ? 'V' : 'F';
  const next = () => { setQi((qi + 1) % Math.max(items.length, 1)); setChosen(null); };
  const reveal = () => { if (chosen === null) setChosen(answer); };
  useRemoteAction(remoteSignal, { primary: reveal, next });
  if (!items.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={'"' + text + '"'} instrucciones={chosen === null ? config.instrucciones : ''} compact />
      <div style={{ display: 'flex', gap: 30, marginTop: 70 }}>
        {['V', 'F'].map((v) => (
          <button key={v} className={'act-option' + (chosen !== null ? (v === answer ? ' correct' : (v === chosen ? ' wrong' : '')) : '')}
            style={{ width: 320, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 54 }}
            onClick={() => chosen === null && setChosen(v)}>
            {v === 'V' ? 'Verdadero' : 'Falso'}
          </button>
        ))}
      </div>
      {chosen !== null && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 50 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: chosen === answer ? '#11F555' : '#F53711' }}>
            {chosen === answer ? '¡Correcto!' : 'Era ' + (answer === 'V' ? 'verdadero' : 'falso')}
          </div>
          {items.length > 1 && <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px', marginTop: 0 }} onClick={next}>Siguiente ({(qi % items.length) + 1}/{items.length})</button>}
        </div>
      )}
    </div>
  );
}

/* ---------- Selector de estudiante ---------- */
function SelectorRun({ config, tool, remoteSignal }) {
  const names = (config.items || []).filter((x) => x.trim());
  const [display, setDisplay] = React.useState('¿Quién será?');
  const [picking, setPicking] = React.useState(false);
  const [picked, setPicked] = React.useState(false);

  const pick = () => {
    if (picking || !names.length) return;
    setPicking(true); setPicked(false);
    let i = 0;
    const t = setInterval(() => { setDisplay(names[i % names.length]); i++; }, 90);
    setTimeout(() => {
      clearInterval(t);
      setDisplay(names[Math.floor(Math.random() * names.length)]);
      setPicking(false); setPicked(true);
    }, 1800);
  };
  useRemoteAction(remoteSignal, { primary: pick, next: pick });
  if (!names.length) return <FichaRun config={config} tool={tool} />;

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{
        marginTop: 60, minWidth: 900, padding: '60px 80px', borderRadius: 28,
        border: '5px solid ' + (picked ? tool.color : '#2A2F29'),
        background: picked ? tool.color : '#141814',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 110, lineHeight: 1.1,
        color: picked ? '#06140A' : '#F2F5EF', transition: 'all .25s ease',
      }}>{display}</div>
      <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={pick} disabled={picking}>
        {picking ? 'Eligiendo…' : picked ? 'Elegir otro' : '¡Elegir!'}
      </button>
    </div>
  );
}

/* ---------- Dado didáctico ---------- */
function DadoRun({ config, tool, remoteSignal }) {
  const [val, setVal] = React.useState(null);
  const [rolling, setRolling] = React.useState(false);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let i = 0;
    const t = setInterval(() => { setVal(1 + Math.floor(Math.random() * 6)); i++; }, 100);
    setTimeout(() => { clearInterval(t); setVal(1 + Math.floor(Math.random() * 6)); setRolling(false); }, 1400);
  };
  useRemoteAction(remoteSignal, { primary: roll, next: roll });
  const DOTS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{
        marginTop: 60, width: 340, height: 340, borderRadius: 56, background: '#F2F5EF',
        display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', padding: 56, gap: 10,
        transform: rolling ? 'rotate(8deg) scale(1.04)' : 'none', transition: 'transform .15s ease',
        boxShadow: '0 24px 60px -20px rgba(0,0,0,.7)',
      }}>
        {Array.from({ length: 9 }, (_, i) => (
          <div key={i} style={{ display: 'grid', placeItems: 'center' }}>
            {val !== null && DOTS[val].includes(i) && <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#0B0E0B' }}></div>}
          </div>
        ))}
      </div>
      <button className="act-bigbtn" style={{ background: tool.color, color: '#06140A' }} onClick={roll} disabled={rolling}>
        {rolling ? 'Rodando…' : val ? 'Lanzar de nuevo' : '¡Lanzar!'}
      </button>
    </div>
  );
}

/* ---------- Marcador de equipos ---------- */
function MarcadorRun({ config, tool }) {
  const teams = (config.items || []).filter((x) => x.trim()).slice(0, 4);
  const [scores, setScores] = React.useState(teams.map(() => 0));
  if (!teams.length) return <FichaRun config={config} tool={tool} />;
  const bump = (i, d) => setScores(scores.map((s, j) => (j === i ? Math.max(0, s + d) : s)));
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ display: 'flex', gap: 36, marginTop: 70 }}>
        {teams.map((t, i) => (
          <div key={i} style={{ width: 360, borderRadius: 26, overflow: 'hidden', border: '3px solid #2A2F29', background: '#141814' }}>
            <div style={{ background: ACT_PALETTE[i % ACT_PALETTE.length], color: '#08120B', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34, padding: '18px 10px' }}>{t}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 150, lineHeight: 1, padding: '36px 0' }}>{scores[i]}</div>
            <div style={{ display: 'flex' }}>
              <button onClick={() => bump(i, -1)} style={{ flex: 1, fontSize: 44, padding: '14px 0', background: '#1C201B', color: '#9AA396', border: 'none', fontWeight: 800 }}>−</button>
              <button onClick={() => bump(i, 1)} style={{ flex: 1, fontSize: 44, padding: '14px 0', background: ACT_PALETTE[i % ACT_PALETTE.length], color: '#08120B', border: 'none', fontWeight: 800 }}>+</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Fichas con temporizador (crea, problema, temporizador y resto) ---------- */
function ProblemaRun({ config, tool }) {
  const enunciado = (config.items || []).filter((x) => x.trim())[0];
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      {enunciado && (
        <div style={{ marginTop: 44, maxWidth: 1300, padding: '44px 60px', borderRadius: 24, background: '#161A15', border: '3px solid #2A2F29', fontSize: 52, lineHeight: 1.4, fontWeight: 600 }}>
          {enunciado}
        </div>
      )}
      <TimerPanel duracion={config.duracion} accent={tool.color} />
    </div>
  );
}
function FichaRun({ config, tool }) {
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} />
      <TimerPanel duracion={config.duracion} accent={tool.color} />
    </div>
  );
}
function TemporizadorRun({ config, tool }) {
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <TimerPanel duracion={config.duracion} accent={tool.color} />
    </div>
  );
}
/* ---------- Ahorcado: Profe vs. Curso ---------- */
function AhorcadoRun({ config, tool }) {
  const VIDAS = 6;
  const items = (config.items || [])
    .map((l) => {
      const [w, pista] = l.split('=').map((s) => s.trim());
      return { palabra: (w || '').toUpperCase(), pista: pista || '' };
    })
    .filter((it) => it.palabra.replace(/[^A-ZÑÁÉÍÓÚÜ]/gi, '').length > 0);

  const [qi, setQi] = React.useState(0);
  const [historial, setHistorial] = React.useState([]); // cada intento (puede repetirse)
  if (!items.length) return <FichaRun config={config} tool={tool} />;

  const actual = items[qi % items.length];
  const palabra = actual.palabra;
  const esLetra = (c) => /[A-ZÑÁÉÍÓÚÜ]/.test(c);
  const acertadas = new Set(historial.filter((c) => palabra.includes(c)));

  const letrasObjetivo = React.useMemo(
    () => [...new Set(palabra.split('').filter(esLetra))],
    [qi]
  );

  // Vidas perdidas = cada intento desperdiciado:
  //  - letra fallada (no está en la palabra), cuente cuantas veces se intente
  //  - letra repetida (ya intentada antes), aunque fuera un acierto
  const vistas = new Set();
  let perdidas = 0;
  for (const c of historial) {
    const repetida = vistas.has(c);
    const fallo = !palabra.includes(c);
    if (repetida || fallo) perdidas++;
    vistas.add(c);
  }
  const vidas = Math.max(0, VIDAS - perdidas);
  const ganoCurso = letrasObjetivo.every((c) => acertadas.has(c));
  const ganoProfe = vidas === 0;
  const terminado = ganoCurso || ganoProfe;

  const intentar = (c) => {
    c = c.toUpperCase();
    if (terminado || !esLetra(c)) return;
    setHistorial((h) => [...h, c]);
  };
  const siguiente = () => { setQi((qi + 1) % items.length); setHistorial([]); };

  // teclado físico
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && terminado && items.length > 1) { siguiente(); return; }
      if (e.key.length === 1) intentar(e.key);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [historial, terminado, qi]);

  const filas = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];

  // Tamaño de casillas adaptable: palabras largas -> casillas más pequeñas,
  // para que la palabra completa quepa en una línea sin partirse.
  const nLetras = palabra.split('').filter(esLetra).length;
  const box = nLetras <= 8 ? 88 : nLetras <= 11 ? 70 : nLetras <= 14 ? 56 : 46;
  const fontBox = Math.round(box * 0.66);

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} compact />

      {/* Vidas del curso */}
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', marginTop: 10 }}>
        {Array.from({ length: VIDAS }).map((_, i) => (
          <span key={i} style={{
            fontSize: 64, lineHeight: 1,
            opacity: i < vidas ? 1 : 0.25,
            transform: i < vidas ? 'scale(1)' : 'scale(0.85)',
            textShadow: i < vidas ? '0 0 18px rgba(245,55,17,.55)' : 'none',
            transition: 'all .25s ease',
          }}>{i < vidas ? '❤️' : '🤍'}</span>
        ))}
        <span style={{ marginLeft: 22, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 60, color: 'var(--muted)' }}>
          Curso · {vidas}/{VIDAS}
        </span>
      </div>

      {/* Pista opcional */}
      {actual.pista && !terminado && (
        <div style={{ marginTop: 18, fontSize: 40, fontWeight: 700, color: '#F2F5EF', textAlign: 'center', maxWidth: 1500 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Pista: </span>{actual.pista}
        </div>
      )}

      {/* La palabra con guiones (no se parte: nowrap + casillas adaptables) */}
      <div style={{ display: 'flex', gap: 12, marginTop: 40, flexWrap: 'nowrap', justifyContent: 'center', maxWidth: '95%' }}>
        {palabra.split('').map((ch, i) => {
          if (!esLetra(ch)) return <div key={i} style={{ width: box * 0.4 }} />;
          const visible = acertadas.has(ch) || ganoProfe;
          const fallada = ganoProfe && !acertadas.has(ch);
          return (
            <div key={i} style={{
              width: box, minWidth: box, height: box * 1.15, borderRadius: 12, display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: fontBox,
              borderBottom: '6px solid ' + (visible ? tool.color : '#5A6157'),
              color: fallada ? '#F53711' : (visible ? '#F2F5EF' : 'transparent'),
              transition: 'all .25s ease',
            }}>{visible ? ch : '?'}</div>
          );
        })}
      </div>

      {/* Resultado */}
      {terminado && (
        <div className="fade-up" style={{
          marginTop: 36, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 52,
          color: ganoCurso ? '#11F555' : '#F53711',
        }}>
          {ganoCurso ? '🎉 ¡Ganó el Curso!' : '😎 Ganó el Profe'}
        </div>
      )}

      {/* Teclado en pantalla */}
      {!terminado && (
        <div style={{ marginTop: 44, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          {filas.map((fila, fi) => (
            <div key={fi} style={{ display: 'flex', gap: 10 }}>
              {fila.split('').map((c) => {
                const intentada = historial.includes(c);
                const acierto = intentada && palabra.includes(c);
                const fallo = intentada && !palabra.includes(c);
                return (
                  <button key={c} onClick={() => intentar(c)}
                    style={{
                      width: 76, height: 84, borderRadius: 12, border: 'none',
                      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36,
                      cursor: 'pointer',
                      background: acierto ? '#11F555' : fallo ? '#F53711' : '#222722',
                      color: intentada ? '#08120B' : '#F2F5EF',
                      opacity: intentada && !acierto && !fallo ? 0.4 : 1,
                      transition: 'all .15s ease',
                    }}>{c}</button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Siguiente palabra */}
      {terminado && items.length > 1 && (
        <button className="act-bigbtn fade-up" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px' }} onClick={siguiente}>
          Siguiente palabra ({(qi % items.length) + 1}/{items.length})
        </button>
      )}
    </div>
  );
}
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
      <div style={{ flex:1, overflowY:'auto', width:'100%', maxWidth:1500, display:'flex', flexDirection:'column', alignItems:'flex-start', paddingRight:10 }}>
      {/* Párrafo con huecos (texto fluido, no flex) */}
      <div style={{ marginTop:28, maxWidth:1500, fontSize:36, lineHeight:2.1, textAlign:'left' }}>
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
                display:'inline-block', textAlign:'center', minWidth:130, padding:'4px 14px', margin:'0 4px',
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
/* ---------- Lluvia de ideas: nube de palabras en vivo ----------
   El docente escribe respuestas del grupo (input + Enter). Cada palabra
   repetida crece (tamaño según frecuencia). Modo en vivo: agregar, borrar,
   reiniciar. config.items (opcional) precarga palabras iniciales. */
function LluviaRun({ config, tool, remoteSignal }) {
  // Normaliza para contar repeticiones sin distinguir mayúsculas/acentos finales.
  const norm = (s) => s.trim().toLowerCase();
  const inicial = () => {
    const m = {};
    (config.items || []).forEach((linea) => {
      (linea || '').split(',').forEach((p) => {
        const k = norm(p);
        if (k) m[k] = (m[k] || 0) + 1;
      });
    });
    // Guardamos el texto "bonito" (primera forma vista) junto al conteo.
    const orden = [];
    (config.items || []).forEach((linea) => {
      (linea || '').split(',').forEach((p) => {
        const k = norm(p);
        if (k && !orden.find((o) => o.key === k)) orden.push({ key: k, texto: p.trim() });
      });
    });
    return orden.map((o) => ({ key: o.key, texto: o.texto, n: m[o.key] }));
  };

  const [palabras, setPalabras] = React.useState(inicial);
  const [texto, setTexto] = React.useState('');
  const inputRef = React.useRef(null);

  React.useEffect(() => { setPalabras(inicial()); }, [config.items]);

  const agregar = (raw) => {
    const t = (raw == null ? texto : raw);
    const k = norm(t);
    if (!k) return;
    setPalabras((prev) => {
      const i = prev.findIndex((p) => p.key === k);
      if (i >= 0) {
        const next = prev.slice();
        next[i] = { ...next[i], n: next[i].n + 1 };
        return next;
      }
      return [...prev, { key: k, texto: t.trim(), n: 1 }];
    });
    setTexto('');
    if (inputRef.current) inputRef.current.focus();
  };
  const quitar = (key) => setPalabras((prev) => prev.filter((p) => p.key !== key));
  const reiniciar = () => setPalabras([]);

  // Control remoto: la acción principal enfoca el campo (para escribir desde la TV).
  useRemoteAction(remoteSignal, { primary: () => inputRef.current && inputRef.current.focus() });

  // Tamaño de fuente según frecuencia (mín 40, crece con cada repetición).
  const maxN = palabras.reduce((m, p) => Math.max(m, p.n), 1);
  const fontFor = (n) => 40 + Math.round((n / maxN) * 96); // 40–136 px
  const colorFor = (i) => ACT_PALETTE[i % ACT_PALETTE.length];

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      {/* Nube de palabras */}
      <div style={{
        marginTop: 30, width: 1500, minHeight: 460, display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'center', gap: '14px 30px',
        padding: '30px 40px', borderRadius: 28, background: '#11160F', border: '3px solid #2A2F29',
        alignContent: 'center',
      }}>
        {palabras.length === 0 ? (
          <div style={{ color: '#5C6359', fontSize: 38, fontFamily: 'var(--font-display)' }}>
            Escribe las ideas del grupo abajo y aparecerán aquí…
          </div>
        ) : palabras.map((p, i) => (
          <span key={p.key} className="fade-up" title={p.n > 1 ? (p.n + ' veces') : ''}
            onClick={() => quitar(p.key)}
            style={{
              cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: fontFor(p.n), lineHeight: 1, color: colorFor(i),
              display: 'inline-flex', alignItems: 'center', gap: 10,
            }}>
            {p.texto}
            {p.n > 1 && (
              <span style={{
                fontSize: Math.max(20, fontFor(p.n) * 0.34), background: '#000', color: colorFor(i),
                borderRadius: 999, padding: '2px 12px', fontWeight: 800,
              }}>{p.n}</span>
            )}
          </span>
        ))}
      </div>

      {/* Entrada en vivo */}
      <div style={{ display: 'flex', gap: 14, marginTop: 26, width: 1100 }}>
        <input
          ref={inputRef} value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') agregar(); }}
          placeholder="Escribe una idea y pulsa Enter…"
          style={{
            flex: 1, fontSize: 34, padding: '18px 24px', borderRadius: 16,
            border: '3px solid #2A2F29', background: '#0B0E0B', color: '#F2F5EF',
            fontFamily: 'var(--font-display)', fontWeight: 600,
          }} />
        <button className="act-bigbtn" onClick={() => agregar()}
          style={{ background: tool.color, color: '#06140A', fontSize: 30, padding: '0 40px', margin: 0 }}>
          Añadir
        </button>
        {palabras.length > 0 && (
          <button className="act-bigbtn" onClick={reiniciar}
            style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 26, padding: '0 28px', margin: 0 }}>
            Reiniciar
          </button>
        )}
      </div>
      <div style={{ color: '#7B857A', fontSize: 22, marginTop: 12 }}>
        Toca una palabra para quitarla · las repetidas crecen.
      </div>
    </div>
  );
}

/* ---------- Une los pares ----------
   El docente define parejas en el editor (una por línea: izquierda = derecha).
   Cada lado puede ser texto o imagen (prefijo "img:" + URL).
   En Presentar: se barajan ambas columnas; se resuelve por clic
   (clic en un ítem de la izquierda y luego en su pareja a la derecha). */
function parseLado(s) {
  const t = (s || '').trim();
  if (/^img:/i.test(t)) return { tipo: 'imagen', valor: t.replace(/^img:/i, '').trim() };
  return { tipo: 'texto', valor: t };
}
function parsePares(items) {
  return (items || [])
    .map((l) => (l || '').trim())
    .filter(Boolean)
    .map((l, i) => {
      const [izq, der] = l.split('=');
      return { id: i, izq: parseLado(izq), der: parseLado(der || '') };
    })
    .filter((p) => p.izq.valor && p.der.valor);
}
// Baraja con índice estable (mismo orden mientras no cambie la actividad).
function barajar(arr, seed) {
  const a = arr.slice();
  let s = seed || 1;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function LadoCelda({ lado }) {
  if (lado.tipo === 'imagen') {
    return <img src={lado.valor} alt="" style={{ maxWidth: '100%', maxHeight: 120, objectFit: 'contain', borderRadius: 12, display: 'block', margin: '0 auto' }} />;
  }
  return <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, lineHeight: 1.15 }}>{lado.valor}</span>;
}

function ParesRun({ config, tool, remoteSignal }) {
  const pares = React.useMemo(() => parsePares(config.items), [config.items]);
  const seed = React.useMemo(() => (config.items || []).join('|').length + pares.length * 7, [config.items]);

  // Columnas barajadas de forma independiente.
  const colIzq = React.useMemo(() => barajar(pares.map((p) => p.id), seed + 1), [pares, seed]);
  const colDer = React.useMemo(() => barajar(pares.map((p) => p.id), seed + 2), [pares, seed]);
  const byId = React.useMemo(() => Object.fromEntries(pares.map((p) => [p.id, p])), [pares]);

  const [selIzq, setSelIzq] = React.useState(null);     // id elegido en la izquierda
  const [resueltos, setResueltos] = React.useState([]); // ids ya emparejados
  const [errorPar, setErrorPar] = React.useState(null); // id que parpadea en rojo

  const reset = () => { setSelIzq(null); setResueltos([]); setErrorPar(null); };
  React.useEffect(() => { reset(); }, [config.items]);

  const elegirIzq = (id) => { if (resueltos.includes(id)) return; setSelIzq(id); setErrorPar(null); };
  const elegirDer = (id) => {
    if (resueltos.includes(id)) return;
    if (selIzq == null) return;
    if (selIzq === id) {
      setResueltos((r) => [...r, id]); setSelIzq(null);
    } else {
      setErrorPar(id);
      setTimeout(() => setErrorPar(null), 600);
      setSelIzq(null);
    }
  };

  // Control remoto: acción principal = reiniciar el ejercicio.
  useRemoteAction(remoteSignal, { primary: reset, next: reset });

  if (!pares.length) return <FichaRun config={config} tool={tool} />;
  const completo = resueltos.length === pares.length;

  const celdaBase = {
    width: 560, minHeight: 96, display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '16px 22px', borderRadius: 18, border: '3px solid #2A2F29', background: '#141814',
    color: '#F2F5EF', cursor: 'pointer', boxSizing: 'border-box', transition: 'all .15s',
  };
  const estiloIzq = (id) => {
    if (resueltos.includes(id)) return { ...celdaBase, borderColor: '#11F555', background: 'rgba(17,245,85,.12)', cursor: 'default' };
    if (selIzq === id) return { ...celdaBase, borderColor: '#116CF5', background: 'rgba(17,108,245,.16)' };
    return celdaBase;
  };
  const estiloDer = (id) => {
    if (resueltos.includes(id)) return { ...celdaBase, borderColor: '#11F555', background: 'rgba(17,245,85,.12)', cursor: 'default' };
    if (errorPar === id) return { ...celdaBase, borderColor: '#F53711', background: 'rgba(245,55,17,.16)' };
    return celdaBase;
  };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ display: 'flex', gap: 80, marginTop: 30, alignItems: 'flex-start', justifyContent: 'center' }}>
        {/* Columna izquierda */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {colIzq.map((id) => (
            <div key={'i' + id} style={estiloIzq(id)} onClick={() => elegirIzq(id)}>
              <LadoCelda lado={byId[id].izq} />
            </div>
          ))}
        </div>
        {/* Columna derecha */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {colDer.map((id) => (
            <div key={'d' + id} style={estiloDer(id)} onClick={() => elegirDer(id)}>
              <LadoCelda lado={byId[id].der} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 28, color: completo ? '#11F555' : '#9AA396' }}>
          {completo ? '¡Todos los pares unidos! 🎉' : (resueltos.length + ' / ' + pares.length + ' unidos')}
        </div>
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}

/* ---------- Encuesta rápida: votación en vivo ----------
   El docente define las opciones (una por línea). En Presentar cada opción
   tiene botones +/− para sumar votos; las barras crecen por porcentaje y se
   ve el total. Sin generación automática: el conteo lo lleva el docente. */
function EncuestaRun({ config, tool, remoteSignal }) {
  const opciones = (config.items || []).filter((x) => x.trim());
  const [votos, setVotos] = React.useState(opciones.map(() => 0));
  React.useEffect(() => { setVotos(opciones.map(() => 0)); }, [config.items]);

  if (!opciones.length) return <FichaRun config={config} tool={tool} />;

  const total = votos.reduce((a, b) => a + b, 0);
  const bump = (i, d) => setVotos((v) => v.map((x, j) => (j === i ? Math.max(0, x + d) : x)));
  const reset = () => setVotos(opciones.map(() => 0));
  const maxV = Math.max(1, ...votos);

  // Control remoto: acción principal reinicia el conteo.
  useRemoteAction(remoteSignal, { primary: reset, next: reset });

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ width: 1400, marginTop: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
        {opciones.map((op, i) => {
          const v = votos[i];
          const pct = total ? Math.round((v / total) * 100) : 0;
          const color = ACT_PALETTE[i % ACT_PALETTE.length];
          const lider = v === maxV && v > 0;
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 22,
              background: '#141814', border: '3px solid ' + (lider ? color : '#2A2F29'),
              borderRadius: 20, padding: '16px 22px',
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 34, color: '#F2F5EF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{op}</span>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color }}>{pct}%</span>
                </div>
                <div style={{ height: 26, borderRadius: 13, background: '#0B0E0B', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 13, transition: 'width .4s cubic-bezier(.2,.8,.2,1)' }} />
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 46, minWidth: 70, textAlign: 'center', color }}>{v}</div>
              <button onClick={() => bump(i, -1)} style={encBtn('#1C201B', '#9AA396')}>−</button>
              <button onClick={() => bump(i, 1)} style={encBtn(color, '#06140A')}>+</button>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, color: '#9AA396' }}>
          Total de votos: <span style={{ color: '#F2F5EF' }}>{total}</span>
        </div>
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          Reiniciar
        </button>
      </div>
    </div>
  );
}
const encBtn = (bg, fg) => ({
  width: 64, height: 64, fontSize: 40, fontWeight: 800, flexShrink: 0,
  borderRadius: 14, border: 'none', background: bg, color: fg, cursor: 'pointer',
  fontFamily: 'var(--font-display)',
});

/* ---------- Debate: dos posturas ----------
   La pregunta del debate arriba; dos paneles (A y B), cada uno con su propio
   cronómetro independiente (iniciar/pausar/reiniciar).
   config.items: línea 1 = pregunta; línea 2 = nombre postura A; línea 3 = nombre B.
   config.duracion = segundos por postura. */
function CronoPostura({ nombre, color, duracion }) {
  const [secs, running, ctl] = useCountdown(duracion || 120);
  const low = secs <= 10 && secs > 0;
  return (
    <div style={{
      flex: 1, background: '#141814', border: '3px solid ' + color, borderRadius: 24,
      padding: '28px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color }}>{nombre}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 120, lineHeight: 1, color: secs === 0 ? '#F53711' : low ? '#F53711' : '#F2F5EF' }}>
        {secs === 0 ? '¡Tiempo!' : fmtTime(secs)}
      </div>
      <div style={{ display: 'flex', gap: 12 }}>
        {!running
          ? <button onClick={ctl.start} style={dbgBtn(color, '#06140A')}>{secs === (duracion || 120) ? 'Iniciar' : 'Seguir'}</button>
          : <button onClick={ctl.pause} style={dbgBtn('#2A2F29', '#fff')}>Pausar</button>}
        <button onClick={ctl.reset} style={dbgBtn('transparent', '#9AA396', true)}>Reiniciar</button>
      </div>
    </div>
  );
}
const dbgBtn = (bg, fg, borde) => ({
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, padding: '12px 26px',
  borderRadius: 14, border: borde ? '3px solid #2A2F29' : 'none', background: bg, color: fg, cursor: 'pointer',
});
function DebateRun({ config, tool }) {
  const lineas = (config.items || []).filter((x) => x.trim());
  const pregunta = lineas[0] || config.titulo;
  const nombreA = lineas[1] || 'A favor';
  const nombreB = lineas[2] || 'En contra';
  return (
    <div className="act-stage">
      <div className="act-kicker" style={{ color: tool.color, display: 'flex', alignItems: 'center', gap: 16, justifyContent: 'center' }}>
        <Icon name={tool.icon} size={32} /> {tool.nombre}
      </div>
      <div style={{
        marginTop: 18, maxWidth: 1500, padding: '26px 50px', borderRadius: 22,
        background: '#161A15', border: '3px solid #2A2F29',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.2, textAlign: 'center',
      }}>{pregunta}</div>

      <div style={{ display: 'flex', gap: 40, marginTop: 36, width: 1500 }}>
        <CronoPostura nombre={nombreA} color="#116CF5" duracion={config.duracion} />
        <CronoPostura nombre={nombreB} color="#F53711" duracion={config.duracion} />
      </div>
    </div>
  );
}

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

/* ---------- Ordena los pasos ----------
   El docente escribe los pasos EN ORDEN CORRECTO (uno por línea).
   En Presentar se muestran barajados; el grupo los arrastra y suelta para
   reordenar y pulsa "Comprobar": cada paso se marca verde (posición correcta)
   o rojo (incorrecta). config.items = pasos en su orden correcto. */
function OrdenaRun({ config, tool, remoteSignal }) {
  // Cada paso lleva su índice correcto (orden en que lo escribió el docente).
  const pasosCorrectos = React.useMemo(
    () => (config.items || []).map((t, i) => ({ id: i, texto: (t || '').trim() })).filter((p) => p.texto),
    [config.items]
  );
  const seed = React.useMemo(() => (config.items || []).join('|').length + pasosCorrectos.length * 11, [config.items]);

  // Orden inicial barajado (estable mientras no cambie la actividad).
  const inicial = React.useMemo(() => barajar(pasosCorrectos, seed), [pasosCorrectos, seed]);
  const [orden, setOrden] = React.useState(inicial);
  const [comprobado, setComprobado] = React.useState(false);
  const arrastreRef = React.useRef(null);

  const reset = () => { setOrden(barajar(pasosCorrectos, seed + Math.floor(Math.random() * 999))); setComprobado(false); };
  React.useEffect(() => { setOrden(inicial); setComprobado(false); }, [inicial]);

  if (!pasosCorrectos.length) return <FichaRun config={config} tool={tool} />;

  // Reordenar al soltar: mueve el paso arrastrado a la posición del destino.
  const soltarEn = (destinoId) => {
    const origenId = arrastreRef.current;
    arrastreRef.current = null;
    if (origenId == null || origenId === destinoId) return;
    setOrden((prev) => {
      const arr = prev.slice();
      const from = arr.findIndex((p) => p.id === origenId);
      const to = arr.findIndex((p) => p.id === destinoId);
      if (from < 0 || to < 0) return prev;
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
    setComprobado(false);
  };

  const aciertos = orden.filter((p, i) => p.id === i).length;
  const completo = comprobado && aciertos === orden.length;

  useRemoteAction(remoteSignal, { primary: () => setComprobado(true), next: reset });

  const colorPaso = (p, i) => {
    if (!comprobado) return { border: '3px solid #2A2F29', background: '#141814' };
    return p.id === i
      ? { border: '3px solid #11F555', background: 'rgba(17,245,85,.12)' }
      : { border: '3px solid #F53711', background: 'rgba(245,55,17,.12)' };
  };

  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      <div style={{ width: 1300, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orden.map((p, i) => (
          <div key={p.id} draggable={!comprobado}
            onDragStart={() => { arrastreRef.current = p.id; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => soltarEn(p.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 22, padding: '20px 26px',
              borderRadius: 18, cursor: comprobado ? 'default' : 'grab',
              ...colorPaso(p, i), transition: 'all .15s',
            }}>
            <div style={{
              width: 58, height: 58, flexShrink: 0, borderRadius: 14,
              background: tool.color, color: '#06140A', display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32,
            }}>{i + 1}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 36, color: '#F2F5EF' }}>{p.texto}</div>
            {comprobado && (
              <div style={{ fontSize: 34, fontWeight: 800, color: p.id === i ? '#11F555' : '#F53711' }}>
                {p.id === i ? '✓' : '✗'}
              </div>
            )}
            {!comprobado && <div style={{ fontSize: 30, color: '#5C6359' }}>⠿</div>}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 18 }}>
        {!comprobado ? (
          <button className="act-bigbtn" onClick={() => setComprobado(true)}
            style={{ background: tool.color, color: '#06140A', fontSize: 28, padding: '12px 40px', margin: 0 }}>
            Comprobar
          </button>
        ) : (
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: completo ? '#11F555' : '#9AA396' }}>
            {completo ? '¡Orden correcto! 🎉' : (aciertos + ' / ' + orden.length + ' en su lugar')}
          </div>
        )}
        <button className="act-bigbtn" onClick={reset}
          style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', margin: 0 }}>
          {comprobado ? 'Intentar de nuevo' : 'Barajar'}
        </button>
      </div>
      {!comprobado && (
        <div style={{ color: '#7B857A', fontSize: 22, marginTop: 10 }}>
          Arrastra los pasos para ponerlos en orden y pulsa Comprobar.
        </div>
      )}
    </div>
  );
}
/* ================= ACTIVIDADES SOLO PARA EQUIPOS =================
   Pegar este bloque al FINAL de activities.jsx, JUSTO ANTES de la línea
   `window.ActivityRuntimes = { ... }`. Luego reemplazar ese objeto por el
   que aparece más abajo (incluye las 4 nuevas).

   Todas reciben equiposApi = { equipos, sumar(id,pts), color(id) } desde el
   presentador. equipos tiene la forma { id, nombre, color, puntos }.
   Si no hay equiposApi (presentación normal), muestran un aviso. */

function SinEquipos({ texto }) {
  return (
    <div className="act-stage" style={{ justifyContent: 'center' }}>
      <div style={{ fontSize: 40, fontWeight: 800, color: '#F5C211', textAlign: 'center' }}>🏆 {texto}</div>
      <div style={{ fontSize: 26, color: 'var(--muted)', marginTop: 16 }}>Esta actividad solo funciona en presentaciones de Modo Equipos.</div>
    </div>
  );
}

/* ============================================================
   REEMPLAZO de RetaEquipoRun en activities.jsx

   En tu activities.jsx, busca la función completa:

       function RetaEquipoRun({ config, tool, equiposApi }) { ... }

   y reemplázala ENTERA por esta versión.

   Novedad: además del turno automático (avanza al fallar / al pasar de reto),
   ahora hay una fila de botones de equipo arriba de la pregunta para FORZAR
   manualmente qué equipo responde. El equipo activo se resalta con borde blanco.
   ============================================================ */

function RetaEquipoRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Reta al equipo" />;
  const equipos = equiposApi.equipos || [];
  const retos = (config.items || [])
    .map((l) => { const [p, r] = l.split('=').map((s) => s.trim()); return { pregunta: p || '', respuesta: r || '' }; })
    .filter((x) => x.pregunta);
  const puntos = Math.max(1, Number(config.puntos) || 1);

  const [qi, setQi] = React.useState(0);
  const [turno, setTurno] = React.useState(0);     // índice del equipo al que le toca
  const [verResp, setVerResp] = React.useState(false);
  const [resuelto, setResuelto] = React.useState(false);

  if (!retos.length || !equipos.length) return <FichaRun config={config} tool={tool} />;
  const reto = retos[qi % retos.length];
  const equipo = equipos[turno % equipos.length];

  // Forzar manualmente qué equipo responde (no cambia si ya se resolvió el reto).
  const elegirEquipo = (i) => { if (!resuelto) setTurno(i); };

  const acierto = () => {
    equiposApi.sumar(equipo.id, puntos);
    setResuelto(true);
  };
  const fallo = () => {
    // pasa el turno al siguiente equipo, misma pregunta
    setTurno((t) => (t + 1) % equipos.length);
    setVerResp(false);
  };
  const siguiente = () => {
    setQi((q) => (q + 1) % retos.length);
    setTurno((t) => (t + 1) % equipos.length); // rota quién empieza
    setVerResp(false); setResuelto(false);
  };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ fontSize: 22, color: 'var(--muted)', marginTop: 4 }}>
        Reto {(qi % retos.length) + 1} de {retos.length} · vale {puntos} {puntos === 1 ? 'punto' : 'puntos'}
      </div>

      {/* Selector manual de equipo: toca uno para forzar el turno. */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 18 }}>
        {equipos.map((e, i) => {
          const activo = (turno % equipos.length) === i;
          return (
            <button key={e.id} onClick={() => elegirEquipo(i)} disabled={resuelto}
              style={{
                padding: '10px 22px', borderRadius: 14, cursor: resuelto ? 'default' : 'pointer',
                border: activo ? '4px solid #fff' : '4px solid transparent',
                background: e.color, color: '#06140A',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24,
                opacity: resuelto && !activo ? 0.5 : 1,
                transform: activo ? 'scale(1.04)' : 'none', transition: 'all .15s ease',
              }}>
              {e.nombre}
            </button>
          );
        })}
      </div>

      {/* Etiqueta del equipo de turno */}
      <div style={{ marginTop: 16, padding: '14px 32px', borderRadius: 18, background: equipo.color, color: '#06140A',
        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40 }}>
        Turno: {equipo.nombre}
      </div>

      {/* Pregunta */}
      <div style={{ marginTop: 28, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 58, lineHeight: 1.2, textAlign: 'center', maxWidth: 1400 }}>
        {reto.pregunta}
      </div>

      {/* Respuesta revelable */}
      {reto.respuesta && (
        verResp ? (
          <div className="fade-up" style={{ marginTop: 26, fontSize: 40, fontWeight: 700, color: '#11F555' }}>
            Respuesta: {reto.respuesta}
          </div>
        ) : (
          <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 26, padding: '12px 32px', marginTop: 26 }}
            onClick={() => setVerResp(true)}>👁 Ver respuesta</button>
        )
      )}

      {/* Controles */}
      {!resuelto ? (
        <div style={{ display: 'flex', gap: 18, marginTop: 36 }}>
          <button className="act-bigbtn" style={{ background: '#11F555', color: '#06140A', fontSize: 32, padding: '18px 50px' }} onClick={acierto}>
            ✓ Acertó (+{puntos})
          </button>
          <button className="act-bigbtn" style={{ background: '#F53711', color: '#fff', fontSize: 32, padding: '18px 50px' }} onClick={fallo}>
            ✗ Falló · pasa turno
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, marginTop: 32 }}>
          <div className="fade-up" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 44, color: '#11F555' }}>
            🎉 +{puntos} para {equipo.nombre}
          </div>
          {retos.length > 1 && (
            <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px' }} onClick={siguiente}>
              Siguiente reto →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Pulsador por turnos ---------- */
function PulsadorRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Pulsador por turnos" />;
  const equipos = equiposApi.equipos || [];
  const preguntas = (config.items || [])
    .map((l) => { const [p, r] = l.split('=').map((s) => s.trim()); return { pregunta: p || '', respuesta: r || '' }; })
    .filter((x) => x.pregunta);
  const puntos = Math.max(1, Number(config.puntos) || 1);

  const [qi, setQi] = React.useState(0);
  const [pulso, setPulso] = React.useState(null);
  const [bloqueados, setBloqueados] = React.useState([]);
  const [verResp, setVerResp] = React.useState(false);
  const [resuelto, setResuelto] = React.useState(false);

  if (!preguntas.length || !equipos.length) return <FichaRun config={config} tool={tool} />;
  const q = preguntas[qi % preguntas.length];

  const pulsar = (e) => { if (!bloqueados.includes(e.id) && !resuelto) setPulso(e); };
  const acierto = () => { if (pulso) { equiposApi.sumar(pulso.id, puntos); setResuelto(true); } };
  const error = () => {
    if (!pulso) return;
    setBloqueados((b) => [...b, pulso.id]);
    setPulso(null);
  };
  const siguiente = () => {
    setQi((i) => (i + 1) % preguntas.length);
    setPulso(null); setBloqueados([]); setVerResp(false); setResuelto(false);
  };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ fontSize: 22, color: 'var(--muted)', marginTop: 4 }}>
        Pregunta {(qi % preguntas.length) + 1} de {preguntas.length} · vale {puntos} {puntos === 1 ? 'punto' : 'puntos'}
      </div>

      <div style={{ marginTop: 26, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 56, lineHeight: 1.2, textAlign: 'center', maxWidth: 1400 }}>
        {q.pregunta}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'center', marginTop: 36, maxWidth: 1500 }}>
        {equipos.map((e) => {
          const fuera = bloqueados.includes(e.id);
          const activo = pulso && pulso.id === e.id;
          return (
            <button key={e.id} onClick={() => pulsar(e)} disabled={fuera || resuelto}
              style={{ minWidth: 220, padding: '24px 30px', borderRadius: 20, cursor: fuera ? 'not-allowed' : 'pointer',
                border: activo ? '5px solid #fff' : '5px solid transparent',
                background: fuera ? '#2A2F29' : e.color, color: fuera ? '#5A6157' : '#06140A',
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 34,
                opacity: fuera ? 0.5 : 1, transform: activo ? 'scale(1.05)' : 'none', transition: 'all .15s ease' }}>
              {fuera ? '✗ ' : ''}{e.nombre}
            </button>
          );
        })}
      </div>

      {q.respuesta && (
        verResp
          ? <div className="fade-up" style={{ marginTop: 24, fontSize: 38, fontWeight: 700, color: '#11F555' }}>Respuesta: {q.respuesta}</div>
          : <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', marginTop: 24 }} onClick={() => setVerResp(true)}>👁 Ver respuesta</button>
      )}

      {pulso && !resuelto && (
        <div className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 30 }}>
          <span style={{ fontSize: 30, fontWeight: 700 }}>Pulsó <b style={{ color: pulso.color }}>{pulso.nombre}</b>:</span>
          <button className="act-bigbtn" style={{ background: '#11F555', color: '#06140A', fontSize: 28, padding: '14px 38px', marginTop: 0 }} onClick={acierto}>✓ Acertó (+{puntos})</button>
          <button className="act-bigbtn" style={{ background: '#F53711', color: '#fff', fontSize: 28, padding: '14px 38px', marginTop: 0 }} onClick={error}>✗ Falló</button>
        </div>
      )}
      {resuelto && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginTop: 30 }}>
          <div className="fade-up" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 42, color: '#11F555' }}>🎉 +{puntos} para {pulso.nombre}</div>
          {preguntas.length > 1 && <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 28, padding: '14px 40px' }} onClick={siguiente}>Siguiente →</button>}
        </div>
      )}
    </div>
  );
}

/* ---------- Apuesta de puntos ---------- */
function ApuestaRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Apuesta de puntos" />;
  const equipos = equiposApi.equipos || [];
  const preguntas = (config.items || [])
    .map((l) => { const [p, r] = l.split('=').map((s) => s.trim()); return { pregunta: p || '', respuesta: r || '' }; })
    .filter((x) => x.pregunta);

  const [qi, setQi] = React.useState(0);
  const [fase, setFase] = React.useState('apostar');
  const [apuestas, setApuestas] = React.useState({});
  const [verResp, setVerResp] = React.useState(false);

  if (!preguntas.length || !equipos.length) return <FichaRun config={config} tool={tool} />;
  const q = preguntas[qi % preguntas.length];
  const montos = [1, 2, 3, 5];

  const apostar = (eid, m) => setApuestas((a) => ({ ...a, [eid]: m }));
  const todosApostaron = equipos.every((e) => apuestas[e.id]);

  const resolver = (eid, gano) => {
    const m = apuestas[eid] || 0;
    equiposApi.sumar(eid, gano ? m : -m);
    setApuestas((a) => ({ ...a, [eid]: 0 }));
  };
  const siguiente = () => {
    setQi((i) => (i + 1) % preguntas.length);
    setFase('apostar'); setApuestas({}); setVerResp(false);
  };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
      <ActHeader tool={tool} titulo={config.titulo} compact />
      <div style={{ fontSize: 22, color: 'var(--muted)', marginTop: 4 }}>
        Pregunta {(qi % preguntas.length) + 1} de {preguntas.length}
      </div>

      {fase === 'apostar' && (
        <React.Fragment>
          <div style={{ marginTop: 18, fontSize: 30, color: 'var(--muted)' }}>Cada equipo elige cuántos puntos apostar:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 24, width: '100%', maxWidth: 1100 }}>
            {equipos.map((e) => (
              <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ minWidth: 280, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: e.color }}>{e.nombre}</div>
                <span style={{ fontSize: 22, color: 'var(--muted)' }}>({e.puntos || 0} pts)</span>
                <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                  {montos.map((m) => (
                    <button key={m} onClick={() => apostar(e.id, m)}
                      style={{ width: 76, height: 76, borderRadius: 14, cursor: 'pointer',
                        border: apuestas[e.id] === m ? '4px solid #fff' : 'none',
                        background: apuestas[e.id] === m ? e.color : '#222722', color: apuestas[e.id] === m ? '#06140A' : '#F2F5EF',
                        fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32 }}>{m}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="act-bigbtn" style={{ background: todosApostaron ? tool.color : '#2A2F29', color: todosApostaron ? '#06140A' : '#9AA396', fontSize: 30, padding: '16px 48px', marginTop: 34 }}
            onClick={() => todosApostaron && setFase('pregunta')} disabled={!todosApostaron}>
            Mostrar la pregunta →
          </button>
        </React.Fragment>
      )}

      {fase !== 'apostar' && (
        <React.Fragment>
          <div style={{ marginTop: 24, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 54, lineHeight: 1.2, textAlign: 'center', maxWidth: 1400 }}>
            {q.pregunta}
          </div>
          {q.respuesta && (
            verResp
              ? <div className="fade-up" style={{ marginTop: 18, fontSize: 36, fontWeight: 700, color: '#11F555' }}>Respuesta: {q.respuesta}</div>
              : <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '3px solid #2A2F29', fontSize: 24, padding: '10px 28px', marginTop: 18 }} onClick={() => setVerResp(true)}>👁 Ver respuesta</button>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 28, width: '100%', maxWidth: 1100 }}>
            {equipos.map((e) => {
              const m = apuestas[e.id];
              const resueltoEq = m === 0;
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ minWidth: 280, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, color: e.color }}>{e.nombre}</div>
                  {!resueltoEq ? (
                    <React.Fragment>
                      <span style={{ fontSize: 24, color: 'var(--muted)' }}>apostó {m}</span>
                      <div style={{ display: 'flex', gap: 10, marginLeft: 'auto' }}>
                        <button className="act-bigbtn" style={{ background: '#11F555', color: '#06140A', fontSize: 24, padding: '10px 28px', marginTop: 0 }} onClick={() => resolver(e.id, true)}>✓ +{m}</button>
                        <button className="act-bigbtn" style={{ background: '#F53711', color: '#fff', fontSize: 24, padding: '10px 28px', marginTop: 0 }} onClick={() => resolver(e.id, false)}>✗ −{m}</button>
                      </div>
                    </React.Fragment>
                  ) : (
                    <span className="fade-up" style={{ marginLeft: 'auto', fontSize: 26, fontWeight: 700, color: '#9AA396' }}>resuelto ✓</span>
                  )}
                </div>
              );
            })}
          </div>
          {preguntas.length > 1 && (
            <button className="act-bigbtn" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 28, padding: '14px 44px', marginTop: 30 }} onClick={siguiente}>
              Siguiente pregunta →
            </button>
          )}
        </React.Fragment>
      )}
    </div>
  );
}

/* ---------- Recuadros por equipo ---------- */
function RecuadrosRun({ config, tool, equiposApi }) {
  if (!equiposApi) return <SinEquipos texto="Recuadros por equipo" />;
  const equipos = (equiposApi.equipos || []).slice(0, 5);
  const preguntas = (config.items || [])
    .map((l) => l.split('|').map((s) => s.trim()).filter(Boolean))
    .filter((p) => p.length >= 3)
    .map((p) => ({ pregunta: p[0], correcta: p[1], opciones: p.slice(1) }));
  const puntosPorAcierto = Math.max(1, Number(config.puntos) || 2);

  if (preguntas.length < 1 || !equipos.length) return <FichaRun config={config} tool={tool} />;

  const inicial = {};
  equipos.forEach((e) => { inicial[e.id] = { fase: 'jugando', qIdx: 0, abierto: false, texto: '', resultado: null }; });
  const [estado, setEstado] = React.useState(inicial);
  const set = (id, patch) => setEstado((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const hash = (str) => { let s = 2166136261; for (let k = 0; k < str.length; k++) { s ^= str.charCodeAt(k); s = Math.imul(s, 16777619) >>> 0; } return s; };
  const prng = (seed) => () => { seed = (Math.imul(seed, 1103515245) + 12345) >>> 0; return seed / 4294967296; };

  const ordenDeEquipo = (equipoId) => {
    const rand = prng(hash(String(equipoId) + '#orden'));
    const idx = preguntas.map((_, i) => i);
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
    return idx;
  };
  const barajarOpciones = (equipoId, qReal) => {
    const rand = prng(hash(String(equipoId) + '#' + qReal + '#opts'));
    const ops = preguntas[qReal].opciones.map((o, i) => ({ o, esCorrecta: i === 0 }));
    for (let i = ops.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ops[i], ops[j]] = [ops[j], ops[i]]; }
    const idxCorrecta = ops.findIndex((x) => x.esCorrecta);
    return { opciones: ops.map((x) => x.o), letraCorrecta: 'ABCDE'[idxCorrecta] };
  };
  const secuenciaCorrecta = (equipoId) => ordenDeEquipo(equipoId).map((qReal) => barajarOpciones(equipoId, qReal).letraCorrecta);

  const abrir = (id) => set(id, { abierto: true });
  const continuar = (id) => {
    const st = estado[id];
    const orden = ordenDeEquipo(id);
    if (st.qIdx < orden.length - 1) {
      set(id, { qIdx: st.qIdx + 1, abierto: false });
    } else {
      set(id, { fase: 'escribir', abierto: true });
    }
  };
  const comprobar = (id) => {
    const correctas = secuenciaCorrecta(id);
    const escritas = (estado[id].texto || '').toUpperCase().replace(/[^A-E]/g, '').split('');
    let aciertos = 0;
    correctas.forEach((c, i) => { if (escritas[i] === c) aciertos++; });
    const sumados = aciertos * puntosPorAcierto;
    if (sumados > 0) equiposApi.sumar(id, sumados);
    set(id, { fase: 'resultado', resultado: { aciertos, total: correctas.length, sumados, correctas } });
  };

  const renderRecuadro = (e) => {
    const st = estado[e.id];
    const orden = ordenDeEquipo(e.id);
    const abierto = st.abierto || st.fase !== 'jugando';
    const anchoCerrado = 260, anchoAbierto = 560;

    const cabecera = (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: abierto ? 30 : 28, color: '#06140A' }}>{e.nombre}</span>
        {st.fase === 'jugando' && <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'rgba(6,20,10,.6)' }}>{Math.min(st.qIdx + 1, orden.length)}/{orden.length}</span>}
      </div>
    );

    let cuerpo = null;
    if (!abierto) {
      cuerpo = <div style={{ marginTop: 18, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24, color: '#06140A' }}>👆 Tocar</div>;
    } else if (st.fase === 'jugando') {
      const qReal = orden[st.qIdx];
      const { opciones } = barajarOpciones(e.id, qReal);
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
          <button onClick={() => continuar(e.id)}
            style={{ marginTop: 16, width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: '#06140A', color: e.color, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            {st.qIdx < orden.length - 1 ? 'Continuar →' : 'Terminé, escribir →'}
          </button>
        </div>
      );
    } else if (st.fase === 'escribir') {
      cuerpo = (
        <div className="fade-up" style={{ marginTop: 14 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: '#06140A' }}>Escribe tu secuencia</div>
          <div style={{ fontSize: 16, color: 'rgba(6,20,10,.65)', marginTop: 4 }}>Ejemplo: A, C, B, D</div>
          <input value={st.texto} onChange={(ev) => set(e.id, { texto: ev.target.value })}
            placeholder="A, C, B…"
            style={{ marginTop: 12, width: '100%', boxSizing: 'border-box', fontSize: 34, padding: '14px 18px', borderRadius: 12, textAlign: 'center',
              letterSpacing: '.2em', textTransform: 'uppercase', border: '3px solid #06140A', background: 'rgba(255,255,255,.5)',
              color: '#06140A', fontFamily: 'var(--font-display)', fontWeight: 800, outline: 'none' }} />
          <button onClick={() => comprobar(e.id)} disabled={!(st.texto || '').replace(/[^A-Ea-e]/g, '')}
            style={{ marginTop: 14, width: '100%', padding: '14px 0', borderRadius: 14, border: 'none', cursor: 'pointer',
              background: '#06140A', color: e.color, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>
            Comprobar
          </button>
        </div>
      );
    } else if (st.fase === 'resultado' && st.resultado) {
      const r = st.resultado;
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
      <div key={e.id}
        onClick={() => { if (!abierto) abrir(e.id); }}
        style={{
          width: abierto ? anchoAbierto : anchoCerrado,
          minHeight: abierto ? 'auto' : 260,
          maxWidth: '92vw',
          borderRadius: 24, padding: abierto ? '22px 24px' : '0',
          background: e.color, color: '#06140A',
          display: 'flex', flexDirection: 'column', justifyContent: abierto ? 'flex-start' : 'center',
          alignItems: abierto ? 'stretch' : 'center',
          cursor: abierto ? 'default' : 'pointer',
          boxShadow: '0 14px 34px -14px rgba(0,0,0,.6)',
          transition: 'width .25s ease',
        }}>
        {!abierto ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 30, textAlign: 'center' }}>{e.nombre}</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22 }}>👆 Tocar</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, opacity: .7 }}>{Math.min(st.qIdx + 1, orden.length)}/{orden.length}</span>
          </div>
        ) : (
          <React.Fragment>{cabecera}{cuerpo}</React.Fragment>
        )}
      </div>
    );
  };

  const todosListos = equipos.every((e) => estado[e.id].fase === 'resultado');

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 16, height: '100%', overflow: 'auto' }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      <div style={{ fontSize: 20, color: 'var(--muted)', marginTop: 4 }}>
        {preguntas.length} preguntas · {puntosPorAcierto} {puntosPorAcierto === 1 ? 'punto' : 'puntos'} por acierto
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 22, marginTop: 30, justifyContent: 'center', alignItems: 'flex-start', maxWidth: 1640 }}>
        {equipos.map(renderRecuadro)}
      </div>
      {todosListos && (
        <div className="fade-up" style={{ marginTop: 30, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 40, color: '#11F555' }}>
          🎉 ¡Todos los equipos terminaron!
        </div>
      )}
    </div>
  );
}

/* ===== Reemplaza tu objeto window.ActivityRuntimes por este (añade las 4) ===== */
window.ActivityRuntimes = {
  ruleta: RuletaRun, completa: CompletaRun, elige: EligeRun, vf: VFRun,
  selector: SelectorRun, dado: DadoRun, marcador: MarcadorRun,
  problema: ProblemaRun, crea: FichaRun, temporizador: TemporizadorRun,
  ahorcado: AhorcadoRun, sopa: SopaRun, crucigrama: CrucigramaRun, reto: RetoRun,
  organiza: OrganizaRun, descubre: DescubreRun, default: FichaRun,
  stop: StopRun, errores: DiferenciasRun, acertijo: AcertijoRun,
  lluvia: LluviaRun, pares: ParesRun,
  encuesta: EncuestaRun, debate: DebateRun, memorama: MemoramaRun,
  ordena: OrdenaRun,
  // --- actividades de equipo (Entrega 2) ---
  retaEquipo: RetaEquipoRun, pulsador: PulsadorRun, apuesta: ApuestaRun, recuadros: RecuadrosRun,
};
Object.assign(window, { FichaRun, SinEquipos, RetaEquipoRun, PulsadorRun, ApuestaRun, RecuadrosRun });