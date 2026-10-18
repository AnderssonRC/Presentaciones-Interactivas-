/* App raíz: sesión (Firebase Auth), navegación, tema día/tonos, tweaks */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "pantallaPrincipal": "Tarjetas",
  "acento": "#F53711",
  "fuente": "Sora"
}/*EDITMODE-END*/;

const ACENTO_TEXT = { '#F53711': '#FFFFFF', '#11F555': '#06140A', '#116CF5': '#FFFFFF' };

/* Ícono y título de la pestaña según el modo. En Modo Vigía se usa el logo
   del cóndor; al salir se restauran los íconos originales de index.html. */
const TITULO_BASE = document.title;
function usarIconoPestana(vigia) {
  document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]').forEach((l) => {
    if (!l.dataset.original) l.dataset.original = l.getAttribute('href');
    // Versión recortada: en la pestaña el cóndor llena el cuadro.
    const icono = l.rel === 'apple-touch-icon' ? 'condor-vigia-icono.png' : 'condor-vigia-64.png';
    l.setAttribute('href', vigia ? icono : l.dataset.original);
    if (l.hasAttribute('type')) l.setAttribute('type', 'image/png');
    if (!vigia && l.dataset.original.endsWith('.ico')) l.removeAttribute('type');
  });
  document.title = vigia ? 'Modo Vigía — Actividades Interactivas' : TITULO_BASE;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Tema de toda la app: 'tonos' (oscuro, por defecto) o 'dia' (claro, "Modo Día").
  const [theme, setThemeState] = React.useState(() => localStorage.getItem('aip_theme') || 'tonos');

  const [authReady, setAuthReady] = React.useState(false); // ¿ya respondió Firebase Auth?
  const [user, setUser] = React.useState(null);            // usuario de Firebase o null
  const [loadingData, setLoadingData] = React.useState(false);
  const [presentations, setPresentations] = React.useState([]);
  const [editingId, setEditingId] = React.useState(null);
  const [presentingId, setPresentingId] = React.useState(null);
  const [acceso, setAcceso] = React.useState(null);      // null = verificando
  const [adminOpen, setAdminOpen] = React.useState(false);
  // Interfaz activa: 'interactivas' (la de siempre) o 'vigia' (Modo Vigía,
  // js/vigia.jsx). Se recuerda en este navegador. `vigiaCargando` muestra la
  // pantalla de carga del cóndor un momento al activarlo.
  const [modo, setModoState] = React.useState(() => localStorage.getItem('aip_modo') === 'vigia' ? 'vigia' : 'interactivas');
  const [vigiaCargando, setVigiaCargando] = React.useState(() => localStorage.getItem('aip_modo') === 'vigia');
  const setModo = (m) => {
    setModoState(m);
    try { localStorage.setItem('aip_modo', m); } catch (e) { /* sin almacenamiento: solo esta sesión */ }
    if (m === 'vigia') setVigiaCargando(true);
  };
  React.useEffect(() => {
    if (!vigiaCargando) return;
    const t = setTimeout(() => setVigiaCargando(false), 1600);
    return () => clearTimeout(t);
  }, [vigiaCargando]);
  // Módulos del Modo Vigía (editor, presentar…): se cargan bajo demanda la
  // primera vez que se entra al modo, mientras se ve la animación del cóndor.
  const [vigiaListo, setVigiaListo] = React.useState(false);
  const [vigiaError, setVigiaError] = React.useState(null);
  const [vigiaIntento, setVigiaIntento] = React.useState(0);
  React.useEffect(() => {
    if (modo !== 'vigia' || !user || vigiaListo) return;
    let vivo = true;
    setVigiaError(null);
    cargarVigia().then(() => { if (vivo) setVigiaListo(true); }).catch((e) => { if (vivo) setVigiaError(e); });
    return () => { vivo = false; };
  }, [modo, user, vigiaListo, vigiaIntento]);

  const setTheme = (v) => { setThemeState(v); localStorage.setItem('aip_theme', v); };

  // Variables de tema
  React.useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.setProperty('--acento', t.acento);
    root.style.setProperty('--acento-text', ACENTO_TEXT[t.acento] || '#FFFFFF');
    root.style.setProperty('--font-display', "'" + t.fuente + "', sans-serif");
  }, [theme, t.acento, t.fuente]);

  // Ícono/título de la pestaña: cóndor solo con sesión y en Modo Vigía.
  React.useEffect(() => { usarIconoPestana(!!user && modo === 'vigia'); }, [user, modo]);

  // Suscripción al estado de autenticación
  React.useEffect(() => {
    const unsub = AIP.onAuth((u) => {
      setUser(u || null);
      setAuthReady(true);
      if (!u) { setPresentations([]); setEditingId(null); setPresentingId(null); }
    });
    return unsub;
  }, []);

  // Verifica la solicitud de acceso del usuario actual.
