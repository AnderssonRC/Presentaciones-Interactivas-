/* ruleta.jsx — Ruleta de estudiantes del Modo Vigía (SVG, sin librerías).
   <RuletaEstudiantes nombres usados onElegido titulo />
     · nombres  : lista de estudiantes
     · usados   : nombres que ya salieron en esta presentación; no se repiten
                  hasta que hayan salido todos (luego empieza otra vuelta)
     · onElegido: avisa el nombre elegido al terminar de girar */

const RULETA_COLORES = ['#FF8A00', '#1E5BFF', '#FF5E00', '#4D94FF', '#FFB000', '#2F3DFF'];
const RULETA_GIRO_MS = 4600;

function RuletaEstudiantes({ nombres, usados, onElegido, titulo }) {
  const lista = (nombres || []).map((n) => (n || '').trim()).filter(Boolean);
  const n = lista.length;
  const [rot, setRot] = React.useState(0);
  const [girando, setGirando] = React.useState(false);
  const [elegido, setElegido] = React.useState(null);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  if (!n) return null;
  const a = 360 / n;
  const R = 200;

  const girar = () => {
    if (girando) return;
    // Candidatos: los que aún no han salido; si ya salieron todos, todos.
    const libres = lista.map((x, i) => i).filter((i) => !(usados || []).includes(lista[i]));
    const pool = libres.length ? libres : lista.map((x, i) => i);
    const i = pool[Math.floor(Math.random() * pool.length)];
    // Lleva el centro del gajo i hasta la flecha (arriba), con varias vueltas.
    const destino = -(i * a + a / 2);
    const actual = ((rot % 360) + 360) % 360;
    let delta = (((destino - actual) % 360) + 360) % 360;
    const nueva = rot + 360 * 6 + delta;
    setElegido(null);
    setGirando(true);
    setRot(nueva);
    timer.current = setTimeout(() => {
      setGirando(false);
      setElegido(lista[i]);
      if (onElegido) onElegido(lista[i]);
    }, RULETA_GIRO_MS + 80);
  };

  // Gajo i: de -90 + i·a a -90 + (i+1)·a grados (0° = derecha, sentido horario).
  const punto = (ang, r) => {
    const rad = (ang * Math.PI) / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  };
  const tamTexto = n > 24 ? 11 : n > 16 ? 13 : n > 10 ? 16 : 19;

  return (
    <div className="vg-ruleta">
      {titulo && <div className="vg-ruleta-titulo">{titulo}</div>}
      <div className="vg-ruleta-caja">
        <div className="vg-ruleta-flecha" aria-hidden="true"></div>
        <svg viewBox="-210 -210 420 420" className="vg-ruleta-svg"
          style={{ transform: 'rotate(' + rot + 'deg)', transition: girando ? 'transform ' + RULETA_GIRO_MS + 'ms cubic-bezier(.12,.62,.08,1)' : 'none' }}>
          {lista.map((nombre, i) => {
            const a0 = -90 + i * a, a1 = a0 + a, ac = a0 + a / 2;
            const [x0, y0] = punto(a0, R), [x1, y1] = punto(a1, R);
            const d = n === 1
              ? 'M 0 0 m -' + R + ' 0 a ' + R + ' ' + R + ' 0 1 0 ' + 2 * R + ' 0 a ' + R + ' ' + R + ' 0 1 0 -' + 2 * R + ' 0'
              : 'M 0 0 L ' + x0 + ' ' + y0 + ' A ' + R + ' ' + R + ' 0 ' + (a > 180 ? 1 : 0) + ' 1 ' + x1 + ' ' + y1 + ' Z';
            const color = RULETA_COLORES[i % RULETA_COLORES.length];
            const corto = nombre.length > 14 ? nombre.slice(0, 13) + '…' : nombre;
            const salio = (usados || []).includes(nombre);
            return (
              <g key={i}>
                <path d={d} fill={color} opacity={salio ? 0.45 : 1} stroke="#0B0705" strokeWidth="2" />
                <text transform={'rotate(' + ac + ') translate(' + R * 0.6 + ' 0)'} textAnchor="middle" dominantBaseline="middle"
                  fill="#0B0705" fontSize={tamTexto} fontWeight="800" fontFamily="var(--font-display)">{corto}</text>
              </g>
            );
          })}
          <circle r="34" fill="#0B0705" stroke="#FF8A00" strokeWidth="4" />
        </svg>
      </div>
      {elegido ? (
        <div className="vg-ruleta-elegido" key={elegido}>{elegido}</div>
      ) : (
        <button className="vg-btn vg-btn-ruleta" onClick={girar} disabled={girando}>
          {girando ? 'Girando…' : 'Girar la ruleta'}
        </button>
      )}
      {elegido && !girando && (
        <button className="vg-btn-texto" onClick={girar}>Girar otra vez</button>
      )}
    </div>
  );
}

Object.assign(window, { RuletaEstudiantes });
