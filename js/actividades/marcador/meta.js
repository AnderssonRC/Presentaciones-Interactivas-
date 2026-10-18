/* Marcador de equipos — datos de la actividad (código en marcador.jsx). */
Actividades.registrar({
  id: 'marcador',
  version: '20261017a',
  nombre: 'Marcador de equipos',
  desc: 'Puntajes en vivo por equipo',
  color: '#F53711',
  icon: 'trofeo',
  grupo: 'evaluadoras', orden: 140,

  config(base) {
    base.items = ['Equipo Verde', 'Equipo Naranja'];
    base.instrucciones = 'Suma puntos a cada equipo durante la clase.';
  },

  campos: {
    label: 'Nombres de los equipos (uno por línea)',
  },

  guia: {
    que: 'Lleva el puntaje de cada equipo en vivo.',
    comoVe: 'Tarjetas grandes por equipo con botones + y − para sumar o restar puntos.',
    formato: 'Un nombre de equipo por línea (hasta 4 equipos).',
    ejemplo: {
      titulo: 'Marcador de la clase',
      instrucciones: 'Suma puntos a cada equipo durante la clase.',
      items: ['Equipo Verde', 'Equipo Naranja', 'Equipo Azul'],
    },
  },
});
