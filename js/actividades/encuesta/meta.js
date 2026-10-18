/* Encuesta rápida — datos de la actividad (código en encuesta.jsx). */
Actividades.registrar({
  id: 'encuesta',
  version: '20261017a',
  nombre: 'Encuesta rápida',
  desc: 'Votación a mano alzada con conteo',
  color: '#11F555',
  icon: 'chart',
  grupo: 'evaluadoras', orden: 90,

  config(base) {
    base.items = ['Opción A', 'Opción B', 'Opción C'];
    base.instrucciones = 'Votación a mano alzada: suma los votos de cada opción.';
  },

  campos: {
    label: 'Opciones de la encuesta (una por línea)',
    hint: 'Una opción por línea. En Presentar sumas votos con +/− y las barras crecen.',
  },

  guia: {
    que: 'Una votación rápida a mano alzada: el docente suma los votos de cada opción y las barras crecen en vivo.',
    comoVe: 'Cada opción con su barra de porcentaje y su número de votos; la más votada se resalta.',
    formato: 'Una opción por línea. Durante la actividad usas +/− para contar los votos del grupo.',
    ejemplo: {
      titulo: '¿Qué tema repasamos primero?',
      instrucciones: 'Levanten la mano por su opción; iré sumando.',
      items: ['Fracciones', 'Geometría', 'Multiplicación', 'Problemas'],
    },
  },
});
