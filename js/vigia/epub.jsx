/* epub.jsx — Libros EPUB para el Modo Vigía (recurso Documento).
   Un EPUB es un ZIP con páginas XHTML. Se abre con JSZip (cdnjs, solo al
   abrir un EPUB), se lee su índice y cada capítulo se muestra con la
   tipografía de la app (se quitan scripts, estilos y enlaces del libro).

   A diferencia del PDF, el texto de un EPUB se reacomoda (no hay páginas
   fijas), así que las marcas van SOBRE EL TEXTO: capítulo (`cap`) y posición
   del primer y último carácter (`ini`, `fin`) dentro del texto del capítulo.
   Así siguen en su sitio con cualquier tamaño de letra.

   Exporta:
     abrirEpub(docId, archivo)  -> Promise<libro>  (archivo = act.pdf: { driveId?, local?, … };
                                   busca primero la copia de este computador, luego Drive)
       libro: { titulo, capitulos: [{ href, titulo }], cargarCapitulo(i), destruir() }
     seleccionEn(nodo)          -> { ini, fin, texto } | null (texto seleccionado dentro de `nodo`)
     <LectorEpub … />           -> capítulo con sus marcas (ver props abajo) */

const JSZIP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
let promesaJsZip = null;
function cargarJsZip() {
  if (window.JSZip) return Promise.resolve(window.JSZip);
  if (!promesaJsZip) {
    promesaJsZip = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = JSZIP_URL;
      s.onload = () => (window.JSZip ? resolve(window.JSZip) : reject(new Error('JSZip no se inicializó')));
      s.onerror = () => { promesaJsZip = null; reject(new Error('No se pudo descargar el lector de EPUB. Revisa tu conexión.')); };
      document.head.appendChild(s);
    });
  }
  return promesaJsZip;
}

/* ---------- Abrir ---------- */
// Bytes del libro: primero la copia de ESTE computador (caché de Drive o
// copia local), luego Google Drive (y queda en caché).
function bytesDocumento(docId, info) {
  return leerCopiaLocal(docId, info).then((buf) => {
    if (buf) return buf;
    if (!info.driveId) throw errorSinArchivo('libro');
    if (!DriveAuth.token()) { const e = new Error('Conecta tu Google Drive para abrir este libro.'); e.motivo = 'drive-sesion'; throw e; }
    const clave = claveCacheDrive(info.driveId);
    return descargarDrive(info.driveId).then((b) => { guardarBufferLocal(clave, b); return b; });
  });
}

function abrirEpub(docId, archivo) {
  const info = archivo || {};
  return Promise.all([cargarJsZip(), bytesDocumento(docId, info)])
    .then(([JSZip, buf]) => JSZip.loadAsync(buf))
    .then(construirLibro)
    .catch((e) => {
      if (!e.motivo) { e.motivo = 'epub'; e.message = 'No se pudo leer el EPUB (¿está dañado o protegido con DRM?).'; }
      throw e;
    });
  // (Las claves locales son las mismas del PDF: ver leerCopiaLocal en pdf.jsx.)
}

const xml = (txt) => new DOMParser().parseFromString(txt, 'application/xml');
const porNombre = (doc, nombre) => Array.from(doc.getElementsByTagNameNS('*', nombre));

// Ruta dentro del ZIP de `rel`, relativa al archivo `base`. Enlaces externos -> null.
function resolverRuta(base, rel) {
  if (!rel || /^[a-z][a-z0-9+.-]*:/i.test(rel)) return null;
  let r = rel.split('#')[0];
  try { r = decodeURIComponent(r); } catch (e) { /* se deja tal cual */ }
  const dir = base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '';
  const salida = [];
  (dir + r).split('/').forEach((p) => { if (p === '..') salida.pop(); else if (p && p !== '.') salida.push(p); });
  return salida.join('/');
}

