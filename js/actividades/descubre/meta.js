/* Descubre la palabra — datos de la actividad (código en descubre.jsx). */
Actividades.registrar({
  id: 'descubre',
  version: '20261017a',
  nombre: 'Descubre la palabra',
  desc: 'Adivínala en seis intentos',
  color: '#116CF5',
  icon: 'letras',
  grupo: 'cognitivos', orden: 50,
  editorPropio: true,

  config(base) {
    base.duracion = 180;
  },

  guia: {
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
});
