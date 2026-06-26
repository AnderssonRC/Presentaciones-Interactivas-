/* canvas.jsx — Lienzo libre para plantillas de contenido.
   - ANIMS: catálogo de 12 animaciones (clases CSS en styles.css).
   - FONTS: tipografías disponibles para el texto.
   - migrarContenido(): convierte plantillas viejas (titulo/texto/imagen) al modelo de elementos.
   - nuevoElemento(): crea elementos con tamaño/posición por defecto.
   - CanvasElemento: renderiza un elemento (texto/imagen/video), con animación.
   - LienzoLibre: pinta el fondo + todos los elementos. En modo editable permite
     arrastrar, redimensionar y seleccionar; en presentación solo muestra y anima.
   El lienzo trabaja siempre en coordenadas 1920x1080 (las mismas del .slide). */

/* ---- 12 animaciones (cada una mapea a una clase .anim-* en styles.css) ---- */
const ANIMS = [
  { id: 'none',     nombre: 'Sin animación' },
  { id: 'fade',     nombre: 'Aparecer' },
  { id: 'slideUp',  nombre: 'Subir' },
  { id: 'slideDown',nombre: 'Bajar' },
  { id: 'slideLeft',nombre: 'Entrar ←' },
  { id: 'slideRight',nombre: 'Entrar →' },
  { id: 'zoomIn',   nombre: 'Agrandar' },
  { id: 'zoomOut',  nombre: 'Reducir' },
  { id: 'pop',      nombre: 'Rebote' },
  { id: 'flip',     nombre: 'Voltear' },
  { id: 'rotate',   nombre: 'Girar' },
  { id: 'pulse',    nombre: 'Latido (continuo)' },
  { id: 'shake',    nombre: 'Vibrar (continuo)' },
  { id: 'colorShift',nombre: 'Cambio de color (continuo)' },
];

const FONTS = [
  { id: "'Sora', sans-serif",          nombre: 'Sora' },
  { id: "'Outfit', sans-serif",        nombre: 'Outfit' },
  { id: "'Space Grotesk', sans-serif", nombre: 'Space Grotesk' },
  { id: 'Georgia, serif',              nombre: 'Georgia' },
  { id: "'Courier New', monospace",    nombre: 'Monoespaciada' },
];

const COLORES_TEXTO = ['#0B0F0C', '#FFFFFF', '#F53711', '#11F555', '#116CF5', '#F5C211', '#9B30FF'];

/* Tamaños de texto predefinidos para el menú desplegable */
const TAMANOS = [24, 32, 40, 48, 56, 64, 80, 96, 104, 120, 140, 160, 200];

function animClase(id) {
  return id && id !== 'none' ? 'anim-' + id : '';
}

/* Migra una plantilla de contenido al modelo de elementos libres.
   Si ya trae `elementos`, la devuelve tal cual (no destruye trabajo previo). */
function migrarContenido(slide) {
  if (Array.isArray(slide.elementos)) return slide;
  const elementos = [];
  if (slide.titulo) {
    elementos.push({
      id: AIP.uid(), tipo: 'texto', valor: slide.titulo,
      x: 130, y: 150, w: 1100, h: 220,
      color: '#0B0F0C', font: "'Sora', sans-serif", size: 104, peso: 800, align: 'left',
      anim: 'slideUp', orden: 0,
    });
  }
  if (slide.texto) {
    elementos.push({
      id: AIP.uid(), tipo: 'texto', valor: slide.texto,
      x: 130, y: 430, w: 1100, h: 320,
      color: '#2B312B', font: "'Outfit', sans-serif", size: 46, peso: 500, align: 'left',
      anim: 'fade', orden: 1,
    });
  }
  if (slide.imagen && slide.imagen.valor) {
    elementos.push({
      id: AIP.uid(), tipo: 'imagen', valor: slide.imagen.valor,
      x: 1320, y: 200, w: 460, h: 680, anim: 'zoomIn', orden: 2,
    });
  }
  return Object.assign({}, slide, {
    elementos,
    fondo: slide.fondo || { tipo: 'color', valor: '' },
  });
}

/* Crea un elemento nuevo, centrado en el lienzo según su tipo. */
function nuevoElemento(tipo) {
  const base = { id: AIP.uid(), tipo, anim: 'fade', orden: 0 };
  if (tipo === 'texto') {
    return Object.assign(base, {
      valor: 'Doble clic para editar', x: 660, y: 460, w: 600, h: 160,
      color: '#0B0F0C', font: "'Sora', sans-serif", size: 64, peso: 700, align: 'center',
    });
  }
  if (tipo === 'imagen') {
    return Object.assign(base, { valor: '', x: 660, y: 340, w: 600, h: 400 });
  }
  // video
  return Object.assign(base, { valor: '', x: 560, y: 290, w: 800, h: 500 });
}

/* Convierte una URL de YouTube/Vimeo a su forma embed; si no, la deja igual. */
function urlEmbed(url) {
  if (!url) return '';
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return 'https://www.youtube.com/embed/' + yt[1];
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return 'https://player.vimeo.com/video/' + vm[1];
  return url;
}

