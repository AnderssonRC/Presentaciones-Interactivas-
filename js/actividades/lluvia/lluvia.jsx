/* Actividad 'lluvia' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

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

Actividades.definir('lluvia', { Run: LluviaRun });
