/* mando.jsx — Mando a distancia del Modo Vigía (lado del TELEVISOR).
   Usa la misma sesión de control remoto de la plataforma (db.js:
   remoteSessions/{código}): el televisor publica un "estado espejo" y el
   celular envía órdenes. El celular entra escaneando el QR o escribiendo el
   código de 4 dígitos; si el docente puso un PIN, también se lo pide.
     · useMandoVigia(estado, manejar) -> { code, conectado }
         estado : lo que el celular necesita ver (recurso, tiempo, lista…)
         manejar(accion, orden): ejecuta una orden en el modo Presentar.
     · <MandoBadge mando={…} />: chip "Mando 4821" arriba a la derecha (QR al abrirlo).
     · useOrdenMando(fn): para componentes internos (tono, tarjeta, reto),
       que reciben TODAS las órdenes como evento 'vigia-mando'.
   El celular (js/vigia/mando-celular.jsx) se carga aparte, solo en el celular. */

const MANDO_PIN_CLAVE = 'vigia_mando_pin';
function pinMandoGuardado() { try { return localStorage.getItem(MANDO_PIN_CLAVE) || ''; } catch (e) { return ''; } }

// Recibir las órdenes del celular dentro de cualquier componente.
function useOrdenMando(fn) {
  const ref = React.useRef(fn);
  ref.current = fn;
  React.useEffect(() => {
    const oir = (e) => ref.current(e.detail || {});
    window.addEventListener('vigia-mando', oir);
    return () => window.removeEventListener('vigia-mando', oir);
  }, []);
}

function useMandoVigia(estado, manejar) {
  const [code, setCode] = React.useState(null);
  const [conectado, setConectado] = React.useState(false);
  const [pin, setPinEstado] = React.useState(pinMandoGuardado);
  const manejarRef = React.useRef(manejar);
  manejarRef.current = manejar;
  const ultimoNonce = React.useRef(null);

  // Crear la sesión al entrar a Presentar y cerrarla al salir.
  React.useEffect(() => {
    if (!window.AIP || !AIP.createRemoteSession) return undefined;
    let vivo = true, c = null;
    AIP.createRemoteSession({ clase: 'vigia' }).then(({ code: nuevo }) => {
      if (!vivo) { AIP.closeRemoteSession(nuevo); return; }
      c = nuevo; setCode(nuevo);
    }).catch((e) => console.error('[mando vigía] no se pudo crear la sesión:', e));
    return () => { vivo = false; if (c) AIP.closeRemoteSession(c); };
  }, []);

  // Escuchar órdenes.
  React.useEffect(() => {
    if (!code) return undefined;
    return AIP.listenRemoteSession(code, (data) => {
      const cmd = data && data.command;
      if (!cmd || !cmd.nonce || cmd.nonce === ultimoNonce.current) return;
      ultimoNonce.current = cmd.nonce;
      AIP.clearRemoteCommand(code).catch(() => {});
      if (cmd.type !== 'vigia') return;
      const orden = cmd.payload || {};
      if (orden.accion === 'hola') { setConectado(true); return; }
      setConectado(true);
      // Modo Jaguar: sumar / quitar puntos a un equipo.
      if (orden.accion === 'punto' && window.jaguarPunto) { jaguarPunto(orden.i, orden.delta || 1); return; }
      // Primero los componentes internos (tono, tarjeta, reto); luego el modo.
      window.dispatchEvent(new CustomEvent('vigia-mando', { detail: orden }));
      try { manejarRef.current(orden.accion, orden); } catch (e) { console.error('[mando vigía]', e); }
    });
  }, [code]);

  // Publicar el estado espejo cuando cambia algo importante (no el tiempo
  // segundo a segundo: el celular lo calcula con `en` y `reproduciendo`).
  // Marcador del Modo Jaguar (si está en marcha): también lo ve y lo edita el celular.
  const sesionJaguar = window.useJaguarEstado ? useJaguarEstado() : null;
  const marcador = sesionJaguar && window.jaguarResumen ? jaguarResumen(sesionJaguar) : null;
  // El desafío Jaguar en pantalla: el celular muestra SUS botones (enfrentar,
  // piedra-papel-tijera, quién ganó, puntos de la activación enlazada…).
  const jaguarDesafio = marcador && window.jaguarDesafioActual ? jaguarDesafioActual(sesionJaguar) : null;
  const clave = JSON.stringify({ ...estado, tiempo: undefined, pin, marcador, jaguarDesafio });
  const ultimoTiempo = React.useRef({ t: 0, en: 0 });
  React.useEffect(() => {
    if (!code) return;
    publicar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, clave]);
  // Si el tiempo salta (o cada 15 s mientras avanza), se vuelve a publicar.
  React.useEffect(() => {
    if (!code || typeof estado.tiempo !== 'number') return;
    const u = ultimoTiempo.current;
    const esperado = u.t + (estado.reproduciendo ? (Date.now() - u.en) / 1000 : 0);
    if (Math.abs(estado.tiempo - esperado) > 2.5 || Date.now() - u.en > 15000) publicar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado.tiempo]);
  function publicar() {
    ultimoTiempo.current = { t: estado.tiempo || 0, en: Date.now() };
    const hash = pin && typeof window.hashPin === 'function' ? window.hashPin(pin) : '';
    AIP.updateRemoteState(code, { ...estado, clase: 'vigia', en: Date.now(), mandoHash: hash, permiteEstudiantes: false, marcador, jaguarDesafio })
      .catch((e) => console.error('[mando vigía] estado:', e));
  }

  const setPin = (p) => { setPinEstado(p); try { localStorage.setItem(MANDO_PIN_CLAVE, p); } catch (e) { /* */ } };
  return { code, conectado, pin, setPin };
}

