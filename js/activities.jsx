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
function RuletaRun({ config, tool }) {
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
function EligeRun({ config, tool }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim()).filter(Boolean)).filter((p) => p.length >= 3);
  const [qi, setQi] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);
  if (!items.length) return <FichaRun config={config} tool={tool} />;
  const [q, correct, ...rest] = items[qi % items.length];
  const options = React.useMemo(() => [correct, ...rest].sort(() => Math.random() - 0.5), [qi]);
  const next = () => { setQi((qi + 1) % items.length); setChosen(null); };

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
function VFRun({ config, tool }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim())).filter((p) => p[0]);
  const [qi, setQi] = React.useState(0);
  const [chosen, setChosen] = React.useState(null);
  if (!items.length) return <FichaRun config={config} tool={tool} />;
  const [text, a] = items[qi % items.length];
  const answer = (a || 'V').toUpperCase().startsWith('V') ? 'V' : 'F';
  const next = () => { setQi((qi + 1) % items.length); setChosen(null); };

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
function SelectorRun({ config, tool }) {
  const names = (config.items || []).filter((x) => x.trim());
  const [display, setDisplay] = React.useState('¿Quién será?');
  const [picking, setPicking] = React.useState(false);
  const [picked, setPicked] = React.useState(false);
  if (!names.length) return <FichaRun config={config} tool={tool} />;

  const pick = () => {
    if (picking) return;
    setPicking(true); setPicked(false);
    let i = 0;
    const t = setInterval(() => { setDisplay(names[i % names.length]); i++; }, 90);
    setTimeout(() => {
      clearInterval(t);
      setDisplay(names[Math.floor(Math.random() * names.length)]);
      setPicking(false); setPicked(true);
    }, 1800);
  };

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
function DadoRun({ config, tool }) {
  const [val, setVal] = React.useState(null);
  const [rolling, setRolling] = React.useState(false);
  const roll = () => {
    if (rolling) return;
    setRolling(true);
    let i = 0;
    const t = setInterval(() => { setVal(1 + Math.floor(Math.random() * 6)); i++; }, 100);
    setTimeout(() => { clearInterval(t); setVal(1 + Math.floor(Math.random() * 6)); setRolling(false); }, 1400);
  };
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

window.ActivityRuntimes = {
  ruleta: RuletaRun, completa: CompletaRun, elige: EligeRun, vf: VFRun,
  selector: SelectorRun, dado: DadoRun, marcador: MarcadorRun,
  problema: ProblemaRun, crea: FichaRun, temporizador: TemporizadorRun,
  default: FichaRun,
};
Object.assign(window, { FichaRun });
