/* Actividad 'ahorcado' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Ahorcado: Profe vs. Curso ---------- */
function AhorcadoRun({ config, tool, equiposApi }) {
  // Dos modos de texto: presentación normal es "Profe vs. Curso" (el profe
  // "gana" si se acaban las vidas); en Modo Equipos no hay un profe rival,
  // así que en su lugar se anuncia que ganó el grupo.
  const esEquipos = !!equiposApi;
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
  // para que la palabra completa quepa en una línea sin partirse. Se usan
  // casillas grandes y líneas gruesas para que se vea bien desde lejos
  // (la actividad se proyecta en pantalla).
  const nLetras = palabra.split('').filter(esLetra).length;
  const box = nLetras <= 8 ? 118 : nLetras <= 11 ? 96 : nLetras <= 14 ? 78 : 64;
  const fontBox = Math.round(box * 0.72);
  const lineaGrosor = Math.max(8, Math.round(box * 0.11));
  // Líneas en rojo/verde/azul (alternadas), mucho más visibles que un tono
  // apagado único, en vez del color de la herramienta.
  const LINEA_COLORES = ['#F53711', '#11F555', '#116CF5'];
  let contadorLetra = -1;

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
          {esEquipos ? 'Grupo' : 'Curso'} · {vidas}/{VIDAS}
        </span>
      </div>

      {/* Pista opcional */}
      {actual.pista && !terminado && (
        <div style={{ marginTop: 18, fontSize: 40, fontWeight: 700, color: '#F2F5EF', textAlign: 'center', maxWidth: 1500 }}>
          <span style={{ color: 'var(--muted)', fontWeight: 600 }}>Pista: </span>{actual.pista}
        </div>
      )}

      {/* La palabra con guiones (no se parte: nowrap + casillas adaptables) */}
      <div style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'nowrap', justifyContent: 'center', maxWidth: '95%' }}>
        {palabra.split('').map((ch, i) => {
          if (!esLetra(ch)) return <div key={i} style={{ width: box * 0.4 }} />;
          contadorLetra++;
          const visible = acertadas.has(ch) || ganoProfe;
          const fallada = ganoProfe && !acertadas.has(ch);
          const colorLinea = LINEA_COLORES[contadorLetra % LINEA_COLORES.length];
          return (
            <div key={i} style={{
              width: box, minWidth: box, height: box * 1.15, borderRadius: 14, display: 'grid', placeItems: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: fontBox,
              borderBottom: lineaGrosor + 'px solid ' + colorLinea,
              boxShadow: '0 ' + lineaGrosor + 'px 16px -6px ' + colorLinea,
              color: fallada ? '#F53711' : (visible ? '#F2F5EF' : 'transparent'),
              textShadow: visible && !fallada ? '0 0 14px rgba(242,245,239,.35)' : 'none',
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
          {ganoCurso
            ? (esEquipos ? '🏆 ¡Ganó el Grupo!' : '🎉 ¡Ganó el Curso!')
            : (esEquipos ? '💀 ¡Perdió el Grupo!' : '😎 Ganó el Profe')}
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

Actividades.definir('ahorcado', { Run: AhorcadoRun });
