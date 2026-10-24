/* herramientas.jsx — Herramientas del docente en TODOS los modos Presentar.
   Abajo a la izquierda, un pincel; al darle clic se despliegan:
     · Lupa ....... clic para acercar (2×) donde se apunta; mover el mouse
                    recorre la imagen; rueda = más o menos aumento; clic = alejar.
     · Marcador ... rayar encima de lo que se proyecta (colores, deshacer).
     · Puntero .... un punto de luz que sigue al mouse (como un láser).
     · Texto ...... clic donde se quiera escribir; se escribe encima.
     · Borrar ..... quita todos los trazos y textos.
   Todo se dibuja en una capa aparte (portal en <body>), así no toca la
   presentación. Esc suelta la herramienta activa. Uso: <HerramientasPresentar /> */

const HERR_COLORES = ['#FF3B30', '#FFC233', '#4D94FF', '#3DDC97', '#FFFFFF', '#111111'];

// Íconos (trazos simples, 24×24).
const HERR_ICONOS = {
  pincel: <path d="M14.5 4.5l5 5L10 19c-1.2 1.2-3 1.6-4.6 1.1L3 19.5l.6-2.4C3.2 15.5 3.6 13.7 4.8 12.5zM13 6l5 5" />,
  lupa: <React.Fragment><circle cx="10.5" cy="10.5" r="6" /><path d="M15 15l5.5 5.5M8 10.5h5M10.5 8v5" /></React.Fragment>,
  marcador: <React.Fragment><path d="M15 4l5 5-9.5 9.5H5.5v-5z" /><path d="M4 21h16" /></React.Fragment>,
  puntero: <React.Fragment><circle cx="12" cy="12" r="3.2" /><circle cx="12" cy="12" r="7.5" opacity=".5" /><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" /></React.Fragment>,
  texto: <path d="M5 6V4.5h14V6M12 4.5v15M9 19.5h6" />,
  deshacer: <path d="M9 7L4 12l5 5M4.5 12H15a5 5 0 010 10h-2" />,
  borrar: <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13M10 11v6M14 11v6" />,
  cerrar: <path d="M6 6l12 12M18 6L6 18" />,
  dado: <React.Fragment><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="8.8" cy="8.8" r="1.3" fill="currentColor" /><circle cx="15.2" cy="15.2" r="1.3" fill="currentColor" /><circle cx="15.2" cy="8.8" r="1.3" fill="currentColor" /><circle cx="8.8" cy="15.2" r="1.3" fill="currentColor" /><circle cx="12" cy="12" r="1.3" fill="currentColor" /></React.Fragment>,
  qr: <React.Fragment><rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="14" y="3.5" width="6.5" height="6.5" rx="1" /><rect x="3.5" y="14" width="6.5" height="6.5" rx="1" /><path d="M14 14h2.5v2.5H14zM18 18h2.5v2.5H18zM14 20.5h2M20.5 14v2" /></React.Fragment>,
};

/* Enlace del material que se presenta (para el QR). Imágenes: una por imagen.
   Devuelve { nombre, enlaces: [{ titulo, url }], aviso? }. */
function materialParaQr(act) {
  const a = act || {};
  const titulo = a.titulo || 'Activación';
  if (a.recurso === 'documento') {
    const p = a.pdf || {};
    const nombre = p.nombre || titulo;
    if (p.driveId) return { titulo, nombre, enlaces: [{ titulo: nombre, url: 'https://drive.google.com/file/d/' + p.driveId + '/view' }],
      aviso: 'Para que lo abran, comparte el archivo en Google Drive como «Cualquier persona con el enlace».' };
    if (p.url) return { titulo, nombre, enlaces: [{ titulo: nombre, url: p.url }] };
    return { titulo, nombre, enlaces: [], aviso: 'Este documento está guardado solo en este computador: no tiene un enlace para compartir. Súbelo a Drive para poder compartirlo.' };
  }
  if (a.recurso === 'podcast') {
    const url = (a.podcast || {}).url;
    return { titulo, nombre: titulo, enlaces: url ? [{ titulo: 'Podcast', url }] : [] };
  }
  if (a.recurso === 'imagenes') {
    const diapos = ((a.galeria || {}).diapos || []).filter((d) => d.url);
    return { titulo, nombre: titulo, enlaces: diapos.map((d, i) => ({ titulo: d.titulo || 'Imagen ' + (i + 1), url: d.url })) };
  }
  const v = a.video || {};
  const url = v.url || (v.id ? 'https://youtu.be/' + v.id : '');
  return { titulo, nombre: titulo, enlaces: url ? [{ titulo: 'Video', url }] : [] };
}

