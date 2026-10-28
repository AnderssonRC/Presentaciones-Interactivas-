/* vigia.jsx — Modo Vigía: interfaz aparte (naranja + azul eléctrico) con su
   propio logo. Se entra desde el botón "Modo Vigía" del dashboard de
   Actividades Interactivas (ver app.jsx: estado `modo`).
     · cargarVigia()   -> carga BAJO DEMANDA los módulos de js/vigia/ (editor,
                          presentar, YouTube, ruleta, tipos). Así no pesan en la
                          página mientras no se usa el Modo Vigía.
     · VigiaCarga      -> pantalla de carga con el cóndor (cubre esa carga)
     · VigiaDashboard  -> inicio del Modo Vigía: crear y listar activaciones
   El ícono y el título de la pestaña los cambia app.jsx (usarIconoPestana).
   Ver js/vigia/LEEME.md. */

// Ícono recortado al marco interior (el cóndor llena el cuadro). El original
// completo, con márgenes negros, es condor-vigia.png.
const VIGIA_LOGO = 'condor-vigia-icono.webp';   // 10 KB (el PNG pesa 96 KB)

// Módulos del Modo Vigía, en orden. Al editar uno, sube su versión aquí
// (y la de este archivo en index.html) para que el navegador no use la vieja.
const VIGIA_MODULOS = [
  ['js/vigia/tipos.js', '20261028c'],
  ['js/vigia/youtube.jsx', '20261020p'],
  ['js/vigia/audio.jsx', '20261024d'],
  ['js/vigia/drive.jsx', '20261020a'],
  ['js/vigia/pdf.jsx', '20261020f'],
  ['js/vigia/epub.jsx', '20261020f'],
  ['js/vigia/respaldo.jsx', '20261024h'],
  ['js/vigia/ruleta.jsx', '20261020l'],
  ['js/vigia/editor.jsx', '20261028c'],
  ['js/vigia/editor-pdf.jsx', '20261026d'],
  ['js/vigia/editor-epub.jsx', '20261026d'],
  ['js/vigia/editor-podcast.jsx', '20261026d'],
  ['js/vigia/editor-imagenes.jsx', '20261026d'],
  ['js/vigia/herramientas.jsx', '20261024n'],
  ['js/vigia/mando.jsx', '20261027f'],
  ['js/vigia/presentar.jsx', '20261027f'],
  ['js/vigia/presentar-reto.jsx', '20261026b'],
  ['js/vigia/presentar-jaguar.jsx', '20261028b'],
  ['js/vigia/presentar-capibara.jsx', '20261028c'],
  ['js/vigia/capibara-comun.jsx', '20261028b'],
  ['js/vigia/capibara-muro.jsx', '20261028b'],
  ['js/vigia/capibara-jungla.jsx', '20261028b'],
  ['js/vigia/capibara-dedos.jsx', '20261028c'],
  ['js/vigia/presentar-pdf.jsx', '20261024l'],
  ['js/vigia/presentar-epub.jsx', '20261024l'],
  ['js/vigia/presentar-podcast.jsx', '20261024l'],
  ['js/vigia/presentar-imagenes.jsx', '20261024l'],
];
const VIGIA_ESTILOS = ['js/vigia/estilos.css', '20261028c'];
// Pantalla del mando en el celular (la carga remote.jsx solo en el celular).
const VIGIA_MANDO_VERSION = '20261028c';
let promesaVigia = null;
// Tipografía de los títulos de las tarjetas (Fraunces, cursiva "suave"): elegante y juguetona.
const VIGIA_FUENTE = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,600..900,100,1&display=swap';
function cargarEstilosVigia() {
  if (!document.getElementById('vigia-fuente')) {
    const f = document.createElement('link');
    f.id = 'vigia-fuente'; f.rel = 'stylesheet'; f.href = VIGIA_FUENTE;
    document.head.appendChild(f);   // no se espera: mientras llega, se usa Georgia
  }
  if (document.getElementById('vigia-estilos')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.id = 'vigia-estilos'; l.rel = 'stylesheet'; l.href = VIGIA_ESTILOS[0] + '?v=' + VIGIA_ESTILOS[1];
    l.onload = () => resolve();
    l.onerror = () => { l.remove(); reject(new Error('No se pudo cargar ' + VIGIA_ESTILOS[0])); };
    document.head.appendChild(l);
  });
}
/* ---------- Cuadros de diálogo propios del Modo Vigía ----------
   Reemplazan a window.confirm / prompt / alert (que se ven con la estética
   del navegador). Centrados, naranja + azul eléctrico, con el cóndor.
     · vigiaConfirmar(mensaje, { titulo, aceptar, cancelar, peligro }) -> Promise<boolean>
     · vigiaPreguntar(mensaje, { titulo, valor, placeholder, aceptar }) -> Promise<string|null>
     · vigiaAviso(mensaje, { titulo })                                  -> Promise<void>
   Enter = aceptar, Esc = cancelar. Traen sus propios estilos (sirven también
   en el celular, que no carga estilos.css). */
