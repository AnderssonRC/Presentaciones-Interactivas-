/* pdf.jsx — PDF para el Modo Vigía (recurso Documento).
   El PDF se dibuja con PDF.js (Mozilla) en lienzos propios, para poder poner
   encima los activadores (rectángulo de color traslúcido + número) justo
   sobre el texto, en las mismas posiciones al editar y al presentar.

   De dónde sale el PDF:
     · Google Drive del docente (pdf.driveId): carpeta "Res Cogitans/PDFs",
       ver drive.jsx. Se descarga con el token y queda en caché (IndexedDB).
     · Activaciones creadas antes de Drive: enlace (pdf.url) o archivo subido
       a este navegador (pdf.local). Se siguen abriendo igual.

   Exporta:
     cargarPdfJs()                    -> Promise<pdfjsLib> (se descarga una vez)
     abrirPdf(docId, pdf)             -> Promise<PDFDocumentProxy>
     guardarPdfLocal(clave, archivo) / borrarPdfLocal(clave) / claveCacheDrive(driveId)
     <VisorPdf ... />                 -> páginas + marcas (ver props abajo) */

const PDFJS_VERSION = '3.11.174';
const PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + PDFJS_VERSION + '/';

let promesaPdfJs = null;
function cargarPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!promesaPdfJs) {
    promesaPdfJs = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = PDFJS_BASE + 'pdf.min.js';
      s.onload = () => {
        if (!window.pdfjsLib) { reject(new Error('PDF.js no se inicializó')); return; }
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => { promesaPdfJs = null; reject(new Error('No se pudo descargar el lector de PDF. Revisa tu conexión.')); };
      document.head.appendChild(s);
    });
  }
  return promesaPdfJs;
}

/* ---------- Archivo local (IndexedDB) ---------- */
function abrirBaseLocal() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('vigia-pdf', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('archivos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
function operacionLocal(modo, fn) {
  return abrirBaseLocal().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction('archivos', modo);
    const req = fn(tx.objectStore('archivos'));
    tx.oncomplete = () => resolve(req && req.result);
    tx.onerror = () => reject(tx.error);
  }));
}
function guardarPdfLocal(clave, archivo) {
  return archivo.arrayBuffer().then((buf) => operacionLocal('readwrite', (st) => st.put(buf, clave)));
}
function guardarBufferLocal(clave, buf) {
  return operacionLocal('readwrite', (st) => st.put(buf, clave)).catch(() => null);
}
// Clave de la copia en caché de un PDF de Drive (por id de archivo).
const claveCacheDrive = (driveId) => 'drive:' + driveId;
function leerPdfLocal(docId) {
  return operacionLocal('readonly', (st) => st.get(docId)).catch(() => null);
}
function borrarPdfLocal(docId) {
  return operacionLocal('readwrite', (st) => st.delete(docId)).catch(() => null);
}

/* Abre el PDF del documento. Lanza un Error con `motivo`:
   'drive-sesion' | 'drive-error' | 'sin-archivo' | 'enlace' | 'lector'.
     · PDF en Google Drive (pdf.driveId): primero la copia en caché de este
       navegador; si no está, PDF.js lo descarga con files.get?alt=media y el
       token de acceso, y se guarda en caché para la próxima vez.
     · Activaciones anteriores (sin Drive): archivo subido a este navegador
       (clave = id de la activación) o enlace directo. */
function abrirPdf(docId, pdf) {
  const info = pdf || {};
  return cargarPdfJs().catch((e) => { e.motivo = 'lector'; throw e; }).then((lib) => {
    if (info.driveId) return abrirPdfDrive(lib, info.driveId);
    return leerPdfLocal(docId).then((buf) => {
      if (buf) return lib.getDocument({ data: new Uint8Array(buf) }).promise;
      if (!info.url) { const e = new Error('Este PDF se subió desde otro computador.'); e.motivo = 'sin-archivo'; throw e; }
      return lib.getDocument({ url: info.url }).promise.catch(() => {
        const e = new Error('El sitio donde está el PDF no permite abrirlo desde otra página.');
        e.motivo = 'enlace'; throw e;
      });
    });
  });
}