React.useEffect(() => {
  let activo = true;
  if (!user) { setAcceso(null); setAdminOpen(false); return; }
  AIP.miEstadoAcceso()
    .then((e) => { if (activo) setAcceso(e); })
    // Si la consulta falla, no bloqueamos la app: las reglas de Firestore
    // son la verdadera barrera de seguridad.
    .catch(() => { if (activo) setAcceso('aprobado'); });
  return () => { activo = false; };
}, [user]);

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

  // `modo`: 'normal' | 'equipos' (botón "Modo Equipos" del Dashboard). En
  // modo equipos se crea ya con los dos equipos por defecto, los mismos que
  // usa el editor (editor.jsx) cuando la presentación aún no tiene equipos.
  const createPres = (modo) => {
    const colors = ['#11F555', '#F53711', '#116CF5'];
    const nueva = {
      id: AIP.uid(), tema: 'Nueva presentación', materia: 'Mi materia',
      objetivo: 'Escribe aquí el objetivo de aprendizaje.',
      color: colors[presentations.length % colors.length], usos: 0,
      slides: [{ id: AIP.uid(), type: 'contenido', titulo: 'Mi primera plantilla', texto: 'Haz clic aquí para escribir el contenido.', imagen: { tipo: 'url', valor: '' } }],
    };
    if (modo === 'equipos') {
      nueva.tema = 'Nueva presentación por equipos';
      nueva.modo = 'equipos';
      nueva.equipos = [{ name: 'Equipo Verde', color: '#11F555' }, { name: 'Equipo Naranja', color: '#F53711' }];
    }
    persist(nueva);
    setEditingId(nueva.id);
  };

  /* Activación del Modo Vigía. Se guarda en la misma colección que las
     presentaciones (así funciona con las reglas de Firestore actuales),
     marcada con clase 'vigia' para separarla de las presentaciones. */
  const createActivacion = (recurso) => {
    const nueva = {
      id: AIP.uid(), clase: 'vigia', recurso: recurso || 'video',
      titulo: 'Nueva activación', objetivo: '', usos: 0,
      estudiantes: [], activaciones: [],
    };
    // Cada recurso guarda su origen: el video de YouTube o el PDF.
    if (nueva.recurso === 'documento') nueva.pdf = { url: '', nombre: '', local: false };
    else nueva.video = { url: '', id: '' };
    persist(nueva);
    setEditingId(nueva.id);
  };

  const changePres = (next) => persist(next);

  const deletePres = (id) => {
    const esVigia = presentations.some((p) => p.id === id && p.clase === 'vigia');
    if (window.confirm(esVigia
      ? '¿Eliminar esta activación? Esta acción no se puede deshacer.'
      : '¿Eliminar esta presentación? Esta acción no se puede deshacer.')) {
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      AIP.deletePresentation(id).catch((e) => console.error('No se pudo eliminar:', e));
      // Documento guardado en este computador para esa activación: también se borra.
      if (esVigia && window.borrarCopiaLocal) window.borrarCopiaLocal(id);
    }
  };

  const present = (id) => {
    const target = presentations.find((p) => p.id === id);
    if (target) persist({ ...target, usos: (target.usos || 0) + 1, lastPresented: Date.now() });
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
        <ResCogitasFooter />
        <AppTweaks t={t} setTweak={setTweak} />
      </React.Fragment>
    );
  }
  
  // Con sesión, pero acceso aún verificándose o no aprobado
