/* Selector de estudiante — datos de la actividad (código en selector.jsx). */
Actividades.registrar({
  id: 'selector',
  version: '20261017a',
  nombre: 'Selector de estudiante',
  desc: 'Elige un participante al azar',
  color: '#116CF5',
  icon: 'user',
  grupo: 'evaluadoras', orden: 120,

  config(base) {
    base.items = ['Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Pedro'];
    base.instrucciones = 'El selector elegirá un participante al azar.';
  },

  campos: {
    label: 'Nombres de estudiantes (uno por línea)',
  },

  guia: {
    que: 'Elige a un estudiante al azar. Perfecto para repartir turnos sin discusiones.',
    comoVe: 'Los nombres giran rapidísimo y se detienen en uno, en grande.',
    formato: 'Un nombre por línea.',
    ejemplo: {
      titulo: '¿Quién pasa al tablero?',
      instrucciones: 'El selector elegirá un participante al azar.',
      items: ['Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Pedro', 'Lucía', 'Diego'],
    },
  },
});
