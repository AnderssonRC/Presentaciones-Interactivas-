/* Recuadros por equipo — datos de la actividad (código en recuadros.jsx). */
Actividades.registrar({
  id: 'recuadros',
  version: '20261017a',
  nombre: 'Recuadros por equipo',
  desc: 'Cada equipo resuelve su propio tablero',
  color: '#F5C211',
  icon: 'memorama',
  grupo: 'equipos', orden: 40,

  // Formato por línea: Pregunta | correcta | opción | opción | opción  (la 1ª opción es la correcta)
  config(base) {
    base.items = [
      '¿Capital de Colombia? | Bogotá | Bogotá | Medellín | Cali',
      '¿2 + 2? | 4 | 4 | 3 | 5',
      '¿Color del cielo despejado? | Azul | Azul | Verde | Rojo',
    ];
    base.instrucciones = 'Cada equipo abre su tablero, responde sus preguntas y escribe la secuencia de respuestas.';
    base.puntos = 2;
  },

  guia: {
    que: 'Hasta 5 recuadros, uno por equipo. El equipo toca su recuadro y ve las preguntas una a una (en orden distinto al de los demás), memoriza sus respuestas y al volver escribe su secuencia (ej: A, C, B). Suma puntos por cada acierto.',
    comoVe: 'Recuadros de colores; al abrir uno salen preguntas con opciones A, B, C, D; al final el equipo escribe sus letras.',
    formato: 'Cada línea: Pregunta | respuesta correcta | opción | opción | opción. La PRIMERA opción tras la pregunta es la correcta (el juego la baraja y cambia la letra para cada equipo).',
    ejemplo: {
      titulo: 'Recuadros del saber',
      instrucciones: 'Cada equipo abre su recuadro, memoriza sus respuestas y luego las escribe.',
      puntos: 5,
      items: [
        '¿Capital de Colombia? | Bogotá | Medellín | Cali | Quito',
        '¿Cuánto es 9 × 6? | 54 | 56 | 48 | 63',
        '¿Planeta más grande? | Júpiter | Saturno | La Tierra | Marte',
        '¿Autor de Cien años de soledad? | García Márquez | Borges | Neruda | Cortázar',
      ],
    },
  },
});