const VG_DIALOGO_CSS = `
.vgd-fondo { position: fixed; inset: 0; z-index: 2000; display: grid; place-items: center; padding: 20px;
  background: rgba(3,2,1,.72); backdrop-filter: blur(5px); animation: vgdAparece .18s ease both; }
.vgd-caja { width: min(460px, 100%); border-radius: 22px; padding: 24px 24px 20px; text-align: center; color: #FFF3E6;
  font-family: var(--font-display, 'Sora', system-ui, sans-serif);
  background: radial-gradient(420px 180px at 0% 0%, rgba(255,138,0,.16), transparent 70%), radial-gradient(380px 200px at 100% 100%, rgba(0,212,255,.10), transparent 70%), #120B07;
  border: 1px solid rgba(255,138,0,.45); box-shadow: 0 30px 80px -20px rgba(0,0,0,.85), 0 0 40px -14px rgba(255,138,0,.6);
  animation: vgdEntra .26s cubic-bezier(.2,1.3,.4,1) both; }
.vgd-caja.peligro { border-color: rgba(255,90,60,.6); box-shadow: 0 30px 80px -20px rgba(0,0,0,.85), 0 0 40px -14px rgba(255,90,60,.6); }
.vgd-logo { width: 54px; height: 54px; border-radius: 14px; margin: 0 auto 10px; display: block; }
.vgd-titulo { font-weight: 800; font-size: 19px; margin: 0 0 6px; }
.vgd-mensaje { font-size: 14.5px; line-height: 1.45; color: #E9D6C4; margin: 0 0 16px; white-space: pre-line; }
.vgd-campo { width: 100%; box-sizing: border-box; padding: 12px 14px; border-radius: 12px; font: inherit; font-size: 16px; font-weight: 700;
  text-align: center; color: #FFF3E6; background: rgba(255,255,255,.06); border: 1.5px solid rgba(255,138,0,.45); outline: none; margin-bottom: 16px; }
.vgd-campo:focus { border-color: #FF8A00; box-shadow: 0 0 0 3px rgba(255,138,0,.25); }
.vgd-campo::placeholder { color: rgba(255,243,230,.4); font-weight: 600; }
.vgd-botones { display: flex; gap: 10px; justify-content: center; }
.vgd-btn { flex: 1; max-width: 190px; padding: 12px 16px; border-radius: 12px; border: 0; cursor: pointer; font: inherit; font-weight: 800; font-size: 15px; }
.vgd-btn.cancelar { background: transparent; color: #FFF3E6; border: 1.5px solid rgba(255,255,255,.22); }
.vgd-btn.cancelar:hover { background: rgba(255,255,255,.08); }
.vgd-btn.aceptar { background: linear-gradient(135deg, #FF8A00, #FF5A1F); color: #140800; box-shadow: 0 10px 24px -10px rgba(255,138,0,.9); }
.vgd-btn.aceptar.peligro { background: linear-gradient(135deg, #FF5A3C, #D9301A); color: #fff; }
.vgd-btn:disabled { opacity: .45; cursor: default; }
/* Variante "plataforma" (Actividades Interactivas): usa el tema activo
   (claro u oscuro) y su color de acento. */
.vgd-caja.plataforma { background: var(--surface, #141714); color: var(--ink, #F2F5EF); border-color: var(--line, #262B25);
  box-shadow: 0 30px 80px -20px rgba(0,0,0,.55); }
.vgd-caja.plataforma .vgd-logo { border-radius: 14px; }
.vgd-caja.plataforma .vgd-mensaje { color: var(--muted, #9AA396); }
.vgd-caja.plataforma .vgd-campo { color: var(--ink, #F2F5EF); background: var(--surface2, #1C201B); border-color: var(--line, #262B25); }
.vgd-caja.plataforma .vgd-campo:focus { border-color: var(--acento, #11F555); box-shadow: 0 0 0 3px color-mix(in srgb, var(--acento, #11F555) 25%, transparent); }
.vgd-caja.plataforma .vgd-campo::placeholder { color: var(--muted, #9AA396); }
.vgd-caja.plataforma .vgd-btn.cancelar { color: var(--ink, #F2F5EF); border-color: var(--line, #262B25); }
.vgd-caja.plataforma .vgd-btn.cancelar:hover { background: var(--surface2, #1C201B); }
.vgd-caja.plataforma .vgd-btn.aceptar { background: var(--acento, #11F555); color: var(--acento-text, #06140A); box-shadow: none; }
.vgd-caja.plataforma .vgd-btn.aceptar.peligro { background: linear-gradient(135deg, #FF5A3C, #D9301A); color: #fff; }
.vgd-caja.plataforma.peligro { border-color: rgba(255,90,60,.55); }
@keyframes vgdAparece { from { opacity: 0; } to { opacity: 1; } }
@keyframes vgdEntra { from { opacity: 0; transform: translateY(12px) scale(.95); } to { opacity: 1; transform: none; } }
`;
function DialogoVigia({ tipo, titulo, mensaje, valor, placeholder, aceptar, cancelar, peligro, tema, onFin }) {
  const plataforma = tema === 'plataforma';
  const [texto, setTexto] = React.useState(valor || '');
  const campo = React.useRef(null), boton = React.useRef(null);
  React.useEffect(() => {
    const foco = tipo === 'preguntar' ? campo.current : boton.current;
    if (foco && document.activeElement !== foco && !foco.dataset.enfocado) { foco.dataset.enfocado = '1'; foco.focus(); }
    // Captura: Enter / Esc no llegan a la presentación ni al editor de atrás.
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); onFin(tipo === 'preguntar' ? null : false); }
      else if (e.key === 'Enter') { e.stopPropagation(); e.preventDefault(); listo(); }
      else e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  const listo = () => {
    if (tipo === 'preguntar') { if (texto.trim()) onFin(texto.trim()); }
    else onFin(true);
  };
  return (
    <div className="vgd-fondo" onMouseDown={(e) => { if (e.target === e.currentTarget) onFin(tipo === 'preguntar' ? null : false); }}>
      <div className={'vgd-caja' + (peligro ? ' peligro' : '') + (plataforma ? ' plataforma' : '')} role="dialog" aria-modal="true"
        aria-label={titulo || (plataforma ? 'Actividades Interactivas' : 'Modo Vigía')}>
        <img src={plataforma ? 'logo-192.png' : VIGIA_LOGO} alt="" className="vgd-logo" />
        {titulo && <h2 className="vgd-titulo">{titulo}</h2>}
        {mensaje && <p className="vgd-mensaje">{mensaje}</p>}
        {tipo === 'preguntar' && (
          <input ref={campo} className="vgd-campo" value={texto} placeholder={placeholder || ''} maxLength={60}
            onChange={(e) => setTexto(e.target.value)} />
        )}
        <div className="vgd-botones">
          {tipo !== 'aviso' && <button className="vgd-btn cancelar" onClick={() => onFin(tipo === 'preguntar' ? null : false)}>{cancelar || 'Cancelar'}</button>}
          <button ref={boton} className={'vgd-btn aceptar' + (peligro ? ' peligro' : '')} onClick={listo}
            disabled={tipo === 'preguntar' && !texto.trim()}>{aceptar || (tipo === 'aviso' ? 'Entendido' : 'Aceptar')}</button>
        </div>
      </div>
    </div>
  );
}
function abrirDialogoVigia(props) {
  if (!document.getElementById('vgd-css')) {
    const s = document.createElement('style'); s.id = 'vgd-css'; s.textContent = VG_DIALOGO_CSS; document.head.appendChild(s);
  }
  return new Promise((resolve) => {
    const nodo = document.createElement('div');
    document.body.appendChild(nodo);
    const raiz = ReactDOM.createRoot(nodo);
    const onFin = (r) => { raiz.unmount(); nodo.remove(); resolve(r); };
    raiz.render(<DialogoVigia {...props} onFin={onFin} />);
  });
}
const vigiaConfirmar = (mensaje, op) => abrirDialogoVigia({ tipo: 'confirmar', titulo: '¿Seguro?', ...(op || {}), mensaje });
const vigiaPreguntar = (mensaje, op) => abrirDialogoVigia({ tipo: 'preguntar', ...(op || {}), mensaje });
const vigiaAviso = (mensaje, op) => abrirDialogoVigia({ tipo: 'aviso', titulo: 'Aviso', ...(op || {}), mensaje });
// Los mismos cuadros con la estética de Actividades Interactivas (fuera del Modo Vigía).
const aipConfirmar = (mensaje, op) => vigiaConfirmar(mensaje, { tema: 'plataforma', ...(op || {}) });
const aipPreguntar = (mensaje, op) => vigiaPreguntar(mensaje, { tema: 'plataforma', ...(op || {}) });
const aipAviso = (mensaje, op) => vigiaAviso(mensaje, { tema: 'plataforma', ...(op || {}) });
Object.assign(window, { vigiaConfirmar, vigiaPreguntar, vigiaAviso, aipConfirmar, aipPreguntar, aipAviso });

