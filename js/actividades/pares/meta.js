/* Une los pares — datos de la actividad (código en pares.jsx). */
Actividades.registrar({
  id: 'pares',
  version: '20261017a',
  nombre: 'Une los pares',
  desc: 'Relaciona conceptos con definiciones',
  color: '#11F555',
  icon: 'pares',
  grupo: 'evaluadoras', orden: 60,

  config(base) {
    base.items = ['Sol = Estrella', 'Luna = Satélite', 'Tierra = Planeta'];
    base.instrucciones = 'Une cada elemento con su pareja: toca uno y luego su par.';
  },

  campos: {
    label: 'Parejas (una por línea: izquierda = derecha)',
    hint: 'Formato: izquierda = derecha. Cada lado puede ser imagen con "img:URL". Ej: Perro = Mamífero  ·  img:https://... = Planeta',
  },

  guia: {
    que: 'El docente arma parejas (concepto, frase o imagen) y el grupo las une en pantalla tocando un elemento y luego su pareja.',
    comoVe: 'Dos columnas barajadas; al tocar un elemento de la izquierda y su par a la derecha, quedan marcados en verde.',
    formato: 'Cada línea: izquierda = derecha. Cualquier lado puede ser imagen escribiendo "img:" antes de la URL. Ej: Perro = Mamífero · img:https://... = Planeta',
    ejemplo: {
      titulo: 'Une el cuerpo con su función',
      instrucciones: 'Toca un órgano y luego su función.',
      items: [
        'Corazón = Bombea la sangre',
        'Pulmones = Permiten respirar',
        'Estómago = Digiere los alimentos',
        'Cerebro = Controla el cuerpo',
      ],
    },
  },
});
