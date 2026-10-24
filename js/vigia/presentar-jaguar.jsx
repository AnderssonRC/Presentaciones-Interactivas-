/* presentar-jaguar.jsx — MODO JAGUAR (equipos), en todos los modos Presentar.
   Es UNA SESIÓN para toda la presentación:
     · El PRIMER desafío la inicia: irrumpe el jaguar (ojos en llamas), suena
       Jaguar-voz.mp3 con sus frases sincronizadas y se forman los equipos.
     · Los siguientes: solo el jaguar con los ojos en llamas y
       "¡Que siga la LUCHA!" (sin voz); los equipos y puntos se mantienen.
     · Al salir de Presentar (o con "Mostrar ganador") aparece el GANADOR.
   Puntos: −/+ en los equipos del desafío, en el marcador flotante (arriba a la
   izquierda) y desde el mando del celular (acción 'punto').
   Piezas: sesión (jaguarReiniciar, jaguarEquipos, jaguarPunto…, useJaguarEstado),
   JaguarActivacion (la usa TarjetaActivacion para tipos "jg-"), MarcadorJaguar y
   GanadorJaguar (los monta VigiaPresentar en presentar.jsx). */

const JAGUAR_IMG = 'jaguar-equipos-transparente.png';
const JAGUAR_VOZ = 'Jaguar-voz.mp3';
const JAGUAR_INTRO_MS = 2400;
const JAGUAR_SIGUE_MS = 2600;
const JAGUAR_CIERRE_MS = 2400;
// Segundo del audio en que empieza cada frase (medido en la forma de onda de la voz).
const FRASES_JAGUAR = [
  { t: 0.10, texto: 'Como Jaguar', linea: 0 },
  { t: 1.35, texto: 'es hora de luchar.', linea: 0 },
  { t: 2.90, texto: 'Busca tu equipo.', linea: 1 },
  { t: 4.15, texto: 'Que gane el más fuerte y veloz.', linea: 2 },
];
const FIN_VOZ = 6.6;   // la voz dura ~6,3 s

const COLORES_EQUIPOS = [
  ['Verde', '#39FF14'], ['Azul', '#2F80FF'], ['Amarillo', '#FFE600'],
  ['Turquesa', '#00F0D0'], ['Lima', '#B6FF00'], ['Celeste', '#7FD8FF'],
];

function barajarJaguar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- Sesión del Modo Jaguar (en memoria, no en la nube) ----------
   { actId, iniciado, equipos: [{ nombre, color, miembros, puntos }] | null } */
let sesionJaguar = { actId: null, iniciado: false, equipos: null };
const oyentesJaguar = new Set();
function cambiarJaguar(fn) {
  sesionJaguar = { ...sesionJaguar, ...fn(sesionJaguar) };
  oyentesJaguar.forEach((o) => o(sesionJaguar));
}
function useJaguarEstado() {
  const [s, setS] = React.useState(sesionJaguar);
  React.useEffect(() => { oyentesJaguar.add(setS); setS(sesionJaguar); return () => oyentesJaguar.delete(setS); }, []);
  return s;
}
// Al entrar a Presentar empieza una sesión nueva.
function jaguarReiniciar(actId) { cambiarJaguar(() => ({ actId, iniciado: false, equipos: null, duelos: [] })); }
/* Duelos "todos contra todos": devuelve la siguiente pareja [i, j] que aún
   no se ha enfrentado; cuando ya se enfrentaron todas, empieza otra vuelta.
   Devuelve también { numero, total } para mostrar "Duelo 2 de 3". */
