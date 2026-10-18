/* Apuesta de puntos — datos de la actividad (código en apuesta.jsx). */
Actividades.registrar({
  id: 'apuesta',
  version: '20261017a',
  nombre: 'Apuesta de puntos',
  desc: 'Cada equipo apuesta antes de responder',
  color: '#116CF5',
  icon: 'trofeo',
  grupo: 'equipos', orden: 30,

  config(base) {
    base.items = ['¿Cuántos continentes hay?=7', '¿Quién escribió Cien años de soledad?=García Márquez'];
    base.instrucciones = 'Cada equipo apuesta puntos antes de ver la pregunta. Si acierta gana lo apostado; si falla, lo pierde.';
  },

  guia: {
    que: 'Cada equipo apuesta puntos antes de ver si acierta. Si acierta gana lo apostado; si falla, lo pierde.',
    comoVe: 'Primero cada equipo elige su apuesta; luego sale la pregunta y se resuelve equipo por equipo.',
    formato: 'Cada línea: Pregunta = respuesta (la respuesta es opcional).',
    ejemplo: {
      titulo: 'Apuesta de puntos',
      instrucciones: 'Apuesta con cabeza: puedes ganar mucho… o perderlo.',
      items: [
        '¿Cuál es el océano más grande? = el Pacífico',
        '¿Cuánto es 12 × 12? = 144',
        '¿Quién escribió Don Quijote? = Miguel de Cervantes',
      ],
    },
  },
});
