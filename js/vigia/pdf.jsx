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

// Texto del PDF que queda dentro del rectángulo r (fracciones 0–1 de la
// página). Aproximado por letras: sirve para precargar el fragmento marcado.
function textoEnRect(page, r) {
  const vp = page.getViewport({ scale: 1 });
  return page.getTextContent().then((tc) => {
    const lib = window.pdfjsLib;
    const trozos = [];
    tc.items.forEach((it) => {
      if (!it.str || !it.str.trim()) return;
      const tx = lib.Util.transform(vp.transform, it.transform);
      const alto = Math.hypot(tx[2], tx[3]) || 10;
      const x0 = tx[4] / vp.width, y1 = tx[5] / vp.height, y0 = (tx[5] - alto) / vp.height;
      const ancho = (it.width * vp.scale) / vp.width;
      // ¿La línea cruza el rectángulo en vertical (al menos a la mitad)?
      const cruceY = Math.min(y1, r.y + r.h) - Math.max(y0, r.y);
      if (cruceY < (y1 - y0) * 0.5) return;
      const n = it.str.length, porLetra = ancho / n;
      let txt = '';
      for (let i = 0; i < n; i++) {
        const cx = x0 + porLetra * (i + 0.5);
        if (cx >= r.x && cx <= r.x + r.w) txt += it.str[i];
      }
      if (txt.trim()) trozos.push({ y: y0, x: x0, txt });
    });
    trozos.sort((p, q) => (Math.abs(p.y - q.y) > 0.005 ? p.y - q.y : p.x - q.x));
    return trozos.map((t) => t.txt).join(' ').replace(/\s+/g, ' ').trim();
  }).catch(() => '');
}

/* ---------- Visor ----------
   <VisorPdf pdf ancho marcas numeros selId modoMarcar colorMarcar onMarcar onClickMarca refPaginas />
     · pdf          : PDFDocumentProxy
     · ancho        : ancho en px de cada página
     · marcas       : activaciones con { id, tipo, pagina, x, y, w, h }
     · numeros      : { [id]: número a mostrar }
     · modoMarcar   : true = arrastrar sobre una página crea un rectángulo
     · onMarcar(pagina, rect, page) / onClickMarca(a)
     · refPaginas   : ref donde se guardan los nodos de cada página (para desplazarse) */
function VisorPdf({ pdf, ancho, marcas, numeros, selId, modoMarcar, colorMarcar, onMarcar, onClickMarca, refPaginas }) {
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
        <PaginaPdf key={n} pdf={pdf} numero={n} ancho={ancho} proporcionInicial={proporcion}
          marcas={(marcas || []).filter((a) => (a.pagina || 1) === n)} numeros={numeros || {}} selId={selId}
          modoMarcar={modoMarcar} colorMarcar={colorMarcar} onMarcar={onMarcar} onClickMarca={onClickMarca}
          refNodo={(el) => { if (refPaginas) refPaginas.current[n] = el; }} />
      ))}
    </div>
  );
}

function PaginaPdf({ pdf, numero, ancho, proporcionInicial, marcas, numeros, selId, modoMarcar, colorMarcar, onMarcar, onClickMarca, refNodo }) {
  const caja = React.useRef(null);
  const lienzo = React.useRef(null);
  const pagina = React.useRef(null);
  const [visible, setVisible] = React.useState(numero <= 2);
  const [proporcion, setProporcion] = React.useState(null);
  const [dibujo, setDibujo] = React.useState(null);  // rectángulo en vivo mientras se arrastra
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
    let vivo = true, tarea = null;
    const t = setTimeout(() => {
      pdf.getPage(numero).then((page) => {
        if (!vivo) return;
        pagina.current = page;
        const base = page.getViewport({ scale: 1 });
        setProporcion(base.height / base.width);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const vp = page.getViewport({ scale: (ancho / base.width) * dpr });
        const c = lienzo.current;
        if (!c) return;
        c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
        tarea = page.render({ canvasContext: c.getContext('2d'), viewport: vp });
        tarea.promise.catch(() => {});
      });
    }, 120); // espera a que el ancho deje de cambiar (redimensionar ventana)
    return () => { vivo = false; clearTimeout(t); if (tarea) tarea.cancel(); };
  }, [visible, ancho, pdf, numero]);

  const fraccion = (e) => {
    const r = caja.current.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
      y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
    };
  };
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
      if (r.w < 0.01 || r.h < 0.008) return;   // clic sin arrastrar: se ignora
      const redondea = (v) => Math.round(v * 10000) / 10000;
      const rect = { x: redondea(r.x), y: redondea(r.y), w: redondea(r.w), h: redondea(r.h) };
      const usar = (page) => onMarcar && onMarcar(numero, rect, page);
      if (pagina.current) usar(pagina.current); else pdf.getPage(numero).then(usar);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  const pct = (v) => (v * 100) + '%';
  return (
    <div className={'vg-pdf-pagina' + (modoMarcar ? ' marcando' : '')} style={{ width: ancho, height: alto }}
      ref={(el) => { caja.current = el; if (refNodo) refNodo(el); }} onPointerDown={iniciar}>
      <canvas ref={lienzo} className="vg-pdf-lienzo" style={{ width: ancho, height: alto }} />
      {!visible && <div className="vg-pdf-cargando">Página {numero}</div>}
      {marcas.map((a) => {
        const ti = VigiaTipos.tipo(a.tipo);
        return (
          <button key={a.id} className={'vg-pdf-marca' + (a.id === selId ? ' sel' : '') + (a._visto ? ' visto' : '')}
            style={{ left: pct(a.x || 0), top: pct(a.y || 0), width: pct(a.w || 0.1), height: pct(a.h || 0.03), '--tipo': ti.color }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (onClickMarca) onClickMarca(a); }}
            title={ti.nombre + (a.termino ? ': ' + a.termino : a.texto ? ': ' + a.texto : '')}>
            <span className="vg-pdf-num">{numeros[a.id] || '•'}</span>
          </button>
        );
      })}
      {dibujo && (
        <div className="vg-pdf-dibujo" style={{ left: pct(dibujo.x), top: pct(dibujo.y), width: pct(dibujo.w), height: pct(dibujo.h), '--tipo': colorMarcar || '#FF8A00' }} />
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

Object.assign(window, { cargarPdfJs, abrirPdf, guardarPdfLocal, leerPdfLocal, borrarPdfLocal, claveCacheDrive, textoEnRect, VisorPdf, PaginaPdf, useAnchoDe });
