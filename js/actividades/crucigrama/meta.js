/* Crucigrama — datos de la actividad (código en crucigrama.jsx). */
Actividades.registrar({
  id: 'crucigrama',
  version: '20261017a',
  nombre: 'Crucigrama',
  desc: 'Cruza palabras por sus pistas',
  color: '#116CF5',
  icon: 'sopa',
  grupo: 'cognitivos', orden: 120,

  config(base) {
    base.duracion = 180;
  },

  guia: {
    que: 'Crucigrama que se arma solo cruzando las palabras por sus pistas.',
    comoVe: 'Una cuadrícula con números y la lista de pistas horizontales y verticales.',
    formato: 'Cada línea: PALABRA = pista. El crucigrama cruza las palabras automáticamente.',
    ejemplo: {
      titulo: 'Crucigrama de animales',
      instrucciones: 'Completa las palabras usando las pistas.',
      items: [
        'LEON=El rey de la selva',
        'ELEFANTE=El animal terrestre más grande, con trompa',
        'TIGRE=Felino naranja con rayas negras',
        'MONO=Le encantan los plátanos y trepa árboles',
      ],
    },
  },
});
