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
    const t = setTimeout(() => setVigiaCargando(false), 800);   // mínimo visible de la carga (antes 1600 ms)
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
  const authPrevio = React.useRef({ respondio: false, user: null });
  React.useEffect(() => {
    const unsub = AIP.onAuth((u) => {
      // Pantalla de carga Res Cogitans (index.html): se recuerda si hay sesión
      // para mostrarla al recargar, y se muestra justo después de iniciar sesión.
      try { if (u) localStorage.setItem('rc_sesion', '1'); else localStorage.removeItem('rc_sesion'); } catch (e) { /* sin almacenamiento */ }
      if (u && authPrevio.current.respondio && !authPrevio.current.user && window.rcMostrarCarga) window.rcMostrarCarga();
      authPrevio.current = { respondio: true, user: u || null };
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

  /* ----- Guardado en Firestore, con pausa breve -----
     La pantalla se actualiza al instante, pero a Firestore solo se envía la
     ÚLTIMA versión tras 0,8 s sin cambios (antes: una escritura completa por
     cada tecla y por cada movimiento al arrastrar). Se guarda de inmediato al
     crear, al presentar, al salir del editor, al ocultar o cerrar la pestaña
     y antes de cerrar sesión. Si un guardado falla o tarda, se avisa. */
  const colaGuardado = React.useRef(new Map());   // id -> { pres, timer }: pendientes de enviar
  const ultimaVersion = React.useRef(new Map());  // id -> versión más reciente conocida
  const fallidas = React.useRef(new Set());       // ids cuyo último guardado falló
  const enVuelo = React.useRef(new Set());        // guardados enviados y aún sin confirmar
  const lentas = React.useRef(new Set());         // …que llevan más de 8 s sin confirmar
  const [avisoGuardado, setAvisoGuardado] = React.useState(null);   // null | 'fallo' | 'lento'
  const refrescarAviso = () => setAvisoGuardado(fallidas.current.size ? 'fallo' : (lentas.current.size ? 'lento' : null));

  const guardarYa = (id) => {
    const e = colaGuardado.current.get(id);
    if (!e) return Promise.resolve();
    clearTimeout(e.timer);
    colaGuardado.current.delete(id);
    fallidas.current.delete(id);
    const marca = {};
    enVuelo.current.add(marca);
    const lento = setTimeout(() => { lentas.current.add(marca); refrescarAviso(); }, 8000);
    const fin = () => { clearTimeout(lento); enVuelo.current.delete(marca); lentas.current.delete(marca); };
    return AIP.savePresentation(e.pres)
      .then(() => { fin(); refrescarAviso(); })
      .catch((err) => {
        fin();
        console.error('No se pudo guardar:', err);
        // Solo cuenta como fallo si no hay ya una versión más nueva en camino.
        if (ultimaVersion.current.get(id) === e.pres) fallidas.current.add(id);
        refrescarAviso();
      });
  };
  const guardarTodo = () => Promise.all(Array.from(colaGuardado.current.keys()).map(guardarYa));
  const reintentarGuardado = () => {
    Array.from(fallidas.current).forEach((id) => {
      const p = ultimaVersion.current.get(id);
      if (!p) { fallidas.current.delete(id); return; }
      if (!colaGuardado.current.has(id)) colaGuardado.current.set(id, { pres: p, timer: null });
      guardarYa(id);
    });
    refrescarAviso();
  };
  const olvidarGuardado = (id) => {
    const e = colaGuardado.current.get(id);
    if (e) clearTimeout(e.timer);
    colaGuardado.current.delete(id);
    ultimaVersion.current.delete(id);
    fallidas.current.delete(id);
    refrescarAviso();
  };

  // Guarda una presentación concreta (crear o actualizar): estado local al
  // instante + Firestore tras la pausa (o de inmediato con `ya === true`).
  const persist = (pres, ya) => {
    setPresentations((prev) => {
      const exists = prev.some((p) => p.id === pres.id);
      return exists ? prev.map((p) => (p.id === pres.id ? pres : p)) : [pres, ...prev];
    });
    ultimaVersion.current.set(pres.id, pres);
    const previo = colaGuardado.current.get(pres.id);
    if (previo) clearTimeout(previo.timer);
    colaGuardado.current.set(pres.id, { pres, timer: setTimeout(() => guardarYa(pres.id), 800) });
    if (ya === true) guardarYa(pres.id);
  };

  // Al entrar o salir del editor o de Presentar: enviar lo pendiente.
  React.useEffect(() => { guardarTodo(); }, [editingId, presentingId]);

  // Al ocultar o cerrar la pestaña: enviar lo pendiente; si aún hay algo sin
  // confirmar, el navegador pregunta antes de cerrar. Al volver el internet,
  // se reintenta lo que falló.
  React.useEffect(() => {
    const alOcultar = () => { if (document.visibilityState === 'hidden') guardarTodo(); };
    const alSalir = () => { guardarTodo(); };
    const antesDeCerrar = (e) => {
      const pendiente = colaGuardado.current.size > 0 || enVuelo.current.size > 0 || fallidas.current.size > 0;
      guardarTodo();
      if (pendiente) { e.preventDefault(); e.returnValue = ''; }
    };
    const alConectar = () => reintentarGuardado();
    document.addEventListener('visibilitychange', alOcultar);
    window.addEventListener('pagehide', alSalir);
    window.addEventListener('beforeunload', antesDeCerrar);
    window.addEventListener('online', alConectar);
    return () => {
      document.removeEventListener('visibilitychange', alOcultar);
      window.removeEventListener('pagehide', alSalir);
      window.removeEventListener('beforeunload', antesDeCerrar);
      window.removeEventListener('online', alConectar);
    };
  }, []);

  // Sin sesión no queda nada por guardar (ya no se podría escribir).
  React.useEffect(() => {
    if (user) return;
    colaGuardado.current.forEach((e) => clearTimeout(e.timer));
    colaGuardado.current.clear(); ultimaVersion.current.clear(); fallidas.current.clear();
    refrescarAviso();
  }, [user]);

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
    persist(nueva, true);
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
    else if (nueva.recurso === 'podcast') nueva.podcast = { url: '', fuente: '', src: '', imagen: '' };
    else if (nueva.recurso === 'imagenes') nueva.galeria = { diapos: [], musica: null };
    else nueva.video = { url: '', id: '' };
    persist(nueva, true);
    setEditingId(nueva.id);
  };

  const changePres = (next) => persist(next);

  const deletePres = (id) => {
    const esVigia = presentations.some((p) => p.id === id && p.clase === 'vigia');
    const borrar = () => {
      olvidarGuardado(id);   // un guardado pendiente volvería a crear el documento borrado
      setPresentations((prev) => prev.filter((p) => p.id !== id));
      AIP.deletePresentation(id).catch((e) => console.error('No se pudo eliminar:', e));
      // Documento guardado en este computador para esa activación: también se borra.
      if (esVigia && window.borrarCopiaLocal) window.borrarCopiaLocal(id);
    };
    // Modo Vigía: cuadro propio (vigia.jsx); presentaciones: el de siempre.
    if (esVigia && window.vigiaConfirmar) {
      window.vigiaConfirmar('Esta acción no se puede deshacer.', { titulo: '¿Eliminar esta activación?', aceptar: 'Sí, eliminar', peligro: true })
        .then((ok) => { if (ok) borrar(); });
    } else {
      aipConfirmar('Esta acción no se puede deshacer.', { titulo: '¿Eliminar esta presentación?', aceptar: 'Sí, eliminar', peligro: true })
        .then((ok) => { if (ok) borrar(); });
    }
  };

  const present = (id) => {
    const target = presentations.find((p) => p.id === id);
    if (target) persist({ ...target, usos: (target.usos || 0) + 1, lastPresented: Date.now() }, true);
    setPresentingId(id);
  };

  // Antes de cerrar sesión se envía lo pendiente (máx. 2,5 s de espera).
  const logout = () => {
    Promise.race([guardarTodo(), new Promise((r) => setTimeout(r, 2500))]).then(() => AIP.signOut());
  };

  // Retira la pantalla de carga Res Cogitans (index.html) cuando ya hay algo
  // que mostrar: el inicio de sesión o el panel con las presentaciones.
  const plataformaLista = authReady && (!user || (acceso !== null && (acceso !== 'aprobado' || !loadingData)));
  React.useEffect(() => {
    if (plataformaLista && window.RCLoader && RCLoader.current) RCLoader.current.hide();
  }, [plataformaLista, user ? user.uid : null]);

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
  // 'vigia-listas': UN documento con las listas de estudiantes guardadas
  // (solo nombres), para elegirlas rápido en cualquier activación.
  const presentaciones = presentations.filter((p) => p.clase !== 'vigia' && p.clase !== 'vigia-listas');
  const activaciones = presentations.filter((p) => p.clase === 'vigia');
  const esVigia = (p) => !!p && p.clase === 'vigia';
  const docListas = presentations.find((p) => p.clase === 'vigia-listas');
  const listasEstudiantes = (docListas && docListas.listas) || [];
  const guardarListas = (listas) => persist({
    ...(docListas || { id: 'vigia-listas', clase: 'vigia-listas', titulo: 'Listas de estudiantes (Modo Vigía)' }),
    listas,
  });

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
            listas={listasEstudiantes} onGuardarListas={guardarListas}
            onPresent={() => present(editing.id)} />
        ) : (
          <VigiaDashboard profile={profile} esAdmin={AIP.esAdmin()} onAdmin={() => setAdminOpen(true)}
            onLogout={logout} onSalir={() => setModo('interactivas')}
            activaciones={activaciones} onCrear={createActivacion} onAbrir={setEditingId}
            onPresentar={present} onEliminar={deletePres} onImportar={persist}
            theme={theme} setTheme={setTheme} />
        )}
        <ResCogitasFooter />
        <AvisoGuardado tipo={avisoGuardado} onReintentar={reintentarGuardado} />
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
          <AvisoGuardado tipo={avisoGuardado} onReintentar={reintentarGuardado} />
        </React.Fragment>
      )}
      <AppTweaks t={t} setTweak={setTweak} />
    </React.Fragment>
  );
}

