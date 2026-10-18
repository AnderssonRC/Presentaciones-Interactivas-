/* Actividad 'retaEquipo' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Reta al equipo ----------
   Turno automático (avanza al fallar / al pasar de reto) y, arriba de la
   pregunta, una fila de botones de equipo para FORZAR manualmente qué equipo
   responde. El equipo activo se resalta con borde blanco. */
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

Actividades.definir('retaEquipo', { Run: RetaEquipoRun });
