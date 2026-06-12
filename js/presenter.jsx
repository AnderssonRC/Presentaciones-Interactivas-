/* Modo Presentar — pantalla completa para el televisor o video beam */
function Presenter({ pres, onExit }) {
  const [idx, setIdx] = React.useState(0);
  const [scale, setScale] = React.useState(0.5);
  const slides = pres.slides;

  React.useEffect(() => { setIdx(0); }, [pres.id]);

  React.useEffect(() => {
    const update = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') setIdx((i) => Math.min(i + 1, slides.length - 1));
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') setIdx((i) => Math.max(i - 1, 0));
      else if (e.key === 'Escape') onExit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [slides.length, onExit]);

  const slide = slides[Math.min(idx, slides.length - 1)];
  const isAct = slide.type === 'actividad';
  const tool = isAct ? AIP.toolById(slide.tool) : null;
  const Runtime = isAct ? (ActivityRuntimes[slide.tool] || ActivityRuntimes.default) : null;

  return (
    <div className="presenter-overlay" data-screen-label={'Presentar · ' + String(idx + 1).padStart(2, '0')}>
      <div className="presenter-stagewrap">
        <div className="slide" key={slide.id} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${scale})`, transformOrigin: 'center', background: isAct ? '#0B0E0B' : '#FFFFFF', color: isAct ? '#F2F5EF' : '#0B0F0C' }}>
          {isAct
            ? <Runtime config={slide.config} tool={tool} />
            : <ContenidoSlide slide={slide} materia={pres.materia || 'Tema'} accent={pres.color} />}
        </div>
      </div>

      {/* HUD fuera del escenario escalado */}
      <div className="presenter-hud" style={{ top: 18, right: 18 }}>
        <button className="hud-btn" onClick={onExit} title="Salir (Esc)">✕ Salir</button>
      </div>
      <div className="presenter-hud" style={{ bottom: 18, left: 18, color: 'rgba(255,255,255,.55)', fontSize: 14, fontWeight: 600 }}>
        <span style={{ fontFamily: 'var(--font-display)' }}>{pres.tema}</span>
        <span style={{ opacity: .6 }}>·</span>
        <span>{idx + 1} / {slides.length}</span>
      </div>
      <div className="presenter-hud" style={{ bottom: 18, right: 18 }}>
        <button className="hud-btn" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} style={{ opacity: idx === 0 ? .35 : 1 }}>←</button>
        <button className="hud-btn" onClick={() => setIdx(Math.min(slides.length - 1, idx + 1))} disabled={idx === slides.length - 1} style={{ opacity: idx === slides.length - 1 ? .35 : 1 }}>→</button>
      </div>
    </div>
  );
}

Object.assign(window, { Presenter });
