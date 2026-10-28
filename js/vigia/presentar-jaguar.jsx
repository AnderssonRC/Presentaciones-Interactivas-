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

const JAGUAR_IMG = 'jaguar-equipos.webp';   // WebP liviano (900 px, ~280 KB), sin fondo
const JAGUAR_ROJO = 'jaguar-rojo.webp';   // el mismo jaguar en rojo neón (desempate)
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

/* Cierre de cada desafío: el primero dice "¡A ganar!"; los siguientes, una
   de estas frases al azar (sin repetir la anterior). */
const FRASES_SIGUE_LUCHA = [
  '¡Sigan luchando!',
  'A los perdedores de esta ronda… ¡más rapidez!',
  '¡El jaguar no descansa!',
  '¡Nadie se rinde todavía!',
  'La próxima ronda puede ser tuya… ¡prepárate!',
  '¡Afilen las garras!',
  '¡Esto apenas comienza!',
];
let ultimaFraseSigue = null;
function fraseSigueLucha() {
  const ops = FRASES_SIGUE_LUCHA.filter((f) => f !== ultimaFraseSigue);
  ultimaFraseSigue = ops[Math.floor(Math.random() * ops.length)];
  return ultimaFraseSigue;
}
// "Finalizar lucha": pide la pantalla de ganadores (la monta VigiaPresentar).
function finalizarLucha() { window.dispatchEvent(new CustomEvent('vigia-mando', { detail: { accion: 'jaguar-ganador' } })); }

