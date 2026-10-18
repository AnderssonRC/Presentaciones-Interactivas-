/* Completa la palabra — datos de la actividad (código en completa.jsx). */
Actividades.registrar({
  id: 'completa',
  version: '20261017a',
  nombre: 'Completa la palabra',
  desc: 'Encuentra la letra que falta',
  color: '#F53711',
  icon: 'letras',
  grupo: 'cognitivos', orden: 130,

  config(base) {
    base.items = ['EJEMPL_=O', 'PALABR_=A'];
    base.instrucciones = 'Elige la letra que completa la palabra.';
  },

  campos: {
    label: 'Palabras (una por línea)',
    hint: 'Formato: PALABR_=A → usa "_" para la letra oculta y "=" para la respuesta.',
  },

  guia: {
    que: 'Falta una letra en la palabra y el grupo elige cuál es.',
    comoVe: 'La palabra con un hueco y tres letras grandes para elegir.',
    formato: 'Cada línea: PALABRA con "_" donde va el hueco = LETRA correcta. Ejemplo: el guion bajo marca el espacio vacío.',
    ejemplo: {
      titulo: 'Completa: partes de la planta',
      instrucciones: 'Elige la letra que completa la palabra.',
      items: ['RA_Z=I', 'TALL_=O', 'HOJ_=A', 'FLO_=R'],
    },
  },
});
