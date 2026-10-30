/* presentar-capibara.jsx — Modo Capibara (Modo Vigía, público infantil).
   Estilo de cuento en acuarela (inspirado en Studio Ghibli). Mismas reglas
   del Modo Jaguar: usa SU sesión de equipos (presentar-jaguar.jsx: número de
   equipos del primer desafío, estudiantes repartidos, puntos, enlace). Aquí
   los puntos son PASOS: cada equipo sube por su camino en la montaña hasta
   llegar a Jomu (meta = `sesion.meta`, se elige en la historia del editor).

   «Historia: ¡Rescata a Jomu!» (cp-historia), tres fases:
     1. historia: textos e imágenes (HISTORIA_JOMU). El último paso tiene el
        botón «¿Listos aventureros de las llanuras?».
     2. grupos: «¡Busca tu equipo!» con los estudiantes de cada equipo.
     3. montana: la montaña con un camino (y un emoji) por equipo.
   Se avanza con clic, Espacio, Enter o →; se vuelve con ←.

   La montaña (`MontanaCapibara`) anima cada emoji desde donde se vio la
   última vez (`sesion.montanaVista`) hasta sus pasos actuales: así, al
   terminar cada actividad, se ve cuánto se acercó cada equipo. También se
   abre en cualquier momento («🏔 Ver la montaña», orden 'cp-montana').

   Mando: el paso actual se publica en el estado espejo (`useCapibaraEstado`,
   lo lee mando.jsx como `capibara`); órdenes `cp-anterior`, `cp-siguiente`,
   `cp-listos`, `cp-resortear` y `cp-montana`. */

const IMAGENES_CAPIBARA = ['capibara-corriendo.jpg', 'capibara-preso.jpg', 'capibara-preso1.jpg'];
const JOMU_IMG = 'capibara-preso1.jpg';

// La historia. antes: línea que aparece primero (más pequeña) · grito: tiembla.
const HISTORIA_JOMU = [
  { tipo: 'texto', antes: 'Jomu…', texto: '¡Corre!!', grito: true },
  { tipo: 'texto', texto: 'Ese fue el silbido que el capibara no alcanzó a escuchar…' },
  { tipo: 'imagen', src: 'capibara-corriendo.jpg', alt: 'Jomu, el capibara, corriendo' },
  { tipo: 'texto', texto: 'De su cuello cae un lazo, y Jomu queda preso de dos cazadores.' },
  { tipo: 'texto', antes: 'Horas después…', texto: 'Se encuentra en una jaula, lejos, muy lejos del arroyo, de su preciada agua…' },
  { tipo: 'imagen', src: 'capibara-preso.jpg', alt: 'Jomu, preso en una jaula' },
  { tipo: 'mision', src: 'capibara-preso1.jpg', alt: 'Jomu, triste, detrás de los barrotes',
    texto: 'Tu misión: liberarlo con tu inteligencia y rapidez.', boton: '¿Listos aventureros de las llanuras?' },
];
const CAPIBARA_SALIDA_MS = 900;

/* Equipos con colores de acuarela (legibles sobre crema) y un animalito cada
   uno. Mismo orden que COLORES_EQUIPOS del Jaguar (Verde, Azul, Amarillo…). */
const PALETA_CAPIBARA = [
  ['#3E9B4F', '🐸'], ['#2F78C4', '🦜'], ['#C99400', '🐝'], ['#139485', '🐢'], ['#6F9A16', '🐛'],
  ['#3A9CCB', '🦋'], ['#D9692A', '🦊'], ['#C94F92', '🦩'], ['#7D5CC4', '🦉'], ['#C9403A', '🐞'],
];
function equiposCapibara(equipos) {
  return (equipos || []).map((e, i) => {
    const [color, emoji] = PALETA_CAPIBARA[i % PALETA_CAPIBARA.length];
    return { ...e, color, emoji, corto: String(e.nombre || '').replace(/^Equipo\s+/i, '') };
  });
}

/* Estado espejo de la historia (para el mando del celular). */
let historiaCapibara = null;   // null | { fase, paso, total, final }
const oyentesCapibara = new Set();
function fijarHistoriaCapibara(v) { historiaCapibara = v; oyentesCapibara.forEach((f) => f(v)); }
function useCapibaraEstado() {
  const [v, setV] = React.useState(historiaCapibara);
  React.useEffect(() => {
    oyentesCapibara.add(setV);
    setV(historiaCapibara);
    return () => { oyentesCapibara.delete(setV); };
  }, []);
  return v;
}
// «🏔 Ver la montaña» encima de la presentación (abre o cierra).
function capibaraVerMontana(v) { cambiarJaguar((s) => ({ verMontana: typeof v === 'boolean' ? v : !s.verMontana })); }

