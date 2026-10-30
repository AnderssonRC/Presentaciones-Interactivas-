/* UI compartida: iconos, logo, slide escalado */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

function Icon({ name, size = 20 }) {
  const P = (d, extra) => <path d={d} {...extra} />;
  const glyphs = {
    ruleta: <g><circle cx="12" cy="12" r="9" /><path d="M12 3v18M3.6 7.5l16.8 9M3.6 16.5l16.8-9" /><circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" /></g>,
    letras: <g><path d="M4 17L8 6l4 11M5.5 13.5h5" /><path d="M15 17h6" strokeDasharray="2 2.4" /><path d="M18 6v7" /></g>,
    check: <g><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.6 2.6L16 9.5" /></g>,
    pregunta: <g><path d="M9 9.2a3 3 0 1 1 4.6 2.5c-1 .6-1.6 1.1-1.6 2.5" /><circle cx="12" cy="17.6" r="1.1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="9.2" /></g>,
    bulb: <g><path d="M9.5 18h5M10.5 21h3" /><path d="M12 3a6 6 0 0 1 3.4 10.9c-.7.5-1 1.3-1 2.1h-4.8c0-.8-.3-1.6-1-2.1A6 6 0 0 1 12 3z" /></g>,
    vf: <g><path d="M4 12.5l2.6 2.5L11 9.5" /><path d="M14.5 9.5l5 5M19.5 9.5l-5 5" /></g>,
    pares: <g><circle cx="6.5" cy="7" r="3" /><circle cx="17.5" cy="17" r="3" /><path d="M9 9.2l6.2 5.8" /></g>,
    ordena: <g><path d="M4 6h12M4 12h9M4 18h6" /><path d="M19 10v8m0 0l-2.6-2.6M19 18l2.6-2.6" /></g>,
    memorama: <g><rect x="3.5" y="6.5" width="11" height="14" rx="2" /><path d="M9 3.5h9a2 2 0 0 1 2 2v11" /></g>,
    sopa: <g><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9.3 4v16M14.6 4v16M4 9.3h16M4 14.6h16" /></g>,
    eye: <g><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.8" /></g>,
    cloud: <g><path d="M7 17a4.5 4.5 0 1 1 .8-8.9A5.5 5.5 0 0 1 18.4 9.7 3.8 3.8 0 0 1 17.5 17H7z" /><circle cx="9" cy="20.4" r=".9" fill="currentColor" stroke="none" /><circle cx="13" cy="20.4" r=".9" fill="currentColor" stroke="none" /><circle cx="17" cy="20.4" r=".9" fill="currentColor" stroke="none" /></g>,
    chart: <g><path d="M4 20V10M10 20V4M16 20v-7M21 20H3" /></g>,
    clock: <g><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.4 2" /></g>,
    user: <g><circle cx="12" cy="8" r="4" /><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" /></g>,
    dado: <g><rect x="4" y="4" width="16" height="16" rx="3.5" /><circle cx="8.8" cy="8.8" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.2" cy="15.2" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.2" cy="8.8" r="1.2" fill="currentColor" stroke="none" /><circle cx="8.8" cy="15.2" r="1.2" fill="currentColor" stroke="none" /></g>,
    trofeo: <g><path d="M8 4h8v6a4 4 0 0 1-8 0V4z" /><path d="M8 5H4.5a3.5 3.5 0 0 0 3.6 3.5M16 5h3.5a3.5 3.5 0 0 1-3.6 3.5" /><path d="M12 14v4m-3.5 2.5h7M10 18h4" /></g>,
    ahorcado: <g><path d="M5 21V3.5h9V7" /><circle cx="14" cy="10" r="2.6" /><path d="M14 12.6V17M3 21h7" /></g>,
    debate: <g><path d="M3.5 5h10v7h-6l-2.8 2.6V12H3.5V5z" /><path d="M16 9.5h4.5v6.4H18l-2.3 2.1v-2.1H16" /></g>,
    rayo: <g><path d="M13 2.5L5 13.5h5.5L10 21.5l8.5-11.5H13l.8-7.5z" /></g>,
    // Puño (Modo Jaguar)
    puno: <g><path d="M7.5 10.5V8a1.6 1.6 0 0 1 3.2 0v2" /><path d="M10.7 9.5V6.8a1.6 1.6 0 0 1 3.2 0v2.7" /><path d="M13.9 9.5V7.6a1.6 1.6 0 0 1 3.2 0v2.4" /><path d="M17.1 10V9.2a1.6 1.6 0 0 1 3.2 0v3.6a7.4 7.4 0 0 1-7.4 7.4h-1.3a6 6 0 0 1-5-2.7l-2-3a1.7 1.7 0 0 1 2.7-2l1.2 1.4V10.5" /><path d="M11 14.5c1.2-.8 2.6-1 4-.6" /></g>,
    sol: <g><circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.7M12 18.8v2.7M2.5 12h2.7M18.8 12h2.7M5 5l1.9 1.9M17.1 17.1L19 19M19 5l-1.9 1.9M6.9 17.1L5 19" /></g>,
    luna: <g><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" /></g>,
    flecha: <g><path d="M5 12h14m0 0l-6-6m6 6l-6 6" /></g>,
    atras: <g><path d="M19 12H5m0 0l6-6m-6 6l6 6" /></g>,
    play: <g><path d="M7 4.8v14.4L19 12 7 4.8z" /></g>,
    mas: <g><path d="M12 5v14M5 12h14" /></g>,
    salir: <g><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9M15 16l4-4-4-4M19 12H9.5" /></g>,
    tv: <g><rect x="3" y="5" width="18" height="12.5" rx="2" /><path d="M8.5 21h7" /></g>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {glyphs[name] || glyphs.check}
    </svg>
  );
}

