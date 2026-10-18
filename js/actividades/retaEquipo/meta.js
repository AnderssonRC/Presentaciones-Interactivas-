/* Reta al equipo — datos de la actividad (código en retaEquipo.jsx). */
Actividades.registrar({
  id: 'retaEquipo',
  version: '20261017a',
  nombre: 'Reta al equipo',
  desc: 'Preguntas por turnos entre equipos',
  color: '#F53711',
  icon: 'trofeo',
  grupo: 'equipos', orden: 10,

  config(base) {
    base.items = ['¿Cuál es la capital de Francia?=París', '¿Cuánto es 7 × 8?=56', 'Nombra un planeta del sistema solar=Marte'];
    base.instrucciones = 'Por turnos, cada equipo responde. Si acierta gana los puntos; si falla, pasa al siguiente.';
    base.puntos = 1;
  },

  guia: {
    que: 'Preguntas por turnos entre equipos. Si el equipo en turno acierta, suma los puntos; si falla, pasa al siguiente.',
    comoVe: 'Se muestra de quién es el turno y la pregunta; el docente marca acierto o fallo.',
    formato: 'Cada línea: Pregunta = respuesta (la respuesta es opcional, se puede revelar).',
    ejemplo: {
      titulo: 'Reta al equipo',
      instrucciones: 'Por turnos, cada equipo responde para ganar puntos.',
      puntos: 2,
      items: [
        '¿Cuál es la capital de Francia? = París',
        '¿Cuánto es 7 × 8? = 56',
        '¿Qué planeta es el más cercano al Sol? = Mercurio',
        'Nombra un río de América = Amazonas',
      ],
    },
  },
});
