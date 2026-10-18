/* Actividad 'elige' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Elige la respuesta ----------
   Las opciones se barajan con una semilla sacada del texto de la pregunta:
   el TV y el espejo del celular (student.jsx) muestran el MISMO orden.
   `onQuiz` (lo pasa el Presenter) recibe la pregunta en curso para abrir la
   ronda de Quiz en los celulares: { qid, opciones, correctIdx, fase }.
   `qiControlado` (lo pasa el espejo del celular) fija qué pregunta mostrar,
   para seguir al TV en vez de quedarse siempre en la primera. */
function semillaTexto(s) {
  let h = 7;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 233279) + 1;
}
function EligeRun({ config, tool, remoteSignal, onQuiz, qiControlado }) {
  const items = (config.items || []).map((l) => l.split('|').map((s) => s.trim()).filter(Boolean)).filter((p) => p.length >= 3);
  const [qiLocal, setQi] = React.useState(0);
  const qi = typeof qiControlado === 'number' ? qiControlado : qiLocal;
  const [chosen, setChosen] = React.useState(null);
  const [q, correct, ...rest] = items.length ? items[qi % items.length] : ['', '', ''];
  const options = React.useMemo(() => items.length ? barajar([correct, ...rest], semillaTexto(q + '|' + qi)) : [], [q, qi, items.length]);
  const next = () => { setQi((qi + 1) % Math.max(items.length, 1)); setChosen(null); };
  const reveal = () => { if (chosen === null && options.length) setChosen(options.indexOf(correct)); };
  useRemoteAction(remoteSignal, { primary: reveal, next });
  React.useEffect(() => {
    if (!onQuiz || !items.length) return;
    onQuiz({ qid: qi, opciones: options.map((texto) => ({ texto })), correctIdx: options.indexOf(correct), fase: chosen === null ? 'abierta' : 'cerrada' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qi, chosen === null, items.length]);
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

Actividades.definir('elige', { Run: EligeRun });
