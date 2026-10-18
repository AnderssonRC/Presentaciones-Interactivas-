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
const VIGIA_LOGO = 'condor-vigia-icono.png';

// Módulos del Modo Vigía, en orden. Al editar uno, sube su versión aquí
// (y la de este archivo en index.html) para que el navegador no use la vieja.
const VIGIA_MODULOS = [
  ['js/vigia/tipos.js', '20261019b'],
  ['js/vigia/youtube.jsx', '20261018a'],
  ['js/vigia/drive.jsx', '20261019b'],
  ['js/vigia/pdf.jsx', '20261019d'],
  ['js/vigia/ruleta.jsx', '20261018c'],
  ['js/vigia/editor.jsx', '20261019c'],
  ['js/vigia/editor-pdf.jsx', '20261019c'],
  ['js/vigia/presentar.jsx', '20261019a'],
  ['js/vigia/presentar-pdf.jsx', '20261019d'],
];
const VIGIA_ESTILOS = ['js/vigia/estilos.css', '20261019d'];
let promesaVigia = null;
function cargarEstilosVigia() {
  if (document.getElementById('vigia-estilos')) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const l = document.createElement('link');
    l.id = 'vigia-estilos'; l.rel = 'stylesheet'; l.href = VIGIA_ESTILOS[0] + '?v=' + VIGIA_ESTILOS[1];
    l.onload = () => resolve();
    l.onerror = () => { l.remove(); reject(new Error('No se pudo cargar ' + VIGIA_ESTILOS[0])); };
    document.head.appendChild(l);
  });
}
function cargarVigia() {
  if (!promesaVigia) {
    promesaVigia = cargarEstilosVigia()
      .then(() => VIGIA_MODULOS.reduce((cadena, [url, v]) => cadena.then(() => Actividades.ejecutarJSX(url + '?v=' + v)), Promise.resolve()))
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

function VigiaDashboard({ profile, esAdmin, onAdmin, onLogout, onSalir, activaciones, onCrear, onAbrir, onPresentar, onEliminar }) {
  const [eligiendo, setEligiendo] = React.useState(false);
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
        <UserMenu profile={profile} esAdmin={esAdmin} onAdmin={onAdmin} onLogout={onLogout} sinTema />
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
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '40px 0 18px' }}>Mis activaciones</h2>
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
            const vid = d.recurso !== 'documento' && d.video && d.video.id;
            const listo = VigiaTipos.recursoListo(d);
            return (
              <div key={d.id} className="pres-card2 vg-card">
                <div className="pres-card2-head vg-card-head" style={vid ? { backgroundImage: 'url(https://img.youtube.com/vi/' + vid + '/mqdefault.jpg)' } : null}>
                  {!vid && <Icon name={r.icon} size={40} />}
                  <span className="vg-card-recurso"><Icon name={r.icon} size={13} /> {r.nombre}</span>
                  <button className="del-btn" title="Eliminar activación" onClick={() => onEliminar(d.id)}>✕</button>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800 }}>{d.titulo || 'Sin nombre'}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, flex: 1 }}>{d.objetivo || (listo ? (d.recurso === 'documento' && d.pdf ? d.pdf.nombre : '') : (d.recurso === 'documento' ? 'Falta añadir el PDF.' : 'Falta añadir el video.'))}</p>
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
    </div>
  );
}

Object.assign(window, { VigiaCarga, VigiaDashboard, ElegirRecurso, VIGIA_LOGO, cargarVigia });
