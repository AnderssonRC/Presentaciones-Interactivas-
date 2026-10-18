/* Ahorcado — datos de la actividad (código en ahorcado.jsx). */
Actividades.registrar({
  id: 'ahorcado',
  version: '20261017a',
  nombre: 'Ahorcado',
  desc: 'Adivina la palabra letra por letra',
  color: '#116CF5',
  icon: 'ahorcado',
  grupo: 'cognitivos', orden: 20,

  config(base) {
    base.duracion = 180;
  },

  campos: {
    label: 'Palabras a adivinar (una por línea)',
    hint: 'Formato: PALABRA=pista (la pista es opcional). Ej: ELEFANTE=Animal con trompa',
  },

  guia: {
    que: 'El curso adivina la palabra letra por letra. Profe vs. Curso.',
    comoVe: 'La palabra oculta con guiones, corazones de vidas y un teclado en pantalla.',
    formato: 'Cada línea: PALABRA = pista. La pista es opcional pero ayuda mucho.',
    ejemplo: {
      titulo: 'Ahorcado: la geografía',
      instrucciones: 'Adivinen la palabra letra por letra antes de quedarse sin vidas.',
      items: [
        'MONTAÑA=Elevación natural muy alta del terreno',
        'OCEANO=La mayor masa de agua salada',
        'DESIERTO=Lugar muy seco con poca lluvia',
      ],
    },
  },
});