function jaguarSiguienteDuelo(n) {
  const parejas = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) parejas.push([i, j]);
  let hechos = sesionJaguar.duelos || [];
  let sig = parejas.find(([i, j]) => !hechos.includes(i + '-' + j));
  if (!sig) { hechos = []; sig = parejas[0]; }
  // Sin avisar a los oyentes: solo lleva la cuenta (puede llamarse al pintar).
  sesionJaguar.duelos = [...hechos, sig[0] + '-' + sig[1]];
  return { pareja: sig, numero: sesionJaguar.duelos.length, total: parejas.length };
}
function repartir(nombres, n, puntosPrevios) {
  const eq = COLORES_EQUIPOS.slice(0, n).map(([nombre, color], i) => ({ nombre: 'Equipo ' + nombre, color, miembros: [], puntos: (puntosPrevios && puntosPrevios[i]) || 0 }));
  barajarJaguar(nombres).forEach((x, i) => eq[i % n].miembros.push(x));
  return eq;
}
// Los equipos de la sesión (se crean la primera vez).
function jaguarEquipos(nombres, n) {
  if (!sesionJaguar.equipos) cambiarJaguar(() => ({ equipos: repartir(nombres, n) }));
  return sesionJaguar.equipos;
}
// Nuevos integrantes (los puntos de cada equipo se conservan).
function jaguarRehacer(nombres) {
  const prev = sesionJaguar.equipos || [];
  cambiarJaguar(() => ({ equipos: repartir(nombres, prev.length || 2, prev.map((e) => e.puntos)) }));
}
function jaguarPunto(i, delta) {
  cambiarJaguar((s) => ({ equipos: (s.equipos || []).map((e, k) => (k === i ? { ...e, puntos: Math.max(0, e.puntos + (delta || 1)) } : e)) }));
}
function jaguarIniciar() { if (!sesionJaguar.iniciado) cambiarJaguar(() => ({ iniciado: true })); }
// Resumen para el celular.
function jaguarResumen(s) {
  const x = s || sesionJaguar;
  return x.iniciado && x.equipos ? x.equipos.map((e) => ({ nombre: e.nombre, color: e.color, puntos: e.puntos })) : null;
}

/* Jaguar con los ojos en llamas (intro, "Que siga la lucha", ganador y
   desempate). `colorOjos`: las llamas toman ese color (el del ganador). */
function CabezaJaguar({ className, colorOjos }) {
  return (
    <div className={'vg-jaguar-cabeza ' + (className || '') + (colorOjos ? ' ojos-color' : '')}
      style={colorOjos ? { '--ojo': colorOjos } : undefined}>
      <img src={JAGUAR_IMG} alt="Jaguar" draggable="false" />
      <span className="vg-jaguar-ojo izq"><i></i><i></i><i></i></span>
      <span className="vg-jaguar-ojo der"><i></i><i></i><i></i></span>
    </div>
  );
}

/* Reproduce una voz y devuelve el segundo en que va ({ t, fin }), para
   mostrar los textos AL RITMO del audio. Si el navegador no deja sonar,
   sigue con un reloj propio de `duracion` segundos. */
