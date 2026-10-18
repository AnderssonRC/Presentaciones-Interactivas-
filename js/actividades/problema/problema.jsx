/* Actividad 'problema' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

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
      {AIP.tiempoHabilitado(config, tool.id) && <TimerPanel duracion={config.duracion} accent={tool.color} />}
    </div>
  );
}

Actividades.definir('problema', { Run: ProblemaRun });
