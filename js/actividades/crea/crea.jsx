/* Actividad 'crea' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Crea una pregunta ----------
   Por ahora es la ficha genérica (título, instrucciones y temporizador).
   Cuando necesite más opciones, se reemplaza FichaRun por su propio componente. */
function CreaRun(props) {
  return <FichaRun {...props} />;
}

Actividades.definir('crea', { Run: CreaRun });