function construirLibro(zip) {
  const leer = (ruta) => {
    const f = zip.file(ruta);
    if (!f) return Promise.reject(new Error('Falta ' + ruta + ' dentro del EPUB'));
    return f.async('string');
  };
  return leer('META-INF/container.xml').then((txt) => {
    const raiz = porNombre(xml(txt), 'rootfile')[0];
    const rutaOpf = raiz && raiz.getAttribute('full-path');
    if (!rutaOpf) throw new Error('EPUB sin rootfile');
    return leer(rutaOpf).then((opfTxt) => ({ rutaOpf, opf: xml(opfTxt) }));
  }).then(({ rutaOpf, opf }) => {
    const manifiesto = {};
    porNombre(opf, 'item').forEach((it) => {
      manifiesto[it.getAttribute('id')] = {
        href: resolverRuta(rutaOpf, it.getAttribute('href')),
        tipo: it.getAttribute('media-type') || '',
        props: it.getAttribute('properties') || '',
      };
    });
    const spine = porNombre(opf, 'itemref')
      .map((r) => manifiesto[r.getAttribute('idref')])
      .filter((m) => m && /html/i.test(m.tipo))
      .map((m) => m.href);
    const tituloEl = porNombre(opf, 'title')[0];
    const titulo = tituloEl ? tituloEl.textContent.trim() : '';

    // Nombres de los capítulos: índice EPUB 3 (nav) o EPUB 2 (ncx).
    const etiquetas = {};
    const nav = Object.values(manifiesto).find((m) => /\bnav\b/.test(m.props));
    const tocId = (porNombre(opf, 'spine')[0] || { getAttribute: () => null }).getAttribute('toc');
    const ncx = tocId && manifiesto[tocId];
    const leerIndice = nav
      ? leer(nav.href).then((t) => {
        porNombre(xml(t), 'a').forEach((a) => {
          const ruta = resolverRuta(nav.href, a.getAttribute('href'));
          if (ruta && !etiquetas[ruta]) etiquetas[ruta] = a.textContent.replace(/\s+/g, ' ').trim();
        });
      })
      : ncx ? leer(ncx.href).then((t) => {
        porNombre(xml(t), 'navPoint').forEach((np) => {
          const c = porNombre(np, 'content')[0], l = porNombre(np, 'text')[0];
          const ruta = c && resolverRuta(ncx.href, c.getAttribute('src'));
          if (ruta && l && !etiquetas[ruta]) etiquetas[ruta] = l.textContent.replace(/\s+/g, ' ').trim();
        });
      }) : Promise.resolve();

    return leerIndice.catch(() => null).then(() => {
      const capitulos = spine.map((href) => ({ href, titulo: etiquetas[href] || null }));
      const cache = {};
      const urls = [];
      return {
        titulo,
        capitulos,
        cargarCapitulo(i) {
          if (!cache[i]) cache[i] = cargarCapituloZip(zip, capitulos[i], urls);
          return cache[i];
        },
        destruir() { urls.forEach((u) => URL.revokeObjectURL(u)); },
      };
    });
  });
}

/* Capítulo listo para mostrar: su <body> limpio (sin scripts, estilos ni
   enlaces) y con las imágenes apuntando a copias locales del ZIP. */