const FRASE_QR = 'Estudiar es de sabios que saben que cualquier información, por más lejana que parezca, tendrá utilidad en momentos de mayor contingencia.';

/* Pantalla del QR: grande, con el nombre exacto, el enlace para copiar y la frase. */
function PantallaQr({ act, onCerrar }) {
  const m = materialParaQr(act);
  const [i, setI] = React.useState(0);
  const [copiado, setCopiado] = React.useState(false);
  const actual = m.enlaces[Math.min(i, m.enlaces.length - 1)] || null;
  const qr = actual ? 'https://api.qrserver.com/v1/create-qr-code/?size=640x640&margin=10&data=' + encodeURIComponent(actual.url) : '';
  const copiar = () => {
    if (!actual) return;
    const hecho = () => { setCopiado(true); setTimeout(() => setCopiado(false), 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(actual.url).then(hecho, () => {});
    else { const t = document.createElement('textarea'); t.value = actual.url; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); hecho(); } catch (e) { /* */ } t.remove(); }
  };
  return (
    <div className="vg-qr-pantalla" role="dialog" aria-label="QR del material" onClick={onCerrar}>
      <div className="vg-qr-caja" onClick={(e) => e.stopPropagation()}>
        <button className="vg-qr-cerrar" onClick={onCerrar} title="Cerrar (Esc)" aria-label="Cerrar"><HerrIcono n="cerrar" size={22} /></button>
        <div className="vg-qr-kicker">Escanea y llévate el material</div>
        <h1 className="vg-qr-titulo">{m.titulo}</h1>
        {m.nombre && m.nombre !== m.titulo && <div className="vg-qr-nombre">{m.nombre}</div>}
        {m.enlaces.length > 1 && (
          <div className="vg-qr-opciones">
            {m.enlaces.map((e, k) => (
              <button key={k} className={k === i ? 'on' : ''} onClick={() => { setI(k); setCopiado(false); }}>{e.titulo}</button>
            ))}
          </div>
        )}
        {actual ? (
          <React.Fragment>
            <div className="vg-qr-marco"><img src={qr} alt={'QR de ' + actual.titulo} /></div>
            <div className="vg-qr-enlace">
              <span title={actual.url}>{actual.url}</span>
              <button onClick={copiar}>{copiado ? '✓ Copiado' : 'Copiar enlace'}</button>
            </div>
          </React.Fragment>
        ) : null}
        {m.aviso && <div className="vg-qr-aviso">{m.aviso}</div>}
        <blockquote className="vg-qr-frase">
          «{FRASE_QR}»
          <cite>— Andersson Cortes y Res Cogitans</cite>
        </blockquote>
      </div>
    </div>
  );
}
function HerrIcono({ n, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{HERR_ICONOS[n]}</svg>
  );
}

const HERRAMIENTAS = [
  { id: 'lupa', nombre: 'Lupa', ayuda: 'Clic para acercar donde apuntas; mueve el mouse para recorrer; rueda = aumento; clic otra vez = alejar' },
  { id: 'marcador', nombre: 'Marcador', ayuda: 'Raya encima de lo que se proyecta' },
  { id: 'puntero', nombre: 'Puntero', ayuda: 'Un punto de luz sigue al mouse' },
  { id: 'texto', nombre: 'Texto', ayuda: 'Clic donde quieras escribir' },
];

/* Modo Jaguar en marcha: sortear qué equipo responde la activación en
   pantalla (aunque no sea un desafío Jaguar). */
