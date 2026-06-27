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

function Dashboard({ profile, presentations, onCreate, onOpen, onPresent, onDelete, onLogout, theme, setTheme, variant }) {
  const [q, setQ] = React.useState('');
  const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtered = presentations.filter((p) =>
    norm(p.tema + ' ' + p.materia + ' ' + p.objetivo).includes(norm(q)))
    // Orden de historial: las presentadas más recientemente primero;
    // las que nunca se han presentado quedan al final.
    .slice()
    .sort((a, b) => (b.lastPresented || 0) - (a.lastPresented || 0));

  const totalPlantillas = presentations.reduce((a, p) => a + p.slides.length, 0);
  const totalActs = presentations.reduce((a, p) => a + p.slides.filter((s) => s.type === 'actividad').length, 0);
  const totalUsos = presentations.reduce((a, p) => a + p.usos, 0);

  const stats = [
    { label: 'Presentaciones creadas', value: presentations.length, color: '#11F555', icon: 'memorama' },
    { label: 'Plantillas totales', value: totalPlantillas, color: '#F53711', icon: 'sopa' },
    { label: 'Actividades interactivas', value: totalActs, color: '#116CF5', icon: 'rayo' },
    { label: 'Veces presentadas', value: totalUsos, color: '#000000', icon: 'play' },
  ];

  return (
    <div data-screen-label="Inicio">
      {/* -------- barra de navegación superior -------- */}
      <header className="topnav">
        <Logo size={24} />
        <nav style={{ display: 'flex', gap: 4, marginLeft: 18, flex: 1 }}>
          <button className="navlink active">Mis presentaciones</button>
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
          <Sparkle size={120} style={{ position: 'absolute', top: 26, right: 120, color: '#F53711', opacity: .85, zIndex: 0 }} />
          <Sparkle size={56} style={{ position: 'absolute', top: 120, right: 60, color: '#FF8A66', opacity: .8, zIndex: 0 }} />
          <Sparkle size={34} style={{ position: 'absolute', top: 30, right: 280, color: '#11F555', opacity: .9, zIndex: 0 }} />
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

Object.assign(window, { Dashboard, inkFor });