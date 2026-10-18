/* ruleta.jsx — Ruleta de estudiantes del Modo Vigía (SVG, sin librerías).
   <RuletaEstudiantes nombres usados onElegido titulo />
     · nombres  : lista de estudiantes
     · usados   : nombres que ya salieron en esta presentación; no se repiten
                  hasta que hayan salido todos (luego empieza otra vuelta)
     · onElegido: avisa el nombre elegido al terminar de girar */

const RULETA_COLORES = ['#FF8A00', '#1E5BFF', '#FF5E00', '#4D94FF', '#FFB000', '#2F3DFF'];
const RULETA_GIRO_MS = 4600;

/* ---------- Nombres cortos para la ruleta ----------
   La lista puede venir como "APELLIDOS NOMBRES" (típico de las listas del
   colegio: YAÑEZ MEDINA MANUELA) o "Nombres Apellidos" (Ana María López).
   `orden` ('apellidos' | 'nombres') lo elige el docente en el editor.
   Con 3 o más palabras se asumen dos apellidos; con 2, uno y uno.
   En la ruleta se muestra solo el nombre ("Manuela"); si dos estudiantes
   quedan con el mismo, se les agrega la inicial del apellido ("Juan P."). */
function tituloCaso(p) {
  // Solo se cambia lo que viene TODO EN MAYÚSCULAS ("MANUELA" -> "Manuela").
  return p === p.toUpperCase() ? p.charAt(0) + p.slice(1).toLowerCase() : p;
}
function partesNombre(completo, orden) {
  const w = String(completo || '').trim().split(/\s+/).filter(Boolean).map(tituloCaso);
  if (w.length <= 1) return { nombres: w.join(' '), apellidos: '' };
  const nAp = w.length >= 3 ? 2 : 1;
  return orden === 'nombres'
    ? { nombres: w.slice(0, w.length - nAp).join(' '), apellidos: w.slice(w.length - nAp).join(' ') }
    : { nombres: w.slice(nAp).join(' '), apellidos: w.slice(0, nAp).join(' ') };
}
function etiquetasRuleta(lista, orden) {
  const partes = lista.map((x) => partesNombre(x, orden));
  const base = partes.map((p) => p.nombres || p.apellidos);
  return base.map((et, i) => {
    const repetido = base.some((o, j) => j !== i && o === et);
    return repetido && partes[i].apellidos ? et + ' ' + partes[i].apellidos.charAt(0) + '.' : et;
  });
}
// Para anunciar al elegido: nombres + primer apellido ("Manuela Yañez").
function nombreAnuncio(completo, orden) {
  const p = partesNombre(completo, orden);
  return [p.nombres, p.apellidos.split(' ')[0]].filter(Boolean).join(' ');
}

/* Props extra para controlarla desde fuera (la usa la tarjeta de Presentar,
   que pone "Girar otra vez" debajo del texto y no bajo la ruleta):
     · giroExterno : número; cada vez que cambia, la ruleta gira
     · onEstado    : avisa { girando, elegido } cuando cambian
     · girarOtraFuera: true = no mostrar aquí el "Girar otra vez" */
function RuletaEstudiantes({ nombres, usados, onElegido, titulo, orden, giroExterno, onEstado, girarOtraFuera }) {
  const lista = (nombres || []).map((n) => (n || '').trim()).filter(Boolean);
  const etiquetas = etiquetasRuleta(lista, orden);
  const n = lista.length;
  const [rot, setRot] = React.useState(0);
  const [girando, setGirando] = React.useState(false);
  const [elegido, setElegido] = React.useState(null);
  const timer = React.useRef(null);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  // Giro pedido desde fuera (se ignora el valor inicial).
  const girarRef = React.useRef(null);
  const primerGiroExterno = React.useRef(true);
  React.useEffect(() => {
    if (primerGiroExterno.current) { primerGiroExterno.current = false; return; }
    if (girarRef.current) girarRef.current();
  }, [giroExterno]);
  React.useEffect(() => { if (onEstado) onEstado({ girando, elegido }); }, [girando, elegido]);

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
  girarRef.current = girar;

  // Gajo i: de -90 + i·a a -90 + (i+1)·a grados (0° = derecha, sentido horario).
  const punto = (ang, r) => {
    const rad = (ang * Math.PI) / 180;
    return [r * Math.cos(rad), r * Math.sin(rad)];
  };
  // Letra según cuántos gajos hay y qué tan largo es el nombre más largo.
  const largo = Math.max(...etiquetas.map((e) => e.length), 1);
  const tamTexto = Math.max(10, Math.min(n > 24 ? 13 : n > 16 ? 15 : n > 10 ? 18 : 22, Math.floor(150 / largo)));

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
            const et = etiquetas[i];
            const corto = et.length > 16 ? et.slice(0, 15) + '…' : et;
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
      {/* Espacio de alto fijo: el botón y el nombre elegido se turnan aquí sin
          cambiar la altura de la tarjeta (si cambiara, la tarjeta "saltaría"). */}
      <div className="vg-ruleta-resultado">
        {elegido ? (
          <div className="vg-ruleta-elegido" key={elegido}>{nombreAnuncio(elegido, orden)}</div>
        ) : (
          <button className="vg-btn vg-btn-ruleta" onClick={girar} disabled={girando}>
            {girando ? 'Girando…' : 'Girar la ruleta'}
          </button>
        )}
      </div>
      {!girarOtraFuera && (
        <button className="vg-btn-texto" onClick={girar}
          style={{ visibility: elegido && !girando ? 'visible' : 'hidden' }}>Girar otra vez</button>
      )}
    </div>
  );
}

Object.assign(window, { RuletaEstudiantes, etiquetasRuleta, nombreAnuncio });