const ETIQUETAS_FUERA = 'script, style, link, meta, base, iframe, frame, object, embed, form, input, button, select, textarea, audio, video, source, noscript';
const XLINK = 'http://www.w3.org/1999/xlink';
function cargarCapituloZip(zip, cap, urls) {
  const f = zip.file(cap.href);
  if (!f) return Promise.reject(new Error('Falta el capítulo ' + cap.href));
  return f.async('string').then((txt) => {
    let doc = new DOMParser().parseFromString(txt, 'application/xhtml+xml');
    if (doc.getElementsByTagName('parsererror').length) doc = new DOMParser().parseFromString(txt, 'text/html');
    const cuerpo = doc.body || porNombre(doc, 'body')[0];
    if (!cuerpo) return { cuerpo: document.createElement('div'), titulo: cap.titulo };
    cuerpo.querySelectorAll(ETIQUETAS_FUERA).forEach((n) => n.remove());
    const imagenes = [];
    cuerpo.querySelectorAll('*').forEach((el) => {
      Array.from(el.attributes).forEach((at) => {
        const n = at.name.toLowerCase();
        // Fuera: eventos, estilos/clases/ids del libro y enlaces (no se navega dentro del lector).
        if (n.startsWith('on') || n === 'style' || n === 'class' || n === 'id' || (n === 'href' && el.localName === 'a')) el.removeAttribute(at.name);
      });
      if (el.localName === 'img' && el.getAttribute('src')) imagenes.push([el, 'src', null]);
      if (el.localName === 'image') imagenes.push([el, 'href', el.getAttributeNS(XLINK, 'href') ? XLINK : null]);
    });
    // Imágenes del libro -> blob: (dentro del ZIP no tienen dirección web).
    return Promise.all(imagenes.map(([el, attr, ns]) => {
      const valor = ns ? el.getAttributeNS(ns, attr) : el.getAttribute(attr);
      const ruta = resolverRuta(cap.href, valor);
      const archivo = ruta && zip.file(ruta);
      if (!archivo) { el.remove(); return null; }
      return archivo.async('blob').then((b) => {
        const u = URL.createObjectURL(b);
        urls.push(u);
        if (ns) el.setAttributeNS(ns, attr, u); else el.setAttribute(attr, u);
      });
    })).then(() => {
      const h = cuerpo.querySelector('h1, h2, h3');
      return { cuerpo, titulo: cap.titulo || (h && h.textContent.replace(/\s+/g, ' ').trim()) || null };
    });
  });
}

/* ---------- Marcas sobre el texto ---------- */
// Envuelve los caracteres [ini, fin) del texto de `raiz` con elementos que
// devuelve crear(esElPrimero). No cambia el texto, así que las posiciones de
// las demás marcas siguen valiendo.
function envolverRango(raiz, ini, fin, crear) {
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let tramos = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const largo = n.data.length;
    const a = Math.max(ini, pos), b = Math.min(fin, pos + largo);
    if (a < b) tramos.push([n, a - pos, b - pos]);
    pos += largo;
    if (pos >= fin) break;
  }
  // Los espacios entre párrafos no se resaltan (salvo que no haya otra cosa).
  const conTexto = tramos.filter(([n, s, e]) => n.data.slice(s, e).trim());
  if (conTexto.length) tramos = conTexto;
  tramos.forEach(([n, s, e], k) => {
    let nodo = n;
    if (s > 0) nodo = nodo.splitText(s);
    if (e - s < nodo.data.length) nodo.splitText(e - s);
    const m = crear(k === 0);
    nodo.parentNode.insertBefore(m, nodo);
    m.appendChild(nodo);
  });
}

// Lo seleccionado con el mouse dentro de `nodo`, como posiciones de texto.
function seleccionEn(nodo) {
  const sel = window.getSelection();
  if (!nodo || !sel || !sel.rangeCount || sel.isCollapsed) return null;
  const r = sel.getRangeAt(0);
  if (!nodo.contains(r.startContainer) || !nodo.contains(r.endContainer)) return null;
  const previo = document.createRange();
  previo.setStart(nodo, 0);
  previo.setEnd(r.startContainer, r.startOffset);
  const ini = previo.toString().length;
  const bruto = r.toString();
  const antes = bruto.length - bruto.replace(/^\s+/, '').length;
  const despues = bruto.length - bruto.replace(/\s+$/, '').length;
  const texto = bruto.trim().replace(/\s+/g, ' ');
  if (!texto) return null;
  return { ini: ini + antes, fin: ini + bruto.length - despues, texto };
}

