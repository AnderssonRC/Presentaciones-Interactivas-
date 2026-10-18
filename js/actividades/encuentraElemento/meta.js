/* Encuentra el elemento — datos de la actividad (código en encuentraElemento.jsx). */
Actividades.registrar({
  id: 'encuentraElemento',
  version: '20261017a',
  nombre: 'Encuentra el elemento',
  desc: 'Toca la zona correcta de la imagen',
  color: '#A855F7',
  icon: 'eye',
  grupo: 'cognitivos', orden: 80,
  editorPropio: true,

  // Una sola imagen por diapositiva (igual que "Encuentra las diferencias"):
  // `zonas` son los rectángulos correctos, en % de la imagen (x,y = esquina
  // superior izquierda; w,h = ancho/alto). Puede haber una o varias zonas;
  // hay que encontrarlas todas.
  config(base) {
    base.imagen = '';
    base.zonas = [{ x: 40, y: 40, w: 20, h: 20 }];
    base.instrucciones = 'Toca las zonas de la imagen que creas correctas.';
  },

  guia: {
    que: 'Pega una imagen y marca una o varias zonas como correctas (ajustando su posición y tamaño). El grupo toca la imagen intentando dar con esas zonas; si tocan fuera, ven una "✕" y pueden seguir intentando sin que se revele dónde están. Se gana al encontrarlas todas.',
    comoVe: 'La imagen completa en pantalla; al tocar fuera de una zona correcta aparece una "✕" roja que desaparece sola. Al tocar dentro de una zona, se marca con un recuadro verde y queda encontrada (si hay más de una, se muestra un contador).',
    formato: 'Pega la URL de la imagen. Luego, en el editor, haz clic sobre la imagen para agregar una zona de tamaño estándar, o arrastra para dibujarla del tamaño que quieras. Puedes agregar varias zonas, y ajustar el ancho/alto de cada una con los campos numéricos.',
    ejemplo: {
      titulo: 'Encuentra el elemento',
      instrucciones: 'Toca las zonas de la imagen que creas correctas.',
      imagen: '',
      zonas: [{ x: 40, y: 40, w: 20, h: 20 }],
    },
  },
});
