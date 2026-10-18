/* Ruleta de preguntas — datos de la actividad (código en ruleta.jsx). */
Actividades.registrar({
  id: 'ruleta',
  version: '20261017a',
  nombre: 'Ruleta de preguntas',
  desc: 'Gira y responde la pregunta que toque',
  color: '#11F555',
  icon: 'ruleta',
  grupo: 'evaluadoras', orden: 10,

  config(base) {
    base.items = ['¿Qué aprendimos hoy?', 'Da un ejemplo del tema', 'Explica con tus palabras', '¿Dónde lo ves en tu vida diaria?', 'Pregunta sorpresa del docente'];
    base.instrucciones = 'Gira la ruleta y responde la pregunta que toque.';
  },

  campos: {
    label: 'Preguntas de la ruleta (una por línea)',
    hint: 'Cada línea es un sector de la ruleta.',
  },

  guia: {
    que: 'Una ruleta gira y cae en una pregunta al azar. Ideal para repasar al final de la clase.',
    comoVe: 'El grupo ve girar la ruleta y aparece la pregunta que tocó, en grande.',
    formato: 'Escribe una pregunta por línea. ¡Eso es todo!',
    ejemplo: {
      titulo: 'Ruleta del ciclo del agua',
      instrucciones: 'Gira la ruleta y responde la pregunta que toque.',
      items: [
        '¿Qué es la evaporación?',
        '¿Dónde se forman las nubes?',
        'Nombra dos tipos de precipitación',
        '¿Por qué el agua es importante para la vida?',
        '¿Qué pasa con el agua que cae al suelo?',
      ],
    },
  },
});
