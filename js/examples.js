/* examples.js — Guía amigable + ejemplo modelo por cada actividad.
   Se carga junto a db.js (sin JSX). El editor lo usa para:
     1) mostrar una tarjeta "Cómo funciona + Ejemplo" al configurar,
     2) precargar un ejemplo real al añadir la actividad,
     3) ofrecer un botón "Usar este ejemplo".

   Cada entrada:
     que     -> frase corta: qué hace la actividad (para el docente).
     comoVe  -> qué verá el grupo en pantalla (resultado).
     formato -> cómo escribir cada línea, explicado de forma sencilla.
     ejemplo -> { titulo, instrucciones, items, ...extra } sobre un tema real.
   Si una actividad no está aquí, el editor usa textos genéricos. */

window.ACT_EJEMPLOS = {

  ruleta: {
    que: 'Una ruleta gira y cae en una pregunta al azar. Ideal para repasar al final de la clase.',
    comoVe: 'El grupo ve girar la ruleta y aparece la pregunta que tocó, en grande.',
    formato: 'Escribe una pregunta por línea. ¡Eso es todo!',
    ejemplo: {
      titulo: 'Ruleta del ciclo del agua',
      instrucciones: 'Gira la ruleta y responde la pregunta que toque.',
      items: [
        '¿Qué es la evaporación?',
        '¿Dónde se forman las nubes?',
        'Nombra dos tipos de precipitación',
        '¿Por qué el agua es importante para la vida?',
        '¿Qué pasa con el agua que cae al suelo?',
      ],
    },
  },

  elige: {
    que: 'Pregunta de opción múltiple: el grupo elige y se revela si acertó.',
    comoVe: 'Una pregunta arriba y cuatro opciones grandes; al tocar una, se pinta de verde o naranja.',
    formato: 'Cada línea: Pregunta | Respuesta correcta | Opción mala | Opción mala. La PRIMERA opción después de la pregunta es siempre la correcta (el juego las mezcla solo).',
    ejemplo: {
      titulo: '¿Cuánto sabes del Sistema Solar?',
      instrucciones: 'Lee la pregunta y elige una opción.',
      items: [
        '¿Cuál es el planeta más cercano al Sol? | Mercurio | Venus | La Tierra',
        '¿Qué planeta es conocido como el planeta rojo? | Marte | Júpiter | Saturno',
        '¿Cuál es el planeta más grande? | Júpiter | La Tierra | Neptuno',
      ],
    },
  },

  vf: {
    que: 'Afirmaciones para decidir si son verdaderas o falsas.',
    comoVe: 'Una frase grande y dos botones: Verdadero y Falso. Al elegir, se revela la respuesta.',
    formato: 'Cada línea: Afirmación | V  (o)  Afirmación | F. Usa V para verdadero y F para falso.',
    ejemplo: {
      titulo: 'Verdadero o falso: los animales',
      instrucciones: '¿Verdadero o falso? Decide y revela.',
      items: [
        'Las ballenas son mamíferos | V',
        'Las arañas son insectos | F',
        'Los murciélagos pueden volar | V',
        'Las serpientes tienen patas | F',
      ],
    },
  },

  completa: {
    que: 'Falta una letra en la palabra y el grupo elige cuál es.',
    comoVe: 'La palabra con un hueco y tres letras grandes para elegir.',
    formato: 'Cada línea: PALABRA con "_" donde va el hueco = LETRA correcta. Ejemplo: el guion bajo marca el espacio vacío.',
    ejemplo: {
      titulo: 'Completa: partes de la planta',
      instrucciones: 'Elige la letra que completa la palabra.',
      items: ['RA_Z=I', 'TALL_=O', 'HOJ_=A', 'FLO_=R'],
    },
  },

  problema: {
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

  selector: {
    que: 'Elige a un estudiante al azar. Perfecto para repartir turnos sin discusiones.',
    comoVe: 'Los nombres giran rapidísimo y se detienen en uno, en grande.',
    formato: 'Un nombre por línea.',
    ejemplo: {
      titulo: '¿Quién pasa al tablero?',
      instrucciones: 'El selector elegirá un participante al azar.',
      items: ['Ana', 'Carlos', 'María', 'Juan', 'Sofía', 'Pedro', 'Lucía', 'Diego'],
    },
  },

  marcador: {
    que: 'Lleva el puntaje de cada equipo en vivo.',
    comoVe: 'Tarjetas grandes por equipo con botones + y − para sumar o restar puntos.',
    formato: 'Un nombre de equipo por línea (hasta 4 equipos).',
    ejemplo: {
      titulo: 'Marcador de la clase',
      instrucciones: 'Suma puntos a cada equipo durante la clase.',
      items: ['Equipo Verde', 'Equipo Naranja', 'Equipo Azul'],
    },
  },

  ahorcado: {
    que: 'El curso adivina la palabra letra por letra. Profe vs. Curso.',
    comoVe: 'La palabra oculta con guiones, corazones de vidas y un teclado en pantalla.',
    formato: 'Cada línea: PALABRA = pista. La pista es opcional pero ayuda mucho.',
    ejemplo: {
      titulo: 'Ahorcado: la geografía',
      instrucciones: 'Adivinen la palabra letra por letra antes de quedarse sin vidas.',
      items: [
        'MONTAÑA=Elevación natural muy alta del terreno',
        'OCEANO=La mayor masa de agua salada',
        'DESIERTO=Lugar muy seco con poca lluvia',
      ],
    },
  },

  descubre: {
    que: 'Estilo Wordle: adivinar la palabra en varios intentos con pistas de color.',
    comoVe: 'Una cuadrícula que se pinta de verde, amarillo o gris según las letras.',
    formato: 'Cada línea: PALABRA = pista. Define los intentos en el campo de abajo.',
    ejemplo: {
      titulo: 'Descubre la palabra',
      instrucciones: 'Adivina la palabra oculta usando las pistas de color.',
      intentos: 6,
      items: [
        'PLANETA=Cuerpo que gira alrededor del Sol',
        'ESTRELLA=Brilla con luz propia en el cielo',
        'COMETA=Tiene una cola brillante de polvo y hielo',
      ],
    },
  },

  reto: {
    que: 'Retos sorpresa numerados. Al tocar uno se abre en grande (con imagen o video opcional).',
    comoVe: 'Botones numerados; al pulsar uno aparece el reto a pantalla completa.',
    formato: 'Cada línea: Reto = URL de imagen o video (la URL es opcional).',
    ejemplo: {
      titulo: 'Reto relámpago',
      instrucciones: 'Pulsa un número y completa el reto sorpresa.',
      items: [
        'Salta 10 veces como una rana',
        'Di tres palabras que empiecen con M',
        'Imita a tu animal favorito',
        'Cuenta de 2 en 2 hasta 20',
      ],
    },
  },

  organiza: {
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

  stop: {
    que: 'El clásico "Stop": sale una letra y el grupo llena categorías con esa letra.',
    comoVe: 'Una letra gigante y un cuadro con categorías para escribir.',
    formato: 'Una categoría por línea (Nombre, País, Animal…).',
    ejemplo: {
      titulo: 'Stop de la clase',
      instrucciones: 'Con la letra que salga, llena cada categoría lo más rápido posible.',
      items: ['Nombre', 'País', 'Animal', 'Color', 'Comida', 'Objeto'],
    },
  },

  acertijo: {
    que: 'Un enigma para resolver escribiendo la respuesta.',
    comoVe: 'El acertijo en grande, un campo de texto y se valida la respuesta.',
    formato: 'Cada línea: Enunciado | respuesta | URL (la URL es opcional).',
    ejemplo: {
      titulo: 'Acertijos del día',
      instrucciones: 'Lee con atención y escribe tu respuesta.',
      items: [
        'Vuela de noche, duerme de día y cuelga cabeza abajo. ¿Qué es? | murciélago',
        'Tengo agujas pero no sé coser, tengo números pero no sé leer. ¿Qué soy? | reloj',
        'Cuanto más le quitas, más grande se hace. ¿Qué es? | un hueco',
      ],
    },
  },

  sopa: {
    que: 'Sopa de letras donde el grupo arrastra para marcar palabras escondidas.',
    comoVe: 'Una cuadrícula de letras y una lista de palabras (o pistas) por encontrar.',
    formato: 'Escribe las palabras según su dirección (horizontal, vertical o diagonal), una por línea, con PALABRA = pista.',
    ejemplo: {
      titulo: 'Sopa de letras: los colores',
      instrucciones: 'Encuentra las palabras escondidas arrastrando el mouse.',
      size: 12,
      items: ['H|ROJO=El color de la sangre', 'H|VERDE=El color de las hojas', 'V|AZUL=El color del cielo', 'V|AMARILLO=El color del sol', 'D|MORADO=Mezcla de azul y rojo'],
    },
  },

  crucigrama: {
    que: 'Crucigrama que se arma solo cruzando las palabras por sus pistas.',
    comoVe: 'Una cuadrícula con números y la lista de pistas horizontales y verticales.',
    formato: 'Cada línea: PALABRA = pista. El crucigrama cruza las palabras automáticamente.',
    ejemplo: {
      titulo: 'Crucigrama de animales',
      instrucciones: 'Completa las palabras usando las pistas.',
      items: [
        'LEON=El rey de la selva',
        'ELEFANTE=El animal terrestre más grande, con trompa',
        'TIGRE=Felino naranja con rayas negras',
        'MONO=Le encantan los plátanos y trepa árboles',
      ],
    },
  },

  errores: {
    que: 'Encuentra las diferencias entre dos imágenes (o una imagen comparada).',
    comoVe: 'Las imágenes lado a lado; al hacer clic en una diferencia se marca con un círculo verde.',
    formato: 'Pega la URL de la imagen y marca con clic dónde están las diferencias.',
    ejemplo: {
      titulo: 'Encuentra las diferencias',
      instrucciones: 'Observa con atención y toca cada diferencia que encuentres.',
      modo: 'dos',
      img1: '',
      img2: '',
      puntos: [],
    },
  },

  crea: {
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

  temporizador: {
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

  dado: {
    que: 'Lanza un dado en pantalla y asigna un reto según el número.',
    comoVe: 'Un dado grande que rueda y se detiene en un número.',
    formato: 'No necesita lista; sirve para sortear turnos o retos numerados.',
    ejemplo: {
      titulo: 'Lanza el dado',
      instrucciones: 'Lanza el dado y haz el reto del número que salga.',
      items: [],
    },
  },

  retaEquipo: {
    que: 'Preguntas por turnos entre equipos. Si el equipo en turno acierta, suma los puntos; si falla, pasa al siguiente.',
    comoVe: 'Se muestra de quién es el turno y la pregunta; el docente marca acierto o fallo.',
    formato: 'Cada línea: Pregunta = respuesta (la respuesta es opcional, se puede revelar).',
    ejemplo: {
      titulo: 'Reta al equipo',
      instrucciones: 'Por turnos, cada equipo responde para ganar puntos.',
      puntos: 2,
      items: [
        '¿Cuál es la capital de Francia? = París',
        '¿Cuánto es 7 × 8? = 56',
        '¿Qué planeta es el más cercano al Sol? = Mercurio',
        'Nombra un río de América = Amazonas',
      ],
    },
  },

  pulsador: {
    que: 'Aparece una pregunta y el equipo que "pulsa" primero responde. Si falla, queda fuera y pulsan los demás.',
    comoVe: 'Un botón grande por equipo; el docente toca quién pulsó primero y marca si acertó.',
    formato: 'Cada línea: Pregunta = respuesta (la respuesta es opcional).',
    ejemplo: {
      titulo: 'Pulsador por turnos',
      instrucciones: 'El equipo que pulse primero tiene derecho a responder.',
      puntos: 3,
      items: [
        '¿En qué año llegó el hombre a la Luna? = 1969',
        '¿Cuál es el animal terrestre más rápido? = el guepardo',
        '¿Cuántos lados tiene un hexágono? = 6',
      ],
    },
  },

  apuesta: {
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

  recuadros: {
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

};

/* Devuelve la guía de una actividad (o null si no existe ejemplo). */
window.actEjemplo = function (toolId) {
  return (window.ACT_EJEMPLOS && window.ACT_EJEMPLOS[toolId]) || null;
};
