/* Temporizador — datos de la actividad (código en temporizador.jsx). */
Actividades.registrar({
  id: 'temporizador',
  version: '20261017a',
  nombre: 'Temporizador',
  desc: 'Cuenta regresiva grande y visible',
  color: '#F53711',
  icon: 'clock',
  grupo: 'evaluadoras', orden: 110,
  tiempoSiempre: true,
  timerPropio: true,

  config(base) {
    base.duracion = 300;
    base.instrucciones = 'Tiempo para completar la actividad.';
    base.tiempoActivo = true;
  },

  guia: {
    que: 'Una cuenta regresiva grande y visible para cualquier momento de la clase.',
    comoVe: 'Un cronómetro gigante con botones de iniciar, pausar y reiniciar.',
    formato: 'No necesita lista. Ajusta el tiempo en el campo de segundos.',
    ejemplo: {
      titulo: 'Tiempo para trabajar',
      instrucciones: 'Trabajen en silencio hasta que suene.',
      duracion: 300,
      items: [],
    },
  },
});