const COLORES_EQUIPOS = [
  ['Verde', '#39FF14'], ['Azul', '#2F80FF'], ['Amarillo', '#FFE600'],
  ['Turquesa', '#00F0D0'], ['Lima', '#B6FF00'], ['Celeste', '#7FD8FF'],
  ['Naranja', '#FF8A00'], ['Rosado', '#FF4FD8'], ['Morado', '#A66BFF'], ['Rojo', '#FF3B4E'],
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
// `n`: cuántos equipos tiene la presentación (los elige el PRIMER desafío Jaguar).
// `extra`: datos del modo (Modo Capibara: { modo: 'capibara', meta } = pasos hasta Jomu).
function jaguarReiniciar(actId, n, extra) {
  // Todo vuelve a cero: equipos, duelos, grupos de la silueta y siluetas usadas.
  cambiarJaguar(() => ({ actId, n: n || null, iniciado: false, equipos: null, verGrupos: false, duelos: [], siluetaUsados: [], siluetasUsadas: {}, palabrasUsadas: {}, mimicaUsadas: {}, mimicaTurno: {}, desafio: null,
    modo: 'jaguar', meta: null, verMontana: false, montanaVista: null, muroUsadas: [], colasConcursantes: {}, ...(extra || {}) }));
}
// La sesión tal como está ahora (para otros módulos: el Modo Capibara).
function jaguarSesion() { return sesionJaguar; }
// "Ver equipos": la lista de estudiantes de cada equipo, encima de todo (la monta VigiaPresentar).
function jaguarVerGrupos(v) { cambiarJaguar((s) => ({ verGrupos: typeof v === 'boolean' ? v : !s.verGrupos })); }
/* Enfrentamientos de k en k (2, 3 o 4 equipos a la vez): devuelve el
   siguiente grupo que aún no se ha enfrentado, eligiendo a los equipos que
   MENOS han jugado; cuando ya salieron todos, empieza otra vuelta.
   Devuelve { pareja: [i, j, …], numero, total, texto } ("Enfrentamiento 2 de 3"). */
function combinacionesJaguar(n, k) {
  const r = [];
  const rec = (ini, acc) => {
    if (acc.length === k) { r.push(acc.slice()); return; }
    for (let i = ini; i < n; i++) { acc.push(i); rec(i + 1, acc); acc.pop(); }
  };
  rec(0, []);
  return r;
}
function jaguarSiguienteDuelo(n, k) {
  k = Math.max(2, Math.min(n, k || 2));
  const todas = combinacionesJaguar(n, k);
  const clave = (g) => k + ':' + g.join('-');
  const deK = (x) => String(x).indexOf(k + ':') === 0;
  let hechos = (sesionJaguar.duelos || []).filter(deK);
  let libres = todas.filter((g) => !hechos.includes(clave(g)));
  if (!libres.length) { hechos = []; libres = todas; }
  const veces = Array.from({ length: n }, () => 0);
  hechos.forEach((h) => h.split(':')[1].split('-').forEach((i) => { veces[Number(i)] += 1; }));
  let sig = libres[0], menor = Infinity;
  libres.forEach((g) => { const s = g.reduce((t, i) => t + veces[i], 0); if (s < menor) { menor = s; sig = g; } });
  // Sin avisar a los oyentes: solo lleva la cuenta (puede llamarse al pintar).
  sesionJaguar.duelos = [...(sesionJaguar.duelos || []).filter((x) => !deK(x)), ...hechos, clave(sig)];
  const numero = hechos.length + 1;
  const modo = k === 2 ? 'de 2 en 2' : 'de ' + k + ' en ' + k;
  const texto = 'Enfrentamiento ' + numero + (todas.length <= 15 ? ' de ' + todas.length : '') + ' · ' + modo;
  return { pareja: sig, numero, total: todas.length, texto };
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
  // Con los integrantes: el celular también puede mostrar quién está en cada equipo.
  return x.iniciado && x.equipos ? x.equipos.map((e) => ({ nombre: e.nombre, color: e.color, puntos: e.puntos, miembros: e.miembros || [] })) : null;
}
// El desafío en pantalla, para el celular (qué botones mostrar): lo publica JaguarActivacion.
function jaguarDesafioActual(s) { return (s || sesionJaguar).desafio || null; }

/* Manos dibujadas (SVG propio, mismo trazo): piedra, papel y tijera. */
const MANOS_PPT = {
  piedra: <g><path d="M7.5 10.5V8a1.6 1.6 0 0 1 3.2 0v2" /><path d="M10.7 9.5V6.8a1.6 1.6 0 0 1 3.2 0v2.7" /><path d="M13.9 9.5V7.6a1.6 1.6 0 0 1 3.2 0v2.4" /><path d="M17.1 10V9.2a1.6 1.6 0 0 1 3.2 0v3.6a7.4 7.4 0 0 1-7.4 7.4h-1.3a6 6 0 0 1-5-2.7l-2-3a1.7 1.7 0 0 1 2.7-2l1.2 1.4V10.5" /></g>,
  papel: <g><path d="M8 12V5.5a1.5 1.5 0 0 1 3 0V11" /><path d="M11 10.5V3.8a1.5 1.5 0 0 1 3 0v6.7" /><path d="M14 10.5V4.8a1.5 1.5 0 0 1 3 0v6.2" /><path d="M17 11V7.5a1.5 1.5 0 0 1 3 0v6a7.5 7.5 0 0 1-7.5 7.5h-1a6.5 6.5 0 0 1-5.2-2.6L3.6 14.6a1.6 1.6 0 0 1 2.4-2.1L8 14.4V12" /></g>,
  tijera: <g><path d="M9 12.5L6.3 4.7a1.5 1.5 0 0 1 2.8-1l2.6 7.3" /><path d="M11.7 11V3.9a1.5 1.5 0 0 1 3 0v7.4" /><path d="M14.7 11.3V9.6a1.5 1.5 0 0 1 3 0v1.8" /><path d="M17.7 11.4a1.5 1.5 0 0 1 3 0v2.2a7.4 7.4 0 0 1-7.4 7.4h-1.1a6.5 6.5 0 0 1-5.4-2.9l-1.9-2.9a1.6 1.6 0 0 1 2.6-1.9L9 14.6V12.5" /></g>,
};
function ManoPPT({ cual, size }) {
  return (
    <svg width={size || 48} height={size || 48} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{MANOS_PPT[cual]}</svg>
  );
}
const PPT_PASOS = [
  { t: 0, texto: 'Piedra', mano: 'piedra' },
  { t: 0.75, texto: 'Papel', mano: 'papel' },
  { t: 1.5, texto: 'Tijera', mano: 'tijera' },
  { t: 2.25, texto: '¡YA!', mano: null },
];
const PPT_DURACION_MS = 3300;   // "¡YA!" en 2,4 s y se deja ver un momento

/* Jaguar con los ojos en llamas (intro, "Que siga la lucha", ganador y
   desempate). `colorOjos`: las llamas toman ese color (el del ganador). */
function CabezaJaguar({ className, colorOjos }) {
  return (
    <div className={'vg-jaguar-cabeza ' + (className || '') + (colorOjos ? ' ojos-color' : '')}
      style={colorOjos ? { '--ojo': colorOjos } : undefined}>
      {/* Desempate: el jaguar ROJO ya pintado (sin filtros en vivo, más fluido). */}
      <img src={/\brojo\b/.test(className || '') ? JAGUAR_ROJO : JAGUAR_IMG} alt="Jaguar" draggable="false" decoding="async" />
      <span className="vg-jaguar-ojo izq"><i></i><i></i><i></i></span>
      <span className="vg-jaguar-ojo der"><i></i><i></i><i></i></span>
    </div>
  );
}

/* Reproduce una voz y devuelve el segundo en que va ({ t, fin }), para
   mostrar los textos AL RITMO del audio. Si el navegador no deja sonar,
   sigue con un reloj propio de `duracion` segundos. */
/* `marcas`: segundos en que debe aparecer algo; devuelve `paso` = cuántas ya
   llegaron. Solo vuelve a pintar cuando cambia el paso (no 60 veces por
   segundo) y NUNCA retrocede (lo que apareció no desaparece aunque el audio
   arranque tarde). Si el audio no empieza en 1,2 s, sigue un reloj propio. */
function useVoz(src, activo, duracion, marcas) {
  const [estado, setEstado] = React.useState({ paso: 0, fin: false, bloqueado: false });
  const [vez, setVez] = React.useState(0);   // "repetir" vuelve a sonar
  React.useEffect(() => {
    if (!activo) return undefined;
    setEstado({ paso: 0, fin: false, bloqueado: false });
    const voz = new Audio(encodeURI(src));
    voz.preload = 'auto';
    let sonando = false, raf = 0, vivo = true, bloqueado = false, maxT = 0;
    let ultimo = { paso: -1, fin: false, bloqueado: false };
    const inicio = performance.now();
    const ESPERA = 1.2;   // segundos que se espera al audio antes del reloj propio
    voz.addEventListener('playing', () => { sonando = true; });
    // Si el navegador no deja sonar (sin un clic antes), se avisa para ofrecer un botón.
    const r = voz.play(); if (r && r.catch) r.catch(() => { bloqueado = true; });
    const tick = () => {
      if (!vivo) return;
      const pasado = (performance.now() - inicio) / 1000;
      const t = sonando ? voz.currentTime : bloqueado ? pasado : Math.max(0, pasado - ESPERA);
      maxT = Math.max(maxT, t);
      const paso = (marcas || []).filter((m) => m <= maxT).length;
      const fin = (sonando && voz.ended) || (!sonando && maxT >= duracion);
      const bloq = bloqueado && !sonando;
      if (paso !== ultimo.paso || fin !== ultimo.fin || bloq !== ultimo.bloqueado) {
        ultimo = { paso, fin, bloqueado: bloq };
        setEstado(ultimo);
      }
      if (!fin) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { vivo = false; cancelAnimationFrame(raf); voz.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, activo, vez]);
  return { ...estado, repetir: () => setVez((v) => v + 1) };
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
  // Los equipos los fija el PRIMER desafío Jaguar de la presentación (sesión).
  const n = Math.max(2, Math.min(COLORES_EQUIPOS.length, sesionJaguar.n || a.equipos || 2));
  const k = VigiaTipos.enfrentarDe(a);   // 0 = todos juntos · 2, 3 o 4 a la vez
  const sesion = useJaguarEstado();
  // ¿Es el primer desafío de la presentación? (se decide al abrir la escena)
  const [primera] = React.useState(() => !sesionJaguar.iniciado);
  const [fase, setFase] = React.useState(primera ? 'jaguar' : 'sigue');
  // Frase del cierre: "¡A ganar!" la primera vez; luego, una para seguir luchando.
  const [fraseCierre] = React.useState(() => (primera ? '¡A ganar!' : fraseSigueLucha()));
  // Equipos: los de la sesión; si es el primer desafío, se reparten aquí (sin
  // tocar la sesión durante el render) y se guardan al montar.
  const [provisional] = React.useState(() => sesionJaguar.equipos || repartir(nombres, n));
  const equipos = sesion.equipos || provisional;
  React.useEffect(() => {
    if (!sesionJaguar.equipos) cambiarJaguar(() => ({ equipos: provisional }));
    jaguarIniciar();   // la sesión queda iniciada (el marcador ya puede verse)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Duelo: la siguiente pareja del "todos contra todos" de la sesión.
  // "Enfrentar equipos" pasa a la siguiente pareja (al final, otra vuelta).
  const esPPT = a.tipo === 'jg-ppt';
  // Con "todos juntos" no hay enfrentamiento (si k pasa del número de equipos, juegan todos).
  const conDuelo = k > 0 && equipos.length >= 2;
  const [duelo, setDuelo] = React.useState(() => (conDuelo || esPPT ? jaguarSiguienteDuelo(equipos.length, k || 2) : null));

  // --- Ganador del desafío: suma 1 punto (cambiarlo corrige el punto). Si
  //     hay una activación ENLAZADA, el ganador la responde. ---
  const [ganador, setGanador] = React.useState(null);
  const elegirGanador = (i) => {
    if (i === ganador || !equipos[i]) return;
    if (ganador !== null) jaguarPunto(ganador, -1);
    jaguarPunto(i, 1);
    setGanador(i);
  };
  const enfrentar = () => { setDuelo(jaguarSiguienteDuelo(equipos.length, k || 2)); setGanador(null); };

  // --- Piedra, papel o tijera: 'elegir' (quiénes se enfrentan) → 'jugando'
  //     (la animación) → 'resultado' (¿quién ganó?) → nuevo enfrentamiento ---
  const [ppt, setPpt] = React.useState('elegir');
  const [enfrentan, setEnfrentan] = React.useState(() => (duelo ? duelo.pareja.slice() : [0, 1]));
  const cambiarCantidad = (k) => {
    const n2 = Math.max(2, Math.min(equipos.length, k));
    const base = enfrentan[0] || 0;   // a partir del primero elegido, en orden
    setEnfrentan(Array.from({ length: n2 }, (_, j) => (base + j) % equipos.length));
  };
  const alternarEquipo = (i) => setEnfrentan((sel) => {
    if (sel.includes(i)) return sel.length > 2 ? sel.filter((x) => x !== i) : sel;   // mínimo 2
    return [...sel, i].sort((x, y) => x - y);
  });
  const jugar = () => { setGanador(null); setPpt('jugando'); };
  const nuevoEnfrentamiento = () => {
    const d = jaguarSiguienteDuelo(equipos.length, k || 2);
    setDuelo(d);
    setEnfrentan(enfrentan.length > 2 ? enfrentan : d.pareja.slice());
    setGanador(null); setPpt('elegir');
  };
  React.useEffect(() => {
    if (ppt !== 'jugando') return undefined;
    const t = setTimeout(() => setPpt('resultado'), PPT_DURACION_MS);
    return () => clearTimeout(t);
  }, [ppt]);

  // Lo que el celular necesita para mostrar los mismos botones.
  // (Adivina la palabra lleva su propio duelo, turnos y ganador.)
  const esPalabra = !!ti.palabra;
  const esOrigami = !!ti.dosTarjetas;   // (también lleva su propio ganador)
  const esMimica = !!ti.mimica;          // (ídem)
  const esCuaderno = !!ti.cuaderno;      // (ídem: tres tarjetas y su ganador)
  const propioEstado = esOrigami || esMimica || esCuaderno;
  const enDueloAhora = conDuelo && duelo && !esPPT && !esPalabra && !propioEstado;
  const elegibles = esPPT ? enfrentan : enDueloAhora ? duelo.pareja : equipos.map((_, i) => i);
  React.useEffect(() => {
    if (fase !== 'equipos' || ti.silueta || esPalabra || propioEstado) return undefined;   // la silueta y el ahorcado publican su propio estado
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, ppt: esPPT ? ppt : null, enfrentan: esPPT ? enfrentan : null,
      duelo: !!enDueloAhora, elegibles, ganador, enlace: !!a.enlace,
      pideGanador: esPPT ? ppt === 'resultado' : a.tipo !== 'jg-azar',
    } }));
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, ppt, enfrentan.join(','), ganador, duelo && duelo.numero]);
  React.useEffect(() => () => cambiarJaguar(() => ({ desafio: null })), []);

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
      // Nunca retrocede: si el audio arranca tarde, lo que ya salió no se esconde.
      const n = FRASES_JAGUAR.filter((f) => f.t <= t).length;
      setVisibles((v) => (n > v ? n : v));
      if (t >= FIN_VOZ || (sonando && voz.ended)) { setFase('grupos'); return; }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);
  React.useEffect(() => () => { if (audio.current) { audio.current.pause(); audio.current = null; } }, []);

  const adelantar = () => {
    if (fase === 'jaguar') setFase('frase');
    // Al iniciar el Modo Jaguar: después de la voz, los equipos con sus estudiantes.
    else if (fase === 'frase') { if (audio.current) audio.current.pause(); setFase('grupos'); }
    else if (fase === 'sigue' || fase === 'grupos') { if (audio.current) audio.current.pause(); setFase('equipos'); }
  };
  // Mientras se muestran los equipos al inicio, el celular tiene sus botones.
  React.useEffect(() => {
    if (fase !== 'grupos') return undefined;
    cambiarJaguar(() => ({ desafio: { tipo: a.tipo, grupos: true } }));
    return () => cambiarJaguar(() => ({ desafio: null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);
  const resortear = () => { jaguarRehacer(nombres); };
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
    }
    else if (o.accion === 'letra') cambiarEscala(o.dir || 0);
    else if (o.accion === 'jg-resortear' && fase === 'grupos') resortear();
    // Desde el celular: los mismos botones del desafío.
    else if (fase === 'equipos') {
      if (o.accion === 'jg-ganador') elegirGanador(o.i);
      else if (o.accion === 'jg-enfrentar') { if (esPPT) nuevoEnfrentamiento(); else enfrentar(); }
      else if (o.accion === 'ppt-cantidad') cambiarCantidad(o.n);
      else if (o.accion === 'ppt-equipo') alternarEquipo(o.i);
      else if (o.accion === 'ppt-jugar') jugar();
    }
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

  // Inicio del Modo Jaguar: "¡Busca tu equipo!" con los estudiantes de cada equipo (por color).
  if (fase === 'grupos') {
    return (
      <div className="vg-jaguar vg-jaguar-equipos vg-jaguar-grupos">
        <div className="vg-jaguar-tarjeta">
          <div className="vg-jaguar-contenido">
            <div className="vg-jaguar-cabecera">
              <span className="vg-jaguar-puno"><Icon name="puno" size={22} /></span>
              <span>Modo Jaguar · {equipos.length} equipos</span>
            </div>
            <h1 className="vg-jaguar-titulo">¡Busca tu equipo!</h1>
            <ListaGruposJaguar equipos={equipos} />
          </div>
        </div>
        <div className="vg-jaguar-acciones">
          {nombres.length > 0 && <button className="vg-btn vg-btn-sec" onClick={resortear} title="Repartir de nuevo a los estudiantes (al azar)">🔀 Volver a sortear</button>}
          <button className="vg-btn vg-jaguar-btn" onClick={adelantar}>¡A luchar! <Icon name="play" size={16} /></button>
        </div>
      </div>
    );
  }

  if (fase === 'cierre') {
    return (
      <div className="vg-jaguar vg-jaguar-cierre" onClick={onContinuar} title="Clic para continuar">
        <img src={JAGUAR_IMG} alt="" className="vg-jaguar-cierre-img" />
        <div className={'vg-jaguar-ganar' + (fraseCierre.length > 16 ? ' larga' : '')}>{fraseCierre}</div>
      </div>
    );
  }

  // --- 'equipos': el desafío y los equipos (con −/+ puntos) ---
  const titulo = ti.propia ? (a.tituloPropio || 'Actividad del docente') : ti.nombre;
  const enDuelo = enDueloAhora && equipos.length >= 2;
  const pareja = enDuelo ? duelo.pareja : [];
  const eqGanador = ganador !== null ? equipos[ganador] : null;
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
          {/* Silueta del grupo: sus 4 tarjetas (la imagen NO se muestra antes de tiempo). */}
          {ti.silueta ? <SiluetaJaguar a={a} equipos={equipos} /> : esOrigami ? (
            <OrigamiJaguar key={conDuelo && duelo ? 'd' + duelo.numero + '-' + duelo.pareja.join('') : 'todos'} a={a} equipos={equipos}
              duelo={conDuelo && duelo && equipos.length >= 2 ? duelo : null} onEnfrentar={enfrentar} />
          ) : esCuaderno ? (
            <CuadernoJaguar key={conDuelo && duelo ? 'd' + duelo.numero + '-' + duelo.pareja.join('') : 'todos'} a={a} equipos={equipos}
              duelo={conDuelo && duelo && equipos.length >= 2 ? duelo : null} onEnfrentar={enfrentar} />
          ) : esMimica ? (
            <MimicaJaguar key={conDuelo && duelo ? 'd' + duelo.numero + '-' + duelo.pareja.join('') : 'todos'} a={a} equipos={equipos}
              duelo={conDuelo && duelo && equipos.length >= 2 ? duelo : null} onEnfrentar={enfrentar} />
          ) : (
            <React.Fragment>
              {a.texto && a.texto.trim() && <p className="vg-jaguar-texto">{a.texto}</p>}
              <ImagenActivacion a={a} />
            </React.Fragment>
          )}
          {/* Adivina la palabra: cada duelo ("Enfrentar equipos") empieza con otra palabra. */}
          {esPalabra && (
            <PalabraJaguar key={conDuelo && duelo ? 'd' + duelo.numero + '-' + duelo.pareja.join('') : 'todos'} a={a} equipos={equipos}
              duelo={conDuelo && duelo && equipos.length >= 2 ? duelo : null} onEnfrentar={enfrentar} />
          )}
          {a.tipo === 'jg-azar' && <EquipoAlAzar equipos={equipos} />}

          {/* ---- Piedra, papel o tijera ---- */}
          {esPPT && ppt === 'elegir' && (
            <div className="vg-ppt-elegir">
              <div className="vg-ppt-pregunta">Se enfrentan</div>
              <div className="vg-ppt-cantidad" role="group" aria-label="Cuántos equipos se enfrentan">
                <button onClick={() => cambiarCantidad(enfrentan.length - 1)} disabled={enfrentan.length <= 2} aria-label="Menos equipos">−</button>
                <b>{enfrentan.length}</b>
                <button onClick={() => cambiarCantidad(enfrentan.length + 1)} disabled={enfrentan.length >= equipos.length} aria-label="Más equipos">+</button>
                <span>equipos</span>
              </div>
              <div className="vg-ppt-equipos">
                {equipos.map((e, i) => (
                  <button key={i} className={'vg-ppt-chip' + (enfrentan.includes(i) ? ' on' : '')} style={{ '--c': e.color }}
                    onClick={() => alternarEquipo(i)} aria-pressed={enfrentan.includes(i)}>{e.nombre}</button>
                ))}
              </div>
              <button className="vg-btn vg-jaguar-btn vg-ppt-jugar" onClick={jugar}>
                <ManoPPT cual="piedra" size={22} /> ¡Piedra, papel o tijera!
              </button>
            </div>
          )}
          {esPPT && ppt === 'resultado' && (
            <div className="vg-ppt-resultado">
              <div className="vg-ppt-pregunta">¿Quién ganó?</div>
              <div className="vg-ppt-equipos">
                {enfrentan.filter((i) => equipos[i]).map((i) => (
                  <button key={i} className={'vg-jaguar-rival' + (ganador === i ? ' gano' : '')} style={{ '--c': equipos[i].color }}
                    onClick={() => elegirGanador(i)} aria-pressed={ganador === i}>
                    <strong>{equipos[i].nombre}</strong>
                    <span>{ganador === i ? '¡Ganó! +1 punto' : 'Ganó'}</span>
                  </button>
                ))}
              </div>
              <div className="vg-jaguar-duelo-pie">
                <button className="vg-btn vg-btn-sec" onClick={jugar}>Empate: otra vez</button>
                <button className="vg-btn vg-jaguar-btn" onClick={nuevoEnfrentamiento}>↻ Nuevo enfrentamiento</button>
              </div>
            </div>
          )}

          {enDuelo && (
            <div className="vg-jaguar-duelo-caja">
              {equipos.length > pareja.length && <EquiposEnJuego equipos={equipos} participantes={pareja} etiqueta="Concursan ahora" />}
              <div className="vg-jaguar-duelo">
                {pareja.filter((i) => equipos[i]).map((i, k) => (
                  <React.Fragment key={i}>
                    {k > 0 && <span className="vg-jaguar-vs">VS</span>}
                    <button className={'vg-jaguar-rival' + (ganador === i ? ' gano' : '')} style={{ '--c': equipos[i].color }}
                      onClick={() => elegirGanador(i)} title={'Ganó el ' + equipos[i].nombre + ' (+1 punto)'} aria-pressed={ganador === i}>
                      <strong>{equipos[i].nombre}</strong>
                      <span>{ganador === i ? '¡Ganó! +1 punto' : 'Ganó'}</span>
                    </button>
                  </React.Fragment>
                ))}
              </div>
              {/* Todos contra todos: siempre se enfrentan todos los equipos. */}
              {equipos.length >= 2 && (
                <div className="vg-jaguar-duelo-pie">
                  <span>{duelo.texto}</span>
                  <button className="vg-btn vg-jaguar-btn" onClick={enfrentar}>⚔ Enfrentar equipos</button>
                </div>
              )}
            </div>
          )}

          {/* Sin duelo ni piedra-papel-tijera: concursan todos; ¿qué equipo ganó? */}
          {!esPPT && !enDuelo && !ti.silueta && !esPalabra && !propioEstado && a.tipo !== 'jg-azar' && (
            <div className="vg-ppt-resultado">
              <div className="vg-ppt-pregunta">Concursan todos · ¿Qué equipo ganó?</div>
              <div className="vg-ppt-equipos">
                {equipos.map((e, i) => (
                  <button key={i} className={'vg-ppt-chip' + (ganador === i ? ' on' : '')} style={{ '--c': e.color }}
                    onClick={() => elegirGanador(i)} aria-pressed={ganador === i}>{e.nombre}</button>
                ))}
              </div>
            </div>
          )}

          {/* El ganador responde la activación ENLAZADA (y puede sumar o quitar puntos). */}
          {eqGanador && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={eqGanador} i={ganador} id={a.id} />}
          {eqGanador && !a.enlace && (
            <div className="vg-jaguar-punto-aviso" style={{ '--c': eqGanador.color }}>¡Punto para el <strong>{eqGanador.nombre}</strong>!</div>
          )}

          {/* Solo lo que se debe hacer: sin listas de integrantes. Los puntos
              también se suman en el marcador (arriba a la izquierda) o desde el celular. */}
        </div>
      </div>
      {/* La arena de piedra, papel o tijera ocupa toda la escena (fuera del zoom de la tarjeta). */}
      {esPPT && ppt === 'jugando' && <AnimacionPPT equipos={enfrentan.map((i) => equipos[i]).filter(Boolean)} />}
      <div className="vg-jaguar-acciones">
        <button className="vg-btn vg-btn-sec vg-jaguar-ver-grupos" onClick={() => jaguarVerGrupos(true)} title="Ver los estudiantes de cada equipo">👥 Ver equipos</button>
        <span style={{ flex: 1 }}></span>
        <button className="vg-btn vg-finalizar-btn" onClick={finalizarLucha} title="Terminar el Modo Jaguar y mostrar a los ganadores hasta este momento">🏁 Finalizar lucha</button>
        <button className="vg-btn vg-jaguar-btn" onClick={terminar}>Terminar desafío <Icon name="play" size={16} /></button>
      </div>
    </div>
  );
}

/* La cuenta de piedra, papel o tijera (el momento animado del juego): los
   puños de los equipos que se enfrentan golpean al ritmo de "Piedra… Papel…
   Tijera…" y en "¡YA!" se abren. La mano de cada palabra aparece a su compás. */
/* ARENA GAMER (3 s, todo con transform/opacity):
   · Una franja inclinada por equipo, en su color, que entra deslizándose.
   · Las manos GRANDES se levantan y golpean 3 veces; en cada golpe CAMBIAN
     de forma (piedra → papel → tijera), con temblor de pantalla, destello y
     onda bajo cada mano. La palabra irrumpe justo en el impacto.
   · "¡YA!": golpe final, las manos estallan y "¡YA!" llena la pantalla.
   Con 2 equipos se miran de frente con un gran VS. Tiempos: PPT_IMPACTOS. */
const PPT_IMPACTOS = [0.45, 1.15, 1.85];   // segundos de cada golpe; "¡YA!" en 2.4
const PPT_YA = 2.4;
function AnimacionPPT({ equipos }) {
  const n = equipos.length;
  const tam = n <= 2 ? 'min(40vh, 28vw)' : n === 3 ? 'min(32vh, 22vw)' : n === 4 ? 'min(27vh, 17vw)' : 'min(21vh, 13vw)';
  const palabras = [['Piedra', PPT_IMPACTOS[0]], ['Papel', PPT_IMPACTOS[1]], ['Tijera', PPT_IMPACTOS[2]]];
  return (
    <div className={'vg-ppt-arena' + (n === 2 ? ' duelo' : '')} style={{ '--tam': tam, '--n': n }} aria-live="polite" aria-label="Piedra, papel o tijera">
      {/* Franjas de los equipos */}
      <div className="vg-ppt-franjas" aria-hidden="true">
        {equipos.map((e, i) => <span key={i} className="vg-ppt-franja" style={{ '--c': e.color, '--i': i }}></span>)}
      </div>
      <div className="vg-ppt-velocidad" aria-hidden="true"></div>
      <div className="vg-ppt-destello" aria-hidden="true"></div>

      {/* Los luchadores (la escena tiembla en cada golpe) */}
      <div className="vg-ppt-ring">
        {equipos.map((e, i) => (
          <React.Fragment key={i}>
            {n === 2 && i === 1 && <div className="vg-ppt-vs" aria-hidden="true"><span>VS</span></div>}
            <div className={'vg-ppt-luchador' + (n === 2 && i === 0 ? ' espejo' : '')} style={{ '--c': e.color, '--i': i }}>
              <div className="vg-ppt-golpe">
                <span className="vg-ppt-forma piedra"><ManoPPT cual="piedra" /></span>
                <span className="vg-ppt-forma papel"><ManoPPT cual="papel" /></span>
                <span className="vg-ppt-forma tijera"><ManoPPT cual="tijera" /></span>
              </div>
              {/* Ondas de cada golpe */}
              {PPT_IMPACTOS.concat(PPT_YA).map((t, k) => (
                <span key={k} className={'vg-ppt-onda' + (k === 3 ? ' final' : '')} style={{ animationDelay: t + 's' }} aria-hidden="true"></span>
              ))}
              <div className="vg-ppt-placa"><span>{e.nombre}</span></div>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* La palabra de cada golpe y "¡YA!" */}
      <div className="vg-ppt-gritos" aria-hidden="true">
        {palabras.map(([p, t], k) => (
          <span key={k} className="vg-ppt-grito" data-texto={p} style={{ animationDelay: t + 's' }}>{p}</span>
        ))}
        <span className="vg-ppt-grito ya" data-texto="¡YA!" style={{ animationDelay: PPT_YA + 's' }}>¡YA!</span>
      </div>
      {/* Indicador de golpes */}
      <div className="vg-ppt-golpes" aria-hidden="true">
        {PPT_IMPACTOS.map((t, k) => <i key={k} style={{ animationDelay: t + 's' }}></i>)}
      </div>
    </div>
  );
}

/* Activación ENLAZADA: la responde el equipo ganador. Muestra la activación
   cognitiva (pregunta, creación, glosario…) y − / + puntos para ese equipo. */
function EnlaceJaguar({ enlace, equipo, i, id }) {
  const ti = VigiaTipos.tipo(enlace.tipo);
  const s = useJaguarEstado();
  const puntos = s.equipos && s.equipos[i] ? s.equipos[i].puntos : equipo.puntos;
  return (
    <div className="vg-enlace" style={{ '--c': equipo.color, '--tipo': ti.color }}>
      <div className="vg-enlace-cabeza">
        <span className="vg-enlace-tipo"><Icon name={ti.icon} size={16} /> {ti.nombre}</span>
        <span className="vg-enlace-quien">Responde el <strong>{equipo.nombre}</strong></span>
      </div>
      <div className="vg-enlace-contenido">
        <ContenidoActivacion key={id + '-' + i} a={{ ...enlace, id: id + '-enlace' }} />
      </div>
      <div className="vg-enlace-puntos" role="group" aria-label={'Puntos del ' + equipo.nombre}>
        <span>Puntos del {equipo.nombre}</span>
        <button onClick={() => jaguarPunto(i, -1)} disabled={!puntos} aria-label="Quitar un punto">−</button>
        <b>{puntos}</b>
        <button onClick={() => jaguarPunto(i, 1)} aria-label="Sumar un punto">+1</button>
      </div>
    </div>
  );
}

/* ======================= SILUETA DEL GRUPO =======================
   Cuatro tarjetas:
     1. Instrucción + grupo al azar (sin repetir hasta que pasen todos).
     2. Cuenta regresiva 3 · 2 · 1 (gamer).
     3. La silueta (visible SILUETA_VISIBLE_S s; luego quedan unos ojos) y
        debajo el temporizador (a.tiempoSilueta, 20 s por defecto).
     4. ¿Ganadores?: el equipo, − / + puntos; "¡Lo lograron!" (celebración,
        +1) o "No lo lograron" (en rojo). Si hay activación enlazada y lo
        logran, la responden.
   El celular ve el paso y tiene los mismos botones (órdenes 'sil-*'). */
const SILUETA_VISIBLE_S = 7;
// Siguiente grupo al azar sin repetir; cuando ya pasaron todos, otra vuelta
// (sin repetir el último seguido).
function siguienteGrupoSilueta(n) {
  let usados = (sesionJaguar.siluetaUsados || []).filter((i) => i < n);
  let libres = Array.from({ length: n }, (_, i) => i).filter((i) => !usados.includes(i));
  if (!libres.length) {
    const ultimo = usados[usados.length - 1];
    usados = [];
    libres = Array.from({ length: n }, (_, i) => i).filter((i) => i !== ultimo);
  }
  const i = libres[Math.floor(Math.random() * libres.length)];
  sesionJaguar.siluetaUsados = [...usados, i];
  return { i, ronda: sesionJaguar.siluetaUsados.length, total: n };
}

/* Siluetas de esta activación que aún no se usan en la presentación. Una vez
   mostrada, una silueta no vuelve a salir (se lleva la cuenta en la sesión). */
function siluetasLibres(a) {
  const todas = (typeof siluetasDe === 'function' ? siluetasDe(a) : (a.imagen ? [a.imagen] : [])).filter((u) => u && u.trim());
  const usadas = ((sesionJaguar.siluetasUsadas || {})[a.id]) || [];
  return { todas, libres: todas.filter((u) => !usadas.includes(u)) };
}
function tomarSilueta(a) {
  const { libres } = siluetasLibres(a);
  if (!libres.length) return null;
  const url = libres[Math.floor(Math.random() * libres.length)];
  const mapa = { ...(sesionJaguar.siluetasUsadas || {}) };
  mapa[a.id] = [...(mapa[a.id] || []), url];
  sesionJaguar.siluetasUsadas = mapa;
  return url;
}
function reiniciarSiluetas(a) {
  const mapa = { ...(sesionJaguar.siluetasUsadas || {}) };
  delete mapa[a.id];
  sesionJaguar.siluetasUsadas = mapa;
}

/* Ojos neón que miran a los lados y parpadean (cuando la silueta se oculta). */
function OjosJaguar() {
  return (
    <svg className="vg-sil-ojos" viewBox="0 0 120 40" aria-hidden="true">
      {[18, 70].map((x, k) => (
        <g key={k} transform={'translate(' + x + ' 4)'}>
          <g className="vg-sil-parpado">
            <path d="M2 16 Q16 1 32 16 Q16 31 2 16 Z" className="ojo" />
            <circle cx="17" cy="16" r="5.5" className="pupila" />
          </g>
        </g>
      ))}
    </svg>
  );
}

function SiluetaJaguar({ a, equipos }) {
  const total = Math.max(5, a.tiempoSilueta || 20);
  const [paso, setPaso] = React.useState(1);           // 1 grupo · 2 cuenta · 3 silueta · 4 resultado
  const [grupo, setGrupo] = React.useState(null);      // { i, ronda, total }
  const [girando, setGirando] = React.useState(false);
  const [luz, setLuz] = React.useState(null);          // equipo iluminado mientras gira
  const [resultado, setResultado] = React.useState(null);   // 'si' | 'no' | null
  const [restante, setRestante] = React.useState(total);
  const [verImagen, setVerImagen] = React.useState(true);
  const timers = React.useRef([]);
  const limpiar = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  React.useEffect(() => limpiar, []);
  const eq = grupo && equipos[grupo.i];

  // 1) Grupo al azar: la luz recorre los equipos y se detiene en uno que no haya pasado.
  const elegir = () => {
    if (girando || paso !== 1) return;
    const g = siguienteGrupoSilueta(equipos.length);
    setGirando(true); setGrupo(null);
    const pasos = equipos.length * 3 + g.i + 1;
    let t = 0;
    for (let k = 0; k < pasos; k++) {
      t += 55 + Math.pow(k / pasos, 3) * 360;
      timers.current.push(setTimeout(() => setLuz(k % equipos.length), t));
    }
    timers.current.push(setTimeout(() => { setGirando(false); setGrupo(g); }, t + 120));
  };
  // La silueta de esta ronda: una que no se haya usado (al continuar se reserva).
  const [silueta, setSilueta] = React.useState(null);
  const [, setVersionSil] = React.useState(0);
  const { todas: siluetasTodas, libres: siluetasQuedan } = siluetasLibres(a);
  const continuar = () => {
    if (!grupo || paso !== 1) return;
    const url = tomarSilueta(a);
    if (!url) return;   // ya se usaron todas: se ofrece reiniciar
    setSilueta(url); setPaso(2);
  };
  const usarDeNuevo = () => { reiniciarSiluetas(a); setVersionSil((v) => v + 1); };
  // 2) Cuenta 3 · 2 · 1 y pasa a la silueta.
  React.useEffect(() => {
    if (paso !== 2) return undefined;
    const t = setTimeout(() => setPaso(3), 3200);
    return () => clearTimeout(t);
  }, [paso]);
  // 3) La silueta (7 s) y el temporizador; al llegar a 0, pasa a ¿Ganadores?
  React.useEffect(() => {
    if (paso !== 3) return undefined;
    const inicio = performance.now();
    setRestante(total); setVerImagen(true);
    const iv = setInterval(() => {
      const pasado = (performance.now() - inicio) / 1000;
      setVerImagen(pasado < SILUETA_VISIBLE_S);
      setRestante(Math.max(0, Math.ceil(total - pasado)));
      if (pasado >= total) { clearInterval(iv); setPaso(4); }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso]);
  const saltar = () => { if (paso === 3) setPaso(4); };
  // 4) ¿Lo lograron? (+1 si sí; cambiar de opinión corrige el punto)
  const resolver = (si) => {
    if (!grupo) return;
    if (si && resultado !== 'si') jaguarPunto(grupo.i, 1);
    if (!si && resultado === 'si') jaguarPunto(grupo.i, -1);
    setResultado(si ? 'si' : 'no');
  };
  const otro = () => { limpiar(); setPaso(1); setGrupo(null); setResultado(null); setLuz(null); setGirando(false); setSilueta(null); };

  // Estado para el celular (mismos botones).
  React.useEffect(() => {
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, enlace: !!a.enlace,
      silueta: { paso, equipo: grupo ? grupo.i : null, girando, resultado, ronda: grupo ? grupo.ronda : null, total: equipos.length,
        quedan: siluetasQuedan.length, siluetas: siluetasTodas.length },
      ganador: resultado === 'si' && grupo ? grupo.i : null,
    } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, grupo && grupo.i, girando, resultado, siluetasQuedan.length]);
  useOrdenMando((o) => {
    if (o.accion === 'sil-azar') elegir();
    else if (o.accion === 'sil-continuar') continuar();
    else if (o.accion === 'sil-saltar') saltar();
    else if (o.accion === 'sil-resultado') resolver(!!o.ok);
    else if (o.accion === 'sil-otro') otro();
    else if (o.accion === 'sil-reiniciar') usarDeNuevo();
  });

  const pasos = ['Grupo', 'Listos', 'Silueta', '¿Ganadores?'];
  const fraccion = restante / total;
  return (
    <div className="vg-sil" style={eq ? { '--c': eq.color } : undefined}>
      {/* Avance de las 4 tarjetas */}
      <ol className="vg-sil-pasos" aria-label="Pasos">
        {pasos.map((p, k) => <li key={k} className={k + 1 === paso ? 'on' : k + 1 < paso ? 'hecho' : ''}><b>{k + 1}</b>{p}</li>)}
      </ol>

      {/* 1 · Instrucción y grupo al azar */}
      {paso === 1 && (
        <div className="vg-sil-tarjeta">
          {a.texto && a.texto.trim() && <p className="vg-sil-instruccion">{a.texto}</p>}
          <div className="vg-sil-equipos">
            {equipos.map((e, i) => {
              const usado = (sesionJaguar.siluetaUsados || []).includes(i) && !(grupo && grupo.i === i);
              return (
                <span key={i} className={'vg-sil-chip' + (luz === i && (girando || !grupo) ? ' luz' : '') + (grupo && grupo.i === i ? ' elegido' : '') + (usado ? ' usado' : '')}
                  style={{ '--c': e.color }}>{e.nombre}</span>
              );
            })}
          </div>
          {grupo && eq ? (
            <div className="vg-sil-le-toca">Le toca al <strong>{eq.nombre}</strong><small>Ronda {grupo.ronda} de {grupo.total} · sin repetir grupos</small></div>
          ) : null}
          {/* Siluetas disponibles (cada una se usa una sola vez) */}
          <div className={'vg-sil-quedan' + (siluetasQuedan.length ? '' : ' agotadas')}>
            {siluetasTodas.length === 0 ? 'Esta activación no tiene siluetas: agrégalas en el editor.'
              : siluetasQuedan.length ? 'Siluetas disponibles: ' + siluetasQuedan.length + ' de ' + siluetasTodas.length
              : 'Ya se usaron todas las siluetas (' + siluetasTodas.length + ').'}
            {siluetasTodas.length > 0 && !siluetasQuedan.length && (
              <button className="vg-btn-texto" onClick={usarDeNuevo}>Usarlas de nuevo</button>
            )}
          </div>
          <div className="vg-sil-botones">
            {!grupo && <button className="vg-btn vg-jaguar-btn" onClick={elegir} disabled={girando}>{girando ? 'Eligiendo…' : '🎲 ¿Qué grupo lo hace?'}</button>}
            {grupo && <button className="vg-btn vg-jaguar-btn" onClick={continuar} disabled={!siluetasQuedan.length}>¡Listos! <Icon name="play" size={16} /></button>}
          </div>
        </div>
      )}

      {/* 2 · 3, 2, 1 */}
      {paso === 2 && (
        <div className="vg-sil-tarjeta vg-sil-cuenta">
          {eq && <div className="vg-sil-quien"><strong>{eq.nombre}</strong>, ¡prepárense!</div>}
          <div className="vg-sil-numeros" aria-live="assertive">
            {['3', '2', '1'].map((num, k) => (
              <span key={k} className="vg-sil-num" style={{ animationDelay: k + 's' }}>{num}</span>
            ))}
            <span className="vg-sil-anillo" aria-hidden="true"></span>
          </div>
        </div>
      )}

      {/* 3 · La silueta (7 s) → los ojos, y el temporizador debajo */}
      {paso === 3 && (
        <div className="vg-sil-tarjeta vg-sil-vista">
          <div className="vg-sil-marco">
            {verImagen && silueta ? (
              <img src={urlImagen(silueta)} alt="Silueta" className="vg-sil-img" referrerPolicy="no-referrer" />
            ) : (
              <div className="vg-sil-memoria"><OjosJaguar /><span>¡Ahora, de memoria!</span></div>
            )}
          </div>
          <div className={'vg-sil-reloj' + (restante <= 5 ? ' final' : '')} role="timer" aria-live="off">
            <b>{restante}</b><span>s</span>
            <div className="vg-sil-barra"><i style={{ transform: 'scaleX(' + fraccion + ')' }}></i></div>
          </div>
          <button className="vg-btn vg-btn-sec vg-sil-saltar" onClick={saltar}>Terminar ya</button>
        </div>
      )}

      {/* 4 · ¿Ganadores? */}
      {paso === 4 && eq && (
        <div className={'vg-sil-tarjeta vg-sil-resultado' + (resultado === 'si' ? ' gano' : resultado === 'no' ? ' perdio' : '')}>
          <div className="vg-sil-pregunta">¿Ganadores?</div>
          <div className="vg-sil-equipo-final"><strong>{eq.nombre}</strong></div>
          <div className="vg-enlace-puntos vg-sil-puntos">
            <span>Puntos</span>
            <button onClick={() => jaguarPunto(grupo.i, -1)} disabled={!eq.puntos} aria-label="Quitar un punto">−</button>
            <b>{eq.puntos}</b>
            <button onClick={() => jaguarPunto(grupo.i, 1)} aria-label="Sumar un punto">+1</button>
          </div>
          {resultado === null && (
            <div className="vg-sil-botones">
              <button className="vg-btn vg-jaguar-btn" onClick={() => resolver(true)}>¡Lo lograron! +1</button>
              <button className="vg-btn vg-sil-btn-no" onClick={() => resolver(false)}>No lo lograron</button>
            </div>
          )}
          {resultado === 'si' && (
            <React.Fragment>
              <div className="vg-sil-celebra" aria-hidden="true">
                {Array.from({ length: 28 }, (_, k) => (
                  <i key={k} style={{ '--a': (k * 360 / 28) + 'deg', '--d': (24 + (k % 4) * 9) + 'vh', '--col': ['#39FF14', '#2F80FF', '#FFE600', 'var(--c)'][k % 4], animationDelay: (k % 5) * 0.04 + 's' }}></i>
                ))}
              </div>
              <div className="vg-sil-mensaje">¡Lo lograron!</div>
            </React.Fragment>
          )}
          {resultado === 'no' && <div className="vg-sil-mensaje">¡Casi! No lo lograron</div>}
          {resultado !== null && (
            <div className="vg-sil-botones">
              <button className="vg-btn vg-btn-sec" onClick={() => resolver(resultado !== 'si')}>{resultado === 'si' ? 'Cambiar: no lo lograron' : 'Cambiar: sí lo lograron'}</button>
              <button className="vg-btn vg-jaguar-btn" onClick={otro}>↻ Otro grupo</button>
            </div>
          )}
          {resultado === 'si' && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={eq} i={grupo.i} id={a.id} />}
        </div>
      )}
    </div>
  );
}

/* ======================= HAZ UN ORIGAMI (dos tarjetas) =======================
     1. El reto: instrucción, imagen de la figura y, SOLO si se activó en el
        editor, un temporizador (al llegar a 0 pasa solo a la tarjeta 2).
     2. ¿Ganadores?: se tocan los equipos que lo lograron (+1 punto cada uno;
        tocar otra vez lo corrige), con celebración. El último elegido responde
        la activación enlazada. Si es duelo, solo juega la pareja.
   El celular ve la tarjeta y tiene los mismos botones (órdenes 'og-*'). */
function OrigamiJaguar({ a, equipos, duelo, onEnfrentar }) {
  const participantes = (duelo ? duelo.pareja : equipos.map((_, i) => i)).filter((i) => equipos[i]);
  const conReloj = !!a.temporizador;
  const total = Math.max(10, a.tiempoReto || 120);
  const [paso, setPaso] = React.useState(1);              // 1 reto · 2 ¿ganadores?
  const [corriendo, setCorriendo] = React.useState(false);
  const [restante, setRestante] = React.useState(total);
  const [tiempo, setTiempo] = React.useState(false);      // "¡Tiempo!" al llegar a 0
  const [ganadores, setGanadores] = React.useState([]);   // en el orden en que se eligieron
  const [ronda, setRonda] = React.useState(1);

  // Temporizador (opcional): cuenta, "¡Tiempo!" y pasa a ¿Ganadores?
  React.useEffect(() => {
    if (!corriendo) return undefined;
    const inicio = performance.now() - (total - restante) * 1000;
    let salto = null;
    const iv = setInterval(() => {
      const quedan = Math.max(0, Math.ceil(total - (performance.now() - inicio) / 1000));
      setRestante(quedan);
      if (quedan <= 0) {
        clearInterval(iv); setCorriendo(false); setTiempo(true);
        salto = setTimeout(() => setPaso(2), 1400);
      }
    }, 200);
    return () => { clearInterval(iv); if (salto) clearTimeout(salto); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);
  const empezar = () => { if (paso === 1 && conReloj && !corriendo && restante > 0) setCorriendo(true); };
  const pausar = () => setCorriendo(false);
  const aGanadores = () => { if (paso === 1) { setCorriendo(false); setPaso(2); } };
  const alternar = (i) => {
    if (paso !== 2 || !equipos[i] || !participantes.includes(i)) return;
    if (ganadores.includes(i)) { jaguarPunto(i, -1); setGanadores((g) => g.filter((x) => x !== i)); }
    else { jaguarPunto(i, 1); setGanadores((g) => [...g, i]); }
  };
  const otraRonda = () => { setPaso(1); setGanadores([]); setCorriendo(false); setTiempo(false); setRestante(total); setRonda((r) => r + 1); };
  const ultimo = ganadores.length ? ganadores[ganadores.length - 1] : null;

  // Estado y órdenes del celular.
  React.useEffect(() => {
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, enlace: !!a.enlace, duelo: !!duelo,
      origami: { paso, conReloj, corriendo, restante, total, tiempo, ganadores, participantes },
      ganador: ultimo,
    } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, corriendo, conReloj && Math.ceil(restante / 5), tiempo, ganadores.join(',')]);
  useOrdenMando((o) => {
    if (o.accion === 'og-empezar') empezar();
    else if (o.accion === 'og-pausar') pausar();
    else if (o.accion === 'og-ganadores') aGanadores();
    else if (o.accion === 'og-ganador') alternar(o.i);
    else if (o.accion === 'og-otra') otraRonda();
  });

  const fraccion = restante / total;
  const mmss = Math.floor(restante / 60) + ':' + String(restante % 60).padStart(2, '0');
  return (
    <div className="vg-sil vg-og">
      <ol className="vg-sil-pasos" aria-label="Pasos">
        {['Reto', '¿Ganadores?'].map((p, k) => <li key={k} className={k + 1 === paso ? 'on' : k + 1 < paso ? 'hecho' : ''}><b>{k + 1}</b>{p}</li>)}
      </ol>

      {/* 1 · El reto */}
      {paso === 1 && (
        <div className="vg-sil-tarjeta" key={'r' + ronda}>
          {a.texto && a.texto.trim() && <p className="vg-sil-instruccion">{a.texto}</p>}
          <ImagenActivacion a={a} />
          <EquiposEnJuego equipos={equipos} participantes={participantes} duelo={duelo}
            etiqueta={duelo ? 'Concursan' : 'Concursan todos los equipos'} />
          {conReloj && (
            <div className={'vg-sil-reloj vg-og-reloj' + (restante <= 10 ? ' final' : '')} role="timer" aria-live="off">
              <b>{mmss}</b><span>{tiempo ? '¡Tiempo!' : corriendo ? '' : restante < total ? 'en pausa' : ''}</span>
              <div className="vg-sil-barra"><i style={{ transform: 'scaleX(' + fraccion + ')' }}></i></div>
            </div>
          )}
          {tiempo && <div className="vg-sil-mensaje vg-og-tiempo">¡Tiempo!</div>}
          {!tiempo && (
            <div className="vg-sil-botones">
              {conReloj && !corriendo && <button className="vg-btn vg-jaguar-btn" onClick={empezar}>{restante < total ? '▶ Seguir' : '▶ Empezar'}</button>}
              {conReloj && corriendo && <button className="vg-btn vg-btn-sec" onClick={pausar}>❚❚ Pausar</button>}
              <button className={'vg-btn ' + (conReloj ? 'vg-btn-sec' : 'vg-jaguar-btn')} onClick={aGanadores}>¿Ganadores? <Icon name="play" size={16} /></button>
            </div>
          )}
        </div>
      )}

      {/* 2 · ¿Ganadores? (+1 punto a cada equipo que lo logró) */}
      {paso === 2 && (
        <div className={'vg-sil-tarjeta vg-sil-resultado' + (ganadores.length ? ' gano' : '')} style={ultimo !== null ? { '--c': equipos[ultimo].color } : undefined}>
          {ultimo !== null && (
            <div className="vg-sil-celebra" key={'c' + ganadores.join('-')} aria-hidden="true">
              {Array.from({ length: 28 }, (_, k) => (
                <i key={k} style={{ '--a': (k * 360 / 28) + 'deg', '--d': (24 + (k % 4) * 9) + 'vh', '--col': ['#39FF14', '#2F80FF', '#FFE600', 'var(--c)'][k % 4], animationDelay: (k % 5) * 0.04 + 's' }}></i>
              ))}
            </div>
          )}
          {/* El título se vuelve "¡Lo lograron!" en cuanto hay un ganador. */}
          {ultimo !== null
            ? <div className="vg-sil-mensaje" key={'m' + ganadores.length}>¡Lo lograron!</div>
            : <div className="vg-sil-pregunta">¿Ganadores?</div>}
          <div className="vg-og-nota">Toca los equipos que lo lograron: +1 punto a cada uno.</div>
          <div className="vg-og-equipos">
            {participantes.map((i) => {
              const e = equipos[i];
              const gano = ganadores.includes(i);
              return (
                <button key={i} className={'vg-jaguar-rival' + (gano ? ' gano' : '')} style={{ '--c': e.color }}
                  onClick={() => alternar(i)} aria-pressed={gano}>
                  <strong>{e.nombre}</strong>
                  <span>{gano ? '¡Lo logró! +1' : 'Lo logró'} · {e.puntos} {e.puntos === 1 ? 'punto' : 'puntos'}</span>
                </button>
              );
            })}
          </div>
          <div className="vg-sil-botones">
            <button className="vg-btn vg-btn-sec" onClick={otraRonda}>↻ Otra ronda</button>
            {duelo && <button className="vg-btn vg-btn-sec" onClick={onEnfrentar}>⚔ Enfrentar equipos</button>}
          </div>
          {ultimo !== null && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={equipos[ultimo]} i={ultimo} id={a.id} />}
        </div>
      )}
    </div>
  );
}

/* ============== RESPONDE EN CUADERNO O TABLERO (tres tarjetas) ==============
     1. Pregunta · 2. Responder · 3. ¿Ganador?  Cronómetro en las tarjetas 1 y 2.
   a.pantalla (editor):
     · 'videobeam': en la 2 cada equipo tiene un recuadro GRANDE proyectado en el
       tablero para escribir; tocar un recuadro lo elige ganador y pasa a la 3.
     · 'televisor': en la 2 solo aparece la pregunta (responden en el cuaderno).
   Un solo ganador (+1; elegir otro le pasa el punto). El ganador responde la
   activación enlazada. Si es duelo, solo juega la pareja. Órdenes: 'cq-*'. */
function CuadernoJaguar({ a, equipos, duelo, onEnfrentar }) {
  const participantes = (duelo ? duelo.pareja : equipos.map((_, i) => i)).filter((i) => equipos[i]);
  const videobeam = a.pantalla !== 'televisor';
  const total = Math.max(10, a.tiempoReto || 180);
  const pregunta = (a.texto || '').trim();
  const [paso, setPaso] = React.useState(1);              // 1 pregunta · 2 responder · 3 ¿ganador?
  const [corriendo, setCorriendo] = React.useState(false);
  const [restante, setRestante] = React.useState(total);
  const [tiempo, setTiempo] = React.useState(false);      // "¡Tiempo!" al llegar a 0
  const [ganador, setGanador] = React.useState(null);
  const [ronda, setRonda] = React.useState(1);

  // Cronómetro: cuenta hacia atrás y al llegar a 0 muestra "¡Tiempo!" (el docente decide cuándo seguir).
  React.useEffect(() => {
    if (!corriendo) return undefined;
    const inicio = performance.now() - (total - restante) * 1000;
    const iv = setInterval(() => {
      const quedan = Math.max(0, Math.ceil(total - (performance.now() - inicio) / 1000));
      setRestante(quedan);
      if (quedan <= 0) { clearInterval(iv); setCorriendo(false); setTiempo(true); }
    }, 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [corriendo]);
  const empezar = () => { if (paso < 3 && !corriendo && restante > 0) setCorriendo(true); };
  const pausar = () => setCorriendo(false);
  const responder = () => { if (paso === 1) { setPaso(2); if (restante > 0) setCorriendo(true); } };
  const aGanador = () => { if (paso < 3) { setCorriendo(false); setPaso(3); } };
  const volver = () => { if (paso === 3) setPaso(2); };
  const elegir = (i) => {
    if (paso < 2 || !equipos[i] || !participantes.includes(i)) return;
    if (ganador === i) {
      if (paso === 3) { jaguarPunto(i, -1); setGanador(null); } else setPaso(3);   // tocar otra vez lo corrige
      return;
    }
    if (ganador !== null) jaguarPunto(ganador, -1);
    jaguarPunto(i, 1); setGanador(i); setCorriendo(false); setPaso(3);
  };
  const otraRonda = () => { setPaso(1); setGanador(null); setCorriendo(false); setTiempo(false); setRestante(total); setRonda((r) => r + 1); };

  // Estado y órdenes del celular.
  React.useEffect(() => {
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, enlace: !!a.enlace, duelo: !!duelo,
      cuaderno: { paso, videobeam, corriendo, restante, total, tiempo, participantes },
      ganador,
    } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, corriendo, Math.ceil(restante / 5), tiempo, ganador]);
  useOrdenMando((o) => {
    if (o.accion === 'cq-empezar') empezar();
    else if (o.accion === 'cq-pausar') pausar();
    else if (o.accion === 'cq-responder') responder();
    else if (o.accion === 'cq-ganador-paso') aGanador();
    else if (o.accion === 'cq-ganador') elegir(o.i);
    else if (o.accion === 'cq-volver') volver();
    else if (o.accion === 'cq-otra') otraRonda();
  });

  const mmss = Math.floor(restante / 60) + ':' + String(restante % 60).padStart(2, '0');
  const reloj = (
    <div className={'vg-sil-reloj vg-og-reloj' + (restante <= 10 ? ' final' : '')} role="timer" aria-live="off">
      <b>{mmss}</b><span>{tiempo ? '¡Tiempo!' : corriendo ? '' : restante < total ? 'en pausa' : ''}</span>
      <div className="vg-sil-barra"><i style={{ transform: 'scaleX(' + (restante / total) + ')' }}></i></div>
    </div>
  );
  const botonReloj = tiempo ? null : corriendo
    ? <button className="vg-btn vg-btn-sec" onClick={pausar}>❚❚ Pausar</button>
    : <button className="vg-btn vg-btn-sec" onClick={empezar}>{restante < total ? '▶ Seguir' : '▶ Empezar'}</button>;
  const np = participantes.length;   // 2–3 en una fila · 4 en 2×2 · 5–6 en 3 · 7–8 en 4 · 9–10 en 5
  const cols = np <= 3 ? np : np === 4 ? 2 : np <= 6 ? 3 : np <= 8 ? 4 : 5;
  const eqGanador = ganador !== null ? equipos[ganador] : null;

  return (
    <div className="vg-sil vg-og vg-cq">
      {!(paso === 2 && videobeam) && (
        <ol className="vg-sil-pasos" aria-label="Pasos">
          {['Pregunta', videobeam ? 'Tablero' : 'Cuaderno', '¿Ganador?'].map((p, k) => <li key={k} className={k + 1 === paso ? 'on' : k + 1 < paso ? 'hecho' : ''}><b>{k + 1}</b>{p}</li>)}
        </ol>
      )}

      {/* 1 · La pregunta */}
      {paso === 1 && (
        <div className="vg-sil-tarjeta" key={'p' + ronda}>
          <div className="vg-cq-modo">{videobeam ? '📽 Respondan en el tablero' : '📓 Respondan en el cuaderno'}</div>
          {pregunta && <p className="vg-cq-pregunta">{pregunta}</p>}
          <ImagenActivacion a={a} />
          <EquiposEnJuego equipos={equipos} participantes={participantes} duelo={duelo}
            etiqueta={duelo ? 'Concursan' : 'Concursan todos los equipos'} />
          {reloj}
          <div className="vg-sil-botones">
            {botonReloj}
            <button className="vg-btn vg-jaguar-btn" onClick={responder}>{videobeam ? 'Mostrar recuadros' : 'Responder'} <Icon name="play" size={16} /></button>
          </div>
        </div>
      )}

      {/* 2 · Videobeam: un recuadro grande por equipo para escribir en el tablero */}
      {paso === 2 && videobeam && (
        <React.Fragment>
          <div className="vg-cq-barra">
            {pregunta && <p className="vg-cq-pregunta">{pregunta}</p>}
            {reloj}
            <div className="vg-sil-botones">
              {botonReloj}
              <button className="vg-btn vg-btn-sec" onClick={aGanador}>¿Ganador? <Icon name="play" size={16} /></button>
            </div>
          </div>
          <div className="vg-cq-tablero" style={{ '--cols': cols }}>
            {participantes.map((i) => (
              <button key={i} className="vg-cq-recuadro" style={{ '--c': equipos[i].color }}
                onClick={() => elegir(i)} title={'Elegir al ' + equipos[i].nombre + ' como ganador (+1 punto)'}>
                <span className="vg-cq-nombre">{equipos[i].nombre}</span>
                <span className="vg-cq-elegir">🏆 Elegir ganador</span>
              </button>
            ))}
          </div>
          {tiempo && <div className="vg-sil-mensaje vg-og-tiempo vg-cq-tiempo">¡Tiempo!</div>}
        </React.Fragment>
      )}

      {/* 2 · Televisor: solo la pregunta (responden en el cuaderno) */}
      {paso === 2 && !videobeam && (
        <div className="vg-sil-tarjeta vg-cq-tv">
          <div className="vg-cq-modo">📓 Escriban la respuesta en el cuaderno</div>
          {pregunta && <p className="vg-cq-pregunta">{pregunta}</p>}
          {reloj}
          {tiempo && <div className="vg-sil-mensaje vg-og-tiempo">¡Tiempo!</div>}
          <div className="vg-sil-botones">
            {botonReloj}
            <button className="vg-btn vg-jaguar-btn" onClick={aGanador}>¿Ganador? <Icon name="play" size={16} /></button>
          </div>
        </div>
      )}

      {/* 3 · ¿Ganador? (+1 punto a un solo equipo) */}
      {paso === 3 && (
        <div className={'vg-sil-tarjeta vg-sil-resultado' + (eqGanador ? ' gano' : '')} style={eqGanador ? { '--c': eqGanador.color } : undefined}>
          {eqGanador && (
            <div className="vg-sil-celebra" key={'c' + ganador} aria-hidden="true">
              {Array.from({ length: 28 }, (_, k) => (
                <i key={k} style={{ '--a': (k * 360 / 28) + 'deg', '--d': (24 + (k % 4) * 9) + 'vh', '--col': ['#39FF14', '#2F80FF', '#FFE600', 'var(--c)'][k % 4], animationDelay: (k % 5) * 0.04 + 's' }}></i>
              ))}
            </div>
          )}
          {eqGanador ? (
            <React.Fragment>
              <div className="vg-sil-mensaje" key={'m' + ganador}>¡Ganador!</div>
              <div className="vg-sil-equipo-final"><strong>{eqGanador.nombre}</strong></div>
            </React.Fragment>
          ) : <div className="vg-sil-pregunta">¿Ganador?</div>}
          <div className="vg-og-nota">Toca el equipo que mejor respondió: +1 punto.</div>
          <div className="vg-og-equipos">
            {participantes.map((i) => {
              const e = equipos[i];
              const gano = ganador === i;
              return (
                <button key={i} className={'vg-jaguar-rival' + (gano ? ' gano' : '')} style={{ '--c': e.color }}
                  onClick={() => elegir(i)} aria-pressed={gano}>
                  <strong>{e.nombre}</strong>
                  <span>{gano ? '¡Ganó! +1' : 'Ganó'} · {e.puntos} {e.puntos === 1 ? 'punto' : 'puntos'}</span>
                </button>
              );
            })}
          </div>
          <div className="vg-sil-botones">
            <button className="vg-btn vg-btn-sec" onClick={volver}>← {videobeam ? 'Volver a los recuadros' : 'Volver a la pregunta'}</button>
            <button className="vg-btn vg-btn-sec" onClick={otraRonda}>↻ Otra ronda</button>
            {duelo && <button className="vg-btn vg-btn-sec" onClick={onEnfrentar}>⚔ Enfrentar equipos</button>}
          </div>
          {eqGanador && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={eqGanador} i={ganador} id={a.id} />}
        </div>
      )}
    </div>
  );
}

/* ======================= MÍMICA (dos tarjetas) =======================
   Cada equipo tiene SUS palabras (a.palabrasEquipo[i], una por renglón).
     1. Mímica: el estudiante pasa al frente; la palabra está oculta y con
        «Ver palabra» aparece solo MIMICA_VER_S segundos (se puede volver a ver).
     2. ¿Correcto?: «¡Ganador! +1» o «No lo adivinaron».
   Botones: Ver palabra · Siguiente palabra · Ganador · Cambio de equipo.
   Una palabra usada no vuelve a salir en la presentación. Órdenes: 'mm-*'. */
const MIMICA_VER_S = 5;
function palabrasMimica(a, i) {
  return ((a.palabrasEquipo || [])[i] || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}
function tomarMimica(a, i) {
  if (i === undefined || i === null) return null;
  const clave = a.id + ':' + i;
  const usadas = ((sesionJaguar.mimicaUsadas || {})[clave]) || [];
  const libres = palabrasMimica(a, i).filter((p) => !usadas.includes(p));
  if (!libres.length) return null;
  const p = libres[Math.floor(Math.random() * libres.length)];
  sesionJaguar.mimicaUsadas = { ...(sesionJaguar.mimicaUsadas || {}), [clave]: [...usadas, p] };
  return p;
}
function mimicaQuedan(a, i) {
  const usadas = ((sesionJaguar.mimicaUsadas || {})[a.id + ':' + i]) || [];
  const todas = palabrasMimica(a, i);
  return { total: todas.length, quedan: todas.filter((p) => !usadas.includes(p)).length };
}

/* Todos los equipos de la presentación, siempre a la vista: los que concursan
   ahora se ven encendidos, los que esperan su turno quedan apagados y el
   equipo activo (el que actúa / responde) va resaltado. Si se pasa onElegir,
   tocar un equipo que concursa lo vuelve el activo. */
function EquiposEnJuego({ equipos, participantes, activo, etiqueta, duelo, onElegir }) {
  const juegan = participantes || equipos.map((_, i) => i);
  return (
    <div className="vg-eqj" aria-label="Equipos que concursan">
      {etiqueta && <div className="vg-eqj-titulo">{etiqueta}</div>}
      <div className="vg-sil-equipos vg-eqj-fila">
        {equipos.map((e, i) => {
          const juega = juegan.includes(i);
          const cls = 'vg-sil-chip' + (i === activo ? ' elegido' : '') + (juega ? '' : ' vg-eqj-fuera') + (onElegir && juega ? ' vg-eqj-boton' : '');
          return onElegir && juega
            ? <button key={i} className={cls} style={{ '--c': e.color }} onClick={() => onElegir(i)} aria-pressed={i === activo}>{e.nombre}</button>
            : <span key={i} className={cls} style={{ '--c': e.color }} title={juega ? '' : 'Espera su turno'}>{e.nombre}</span>;
        })}
      </div>
      {duelo && <div className="vg-eqj-duelo">⚔ {duelo.texto}</div>}
    </div>
  );
}

function MimicaJaguar({ a, equipos, duelo, onEnfrentar }) {
  const participantes = (duelo ? duelo.pareja : equipos.map((_, i) => i)).filter((i) => equipos[i]);
  // El turno sigue donde quedó en la presentación (al volver a esta mímica).
  const [turno, setTurno] = React.useState(() => ((sesionJaguar.mimicaTurno || {})[a.id] || 0) % Math.max(1, participantes.length));
  const iEq = participantes[turno];
  const eq = equipos[iEq];
  const [palabra, setPalabra] = React.useState(() => tomarMimica(a, iEq));
  const [paso, setPaso] = React.useState(1);            // 1 mímica · 2 ¿correcto?
  const [viendo, setViendo] = React.useState(false);
  const [vez, setVez] = React.useState(0);              // "Ver otra vez" reinicia los 5 s
  const [restante, setRestante] = React.useState(MIMICA_VER_S);
  const [resultado, setResultado] = React.useState(null);   // 'si' | 'no'
  const [numero, setNumero] = React.useState(1);        // palabra n.º (del equipo actual)
  const { total, quedan } = mimicaQuedan(a, iEq);

  // La palabra se ve MIMICA_VER_S segundos y se oculta.
  React.useEffect(() => {
    if (!viendo) return undefined;
    const inicio = performance.now();
    setRestante(MIMICA_VER_S);
    const iv = setInterval(() => {
      const r = Math.max(0, MIMICA_VER_S - (performance.now() - inicio) / 1000);
      setRestante(Math.ceil(r));
      if (r <= 0) { clearInterval(iv); setViendo(false); }
    }, 100);
    return () => clearInterval(iv);
  }, [viendo, vez]);

  const ver = () => { if (palabra && paso === 1) { setViendo(true); setVez((v) => v + 1); } };
  const nuevaPalabra = (i) => { setPalabra(tomarMimica(a, i)); setPaso(1); setViendo(false); setResultado(null); };
  const siguiente = () => { nuevaPalabra(iEq); setNumero((n) => n + 1); };
  const aCorrecto = () => { if (paso === 1 && palabra) { setViendo(false); setPaso(2); } };
  const resolver = (si) => {
    if (paso !== 2 || !eq) return;
    if (si && resultado !== 'si') jaguarPunto(iEq, 1);
    if (!si && resultado === 'si') jaguarPunto(iEq, -1);
    setResultado(si ? 'si' : 'no');
  };
  const cambio = () => {
    if (participantes.length < 2) return;
    const t = (turno + 1) % participantes.length;
    sesionJaguar.mimicaTurno = { ...(sesionJaguar.mimicaTurno || {}), [a.id]: t };
    setTurno(t); setNumero(1); nuevaPalabra(participantes[t]);
  };
  // Elegir directamente qué equipo hace la mímica (en pantalla o desde el celular).
  const elegirTurno = (i) => {
    const t = participantes.indexOf(i);
    if (t < 0 || t === turno) return;
    sesionJaguar.mimicaTurno = { ...(sesionJaguar.mimicaTurno || {}), [a.id]: t };
    setTurno(t); setNumero(1); nuevaPalabra(i);
  };
  const reiniciar = () => {
    const m = { ...(sesionJaguar.mimicaUsadas || {}) }; delete m[a.id + ':' + iEq];
    sesionJaguar.mimicaUsadas = m; nuevaPalabra(iEq);
  };

  // Estado y órdenes del celular (el docente ve la palabra en su celular).
  React.useEffect(() => {
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, enlace: !!a.enlace, duelo: !!duelo,
      mimica: { paso, equipo: iEq, palabra: palabra || '', viendo, resultado, quedan, total, numero, participantes },
      ganador: resultado === 'si' ? iEq : null,
    } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paso, iEq, palabra, viendo, resultado, quedan]);
  useOrdenMando((o) => {
    if (o.accion === 'mm-ver') ver();
    else if (o.accion === 'mm-siguiente') siguiente();
    else if (o.accion === 'mm-correcto') aCorrecto();
    else if (o.accion === 'mm-resultado') resolver(!!o.ok);
    else if (o.accion === 'mm-cambio') cambio();
    else if (o.accion === 'mm-turno') elegirTurno(o.i);
    else if (o.accion === 'mm-reiniciar') reiniciar();
  });

  if (!eq) return null;
  return (
    <div className="vg-sil vg-mm" style={{ '--c': eq.color }}>
      <ol className="vg-sil-pasos" aria-label="Pasos">
        {['Mímica', '¿Correcto?'].map((p, k) => <li key={k} className={k + 1 === paso ? 'on' : k + 1 < paso ? 'hecho' : ''}><b>{k + 1}</b>{p}</li>)}
      </ol>
      <EquiposEnJuego equipos={equipos} participantes={participantes} activo={iEq} duelo={duelo}
        etiqueta={paso === 1 && participantes.length > 1 ? '🎭 ¿Quién hace la mímica? (toca un equipo)' : null}
        onElegir={paso === 1 && participantes.length > 1 ? elegirTurno : null} />
      {duelo && paso === 1 && <div className="vg-sil-botones vg-eqj-enfrentar"><button className="vg-btn vg-btn-sec" onClick={onEnfrentar}>⚔ Enfrentar otros equipos</button></div>}

      {/* 1 · Mímica: la palabra oculta (5 s al tocar «Ver palabra») */}
      {paso === 1 && (
        <div className="vg-sil-tarjeta" key={'p' + iEq + '-' + numero}>
          <div className="vg-mm-turno">
            <span>Turno del <strong>{eq.nombre}</strong></span>
            <small>{total ? 'Palabra ' + numero + ' · quedan ' + quedan + ' de ' + total : 'Sin palabras'}</small>
          </div>
          {palabra ? (
            <div className={'vg-mm-caja' + (viendo ? ' ver' : '')} aria-live="polite">
              {viendo ? (
                <React.Fragment>
                  <span className="vg-mm-palabra" key={'v' + vez}>{palabra}</span>
                  <div className="vg-mm-cuenta"><b>{restante}</b><div className="vg-sil-barra"><i key={'b' + vez}></i></div></div>
                </React.Fragment>
              ) : (
                <div className="vg-sil-memoria">
                  <OjosJaguar />
                  <span>{vez ? 'Palabra oculta · ¡a actuar!' : 'Que un estudiante pase al frente'}</span>
                  <small className="vg-mm-ayuda">{vez ? 'Si la necesita, puede verla otra vez.' : 'Al tocar «Ver palabra» aparece solo ' + MIMICA_VER_S + ' segundos.'}</small>
                </div>
              )}
              {a.texto && a.texto.trim() && !viendo && <p className="vg-mm-indicacion">{a.texto}</p>}
            </div>
          ) : (
            <div className="vg-sil-quedan agotadas">
              {total ? 'Ya se usaron todas las palabras del ' + eq.nombre + ' (' + total + ').' : 'El ' + eq.nombre + ' no tiene palabras: agrégalas en el editor.'}
              {total > 0 && <button className="vg-btn-texto" onClick={reiniciar}>Usarlas de nuevo</button>}
            </div>
          )}
          <div className="vg-sil-botones">
            <button className="vg-btn vg-jaguar-btn" onClick={ver} disabled={!palabra}>👁 {vez ? 'Ver otra vez' : 'Ver palabra'}</button>
            <button className="vg-btn vg-btn-sec" onClick={siguiente}>⏭ Siguiente palabra</button>
            <button className="vg-btn vg-btn-sec" onClick={aCorrecto} disabled={!palabra}>¿Correcto? <Icon name="play" size={16} /></button>
            {participantes.length > 1 && <button className="vg-btn vg-btn-sec" onClick={cambio}>⇄ Cambio de equipo</button>}
          </div>
        </div>
      )}

      {/* 2 · ¿Correcto? */}
      {paso === 2 && (
        <div className={'vg-sil-tarjeta vg-sil-resultado' + (resultado === 'si' ? ' gano' : resultado === 'no' ? ' perdio' : '')}>
          {resultado === 'si' && (
            <div className="vg-sil-celebra" aria-hidden="true">
              {Array.from({ length: 28 }, (_, k) => (
                <i key={k} style={{ '--a': (k * 360 / 28) + 'deg', '--d': (24 + (k % 4) * 9) + 'vh', '--col': ['#39FF14', '#2F80FF', '#FFE600', 'var(--c)'][k % 4], animationDelay: (k % 5) * 0.04 + 's' }}></i>
              ))}
            </div>
          )}
          {resultado === 'si' ? <div className="vg-sil-mensaje">¡Correcto!</div>
            : resultado === 'no' ? <div className="vg-sil-mensaje">¡Casi! No la adivinaron</div>
            : <div className="vg-sil-pregunta">¿Correcto?</div>}
          <div className="vg-mm-era">La palabra era <strong>{palabra}</strong></div>
          <div className="vg-ah-final-fila">
            <div className="vg-sil-equipo-final"><strong>{eq.nombre}</strong></div>
            <div className="vg-enlace-puntos vg-sil-puntos">
              <span>Puntos</span>
              <button onClick={() => jaguarPunto(iEq, -1)} disabled={!eq.puntos} aria-label="Quitar un punto">−</button>
              <b>{eq.puntos}</b>
              <button onClick={() => jaguarPunto(iEq, 1)} aria-label="Sumar un punto">+1</button>
            </div>
          </div>
          {resultado === null ? (
            <div className="vg-sil-botones">
              <button className="vg-btn vg-jaguar-btn" onClick={() => resolver(true)}>🏆 ¡Ganador! +1</button>
              <button className="vg-btn vg-sil-btn-no" onClick={() => resolver(false)}>No la adivinaron</button>
            </div>
          ) : (
            <div className="vg-sil-botones">
              <button className="vg-btn-texto" onClick={() => resolver(resultado !== 'si')}>{resultado === 'si' ? 'Cambiar: no la adivinaron' : 'Cambiar: sí la adivinaron'}</button>
            </div>
          )}
          <div className="vg-sil-botones">
            <button className="vg-btn vg-jaguar-btn" onClick={siguiente}>⏭ Siguiente palabra</button>
            {participantes.length > 1 && <button className="vg-btn vg-btn-sec" onClick={cambio}>⇄ Cambio de equipo</button>}
            {duelo && <button className="vg-btn vg-btn-sec" onClick={onEnfrentar}>⚔ Enfrentar equipos</button>}
          </div>
          {resultado === 'si' && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={eq} i={iEq} id={a.id} />}
        </div>
      )}
    </div>
  );
}

/* Los equipos con sus estudiantes, en el orden de los colores (al iniciar el
   Modo Jaguar y con "Ver equipos"). Solo nombres. */
function ListaGruposJaguar({ equipos }) {
  const muchos = (equipos || []).reduce((m, e) => Math.max(m, (e.miembros || []).length), 0) > 6 || (equipos || []).length > 6;
  return (
    <div className={'vg-jaguar-grilla vg-grupos-grilla' + (muchos ? ' compacta' : '')}>
      {(equipos || []).map((e, i) => (
        <div key={i} className="vg-jaguar-equipo" style={{ '--c': e.color, animationDelay: (i * 0.06) + 's' }}>
          <div className="vg-jaguar-equipo-cabeza"><span>{e.nombre}</span><b>{(e.miembros || []).length}</b></div>
          {(e.miembros || []).length ? (
            <div className="vg-jaguar-miembros">{e.miembros.map((m, k) => <span key={k}>{m}</span>)}</div>
          ) : <div className="vg-jaguar-sin">Sin estudiantes</div>}
        </div>
      ))}
      {!(equipos || []).some((e) => (e.miembros || []).length) && (
        <div className="vg-grupos-aviso">No hay lista de estudiantes: agrégala en el editor («Estudiantes») para repartirlos en los equipos.</div>
      )}
    </div>
  );
}
/* "Ver equipos": encima de todo, en cualquier momento del Modo Jaguar (por si
   al docente o a un estudiante se le olvidó su equipo). Clic fuera, Esc o
   "Cerrar" la cierran; también el celular (orden 'jaguar-grupos'). */
function PantallaGruposJaguar() {
  const s = useJaguarEstado();
  const abierta = !!(s.verGrupos && s.iniciado && s.equipos);
  React.useEffect(() => {
    if (!abierta) return undefined;
    const esc = (e) => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); jaguarVerGrupos(false); } };
    window.addEventListener('keydown', esc, true);
    return () => window.removeEventListener('keydown', esc, true);
  }, [abierta]);
  if (!abierta) return null;
  return (
    <div className="vg-grupos-capa" onClick={() => jaguarVerGrupos(false)} role="dialog" aria-label="Equipos y estudiantes">
      <div className="vg-grupos-caja" onClick={(e) => e.stopPropagation()}>
        <div className="vg-jaguar-cabecera">
          <span className="vg-jaguar-puno">{s.modo === 'capibara' ? '🌿' : <Icon name="puno" size={20} />}</span>
          <span>{s.modo === 'capibara' ? 'Modo Capibara' : 'Modo Jaguar'} · {s.equipos.length} equipos</span>
        </div>
        <h2 className="vg-grupos-titulo">Estos son los equipos</h2>
        <ListaGruposJaguar equipos={s.equipos} />
        <button className="vg-btn vg-jaguar-btn" onClick={() => jaguarVerGrupos(false)}>Cerrar</button>
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
          <button className="vg-btn vg-btn-sec vg-marcador-ganador" onClick={() => { setAbierto(false); jaguarVerGrupos(true); }}
            title="Ver los estudiantes de cada equipo">👥 Ver equipos</button>
          <button className="vg-btn vg-jaguar-btn vg-marcador-ganador" onClick={() => { setAbierto(false); onGanador(); }}
            title="Mostrar a los ganadores hasta este momento">🏁 Finalizar lucha</button>
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
  const vozGanador = useVoz(VOZ_GANADOR, fase === 'ganador', GANADOR_T.duracion, [GANADOR_T.kicker, GANADOR_T.nombre, GANADOR_T.tabla]);
  const vozDesempate = useVoz(VOZ_DESEMPATE, fase === 'desempate', DESEMPATE_T.duracion, [DESEMPATE_T.uno, DESEMPATE_T.dos]);
  // "Exceso de luz" también aquí (esta pantalla queda encima de la presentación).
  const [tono, setTono] = useTonoPresentar();
  // Mientras está la pantalla final, la presentación de debajo deja de pintarse (más fluido).
  React.useEffect(() => {
    document.documentElement.classList.add('vg-final-activo');
    return () => document.documentElement.classList.remove('vg-final-activo');
  }, []);
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
    const dp = vozDesempate.paso;
    return (
      <div className={'vg-jaguar vg-jaguar-final vg-jaguar-rojo tono-' + tono}>
        <div className="vg-jaguar-destello"></div>
        <TonoLateral tono={tono} setTono={setTono} />
        <CabezaJaguar className="final rojo" colorOjos="#FF1E3C" />
        <div className="vg-jaguar-final-texto">
          <div className="vg-jaguar-final-kicker">Empate: {ganadores.map((g) => g.nombre).join(' y ')} · {max} {max === 1 ? 'punto' : 'puntos'}</div>
          {dp >= 1 && <div className="vg-desempate-uno">¡A desempatar!</div>}
          {dp >= 2 && <div className="vg-desempate-dos">Que el docente escoja la lucha final</div>}
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
  // ver(n): ¿ya llegó la n-ésima marca de la voz? (1 = "¡Equipo ganador!", 2 = nombre, 3 = tabla)
  const ver = (n) => !conVoz || vozGanador.paso >= n || vozGanador.fin;
  const colorGanador = !empate && ganadores[0] ? ganadores[0].color : null;
  return (
    <div className={'vg-jaguar vg-jaguar-final tono-' + tono} style={colorGanador ? { '--ganador': colorGanador } : undefined}>
      <div className="vg-jaguar-destello"></div>
      {/* Los ojos arden con el color del equipo ganador. */}
      <TonoLateral tono={tono} setTono={setTono} />
      <CabezaJaguar className="final" colorOjos={colorGanador || '#FFE600'} />
      <div className="vg-jaguar-final-texto">
        {ver(1) && <div className="vg-jaguar-final-kicker">{empate ? '¡Empate de jaguares!' : '¡Equipo ganador!'}</div>}
        {ver(2) && (
          <div className="vg-jaguar-final-nombre">
            {ganadores.map((g, k) => <span key={g.i} style={{ '--c': g.color }}>{k > 0 ? ' y ' : ''}{g.nombre}</span>)}
          </div>
        )}
        {ver(3) && (
          <React.Fragment>
            <div className="vg-jaguar-final-tabla">
              {equipos.map((e, k) => (
                <div key={e.i} className={'vg-jaguar-final-fila' + (e.puntos === max ? ' oro' : '')} style={{ '--c': e.color, animationDelay: k * 0.12 + 's' }}>
                  <span>{k + 1}</span><strong>{e.nombre}</strong><b>{e.puntos} {e.puntos === 1 ? 'punto' : 'puntos'}</b>
                </div>
              ))}
            </div>
            <div className="vg-jaguar-final-acciones">
              {/* Felicitaciones a los ganadores: se puede volver a escuchar (o
                  escuchar si el navegador no dejó sonar). */}
              {!empate && (
                <button className={'vg-btn vg-btn-sec' + (vozGanador.bloqueado ? ' vg-pulsa' : '')}
                  onClick={() => { if (fase !== 'ganador') setFase('ganador'); vozGanador.repetir(); }}>
                  🔊 {vozGanador.bloqueado ? 'Escuchar las felicitaciones' : 'Felicitaciones otra vez'}
                </button>
              )}
              <button className="vg-btn vg-btn-sec" onClick={onVolver}>Volver a la presentación</button>
              <button className="vg-btn vg-jaguar-btn" onClick={onSalir}>Terminar <Icon name="play" size={16} /></button>
            </div>
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

/* ======================= ADIVINA LA PALABRA (ahorcado Jaguar) =======================
   El ahorcado de la plataforma (casillas grandes con líneas de colores, vidas y
   teclado QWERTY) con las reglas del Modo Jaguar:
     · Juegan los equipos del duelo (todos contra todos) o todos los equipos.
     · Turnos: el equipo con el turno dice una letra. Si acierta, sigue; si
       falla, se pierde una vida (son de todos) y el turno pasa al siguiente.
     · Gana el equipo que completa la palabra o la dice entera («¡La adivinó!»):
       +1 punto, celebración y responde la activación enlazada.
     · Si se acaban las 6 vidas, gana el jaguar (nadie suma).
     · Varias palabras: cada una sale una sola vez en la presentación.
       Sin palabras (o agotadas), el docente la escribe oculta, aquí o en el celular.
   Las tildes no importan (A = Á), la Ñ sí cuenta. Órdenes del celular: 'ah-*'. */
const VIDAS_PALABRA = 6;
const FILAS_TECLADO = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
const LINEAS_PALABRA = ['#39FF14', '#2F80FF', '#FFE600'];   // líneas alternadas (verde, azul, amarillo)
const baseLetra = (c) => {
  const m = (c || '').toUpperCase();
  return m === 'Ñ' ? 'Ñ' : m.normalize('NFD').replace(/[̀-ͯ]/g, '');
};
const esLetraJuego = (c) => /^[A-ZÑ]$/.test(baseLetra(c));

/* Palabras de la activación: a.listaPalabras (una por renglón, «palabra = pista»)
   o, en activaciones anteriores, a.palabra. */
function palabrasDe(a) {
  const texto = typeof a.listaPalabras === 'string' ? a.listaPalabras : (a.palabra || '');
  return texto.split(/\r?\n/).map((l) => {
    const k = l.indexOf('=');
    const palabra = (k >= 0 ? l.slice(0, k) : l).trim().replace(/\s+/g, ' ');
    const pista = k >= 0 ? l.slice(k + 1).trim() : '';
    return { palabra, pista };
  }).filter((p) => p.palabra.split('').some(esLetraJuego));
}
function palabrasLibres(a) {
  const todas = palabrasDe(a);
  const usadas = ((sesionJaguar.palabrasUsadas || {})[a.id]) || [];
  return { todas, libres: todas.filter((p) => !usadas.includes(p.palabra.toUpperCase())) };
}
// Reserva una palabra que no haya salido (una vez usada, no vuelve a salir).
function tomarPalabra(a) {
  const { libres } = palabrasLibres(a);
  if (!libres.length) return null;
  const p = libres[Math.floor(Math.random() * libres.length)];
  const mapa = { ...(sesionJaguar.palabrasUsadas || {}) };
  mapa[a.id] = [...(mapa[a.id] || []), p.palabra.toUpperCase()];
  sesionJaguar.palabrasUsadas = mapa;
  return p;
}
function reiniciarPalabras(a) {
  const mapa = { ...(sesionJaguar.palabrasUsadas || {}) };
  delete mapa[a.id];
  sesionJaguar.palabrasUsadas = mapa;
}

/* Corazón neón (vida). `rota`: la vida que se acaba de perder (se parte). */
function VidaJaguar({ viva, rota }) {
  return (
    <svg viewBox="0 0 24 22" className={'vg-ah-vida' + (viva ? ' viva' : '') + (rota ? ' rota' : '')} aria-hidden="true">
      <path d="M12 20.5 3.6 12.3A5.3 5.3 0 0 1 12 5.6a5.3 5.3 0 0 1 8.4 6.7Z" />
      {!viva && <path d="M12.6 6.4 10.6 10.4l2.6 1.8-2 4.4" className="grieta" />}
    </svg>
  );
}

function PalabraJaguar({ a, equipos, duelo, onEnfrentar }) {
  // Quiénes juegan: la pareja del duelo o todos los equipos.
  const participantes = (duelo ? duelo.pareja : equipos.map((_, i) => i)).filter((i) => equipos[i]);
  const [actual, setActual] = React.useState(() => tomarPalabra(a));   // { palabra, pista } | null
  const [, setVersion] = React.useState(0);
  const { todas, libres } = palabrasLibres(a);
  const [usadas, setUsadas] = React.useState([]);          // letras ya dichas (base)
  const [fallosPalabra, setFallosPalabra] = React.useState(0);   // palabras enteras falladas
  const [fase, setFase] = React.useState('turno');         // 'turno' (¿quién empieza?) · 'juego' · 'fin'
  const [turno, setTurno] = React.useState(0);             // posición en `participantes`
  const [inicio, setInicio] = React.useState(0);           // quién empezó (la siguiente palabra la empieza el próximo)
  const [girando, setGirando] = React.useState(false);
  const [luz, setLuz] = React.useState(null);
  const [resultado, setResultado] = React.useState(null);  // 'gano' | 'jaguar' | 'revelada'
  const [ganador, setGanador] = React.useState(null);      // índice del equipo
  const [escrita, setEscrita] = React.useState('');
  const [ultima, setUltima] = React.useState(null);        // { l, ok } última letra (para el aviso)
  const timers = React.useRef([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const letras = actual ? actual.palabra.toUpperCase().split('') : [];
  const objetivo = new Set(letras.filter(esLetraJuego).map(baseLetra));
  const fallosLetra = usadas.filter((u) => !objetivo.has(u)).length;
  const vidas = Math.max(0, VIDAS_PALABRA - fallosLetra - fallosPalabra);
  const iTurno = participantes[turno % Math.max(1, participantes.length)];
  const eqTurno = equipos[iTurno];
  const eqGanador = ganador !== null ? equipos[ganador] : null;
  const fin = fase === 'fin';
  // Al terminar, la tarjeta baja sola hasta los botones del final (si no caben).
  const finRef = React.useRef(null);
  React.useEffect(() => {
    if (!fin || !finRef.current) return undefined;
    const t = setTimeout(() => { if (finRef.current) finRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, 650);
    return () => clearTimeout(t);
  }, [fin]);

  const terminar = (res, i) => {
    setFase('fin'); setResultado(res);
    if (res === 'gano' && i !== undefined && equipos[i]) { setGanador(i); jaguarPunto(i, 1); }
  };
  // ¿Quién empieza? La luz recorre los equipos que juegan y se detiene en uno.
  const sortearInicio = () => {
    if (girando || fase !== 'turno' || !actual) return;
    const destino = Math.floor(Math.random() * participantes.length);
    setGirando(true);
    const pasos = participantes.length * 3 + destino + 1;
    let t = 0;
    for (let k = 0; k < pasos; k++) {
      t += 55 + Math.pow(k / pasos, 3) * 340;
      timers.current.push(setTimeout(() => setLuz(participantes[k % participantes.length]), t));
    }
    timers.current.push(setTimeout(() => { setGirando(false); setLuz(null); setTurno(destino); setInicio(destino); setFase('juego'); }, t + 450));
  };
  const pasarTurno = () => setTurno((t) => (t + 1) % participantes.length);
  const intentar = (c) => {
    const l = baseLetra(c);
    if (fase !== 'juego' || !esLetraJuego(l) || usadas.includes(l)) return;
    const nuevas = [...usadas, l];
    setUsadas(nuevas);
    const ok = objetivo.has(l);
    setUltima({ l, ok, n: nuevas.length });
    if (ok) {
      // Acierto: el mismo equipo sigue; si completa la palabra, gana.
      if ([...objetivo].every((x) => nuevas.includes(x))) terminar('gano', iTurno);
    } else if (vidas - 1 <= 0) terminar('jaguar');
    else pasarTurno();
  };
  // El equipo dijo la palabra entera: bien → gana; mal → pierde una vida y pasa el turno.
  const adivino = () => { if (fase === 'juego') terminar('gano', iTurno); };
  const fallo = () => {
    if (fase !== 'juego') return;
    setFallosPalabra((f) => f + 1);
    setUltima({ l: null, ok: false, n: usadas.length + 100 + fallosPalabra });
    if (vidas - 1 <= 0) terminar('jaguar'); else pasarTurno();
  };
  const revelar = () => { if (fase !== 'fin') terminar('revelada'); };
  const nuevaRonda = (p) => {
    timers.current.forEach(clearTimeout); timers.current = [];
    setActual(p); setUsadas([]); setFallosPalabra(0); setResultado(null); setGanador(null); setUltima(null); setGirando(false); setLuz(null);
    // La siguiente palabra la empieza el equipo que sigue (sin volver a sortear).
    if (fase === 'fin' || fase === 'juego') { const sig = (inicio + 1) % Math.max(1, participantes.length); setInicio(sig); setTurno(sig); setFase(p ? 'juego' : 'turno'); }
    else setFase('turno');
  };
  const otraPalabra = () => nuevaRonda(tomarPalabra(a));
  const usarDeNuevo = () => { reiniciarPalabras(a); setVersion((v) => v + 1); if (!actual) nuevaRonda(tomarPalabra(a)); };
  const usarEscrita = (texto) => {
    const p = (texto || '').trim().replace(/\s+/g, ' ');
    if (!p.split('').some(esLetraJuego)) return;
    setEscrita(''); nuevaRonda({ palabra: p.slice(0, 40), pista: '' });
  };

  // Teclado físico: las letras van al juego (no a los atajos de Presentar, p. ej. L = tono).
  React.useEffect(() => {
    if (fase !== 'juego') return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      if (!esLetraJuego(e.key)) return;
      e.__vgTono = true; e.preventDefault(); e.stopPropagation();
      intentar(e.key);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  });

  // Estado para el celular (mismos botones) y sus órdenes.
  const mascara = letras.map((c) => (!esLetraJuego(c) ? (c === ' ' ? ' ' : c) : (usadas.includes(baseLetra(c)) || fin ? c : '_'))).join('');
  React.useEffect(() => {
    cambiarJaguar(() => ({ desafio: {
      tipo: a.tipo, enlace: !!a.enlace, duelo: !!duelo,
      palabra: { fase, mascara, secreta: actual ? actual.palabra.toUpperCase() : '', pista: actual ? actual.pista : '',
        usadas, aciertos: usadas.filter((u) => objetivo.has(u)), vidas, max: VIDAS_PALABRA,
        turno: fase === 'juego' ? iTurno : null, participantes, girando, resultado,
        quedan: libres.length, total: todas.length, hay: !!actual },
      ganador: resultado === 'gano' ? ganador : null,
    } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, mascara, usadas.length, vidas, iTurno, girando, resultado, ganador, libres.length, actual && actual.palabra]);
  useOrdenMando((o) => {
    if (o.accion === 'ah-letra') intentar(o.l || '');
    else if (o.accion === 'ah-inicio') sortearInicio();
    else if (o.accion === 'ah-adivino') adivino();
    else if (o.accion === 'ah-fallo') fallo();
    else if (o.accion === 'ah-turno') { if (fase === 'juego') pasarTurno(); }
    else if (o.accion === 'ah-revelar') revelar();
    else if (o.accion === 'ah-otra') otraPalabra();
    else if (o.accion === 'ah-reiniciar') usarDeNuevo();
    else if (o.accion === 'ah-palabra') usarEscrita(o.texto);
  });

  // Casillas que se ajustan al largo de la palabra (se ven desde el fondo del salón).
  const nLetras = letras.length;
  // (Cada casilla ocupa su ancho + 14 % de separación; todo cabe en ~78 % de la pantalla.)
  const caja = 'min(' + Math.min(8.4, 78 / Math.max(1, nLetras * 1.14)).toFixed(2) + 'vw, ' + (nLetras <= 7 ? 11 : nLetras <= 10 ? 9.5 : nLetras <= 14 ? 8 : 6.5) + 'vh)';
  let nLinea = -1;
  const colorJuego = fin && resultado === 'gano' && eqGanador ? eqGanador.color : eqTurno ? eqTurno.color : '#39FF14';

  // Sin palabra: el docente la escribe (oculta) o reutiliza las que ya salieron.
  if (!actual) {
    return (
      <div className="vg-ah" style={{ '--c': '#39FF14' }}>
        <div className="vg-sil-tarjeta vg-ah-escribir">
          <div className="vg-sil-quedan agotadas">
            {todas.length ? 'Ya salieron todas las palabras (' + todas.length + ').' : 'Esta activación aún no tiene palabras.'}
            {todas.length > 0 && <button className="vg-btn-texto" onClick={usarDeNuevo}>Usarlas de nuevo</button>}
          </div>
          <label className="vg-ah-escribir-campo">
            <span>Escribe la palabra secreta <small>(se ve con puntos; también desde el celular)</small></span>
            <input type="password" value={escrita} maxLength={40} autoComplete="off" placeholder="••••••"
              onChange={(e) => setEscrita(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); usarEscrita(escrita); } }} />
          </label>
          <button className="vg-btn vg-jaguar-btn" onClick={() => usarEscrita(escrita)} disabled={!escrita.trim()}>Jugar con esta palabra <Icon name="play" size={16} /></button>
        </div>
      </div>
    );
  }

  return (
    <div className={'vg-ah' + (fin ? ' fin ' + resultado : '')} style={{ '--c': colorJuego, '--caja': caja }}>
      {/* Equipos que juegan y de quién es el turno */}
      <div className="vg-ah-cabeza">
        <div className="vg-sil-equipos">
          {/* Todos los equipos: los que no juegan este duelo quedan apagados. */}
          {equipos.map((e, i) => {
            const juega = participantes.includes(i);
            const on = (girando && luz === i) || (fase === 'juego' && iTurno === i) || (fin && ganador === i);
            return <span key={i} className={'vg-sil-chip' + (on ? (girando ? ' luz' : ' elegido') : '') + (juega ? '' : ' vg-eqj-fuera')} style={{ '--c': e.color }} title={juega ? '' : 'Espera su turno'}>{e.nombre}</span>;
          })}
        </div>
        {/* Vidas (de todos): al fallar se parte un corazón */}
        <div key={'v' + (VIDAS_PALABRA - vidas)} className={'vg-ah-vidas' + (vidas < VIDAS_PALABRA ? ' golpe' : '')} role="img" aria-label={'Vidas: ' + vidas + ' de ' + VIDAS_PALABRA}>
          {Array.from({ length: VIDAS_PALABRA }, (_, k) => <VidaJaguar key={k} viva={k < vidas} rota={k === vidas && vidas < VIDAS_PALABRA} />)}
          <b>{vidas}</b>
        </div>
      </div>

      {actual.pista && <div className="vg-ah-pista"><span>Pista</span>{actual.pista}</div>}

      {/* La palabra: casillas grandes con líneas de colores */}
      <div className="vg-ah-palabra" aria-label={'Palabra de ' + objetivo.size + ' letras distintas'}>
        {letras.map((c, i) => {
          if (c === ' ') return <span key={i} className="vg-ah-hueco" aria-hidden="true"></span>;
          if (!esLetraJuego(c)) return <span key={i} className="vg-ah-caja signo">{c}</span>;
          nLinea++;
          const dicha = usadas.includes(baseLetra(c));
          const ver = dicha || fin;
          return (
            <span key={i} className={'vg-ah-caja' + (ver ? ' ver' : '') + (fin && !dicha ? ' faltaba' : '')}
              style={{ '--linea': LINEAS_PALABRA[nLinea % LINEAS_PALABRA.length], animationDelay: fin && !dicha ? (nLinea * 0.06) + 's' : undefined }}>
              {ver ? c : ''}
            </span>
          );
        })}
      </div>

      {/* ¿Quién empieza? */}
      {fase === 'turno' && (
        <div className="vg-sil-botones">
          <button className="vg-btn vg-jaguar-btn" onClick={sortearInicio} disabled={girando}>{girando ? 'Eligiendo…' : '🎲 ¿Qué equipo empieza?'}</button>
        </div>
      )}

      {/* En juego: turno, teclado y la palabra entera */}
      {fase === 'juego' && eqTurno && (
        <React.Fragment>
          <div className="vg-ah-turno" key={'t' + iTurno + '-' + usadas.length + '-' + fallosPalabra}>
            {ultima && <span className={'vg-ah-ultima' + (ultima.ok ? ' bien' : ' mal')}>{ultima.l ? (ultima.ok ? '¡' + ultima.l + ' está!' : 'No hay ' + ultima.l) : '¡Esa no era!'}</span>}
            <span>Turno del <strong>{eqTurno.nombre}</strong></span>
          </div>
          <div className="vg-ah-juego">
            <div className="vg-ah-teclado">
              {FILAS_TECLADO.map((fila, f) => (
                <div key={f} className="vg-ah-fila">
                  {fila.split('').map((t) => {
                    const dicha = usadas.includes(t);
                    return (
                      <button key={t} disabled={dicha} onClick={() => intentar(t)}
                        className={dicha ? (objetivo.has(t) ? 'bien' : 'mal') : ''}>{t}</button>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* ¿Dijeron la palabra entera? */}
            <div className="vg-ah-acciones">
              <button className="vg-btn vg-jaguar-btn" onClick={adivino}>¡La adivinó!</button>
              <button className="vg-btn vg-sil-btn-no" onClick={fallo}>Falló la palabra · −1 vida</button>
              <div className="vg-ah-acciones-fila">
                <button className="vg-btn vg-btn-sec" onClick={pasarTurno}>Pasar turno</button>
                <button className="vg-btn-texto" onClick={revelar}>Revelar</button>
              </div>
            </div>
          </div>
        </React.Fragment>
      )}

      {/* Final de la palabra */}
      {fin && (
        <div className={'vg-sil-tarjeta vg-sil-resultado vg-ah-final' + (resultado === 'gano' ? ' gano' : resultado === 'jaguar' ? ' perdio' : '')}>
          {resultado === 'gano' && eqGanador && (
            <React.Fragment>
              <div className="vg-sil-celebra" aria-hidden="true">
                {Array.from({ length: 28 }, (_, k) => (
                  <i key={k} style={{ '--a': (k * 360 / 28) + 'deg', '--d': (24 + (k % 4) * 9) + 'vh', '--col': ['#39FF14', '#2F80FF', '#FFE600', 'var(--c)'][k % 4], animationDelay: (k % 5) * 0.04 + 's' }}></i>
                ))}
              </div>
              <div className="vg-sil-mensaje">¡Palabra descubierta!</div>
              <div className="vg-ah-final-fila">
                <div className="vg-sil-equipo-final"><strong>{eqGanador.nombre}</strong></div>
                <div className="vg-jaguar-punto-aviso" style={{ '--c': eqGanador.color }}>+1 punto · ahora tiene <strong>{eqGanador.puntos}</strong></div>
              </div>
            </React.Fragment>
          )}
          {resultado === 'jaguar' && (
            <React.Fragment>
              <OjosJaguar />
              <div className="vg-sil-mensaje">¡Ganó el jaguar!</div>
              <div className="vg-ah-nota">Se acabaron las vidas: nadie suma esta vez.</div>
            </React.Fragment>
          )}
          {resultado === 'revelada' && <div className="vg-ah-nota">Palabra revelada · sin puntos</div>}
          <div className="vg-sil-quedan">{todas.length ? 'Palabras por salir: ' + libres.length + ' de ' + todas.length : 'Palabra escrita por el docente'}</div>
          <div className="vg-sil-botones" ref={finRef}>
            <button className="vg-btn vg-jaguar-btn" onClick={otraPalabra}>↻ Otra palabra</button>
            {duelo && <button className="vg-btn vg-btn-sec" onClick={onEnfrentar}>⚔ Enfrentar equipos</button>}
          </div>
          {duelo && <div className="vg-jaguar-duelo-pie"><span>{duelo.texto}</span></div>}
          {resultado === 'gano' && eqGanador && a.enlace && <EnlaceJaguar enlace={a.enlace} equipo={eqGanador} i={ganador} id={a.id} />}
        </div>
      )}
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
  JaguarActivacion, MarcadorJaguar, GanadorJaguar, PantallaGruposJaguar, ListaGruposJaguar, jaguarVerGrupos, PalabraJaguar, palabrasDe, EquipoAlAzar, CabezaJaguar,
  useJaguarEstado, jaguarReiniciar, jaguarPunto, jaguarResumen, jaguarDesafioActual, AnimacionPPT,
  // Para el Modo Capibara (usa la misma sesión de equipos):
  cambiarJaguar, jaguarSesion, jaguarIniciar, jaguarRehacer, jaguarRepartir: repartir, EnlaceJaguar, ManoPPT, SiluetaJaguar, OjosJaguar, OrigamiJaguar, CuadernoJaguar, MimicaJaguar,
});
