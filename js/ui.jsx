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

function ThemeToggle({ theme, setTheme }) {
  const dark = theme === 'tonos';
  return (
    <button className="btn btn-sm" onClick={() => setTheme(dark ? 'dia' : 'tonos')}
      title="Cambiar entre modo día y modo tonos (para aulas con mucha luz)">
      <Icon name={dark ? 'sol' : 'luna'} size={16} />
      {dark ? 'Modo día' : 'Modo tonos'}
    </button>
  );
}

/* Escala un lienzo 1920x1080 al ancho disponible */
function ScaledSlide({ children, maxH }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    // Medimos el ANCHO del contenedor padre (cuyo ancho NO depende de `scale`).
    // Observar el propio .slide-stagebox creaba un bucle: al fijar su height
    // desde `scale`, su geometría cambiaba, el ResizeObserver volvía a disparar
    // y el redondeo sub-pixel de Chrome hacía oscilar `scale` (la "vibración").
    const medible = el.parentElement || el;
    let rafId = 0;
    let ultimo = -1;
    const aplicar = () => {
      rafId = 0;
      let s = medible.clientWidth / 1920;
      if (maxH) s = Math.min(s, maxH / 1080);
      // Ignora cambios sub-pixel: evita re-renders por ruido de redondeo.
      if (Math.abs(s - ultimo) < 0.0005) return;
      ultimo = s;
      setScale(s);
    };
    const update = () => {
      // Coalesce a un solo cálculo por frame.
      if (!rafId) rafId = requestAnimationFrame(aplicar);
    };
    aplicar();
    const ro = new ResizeObserver(update);
    ro.observe(medible);
    return () => { if (rafId) cancelAnimationFrame(rafId); ro.disconnect(); };
  }, [maxH]);
  return (
    <div className="slide-stagebox" ref={boxRef} style={{ height: Math.round(1080 * scale) }}>
      <div className="slide" style={{ transform: `scale(${scale})`, borderRadius: 12 / scale > 60 ? 0 : 12, boxShadow: 'var(--shadow)' }}>
        {children}
      </div>
    </div>
  );
}

/* Diapositiva de contenido = lienzo libre (cajas movibles + media + fondo).
   - En modo editable: se arrastran/seleccionan elementos (props selId/onSelect/onChangeEl).
   - En presentación: solo muestra y reproduce animaciones.
   Plantillas viejas (titulo/texto/imagen) se migran al vuelo con migrarContenido(). */
function ContenidoSlide({ slide, editable, selId, onSelect, onChangeEl, replay, pasoActual, previewOn }) {
  const migrado = migrarContenido(slide);
  return (
    <LienzoLibre slide={migrado} editable={editable}
      selId={selId} onSelect={onSelect} onChangeEl={onChangeEl}
      replay={replay} pasoActual={pasoActual} previewOn={previewOn} />
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
   Crédito "Res Cogitans" — pie de página + tarjeta del manifiesto.

   Pegar este bloque al FINAL de ui.jsx (que ya se carga en index.html).
   Luego montar <ResCogitasFooter /> en App (app.jsx) y en LoginScreen
   (login.jsx). Ver instrucciones al final.

   Los logos deben estar en la RAÍZ del repo (junto a index.html):
     logo-res-cogitas.png   (marca horizontal)
     logo-a-cogitas.png     (monograma "A")
   ============================================================ */

function ResCogitasFooter() {
  const [abierto, setAbierto] = React.useState(false);

  // Bloquear scroll del fondo cuando la tarjeta está abierta.
  React.useEffect(() => {
    if (!abierto) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') setAbierto(false); };
    window.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onEsc); };
  }, [abierto]);

  return (
    <React.Fragment>
      {/* Pie de página fijo */}
      <footer
        onClick={() => setAbierto(true)}
        title="Conoce Res Cogitans"
        style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 80,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '8px 14px', cursor: 'pointer',
          background: 'rgba(11,14,11,.72)', backdropFilter: 'blur(8px)',
          borderTop: '1px solid rgba(255,255,255,.08)',
          color: '#9AA396', fontSize: 12.5, fontWeight: 600,
          fontFamily: 'var(--font-display)',
        }}>
        <span>Creado por <strong style={{ color: '#C7D0C2' }}>Andersson Cortes</strong> y <strong style={{ color: '#C7D0C2' }}>Res Cogitans</strong></span>
        <span style={{ color: '#11F555', fontWeight: 800 }}>ⓘ</span>
      </footer>

      {/* Tarjeta del manifiesto */}
      {abierto && (
        <div
          onClick={() => setAbierto(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9998,
            background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 18, overflowY: 'auto',
          }}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: 620, margin: 'auto',
              background: '#11160F', border: '1px solid #2A2F29', borderRadius: 22,
              padding: '28px 26px 26px', position: 'relative',
              boxShadow: '0 30px 80px -30px rgba(0,0,0,.8)',
            }}>
            {/* Cerrar */}
            <button
              onClick={() => setAbierto(false)} title="Cerrar"
              style={{
                position: 'absolute', top: 14, right: 14,
                width: 38, height: 38, borderRadius: 999, border: 'none', cursor: 'pointer',
                background: '#1C201B', color: '#9AA396', fontSize: 18, fontWeight: 800,
              }}>✕</button>

            {/* Logos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, marginBottom: 18, flexWrap: 'wrap' }}>
              <img src="logoacogitas.png" alt="Res Cogitans"
                style={{ height: 120, width: 'auto', filter: 'invert(1)' }} />
              <img src="logorescogitas.png" alt="Res Cogitans"
                style={{ width: 'min(340px, 70%)', height: 'auto', filter: 'invert(1)' }} />
            </div>

            {/* Manifiesto */}
            <p style={{
              color: '#C7D0C2', fontSize: 15.5, lineHeight: 1.6, textAlign: 'justify',
              margin: '0 0 16px', fontFamily: 'var(--font-body, inherit)',
            }}>
              Res Cogitans es un proyecto que busca reivindicar el arte creador de los docentes, 
              pues son Artesanos en su enseñar. Por esa razón, y sin descanso, se busca crear herramientas 
              digitales, físicas y epistémicas que permitan al docente reivindicarse en su hacer social y político, 
              mostrándose como un sabedor que une intelecto y materialidad (producción real), además de estar autorizado a ejercer bajo su 
              razón intelectual y sus años de experiencia, cualquier tipo de transformación y decisión. Esto revindica al docente como experto 
              de la enseñanza, pues nadie más que él sabe el complejo Arte de Educar. 
            </p>

            <div style={{
              textAlign: 'right', color: '#9AA396', fontSize: 14, fontStyle: 'italic',
              fontFamily: 'var(--font-display)', fontWeight: 600,
            }}>
              Att: Andersson Cortes y Res Cogitans
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

Object.assign(window, { ResCogitasFooter });