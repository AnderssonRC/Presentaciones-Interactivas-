/* Pulsador por turnos — datos de la actividad (código en pulsador.jsx). */
Actividades.registrar({
  id: 'pulsador',
  version: '20261017a',
  nombre: 'Pulsador por turnos',
  desc: 'El equipo que pulsa primero responde',
  color: '#11F555',
  icon: 'rayo',
  grupo: 'equipos', orden: 20,

  config(base) {
    base.items = ['¿En qué año llegó el hombre a la Luna?=1969', '¿Cuál es el río más largo del mundo?=Amazonas'];
    base.instrucciones = 'El primer equipo que pulse responde. Si falla, queda fuera de esa pregunta.';
    base.puntos = 1;
  },

  guia: {
    que: 'Aparece una pregunta y el equipo que "pulsa" primero responde. Si falla, queda fuera y pulsan los demás.',
    comoVe: 'Un botón grande por equipo; el docente toca quién pulsó primero y marca si acertó.',
    formato: 'Cada línea: Pregunta = respuesta (la respuesta es opcional).',
    ejemplo: {
      titulo: 'Pulsador por turnos',
      instrucciones: 'El equipo que pulse primero tiene derecho a responder.',
      puntos: 3,
      items: [
        '¿En qué año llegó el hombre a la Luna? = 1969',
        '¿Cuál es el animal terrestre más rápido? = el guepardo',
        '¿Cuántos lados tiene un hexágono? = 6',
      ],
    },
  },
});
