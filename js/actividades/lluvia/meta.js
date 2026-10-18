/* Lluvia de ideas — datos de la actividad (código en lluvia.jsx). */
Actividades.registrar({
  id: 'lluvia',
  version: '20261017a',
  nombre: 'Lluvia de ideas',
  desc: 'Recoge ideas del grupo en pantalla',
  color: '#116CF5',
  icon: 'cloud',
  grupo: 'evaluadoras', orden: 100,

  config(base) {
    base.items = [];
    base.instrucciones = 'Escribe las ideas del grupo: las repetidas crecen.';
  },

  campos: {
    label: 'Ideas iniciales (opcional, una por línea)',
    hint: 'En vivo escribes las ideas en pantalla. Aquí puedes dejar algunas iniciales (una por línea); las repetidas crecen.',
  },

  guia: {
    que: 'Recoge las ideas del grupo en una nube de palabras que crece en vivo. Las respuestas repetidas se hacen más grandes.',
    comoVe: 'Una nube de palabras de colores; el docente escribe cada idea y aparece al instante, y las repetidas crecen.',
    formato: 'Normalmente se llena en vivo durante la clase. Si quieres, deja aquí algunas ideas iniciales (una por línea).',
    ejemplo: {
      titulo: '¿Qué sabes sobre el reciclaje?',
      instrucciones: 'Digan ideas sobre el tema: las repetidas crecen.',
      items: ['Plástico', 'Vidrio', 'Papel', 'Compost', 'Plástico'],
    },
  },
});
