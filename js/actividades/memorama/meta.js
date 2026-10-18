/* Memorama — datos de la actividad (código en memorama.jsx). */
Actividades.registrar({
  id: 'memorama',
  version: '20261017a',
  nombre: 'Memorama',
  desc: 'Memoria visual con parejas',
  color: '#116CF5',
  icon: 'memorama',
  grupo: 'evaluadoras', orden: 80,

  config(base) {
    base.items = ['Sol = Estrella', 'Agua = H₂O', 'Perro = Mamífero', 'Rosa = Flor'];
    base.instrucciones = 'Voltea dos cartas: si forman pareja, se quedan descubiertas.';
  },

  campos: {
    label: 'Parejas (una por línea: A = B)',
    hint: 'Formato: A = B (una pareja por línea). Cada lado puede ser imagen con "img:URL". Ej: Perro = Mamífero  ·  img:https://... = Sol',
  },

  guia: {
    que: 'Juego de memoria: cartas boca abajo que se voltean de a dos buscando parejas (texto o imagen).',
    comoVe: 'Una cuadrícula de cartas con “?”; al tocar dos, si coinciden quedan descubiertas en verde.',
    formato: 'Cada línea es una pareja: A = B. Cualquier lado puede ser imagen con "img:URL". Ej: Perro = Mamífero · img:https://... = Sol',
    ejemplo: {
      titulo: 'Memorama de ciencias',
      instrucciones: 'Encuentra las parejas volteando dos cartas.',
      items: [
        'Sol = Estrella',
        'Agua = H₂O',
        'Hoja = Fotosíntesis',
        'Corazón = Bombea sangre',
      ],
    },
  },
});