function Logo({ dark, size = 30 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
      <div style={{
        width: size + 8, height: size + 8, borderRadius: 10, background: '#000',
        display: 'grid', placeItems: 'center', flexShrink: 0,
        outline: '1.5px solid ' + (dark ? '#2A302A' : 'transparent'),
      }}>
        <svg width={size - 6} height={size - 6} viewBox="0 0 24 24" fill="none">
          <rect x="2.5" y="4" width="19" height="13" rx="2" stroke="#11F555" strokeWidth="2" />
          <path d="M10 8l5 2.5-5 2.5V8z" fill="#F53711" />
          <path d="M8 21h8" stroke="#11F555" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ lineHeight: 1.05 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, letterSpacing: '-.01em' }}>Actividades</div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15.5, letterSpacing: '-.01em', color: 'var(--verde-ink)' }}>Interactivas</div>
      </div>
    </div>
  );
}

/* Interruptor "Modo Día": encendido = tema claro ('dia'); apagado = tema
   oscuro ('tonos'). Es el mismo ajuste en toda la app (editor y dashboard,
   ver app.jsx) y se recuerda en este navegador. */
function ThemeToggle({ theme, setTheme }) {
  const dia = theme === 'dia';
  return (
    <button className="btn btn-sm" onClick={() => setTheme(dia ? 'tonos' : 'dia')}
      aria-pressed={dia} title={dia ? 'Apagar Modo Día (tema oscuro)' : 'Encender Modo Día (tema claro)'}>
      <Icon name="sol" size={16} />
      Modo Día
      <span className={'switch' + (dia ? ' on' : '')} aria-hidden="true" style={{ marginLeft: 4 }}></span>
    </button>
  );
}

/* Escala un lienzo 1920x1080 al espacio disponible: se ajusta al ANCHO del
   contenedor (dejando un margen a los lados para que no ocupe toda la
   columna) y, además, limita la escala para que la diapositiva quepa
   COMPLETA en el ALTO visible de la columna (sin quedar cortada por el pie
   de página). Queda alineado a la izquierda (no centrado), para no dejar
   espacio "perdido" de forma pareja a ambos lados. */
