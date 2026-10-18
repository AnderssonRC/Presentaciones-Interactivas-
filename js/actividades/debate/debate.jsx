/* Actividad 'debate' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

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

Actividades.definir('debate', { Run: DebateRun });