function abrirPdfDrive(lib, driveId) {
  const clave = claveCacheDrive(driveId);
  return leerPdfLocal(clave).then((buf) => {
    if (buf) return lib.getDocument({ data: new Uint8Array(buf) }).promise;
    const token = DriveAuth.token();
    if (!token) { const e = new Error('Conecta tu Google Drive para abrir este PDF.'); e.motivo = 'drive-sesion'; throw e; }
    return lib.getDocument({ url: urlMediaDrive(driveId), httpHeaders: { Authorization: 'Bearer ' + token } }).promise
      .then((doc) => {
        // Copia en caché (para abrirlo rápido y aunque la sesión venza).
        doc.getData().then((d) => guardarBufferLocal(clave, d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength))).catch(() => {});
        return doc;
      })
      .catch((err) => {
        const e = new Error(err && err.status === 404
          ? 'El PDF ya no está en tu Drive (¿se borró o está en la papelera?).'
          : 'No se pudo descargar el PDF de tu Google Drive.');
        e.motivo = err && err.status === 401 ? 'drive-sesion' : 'drive-error';
        if (e.motivo === 'drive-sesion') { DriveAuth.invalidar(); e.message = 'La sesión de Google Drive venció. Conéctala de nuevo.'; }
        throw e;
      });
  });
}

/* ---------- Visor ----------
   <VisorPdf pdf ancho marcas numeros selId modoMarcar colorMarcar onMarcar onClickMarca refPaginas
             editable capaTexto onCambiarMarca editorId renderEditor onClickFondo />
     · pdf          : PDFDocumentProxy
     · ancho        : ancho en px de cada página
     · marcas       : activaciones con { id, tipo, pagina, x, y, w, h }
     · numeros      : { [id]: número a mostrar }
     · modoMarcar   : true = arrastrar sobre una página crea un rectángulo
     · onMarcar(pagina, rect) / onClickMarca(a)
     · editable     : la marca seleccionada se puede mover (arrastrándola) y
                      cambiar de tamaño (asas en las esquinas) -> onCambiarMarca(id, rect)
     · capaTexto    : texto seleccionable encima del PDF (para copiarlo y pegarlo)
     · editorId / renderEditor(a): tarjeta flotante junto a esa marca
     · onClickFondo : clic en la página fuera de las marcas
     · refPaginas   : ref donde se guardan los nodos de cada página (para desplazarse) */
function VisorPdf(props) {
  const { pdf, marcas, refPaginas } = props;
  const [proporcion, setProporcion] = React.useState(1.294); // alto/ancho de la 1ª página (carta por defecto)
  React.useEffect(() => {
    let vivo = true;
    pdf.getPage(1).then((p) => { if (!vivo) return; const v = p.getViewport({ scale: 1 }); setProporcion(v.height / v.width); });
    return () => { vivo = false; };
  }, [pdf]);
  const paginas = Array.from({ length: pdf.numPages }, (_, i) => i + 1);
  return (
    <div className="vg-pdf-visor">
      {paginas.map((n) => (
        <PaginaPdf key={n} {...props} numero={n} proporcionInicial={proporcion}
          marcas={(marcas || []).filter((a) => (a.pagina || 1) === n)} numeros={props.numeros || {}}
          refNodo={(el) => { if (refPaginas) refPaginas.current[n] = el; }} />
      ))}
    </div>
  );
}

const redondea4 = (v) => Math.round(v * 10000) / 10000;
const MIN_W = 0.015, MIN_H = 0.01;

