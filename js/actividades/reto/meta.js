/* Reto relámpago — datos de la actividad (código en reto.jsx). */
Actividades.registrar({
  id: 'reto',
  version: '20261017a',
  nombre: 'Reto relámpago',
  desc: 'Desafío sorpresa de 60 segundos',
  color: '#F53711',
  icon: 'rayo',
  grupo: 'cognitivos', orden: 30,

  config(base) {
    base.duracion = 180;
  },

  campos: {
    label: 'Pasos de la rutina (uno por línea)',
    hint: 'Formato: Reto = URL de imagen o video (la URL es opcional). Ej: 10 sentadillas = https://...',
  },

  guia: {
    que: 'Retos sorpresa numerados. Al tocar uno se abre en grande (con imagen o video opcional).',
    comoVe: 'Botones numerados; al pulsar uno aparece el reto a pantalla completa.',
    formato: 'Cada línea: Reto = URL de imagen o video (la URL es opcional).',
    ejemplo: {
      titulo: 'Reto relámpago',
      instrucciones: 'Pulsa un número y completa el reto sorpresa.',
      items: [
        'Salta 10 veces como una rana',
        'Di tres palabras que empiecen con M',
        'Imita a tu animal favorito',
        'Cuenta de 2 en 2 hasta 20',
      ],
    },
  },
});
