/* drive.jsx — Google Drive del docente para el Modo Vigía.
   Guarda los PDF y su JSON de marcas en "Res Cogitans/PDFs" de TU Drive.

   · Sesión: Google Identity Services (OAuth en el navegador, token de acceso)
     con el permiso drive.file (la app solo ve los archivos que ella crea).
     El ID de cliente está en js/google-config.js.
     El token dura ~1 h; se guarda solo en esta pestaña (sessionStorage).
     Al vencer, se pide "Conectar Google Drive" de nuevo (un clic).
   · PDF: se sube a la carpeta; PDF.js lo abre con files.get?alt=media y el
     token (ver pdf.jsx). Se guarda una copia en caché del navegador (IndexedDB)
     para abrirlo rápido y aunque la sesión haya vencido.
   · Marcas: "<nombre>.marcas.json" junto al PDF, se actualiza solo al editar.

   Exporta: DriveAuth (estado), useDrive(), <DriveSesion />, carpetaPdfs(),
   subirPdfDrive(), listarPdfsDrive(), urlMediaDrive(), guardarMarcasDrive(),
   useSincronizarMarcas(). */

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const CARPETA_RAIZ = 'Res Cogitans';
const CARPETA_PDFS = 'PDFs';

/* ---------- Estado de la sesión (compartido por toda la app) ---------- */
const DriveAuth = (function () {
  let token = null, expira = 0, usuario = null, cliente = null, pendiente = null;
  const oyentes = new Set();
  const avisar = () => oyentes.forEach((f) => f());
  // Recupera el token de esta pestaña (si aún no vence).
  try {
    const g = JSON.parse(sessionStorage.getItem('vigia_drive') || 'null');
    if (g && g.expira > Date.now() + 60000) { token = g.token; expira = g.expira; usuario = g.usuario || null; }
  } catch (e) { /* sin almacenamiento */ }
  const guardar = () => {
    try {
      if (token) sessionStorage.setItem('vigia_drive', JSON.stringify({ token, expira, usuario }));
      else sessionStorage.removeItem('vigia_drive');
    } catch (e) { /* sin almacenamiento */ }
  };

  function cargarGis() {
    if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://accounts.google.com/gsi/client';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('No se pudo cargar el inicio de sesión de Google.'));
      document.head.appendChild(s);
    });
  }

  return {
    configurado: () => !!window.GOOGLE_CLIENT_ID,
    conectado: () => !!token && expira > Date.now() + 30000,
    token: () => (token && expira > Date.now() + 30000 ? token : null),
    usuario: () => usuario,
    suscribir: (f) => { oyentes.add(f); return () => oyentes.delete(f); },
    // Abre la ventana de Google (debe llamarse desde un clic del docente).
    iniciar() {
      if (!window.GOOGLE_CLIENT_ID) return Promise.reject(new Error('Falta el ID de cliente de Google en js/google-config.js.'));
      if (pendiente) return pendiente;
      pendiente = cargarGis().then(() => new Promise((resolve, reject) => {
        cliente = window.google.accounts.oauth2.initTokenClient({
          client_id: window.GOOGLE_CLIENT_ID,
          scope: DRIVE_SCOPE,
          callback: (r) => {
            if (r.error) { reject(new Error('Google no dio permiso: ' + r.error)); return; }
            token = r.access_token;
            expira = Date.now() + (Number(r.expires_in) || 3600) * 1000;
            guardar(); avisar(); resolve(token);
            // Quién es (para mostrarlo en el botón); no es imprescindible.
            fetch(DRIVE_API + '/about?fields=user(displayName,emailAddress)', { headers: { Authorization: 'Bearer ' + token } })
              .then((x) => (x.ok ? x.json() : null))
              .then((j) => { if (j && j.user) { usuario = j.user; guardar(); avisar(); } })
              .catch(() => {});
          },
          error_callback: (e) => reject(new Error(e && e.type === 'popup_closed' ? 'Cerraste la ventana de Google.' : 'No se pudo iniciar sesión con Google.')),
        });
        cliente.requestAccessToken({ prompt: localStorage.getItem('vigia_drive_ok') ? '' : 'consent' });
      })).then((t) => { try { localStorage.setItem('vigia_drive_ok', '1'); } catch (e) { /* */ } return t; })
        .finally(() => { pendiente = null; });
      return pendiente;
    },
    cerrar() {
      const t = token;
      token = null; expira = 0; usuario = null;
      guardar(); avisar();
      try { localStorage.removeItem('vigia_drive_carpeta'); } catch (e) { /* */ }
      if (t && window.google && window.google.accounts) window.google.accounts.oauth2.revoke(t, () => {});
    },
    // El token dejó de servir (401): se olvida para pedir sesión de nuevo.
    invalidar() { token = null; expira = 0; guardar(); avisar(); },
  };
})();

