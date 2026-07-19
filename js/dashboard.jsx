/* Dashboard — estilo vibrante: navbar superior, hero con degradado, estadísticas y tarjetas de color */
function inkFor(hex) {
  return { '#11F555': 'var(--verde-ink)', '#F53711': 'var(--naranja-ink)', '#116CF5': 'var(--azul-ink)' }[hex] || 'var(--ink)';
}
function inkOn(hex) { return hex === '#11F555' ? '#08120B' : '#FFFFFF'; }

/* Devuelve un texto tipo "hace 3 días" a partir de un timestamp (ms). */
function tiempoRelativo(ts) {
  if (!ts) return null;
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return 'hace un momento';
  const m = Math.floor(s / 60);
  if (m < 60) return 'hace ' + m + (m === 1 ? ' minuto' : ' minutos');
  const h = Math.floor(m / 60);
  if (h < 24) return 'hace ' + h + (h === 1 ? ' hora' : ' horas');
  const d = Math.floor(h / 24);
  if (d < 7) return 'hace ' + d + (d === 1 ? ' día' : ' días');
  const sem = Math.floor(d / 7);
  if (d < 30) return 'hace ' + sem + (sem === 1 ? ' semana' : ' semanas');
  const meses = Math.floor(d / 30);
  if (d < 365) return 'hace ' + meses + (meses === 1 ? ' mes' : ' meses');
  const años = Math.floor(d / 365);
  return 'hace ' + años + (años === 1 ? ' año' : ' años');
}

function PresCardMeta({ p }) {
  const acts = p.slides.filter((s) => s.type === 'actividad').length;
  // Última vez presentada: usa lastPresented; si no existe (presentaciones
  // antiguas), no muestra fecha en vez de inventar una.
  const cuando = tiempoRelativo(p.lastPresented);
  const usos = p.usos || 0;
  return (
    <div>
      <div className="pres-meta">
        <span><strong>{p.slides.length}</strong> plantillas</span>
        <span><strong>{acts}</strong> actividades</span>
        <span><strong>{usos}</strong> {usos === 1 ? 'vez' : 'veces'}</span>
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4 }}>
        {cuando ? ('Última vez: ' + cuando) : 'Sin presentar aún'}
      </div>
    </div>
  );
}

function Sparkle({ size, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={style} aria-hidden="true">
      <path d="M12 1.5c.9 5.4 4.1 8.6 10.5 10.5C16.1 13.9 12.9 17.1 12 22.5 11.1 17.1 7.9 13.9 1.5 12 7.9 10.1 11.1 6.9 12 1.5z" />
    </svg>
  );
}

function presIcon(p) {
  const act = p.slides.find((s) => s.type === 'actividad');
  return act ? AIP.toolById(act.tool).icon : 'tv';
}