function PantallaSorteoEquipo({ equipos, onCerrar }) {
  return (
    <div className="vg-sorteo-pantalla" onClick={onCerrar}>
      <div className="vg-sorteo-caja" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Sortear equipo">
        <button className="vg-qr-cerrar" onClick={onCerrar} title="Cerrar (Esc)" aria-label="Cerrar"><HerrIcono n="cerrar" size={20} /></button>
        <div className="vg-sorteo-titulo"><span className="vg-jaguar-puno"><Icon name="puno" size={18} /></span> ¿Qué equipo responde?</div>
        <EquipoAlAzar equipos={equipos} autoGirar conPunto />
      </div>
    </div>
  );
}

function HerramientasPresentar({ act }) {
  const [abierto, setAbierto] = React.useState(false);
  const [verQr, setVerQr] = React.useState(false);
  const [verSorteo, setVerSorteo] = React.useState(false);
  const jaguar = window.useJaguarEstado ? useJaguarEstado() : null;
  const hayJaguar = !!(jaguar && jaguar.iniciado && jaguar.equipos && jaguar.equipos.length);
  const [activa, setActiva] = React.useState(null);   // 'lupa' | 'marcador' | 'puntero' | 'texto' | null
  const [color, setColor] = React.useState(HERR_COLORES[0]);
  const [trazos, setTrazos] = React.useState([]);     // [{ color, ancho, puntos: [[x, y]] }]
  const [textos, setTextos] = React.useState([]);     // [{ id, x, y, texto, color }]
  const [mouse, setMouse] = React.useState(null);     // { x, y } para el puntero
  const [zoom, setZoom] = React.useState({ on: false, nivel: 2 });
  const lienzo = React.useRef(null);
  const trazoActual = React.useRef(null);

  const elegir = (id) => setActiva((a) => (a === id ? null : id));

  // --- Esc suelta la herramienta (antes de que el modo Presentar salga) ---
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && (verQr || verSorteo)) { e.stopPropagation(); e.preventDefault(); setVerQr(false); setVerSorteo(false); return; }
      // Con el QR o el sorteo en pantalla, espacio/Enter no deben mover la presentación de atrás.
      if ((verQr || verSorteo) && (e.key === ' ' || e.key === 'Enter' || e.key.startsWith('Arrow'))) {
        e.stopPropagation();
        if (!(e.target && /button|input|textarea/i.test(e.target.tagName))) e.preventDefault();
        return;
      }
      if (e.key !== 'Escape' || (!activa && !zoom.on)) return;
      if (e.target && /textarea/i.test(e.target.tagName)) { e.target.blur(); }
      e.stopPropagation(); e.preventDefault();
      setActiva(null);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [activa, zoom.on, verQr, verSorteo]);

  // --- Lupa: se escala la presentación (.vg-presentar) alrededor del mouse ---
  const objetivo = () => document.querySelector('.vg-presentar');
  React.useEffect(() => {
    const el = objetivo();
    if (!el) return;
    if (activa !== 'lupa' || !zoom.on) { el.style.transform = ''; el.style.transformOrigin = ''; return; }
    el.style.transition = 'transform .25s ease';
    el.style.transform = 'scale(' + zoom.nivel + ')';
  }, [activa, zoom.on, zoom.nivel]);
  React.useEffect(() => () => { const el = objetivo(); if (el) { el.style.transform = ''; el.style.transformOrigin = ''; el.style.transition = ''; } }, []);
  React.useEffect(() => { if (activa !== 'lupa') setZoom((z) => ({ ...z, on: false })); }, [activa]);
  const moverLupa = (e) => {
    const el = objetivo();
    if (el && zoom.on) el.style.transformOrigin = e.clientX + 'px ' + e.clientY + 'px';
  };
  const clicLupa = (e) => {
    const el = objetivo();
    if (el) el.style.transformOrigin = e.clientX + 'px ' + e.clientY + 'px';
    setZoom((z) => ({ ...z, on: !z.on }));
  };
  const ruedaLupa = (e) => {
    setZoom((z) => ({ on: true, nivel: Math.max(1.5, Math.min(5, Math.round((z.nivel + (e.deltaY < 0 ? 0.5 : -0.5)) * 10) / 10)) }));
    moverLupa(e);
  };

  // --- Puntero: sigue al mouse (el cursor se oculta) ---
  React.useEffect(() => {
    if (activa !== 'puntero') { setMouse(null); return; }
    const mover = (e) => setMouse({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', mover);
    document.documentElement.classList.add('vg-sin-cursor');
    return () => { window.removeEventListener('pointermove', mover); document.documentElement.classList.remove('vg-sin-cursor'); };
  }, [activa]);

  // --- Marcador: lienzo del tamaño de la pantalla; se redibuja al cambiar ---
  const dibujar = React.useCallback(() => {
    const c = lienzo.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    if (c.width !== window.innerWidth * dpr || c.height !== window.innerHeight * dpr) {
      c.width = window.innerWidth * dpr; c.height = window.innerHeight * dpr;
    }
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const todos = trazoActual.current ? [...trazos, trazoActual.current] : trazos;
    todos.forEach((t) => {
      const p = t.puntos;
      if (!p.length) return;
      ctx.strokeStyle = t.color; ctx.lineWidth = t.ancho; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 3;
      ctx.beginPath(); ctx.moveTo(p[0][0], p[0][1]);
      if (p.length === 1) ctx.lineTo(p[0][0] + 0.1, p[0][1]);
      for (let i = 1; i < p.length - 1; i++) {
        const mx = (p[i][0] + p[i + 1][0]) / 2, my = (p[i][1] + p[i + 1][1]) / 2;
        ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
      }
      if (p.length > 1) ctx.lineTo(p[p.length - 1][0], p[p.length - 1][1]);
      ctx.stroke();
    });
  }, [trazos]);
  React.useEffect(() => { dibujar(); }, [dibujar]);
  React.useEffect(() => {
    window.addEventListener('resize', dibujar);
    return () => window.removeEventListener('resize', dibujar);
  }, [dibujar]);
  const empezarTrazo = (e) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    trazoActual.current = { color, ancho: 5, puntos: [[e.clientX, e.clientY]] };
    dibujar();
  };
  const seguirTrazo = (e) => {
    if (!trazoActual.current) return;
    trazoActual.current.puntos.push([e.clientX, e.clientY]);
    dibujar();
  };
  const terminarTrazo = () => {
    if (!trazoActual.current) return;
    const t = trazoActual.current;
    trazoActual.current = null;
    setTrazos((ts) => [...ts, t]);
  };

  // --- Texto: clic en un lugar libre crea un cuadro para escribir ---
  const nuevoTexto = (e) => {
    if (e.target !== e.currentTarget) return;
    const t = { id: AIP.uid(), x: e.clientX, y: e.clientY, texto: '', color };
    setTextos((ts) => [...ts, t]);
  };
  const cambiarTexto = (id, texto) => setTextos((ts) => ts.map((t) => (t.id === id ? { ...t, texto } : t)));
  const soltarTexto = (id) => setTextos((ts) => ts.filter((t) => t.id !== id || t.texto.trim()));

  const deshacer = () => {
    // Lo último que se hizo: el último trazo o el último texto.
    if (trazos.length) setTrazos((ts) => ts.slice(0, -1));
    else if (textos.length) setTextos((ts) => ts.slice(0, -1));
  };
  const borrarTodo = () => { setTrazos([]); setTextos([]); };
  const hayAlgo = trazos.length > 0 || textos.length > 0;
  const conColor = activa === 'marcador' || activa === 'texto';

  const capa = (
    <div className={'vg-herr-capa' + (activa ? ' activa-' + activa : '') + (zoom.on ? ' acercada' : '')}>
      <canvas ref={lienzo} className="vg-herr-lienzo"
        onPointerDown={activa === 'marcador' ? empezarTrazo : undefined}
        onPointerMove={activa === 'marcador' ? seguirTrazo : undefined}
        onPointerUp={terminarTrazo} onPointerCancel={terminarTrazo} />
      {/* Superficie que recibe los clics de la lupa y del texto. */}
      {(activa === 'lupa' || activa === 'texto') && (
        <div className="vg-herr-superficie" onClick={activa === 'lupa' ? clicLupa : nuevoTexto}
          onPointerMove={activa === 'lupa' ? moverLupa : undefined} onWheel={activa === 'lupa' ? ruedaLupa : undefined}></div>
      )}
      {textos.map((t) => (
        <AreaTexto key={t.id} value={t.texto} autoFocus={!t.texto} minRows={1} max={600}
          className={'vg-herr-texto' + (activa === 'texto' ? ' editable' : '')} readOnly={activa !== 'texto'}
          style={{ left: t.x, top: t.y, color: t.color, resize: 'none' }}
          onChange={(e) => cambiarTexto(t.id, e.target.value)} onBlur={() => soltarTexto(t.id)}
          placeholder="Escribe…" spellCheck="false" />
      ))}
      {activa === 'puntero' && mouse && <div className="vg-herr-puntero" style={{ left: mouse.x, top: mouse.y }}></div>}
    </div>
  );

  const barra = (
    <div className={'vg-herr' + (abierto ? ' abierta' : '')}>
      <button className={'vg-herr-boton vg-herr-pincel' + (abierto ? ' on' : '')} onClick={() => { if (abierto) setActiva(null); setAbierto((v) => !v); }}
        title={abierto ? 'Cerrar herramientas' : 'Herramientas: lupa, marcador, puntero y texto'} aria-label="Herramientas" aria-expanded={abierto}>
        <HerrIcono n={abierto ? 'cerrar' : 'pincel'} size={22} />
      </button>
      {abierto && (
        <div className="vg-herr-panel" role="toolbar" aria-label="Herramientas de presentación">
          {HERRAMIENTAS.map((h) => (
            <button key={h.id} className={'vg-herr-boton' + (activa === h.id ? ' on' : '')} onClick={() => elegir(h.id)}
              title={h.nombre + ': ' + h.ayuda} aria-pressed={activa === h.id}>
              <HerrIcono n={h.id} />
              <span className="vg-herr-nombre">{h.id === 'lupa' && zoom.on ? zoom.nivel + '×' : h.nombre}</span>
            </button>
          ))}
          {hayJaguar && (
            <button className={'vg-herr-boton vg-herr-jaguar' + (verSorteo ? ' on' : '')} onClick={() => { setActiva(null); setVerSorteo(true); }}
              title="Modo Jaguar: sortear qué equipo responde la activación en pantalla">
              <HerrIcono n="dado" /><span className="vg-herr-nombre">Sortear</span>
            </button>
          )}
          {act && (
            <button className={'vg-herr-boton' + (verQr ? ' on' : '')} onClick={() => { setActiva(null); setVerQr(true); }}
              title="QR del material: para que los estudiantes lo abran en su celular">
              <HerrIcono n="qr" /><span className="vg-herr-nombre">QR</span>
            </button>
          )}
          {conColor && (
            <div className="vg-herr-colores" role="radiogroup" aria-label="Color">
              {HERR_COLORES.map((c) => (
                <button key={c} role="radio" aria-checked={color === c} className={'vg-herr-color' + (color === c ? ' on' : '')}
                  style={{ background: c }} onClick={() => setColor(c)} title="Color"></button>
              ))}
            </div>
          )}
          <span className="vg-herr-sep"></span>
          <button className="vg-herr-boton" onClick={deshacer} disabled={!hayAlgo} title="Deshacer lo último">
            <HerrIcono n="deshacer" /><span className="vg-herr-nombre">Deshacer</span>
          </button>
          <button className="vg-herr-boton" onClick={borrarTodo} disabled={!hayAlgo} title="Borrar todos los trazos y textos">
            <HerrIcono n="borrar" /><span className="vg-herr-nombre">Borrar</span>
          </button>
        </div>
      )}
    </div>
  );

  // Portal en <body>: la lupa escala la presentación sin escalar las herramientas.
  return ReactDOM.createPortal(
    <React.Fragment>
      {capa}
      {verQr && <PantallaQr act={act} onCerrar={() => setVerQr(false)} />}
      {verSorteo && hayJaguar && <PantallaSorteoEquipo equipos={jaguar.equipos} onCerrar={() => setVerSorteo(false)} />}
      {barra}
    </React.Fragment>,
    document.body);
}

Object.assign(window, { HerramientasPresentar, HerrIcono });
