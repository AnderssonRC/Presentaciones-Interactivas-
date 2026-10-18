/* Acertijo — datos de la actividad (código en acertijo.jsx). */
Actividades.registrar({
  id: 'acertijo',
  version: '20261017a',
  nombre: 'Acertijo',
  desc: 'Resuelve el enigma del docente',
  color: '#116CF5',
  icon: 'pregunta',
  grupo: 'cognitivos', orden: 10,

  config(base) {
    base.duracion = 180;
  },

  campos: {
    label: 'Acertijos (uno por línea)',
    hint: 'Formato: enunciado | respuesta | URL (la URL es opcional). Ej: Vuela de noche y duerme de día | murciélago | https://...',
  },

  guia: {
    que: 'Un enigma para resolver escribiendo la respuesta.',
    comoVe: 'El acertijo en grande, un campo de texto y se valida la respuesta.',
    formato: 'Cada línea: Enunciado | respuesta | URL (la URL es opcional).',
    ejemplo: {
      titulo: 'Acertijos del día',
      instrucciones: 'Lee con atención y escribe tu respuesta.',
      items: [
        'Vuela de noche, duerme de día y cuelga cabeza abajo. ¿Qué es? | murciélago',
        'Tengo agujas pero no sé coser, tengo números pero no sé leer. ¿Qué soy? | reloj',
        'Cuanto más le quitas, más grande se hace. ¿Qué es? | un hueco',
      ],
    },
  },
});