/* ---------- Imágenes que no se dibujan "a pedazos" ----------
   Cada <img> que termina de cargar recibe la clase .vg-img-lista; los
   estilos (estilos.css) la mantienen oculta hasta entonces y luego la
   muestran completa con un fundido (en vez de aparecer de arriba abajo). */
document.addEventListener('load', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG') el.classList.add('vg-img-lista');
}, true);
// Una imagen en caché puede terminar ANTES de entrar a la página (su "load" no
// llega al documento): al insertarla, si ya está completa, se marca igual.
new MutationObserver((cambios) => {
  cambios.forEach((c) => c.addedNodes.forEach((n) => {
    if (n.nodeType !== 1) return;
    const imgs = n.tagName === 'IMG' ? [n] : n.querySelectorAll ? n.querySelectorAll('img') : [];
    imgs.forEach((img) => { if (img.complete && img.naturalWidth > 0) img.classList.add('vg-img-lista'); });
  }));
}).observe(document.documentElement, { childList: true, subtree: true });

/* Precarga (descarga y decodifica) imágenes y sonidos para que aparezcan al
   instante cuando se necesiten. Sin esperar: no frena nada. */
const precargadas = new Set();
const audiosPrecargados = [];
function precargarVigia(urls) {
  (urls || []).forEach((u) => {
    if (!u || precargadas.has(u)) return;
    precargadas.add(u);
    // Los audios se guardan (si no, el navegador podría descartarlos antes de bajarlos).
    if (/\.(mp3|m4a|ogg|wav)$/i.test(u)) { const a = new Audio(); a.preload = 'auto'; a.src = encodeURI(u); a.load(); audiosPrecargados.push(a); return; }
    const i = new Image();
    i.decoding = 'async';
    i.referrerPolicy = 'no-referrer';
    i.src = u;
    if (i.decode) i.decode().catch(() => {});
  });
}
// Lo que usan las escenas (Reto, Modo Jaguar): se baja apenas se activa el Modo Vigía.
const RECURSOS_ESCENAS = ['condor-retador.webp', 'jaguar-equipos.webp', 'jaguar-rojo.webp', 'Jaguar-voz.mp3', 'voz del ganador.mp3', 'A desempatar.mp3'];