/* Aviso fijo cuando un guardado falló ('fallo') o lleva rato sin confirmarse
   ('lento', típico sin internet). No se muestra durante Presentar. */
function AvisoGuardado({ tipo, onReintentar }) {
  if (!tipo) return null;
  const fallo = tipo === 'fallo';
  return (
    <div role="alert" style={{
      position: 'fixed', left: '50%', bottom: 22, transform: 'translateX(-50%)', zIndex: 1500,
      display: 'flex', alignItems: 'center', gap: 14, maxWidth: 'calc(100vw - 32px)',
      padding: '12px 16px', borderRadius: 14, background: '#2A0E08', color: '#FFE9E2',
      border: '2px solid #F53711', boxShadow: '0 14px 40px -12px rgba(0,0,0,.6)',
      fontSize: 14.5, fontWeight: 600, lineHeight: 1.35,
    }}>
      <span>{fallo
        ? 'No se pudieron guardar los últimos cambios.'
        : 'El guardado aún no se confirma. Revisa tu internet y no cierres esta pestaña.'}</span>
      {fallo && (
        <button onClick={onReintentar} style={{
          flexShrink: 0, padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#F53711', color: '#fff', fontWeight: 800, fontFamily: 'var(--font-display)', fontSize: 14,
        }}>Reintentar</button>
      )}
    </div>
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
  return (
    <React.Fragment>
      <App />
      {window.TerminosGate ? <TerminosGate /> : null}
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);