function useVoz(src, activo, duracion) {
  const [estado, setEstado] = React.useState({ t: 0, fin: false });
  React.useEffect(() => {
    if (!activo) return undefined;
    setEstado({ t: 0, fin: false });
    const voz = new Audio(encodeURI(src));
    let sonando = false, raf = 0, vivo = true;
    const inicio = performance.now();
    voz.addEventListener('playing', () => { sonando = true; });
    const r = voz.play(); if (r && r.catch) r.catch(() => {});
    const paso = () => {
      if (!vivo) return;
      const t = sonando ? voz.currentTime : (performance.now() - inicio) / 1000;
      const fin = (sonando && voz.ended) || (!sonando && t >= duracion);
      setEstado({ t, fin });
      if (!fin) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => { vivo = false; cancelAnimationFrame(raf); voz.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, activo]);
  return estado;
}

// Voz del ganador (5,2 s): golpes al inicio, la voz entre 1,35 s y 3,85 s.
const VOZ_GANADOR = 'voz del ganador.mp3';
const GANADOR_T = { kicker: 0.3, nombre: 1.35, tabla: 3.9, duracion: 5.2 };
// "A desempatar" (4,7 s): "¡A desempatar!" desde 0,1 s; "Que el docente…" desde 1,9 s.
const VOZ_DESEMPATE = 'A desempatar.mp3';
const DESEMPATE_T = { uno: 0.1, dos: 1.9, duracion: 4.7 };

function JaguarActivacion({ a, estudiantes, orden, onContinuar }) {
  const ti = VigiaTipos.tipo(a.tipo);
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const n = Math.max(2, Math.min(6, a.equipos || 2));
  const sesion = useJaguarEstado();
  // ¿Es el primer desafío de la presentación? (se decide al abrir la escena)
  const [primera] = React.useState(() => !sesionJaguar.iniciado);
  const [fase, setFase] = React.useState(primera ? 'jaguar' : 'sigue');
  // Equipos: los de la sesión; si es el primer desafío, se reparten aquí (sin
  // tocar la sesión durante el render) y se guardan al montar.
  const [provisional] = React.useState(() => sesionJaguar.equipos || repartir(nombres, n));
  const equipos = sesion.equipos || provisional;
  const nombre = (x) => (typeof nombreAnuncio === 'function' ? nombreAnuncio(x, orden || 'apellidos') : x);
  React.useEffect(() => {
    if (!sesionJaguar.equipos) cambiarJaguar(() => ({ equipos: provisional }));
    jaguarIniciar();   // la sesión queda iniciada (el marcador ya puede verse)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duelo: la siguiente pareja del "todos contra todos" de la sesión.
  // "Enfrentar equipos" pasa a la siguiente pareja (al final, otra vuelta).
  const [duelo, setDuelo] = React.useState(() => (a.duelo ? jaguarSiguienteDuelo(equipos.length) : null));
  const enfrentar = () => setDuelo(jaguarSiguienteDuelo(equipos.length));
  const rehacer = () => jaguarRehacer(nombres);

  // Tamaño de la letra (A− / Aa / A+), como en las demás tarjetas.
  const [escala, setEscala] = React.useState(1);
  const pasos = ESCALAS_TARJETA;
  const cambiarEscala = (dir) => setEscala((e) => {
    if (dir === 0) return 1;
    const i = pasos.indexOf(e);
    return pasos[Math.max(0, Math.min(pasos.length - 1, (i < 0 ? 3 : i) + dir))];
  });

  // --- Fases; la voz con las frases sincronizadas (solo la primera vez) ---
  const audio = React.useRef(null);
  const [visibles, setVisibles] = React.useState(0);
  React.useEffect(() => {
    if (fase === 'jaguar') { const t = setTimeout(() => setFase('frase'), JAGUAR_INTRO_MS); return () => clearTimeout(t); }
    if (fase === 'sigue') { const t = setTimeout(() => setFase('equipos'), JAGUAR_SIGUE_MS); return () => clearTimeout(t); }
    if (fase === 'cierre') { const t = setTimeout(onContinuar, JAGUAR_CIERRE_MS); return () => clearTimeout(t); }
    if (fase !== 'frase') return undefined;
    // Se sigue el reloj del audio; si el navegador no deja sonar, un reloj propio.
    const voz = new Audio(JAGUAR_VOZ);
    audio.current = voz;
    let inicio = performance.now(), sonando = false, raf = 0, vivo = true;
    voz.addEventListener('playing', () => { sonando = true; });
    const r = voz.play(); if (r && r.catch) r.catch(() => {});
    const paso = () => {
      if (!vivo) return;
      const t = sonando ? voz.currentTime : (performance.now() - inicio) / 1000;
      setVisibles(FRASES_JAGUAR.filter((f) => f.t <= t).length);
      if (t >= FIN_VOZ || (sonando && voz.ended)) { setFase('equipos'); return; }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);
  React.useEffect(() => () => { if (audio.current) { audio.current.pause(); audio.current = null; } }, []);

  const adelantar = () => {
    if (fase === 'jaguar') setFase('frase');
    else if (fase === 'frase' || fase === 'sigue') { if (audio.current) audio.current.pause(); setFase('equipos'); }
  };
  const terminar = () => setFase('cierre');

  // Teclado (espacio / Enter) y mando: adelantar o terminar con su cierre.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (e.target && /input|textarea|button/i.test(e.target.tagName)) return;
      e.preventDefault(); e.stopPropagation();
      if (fase === 'equipos') terminar(); else if (fase === 'cierre') onContinuar(); else adelantar();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });
  useOrdenMando((o) => {
    if (o.accion === 'reto-terminar' || o.accion === 'continuar') {
      if (fase === 'equipos') terminar(); else if (fase === 'cierre') onContinuar(); else adelantar();
    } else if (o.accion === 'reto-sortear') rehacer();
    else if (o.accion === 'letra') cambiarEscala(o.dir || 0);
  });

  if (fase === 'jaguar') {
    return (
      <div className="vg-jaguar vg-jaguar-intro" onClick={adelantar} title="Clic para continuar">
        <div className="vg-jaguar-destello"></div>
        <CabezaJaguar />
        <div className="vg-jaguar-marca">MODO JAGUAR</div>
      </div>
    );
  }

  // Desafíos siguientes: el jaguar con ojos en llamas y "¡Que siga la LUCHA!"
  if (fase === 'sigue') {
    return (
      <div className="vg-jaguar vg-jaguar-intro vg-jaguar-sigue" onClick={adelantar} title="Clic para continuar">
        <div className="vg-jaguar-destello"></div>
        <CabezaJaguar className="chica" />
        <div className="vg-jaguar-lucha">¡Que siga la <span>LUCHA</span>!</div>
      </div>
    );
  }

  if (fase === 'frase') {
    const lineas = [0, 1, 2].map((l) => FRASES_JAGUAR.map((f, i) => ({ ...f, i })).filter((f) => f.linea === l && f.i < visibles));
    return (
      <div className="vg-jaguar vg-jaguar-frase" onClick={adelantar} title="Clic para continuar">
        <img src={JAGUAR_IMG} alt="" className="vg-jaguar-fondo-img" />
        <div className="vg-jaguar-lineas">
          {lineas.map((partes, l) => (
            <div key={l} className={'vg-jaguar-linea l' + l}>
              {partes.map((f) => <span key={f.i} className="vg-jaguar-golpe">{f.texto} </span>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (fase === 'cierre') {
    return (
      <div className="vg-jaguar vg-jaguar-cierre" onClick={onContinuar} title="Clic para continuar">
        <img src={JAGUAR_IMG} alt="" className="vg-jaguar-cierre-img" />
        <div className="vg-jaguar-ganar">¡A ganar!</div>
      </div>
    );
  }

  // --- 'equipos': el desafío y los equipos (con −/+ puntos) ---
  const titulo = ti.propia ? (a.tituloPropio || 'Actividad del docente') : ti.nombre;
  const enDuelo = a.duelo && equipos.length >= 2 && duelo;
  const pareja = enDuelo ? duelo.pareja : [];
  return (
    <div className="vg-jaguar vg-jaguar-equipos">
      <div className="vg-jaguar-tarjeta">
        <div className="vg-tarjeta-letra" role="group" aria-label="Tamaño de la letra">
          <button onClick={() => cambiarEscala(-1)} disabled={escala <= pasos[0]} title="Letra más pequeña">A−</button>
          <button onClick={() => cambiarEscala(0)} className="normal" title={'Tamaño normal (ahora ' + Math.round(escala * 100) + '%)'}>Aa</button>
          <button onClick={() => cambiarEscala(1)} disabled={escala >= pasos[pasos.length - 1]} title="Letra más grande">A+</button>
        </div>
        <div className="vg-jaguar-contenido" style={{ zoom: escala }}>
          <div className="vg-jaguar-cabecera">
            <span className="vg-jaguar-puno"><Icon name="puno" size={22} /></span>
            <span>Modo Jaguar</span>
          </div>
          <h1 className="vg-jaguar-titulo">{titulo}</h1>
          {a.texto && a.texto.trim() && <p className="vg-jaguar-texto">{a.texto}</p>}
          <ImagenActivacion a={a} />
          {ti.palabra && a.palabra && a.palabra.trim() && <AhorcadoJaguar palabra={a.palabra.trim()} />}
          {a.tipo === 'jg-azar' && <EquipoAlAzar equipos={equipos} />}

          {enDuelo && (
            <div className="vg-jaguar-duelo-caja">
              <div className="vg-jaguar-duelo">
                {pareja.filter((i) => equipos[i]).map((i, k) => (
                  <React.Fragment key={i}>
                    {k > 0 && <span className="vg-jaguar-vs">VS</span>}
                    <button className="vg-jaguar-rival" style={{ '--c': equipos[i].color }} onClick={() => jaguarPunto(i, 1)} title={'Punto para el ' + equipos[i].nombre}>
                      <strong>{equipos[i].nombre}</strong>
                      <span>+1 punto</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
              {/* Todos contra todos: siempre se enfrentan todos los equipos. */}
              {equipos.length >= 2 && (
                <div className="vg-jaguar-duelo-pie">
                  <span>Duelo {duelo.numero} de {duelo.total} · todos contra todos</span>
                  <button className="vg-btn vg-jaguar-btn" onClick={enfrentar}>⚔ Enfrentar equipos</button>
                </div>
              )}
            </div>
          )}

          <div className="vg-jaguar-grilla">
            {equipos.map((e, i) => (
              <div key={i} className={'vg-jaguar-equipo' + (enDuelo && pareja.includes(i) ? ' en-duelo' : '')} style={{ '--c': e.color, animationDelay: i * 0.08 + 's' }}>
                <div className="vg-jaguar-equipo-cabeza">
                  <span>{e.nombre}</span>
                  <span className="vg-jaguar-puntos">
                    <button onClick={() => jaguarPunto(i, -1)} disabled={!e.puntos} title="Quitar un punto" aria-label="Quitar un punto">−</button>
                    <b title="Puntos">{e.puntos}</b>
                    <button onClick={() => jaguarPunto(i, 1)} title="Sumar un punto" aria-label="Sumar un punto">+</button>
                  </span>
                </div>
                {e.miembros.length ? (
                  <div className="vg-jaguar-miembros">{e.miembros.map((m, k) => <span key={k}>{nombre(m)}</span>)}</div>
                ) : <div className="vg-jaguar-sin">Formen el equipo</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="vg-jaguar-acciones">
        <button className="vg-btn vg-btn-sec" onClick={rehacer}>↻ Nuevos integrantes</button>
        <button className="vg-btn vg-jaguar-btn" onClick={terminar}>Terminar desafío <Icon name="play" size={16} /></button>
      </div>
    </div>
  );
}

/* Marcador flotante (arriba a la izquierda) mientras el Modo Jaguar está en
   marcha: puntos de cada equipo con − / + y "Mostrar ganador". */
function MarcadorJaguar({ onGanador }) {
  const s = useJaguarEstado();
  const [abierto, setAbierto] = React.useState(false);
  if (!s.iniciado || !s.equipos) return null;
  const max = Math.max(...s.equipos.map((e) => e.puntos));
  return (
    <div className={'vg-marcador' + (abierto ? ' abierto' : '')}>
      <button className="vg-marcador-chip" onClick={() => setAbierto((v) => !v)} title="Marcador del Modo Jaguar">
        <span className="vg-jaguar-puno"><Icon name="puno" size={15} /></span>
        {s.equipos.map((e, i) => <span key={i} className="vg-marcador-mini" style={{ '--c': e.color }}>{e.puntos}</span>)}
      </button>
      {abierto && (
        <div className="vg-marcador-panel">
          <div className="vg-marcador-titulo">Marcador · Modo Jaguar</div>
          {s.equipos.map((e, i) => (
            <div key={i} className={'vg-marcador-fila' + (e.puntos === max && max > 0 ? ' lider' : '')} style={{ '--c': e.color }}>
              <span className="vg-marcador-nombre">{e.nombre}</span>
              <button onClick={() => jaguarPunto(i, -1)} disabled={!e.puntos} aria-label="Quitar un punto">−</button>
              <b>{e.puntos}</b>
              <button onClick={() => jaguarPunto(i, 1)} aria-label="Sumar un punto">+</button>
            </div>
          ))}
          <button className="vg-btn vg-jaguar-btn vg-marcador-ganador" onClick={() => { setAbierto(false); onGanador(); }}>🏆 Mostrar ganador</button>
        </div>
      )}
    </div>
  );
}

/* Pantalla final.
   · Hay ganador: suena "voz del ganador" y, a su ritmo, aparecen "¡Equipo
     ganador!", su nombre y la tabla; los ojos del jaguar arden con SU color.
   · Hay empate: primero el jaguar en ROJO NEÓN con "A desempatar" (voz):
     "¡A desempatar!" y "Que el docente escoja la lucha final"; luego se
     vuelve a la presentación para la lucha final (o se termina con empate). */
function GanadorJaguar({ onSalir, onVolver }) {
  const s = useJaguarEstado();
  const equipos = (s.equipos || []).map((e, i) => ({ ...e, i })).sort((x, y) => y.puntos - x.puntos);
  const max = equipos.length ? equipos[0].puntos : 0;
  const ganadores = equipos.filter((e) => e.puntos === max);
  const empate = ganadores.length > 1;
  const [fase, setFase] = React.useState(empate ? 'desempate' : 'ganador');   // 'desempate' | 'ganador' | 'empate'
  const vozGanador = useVoz(VOZ_GANADOR, fase === 'ganador', GANADOR_T.duracion);
  const vozDesempate = useVoz(VOZ_DESEMPATE, fase === 'desempate', DESEMPATE_T.duracion);
  const vt = vozGanador.t;
  // Las teclas no llegan a la presentación de atrás; Enter = terminar, Esc = volver.
  React.useEffect(() => {
    const onKey = (e) => {
      e.stopPropagation();
      if (e.key === 'Enter') { e.preventDefault(); if (fase === 'desempate') onVolver(); else onSalir(); }
      else if (e.key === 'Escape') { e.preventDefault(); onVolver(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // --- Empate: el jaguar en rojo neón y la voz "A desempatar" ---
  if (fase === 'desempate') {
    const dt = vozDesempate.t;
    return (
      <div className="vg-jaguar vg-jaguar-final vg-jaguar-rojo">
        <div className="vg-jaguar-destello"></div>
        <CabezaJaguar className="final rojo" colorOjos="#FF1E3C" />
        <div className="vg-jaguar-final-texto">
          <div className="vg-jaguar-final-kicker">Empate: {ganadores.map((g) => g.nombre).join(' y ')} · {max} {max === 1 ? 'punto' : 'puntos'}</div>
          {dt >= DESEMPATE_T.uno && <div className="vg-desempate-uno">¡A desempatar!</div>}
          {dt >= DESEMPATE_T.dos && <div className="vg-desempate-dos">Que el docente escoja la lucha final</div>}
          {vozDesempate.fin && (
            <div className="vg-jaguar-final-acciones">
              <button className="vg-btn vg-desempate-btn" onClick={onVolver}>⚔ Elegir la lucha final</button>
              <button className="vg-btn vg-btn-sec" onClick={() => setFase('empate')}>Terminar con empate</button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Ganador (con su voz) o empate final ---
  const conVoz = fase === 'ganador';
  const ver = (t) => !conVoz || vt >= t || vozGanador.fin;
  const colorGanador = !empate && ganadores[0] ? ganadores[0].color : null;
  return (
    <div className="vg-jaguar vg-jaguar-final" style={colorGanador ? { '--ganador': colorGanador } : undefined}>
      <div className="vg-jaguar-destello"></div>
      {/* Los ojos arden con el color del equipo ganador. */}
      <CabezaJaguar className="final" colorOjos={colorGanador || '#FFE600'} />
      <div className="vg-jaguar-final-texto">
        {ver(GANADOR_T.kicker) && <div className="vg-jaguar-final-kicker">{empate ? '¡Empate de jaguares!' : '¡Equipo ganador!'}</div>}
        {ver(GANADOR_T.nombre) && (
          <div className="vg-jaguar-final-nombre">
            {ganadores.map((g, k) => <span key={g.i} style={{ '--c': g.color }}>{k > 0 ? ' y ' : ''}{g.nombre}</span>)}
          </div>
        )}
        {ver(GANADOR_T.tabla) && (
          <React.Fragment>
            <div className="vg-jaguar-final-tabla">
              {equipos.map((e, k) => (
                <div key={e.i} className={'vg-jaguar-final-fila' + (e.puntos === max ? ' oro' : '')} style={{ '--c': e.color, animationDelay: k * 0.12 + 's' }}>
                  <span>{k + 1}</span><strong>{e.nombre}</strong><b>{e.puntos} {e.puntos === 1 ? 'punto' : 'puntos'}</b>
                </div>
              ))}
            </div>
            <div className="vg-jaguar-final-acciones">
              <button className="vg-btn vg-btn-sec" onClick={onVolver}>Volver a la presentación</button>
              <button className="vg-btn vg-jaguar-btn" onClick={onSalir}>Terminar <Icon name="play" size={16} /></button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* Ahorcado: espacios por letra, teclado de letras y el dibujo que avanza.
   Las tildes no importan al adivinar (A = Á). */
function AhorcadoJaguar({ palabra }) {
  const base = (c) => c.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  const letras = palabra.toUpperCase().split('');
  const [usadas, setUsadas] = React.useState([]);
  const [revelada, setRevelada] = React.useState(false);
  const objetivo = new Set(letras.filter((c) => /[A-ZÑ]/i.test(base(c))).map(base));
  const fallos = usadas.filter((u) => !objetivo.has(u)).length;
  const gano = [...objetivo].every((c) => usadas.includes(c));
  const perdio = fallos >= 6;
  const fin = gano || perdio || revelada;
  const teclas = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ'.split('');
  return (
    <div className="vg-ahorcado">
      <svg viewBox="0 0 120 120" className="vg-ahorcado-dibujo" aria-hidden="true">
        <path d="M15 112h60M30 112V10h50v14" className="poste" />
        {fallos > 0 && <circle cx="80" cy="34" r="10" />}
        {fallos > 1 && <path d="M80 44v30" />}
        {fallos > 2 && <path d="M80 52l-14 12" />}
        {fallos > 3 && <path d="M80 52l14 12" />}
        {fallos > 4 && <path d="M80 74l-12 18" />}
        {fallos > 5 && <path d="M80 74l12 18" />}
      </svg>
      <div className="vg-ahorcado-derecha">
        <div className="vg-ahorcado-palabra">
          {letras.map((c, i) => {
            const esLetra = /[A-ZÑ]/i.test(base(c));
            const ver = !esLetra || usadas.includes(base(c)) || fin;
            return <span key={i} className={esLetra ? 'letra' + (ver ? ' ver' : '') + (fin && !usadas.includes(base(c)) && esLetra ? ' faltaba' : '') : 'espacio'}>{esLetra ? (ver ? c : '') : c}</span>;
          })}
        </div>
        <div className="vg-ahorcado-estado">
          {gano ? '¡Palabra descubierta!' : perdio ? '¡Se acabaron los intentos!' : 'Fallos: ' + fallos + ' / 6'}
        </div>
        <div className="vg-ahorcado-teclas">
          {teclas.map((t) => (
            <button key={t} disabled={usadas.includes(t) || fin}
              className={usadas.includes(t) ? (objetivo.has(t) ? 'bien' : 'mal') : ''}
              onClick={() => setUsadas((u) => [...u, t])}>{t}</button>
          ))}
        </div>
        {!fin && <button className="vg-btn-texto" onClick={() => setRevelada(true)}>Revelar la palabra</button>}
      </div>
    </div>
  );
}

/* Equipo al azar: la luz recorre los equipos, frena y se detiene en uno. */
/* `autoGirar`: gira apenas aparece. `conPunto`: al elegir, botón "+1 punto". */
function EquipoAlAzar({ equipos, autoGirar, conPunto }) {
  const [actual, setActual] = React.useState(null);
  const [girando, setGirando] = React.useState(false);
  const timers = React.useRef([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);
  React.useEffect(() => { if (autoGirar) girar(); }, []);   // eslint-disable-line
  const girar = () => {
    if (girando) return;
    setGirando(true);
    const destino = Math.floor(Math.random() * equipos.length);
    const pasos = equipos.length * 3 + destino + 1;
    let t = 0;
    for (let k = 0; k < pasos; k++) {
      t += 60 + Math.pow(k / pasos, 3) * 380;   // rápido y luego frena
      timers.current.push(setTimeout(() => setActual(k % equipos.length), t));   // el último paso cae en `destino`
    }
    timers.current.push(setTimeout(() => setGirando(false), t + 50));
  };
  return (
    <div className="vg-azar-equipos">
      <div className="vg-azar-fila">
        {equipos.map((e, i) => (
          <span key={i} className={'vg-azar-chip' + (actual === i ? ' on' : '') + (!girando && actual === i ? ' elegido' : '')} style={{ '--c': e.color }}>{e.nombre}</span>
        ))}
      </div>
      {!girando && actual !== null && equipos[actual] && (
        <div className="vg-azar-elegido" style={{ '--c': equipos[actual].color }}>Responde el <strong>{equipos[actual].nombre}</strong></div>
      )}
      <div className="vg-azar-botones">
        <button className="vg-btn vg-jaguar-btn" onClick={girar} disabled={girando}>{actual === null ? '¿Qué equipo responde?' : girando ? 'Eligiendo…' : '↻ Otra vez'}</button>
        {conPunto && !girando && actual !== null && (
          <button className="vg-btn vg-btn-sec" onClick={() => jaguarPunto(actual, 1)}>+1 punto</button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, {
  JaguarActivacion, MarcadorJaguar, GanadorJaguar, AhorcadoJaguar, EquipoAlAzar, CabezaJaguar,
  useJaguarEstado, jaguarReiniciar, jaguarPunto, jaguarResumen,
});