function ScaledSlide({ children, maxH }) {
  const boxRef = useRef(null);
  const [fit, setFit] = useState({ scale: 0.3, off: 0 });
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Medimos el ANCHO del contenedor padre (cuyo ancho NO depende de `scale`).
    // Observar el propio .slide-stagebox creaba un bucle: al fijar su height
    // desde `scale`, su geometría cambiaba, el ResizeObserver volvía a disparar
    // y el redondeo sub-pixel de Chrome hacía oscilar `scale` (la "vibración").
    const medible = el.parentElement || el;
    // Espacio reservado bajo el lienzo: padding inferior de la columna (~24px)
    // + el pie de página fijo de Res Cogitans (~34px) que se superpone abajo.
    const RESERVA = 60;
    // Margen horizontal: deja aire a los lados en vez de estirar el lienzo
    // borde a borde en la columna (se veía "muy grande").
    const MARGEN_H = 70;
    let rafId = 0;
    let ultimoS = -1, ultimoOff = -1;
    const aplicar = () => {
      rafId = 0;
      let s = Math.max(0.05, medible.clientWidth - MARGEN_H) / 1920;
      if (maxH) s = Math.min(s, maxH / 1080);
      // Ajuste al ALTO: posición del stagebox dentro de la columna (usando
      // scrollTop para que sea independiente del scroll) y alto que queda
      // hasta el borde inferior visible.
      const rBox = el.getBoundingClientRect();
      const rCol = medible.getBoundingClientRect();
      const posEnCol = rBox.top - rCol.top + medible.scrollTop;
      const disponible = medible.clientHeight - posEnCol - RESERVA;
      // Solo limitamos por alto si el espacio es razonable (ventanas muy
      // bajas caen al ajuste por ancho para no dejar un lienzo diminuto).
      if (disponible > 240) s = Math.min(s, disponible / 1080);
      const off = 0; // alineado a la izquierda, no centrado
      // Ignora cambios sub-pixel: evita re-renders por ruido de redondeo.
      if (Math.abs(s - ultimoS) < 0.0005 && off === ultimoOff) return;
      ultimoS = s; ultimoOff = off;
      setFit({ scale: s, off });
    };
    const update = () => {
      // Coalesce a un solo cálculo por frame.
      if (!rafId) rafId = requestAnimationFrame(aplicar);
    };
    aplicar();
    const ro = new ResizeObserver(update);
    ro.observe(medible);
    // El alto disponible también cambia al redimensionar la ventana (p. ej.
    // cuando la toolbar pasa de una a dos filas).
    window.addEventListener('resize', update);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [maxH]);
  const { scale, off } = fit;
  return (
    <div className="slide-stagebox" ref={boxRef} style={{ height: Math.round(1080 * scale) }}>
      <div className="slide" style={{
        transform: `translateX(${off}px) scale(${scale})`, borderRadius: 12 / scale > 60 ? 0 : 12, boxShadow: 'var(--shadow)',
        outline: Math.max(1, Math.round(2 / scale)) + 'px solid #FB923C', outlineOffset: -Math.max(1, Math.round(2 / scale)),
      }}>
        {children}
      </div>
    </div>
  );
}

/* Diapositiva de contenido = lienzo libre (cajas movibles + media + fondo).
   - En modo editable: se arrastran/seleccionan elementos (props selId/onSelect/onChangeEl).
   - En presentación: solo muestra y reproduce animaciones.
   Plantillas viejas (titulo/texto/imagen) se migran al vuelo con migrarContenido(). */
function ContenidoSlide({ slide, editable, selId, editingId, onSelect, onEditText, onChangeEl, replay, pasoActual, previewOn, editRef }) {
  const migrado = migrarContenido(slide);
  return (
    <LienzoLibre slide={migrado} editable={editable}
      selId={selId} editingId={editingId} onSelect={onSelect} onEditText={onEditText} onChangeEl={onChangeEl}
      replay={replay} pasoActual={pasoActual} previewOn={previewOn} editRef={editRef} />
  );
}

/* Vista previa de actividad (en el editor) */
function ActividadSlidePreview({ slide }) {
  const tool = AIP.toolById(slide.tool);
  const cfg = slide.config;
  return (
    <div className="slide-pad" style={{ background: '#0B0E0B', color: '#F2F5EF', alignItems: 'center', justifyContent: 'center', textAlign: 'center', position: 'absolute', inset: 0 }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, padding: '14px 34px', borderRadius: 999, border: '2px solid ' + tool.color, color: tool.color, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '.22em', textTransform: 'uppercase' }}>
        <Icon name={tool.icon} size={34} /> Actividad interactiva
      </div>
      <div className="s-title" style={{ marginTop: 48 }}>{cfg.titulo}</div>
      <div className="s-text" style={{ color: '#B9C2B5', maxWidth: '24em' }}>{cfg.instrucciones}</div>
      <div style={{ marginTop: 60, fontSize: 34, color: '#7B857A', fontFamily: 'var(--font-display)' }}>Se vuelve interactiva en el modo Presentar ▶</div>
    </div>
  );
}

Object.assign(window, { Icon, Logo, ThemeToggle, ScaledSlide, ContenidoSlide, ActividadSlidePreview });

/* ============================================================
   Crédito "Res Cogitans": pie de página fijo (con la licencia) y
   ventana del manifiesto con la marca animada (js/rc-loader.js).
   Se monta <ResCogitasFooter /> en App (app.jsx).
   El monograma está en la raíz del repo: logo-a-cogitas.png
   ============================================================ */

const RC_LICENCIA = {
  nombre: 'CC BY-NC-ND 4.0',
  url: 'https://creativecommons.org/licenses/by-nc-nd/4.0/',
  iconos: ['cc', 'by', 'nc', 'nd'].map((n) => 'https://mirrors.creativecommons.org/presskit/icons/' + n + '.svg'),
};

