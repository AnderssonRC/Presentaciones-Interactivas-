/* Actividad 'temporizador' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

function TemporizadorRun({ config, tool }) {
  return (
    <div className="act-stage">
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />
      {AIP.tiempoHabilitado(config, tool.id) && <TimerPanel duracion={config.duracion} accent={tool.color} />}
    </div>
  );
}

Actividades.definir('temporizador', { Run: TemporizadorRun });
