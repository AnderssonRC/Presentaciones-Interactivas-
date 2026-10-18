/* Ordena los pasos — datos de la actividad (código en ordena.jsx). */
Actividades.registrar({
  id: 'ordena',
  version: '20261017a',
  nombre: 'Ordena los pasos',
  desc: 'Secuencia procesos en orden correcto',
  color: '#F53711',
  icon: 'ordena',
  grupo: 'evaluadoras', orden: 70,

  config(base) {
    base.items = ['Primer paso', 'Segundo paso', 'Tercer paso', 'Cuarto paso'];
    base.instrucciones = 'Arrastra los pasos hasta dejarlos en el orden correcto.';
  },

  campos: {
    label: 'Pasos EN ORDEN CORRECTO (uno por línea)',
    hint: 'Escribe los pasos en el orden CORRECTO (uno por línea). En Presentar se mostrarán barajados para que el grupo los acomode.',
  },

  guia: {
    que: 'El grupo arrastra y suelta los pasos hasta dejarlos en el orden correcto; un botón comprueba aciertos y errores.',
    comoVe: 'Una lista de pasos barajados con números; al comprobar, cada uno se marca verde (bien ubicado) o rojo.',
    formato: 'Escribe los pasos en el ORDEN CORRECTO, uno por línea. El juego los baraja solo al presentar.',
    ejemplo: {
      titulo: 'Pasos para lavarse las manos',
      instrucciones: 'Arrastra los pasos al orden correcto y comprueba.',
      items: [
        'Abrir la llave y mojarse las manos',
        'Aplicar jabón',
        'Frotar por 20 segundos',
        'Enjuagar con agua',
        'Secar con una toalla limpia',
      ],
    },
  },
});