function RcIconosLicencia({ claro }) {
  return (
    <span className={'rc-cc-iconos' + (claro ? ' is-claro' : '')} aria-hidden="true">
      {RC_LICENCIA.iconos.map((src) => <img key={src} src={src} alt="" />)}
    </span>
  );
}

const RC_MANIFIESTO_CSS = `
.rc-pie{position:fixed;left:0;right:0;bottom:0;z-index:80;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;
  column-gap:14px;row-gap:2px;padding:7px 14px calc(7px + env(safe-area-inset-bottom,0px));cursor:pointer;
  background:rgba(11,14,11,.78);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);
  border-top:1px solid rgba(255,255,255,.08);color:#9AA396;font:600 12.5px/1.4 var(--font-display);}
.rc-pie strong{color:#C7D0C2;}
.rc-pie-info{color:#11F555;font-weight:800;margin-left:6px;}
.rc-pie-licencia{display:inline-flex;align-items:center;gap:6px;color:#9AA396;text-decoration:none;font-weight:500;}
.rc-pie-licencia:hover{color:#C7D0C2;}
.rc-pie-licencia:hover span:first-child{text-decoration:underline;text-underline-offset:2px;}
.rc-cc-iconos{display:inline-flex;gap:3px;}
.rc-cc-iconos img{width:14px;height:14px;display:block;filter:invert(.78);}
.rc-cc-iconos.is-claro img{width:20px;height:20px;filter:none;opacity:.8;}
@media (max-width:520px){.rc-pie{font-size:11.5px;column-gap:10px;}}

.rc-manif-fondo{position:fixed;inset:0;z-index:9998;display:flex;padding:16px;overflow-y:auto;
  background:rgba(14,9,5,.72);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);animation:rc-manif-in .3s ease both;}
.rc-manif{position:relative;margin:auto;width:min(640px,100%);background:#fbf5ea;color:#23180f;border-radius:20px;overflow:hidden;
  box-shadow:0 30px 80px -24px rgba(0,0,0,.75),0 0 0 1px rgba(74,43,20,.14);animation:rc-manif-sube .4s cubic-bezier(.2,.7,.2,1) both;}
.rc-manif-marca{background:#e9d3b0;border-bottom:1px solid rgba(74,43,20,.16);}
.rc-manif-marca .rcl{position:relative;inset:auto;z-index:auto;padding:30px 22px 24px;background:transparent;}
.rc-manif-marca .rcl__stage{width:min(100%,430px);gap:16px;}
.rc-manif-marca .rcl__phrase{width:100%;font-size:clamp(16px,4.2vw,19px);}
.rc-manif-marca .rcl__foot{display:none;}
.rc-manif-cerrar{position:absolute;top:12px;right:12px;z-index:2;width:38px;height:38px;border-radius:999px;cursor:pointer;
  display:grid;place-items:center;border:1px solid rgba(74,43,20,.18);background:rgba(251,245,234,.85);color:#4a2b14;font:700 17px/1 system-ui,sans-serif;}
.rc-manif-cerrar:hover{background:#fff;}
.rc-manif-cuerpo{padding:26px 30px 22px;}
.rc-manif-eti{margin:0 0 10px;font:600 12px/1 'Outfit',system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#8a4b1c;}
.rc-manif-texto{margin:0;font:400 18px/1.62 'EB Garamond',Georgia,serif;color:#2b1d12;text-wrap:pretty;hyphens:auto;}
.rc-manif-texto strong{font-weight:600;color:#4a2b14;}
.rc-manif-firma{display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-top:20px;}
.rc-manif-beta{margin-right:auto;padding:9px 14px;border-radius:999px;cursor:pointer;border:1px solid rgba(74,43,20,.25);
  background:#1a110a;color:#f0cf9c;font:500 12.5px/1 'Outfit',system-ui,sans-serif;letter-spacing:.06em;}
.rc-manif-beta:hover{background:#2b1d12;}
@media (max-width:520px){.rc-manif-firma{flex-wrap:wrap;}.rc-manif-beta{order:3;margin:6px 0 0;}}
.rc-manif-firma img{height:58px;width:auto;mix-blend-mode:multiply;opacity:.9;}
.rc-manif-firma p{margin:0;text-align:right;font:italic 500 17px/1.3 'EB Garamond',Georgia,serif;color:#4a2b14;}
.rc-manif-licencia{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:16px 30px 20px;
  border-top:1px solid rgba(74,43,20,.14);background:#f4ead9;font:400 13.5px/1.5 'Outfit',system-ui,sans-serif;color:#5a4636;}
.rc-manif-licencia p{margin:0;flex:1 1 260px;}
.rc-manif-licencia a{color:#8a4b1c;font-weight:600;text-underline-offset:3px;}
@media (max-width:520px){.rc-manif-marca .rcl{padding-top:56px;}.rc-manif-cuerpo{padding:22px 20px 18px;}.rc-manif-licencia{padding:14px 20px 18px;}.rc-manif-texto{font-size:17px;}}
@media (orientation:landscape) and (max-height:520px){.rc-manif-marca .rcl__stage{width:100%;}}
@keyframes rc-manif-in{from{opacity:0}to{opacity:1}}
@keyframes rc-manif-sube{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
`;