function useDrive() {
  const [, setN] = React.useState(0);
  React.useEffect(() => DriveAuth.suscribir(() => setN((n) => n + 1)), []);
  return {
    configurado: DriveAuth.configurado(),
    conectado: DriveAuth.conectado(),
    usuario: DriveAuth.usuario(),
    iniciar: DriveAuth.iniciar,
    cerrar: DriveAuth.cerrar,
  };
}

/* Botón de iniciar / cerrar sesión de Google Drive. */
function DriveSesion({ compacto }) {
  const d = useDrive();
  const [error, setError] = React.useState('');
  const [abierto, setAbierto] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  if (!d.configurado) {
    return <span className="vg-drive-estado" title="Pega el ID de cliente en js/google-config.js">Drive sin configurar</span>;
  }
  if (!d.conectado) {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
        <button className="btn vg-drive-btn" onClick={() => { setError(''); DriveAuth.iniciar().catch((e) => setError(e.message)); }}
          title="Iniciar sesión con Google para guardar los PDF en tu Drive">
          <span className="vg-drive-logo" aria-hidden="true"></span> {compacto ? 'Conectar Drive' : 'Iniciar sesión en Google Drive'}
        </button>
        {error && <span style={{ fontSize: 11.5, color: 'var(--naranja-ink)', marginTop: 4, maxWidth: 260, textAlign: 'right' }}>{error}</span>}
      </span>
    );
  }
  const u = d.usuario;
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="btn vg-drive-btn on" onClick={() => setAbierto((v) => !v)} title={u ? u.emailAddress : 'Google Drive conectado'}>
        <span className="vg-drive-logo" aria-hidden="true"></span> {compacto ? 'Drive ✓' : 'Drive conectado'}
      </button>
      {abierto && (
        <div className="vg-popover" style={{ width: 280 }}>
          <div style={{ fontWeight: 800 }}>Google Drive</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', margin: '4px 0 12px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {u ? (u.displayName + ' · ' + u.emailAddress) : 'Conectado'}
            <br />Los PDF y sus marcas se guardan en «{CARPETA_RAIZ}/{CARPETA_PDFS}».
          </div>
          <button className="btn btn-sm" onClick={() => { setAbierto(false); DriveAuth.cerrar(); }}>Cerrar sesión de Drive</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Llamadas a la API ---------- */
function driveFetch(url, opciones) {
  const t = DriveAuth.token();
  if (!t) { const e = new Error('Inicia sesión en Google Drive.'); e.motivo = 'drive-sesion'; return Promise.reject(e); }
  const o = Object.assign({}, opciones || {});
  o.headers = Object.assign({ Authorization: 'Bearer ' + t }, o.headers || {});
  return fetch(url, o).then((r) => {
    if (r.status === 401) { DriveAuth.invalidar(); const e = new Error('La sesión de Google Drive venció. Conéctala de nuevo.'); e.motivo = 'drive-sesion'; throw e; }
    if (!r.ok) return r.text().then((txt) => { const e = new Error('Google Drive respondió ' + r.status + ': ' + txt.slice(0, 200)); e.motivo = 'drive-error'; throw e; });
    return r;
  });
}
const comillas = (s) => String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'");

function buscarOCrearCarpeta(nombre, padre) {
  const q = "name='" + comillas(nombre) + "' and mimeType='application/vnd.google-apps.folder' and '" + padre + "' in parents and trashed=false";
  return driveFetch(DRIVE_API + '/files?fields=files(id,name)&spaces=drive&q=' + encodeURIComponent(q))
    .then((r) => r.json())
    .then((j) => {
      if (j.files && j.files.length) return j.files[0].id;
      return driveFetch(DRIVE_API + '/files?fields=id', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: nombre, mimeType: 'application/vnd.google-apps.folder', parents: [padre] }),
      }).then((r) => r.json()).then((x) => x.id);
    });
}

