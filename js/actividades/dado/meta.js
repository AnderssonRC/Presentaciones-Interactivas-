/* Dado didáctico — datos de la actividad (código en dado.jsx). */
Actividades.registrar({
  id: 'dado',
  version: '20261017a',
  nombre: 'Dado didáctico',
  desc: 'Lanza el dado y asigna el reto',
  color: '#11F555',
  icon: 'dado',
  grupo: 'evaluadoras', orden: 130,

  config(base) {
    base.duracion = 180;
  },

  guia: {
    que: 'Lanza un dado en pantalla y asigna un reto según el número.',
    comoVe: 'Un dado grande que rueda y se detiene en un número.',
    formato: 'No necesita lista; sirve para sortear turnos o retos numerados.',
    ejemplo: {
      titulo: 'Lanza el dado',
      instrucciones: 'Lanza el dado y haz el reto del número que salga.',
      items: [],
    },
  },
});
