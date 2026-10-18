/* Elige la respuesta — datos de la actividad (código en elige.jsx). */
Actividades.registrar({
  id: 'elige',
  version: '20261017a',
  nombre: 'Elige la respuesta',
  desc: 'Opción múltiple con revelado',
  color: '#116CF5',
  icon: 'check',
  grupo: 'evaluadoras', orden: 20,

  config(base) {
    base.items = ['¿Cuál es la respuesta correcta?|Opción correcta|Distractor 1|Distractor 2'];
    base.instrucciones = 'Lee la pregunta y elige una opción.';
  },

  campos: {
    label: 'Preguntas (una por línea)',
    hint: 'Formato: Pregunta|Respuesta correcta|Distractor 1|Distractor 2',
  },

  guia: {
    que: 'Pregunta de opción múltiple: el grupo elige y se revela si acertó.',
    comoVe: 'Una pregunta arriba y cuatro opciones grandes; al tocar una, se pinta de verde o naranja.',
    formato: 'Cada línea: Pregunta | Respuesta correcta | Opción mala | Opción mala. La PRIMERA opción después de la pregunta es siempre la correcta (el juego las mezcla solo).',
    ejemplo: {
      titulo: '¿Cuánto sabes del Sistema Solar?',
      instrucciones: 'Lee la pregunta y elige una opción.',
      items: [
        '¿Cuál es el planeta más cercano al Sol? | Mercurio | Venus | La Tierra',
        '¿Qué planeta es conocido como el planeta rojo? | Marte | Júpiter | Saturno',
        '¿Cuál es el planeta más grande? | Júpiter | La Tierra | Neptuno',
      ],
    },
  },
});
