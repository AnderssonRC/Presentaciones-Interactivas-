/* Stop the clock — datos de la actividad (código en stop.jsx). */
Actividades.registrar({
  id: 'stop',
  version: '20261017a',
  nombre: 'Stop the clock',
  desc: 'Categorías del cuadro (una por línea)',
  color: '#116CF5',
  icon: 'letras',
  grupo: 'cognitivos', orden: 90,

  config(base) {
    base.duracion = 180;
  },

  campos: {
    label: 'Categorías del cuadro (una por línea)',
    hint: 'Una categoría por línea. Ej: Nombre, País, Animal, Color, Comida.',
  },

  guia: {
    que: 'El clásico "Stop": sale una letra y el grupo llena categorías con esa letra.',
    comoVe: 'Una letra gigante y un cuadro con categorías para escribir.',
    formato: 'Una categoría por línea (Nombre, País, Animal…).',
    ejemplo: {
      titulo: 'Stop de la clase',
      instrucciones: 'Con la letra que salga, llena cada categoría lo más rápido posible.',
      items: ['Nombre', 'País', 'Animal', 'Color', 'Comida', 'Objeto'],
    },
  },
});