/* Elige el juego del Modo Capibara según el tipo. */
function CapibaraActivacion(props) {
  if (props.a && props.a.tipo === 'cp-muro' && window.MuroInfernal) return <MuroInfernal {...props} />;   // capibara-muro.jsx
  if (props.a && props.a.tipo === 'cp-jungla' && window.JunglaCapibara) return <JunglaCapibara {...props} />;   // capibara-jungla.jsx
  if (props.a && props.a.tipo === 'cp-dedos' && window.DedosVeloces) return <DedosVeloces {...props} />;   // capibara-dedos.jsx
  if (props.a && props.a.tipo === 'cp-espejo' && window.EspejoEnVivo) return <EspejoEnVivo {...props} />;   // capibara-espejo.jsx
  if (props.a && props.a.tipo === 'cp-semaforo' && window.SemaforoCapibara) return <SemaforoCapibara {...props} />;   // capibara-semaforo.jsx
  if (props.a && props.a.tipo === 'cp-vf' && window.VerdaderoFalsoMovimiento) return <VerdaderoFalsoMovimiento {...props} />;   // capibara-vf.jsx
  return <HistoriaCapibara {...props} />;
}

/* Texto que aparece palabra por palabra, suave, como en un cuento. */
function PalabrasCuento({ texto, retraso = 0, paso = 0.11 }) {
  return String(texto).split(' ').map((p, i) => (
    <span key={i} className="vg-cp-palabra" style={{ animationDelay: (retraso + i * paso).toFixed(2) + 's' }}>{p}{' '}</span>
  ));
}

/* Luciérnagas / semillas que flotan (decoración de las tarjetas de texto). */
function LucesCapibara({ n = 14 }) {
  const luces = React.useMemo(() => Array.from({ length: n }, () => ({
    x: Math.random() * 100, y: 40 + Math.random() * 60, d: 6 + Math.random() * 8, r: Math.random() * 6, s: 3 + Math.random() * 5,
  })), [n]);
  return (
    <div className="vg-cp-luces" aria-hidden="true">
      {luces.map((l, i) => (
        <span key={i} style={{ left: l.x + '%', top: l.y + '%', width: l.s, height: l.s, animationDuration: l.d + 's', animationDelay: -l.r + 's' }}></span>
      ))}
    </div>
  );
}