function ResCogitasManifiesto({ onCerrar }) {
  const marcaRef = React.useRef(null);

  // Marca y frase animadas en bucle (mismo cargador de la pantalla de inicio).
  React.useEffect(() => {
    if (!window.RCLoader || !marcaRef.current) return undefined;
    const anim = RCLoader.show({
      target: marcaRef.current, scene: 'none', theme: 'light', loop: true, hold: 3000,
      credit: '', caption: '', width: '430px', background: 'transparent',
    });
    return () => anim.destroy();
  }, []);

  return (
    <div className="rc-manif-fondo" onClick={onCerrar}>
      <div className="rc-manif" role="dialog" aria-modal="true" aria-label="Res Cogitans"
        onClick={(e) => e.stopPropagation()}>
        <button type="button" className="rc-manif-cerrar" onClick={onCerrar} title="Cerrar" aria-label="Cerrar">✕</button>
        <div className="rc-manif-marca" ref={marcaRef} />

        <div className="rc-manif-cuerpo">
          <p className="rc-manif-eti">El proyecto</p>
          <p className="rc-manif-texto">
            <strong>Res Cogitans</strong> es un proyecto que busca reivindicar el arte creador de los docentes,
            pues son Artesanos en su enseñar. Por esa razón, y sin descanso, se busca crear herramientas
            digitales, físicas y epistémicas que permitan al docente reivindicarse en su hacer social y político,
            mostrándose como un sabedor que une intelecto y materialidad (producción real), además de estar
            autorizado a ejercer bajo su razón intelectual y sus años de experiencia, cualquier tipo de
            transformación y decisión. Esto revindica al docente como experto de la enseñanza, pues nadie más
            que él sabe el complejo Arte de Educar.
          </p>
          <div className="rc-manif-firma">
            {window.rcVerBienvenida && (
              <button type="button" className="rc-manif-beta"
                onClick={() => { onCerrar(); setTimeout(() => window.rcVerBienvenida && window.rcVerBienvenida(), 60); }}>
                ▶ Ver la bienvenida BETA 1.1
              </button>
            )}
            <p>Att: Mg. Andersson Cortés y Res Cogitans</p>
            <img src="logo-a-cogitas.png" alt="" />
          </div>
        </div>

        <div className="rc-manif-licencia">
          <RcIconosLicencia claro />
          <p>
            Esta obra está bajo la licencia{' '}
            <a href={RC_LICENCIA.url} target="_blank" rel="noopener license">{RC_LICENCIA.nombre}</a>
            {' '}(Atribución · No comercial · Sin obras derivadas).{' '}
            <a href="terminos.html" target="_blank" rel="noopener">Términos y Condiciones</a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ResCogitasFooter() {
  const [abierto, setAbierto] = React.useState(false);

  // Bloquear scroll del fondo cuando la ventana está abierta.
  React.useEffect(() => {
    if (!abierto) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onEsc); };
  }, [abierto]);

  return (
    <React.Fragment>
      <style>{RC_MANIFIESTO_CSS}</style>
      {/* Pie de página fijo */}
      <footer className="rc-pie" onClick={() => setAbierto(true)} title="Conoce Res Cogitans">
        <span>Creado por <strong>Andersson Cortes</strong> y <strong>Res Cogitans</strong><span className="rc-pie-info">ⓘ</span></span>
        <a className="rc-pie-licencia" href={RC_LICENCIA.url} target="_blank" rel="noopener license"
          onClick={(e) => e.stopPropagation()} title="Licencia Creative Commons Atribución-NoComercial-SinDerivadas 4.0">
          <span>Licencia {RC_LICENCIA.nombre}</span>
          <RcIconosLicencia />
        </a>
      </footer>

      {abierto && <ResCogitasManifiesto onCerrar={() => setAbierto(false)} />}
    </React.Fragment>
  );
}

Object.assign(window, { ResCogitasFooter });
