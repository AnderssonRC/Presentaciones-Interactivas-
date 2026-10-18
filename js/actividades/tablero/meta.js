/* Tablero de números — datos de la actividad (código en tablero.jsx). */
Actividades.registrar({
  id: 'tablero',
  version: '20261017a',
  nombre: 'Tablero de números',
  desc: 'Elige un número y descubre la pregunta',
  color: '#116CF5',
  icon: 'sopa',
  grupo: 'evaluadoras', orden: 160,

  // Funciona con o sin Modo Equipos: sin equipos es un tablero para toda la
  // clase (sin turnos ni puntaje); con Modo Equipos activo, reparte turnos
  // entre los equipos y reparte los puntos al acertar.
  config(base) {
    base.items = [
      '¿Capital de Francia?=París',
      '¿Cuánto es 9 × 6?=54',
      '¿Río más largo del mundo?=Amazonas',
      '¿Autor de Cien años de soledad?=García Márquez',
      '¿Cuántos huesos tiene el cuerpo humano?=206',
      '¿Planeta más cercano al Sol?=Mercurio',
    ];
    base.instrucciones = 'Elige un número del tablero para descubrir la pregunta que esconde.';
    base.puntos = 1;
  },

  campos: {
    label: 'Preguntas del tablero (una por línea: pregunta=respuesta)',
    hint: 'Formato: Pregunta=Respuesta (la respuesta es opcional). Cada línea es un número del tablero, en orden mezclado. "Puntos por acierto" reparte puntaje si Modo Equipos está activo.',
  },

  guia: {
    que: 'Un tablero de números: cada casilla esconde una pregunta distinta, en orden mezclado. Funciona con toda la clase o, si Modo Equipos está activo, repartiendo turnos y puntos entre los equipos.',
    comoVe: 'Casillas grandes numeradas; al elegir una se revela la pregunta (y la respuesta, si la pides) y la casilla queda marcada. En Modo Equipos se ve además de quién es el turno.',
    formato: 'Cada línea: Pregunta=Respuesta (la respuesta es opcional, se revela con un botón). Cada línea es una casilla del tablero.',
    ejemplo: {
      titulo: 'Tablero de repaso',
      instrucciones: 'Elige un número del tablero para descubrir la pregunta que esconde.',
      puntos: 2,
      items: [
        '¿Capital de Francia?=París',
        '¿Cuánto es 9 × 6?=54',
        '¿Río más largo del mundo?=Amazonas',
        '¿Autor de Cien años de soledad?=García Márquez',
        '¿Cuántos huesos tiene el cuerpo humano?=206',
        '¿Planeta más cercano al Sol?=Mercurio',
      ],
    },
  },
});
