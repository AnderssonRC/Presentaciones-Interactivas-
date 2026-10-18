/* Ruleta de opción múltiple — datos de la actividad (código en ruletaCerrada.jsx). */
Actividades.registrar({
  id: 'ruletaCerrada',
  version: '20261017a',
  nombre: 'Ruleta de opción múltiple',
  desc: 'Gira y decide la pregunta y quién responde',
  color: '#EC4899',
  icon: 'ruleta',
  grupo: 'evaluadoras', orden: 170,
  editorPropio: true,

  // Preguntas de opción múltiple (igual formato que "Elige la respuesta").
  // Además de la pregunta, cada giro decide quién responde: un estudiante al
  // azar (lista `estudiantes`, modo individual) o un equipo (si Modo Equipos
  // está activo, ese equipo gana o pierde `puntos` según acierte o falle).
  config(base) {
    base.items = [
      '¿Cuál es el planeta más cercano al Sol?|Mercurio|Venus|La Tierra',
      '¿Cuánto es 8 × 7?|56|54|64',
      '¿Quién escribió Don Quijote?|Miguel de Cervantes|García Márquez|Borges',
      '¿Cuál es el océano más grande?|el Pacífico|el Atlántico|el Índico',
    ];
    base.estudiantes = ['Ana', 'Carlos', 'María', 'Juan', 'Sofía'];
    base.instrucciones = 'Gira la ruleta: decide la pregunta y quién responde.';
    base.puntos = 2;
  },

  guia: {
    que: 'Como la Ruleta de preguntas, pero de opción múltiple: cada giro decide la pregunta Y quién responde — un estudiante al azar, o un equipo si Modo Equipos está activo (ahí, acertar suma puntos y fallar los resta).',
    comoVe: 'La ruleta gira y se detiene en una pregunta con sus opciones, a la vez que se sortea quién responde. Al elegir una opción se revela si era correcta (y el equipo suma o pierde puntos).',
    formato: 'Preguntas (una por línea): Pregunta|Respuesta correcta|Distractor 1|Distractor 2 (2 a 4 opciones; la PRIMERA tras la pregunta es la correcta). Aparte, una lista de nombres (uno por línea) para el sorteo cuando NO hay Modo Equipos.',
    ejemplo: {
      titulo: 'Ruleta de repaso',
      instrucciones: 'Gira la ruleta: decide la pregunta y quién responde.',
      puntos: 2,
      items: [
        '¿Cuál es el planeta más cercano al Sol?|Mercurio|Venus|La Tierra',
        '¿Cuánto es 8 × 7?|56|54|64',
        '¿Quién escribió Don Quijote?|Miguel de Cervantes|García Márquez|Borges',
        '¿Cuál es el océano más grande?|el Pacífico|el Atlántico|el Índico',
      ],
      estudiantes: ['Ana', 'Carlos', 'María', 'Juan', 'Sofía'],
    },
  },
});