/* ---------- Lector ----------
   <LectorEpub libro capitulo marcas numeros selId tamano
               onClickMarca onSoltar onClickFondo editorId renderEditor irA contenidoRef />
     · capitulo    : índice del capítulo a mostrar
     · marcas      : activaciones con { id, tipo, cap, ini, fin } (se muestran las de este capítulo)
     · tamano      : tamaño de letra en px
     · onSoltar()  : al soltar el mouse dentro del texto (para marcar lo seleccionado)
     · editorId / renderEditor(a): tarjeta flotante junto a esa marca
     · irA         : { id, n } — al cambiar, desplaza hasta esa marca
     · contenidoRef: ref al nodo del texto (para leer la selección) */
function LectorEpub({ libro, capitulo, marcas, numeros, selId, tamano, onClickMarca, onSoltar, onClickFondo,
  editorId, renderEditor, irA, contenidoRef, clase }) {
  const hoja = React.useRef(null);
  const contenido = React.useRef(null);
  const [cap, setCap] = React.useState(null);      // { indice, cuerpo, titulo }
  const [error, setError] = React.useState('');
  const [version, setVersion] = React.useState(0); // sube cada vez que se redibuja el texto
  const [posEditor, setPosEditor] = React.useState(null);

  React.useEffect(() => {
    let vivo = true;
    setError('');
    libro.cargarCapitulo(capitulo)
      .then((c) => { if (vivo) setCap({ indice: capitulo, cuerpo: c.cuerpo, titulo: c.titulo }); })
      .catch((e) => { if (vivo) setError(e.message || 'No se pudo abrir este capítulo.'); });
    return () => { vivo = false; };
  }, [libro, capitulo]);

  const delCap = (marcas || []).filter((a) => a.cap === capitulo && a.fin > a.ini);
  // Solo lo que cambia la posición o el aspecto de las marcas obliga a redibujar.
  const firma = JSON.stringify(delCap.map((a) => [a.id, a.ini, a.fin, a.tipo, numeros[a.id], a.id === selId, !!a._visto]));

  React.useLayoutEffect(() => {
    const div = contenido.current;
    if (!div || !cap || cap.indice !== capitulo) return;
    div.innerHTML = '';
    Array.from(cap.cuerpo.childNodes).forEach((n) => div.appendChild(document.importNode(n, true)));
    // Las más largas primero: si dos se cruzan, la corta queda dentro de la larga.
    delCap.slice().sort((p, q) => p.ini - q.ini || (q.fin - q.ini) - (p.fin - p.ini)).forEach((a) => {
      const ti = VigiaTipos.tipo(a.tipo);
      envolverRango(div, a.ini, a.fin, (primero) => {
        const m = document.createElement('mark');
        m.className = 'vg-epub-marca' + (primero ? ' inicio' : '') + (a.id === selId ? ' sel' : '') + (a._visto ? ' visto' : '');
        m.dataset.id = a.id;
        if (primero) m.dataset.num = numeros[a.id] || '•';
        m.style.setProperty('--tipo', ti.color);
        m.title = ti.nombre;
        return m;
      });
    });
    setVersion((v) => v + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap, firma]);

  // Desplazarse hasta una marca (desde la lista o "Siguiente"). Si la marca
  // está en otro capítulo, espera a que ese capítulo se dibuje; cada pedido
  // (irA.n) se atiende una sola vez.
  const atendido = React.useRef(null);
  React.useEffect(() => {
    if (!irA || atendido.current === irA.n || !contenido.current) return;
    const el = contenido.current.querySelector('.vg-epub-marca[data-id="' + irA.id + '"]');
    if (!el) return;
    atendido.current = irA.n;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [irA && irA.n, version]);

  // Tarjeta flotante: a la derecha del texto si hay espacio; si no, debajo de la marca.
  const ubicarEditor = React.useCallback(() => {
    const h = hoja.current, div = contenido.current;
    if (!editorId || !h || !div) { setPosEditor(null); return; }
    const tramos = div.querySelectorAll('.vg-epub-marca[data-id="' + editorId + '"]');
    if (!tramos.length) { setPosEditor(null); return; }
    const rh = h.getBoundingClientRect();
    const r0 = tramos[0].getBoundingClientRect(), r1 = tramos[tramos.length - 1].getBoundingClientRect();
    const padre = h.parentElement ? h.parentElement.getBoundingClientRect() : rh;
    const cw = Math.min(380, rh.width);
    if (padre.right - rh.right >= cw + 24) setPosEditor({ left: rh.width + 16, top: r0.top - rh.top, width: cw });
    else setPosEditor({ left: Math.max(0, Math.min(r1.left - rh.left, rh.width - cw)), top: r1.bottom - rh.top + 12, width: cw });
  }, [editorId]);
  React.useLayoutEffect(() => { ubicarEditor(); }, [ubicarEditor, version, tamano]);
  React.useEffect(() => {
    window.addEventListener('resize', ubicarEditor);
    return () => window.removeEventListener('resize', ubicarEditor);
  }, [ubicarEditor]);

  // Clic en una marca (delegado: el texto lo maneja el DOM, no React).
  const alHacerClic = (e) => {
    const m = e.target.closest && e.target.closest('.vg-epub-marca');
    if (m && String(window.getSelection()).trim() === '') { if (onClickMarca) onClickMarca(m.dataset.id); return; }
    if (!m && onClickFondo && String(window.getSelection()).trim() === '') onClickFondo();
  };

  const editada = editorId && (marcas || []).find((a) => a.id === editorId);
  return (
    <div className={'vg-epub-hoja vg-proyectado-doc' + (clase ? ' ' + clase : '')} ref={hoja} style={{ fontSize: tamano }}>
      {error ? <div className="vg-pdf-estado">{error}</div>
        : !cap || cap.indice !== capitulo ? <div className="vg-pdf-estado">Abriendo el capítulo…</div> : null}
      <div className="vg-epub-texto" ref={(el) => { contenido.current = el; if (contenidoRef) contenidoRef.current = el; }}
        onClick={alHacerClic} onMouseUp={() => { if (onSoltar) setTimeout(onSoltar, 0); }}
        style={{ display: cap && cap.indice === capitulo && !error ? '' : 'none' }}></div>
      {editada && posEditor && renderEditor && (
        <div className="vg-pdf-flotante" style={posEditor}
          onMouseUp={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {renderEditor(editada)}
        </div>
      )}
    </div>
  );
}

/* Índice: capítulo actual, anterior / siguiente. `conteo[i]` = marcas en el capítulo i. */
function NavCapitulos({ libro, capitulo, setCapitulo, conteo, compacto }) {
  const total = libro.capitulos.length;
  return (
    <div className={'vg-epub-nav' + (compacto ? ' compacto' : '')}>
      <button className="vg-ctrl" onClick={() => setCapitulo(Math.max(0, capitulo - 1))} disabled={capitulo <= 0} title="Capítulo anterior" aria-label="Capítulo anterior">‹</button>
      <select value={capitulo} onChange={(e) => setCapitulo(Number(e.target.value))} title="Ir a un capítulo">
        {libro.capitulos.map((c, i) => (
          <option key={i} value={i}>
            {(c.titulo || 'Sección ' + (i + 1))}{conteo && conteo[i] ? '  · ' + conteo[i] + ' ●' : ''}
          </option>
        ))}
      </select>
      <button className="vg-ctrl" onClick={() => setCapitulo(Math.min(total - 1, capitulo + 1))} disabled={capitulo >= total - 1} title="Capítulo siguiente" aria-label="Capítulo siguiente">›</button>
    </div>
  );
}

Object.assign(window, { cargarJsZip, abrirEpub, resolverRuta, envolverRango, seleccionEn, LectorEpub, NavCapitulos });