// Id de la carpeta "Res Cogitans/PDFs" (se crea la primera vez).
let promesaCarpeta = null;
function carpetaPdfs() {
  const guardada = (() => { try { return localStorage.getItem('vigia_drive_carpeta'); } catch (e) { return null; } })();
  if (guardada) return Promise.resolve(guardada);
  if (!promesaCarpeta) {
    promesaCarpeta = buscarOCrearCarpeta(CARPETA_RAIZ, 'root')
      .then((raiz) => buscarOCrearCarpeta(CARPETA_PDFS, raiz))
      .then((id) => { try { localStorage.setItem('vigia_drive_carpeta', id); } catch (e) { /* */ } return id; })
      .finally(() => { promesaCarpeta = null; });
  }
  return promesaCarpeta;
}

// Sube un archivo (crear) o reemplaza su contenido (si se da `id`).
function subirArchivoDrive(meta, contenido, tipo, id) {
  const boundary = 'resCogitans' + Math.random().toString(36).slice(2);
  const metaSinPadre = id ? { name: meta.name, mimeType: meta.mimeType } : meta;
  const cuerpo = new Blob([
    '--' + boundary + '\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n' + JSON.stringify(metaSinPadre) + '\r\n',
    '--' + boundary + '\r\nContent-Type: ' + tipo + '\r\n\r\n', contenido, '\r\n--' + boundary + '--',
  ]);
  const url = DRIVE_UPLOAD + '/files' + (id ? '/' + id : '') + '?uploadType=multipart&fields=id,name,size';
  return driveFetch(url, { method: id ? 'PATCH' : 'POST', headers: { 'Content-Type': 'multipart/related; boundary=' + boundary }, body: cuerpo })
    .then((r) => r.json());
}

// Subida reanudable (Google la recomienda para archivos de más de 5 MB):
// se abre una sesión y luego se envía el archivo a la dirección que devuelve.
function subirReanudable(meta, archivo, tipo) {
  return driveFetch(DRIVE_UPLOAD + '/files?uploadType=resumable&fields=id,name,size', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': tipo },
    body: JSON.stringify(meta),
  }).then((r) => {
    const destino = r.headers.get('Location');
    if (!destino) return subirArchivoDrive(meta, archivo, tipo);   // sin sesión reanudable: subida simple
    return fetch(destino, { method: 'PUT', headers: { 'Content-Type': tipo }, body: archivo }).then((x) => {
      if (!x.ok) { const e = new Error('No se pudo terminar de subir el PDF (' + x.status + ').'); e.motivo = 'drive-error'; throw e; }
      return x.json();
    });
  });
}

// Formatos de documento aceptados (PDF y EPUB), por extensión del nombre.
const MIME_DOCUMENTO = { pdf: 'application/pdf', epub: 'application/epub+zip' };
function formatoDeArchivo(nombre, mime) {
  if (/epub/i.test(mime || '') || /\.epub$/i.test(nombre || '')) return 'epub';
  return 'pdf';
}

// Sube un PDF o EPUB a "Res Cogitans/PDFs". Devuelve { id, name, size }.
function subirPdfDrive(archivo) {
  const tipo = MIME_DOCUMENTO[formatoDeArchivo(archivo.name, archivo.type)];
  const intentar = () => carpetaPdfs().then((carpeta) => {
    const meta = { name: archivo.name, mimeType: tipo, parents: [carpeta] };
    return archivo.size > 5 * 1024 * 1024
      ? subirReanudable(meta, archivo, tipo)
      : subirArchivoDrive(meta, archivo, tipo);
  });
  // Si la carpeta guardada ya no existe (la borraron en Drive), se busca/crea de nuevo y se reintenta.
  return intentar().catch((e) => {
    if (e.motivo !== 'drive-error') throw e;
    try { localStorage.removeItem('vigia_drive_carpeta'); } catch (x) { /* */ }
    return intentar();
  });
}

