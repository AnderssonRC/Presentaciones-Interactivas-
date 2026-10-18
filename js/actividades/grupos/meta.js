/* Formar grupos — datos de la actividad (código en grupos.jsx). */
Actividades.registrar({
  id: 'grupos',
  version: '20261017a',
  nombre: 'Formar grupos',
  desc: 'Reparte la lista de estudiantes al azar',
  color: '#A855F7',
  icon: 'pares',
  grupo: 'equipos', orden: 50,
  editorPropio: true,

  config(base) {
    base.items = ['Ana María López', 'Carlos Pérez Ruiz', 'Sofía Torres', 'Juan D. Gómez', 'María Fernanda Díaz', 'Pedro Sánchez M.'];
    base.numGrupos = 3;
    base.instrucciones = 'Estos son los grupos de hoy. ¡A trabajar con tu equipo!';
  },

  guia: {
    que: 'Reparte tu lista de estudiantes en grupos al azar y los muestra en pantalla.',
    comoVe: 'Una animación de sorteo y luego tarjetas de colores, una por grupo, con los nombres.',
    formato: 'Pega la lista desde Excel: un nombre completo por línea. Elige cuántos grupos.',
    ejemplo: {
      titulo: 'Grupos de trabajo de hoy',
      instrucciones: 'Estos son los grupos. ¡Reúnete con tu equipo!',
      numGrupos: 3,
      items: ['Ana María López', 'Carlos Pérez Ruiz', 'Sofía Torres García', 'Juan David Gómez', 'María Fernanda Díaz', 'Pedro Sánchez Mora'],
    },
  },
});