if (acceso === null) {
  return (
    <React.Fragment>
      <LoadingScreen mensaje="Verificando tu acceso…" />
      <AppTweaks t={t} setTweak={setTweak} />
    </React.Fragment>
  );
}
if (acceso !== 'aprobado') {
  return (
    <React.Fragment>
      <PantallaAccesoPendiente estado={acceso} onLogout={logout} />
      <ResCogitasFooter />
      <AppTweaks t={t} setTweak={setTweak} />
    </React.Fragment>
  );
}
// Panel de administración (solo admin)
if (adminOpen && AIP.esAdmin()) {
  return (
    <React.Fragment>
      <AdminPanel onBack={() => setAdminOpen(false)} />
      <ResCogitasFooter />
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

  const profile = { nombre: user.displayName || (user.email ? user.email.split('@')[0] : 'Docente'), email: user.email || '', color: '#11F555' };
  const editing = presentations.find((p) => p.id === editingId);
  const presenting = presentations.find((p) => p.id === presentingId);

  // Presentaciones y activaciones (Modo Vigía) comparten la colección; se separan aquí.
  const presentaciones = presentations.filter((p) => p.clase !== 'vigia');
  const activaciones = presentations.filter((p) => p.clase === 'vigia');
  const esVigia = (p) => !!p && p.clase === 'vigia';

  // Modo Vigía: interfaz aparte (js/vigia.jsx), con su carga del cóndor.
  if (modo === 'vigia' && (!editing || esVigia(editing)) && (!presenting || esVigia(presenting))) {
    if (vigiaCargando || !vigiaListo) {
      return (
        <React.Fragment>
          <VigiaCarga error={!vigiaCargando && vigiaError} onReintentar={() => setVigiaIntento((n) => n + 1)} />
          <AppTweaks t={t} setTweak={setTweak} />
        </React.Fragment>
      );
    }
    if (presenting) {
      return <VigiaPresentar act={presenting} onExit={() => setPresentingId(null)} onChange={changePres} />;
    }
    return (
      <React.Fragment>
        {editing ? (
          <VigiaEditor act={editing} onChange={changePres} onBack={() => setEditingId(null)}
            onPresent={() => present(editing.id)} />
        ) : (
          <VigiaDashboard profile={profile} esAdmin={AIP.esAdmin()} onAdmin={() => setAdminOpen(true)}
            onLogout={logout} onSalir={() => setModo('interactivas')}
            activaciones={activaciones} onCrear={createActivacion} onAbrir={setEditingId}
            onPresentar={present} onEliminar={deletePres} onImportar={persist} />
        )}
        <ResCogitasFooter />
        <AppTweaks t={t} setTweak={setTweak} />
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {presenting ? (
        /* Durante Presentar NO montamos el Dashboard/Editor detrás: al quedar
           en el flujo del documento, su altura generaba el scroll del body y
           asomaba la barra blanca del navegador por el borde. El Presenter es
           pantalla completa, así que es lo único que debe existir. */
        <Presenter pres={presenting} onExit={() => setPresentingId(null)} onChange={changePres} />
      ) : (
        <React.Fragment>
          {editing ? (
            <Editor pres={editing} onChange={changePres} onBack={() => setEditingId(null)}
              onPresent={() => present(editing.id)} theme={theme} setTheme={setTheme} />
          ) : (
            <Dashboard profile={profile} presentations={presentaciones} variant={t.pantallaPrincipal}
            esAdmin={AIP.esAdmin()} onAdmin={() => setAdminOpen(true)} onVigia={() => setModo('vigia')}
              onCreate={createPres} onOpen={setEditingId} onPresent={present} onDelete={deletePres} onLogout={logout}
              theme={theme} setTheme={setTheme} />
          )}
          <ResCogitasFooter />
        </React.Fragment>
      )}
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