function PaginaPdf({ pdf, numero, ancho, proporcionInicial, marcas, numeros, selId, modoMarcar, colorMarcar,
  onMarcar, onClickMarca, refNodo, editable, capaTexto, onCambiarMarca, editorId, renderEditor, onClickFondo }) {
  const caja = React.useRef(null);
  const lienzo = React.useRef(null);
  const capa = React.useRef(null);
  const [visible, setVisible] = React.useState(numero <= 2);
  const [proporcion, setProporcion] = React.useState(null);
  const [dibujo, setDibujo] = React.useState(null);    // rectángulo nuevo mientras se arrastra
  const [arrastre, setArrastre] = React.useState(null); // { id, rect } mientras se mueve o redimensiona una marca
  const alto = Math.round(ancho * (proporcion || proporcionInicial));

  // Solo se dibuja cuando la página se acerca a la pantalla (documentos largos).
  React.useEffect(() => {
    const el = caja.current;
    if (!el || visible) return;
    const io = new IntersectionObserver((ents) => { if (ents.some((e) => e.isIntersecting)) setVisible(true); }, { rootMargin: '600px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  React.useEffect(() => {
    if (!visible || !ancho) return;
    let vivo = true, tarea = null, tareaTexto = null;
    const t = setTimeout(() => {
      pdf.getPage(numero).then((page) => {
        if (!vivo) return;
        const base = page.getViewport({ scale: 1 });
        setProporcion(base.height / base.width);
        const escala = ancho / base.width;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = page.getViewport({ scale: escala * dpr });
        const c = lienzo.current;
        if (!c) return;
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        tarea = page.render({ canvasContext: c.getContext('2d'), viewport: vp });
        tarea.promise.catch(() => {});
        // Capa de texto seleccionable (transparente, encima del dibujo).
        const div = capa.current;
        if (capaTexto && div && window.pdfjsLib.renderTextLayer) {
          div.innerHTML = '';
          div.style.setProperty('--scale-factor', escala);
          page.getTextContent().then((tc) => {
            if (!vivo) return;
            tareaTexto = window.pdfjsLib.renderTextLayer({
              textContentSource: tc, container: div, viewport: page.getViewport({ scale: escala }), textDivs: [],
            });
            if (tareaTexto && tareaTexto.promise) tareaTexto.promise.catch(() => {});
          }).catch(() => {});
        }
      });
    }, 120); // espera a que el ancho deje de cambiar (redimensionar ventana)
    return () => {
      vivo = false; clearTimeout(t);
      if (tarea) tarea.cancel();
      if (tareaTexto && tareaTexto.cancel) tareaTexto.cancel();
    };
  }, [visible, ancho, pdf, numero, capaTexto]);

  const fraccion = (e) => {
    const r = caja.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };

  // Arrastre sobre la página: en modo marcar dibuja una marca nueva.
  const iniciar = (e) => {
    if (!modoMarcar) return;
    e.preventDefault();
    const ini = fraccion(e);
    const mover = (ev) => {
      const p = fraccion(ev);
      setDibujo({ x: Math.min(ini.x, p.x), y: Math.min(ini.y, p.y), w: Math.abs(p.x - ini.x), h: Math.abs(p.y - ini.y) });
    };
    const soltar = (ev) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setDibujo(null);
      const p = fraccion(ev);
      const r = { x: Math.min(ini.x, p.x), y: Math.min(ini.y, p.y), w: Math.abs(p.x - ini.x), h: Math.abs(p.y - ini.y) };
      if (r.w < MIN_W || r.h < MIN_H) return;   // clic sin arrastrar: se ignora
      if (onMarcar) onMarcar(numero, { x: redondea4(r.x), y: redondea4(r.y), w: redondea4(r.w), h: redondea4(r.h) });
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  /* Marca existente:
       · clic (sin moverse)            -> onClickMarca
       · arrastrar (si es editable)    -> mover
       · arrastrar un asa de esquina   -> cambiar tamaño (la esquina opuesta queda fija) */
  const tocarMarca = (e, a, esquina) => {
    e.stopPropagation();
    if (!editable || modoMarcar) return;   // en Presentar: solo el clic
    e.preventDefault();
    const ini = fraccion(e);
    const r0 = { x: a.x || 0, y: a.y || 0, w: a.w || 0.1, h: a.h || 0.03 };
    let movido = false, ultimo = r0;
    const mover = (ev) => {
      const p = fraccion(ev);
      const dx = p.x - ini.x, dy = p.y - ini.y;
      if (!movido && Math.abs(dx) < 0.004 && Math.abs(dy) < 0.004) return;
      movido = true;
      let r;
      if (!esquina) {
        r = { ...r0, x: Math.min(1 - r0.w, Math.max(0, r0.x + dx)), y: Math.min(1 - r0.h, Math.max(0, r0.y + dy)) };
      } else {
        // Esquina opuesta fija; la que se arrastra sigue al puntero.
        const fx = esquina.includes('w') ? r0.x + r0.w : r0.x;
        const fy = esquina.includes('n') ? r0.y + r0.h : r0.y;
        const px = esquina.includes('w') ? Math.min(p.x, fx - MIN_W) : Math.max(p.x, fx + MIN_W);
        const py = esquina.includes('n') ? Math.min(p.y, fy - MIN_H) : Math.max(p.y, fy + MIN_H);
        r = { x: Math.min(fx, px), y: Math.min(fy, py), w: Math.abs(px - fx), h: Math.abs(py - fy) };
      }
      ultimo = r;
      setArrastre({ id: a.id, rect: r });
    };
    const soltar = () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setArrastre(null);
      if (movido) {
        if (onCambiarMarca) onCambiarMarca(a.id, { x: redondea4(ultimo.x), y: redondea4(ultimo.y), w: redondea4(ultimo.w), h: redondea4(ultimo.h) });
      } else if (onClickMarca) onClickMarca(a);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  const pct = (v) => (v * 100) + '%';
  const editada = editorId && marcas.find((a) => a.id === editorId);
  return (
    <div className={'vg-pdf-pagina' + (modoMarcar ? ' marcando' : '')} style={{ width: ancho, height: alto }}
      ref={(el) => { caja.current = el; if (refNodo) refNodo(el); }} onPointerDown={iniciar}
      onClick={(e) => { if (onClickFondo && !modoMarcar && e.target === e.currentTarget) onClickFondo(); }}>
      <canvas ref={lienzo} className="vg-pdf-lienzo" style={{ width: ancho, height: alto }} />
      {capaTexto && <div ref={capa} className="textLayer vg-pdf-texto" onClick={(e) => { if (onClickFondo && !modoMarcar && !String(window.getSelection())) onClickFondo(); e.stopPropagation(); }}></div>}
      {!visible && <div className="vg-pdf-cargando">Página {numero}</div>}
      {marcas.map((a) => {
        const ti = VigiaTipos.tipo(a.tipo);
        const r = arrastre && arrastre.id === a.id ? arrastre.rect : a;
        const sel = a.id === selId;
        return (
          <div key={a.id} role="button" tabIndex={0}
            className={'vg-pdf-marca' + (sel ? ' sel' : '') + (a._visto ? ' visto' : '') + (editable ? ' editable' : '')}
            style={{ left: pct(r.x || 0), top: pct(r.y || 0), width: pct(r.w || 0.1), height: pct(r.h || 0.03), '--tipo': ti.color }}
            onPointerDown={(e) => tocarMarca(e, a, null)}
            onClick={(e) => { e.stopPropagation(); if (!editable && onClickMarca) onClickMarca(a); }}
            onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onClickMarca) { e.preventDefault(); onClickMarca(a); } }}
            title={ti.nombre + (a.termino ? ': ' + a.termino : a.texto ? ': ' + a.texto : '') + (editable ? ' · arrastra para mover' : '')}>
            <span className="vg-pdf-num">{numeros[a.id] || '•'}</span>
            {editable && sel && ['nw', 'ne', 'sw', 'se'].map((q) => (
              <span key={q} className={'vg-asa ' + q} onPointerDown={(e) => tocarMarca(e, a, q)} title="Arrastra para cambiar el tamaño"></span>
            ))}
          </div>
        );
      })}
      {dibujo && (
        <div className="vg-pdf-dibujo" style={{ left: pct(dibujo.x), top: pct(dibujo.y), width: pct(dibujo.w), height: pct(dibujo.h), '--tipo': colorMarcar || '#FF8A00' }} />
      )}
      {/* Tarjeta de edición flotante junto a la marca (a la derecha, o a la
          izquierda si la marca está pegada al borde derecho). */}
      {editada && renderEditor && (
        <div className={'vg-pdf-flotante' + ((editada.x || 0) + (editada.w || 0) > 0.55 ? ' izquierda' : '')}
          style={(editada.x || 0) + (editada.w || 0) > 0.55
            ? { right: pct(1 - (editada.x || 0)), top: pct(editada.y || 0) }
            : { left: pct((editada.x || 0) + (editada.w || 0)), top: pct(editada.y || 0) }}
          onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
          {renderEditor(editada)}
        </div>
      )}
      <span className="vg-pdf-pie">{numero} / {pdf.numPages}</span>
    </div>
  );
}

/* Ancho disponible de un contenedor (se actualiza al redimensionar). */
function useAnchoDe(ref, margen, maximo) {
  const [ancho, setAncho] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setAncho(Math.max(240, Math.min(maximo || 9999, el.clientWidth - (margen || 0))));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref.current]);
  return ancho;
}

Object.assign(window, { cargarPdfJs, abrirPdf, guardarPdfLocal, leerPdfLocal, borrarPdfLocal, claveCacheDrive, VisorPdf, PaginaPdf, useAnchoDe });
