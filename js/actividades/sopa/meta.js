/* Sopa de letras — datos de la actividad (código en sopa.jsx). */
Actividades.registrar({
  id: 'sopa',
  version: '20261017a',
  nombre: 'Sopa de letras',
  desc: 'Encuentra palabras clave del tema',
  color: '#11F555',
  icon: 'sopa',
  grupo: 'cognitivos', orden: 100,
  editorPropio: true,

  config(base) {
    base.duracion = 180;
  },

  guia: {
    que: 'Sopa de letras donde el grupo arrastra para marcar palabras escondidas.',
    comoVe: 'Una cuadrícula de letras y una lista de palabras (o pistas) por encontrar.',
    formato: 'Escribe las palabras según su dirección (horizontal, vertical o diagonal), una por línea, con PALABRA = pista.',
    ejemplo: {
      titulo: 'Sopa de letras: los colores',
      instrucciones: 'Encuentra las palabras escondidas arrastrando el mouse.',
      size: 12,
      items: ['H|ROJO=El color de la sangre', 'H|VERDE=El color de las hojas', 'V|AZUL=El color del cielo', 'V|AMARILLO=El color del sol', 'D|MORADO=Mezcla de azul y rojo'],
    },
  },
});