/* Render de un único elemento dentro del lienzo (coordenadas 1920x1080). */
function CanvasElemento({ el, editable, selected, onSelect, onChange, replayKey }) {
  const dragRef = React.useRef(null);

  const estiloPos = {
    position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h,
  };

  /* ---- arrastre y redimensionado (solo modo editable) ---- */
  const escala = () => {
    // El lienzo .slide está escalado por transform: scale(s). Calculamos s
    // comparando ancho real renderizado contra 1920 para convertir px de pantalla
    // a px de lienzo.
    const slideEl = dragRef.current && dragRef.current.closest('.slide');
    if (!slideEl) return 1;
    return slideEl.getBoundingClientRect().width / 1920;
  };

  const iniciarArrastre = (e) => {
    if (!editable) return;
    e.stopPropagation();
    onSelect && onSelect(el.id);
    const s = escala();
    const startX = e.clientX, startY = e.clientY;
    const ox = el.x, oy = el.y;
    const move = (ev) => {
      const nx = Math.round(ox + (ev.clientX - startX) / s);
      const ny = Math.round(oy + (ev.clientY - startY) / s);
      onChange && onChange({ ...el, x: nx, y: ny });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const iniciarResize = (e) => {
    e.stopPropagation();
    const s = escala();
    const startX = e.clientX, startY = e.clientY;
    const ow = el.w, oh = el.h;
    const move = (ev) => {
      const nw = Math.max(80, Math.round(ow + (ev.clientX - startX) / s));
      const nh = Math.max(60, Math.round(oh + (ev.clientY - startY) / s));
      onChange && onChange({ ...el, w: nw, h: nh });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const editarTexto = (e) => {
    onChange && onChange({ ...el, valor: e.target.value });
  };

  /* ---- contenido según tipo ---- */
  let contenido = null;
  if (el.tipo === 'texto') {
    // Si la animación cicla el color, no fijamos color inline para que el
    // keyframe (que actúa sobre .canvas-text) controle el color del texto.
    const animaColor = el.anim === 'colorShift';
    const estiloTexto = {
      color: animaColor ? undefined : el.color,
      fontFamily: el.font, fontSize: el.size,
      fontWeight: el.peso, textAlign: el.align, lineHeight: 1.15,
      width: '100%', height: '100%', margin: 0, padding: 0,
      display: 'flex', flexDirection: 'column',
      justifyContent: el.align === 'center' ? 'center' : 'flex-start',
      overflow: 'hidden', wordBreak: 'break-word',
    };
    if (editable && selected) {
      contenido = (
        <textarea className="canvas-text" value={el.valor} onChange={editarTexto} spellCheck="false"
          ref={(node) => {
            // Al seleccionar el elemento de texto, enfoca el área para escribir
            // de inmediato (un solo clic), colocando el cursor al final.
            if (node && document.activeElement !== node) {
              node.focus();
              const fin = node.value.length;
              try { node.setSelectionRange(fin, fin); } catch (e) {}
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ ...estiloTexto, background: 'transparent', border: 'none',
            outline: 'none', resize: 'none' }} />
      );
    } else {
      contenido = <div className="canvas-text" style={estiloTexto}>{el.valor}</div>;
    }
  } else if (el.tipo === 'imagen') {
    contenido = el.valor
      ? <img src={el.valor} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18, display: 'block' }} />
      : <div className="canvas-ph">Pega la URL de una imagen en el panel ▸</div>;
  } else if (el.tipo === 'video') {
    contenido = el.valor
      ? <iframe src={urlEmbed(el.valor)} title="video" frameBorder="0" allowFullScreen
          style={{ width: '100%', height: '100%', borderRadius: 18, border: 'none', pointerEvents: editable ? 'none' : 'auto' }} />
      : <div className="canvas-ph">Pega la URL de un video (YouTube/Vimeo) ▸</div>;
  }

  return (
    <div ref={dragRef} key={replayKey}
      className={'canvas-el ' + animClase(el.anim) + (editable ? ' editable' : '') + (selected ? ' sel' : '')}
      style={estiloPos}
      onPointerDown={iniciarArrastre}
      onClick={(e) => { if (editable) { e.stopPropagation(); onSelect && onSelect(el.id); } }}>
      {contenido}
      {editable && selected && el.tipo === 'texto' && (
        <span className="canvas-handle move" title="Arrastra para mover">✛</span>
      )}
      {editable && selected && (
        <span className="canvas-resize" onPointerDown={iniciarResize} title="Redimensionar" />
      )}
    </div>
  );
}

/* Lienzo completo: fondo + elementos. `replay` fuerza re-montaje para reanimar.
   `pasoActual` (presentación): solo se ven los elementos con orden <= pasoActual.
   En modo editable se ven todos. */
function LienzoLibre({ slide, editable, selId, onSelect, onChangeEl, replay, pasoActual }) {
  const fondo = slide.fondo || { tipo: 'color', valor: '' };
  const estiloFondo = fondo.tipo === 'url' && fondo.valor
    ? { backgroundImage: `url("${fondo.valor}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : (fondo.tipo === 'color' && fondo.valor ? { background: fondo.valor } : {});
  const elementos = Array.isArray(slide.elementos) ? slide.elementos : [];
  const paso = pasoActual == null ? Infinity : pasoActual;
  return (
    <div className="canvas-root" style={{ position: 'absolute', inset: 0, ...estiloFondo }}
      onClick={() => editable && onSelect && onSelect(null)}>
      {elementos.map((el) => {
        const visible = editable || (el.orden || 0) <= paso;
        if (!visible) return null;
        return (
          <CanvasElemento key={el.id} el={el} editable={editable}
            selected={editable && selId === el.id}
            onSelect={onSelect}
            onChange={(next) => onChangeEl && onChangeEl(el.id, next)}
            replayKey={(replay || 0) + '-' + el.id} />
        );
      })}
    </div>
  );
}

Object.assign(window, {
  ANIMS, FONTS, COLORES_TEXTO, TAMANOS, animClase, migrarContenido, nuevoElemento, urlEmbed,
  CanvasElemento, LienzoLibre,
});
