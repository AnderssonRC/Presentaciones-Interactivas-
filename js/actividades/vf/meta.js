/* Verdadero o falso — datos de la actividad (código en vf.jsx). */
Actividades.registrar({
  id: 'vf',
  version: '20261017a',
  nombre: 'Verdadero o falso',
  desc: 'Afirmaciones para debatir y revelar',
  color: '#116CF5',
  icon: 'vf',
  grupo: 'evaluadoras', orden: 50,

  config(base) {
    base.items = ['Esta afirmación es verdadera|V', 'Esta afirmación es falsa|F'];
    base.instrucciones = '¿Verdadero o falso? Decide y revela.';
  },

  campos: {
    label: 'Afirmaciones (una por línea)',
    hint: 'Formato: Afirmación|V  o  Afirmación|F',
  },

  guia: {
    que: 'Afirmaciones para decidir si son verdaderas o falsas.',
    comoVe: 'Una frase grande y dos botones: Verdadero y Falso. Al elegir, se revela la respuesta.',
    formato: 'Cada línea: Afirmación | V  (o)  Afirmación | F. Usa V para verdadero y F para falso.',
    ejemplo: {
      titulo: 'Verdadero o falso: los animales',
      instrucciones: '¿Verdadero o falso? Decide y revela.',
      items: [
        'Las ballenas son mamíferos | V',
        'Las arañas son insectos | F',
        'Los murciélagos pueden volar | V',
        'Las serpientes tienen patas | F',
      ],
    },
  },
});
