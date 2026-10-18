/* Resuelve un problema — datos de la actividad (código en problema.jsx). */
Actividades.registrar({
  id: 'problema',
  version: '20261017a',
  nombre: 'Resuelve un problema',
  desc: 'Reto con tiempo para resolver',
  color: '#F53711',
  icon: 'bulb',
  grupo: 'evaluadoras', orden: 40,
  tiempoSiempre: true,
  timerPropio: true,

  config(base) {
    base.instrucciones = 'Resuelve el problema en tu cuaderno antes de que termine el tiempo.';
    base.items = ['Escribe aquí el enunciado del problema.'];
    base.duracion = 300;
    base.tiempoActivo = true;
  },

  campos: {
    label: 'Enunciado del problema',
    hint: 'La primera línea se muestra en grande durante la actividad.',
  },

  guia: {
    que: 'Un reto para resolver con cuenta regresiva.',
    comoVe: 'El enunciado grande y un cronómetro en marcha.',
    formato: 'Escribe el enunciado del problema (puede ser una sola línea larga). El tiempo se ajusta abajo.',
    ejemplo: {
      titulo: 'Reparte la pizza',
      instrucciones: 'Resuelve en tu cuaderno antes de que termine el tiempo.',
      duracion: 240,
      items: ['Una pizza tiene 8 porciones. Si Ana come 1/4 y Luis come 3/8, ¿cuántas porciones quedan?'],
    },
  },
});
