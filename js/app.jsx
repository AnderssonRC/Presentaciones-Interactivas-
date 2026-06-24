/* App raíz: sesión (Firebase Auth), navegación, tema día/tonos, tweaks */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pantallaPrincipal": "Tarjetas",
  "acento": "#F53711",
  "fuente": "Sora"
}/*EDITMODE-END*/;

const ACENTO_TEXT = { '#F53711': '#FFFFFF', '#11F555': '#06140A', '#116CF5': '#FFFFFF' };

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [theme, setThemeState] = React.useState(() => localStorage.getItem('aip_theme') || 'dia');

  const [authReady, setAuthReady] = React.useState(false); // ¿ya respondió Firebase Auth?
  const [user, setUser] = React.useState(null);            // usuario de Firebase o null
  const [loadingData, setLoadingData] = React.useState(false);
  const [presentations, setPresentations] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [presentingId, setPresentingId] = React.useState(null);

  const setTheme = (v) => { setThemeState(v); localStorage.setItem('aip_theme', v); };

  // Variables de tema
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty('--acento', t.acento);
    root.style.setProperty('--acento-text', ACENTO_TEXT[t.acento] || '#FFFFFF');
    root.style.setProperty('--font-display', "'" + t.fuente + "', sans-serif");
  }, [theme, t.acento, t.fuente]);

  // Suscripción al estado de autenticación
  React.useEffect(() => {
    const unsub = AIP.onAuth((u) => {
      setUser(u || null);
      setAuthReady(true);
      if (!u) { setPresentations([]); setEditingId(null); setPresentingId(null); }
    });
    return unsub;
  }, []);

  // Cuando hay usuario, carga sus presentaciones
  React.useEffect(() => {
    let activo = true;
    if (user) {
      setLoadingData(true);
      AIP.loadPresentations()
        .then((list) => { if (activo) setPresentations(list); })
        .catch((e) => { console.error(e); if (activo) setPresentations([]); })
        .finally(() => { if (activo) setLoadingData(false); });
    }
    return () => { activo = false; };
  }, [user]);

  // Guarda una presentación concreta (crear o actualizar) en Firestore + estado local
  const persist = (pres) => {
    setPresentations((prev) => {
      const exists = prev.some((p) => p.id === pres.id);
      return exists ? prev.map((p) => (p.id === pres.id ? pres : p)) : [pres, ...prev];
    });
    AIP.savePresentation(pres).catch((e) => console.error('No se pudo guardar:', e));
  };

  const createPres = () => {
    const colors = ['#11F555', '#F53711', '#116CF5'];
    const nueva = {
      id: AIP.uid(), tema: 'Nueva presentación', materia: 'Mi materia',
      objetivo: 'Escribe aquí el objetivo de aprendizaje.',
      color: colors[presentations.length % colors.length], usos: 0,
      slides: [{ id: AIP.uid(), type: 'contenido', titulo: 'Mi primera plantilla', texto: 'Haz clic aquí para escribir el contenido.', imagen: { tipo: 'url', valor: '' } }],
    };
    persist(nueva);
    setEditingId(nueva.id);
  };

  const changePres = (next) => persist(next);

  const deletePres = (id) => {
    if (window.confirm('¿Eliminar esta presentación? Esta acción no se puede deshacer.')) {
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      AIP.deletePresentation(id).catch((e) => console.error('No se pudo eliminar:', e));
    }
  };

  const present = (id) => {
    const target = presentations.find((p) => p.id === id);
    if (target) persist({ ...target, usos: (target.usos || 0) + 1 });
    setPresentingId(id);
  };

  const logout = () => { AIP.signOut(); };

  // ----- Render -----

  // Esperando a Firebase Auth (primer arranque)
  if (!authReady) {
    return (
      <React.Fragment>
        <LoadingScreen mensaje="Cargando…" />
        <AppTweaks t={t} setTweak={setTweak} />
      </React.Fragment>
    );
  }

  // Sin sesión -> login
  if (!user) {
    return (
      <React.Fragment>
        <LoginScreen onAuthed={() => { /* onAuth se encarga del resto */ }} />
        <AppTweaks t={t} setTweak={setTweak} />
      </React.Fragment>
    );
  }

  // Con sesión pero aún cargando datos
  if (loadingData) {
    return (
      <React.Fragment>
        <LoadingScreen mensaje="Cargando tus presentaciones…" />
        <AppTweaks t={t} setTweak={setTweak} />
      </React.Fragment>
    );
  }

  const profile = { nombre: user.displayName || (user.email ? user.email.split('@')[0] : 'Docente'), color: '#11F555' };
  const editing = presentations.find((p) => p.id === editingId);
  const presenting = presentations.find((p) => p.id === presentingId);

  return (
    <React.Fragment>
      {editing ? (
        <Editor pres={editing} onChange={changePres} onBack={() => setEditingId(null)}
          onPresent={() => present(editing.id)} theme={theme} setTheme={setTheme} />
      ) : (
        <Dashboard profile={profile} presentations={presentations} variant={t.pantallaPrincipal}
          onCreate={createPres} onOpen={setEditingId} onPresent={present} onDelete={deletePres} onLogout={logout}
          theme={theme} setTheme={setTheme} />
      )}
      {presenting && <Presenter pres={presenting} onExit={() => setPresentingId(null)} />}
      <AppTweaks t={t} setTweak={setTweak} />
    </React.Fragment>
  );
}

function LoadingScreen({ mensaje }) {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--bg, #0B0E0B)' }}>
      <div style={{ textAlign: 'center', color: '#9AA396' }}>
        <div className="aip-spinner" style={{
          width: 44, height: 44, margin: '0 auto 18px', borderRadius: '50%',
          border: '4px solid rgba(154,163,150,.25)', borderTopColor: '#11F555',
          animation: 'aip-spin 0.9s linear infinite',
        }}></div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{mensaje}</div>
      </div>
    </div>
  );
}

function AppTweaks({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="Pantalla principal" />
      <TweakRadio label="Variante" value={t.pantallaPrincipal}
        options={['Tarjetas', 'Editorial']}
        onChange={(v) => setTweak('pantallaPrincipal', v)} />
      <TweakSection label="Estilo" />
      <TweakColor label="Color de acción" value={t.acento}
        options={['#F53711', '#11F555', '#116CF5']}
        onChange={(v) => setTweak('acento', v)} />
      <TweakRadio label="Tipografía" value={t.fuente}
        options={['Sora', 'Space Grotesk']}
        onChange={(v) => setTweak('fuente', v)} />
    </TweaksPanel>
  );
}

/* Si la URL trae ?remote=CÓDIGO, este dispositivo es el control remoto
   (el celular del docente), no la app principal. */
function Root() {
  const remoteCode = new URLSearchParams(location.search).get('remote');
  React.useEffect(() => {
    if (remoteCode) {
      // El control remoto no monta <App>, así que fijamos aquí las
      // variables de tema que usan los estilos.
      const root = document.documentElement;
      root.dataset.theme = 'noche';
      root.style.setProperty('--font-display', "'Sora', sans-serif");
      root.style.setProperty('--acento', '#11F555');
      root.style.setProperty('--acento-text', '#06140A');
    }
  }, [remoteCode]);
  if (remoteCode) return <RemoteControl initialCode={remoteCode} />;
  return <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