function Dashboard({ profile, presentations, onCreate, onOpen, onPresent, onDelete, onLogout, theme, setTheme, variant, esAdmin, onAdmin }) {  const [q, setQ] = React.useState('');
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = presentations.filter((p) =>
    norm(p.tema + ' ' + p.materia + ' ' + p.objetivo).includes(norm(q)))
    // Orden de historial: las presentadas más recientemente primero;
    // las que nunca se han presentado quedan al final.
    .slice()
    .sort((a, b) => (b.lastPresented || 0) - (a.lastPresented || 0));

  const totalPlantillas = presentations.reduce((a, p) => a + p.slides.length, 0);
  const totalActs = presentations.reduce((a, p) => a + p.slides.filter((s) => s.type === 'actividad').length, 0);
  const totalUsos = presentations.reduce((a, p) => a + (p.usos || 0), 0);

  const stats = [
    { label: 'Presentaciones creadas', value: presentations.length, color: '#11F555', icon: 'memorama' },
    { label: 'Plantillas totales', value: totalPlantillas, color: '#16A34A', icon: 'sopa' },
    { label: 'Actividades interactivas', value: totalActs, color: '#0D9488', icon: 'rayo' },
    { label: 'Veces presentadas', value: totalUsos, color: '#000000', icon: 'play' },
  ];

  return (
    <div data-screen-label="Inicio">
      {/* -------- barra de navegación superior -------- */}
      <header className="topnav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <img src="logo-192.png" alt="Actividades Interactivas"
          style={{ height: 38, width: 38, borderRadius: 10, objectFit: 'contain' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16.5, lineHeight: 1.05 }}>
               Actividades<br />Interactivas
</span>
</div>
        <nav style={{ display: 'flex', gap: 4, marginLeft: 18, flex: 1 }}>
          <button className="navlink active">Mis presentaciones</button>
          {esAdmin && <button className="navlink" onClick={onAdmin}>Administración</button>}
        </nav>
        <ThemeToggle theme={theme} setTheme={setTheme} />
        <button className="btn btn-primary" onClick={() => onCreate("normal")} style={{ borderRadius: 999 }}>
          <Icon name="mas" size={16} /> Crear nueva Presentación
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 6 }}>
          <div className="profile-avatar" style={{ width: 38, height: 38, fontSize: 16, background: profile.color }} title={profile.nombre}>
            {profile.nombre.charAt(0).toUpperCase()}
          </div>
          <button className="icon-btn" onClick={onLogout} title="Cambiar de perfil" style={{ borderRadius: 999 }}><Icon name="salir" size={15} /></button>
        </div>
      </header>

      <main className="main-wrap">
        {/* -------- hero con degradado -------- */}
        <section className="hero-grad fade-up">
            <Sparkle size={120} style={{ position: 'absolute', top: 26, right: 120, color: '#2FC46B', opacity: .55, zIndex: 0 }} />
            <Sparkle size={56} style={{ position: 'absolute', top: 120, right: 60, color: '#7FE8A8', opacity: .6, zIndex: 0 }} />
            <Sparkle size={34} style={{ position: 'absolute', top: 30, right: 280, color: '#CDF5DC', opacity: .7, zIndex: 0 }} />
          <div className="hero-pill"><Icon name="memorama" size={14} /> {presentations.length} presentaciones en tu biblioteca</div>
          <h1>¡Hola, {profile.nombre}!</h1>
          <p style={{ maxWidth: '36em', margin: '12px 0 0', fontSize: 16, color: 'rgba(255,255,255,.92)' }}>
            Bienvenido a la plataforma de Presentaciones Didácticas e Interactivas para Docentes
            con solo un televisor o video beam.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
            <button className="btn btn-lg btn-white" onClick={() => onCreate('normal')}><Icon name="mas" size={17} /> Crear nueva Presentación</button>
            <button className="btn btn-lg btn-glass" onClick={() => onCreate('equipos')}><Icon name="trofeo" size={17} /> Modo Equipos</button>
            {presentations.length > 0 && (
              <button className="btn btn-lg btn-glass" onClick={() => onPresent(presentations[0].id)}>
                <Icon name="play" size={16} /> Presentar la más reciente
              </button>
            )}
          </div>
        </section>

        {/* -------- estadísticas -------- */}
        <div className="stat-grid">
          {stats.map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-ico" style={{ background: s.color, color: s.color === '#11F555' ? '#08120B' : s.color === '#000000' ? '#11F555' : '#fff' }}>
                <Icon name={s.icon} size={22} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* -------- listado -------- */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '40px 0 18px', gap: 18 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800 }}>Mis presentaciones</h2>
          <label className="search-input">
            <Icon name="sopa" size={15} />
            <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar presentación…" />
          </label>
        </div>

        {variant === 'Editorial' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((p) => (
              <div key={p.id} className="pres-row">
                <div style={{ alignSelf: 'stretch', background: p.color }}></div>
                <div style={{ paddingLeft: 16 }}>
                  <div className="kicker" style={{ color: inkFor(p.color), fontSize: 10.5 }}>{p.materia}</div>
                  <h3 style={{ fontSize: 19, fontWeight: 800, marginTop: 3 }}>{p.tema}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 14 }}>{p.objetivo}</p>
                <PresCardMeta p={p} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => onOpen(p.id)}>Editar</button>
                  <button className="btn btn-sm btn-primary" onClick={() => onPresent(p.id)}><Icon name="play" size={13} /> Presentar</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="pres-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(262px, 1fr))', gap: 18 }}>
            <button className="create-card" onClick={() => onCreate("normal")}>
              <span style={{ width: 52, height: 52, borderRadius: 16, display: 'grid', placeItems: 'center', background: 'var(--surface2)' }}>
                <Icon name="mas" size={24} />
              </span>
              Crear nueva Presentación
            </button>
            {filtered.map((p) => (
              <div key={p.id} className="pres-card2">
                <div className="pres-card2-head" style={{ background: p.color, color: inkOn(p.color) }}>
                  <Icon name={presIcon(p)} size={44} />
                  <button className="del-btn" title="Eliminar presentación" onClick={() => onDelete(p.id)}>✕</button>
                </div>
                <div style={{ padding: '16px 18px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  <div className="kicker" style={{ color: inkFor(p.color), fontSize: 10.5 }}>{p.materia}</div>
                  <h3 style={{ fontSize: 18.5, fontWeight: 800 }}>{p.tema}</h3>
                  <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13.5, flex: 1 }}>{p.objetivo}</p>
                  <PresCardMeta p={p} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    <button className="btn btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onOpen(p.id)}>Editar</button>
                    <button className="btn btn-sm btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={() => onPresent(p.id)}>
                      <Icon name="play" size={13} /> Presentar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {filtered.length === 0 && q && (
          <p style={{ color: 'var(--muted)', textAlign: 'center', marginTop: 30 }}>No se encontraron presentaciones para "{q}".</p>
        )}
      </main>
    </div>
  );
}

Object.assign(window, { Dashboard, inkFor, PantallaAccesoPendiente, AdminPanel });
/* ---------- Pantalla de espera: solicitud pendiente o rechazada ---------- */
function PantallaAccesoPendiente({ estado, onLogout }) {
  const rechazado = estado === 'rechazado';
  return (
    <div style={{ minHeight: '100dvh', background: '#070907', color: '#F2F5EF', display: 'flex',
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '40px 26px 70px', gap: 16 }}>
      <Logo dark size={26} />
      <div style={{ width: 74, height: 74, borderRadius: 22, fontSize: 32, display: 'grid', placeItems: 'center', marginTop: 8,
        background: rechazado ? 'rgba(245,55,17,.12)' : 'rgba(17,245,85,.12)',
        border: '1px solid ' + (rechazado ? 'rgba(245,55,17,.4)' : 'rgba(17,245,85,.35)'),
        color: rechazado ? '#FF7A5C' : '#11F555' }}>
        {rechazado ? '✕' : '⏳'}
      </div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 26, maxWidth: '16em', lineHeight: 1.25 }}>
        {rechazado ? 'Tu solicitud no fue aprobada' : 'Tu solicitud está en revisión'}
      </h1>
      <p style={{ color: '#9AA396', fontSize: 15, lineHeight: 1.6, maxWidth: '26em', margin: 0 }}>
        {rechazado
          ? 'El administrador no aprobó el acceso con esta cuenta. Si crees que es un error, contáctalo directamente.'
          : 'Tu cuenta fue creada y espera la aprobación del administrador. Cuando te aprueben, al entrar verás tu biblioteca.'}
      </p>
      <button className="btn btn-lg" onClick={onLogout}
        style={{ background: '#11F555', color: '#06140A', borderColor: 'transparent', fontWeight: 700, marginTop: 8 }}>
        Cerrar sesión
      </button>
    </div>
  );
}

