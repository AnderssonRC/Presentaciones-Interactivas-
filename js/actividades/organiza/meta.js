/* Organiza la frase — datos de la actividad (código en organiza.jsx). */
Actividades.registrar({
  id: 'organiza',
  version: '20261017a',
  nombre: 'Organiza la frase',
  desc: 'Ordena las palabras del párrafo',
  color: '#116CF5',
  icon: 'ordena',
  grupo: 'cognitivos', orden: 40,

  config(base) {
    base.duracion = 180;
  },

  campos: {
    label: 'Párrafos con palabras entre [corchetes] (uno por línea)',
    hint: 'Marca con [corchetes] las palabras a ordenar. Ej: El gato [come] pescado y [duerme] mucho.',
  },

  guia: {
    que: 'El grupo arrastra palabras para completar una frase en el orden correcto.',
    comoVe: 'Una frase con huecos y un banco de palabras abajo para arrastrar.',
    formato: 'Escribe la frase y marca con [corchetes] las palabras que el grupo debe arrastrar.',
    ejemplo: {
      titulo: 'Organiza la frase',
      instrucciones: 'Arrastra cada palabra a su lugar correcto.',
      items: [
        'El [Sol] sale por el [este] y se oculta por el [oeste].',
        'El agua hierve a [100] grados y se congela a [0] grados.',
      ],
    },
  },
});