function cargarVigia() {
  if (!promesaVigia) {
    precargarVigia([VIGIA_LOGO]);
    promesaVigia = cargarEstilosVigia()
      .then(() => VIGIA_MODULOS.reduce((cadena, [url, v]) => cadena.then(() => Actividades.ejecutarJSX(url + '?v=' + v)), Promise.resolve()))
      .then(() => { setTimeout(() => precargarVigia(RECURSOS_ESCENAS), 400); })
      .catch((e) => { promesaVigia = null; console.error('[vigia]', e); throw e; });
  }
  return promesaVigia;
}

/* Pantalla de carga al activar el Modo Vigía. */
function VigiaCarga({ error, onReintentar }) {
  return (
    <div className="vigia vigia-carga" data-screen-label="Modo Vigía · Carga">
      <img src={VIGIA_LOGO} alt="Modo Vigía" className="vigia-carga-logo" />
      {error ? (
        <React.Fragment>
          <div className="vigia-carga-texto">No se pudo activar el Modo Vigía. Revisa tu conexión.</div>
          {onReintentar && <button className="btn vigia-btn-crear" onClick={onReintentar}>Reintentar</button>}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="vigia-carga-texto">Activando el Modo Vigía…</div>
          <div className="vigia-carga-barra"><span></span></div>
        </React.Fragment>
      )}
    </div>
  );
}

/* Ventana para elegir el recurso que se va a activar. Cada recurso habilita
   sus tipos de activación (ver js/vigia/tipos.js). */