function HistoriaCapibara({ a, estudiantes, onContinuar }) {
  const total = HISTORIA_JOMU.length;
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const sesion = useJaguarEstado();
  // Equipos: los de la sesión; si aún no hay, se reparten aquí (como el Jaguar).
  const n = Math.max(2, Math.min(PALETA_CAPIBARA.length, jaguarSesion().n || (a && a.equipos) || 2));
  const [provisional] = React.useState(() => jaguarSesion().equipos || jaguarRepartir(nombres, n));
  const equipos = sesion.equipos || provisional;
  React.useEffect(() => {
    if (!jaguarSesion().equipos) cambiarJaguar(() => ({ equipos: provisional }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [fase, setFase] = React.useState('historia');   // 'historia' | 'grupos' | 'montana'
  const [paso, setPaso] = React.useState(0);
  const [saliendo, setSaliendo] = React.useState(false);
  const final = paso === total - 1;
  // Al formar los equipos, la sesión queda iniciada (aparece el marcador de pasos).
  React.useEffect(() => { if (fase !== 'historia') jaguarIniciar(); }, [fase]);

  const salir = () => setSaliendo(true);
  const listos = () => setFase('grupos');
  const avanzar = () => {
    if (saliendo) return;
    if (fase === 'historia') { if (paso < total - 1) setPaso(paso + 1); else listos(); }
    else if (fase === 'grupos') setFase('montana');
    else salir();
  };
  const atras = () => {
    if (saliendo) return;
    if (fase === 'historia') setPaso(Math.max(0, paso - 1));
    else if (fase === 'grupos') setFase('historia');
    else setFase('grupos');
  };
  const resortear = () => { if (nombres.length) jaguarRehacer(nombres); };

  // Al terminar: un fundido y sigue la presentación.
  React.useEffect(() => {
    if (!saliendo) return undefined;
    const t = setTimeout(onContinuar, CAPIBARA_SALIDA_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saliendo]);

  // El celular ve en qué fase y paso va la historia.
  React.useEffect(() => { fijarHistoriaCapibara({ fase, paso, total, final }); }, [fase, paso]);   // eslint-disable-line
  React.useEffect(() => () => fijarHistoriaCapibara(null), []);

  // Órdenes del mando (los mismos botones de la pantalla).
  useOrdenMando((o) => {
    if (o.accion === 'cp-siguiente' || o.accion === 'continuar' || o.accion === 'reto-terminar') avanzar();
    else if (o.accion === 'cp-anterior') atras();
    else if (o.accion === 'cp-listos') listos();
    else if (o.accion === 'cp-resortear' && fase === 'grupos') resortear();
  });

  // Teclado: Espacio / Enter / → avanzan; ← vuelve.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|button/i.test(e.target.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); avanzar(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); atras(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  let contenido;
  if (fase === 'grupos') {
    contenido = (
      <div key="grupos" className="vg-cp-grupos">
        <LucesCapibara n={10} />
        <div className="vg-cp-grupos-caja">
          <div className="vg-cp-kicker">🌿 Modo Capibara · {equipos.length} equipos</div>
          <h1 className="vg-cp-titulo">¡Busca tu equipo!</h1>
          <div className="vg-cp-grupos-lista">
            <ListaGruposJaguar equipos={equiposCapibara(equipos).map((e) => ({ ...e, nombre: e.emoji + ' ' + e.nombre }))} />
          </div>
        </div>
        <div className="vg-cp-acciones">
          {nombres.length > 0 && <button type="button" className="vg-cp-btn suave" onClick={resortear} title="Repartir de nuevo a los estudiantes (al azar)">🔀 Volver a sortear</button>}
          <button type="button" className="vg-cp-btn" onClick={avanzar}>Ver el camino hacia Jomu ›</button>
        </div>
      </div>
    );
  } else if (fase === 'montana') {
    contenido = (
      <div key="montana" className="vg-cp-escena-montana">
        <MontanaCapibara equipos={equipos} meta={sesion.meta} />
        <div className="vg-cp-acciones sobre">
          <button type="button" className="vg-cp-btn" onClick={salir}>🌿 ¡A la aventura!</button>
        </div>
      </div>
    );
  } else {
    const e = HISTORIA_JOMU[paso];
    if (e.tipo === 'texto') {
      const retraso = e.antes ? (e.grito ? 1.1 : 1.4) : 0.3;
      contenido = (
        <div key={paso} className={'vg-cp-texto' + (e.grito ? ' grito' : '')} onClick={avanzar}>
          <LucesCapibara />
          <div className="vg-cp-texto-caja">
            {e.antes && <p className="vg-cp-antes"><PalabrasCuento texto={e.antes} retraso={0.2} paso={0.25} /></p>}
            <p className="vg-cp-frase">{e.grito
              ? <span className="vg-cp-palabra vg-cp-grito" style={{ animationDelay: retraso + 's' }}>{e.texto}</span>
              : <PalabrasCuento texto={e.texto} retraso={retraso} />}</p>
          </div>
        </div>
      );
    } else if (e.tipo === 'imagen') {
      contenido = (
        <div key={paso} className="vg-cp-escena" onClick={avanzar}>
          <img className="vg-cp-img vg-proyectado-doc" src={e.src} alt={e.alt} draggable="false" />
          <div className="vg-cp-vineta" aria-hidden="true"></div>
        </div>
      );
    } else {
      contenido = (
        <div key={paso} className="vg-cp-escena mision">
          <img className="vg-cp-img vg-proyectado-doc" src={e.src} alt={e.alt} draggable="false" />
          <div className="vg-cp-mision">
            <p className="vg-cp-mision-texto"><PalabrasCuento texto={e.texto} retraso={0.5} /></p>
            <button type="button" className="vg-cp-listos" onClick={listos}>
              <span className="hoja" aria-hidden="true">🌿</span> {e.boton}
            </button>
          </div>
        </div>
      );
    }
  }

  // Puntos de avance: los pasos de la historia + equipos + montaña.
  const posicion = fase === 'historia' ? paso : fase === 'grupos' ? total : total + 1;
  return (
    <div className={'vg-cp fase-' + fase + (saliendo ? ' saliendo' : '')} role="dialog" aria-label="Modo Capibara: la historia de Jomu">
      {contenido}
      <div className="vg-cp-nav">
        <button type="button" onClick={atras} disabled={fase === 'historia' && paso === 0} title="Anterior (←)">‹</button>
        <span className="vg-cp-puntos" aria-label={'Paso ' + (posicion + 1) + ' de ' + (total + 2)}>
          {Array.from({ length: total + 2 }, (_, i) => <span key={i} className={i === posicion ? 'on' : i < posicion ? 'visto' : ''}></span>)}
        </span>
        <button type="button" onClick={avanzar} disabled={fase === 'historia' && final} title="Siguiente (Espacio o →)">›</button>
      </div>
    </div>
  );
}

/* ======================= LA MONTAÑA =======================
   Un camino por equipo (sale de abajo y sube serpenteando hasta Jomu, en la
   cima). Cada camino tiene `meta` pasos marcados y el emoji del equipo. */
const MONTANA_ANIM_MS = 2400;
const ARBOLES_MONTANA = [[95, 735, 1], [215, 665, .8], [300, 770, 1.15], [1305, 690, .85], [1430, 640, .75], [1515, 760, 1.1], [520, 455, .6], [1085, 470, .65]];
function caminoMontana(i, n) {
  const x0 = 170 + 1260 * (i + 0.5) / n;
  const ex = 800 + (i - (n - 1) / 2) * 22;
  const mx = x0 + (ex - x0) * 0.45;
  return 'M ' + x0 + ' 880 C ' + (x0 + 70) + ' 800, ' + (mx - 130) + ' 700, ' + mx + ' 610 S ' + (ex + 110) + ' 400, ' + ex + ' 292';
}
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function MontanaCapibara({ equipos, meta }) {
  const eq = equiposCapibara(equipos);
  const n = eq.length;
  const metaN = Math.max(1, meta || VigiaTipos.META_CAPIBARA);
  const fr = (p) => Math.max(0, Math.min(1, (p || 0) / metaN));
  const destino = eq.map((e) => fr(e.puntos));
  // Desde dónde parte cada emoji: donde se vio la montaña la última vez.
  const [desde] = React.useState(() => { const v = jaguarSesion().montanaVista || []; return eq.map((_, i) => fr(v[i])); });
  const refs = React.useRef([]);
  const [marcas, setMarcas] = React.useState(null);   // [[{x, y}, …meta+1], …] por camino
  const [t, setT] = React.useState(0);

  // Las marcas de cada paso sobre su camino (se miden en el SVG ya pintado).
  React.useEffect(() => {
    setMarcas(eq.map((_, i) => {
      const p = refs.current[i];
      if (!p) return [];
      const L = p.getTotalLength();
      return Array.from({ length: metaN + 1 }, (_, k) => { const q = p.getPointAtLength(L * k / metaN); return { x: q.x, y: q.y }; });
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [n, metaN]);

  // Avance: cada emoji sube (o baja) desde donde estaba hasta sus pasos de ahora.
  React.useEffect(() => {
    if (!marcas) return undefined;
    let raf = 0, vivo = true;
    const inicio = performance.now() + 700;
    const cuadro = (ahora) => {
      if (!vivo) return;
      const x = Math.max(0, Math.min(1, (ahora - inicio) / MONTANA_ANIM_MS));
      setT(x);
      if (x < 1) raf = requestAnimationFrame(cuadro);
      else cambiarJaguar((s) => ({ montanaVista: (s.equipos || []).map((e) => e.puntos || 0) }));
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marcas]);

  const posicion = (i) => {
    const p = refs.current[i];
    if (!p || !marcas) return null;
    const f = desde[i] + (destino[i] - desde[i]) * suave(t);
    const q = p.getPointAtLength(p.getTotalLength() * f);
    return { x: q.x, y: q.y };
  };
  const moviendo = (i) => t > 0 && t < 1 && desde[i] !== destino[i];

  return (
    <div className="vg-cp-montana">
      <div className="vg-cp-montana-cabeza">
        <h2 className="vg-cp-titulo">El camino hacia Jomu</h2>
        <p>Cada reto superado acerca a tu equipo un paso más.</p>
      </div>
      <svg className="vg-cp-montana-svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img"
        aria-label={'Montaña con ' + n + ' caminos hacia Jomu'}>
        <defs>
          <linearGradient id="cpMonte" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#A9CF8C" /><stop offset=".55" stopColor="#77AC63" /><stop offset="1" stopColor="#4C8546" />
          </linearGradient>
          <linearGradient id="cpMonteAtras" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#C4DDD2" /><stop offset="1" stopColor="#97BFAE" />
          </linearGradient>
          <clipPath id="cpJomu"><circle cx="800" cy="170" r="74" /></clipPath>
        </defs>
        {/* Sol y nubes */}
        <circle cx="1340" cy="135" r="62" fill="#FFF3C4" opacity=".95" />
        <circle cx="1340" cy="135" r="92" fill="#FFF3C4" opacity=".28" />
        <g className="vg-cp-nube" fill="#FFFFFF" opacity=".88"><ellipse cx="250" cy="150" rx="95" ry="34" /><ellipse cx="310" cy="128" rx="62" ry="38" /><ellipse cx="200" cy="138" rx="50" ry="28" /></g>
        <g className="vg-cp-nube lenta" fill="#FFFFFF" opacity=".8"><ellipse cx="1120" cy="245" rx="80" ry="26" /><ellipse cx="1165" cy="228" rx="52" ry="30" /></g>
        {/* Montañas */}
        {/* (Se salen del recuadro a propósito: en pantallas más anchas o altas cubren los bordes.) */}
        <path d="M-700 760 Q -300 560 0 640 Q 180 470 360 420 Q 470 390 560 470 L 560 1400 L -700 1400 Z" fill="url(#cpMonteAtras)" />
        <path d="M1040 470 Q 1180 360 1300 400 Q 1470 450 1600 560 Q 1900 520 2300 720 L 2300 1400 L 1040 1400 Z" fill="url(#cpMonteAtras)" />
        <path d="M-700 1400 L -700 900 Q -300 840 0 770 Q 230 650 420 520 Q 610 340 755 222 Q 800 186 845 222 Q 990 340 1180 520 Q 1370 650 1600 770 Q 1900 840 2300 900 L 2300 1400 Z" fill="url(#cpMonte)" />
        <path d="M712 258 Q 760 210 800 196 Q 840 210 888 258 Q 850 248 820 262 Q 800 246 778 262 Q 748 248 712 258 Z" fill="#C9B79A" opacity=".75" />
        {/* Árboles redondos */}
        {ARBOLES_MONTANA.map(([x, y, s], i) => (
          <g key={i} transform={'translate(' + x + ' ' + y + ') scale(' + s + ')'}>
            <rect x="-6" y="0" width="12" height="34" rx="4" fill="#7A5634" />
            <circle cx="0" cy="-14" r="34" fill="#4F8E47" /><circle cx="-14" cy="-24" r="16" fill="#6FAE5E" opacity=".9" />
          </g>
        ))}
        {/* Caminos (uno por equipo) y sus pasos */}
        {eq.map((e, i) => <path key={'b' + i} d={caminoMontana(i, n)} fill="none" stroke="#FFF8E7" strokeWidth="20" strokeLinecap="round" opacity=".88" />)}
        {eq.map((e, i) => (
          <path key={'c' + i} ref={(el) => { refs.current[i] = el; }} d={caminoMontana(i, n)} fill="none"
            stroke={e.color} strokeWidth="5" strokeLinecap="round" strokeDasharray="2 14" opacity=".85" />
        ))}
        {marcas && marcas.map((ps, i) => ps.slice(1, -1).map((q, k) => (
          <circle key={i + '-' + k} cx={q.x} cy={q.y} r="6.5" fill={k + 1 <= (eq[i].puntos || 0) ? eq[i].color : '#FFF8E7'} stroke={eq[i].color} strokeWidth="3" />
        )))}
        {marcas && marcas.map((ps, i) => ps[0] && <circle key={'s' + i} cx={ps[0].x} cy={ps[0].y} r="15" fill={eq[i].color} stroke="#FFF8E7" strokeWidth="4" />)}
        {/* Jomu en la cima, tras los barrotes */}
        <circle cx="800" cy="170" r="84" fill="#FBF3E1" stroke="#6B4A2B" strokeWidth="6" />
        <image href={JOMU_IMG} x="660" y="96" width="280" height="153" clipPath="url(#cpJomu)" preserveAspectRatio="xMidYMid slice" />
        <g clipPath="url(#cpJomu)" stroke="#2E2116" strokeWidth="6" opacity=".7">
          {[750, 784, 816, 850].map((x) => <line key={x} x1={x} y1="90" x2={x} y2="250" />)}
        </g>
        <text x="800" y="76" textAnchor="middle" className="vg-cp-jomu">Jomu</text>
        {/* Los equipos (emoji en su color) */}
        {eq.map((e, i) => {
          const q = posicion(i);
          if (!q) return null;
          const llego = (e.puntos || 0) >= metaN && t >= 1;
          return (
            <g key={'e' + i} transform={'translate(' + q.x.toFixed(1) + ' ' + q.y.toFixed(1) + ')'}>
              <g className={'vg-cp-ficha' + (moviendo(i) ? ' camina' : '') + (llego ? ' llego' : '')}>
                <circle r="35" fill="#FFFDF6" stroke={e.color} strokeWidth="7" />
                <text y="2" textAnchor="middle" dominantBaseline="middle" fontSize="40">{e.emoji}</text>
              </g>
            </g>
          );
        })}
      </svg>
      <div className="vg-cp-leyenda">
        {eq.map((e, i) => (
          <span key={i} className={'vg-cp-chip' + ((e.puntos || 0) >= metaN ? ' llego' : '')} style={{ '--c': e.color }}>
            <span className="emo" aria-hidden="true">{e.emoji}</span>
            <strong>{e.corto}</strong>
            <small>{(e.puntos || 0) >= metaN ? '¡Llegó hasta Jomu!' : Math.min(e.puntos || 0, metaN) + ' / ' + metaN + ' pasos'}</small>
          </span>
        ))}
      </div>
    </div>
  );
}

/* «🏔 Ver la montaña» en cualquier momento (encima de todo). Esc, «Cerrar» o
   el celular (orden 'cp-montana') la cierran. */
function PantallaMontanaCapibara() {
  const s = useJaguarEstado();
  const abierta = !!(s.verMontana && s.iniciado && s.equipos);
  React.useEffect(() => {
    if (!abierta) return undefined;
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); capibaraVerMontana(false); } };
    window.addEventListener('keydown', esc, true);
    return () => window.removeEventListener('keydown', esc, true);
  }, [abierta]);
  if (!abierta) return null;
  return (
    <div className="vg-cp vg-cp-capa" role="dialog" aria-label="La montaña: el camino hacia Jomu">
      <MontanaCapibara equipos={s.equipos} meta={s.meta} />
      <div className="vg-cp-acciones sobre">
        <button type="button" className="vg-cp-btn" onClick={() => capibaraVerMontana(false)}>Cerrar</button>
      </div>
    </div>
  );
}

/* Marcador del Modo Capibara (arriba a la izquierda): pasos de cada equipo
   con − / +, «Ver equipos» y «Ver la montaña». */
function MarcadorCapibara() {
  const s = useJaguarEstado();
  const [abierto, setAbierto] = React.useState(false);
  if (!s.iniciado || !s.equipos) return null;
  const eq = equiposCapibara(s.equipos);
  const meta = s.meta || VigiaTipos.META_CAPIBARA;
  return (
    <div className={'vg-marcador vg-marcador-capibara' + (abierto ? ' abierto' : '')}>
      <button className="vg-marcador-chip" onClick={() => setAbierto((v) => !v)} title="Pasos de cada equipo (Modo Capibara)">
        <span className="vg-cp-chip-ico" aria-hidden="true">🏔</span>
        {eq.map((e, i) => <span key={i} className="vg-marcador-mini" style={{ '--c': e.color }}>{e.emoji} {e.puntos}</span>)}
      </button>
      {abierto && (
        <div className="vg-marcador-panel">
          <div className="vg-marcador-titulo">Pasos hacia Jomu · meta {meta}</div>
          {eq.map((e, i) => (
            <div key={i} className="vg-marcador-fila" style={{ '--c': e.color }}>
              <span className="vg-marcador-nombre">{e.emoji} {e.corto}</span>
              <button onClick={() => jaguarPunto(i, -1)} disabled={!e.puntos} aria-label="Quitar un paso">−</button>
              <b>{e.puntos}</b>
              <button onClick={() => jaguarPunto(i, 1)} aria-label="Sumar un paso">+</button>
            </div>
          ))}
          <button className="vg-btn vg-btn-sec vg-marcador-ganador" onClick={() => { setAbierto(false); jaguarVerGrupos(true); }}>👥 Ver equipos</button>
          <button className="vg-btn vg-btn-sec vg-marcador-ganador" onClick={() => { setAbierto(false); capibaraVerMontana(true); }}>🏔 Ver la montaña</button>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  CapibaraActivacion, useCapibaraEstado, IMAGENES_CAPIBARA, HISTORIA_JOMU, PALETA_CAPIBARA, equiposCapibara,
  MontanaCapibara, PantallaMontanaCapibara, MarcadorCapibara, capibaraVerMontana,
  fijarEstadoCapibara: fijarHistoriaCapibara,   // los juegos publican aquí su estado para el celular
});