// PDF y EPUB que la app ya subió (para reutilizar uno en otra activación).
function listarPdfsDrive() {
  return carpetaPdfs().then((carpeta) => {
    const q = "'" + carpeta + "' in parents and (mimeType='application/pdf' or mimeType='application/epub+zip') and trashed=false";
    return driveFetch(DRIVE_API + '/files?orderBy=modifiedTime desc&pageSize=50&fields=files(id,name,size,mimeType,modifiedTime)&q=' + encodeURIComponent(q))
      .then((r) => r.json()).then((j) => j.files || []);
  });
}

// URL de descarga del contenido (PDF.js la usa con el token en la cabecera).
function urlMediaDrive(id) { return DRIVE_API + '/files/' + id + '?alt=media'; }

// Descarga el contenido completo (lo usa el EPUB, que se abre como un ZIP).
function descargarDrive(id) {
  return driveFetch(urlMediaDrive(id)).then((r) => r.arrayBuffer()).catch((e) => {
    if (e.motivo === 'drive-error' && /\b404\b/.test(e.message)) e.message = 'El archivo ya no está en tu Drive (¿se borró o está en la papelera?).';
    throw e;
  });
}

/* JSON de marcas junto al PDF. Devuelve el id del JSON (nuevo o el mismo). */
function contenidoMarcas(act) {
  const pdf = act.pdf || {};
  return {
    app: 'Res Cogitans · Modo Vigía', formato: 1, actualizado: new Date().toISOString(),
    activacion: {
      id: act.id, titulo: act.titulo || '', objetivo: act.objetivo || '', recurso: act.recurso,
      pdf: { nombre: pdf.nombre || '', driveId: pdf.driveId || '' },
      estudiantes: act.estudiantes || [], ordenNombres: act.ordenNombres || 'apellidos',
      activaciones: act.activaciones || [],
    },
  };
}
function guardarMarcasDrive(act) {
  const pdf = act.pdf || {};
  const base = (pdf.nombre || act.titulo || 'documento').replace(/\.pdf$/i, '');
  const blob = new Blob([JSON.stringify(contenidoMarcas(act), null, 2)], { type: 'application/json' });
  const subir = (carpeta, id) => subirArchivoDrive({ name: base + '.marcas.json', mimeType: 'application/json', parents: [carpeta] }, blob, 'application/json', id);
  return carpetaPdfs().then((carpeta) =>
    subir(carpeta, pdf.jsonId).catch((e) => {
      // Si el JSON anterior ya no existe (lo borraron en Drive), se crea otro.
      if (pdf.jsonId && e.motivo === 'drive-error') return subir(carpeta, null);
      throw e;
    })).then((x) => x.id);
}

/* Mantiene el JSON de marcas al día en Drive mientras se edita o presenta.
   Espera 2,5 s sin cambios antes de subir. Devuelve el estado para mostrarlo:
   'sin-sesion' | 'pendiente' | 'guardando' | 'guardado' | 'error'. */
function useSincronizarMarcas(act, onChange) {
  const d = useDrive();
  const [estado, setEstado] = React.useState('guardado');
  const ultimo = React.useRef(null);
  const pdf = act.pdf || {};
  const firma = JSON.stringify([act.titulo, act.objetivo, act.estudiantes, act.ordenNombres, act.activaciones, pdf.driveId, pdf.nombre]);
  React.useEffect(() => {
    if (!pdf.driveId) return;
    if (firma === ultimo.current) return;
    if (!d.conectado) { setEstado('sin-sesion'); return; }
    setEstado('pendiente');
    const t = setTimeout(() => {
      setEstado('guardando');
      guardarMarcasDrive(act)
        .then((jsonId) => {
          ultimo.current = firma;
          setEstado('guardado');
          if (jsonId && jsonId !== pdf.jsonId && onChange) onChange({ ...act, pdf: { ...pdf, jsonId } });
        })
        .catch((e) => setEstado(e.motivo === 'drive-sesion' ? 'sin-sesion' : 'error'));
    }, 2500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firma, d.conectado]);
  return pdf.driveId ? estado : null;
}

Object.assign(window, {
  DriveAuth, useDrive, DriveSesion, carpetaPdfs, subirPdfDrive, listarPdfsDrive, formatoDeArchivo,
  urlMediaDrive, descargarDrive, guardarMarcasDrive, useSincronizarMarcas,
});
