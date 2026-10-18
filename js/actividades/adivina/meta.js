/* Adivina la imagen — PRÓXIMAMENTE (aún sin código: si una presentación
   vieja la tiene, en Presentar se muestra la ficha genérica).
   Para construirla: crea adivina.jsx (ver LEEME.md) y quita `pronto`. */
Actividades.registrar({
  id: 'adivina',
  version: '20261017a',
  nombre: 'Adivina la imagen',
  desc: 'Imagen oculta que se revela poco a poco',
  color: '#F53711',
  icon: 'eye',
  grupo: 'cognitivos', orden: 140,
  pronto: true,

  config(base) {
    base.duracion = 180;
  },
});
