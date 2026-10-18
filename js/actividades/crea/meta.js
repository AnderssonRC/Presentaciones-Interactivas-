/* Crea una pregunta — datos de la actividad (código en crea.jsx). */
Actividades.registrar({
  id: 'crea',
  version: '20261017a',
  nombre: 'Crea una pregunta',
  desc: 'Los estudiantes formulan preguntas',
  color: '#11F555',
  icon: 'pregunta',
  grupo: 'evaluadoras', orden: 30,
  tiempoSiempre: true,
  timerPropio: true,

  config(base) {
    base.instrucciones = 'En parejas, escriban una pregunta sobre el tema. La mejor pregunta se responde en grupo.';
    base.duracion = 180;
    base.tiempoActivo = true;
  },

  guia: {
    que: 'Los estudiantes formulan sus propias preguntas. Trabajo en parejas con tiempo.',
    comoVe: 'El título, las instrucciones y un cronómetro para trabajar.',
    formato: 'Solo necesitas un buen título e instrucciones. No requiere lista.',
    ejemplo: {
      titulo: 'Crea una pregunta',
      instrucciones: 'En parejas, escriban una pregunta sobre el tema. La mejor se responde en grupo.',
      duracion: 180,
      items: [],
    },
  },
});