/* ---------- Panel de administración: gestiona solicitudes de acceso ---------- */
function AdminPanel({ onBack }) {
  const [lista, setLista] = React.useState(null);
  const [error, setError] = React.useState('');
  const cargar = () => {
    AIP.listarSolicitudes().then(setLista)
      .catch((e) => { console.error(e); setError('No se pudieron cargar las solicitudes.'); setLista([]); });
  };
  React.useEffect(cargar, []);
  const resolver = (uid, estado) => {
    AIP.resolverSolicitud(uid, estado).then(cargar)
      .catch((e) => { console.error(e); window.alert('No se pudo actualizar la solicitud.'); });
  };
  const pend = (lista || []).filter((s) => s.estado === 'pendiente');
  const resueltas = (lista || []).filter((s) => s.estado !== 'pendiente');

  const Fila = ({ s, acciones }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'var(--surface)',
      border: '1px solid var(--line)', borderRadius: 12, padding: '14px 18px' }}>
      <div className="profile-avatar" style={{ width: 38, height: 38, fontSize: 16,
        background: s.estado === 'rechazado' ? '#3A2620' : '#11F555',
        color: s.estado === 'rechazado' ? '#FF9B80' : '#08120B' }}>
        {(s.nombre || s.email || '?').charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700 }}>{s.nombre || '(sin nombre)'}</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {s.email} · {tiempoRelativo(s.creado) || 'fecha desconocida'}
        </div>
      </div>
      {acciones ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-sm" onClick={() => resolver(s.uid, 'rechazado')}>Rechazar</button>
          <button className="btn btn-sm btn-primary" onClick={() => resolver(s.uid, 'aprobado')}>Aprobar</button>
        </div>
      ) : (
        <span style={{ fontSize: 12.5, fontWeight: 700, padding: '5px 12px', borderRadius: 999,
          background: s.estado === 'aprobado' ? 'rgba(17,245,85,.14)' : 'rgba(245,55,17,.14)',
          color: s.estado === 'aprobado' ? 'var(--verde-ink)' : 'var(--naranja-ink)' }}>{s.estado}</span>
      )}
    </div>
  );

  return (
    <div data-screen-label="Inicio" style={{ minHeight: '100dvh' }}>
      <header className="topnav">
        <button className="btn btn-sm" onClick={onBack}>← Volver</button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, marginLeft: 8 }}>Administración</span>
      </header>
      <main className="main-wrap" style={{ maxWidth: 760 }}>
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '10px 0 16px' }}>
          Solicitudes pendientes {lista && <span style={{ color: 'var(--muted)', fontWeight: 600 }}>· {pend.length}</span>}
        </h2>
        {lista === null && <p style={{ color: 'var(--muted)' }}>Cargando solicitudes…</p>}
        {error && <p style={{ color: 'var(--naranja-ink)' }}>{error}</p>}
        {lista && pend.length === 0 && !error && (
          <p style={{ color: 'var(--muted)' }}>No hay solicitudes pendientes. 🎉</p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pend.map((s) => <Fila key={s.uid} s={s} acciones />)}
        </div>
        {resueltas.length > 0 && (
          <React.Fragment>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: '34px 0 14px', color: 'var(--muted)' }}>Historial</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {resueltas.map((s) => <Fila key={s.uid} s={s} />)}
            </div>
          </React.Fragment>
        )}
      </main>
    </div>
  );
}