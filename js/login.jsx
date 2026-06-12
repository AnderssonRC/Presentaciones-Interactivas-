/* login.jsx — Inicio de sesión y registro reales con Firebase Auth */
function LoginScreen({ onAuthed }) {
  const [modo, setModo] = React.useState('entrar'); // 'entrar' | 'crear'
  const [nombre, setNombre] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pass, setPass] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  const traducirError = (code) => ({
    'auth/invalid-email': 'El correo no tiene un formato válido.',
    'auth/missing-password': 'Escribe tu contraseña.',
    'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Intenta iniciar sesión.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  }[code] || 'Ocurrió un error. Revisa tu conexión e inténtalo de nuevo.');

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!email.trim() || !pass) { setError('Completa el correo y la contraseña.'); return; }
    if (modo === 'crear' && !nombre.trim()) { setError('Escribe tu nombre.'); return; }
    setBusy(true);
    try {
      const user = modo === 'crear'
        ? await AIP.signUp(email, pass, nombre)
        : await AIP.signIn(email, pass);
      onAuthed && onAuthed(user);
    } catch (err) {
      setError(traducirError(err && err.code));
      setBusy(false);
    }
  };

  return (
    <div className="login-screen" data-screen-label="Login">
      <div className="login-brandside">
        <Logo dark size={30} />
        <div>
          <div className="kicker" style={{ color: '#11F555', marginBottom: 22 }}>Para docentes · Un televisor basta</div>
          <h1 className="login-title">
            Presentaciones didácticas que <span style={{ color: '#11F555' }}>despiertan</span> la atención del aula.
          </h1>
          <p style={{ color: '#9AA396', fontSize: 17, maxWidth: '34em', marginTop: 22 }}>
            Crea presentaciones con actividades interactivas en minutos. Pensado para aulas
            con un solo televisor o video beam y docentes con poco tiempo.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 26, color: '#6E776C', fontSize: 13.5, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="tv" size={16} /> Modo presentar para TV</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="rayo" size={16} /> 20 actividades listas</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Icon name="clock" size={16} /> Tus presentaciones en la nube</span>
        </div>
      </div>

      <div className="login-panel">
        <div>
          <div className="kicker" style={{ color: '#6E776C' }}>Tu cuenta de docente</div>
          <h2 style={{ fontSize: 27, fontWeight: 800, color: '#F2F5EF', marginTop: 10 }}>
            {modo === 'crear' ? 'Crea tu cuenta' : 'Inicia sesión'}
          </h2>
          <p style={{ color: '#9AA396', fontSize: 14.5, marginTop: 6 }}>
            {modo === 'crear'
              ? 'Tus presentaciones quedan guardadas en tu cuenta y las verás desde cualquier equipo.'
              : 'Entra para ver y presentar tus presentaciones guardadas.'}
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {modo === 'crear' && (
            <input className="login-input" type="text" value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre, p. ej. Prof. Marcela" autoComplete="name" />
          )}
          <input className="login-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico" autoComplete="email" />
          <input className="login-input" type="password" value={pass} onChange={(e) => setPass(e.target.value)}
            placeholder="Contraseña" autoComplete={modo === 'crear' ? 'new-password' : 'current-password'} />

          {error && <div style={{ color: '#F53711', fontSize: 13.5, fontWeight: 600 }}>{error}</div>}

          <button type="submit" className="btn btn-lg" disabled={busy}
            style={{ background: '#11F555', color: '#06140A', borderColor: 'transparent', fontWeight: 700, justifyContent: 'center', opacity: busy ? .7 : 1 }}>
            {busy ? 'Un momento…' : (modo === 'crear' ? 'Crear cuenta' : 'Entrar')} <Icon name="flecha" size={17} />
          </button>
        </form>

        <button onClick={() => { setModo(modo === 'crear' ? 'entrar' : 'crear'); setError(''); }}
          style={{ background: 'none', border: 'none', color: '#9AA396', fontSize: 13.5, cursor: 'pointer', textAlign: 'left' }}>
          {modo === 'crear'
            ? '¿Ya tienes cuenta? Inicia sesión'
            : '¿Primera vez? Crea una cuenta nueva'}
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen });
