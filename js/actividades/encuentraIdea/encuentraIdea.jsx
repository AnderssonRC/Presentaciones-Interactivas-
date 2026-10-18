/* Actividad 'encuentraIdea' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Encuentra la idea ----------
   Cada línea es un párrafo; la oración marcada con [corchetes] es la idea
   principal. Se quitan los corchetes y se separa el párrafo en oraciones
   (por ., ! o ?), que funcionan como opciones. Tocar una equivocada la
   marca en naranja y muestra el aviso (sin revelar la correcta); se puede
   seguir intentando. Mismo patrón de "intento sin revelar" que CompletaRun. */
function EncuentraIdeaRun({ config, tool }) {
  const ejercicios = React.useMemo(() =>
    (config.items || [])
      .map((linea) => {
        const m = linea.match(/\[([^\]]+)\]/);
        if (!m) return null;
        const correcta = m[1].trim();
        const plano = linea.replace(/\[|\]/g, '');
        const oraciones = (plano.match(/[^.!?]+[.!?]*/g) || [plano])
          .map((s) => s.trim())
          .filter(Boolean);
        if (!oraciones.some((o) => o === correcta || o.includes(correcta))) return null;
        return { oraciones, correcta };
      })
      .filter(Boolean),
    [config.items]);

  const [qi, setQi] = React.useState(0);
  const [wrong, setWrong] = React.useState([]); // índices de oraciones ya marcadas incorrectas
  const [solved, setSolved] = React.useState(false);

  if (!ejercicios.length) return <FichaRun config={config} tool={tool} />;
  const ej = ejercicios[qi % ejercicios.length];
  const esCorrecta = (o) => o === ej.correcta || o.includes(ej.correcta);

  const elegir = (i, o) => {
    if (solved) return;
    if (esCorrecta(o)) setSolved(true);
    else if (!wrong.includes(i)) setWrong([...wrong, i]);
  };
  const siguiente = () => { setQi((qi + 1) % ejercicios.length); setWrong([]); setSolved(false); };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 60 }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      {ejercicios.length > 1 && (
        <div style={{ marginTop: 6, fontSize: 16, color: 'var(--muted)' }}>
          Párrafo {(qi % ejercicios.length) + 1} de {ejercicios.length}
        </div>
      )}
      {/* Un párrafo compacto y continuo (no una lista de botones separados):
          cada oración es un <span> en línea, sin borde ni caja propia hasta
          que se toca — así se lee como un párrafo normal, no como un menú
          de opciones. Al tocar, se resalta esa porción del texto (como un
          marcador), en vez de convertirla en una tarjeta aparte. */}
      <div style={{
        marginTop: 34, maxWidth: 1500, width: '100%', textAlign: 'left',
        fontFamily: 'var(--font-body)', fontSize: 34, fontWeight: 600, lineHeight: 1.7,
      }}>
        {ej.oraciones.map((o, i) => {
          const marcada = solved && esCorrecta(o);
          const fallada = wrong.includes(i);
          return (
            <span key={i} onClick={() => elegir(i, o)}
              style={{
                cursor: solved ? 'default' : 'pointer',
                borderRadius: 8, padding: '3px 7px', margin: '-3px -7px',
                boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone',
                background: marcada ? '#11F555' : (fallada ? 'rgba(245,55,17,.32)' : 'transparent'),
                color: marcada ? '#06140A' : (fallada ? '#FF9D85' : '#F2F5EF'),
                transition: 'background .15s ease, color .15s ease',
              }}>
              {o}{' '}
            </span>
          );
        })}
      </div>
      {wrong.length > 0 && !solved && (
        <div className="fade-up" style={{ marginTop: 26, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#F53711' }}>
          Incorrecto, es idea secundaria. ¡Sigue intentando!
        </div>
      )}
      {solved && (
        <div className="fade-up" style={{ marginTop: 26, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 36, color: '#11F555' }}>
          🎉 ¡Correcto! Esa es la idea principal.
        </div>
      )}
      {solved && ejercicios.length > 1 && (
        <button className="act-bigbtn fade-up" style={{ background: '#F2F5EF', color: '#08120B', fontSize: 30, padding: '16px 44px' }} onClick={siguiente}>
          Siguiente párrafo ({(qi % ejercicios.length) + 1}/{ejercicios.length})
        </button>
      )}
    </div>
  );
}

Actividades.definir('encuentraIdea', { Run: EncuentraIdeaRun });
