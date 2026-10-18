/* Actividad 'encuentraElemento' — código (los datos están en meta.js, en esta misma carpeta).
   Se carga bajo demanda y corre aislado: lo compartido (ActHeader, FichaRun,
   useCountdown, barajar…) viene de js/actividades/comun.jsx. */

/* ---------- Encuentra el elemento ----------
   Una imagen con una o varias zonas correctas (rectángulos en % de la
   imagen, definidos en el editor). Tocar dentro de una zona aún no
   encontrada = acierto (se marca en verde y queda encontrada); tocar fuera
   muestra una "✕" que parpadea (igual que en "Encuentra las diferencias") y
   se puede seguir intentando, sin revelar dónde están las zonas. Se gana al
   encontrar todas. */
function EncuentraElementoRun({ config, tool }) {
  const imagen = config.imagen || '';
  const zonas = Array.isArray(config.zonas) ? config.zonas : (config.zona ? [config.zona] : []);
  const [encontradas, setEncontradas] = React.useState([]); // índices de zonas ya encontradas
  const [fallo, setFallo] = React.useState(null); // {x,y} del último clic fallido (parpadea)
  const falloRef = React.useRef(null);
  React.useEffect(() => () => clearTimeout(falloRef.current), []);

  if (!imagen || !zonas.length) return <FichaRun config={config} tool={tool} />;

  const total = zonas.length;
  const gano = encontradas.length >= total;

  const clic = (e) => {
    if (gano) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    let acierto = -1;
    zonas.forEach((z, i) => {
      if (acierto !== -1 || encontradas.includes(i)) return;
      if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) acierto = i;
    });
    if (acierto !== -1) {
      clearTimeout(falloRef.current);
      setEncontradas((arr) => [...arr, acierto]);
      setFallo(null);
    } else {
      clearTimeout(falloRef.current);
      setFallo({ x, y });
      falloRef.current = setTimeout(() => setFallo(null), 600);
    }
  };
  const reiniciar = () => { clearTimeout(falloRef.current); setEncontradas([]); setFallo(null); };

  return (
    <div className="act-stage" style={{ justifyContent: 'flex-start', paddingTop: 8, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} compact />

      {total > 1 && (
        <div style={{ marginTop: 6, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#9AA396', flexShrink: 0 }}>
          Encontrados: {encontradas.length}/{total}
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 14, width: '100%', overflow: 'hidden' }}>
        <div onClick={clic} style={{
          position: 'relative', maxWidth: '100%', maxHeight: '100%',
          cursor: gano ? 'default' : 'crosshair', borderRadius: 14, overflow: 'hidden', border: '2px solid #2A2F29',
        }}>
          <img src={imagen} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', userSelect: 'none', pointerEvents: 'none' }} alt="" />
          {encontradas.map((i) => {
            const z = zonas[i];
            return (
              <div key={i} style={{
                position: 'absolute', left: z.x + '%', top: z.y + '%', width: z.w + '%', height: z.h + '%',
                border: '5px solid #11F555', borderRadius: 10, boxShadow: '0 0 22px rgba(17,245,85,.7)', pointerEvents: 'none',
              }} />
            );
          })}
          {fallo && !gano && (
            <div style={{
              position: 'absolute', left: fallo.x + '%', top: fallo.y + '%', width: 44, height: 44, marginLeft: -22, marginTop: -22,
              borderRadius: '50%', border: '4px solid #F53711', pointerEvents: 'none', animation: 'fadeUp .3s',
            }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#F53711', fontSize: 28, fontWeight: 800 }}>✕</div>
            </div>
          )}
        </div>
      </div>

      {fallo && !gano && (
        <div className="fade-up" style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, color: '#F53711', flexShrink: 0 }}>
          Incorrecto, sigue intentando.
        </div>
      )}
      {gano && (
        <div className="fade-up" style={{ marginTop: 14, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 32, color: '#11F555', flexShrink: 0 }}>
          {total > 1 ? '🎉 ¡Todos encontrados!' : '🎉 ¡Correcto!'}
        </div>
      )}

      <button className="act-bigbtn" style={{ background: 'transparent', color: '#9AA396', border: '2px solid #2A2F29', fontSize: 20, padding: '8px 24px', marginTop: 8, flexShrink: 0 }}
        onClick={reiniciar}>
        Reiniciar
      </button>
    </div>
  );
}

/* Editor de "Encuentra el elemento": URL de imagen + una zona correcta
   (rectángulo en % de la imagen). Clic en la imagen mueve la zona (queda
   centrada donde se toca); el tamaño se ajusta con los campos de abajo. */
function EncuentraElementoEditor({ current, curIdx, updateSlide }) {
  const cfg = current.config;
  const zonas = Array.isArray(cfg.zonas) ? cfg.zonas : (cfg.zona ? [cfg.zona] : []);
  const [dibujo, setDibujo] = React.useState(null); // rectángulo en vivo mientras se arrastra
  const set = (cambios) => updateSlide(curIdx, { ...current, config: { ...cfg, ...cambios } });
  const setZonas = (nuevas) => set({ zonas: nuevas, zona: undefined });

  const coordsPct = (e, el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
    };
  };

  // Clic simple sobre la imagen = agrega una zona de tamaño estándar
  // centrada en ese punto. Clic y arrastre = dibuja una zona del tamaño
  // que se quiera, además de los campos manuales de abajo.
  const iniciarDibujo = (e) => {
    e.preventDefault();
    const el = e.currentTarget;
    const inicio = coordsPct(e, el);
    let arrastrado = false;

    const mover = (ev) => {
      const cur = coordsPct(ev, el);
      if (Math.abs(cur.x - inicio.x) > 1 || Math.abs(cur.y - inicio.y) > 1) arrastrado = true;
      setDibujo({
        x: Math.min(inicio.x, cur.x), y: Math.min(inicio.y, cur.y),
        w: Math.abs(cur.x - inicio.x), h: Math.abs(cur.y - inicio.y),
      });
    };
    const soltar = (ev) => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', soltar);
      setDibujo(null);
      const cur = coordsPct(ev, el);
      let nueva;
      if (arrastrado) {
        nueva = {
          x: Math.round(Math.min(inicio.x, cur.x) * 10) / 10,
          y: Math.round(Math.min(inicio.y, cur.y) * 10) / 10,
          w: Math.round(Math.abs(cur.x - inicio.x) * 10) / 10,
          h: Math.round(Math.abs(cur.y - inicio.y) * 10) / 10,
        };
        if (nueva.w < 2 || nueva.h < 2) return; // arrastre demasiado pequeño, se ignora
      } else {
        const w = 20, h = 20;
        nueva = {
          x: Math.round(Math.max(0, Math.min(100 - w, inicio.x - w / 2)) * 10) / 10,
          y: Math.round(Math.max(0, Math.min(100 - h, inicio.y - h / 2)) * 10) / 10,
          w, h,
        };
      }
      setZonas([...zonas, nueva]);
    };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', soltar);
  };

  const actualizarZona = (i, cambios) => setZonas(zonas.map((z, j) => (j === i ? { ...z, ...cambios } : z)));
  const borrarZona = (i, ev) => { ev.stopPropagation(); setZonas(zonas.filter((_, j) => j !== i)); };
  const setTam = (i, campo) => (e) => {
    const v = Math.max(2, Math.min(100, Number(e.target.value) || 0));
    actualizarZona(i, { [campo]: v });
  };

  const imgUrl = cfg.imagen || '';

  return (
    <div>
      <div className="field">
        <label>URL de la imagen</label>
        <input type="text" value={imgUrl} onChange={(e) => set({ imagen: e.target.value })} placeholder="https://..." />
      </div>
      {imgUrl ? (
        <React.Fragment>
          <div className="field">
            <label>Zonas correctas ({zonas.length})</label>
            <div style={{ position: 'relative', display: 'inline-block', maxWidth: '100%', border: '2px solid var(--line)', borderRadius: 10, overflow: 'hidden', cursor: 'crosshair', touchAction: 'none' }}
              onPointerDown={iniciarDibujo}>
              <img src={imgUrl} draggable="false" style={{ display: 'block', maxWidth: '100%', maxHeight: 360, userSelect: 'none', WebkitUserDrag: 'none' }} alt="" />
              {zonas.map((z, i) => (
                <div key={i} style={{
                  position: 'absolute', left: z.x + '%', top: z.y + '%', width: z.w + '%', height: z.h + '%',
                  border: '3px solid #11F555', background: 'rgba(17,245,85,.2)', borderRadius: 6,
                }}>
                  <span onPointerDown={(ev) => ev.stopPropagation()} onClick={(ev) => borrarZona(i, ev)} title="Clic para borrar"
                    style={{ position: 'absolute', top: -13, left: -13, width: 26, height: 26, borderRadius: '50%',
                      background: 'rgba(17,245,85,.9)', border: '2px solid #fff', color: '#06140A',
                      display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>{i + 1}</span>
                </div>
              ))}
              {dibujo && (
                <div style={{
                  position: 'absolute', left: dibujo.x + '%', top: dibujo.y + '%', width: dibujo.w + '%', height: dibujo.h + '%',
                  border: '3px dashed #F5C211', background: 'rgba(245,194,17,.2)', borderRadius: 6, pointerEvents: 'none',
                }} />
              )}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>
              Clic sobre la imagen para agregar una zona de tamaño estándar, o arrastra para dibujarla del tamaño que quieras. Puedes agregar varias zonas; el grupo deberá encontrarlas todas. Clic en el número de una zona para borrarla.
            </div>
          </div>
          {zonas.length > 0 && (
            <div className="field">
              <label>Ajustar tamaño manualmente</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {zonas.map((z, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#11F555', color: '#06140A',
                      display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}</span>
                    <label className="lz-mini" style={{ flex: 1 }}>Ancho (%)<input type="number" min="2" max="100" value={z.w} onChange={setTam(i, 'w')} /></label>
                    <label className="lz-mini" style={{ flex: 1 }}>Alto (%)<input type="number" min="2" max="100" value={z.h} onChange={setTam(i, 'h')} /></label>
                    <button type="button" onClick={(ev) => borrarZona(i, ev)} className="lz-del">Eliminar</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </React.Fragment>
      ) : (
        <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}>Pega una URL de imagen arriba para poder ubicar las zonas correctas.</div>
      )}
    </div>
  );
}

Actividades.definir('encuentraElemento', { Run: EncuentraElementoRun, Editor: EncuentraElementoEditor });
