/* Encuentra las diferencias — datos de la actividad (código en errores.jsx). */
Actividades.registrar({
  id: 'errores',
  version: '20261017a',
  nombre: 'Encuentra las diferencias',
  desc: 'Busca las diferencias en la imagen',
  color: '#116CF5',
  icon: 'eye',
  grupo: 'cognitivos', orden: 60,
  editorPropio: true,

  config(base) {
    base.duracion = 180;
  },

  guia: {
    que: 'Encuentra las diferencias entre dos imágenes (o una imagen comparada).',
    comoVe: 'Las imágenes lado a lado; al hacer clic en una diferencia se marca con un círculo verde.',
    formato: 'Pega la URL de la imagen y marca con clic dónde están las diferencias.',
    ejemplo: {
      titulo: 'Encuentra las diferencias',
      instrucciones: 'Observa con atención y toca cada diferencia que encuentres.',
      modo: 'dos',
      img1: '',
      img2: '',
      puntos: [],
    },
  },
});