/* Chip del mando (arriba a la derecha; discreto hasta pasar el mouse).
   Al abrirlo: QR grande, el código y un PIN opcional. */
function MandoBadge({ mando }) {
  const [abierto, setAbierto] = React.useState(false);
  const [pinTexto, setPinTexto] = React.useState(mando.pin || '');
  if (!mando.code) return null;
  const url = location.origin + location.pathname + '?remote=' + mando.code;
  const qr = 'https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=' + encodeURIComponent(url);
  return (
    <div className={'vg-mando' + (abierto ? ' abierto' : '') + (mando.conectado ? ' conectado' : '')}>
      <button className="vg-mando-chip" onClick={() => setAbierto((v) => !v)}
        title={mando.conectado ? 'Celular conectado como mando' : 'Conectar el celular como mando a distancia'}>
        <span className="vg-mando-punto"></span>
        <span>📱 Mando</span>
        <strong>{mando.code}</strong>
      </button>
      {abierto && (
        <div className="vg-mando-panel">
          <div className="vg-mando-titulo">Mando a distancia</div>
          <img src={qr} alt="QR del mando" width="200" height="200" className="vg-mando-qr" />
          <div className="vg-mando-ayuda">Escanea el QR con el celular<br />o entra a esta página y escribe el código</div>
          <div className="vg-mando-codigo">{mando.code.split('').map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="vg-mando-pin">
            <span>🔒 PIN (opcional)</span>
            <input type="password" inputMode="numeric" value={pinTexto} placeholder="Sin PIN" maxLength={6}
              onChange={(e) => setPinTexto(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onBlur={() => mando.setPin(pinTexto)} onKeyDown={(e) => { if (e.key === 'Enter') { mando.setPin(pinTexto); e.target.blur(); } }} />
          </div>
          <div className="vg-mando-estado">{mando.conectado ? '✓ Celular conectado' : 'Esperando al celular…'}</div>
        </div>
      )}
    </div>
  );
}

// Texto corto para la lista del celular.
function cortoMando(t, n) {
  const s = String(t || '').replace(/\s+/g, ' ').trim();
  return s.length > (n || 60) ? s.slice(0, (n || 60) - 1) + '…' : s;
}
// Una activación como la ve el celular.
function itemMando(a, etiqueta, visto) {
  const ti = VigiaTipos.tipo(a.tipo);
  const texto = a.tipo === 'reto' ? VigiaTipos.reto(a.reto).nombre : a.tipo === 'glosario' ? (a.termino || a.texto) : (a.titulo || a.texto);
  return { id: a.id, tipo: a.tipo, nombre: ti.nombre, color: ti.color, etiqueta, texto: cortoMando(texto), visto: !!visto };
}

Object.assign(window, { useMandoVigia, useOrdenMando, MandoBadge, itemMando, cortoMando });