function ElegirRecurso({ onElegir, onCerrar }) {
  React.useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onCerrar(); };
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onCerrar]);
  return (
    <div className="vg-modal-fondo" onClick={onCerrar}>
      <div className="vg-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Elige el recurso">
        <button className="vg-modal-cerrar" onClick={onCerrar} title="Cerrar">✕</button>
        <div className="kicker" style={{ color: 'var(--vigia-naranja)' }}>Crear activación</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, margin: '6px 0 4px' }}>¿Qué recurso vas a despertar?</h2>
        <p style={{ color: 'var(--muted)', margin: '0 0 18px', fontSize: 14 }}>
          Según el recurso se habilitan las herramientas para volverlo interactivo.
        </p>
        <div className="vg-recurso-grid">
          {VigiaTipos.RECURSOS.map((r) => (
            <button key={r.id} className={'vg-recurso-card' + (r.pronto ? ' pronto' : '')} disabled={r.pronto}
              onClick={() => !r.pronto && onElegir(r.id)}>
              <span className="vg-recurso-ico"><Icon name={r.icon} size={26} /></span>
              <strong>{r.nombre}</strong>
              <span>{r.desc}</span>
              {r.pronto && <span className="soon-tag">Próximamente</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function VigiaDashboard({ profile, esAdmin, onAdmin, onLogout, onSalir, activaciones, onCrear, onAbrir, onPresentar, onEliminar, onImportar, theme, setTheme }) {
  const [eligiendo, setEligiendo] = React.useState(false);
  // Aviso breve (p. ej. "Respaldo importado").
  const [aviso, setAviso] = React.useState('');
  const avisoRef = React.useRef(null);
  const avisar = (txt) => { setAviso(txt); clearTimeout(avisoRef.current); avisoRef.current = setTimeout(() => setAviso(''), 4500); };
  React.useEffect(() => () => clearTimeout(avisoRef.current), []);
  const docs = (activaciones || []).slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const items = docs.reduce((acc, d) => acc.concat(d.activaciones || []), []);

  const stats = [
    { label: 'Recursos activados', value: docs.length, icon: 'rayo' },
    { label: 'Activaciones en total', value: items.length, icon: 'eye' },
    { label: 'Preguntas', value: items.filter((x) => x.tipo === 'pregunta').length, icon: 'pregunta' },
    { label: 'Veces presentadas', value: docs.reduce((a, d) => a + (d.usos || 0), 0), icon: 'play' },
  ];
  const crear = () => setEligiendo(true);

  return (
    <div className="vigia" data-screen-label="Modo Vigía">
      {/* -------- barra superior -------- */}
      <header className="topnav vigia-topnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src={VIGIA_LOGO} alt="Modo Vigía" style={{ height: 44, width: 44, borderRadius: 11, objectFit: 'contain', boxShadow: '0 0 16px -4px rgba(255,138,0,.7)' }} />
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, lineHeight: 1.05 }}>
            Modo<br /><span style={{ color: 'var(--vigia-naranja)' }}>Vigía</span>
          </span>
        </div>
        <button className="vigia-volver" onClick={onSalir} title="Volver a Actividades Interactivas">
          <img src="logo-192.png" alt="" /> <span>Actividades Interactivas</span>
        </button>
        <div style={{ flex: 1 }}></div>
        {/* Sesión de Google Drive (PDF y marcas en «Res Cogitans/PDFs»). */}
        <DriveSesion compacto />
        <button className="btn vigia-btn-crear" onClick={crear} style={{ borderRadius: 999 }}>
          <Icon name="mas" size={16} /> Crear Activaciones
        </button>
        {/* Modo Día también en el Modo Vigía (crema + naranja y azul; Presentar sigue oscuro). */}
        <UserMenu profile={profile} esAdmin={esAdmin} onAdmin={onAdmin} onLogout={onLogout}
          theme={theme} setTheme={setTheme} sinTema={!setTheme} />
      </header>

      <main className="main-wrap">
        {/* -------- héroe -------- */}
        <section className="hero-grad vigia-hero fade-up">
          {/* Cóndor de fondo, traslúcido, detrás del texto. */}
          <img src={VIGIA_LOGO} alt="" aria-hidden="true" className="vigia-marca-agua" />
          <div className="hero-pill vigia-pill">
            <img src={VIGIA_LOGO} alt="" style={{ width: 18, height: 18, borderRadius: 4 }} /> Modo Vigía activado
          </div>
          <h1>Activaste el Modo Vigía, <span className="vigia-neon">Bienvenido.</span></h1>
          <p className="vigia-eslogan">
            Aprender necesita estar <strong>Rikchariy</strong> (¡Despierto!), es decir, con una conciencia
            abierta a lo nuevo, y esta plataforma tiene ese interés… Que el cóndor te inspire a despertar
            conciencias apagadas por el entretenimiento sin sentido.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <button className="btn btn-lg vigia-btn-crear" onClick={crear}>
              <Icon name="mas" size={17} /> Crear Activaciones
            </button>
          </div>
        </section>

        {/* -------- estadísticas -------- */}
        <div className="stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card vigia-stat">
              <div className="stat-ico vigia-stat-ico" aria-hidden="true"><Icon name={s.icon} size={22} /></div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* -------- listado -------- */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '40px 0 18px', flexWrap: 'wrap' }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, flex: 1 }}>Mis activaciones</h2>
          {/* Traer una activación (con su documento) desde un .vigia.zip de otro computador. */}
          <BotonImportarRespaldo existentes={activaciones} onImportado={onImportar} onAviso={avisar} />
        </div>
        <div className="pres-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(262px, 1fr))', gap: 18 }}>
          <button className="create-card vigia-create" onClick={crear}>
            <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
            Crear Activaciones
          </button>
          {!docs.length && (
            <div className="vigia-vacio">
              <span style={{ color: 'var(--vigia-azul)' }}><Icon name="eye" size={36} /></span>
              <strong>Aún no tienes activaciones</strong>
              <span>Cuando crees la primera, aparecerá aquí lista para despertar a tu grupo.</span>
            </div>
          )}
          {docs.map((d) => {
            const r = VigiaTipos.recurso(d.recurso);
            const n = (d.activaciones || []).length;
            const vid = d.recurso === 'video' || !d.recurso ? d.video && d.video.id : null;
            // Fondo de la tarjeta: miniatura del video o imagen del podcast.
            const fondo = vid ? 'https://img.youtube.com/vi/' + vid + '/mqdefault.jpg'
              : d.recurso === 'podcast' ? imagenPodcast(d.podcast)
              : d.recurso === 'imagenes' && d.galeria ? urlImagen(((d.galeria.diapos || []).find((x) => x.url) || {}).url || '') : '';
            const listo = VigiaTipos.recursoListo(d);
            return (
              <div key={d.id} className="pres-card2 vg-card">
                <div className="pres-card2-head vg-card-head" style={fondo ? { backgroundImage: 'url(' + JSON.stringify(fondo) + ')' } : null}>
                  {!fondo && <Icon name={r.icon} size={40} />}
                  <span className="vg-card-recurso"><Icon name={r.icon} size={13} /> {r.nombre}</span>
                  <button className="del-btn" title="Eliminar activación" onClick={() => onEliminar(d.id)}>✕</button>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>{d.titulo || 'Sin nombre'}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, flex: 1 }}>{d.objetivo || (listo ? (d.recurso === 'documento' && d.pdf ? d.pdf.nombre : '') : (d.recurso === 'documento' ? 'Falta añadir el PDF.' : d.recurso === 'podcast' ? 'Falta añadir el audio.' : d.recurso === 'imagenes' ? 'Falta añadir las imágenes.' : 'Falta añadir el video.'))}</p>
                  <div className="vg-card-tipos">
                    {VigiaTipos.TIPOS.map((t) => {
                      const c = (d.activaciones || []).filter((x) => x.tipo === t.id).length;
                      return c ? <span key={t.id} style={{ borderColor: t.color + '88', color: t.color }} title={t.nombre}><Icon name={t.icon} size={12} /> {c}</span> : null;
                    })}
                    {!n && <span style={{ color: 'var(--muted)' }}>Sin activaciones aún</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onAbrir(d.id)}>Editar</button>
                    <button className="btn btn-sm vigia-btn-crear" style={{ flex: 1, justifyContent: 'center' }} disabled={!listo}
                      onClick={() => onPresentar(d.id)}><Icon name="play" size={13} /> Presentar</button>
                    <BotonRespaldo act={d} compacto />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {eligiendo && (
        <ElegirRecurso onCerrar={() => setEligiendo(false)}
          onElegir={(rid) => { setEligiendo(false); onCrear(rid); }} />
      )}
      {aviso && <div className="vigia-aviso" role="status">{aviso}</div>}
    </div>
  );
}

Object.assign(window, { VigiaCarga, VigiaDashboard, ElegirRecurso, VIGIA_LOGO, cargarVigia });
