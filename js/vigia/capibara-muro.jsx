/* capibara-muro.jsx — Modo Capibara · «Muro Infernal» (tipo cp-muro).

   Un personaje articulado (vista de frente) está en una plataforma. Desde el
   fondo avanza un muro (crece de pequeño a tamaño completo) con un agujero en
   forma de pose. Hay que quedar en esa pose antes de que llegue: si coincide,
   el muro pasa; si no, empuja al personaje a la piscina.

   Dos modos (se eligen en el editor, `a.modoMuro`):
     · 'beam' (video beam, por equipos): los equipos de la sesión se turnan
       muro por muro (`a.rondasMuro` rondas, 3 vidas por equipo).
         - `a.juezMuro` 'docente': un estudiante pasa al frente e imita la
           pose con su cuerpo; al llegar el muro, el docente decide ✓ / ✗.
         - 'auto': el equipo mueve al personaje en pantalla; se revisa solo.
     · 'individual' (teclado y mouse): un jugador, 3 vidas, cada vez más rápido.
   Reglas del Modo Capibara: equipos de la sesión del Jaguar; cada muro
   superado = 1 paso hacia Jomu (`jaguarPunto`); las poses no se repiten en
   la presentación (`sesion.muroUsadas`); el ganador responde la activación
   enlazada (`EnlaceJaguar`); al final, la montaña muestra cuánto avanzó cada
   equipo. Solo se recuerdan los nombres: el récord dura solo esta sesión.

   Teclado: 1–9 eligen la parte · ← → (o Re Pág / Av Pág) la giran · ↑ ↓
   cambian de parte · Espacio: ¡Listo! · P pausa · R repetir muro · N saltar
   turno · F pantalla completa · M silencio.
   Mando: estado en `fijarEstadoCapibara({ juego: 'muro', … })`; órdenes `mu-*`.

   Secciones: CONFIGURACIÓN · PERSONAJE · GENERADOR DE POSES · MURO ·
   DETECCIÓN DE COINCIDENCIA · AUDIO · ESCENA · MODOS (componente) · HUD. */

/* =========================== CONFIGURACIÓN =========================== */
const MI = {
  W: 1600, H: 900, V: { x: 800, y: 470 },          // lienzo lógico y punto de fuga
  // Proporciones de los personajes de Res Cogitans (SVG 240×320 escalado ×1,6; cabeza ×1,3).
  // Los pies (con zapato) quedan sobre la plataforma (y = 800). PIES: base del zapato en reposo.
  CADERA: { x: 800, y: 618 }, PELVIS: 38, TORSO: 125, HOMBRO: 62, HOMBRO_Y: 35, CABEZA_Y: 168,
  BRAZO: 80, ANTEBRAZO: 76, MUSLO: 80, PIERNA: 76, CABEZA_R: 65, PIES: 800,
  // ANCHO = grosor total con el contorno (brazo 32 + 13, pierna 35 + 13).
  ANCHO: { brazo: 45, antebrazo: 45, muslo: 48, pierna: 48, torso: 130 },
  MURO: { x: 230, y: 96, w: 1140, h: 716 }, LEJOS: 0.12, HUECO: 16,
  PREVIA_MS: 2200, EXITO_MS: 2400, FALLO_MS: 2800, LISTO_MS: 600,
  BASE: 100, BONO_SEG: 10, VIDAS: 3,
};

/* Las 9 partes que se mueven (teclas 1–9). «izq.» = a la izquierda de la
   pantalla. pasos: ángulos permitidos (de 45° en 45°, con límites del cuerpo).
   Brazos y piernas: 0 = hacia abajo; positivo = hacia afuera. Torso: inclinación. */
const SEGMENTOS_MURO = [
  { id: 'bi1', nombre: 'Brazo izq.', tipo: 'brazo', pasos: [0, 45, 90, 135, 180] },
  { id: 'bi2', nombre: 'Antebrazo izq.', tipo: 'antebrazo', pasos: [-90, -45, 0, 45, 90, 135] },
  { id: 'bd1', nombre: 'Brazo der.', tipo: 'brazo', pasos: [0, 45, 90, 135, 180] },
  { id: 'bd2', nombre: 'Antebrazo der.', tipo: 'antebrazo', pasos: [-90, -45, 0, 45, 90, 135] },
  { id: 'pi1', nombre: 'Muslo izq.', tipo: 'muslo', pasos: [0, 45, 90] },
  { id: 'pi2', nombre: 'Pierna izq.', tipo: 'pierna', pasos: [-90, -45, 0, 45, 90] },
  { id: 'pd1', nombre: 'Muslo der.', tipo: 'muslo', pasos: [0, 45, 90] },
  { id: 'pd2', nombre: 'Pierna der.', tipo: 'pierna', pasos: [-90, -45, 0, 45, 90] },
  { id: 't', nombre: 'Torso', tipo: 'torso', pasos: [-45, 0, 45] },
];
const NEUTRA_MURO = { bi1: 0, bi2: 0, bd1: 0, bd2: 0, pi1: 0, pi2: 0, pd1: 0, pd2: 0, t: 0 };

/* ============================ PERSONAJE ============================ */
const radMI = (g) => g * Math.PI / 180;
function rotarMI(v, g) { const a = radMI(g), c = Math.cos(a), s = Math.sin(a); return { x: v.x * c - v.y * s, y: v.x * s + v.y * c }; }
function dirMI(lado, g) { const a = radMI(g); return { x: lado * Math.sin(a), y: Math.cos(a) }; }
const masMI = (p, v, l) => ({ x: p.x + v.x * (l == null ? 1 : l), y: p.y + v.y * (l == null ? 1 : l) });

// Puntos del cuerpo para una pose (en el lienzo lógico, con el muro a tamaño completo).
function esqueletoMI(p) {
  const C = MI.CADERA, t = p.t || 0;
  const seg = {}, manos = [], pies = [], caderas = [];
  const cuello = masMI(C, rotarMI({ x: 0, y: -MI.TORSO }, t));
  const cabeza = masMI(C, rotarMI({ x: 0, y: -MI.CABEZA_Y }, t));
  [-1, 1].forEach((lado) => {
    const b = lado < 0 ? 'bi' : 'bd';
    const hombro = masMI(C, rotarMI({ x: lado * MI.HOMBRO, y: -MI.TORSO + MI.HOMBRO_Y }, t));
    const codo = masMI(hombro, rotarMI(dirMI(lado, p[b + '1']), t), MI.BRAZO);
    const mano = masMI(codo, rotarMI(dirMI(lado, p[b + '1'] + p[b + '2']), t), MI.ANTEBRAZO);
    seg[b + '1'] = [hombro, codo]; seg[b + '2'] = [codo, mano]; manos.push(mano);
    const q = lado < 0 ? 'pi' : 'pd';
    const cadera = { x: C.x + lado * MI.PELVIS, y: C.y };
    const rodilla = masMI(cadera, dirMI(lado, p[q + '1']), MI.MUSLO);
    const pie = masMI(rodilla, dirMI(lado, p[q + '1'] + p[q + '2']), MI.PIERNA);
    seg[q + '1'] = [cadera, rodilla]; seg[q + '2'] = [rodilla, pie]; pies.push(pie); caderas.push(cadera);
  });
  seg.t = [C, cuello];
  return { seg, cabeza, cuello, manos, pies, caderas, t };
}
const anchoMI = (s) => MI.ANCHO[s.tipo];

// Ayudas de dibujo compartidas (capibara-comun.jsx).
const lineaMI = lineaCp, circuloMI = circuloCp, rrMI = rrCp;

/* Dibuja al personaje (diseños de Res Cogitans: Tito, Lupe, Zombi Zeta, Robo-7
   y Capi, de frente y de espaldas). Cabeza y torso se pintan con las mismas
   formas de los SVG originales (viewBox 240×320; cadera en 120,214 y centro de
   la cabeza en 120,98); brazos y piernas son articulados (esqueletoMI), con
   los colores, el contorno y el zapato del diseño.
   op: { resaltar: id (mouse encima), seleccion: id (teclado), numeros: bool,
   espalda: bool (visto desde atrás; lo usa la Jungla) } */
const B_MI = '#2b1a10';
const SVG_K = 1.6, SVG_KH = 1.3;   // escala del torso y de la cabeza (unidades del SVG → lienzo)
const TORSO_D = 'M86 150 Q120 136 154 150 Q166 186 160 226 Q120 238 80 226 Q74 186 86 150 Z';
const ZAPATO_D = 'M78 296 L78 288 Q78 274 96 274 Q114 274 114 288 L114 296 Z';

// Mini pintor de figuras SVG en canvas: { c:[cx,cy,r] | e:[cx,cy,rx,ry] | r:[x,y,w,h,rx] | p:'d',
// f: relleno, s: contorno, w: grosor, op: opacidad, cap } o { clip: figura, hijos: [...] }.
function trazoSVG(f) {
  if (f._p) return f._p;
  let P;
  if (f.p) P = new Path2D(f.p);
  else {
    P = new Path2D();
    if (f.c) P.arc(f.c[0], f.c[1], f.c[2], 0, Math.PI * 2);
    else if (f.e) P.ellipse(f.e[0], f.e[1], f.e[2], f.e[3], 0, 0, Math.PI * 2);
    else if (f.r) {
      const [x, y, w, h, r] = f.r;
      P.moveTo(x + r, y); P.arcTo(x + w, y, x + w, y + h, r); P.arcTo(x + w, y + h, x, y + h, r);
      P.arcTo(x, y + h, x, y, r); P.arcTo(x, y, x + w, y, r); P.closePath();
    }
  }
  f._p = P;
  return P;
}
function pintarSVG(ctx, lista) {
  for (const f of lista) {
    if (f.clip) { ctx.save(); ctx.clip(trazoSVG(f.clip)); pintarSVG(ctx, f.hijos); ctx.restore(); continue; }
    const P = trazoSVG(f);
    ctx.save();
    if (f.op != null) ctx.globalAlpha *= f.op;
    if (f.f) { ctx.fillStyle = f.f; ctx.fill(P); }
    if (f.s) { ctx.strokeStyle = f.s; ctx.lineWidth = f.w || 4; ctx.lineCap = f.cap || 'round'; ctx.lineJoin = 'round'; ctx.stroke(P); }
    ctx.restore();
  }
}
// Cabeza redonda con luz (de frente la luz va a la izquierda; de espaldas, a la derecha).
const cabezaRedonda = (base, luz, dx) => [
  { c: [120, 98, 50], f: base }, { clip: { c: [120, 98, 50] }, hijos: [{ c: [120 + dx, 92, 50], f: luz }] }, { c: [120, 98, 50], s: B_MI, w: 4 },
];
// Cara de ojos grandes (Tito y Lupe).
const ojosMI = (mejillas) => [
  { e: [102, 116, 6.5, 8.5], f: B_MI }, { e: [139, 116, 6.5, 8.5], f: B_MI },
  { c: [104.5, 112.5, 2.6], f: '#fff' }, { c: [141.5, 112.5, 2.6], f: '#fff' },
  { e: [90, 129, 8, 5], f: mejillas, op: 0.55 }, { e: [151, 129, 8, 5], f: mejillas, op: 0.55 },
  { p: 'M108 129 Q120 144 132 129 Z', f: '#7d2318', s: B_MI, w: 3.5 }, { p: 'M114 136 Q120 133 126 136 Q120 141 114 136 Z', f: '#e8665a' },
];
const ZIGZAG_MI = 'M82 222 L90 232 L98 222 L106 234 L114 224 L122 234 L130 224 L138 234 L146 222 L154 232 L160 222';

/* Concursantes. Colores de piernas, zapatos, mangas (izq. oscura / der. clara), manos y torso; y las
   figuras de la cabeza y del torso, de frente y de espaldas (tal como en los SVG). */
const PERSONAJES_MURO = [
  { id: 'tito', nombre: 'Tito', pierna: '#2f5f94', piernaLuz: '#3b74b0', zapato: '#5a3a22', zapatoRaya: '#e9d6b0',
    mangas: ['#c9431f', '#e8582f'], manos: ['#f1b98a', '#f1b98a'], manosEspalda: ['#dd9a6c', '#f1b98a'], torso: ['#c9431f', '#e8582f', '#a8361a'],
    torsoFrente: [
      { p: 'M98 196 Q120 190 142 196 L146 218 Q120 224 94 218 Z', s: B_MI, w: 3, op: 0.55 },
      { p: 'M112 150 L110 172', s: '#fbf1de', w: 3 }, { p: 'M128 150 L130 172', s: '#fbf1de', w: 3 },
    ],
    torsoEspalda: [
      { p: 'M94 146 Q120 140 146 146 Q144 176 120 180 Q96 176 94 146 Z', f: '#b8391b', s: B_MI, w: 4 },
      { p: 'M104 150 Q120 146 136 150 Q132 168 120 170 Q108 168 104 150 Z', f: '#8f2a14' },
    ],
    cabezaFrente: [
      { c: [72, 104, 11], f: '#e0a273', s: B_MI, w: 4 }, { c: [168, 104, 11], f: '#e0a273', s: B_MI, w: 4 },
      ...cabezaRedonda('#dd9a6c', '#f1b98a', -6),
      { p: 'M78 86 Q84 98 92 88 Q98 98 106 86', f: '#5a3a22', s: B_MI, w: 3 },
      { p: 'M70 92 Q70 42 120 40 Q170 42 170 92 Q120 80 70 92 Z', f: '#b8301f' },
      { clip: { p: 'M70 92 Q70 42 120 40 Q170 42 170 92 Q120 80 70 92 Z' }, hijos: [{ p: 'M60 30 Q120 30 140 30 Q128 60 132 100 L60 100 Z', f: '#d93d2a' }] },
      { p: 'M70 92 Q70 42 120 40 Q170 42 170 92 Q120 80 70 92 Z', s: B_MI, w: 4 },
      { p: 'M120 42 Q116 60 118 82', s: B_MI, w: 2.5, op: 0.45 }, { c: [120, 42, 5], f: '#d93d2a', s: B_MI, w: 3 },
      { p: 'M70 90 Q100 80 140 84 Q120 100 74 100 Z', f: '#9e2818', s: B_MI, w: 4 },
      { p: 'M95 104 Q102 100 108 104', s: B_MI, w: 3.5 }, { p: 'M132 104 Q139 100 146 104', s: B_MI, w: 3.5 },
      ...ojosMI('#ee7f6c'),
    ],
    cabezaEspalda: [
      { c: [70, 106, 11], f: '#dd9a6c', s: B_MI, w: 4 }, { c: [170, 106, 11], f: '#f1b98a', s: B_MI, w: 4 },
      { c: [120, 98, 50], f: '#4a2e1a' },
      { clip: { c: [120, 98, 50] }, hijos: [{ c: [128, 92, 50], f: '#5f3c22' },
        { p: 'M84 132 Q96 120 104 136 Q114 122 122 138 Q132 122 140 136 Q148 120 158 132 L160 160 L80 160 Z', f: '#dd9a6c' }] },
      { c: [120, 98, 50], s: B_MI, w: 4 },
      { p: 'M70 96 Q68 42 120 40 Q172 42 170 96 Q120 86 70 96 Z', f: '#b8301f' },
      { clip: { p: 'M70 96 Q68 42 120 40 Q172 42 170 96 Q120 86 70 96 Z' }, hijos: [{ p: 'M104 30 L180 30 L180 100 L110 100 Q100 60 104 30 Z', f: '#d93d2a' }] },
      { p: 'M70 96 Q68 42 120 40 Q172 42 170 96 Q120 86 70 96 Z', s: B_MI, w: 4 },
      { p: 'M104 92 Q104 76 120 76 Q136 76 136 92 Q120 89 104 92 Z', f: '#4a2e1a', s: B_MI, w: 3.5 },
      { p: 'M106 88 L134 88', s: '#e9d6b0', w: 4 }, { c: [120, 42, 5], f: '#d93d2a', s: B_MI, w: 3 },
    ] },
  { id: 'lupe', nombre: 'Lupe', pierna: '#6a43a0', piernaLuz: '#8a62c2', zapato: '#fbf1de', zapatoRaya: '#c86b8f',
    mangas: ['#dc9a22', '#f5b83f'], manos: ['#c98a5f', '#c98a5f'], manosEspalda: ['#a96c45', '#c98a5f'], torso: ['#dc9a22', '#f5b83f', '#c7861a'],
    torsoFrente: [
      { p: 'M100 146 Q120 162 140 146', s: B_MI, w: 4 }, { p: 'M104 150 Q120 160 136 150', s: '#fbf1de', w: 3 },
      { p: 'M120 180 L124 190 L134 190 L126 196 L129 206 L120 200 L111 206 L114 196 L106 190 L116 190 Z', f: '#fbf1de', s: B_MI, w: 3 },
    ],
    torsoEspalda: [{ p: 'M100 146 Q120 154 140 146', s: B_MI, w: 4 }],
    cabezaFrente: [
      { c: [120, 40, 20], f: '#3a2418', s: B_MI, w: 4 }, { c: [114, 35, 9], f: '#57371f' }, { p: 'M104 56 Q120 48 136 56', s: '#c86b8f', w: 7 },
      { c: [72, 104, 11], f: '#a96c45', s: B_MI, w: 4 }, { c: [168, 104, 11], f: '#a96c45', s: B_MI, w: 4 },
      { c: [72, 118, 4], f: '#f5b83f', s: B_MI, w: 2.5 }, { c: [168, 118, 4], f: '#f5b83f', s: B_MI, w: 2.5 },
      ...cabezaRedonda('#b07247', '#c98a5f', -6),
      { p: 'M68 104 Q62 44 120 42 Q178 44 172 104 Q166 78 150 70 Q138 86 108 82 Q88 84 68 104 Z', f: '#3a2418' },
      { clip: { p: 'M68 104 Q62 44 120 42 Q178 44 172 104 Q166 78 150 70 Q138 86 108 82 Q88 84 68 104 Z' }, hijos: [{ p: 'M60 30 L120 30 Q100 60 106 84 L60 110 Z', f: '#57371f' }] },
      { p: 'M68 104 Q62 44 120 42 Q178 44 172 104 Q166 78 150 70 Q138 86 108 82 Q88 84 68 104 Z', s: B_MI, w: 4 },
      { p: 'M95 102 Q102 98 108 102', s: B_MI, w: 3.5 }, { p: 'M132 102 Q139 98 146 102', s: B_MI, w: 3.5 },
      { p: 'M94 110 L91 107 M146 110 L149 107', s: B_MI, w: 3 },
      ...ojosMI('#e86f6a'),
    ],
    cabezaEspalda: [
      { c: [72, 108, 11], f: '#a96c45', s: B_MI, w: 4 }, { c: [168, 108, 11], f: '#c98a5f', s: B_MI, w: 4 },
      { c: [120, 98, 50], f: '#3a2418' }, { clip: { c: [120, 98, 50] }, hijos: [{ c: [128, 92, 50], f: '#57371f' }] },
      { c: [120, 98, 50], s: B_MI, w: 4 },
      { clip: { c: [120, 98, 50] }, hijos: [{ p: 'M86 140 Q104 128 120 142 Q136 128 154 140 L156 160 L84 160 Z', f: '#b07247' }] },
      { p: 'M120 52 Q114 90 120 132', s: B_MI, w: 2.5, op: 0.35 },
      { c: [120, 40, 20], f: '#3a2418', s: B_MI, w: 4 }, { c: [126, 35, 9], f: '#57371f' },
      { p: 'M104 56 Q120 48 136 56', s: '#c86b8f', w: 7 }, { p: 'M104 56 Q120 48 136 56', s: B_MI, w: 2, op: 0.4 },
    ] },
  { id: 'zeta', nombre: 'Zombi Zeta', pierna: '#4d3a2c', piernaLuz: '#664d3a', zapato: '#3a2a20', zapatoRaya: '#8d9a7a',
    mangas: ['#6d8396', '#8aa0b2'], manos: ['#9cc777', '#9cc777'], manosEspalda: ['#7ca85a', '#9cc777'], torso: ['#6d8396', '#8aa0b2', '#5a6e80'],
    torsoFrente: [
      { r: [128, 186, 20, 18, 3], f: '#b8a37a', s: B_MI, w: 3 },
      { p: 'M131 190 L135 190 M131 200 L135 200 M141 190 L145 190 M141 200 L145 200', s: B_MI, w: 2 },
      { p: ZIGZAG_MI, s: B_MI, w: 3 }, { p: 'M96 168 L102 176 L98 182', s: B_MI, w: 3, op: 0.6 },
    ],
    torsoEspalda: [
      { p: ZIGZAG_MI, s: B_MI, w: 3 }, { p: 'M96 168 L102 176 L98 182', s: B_MI, w: 3, op: 0.6 }, { p: 'M140 170 L146 178 L142 186', s: B_MI, w: 3, op: 0.6 },
    ],
    cabezaFrente: [
      { c: [72, 104, 11], f: '#7ca85a', s: B_MI, w: 4 }, { c: [168, 104, 11], f: '#7ca85a', s: B_MI, w: 4 },
      ...cabezaRedonda('#7ca85a', '#9cc777', -6),
      { p: 'M70 92 L76 62 L88 72 L96 48 L110 64 L120 42 L132 62 L146 48 L152 70 L164 60 L170 92 Q148 74 120 78 Q92 74 70 92 Z', f: '#3d5634', s: B_MI, w: 4 },
      { p: 'M96 52 L100 70 M120 46 L118 70', s: '#577a49', w: 4 },
      { p: 'M134 82 Q146 88 156 98', s: B_MI, w: 3 }, { p: 'M138 80 L136 88 M145 84 L141 91 M152 90 L147 96', s: B_MI, w: 2.5 },
      { e: [102, 122, 12, 7], f: '#5f8a45', op: 0.6 }, { e: [139, 122, 12, 7], f: '#5f8a45', op: 0.6 },
      { c: [102, 114, 10], f: '#fbf6e6', s: B_MI, w: 3.5 }, { c: [105, 116, 4.5], f: B_MI },
      { p: 'M132 108 L146 122 M146 108 L132 122', s: B_MI, w: 4 },
      { p: 'M104 134 Q114 140 122 134 Q130 130 138 136', s: B_MI, w: 3.5 },
      { p: 'M114 137 L114 143 L120 143 L120 136', f: '#fbf6e6', s: B_MI, w: 2.5 },
    ],
    cabezaEspalda: [
      { c: [72, 106, 11], f: '#7ca85a', s: B_MI, w: 4 }, { c: [168, 106, 11], f: '#9cc777', s: B_MI, w: 4 },
      ...cabezaRedonda('#7ca85a', '#9cc777', 8),
      { p: 'M70 96 L76 62 L88 72 L96 48 L110 64 L120 42 L132 62 L146 48 L152 70 L164 60 L170 96 L160 112 L150 102 L140 116 L130 104 L120 118 L110 104 L100 116 L90 102 L80 112 Z', f: '#3d5634', s: B_MI, w: 4 },
      { p: 'M110 64 L112 92 M132 62 L130 92', s: '#577a49', w: 4 },
      { p: 'M104 124 L136 132', s: B_MI, w: 3 }, { p: 'M110 120 L108 130 M120 122 L118 132 M130 124 L128 134', s: B_MI, w: 2.5 },
    ] },
  { id: 'robo', nombre: 'Robo-7', pierna: '#46525f', piernaLuz: '#5d6b7a', zapato: '#2f3943', zapatoRaya: '#f2b33d',
    mangas: ['#8796a6', '#a9b6c3'], manos: ['#c3cfdb', '#c3cfdb'], manosEspalda: ['#a2b0bf', '#c3cfdb'], torso: ['#426f9e', '#5b8cc0', '#375e87'],
    torsoFrente: [
      { r: [100, 168, 40, 30, 8], f: '#2a3540', s: B_MI, w: 3.5 }, { c: [112, 183, 5], f: '#6fe3f0' }, { c: [128, 183, 5], f: '#f2b33d' },
      { p: 'M106 210 L134 210', s: B_MI, w: 3, op: 0.5 },
    ],
    torsoEspalda: [
      { r: [98, 164, 44, 40, 8], f: '#426f9e', s: B_MI, w: 3.5 },
      { r: [106, 174, 28, 8, 3], f: '#7ee08a', s: B_MI, w: 2.5 }, { r: [106, 186, 20, 8, 3], f: '#7ee08a', s: B_MI, w: 2.5 },
      { c: [103, 169, 2], f: B_MI }, { c: [137, 169, 2], f: B_MI },
    ],
    cabezaFrente: [
      { p: 'M120 54 L120 30', s: B_MI, w: 5 }, { c: [120, 26, 8], f: '#e8582f', s: B_MI, w: 4 }, { c: [117, 23, 2.5], f: '#fff', op: 0.8 },
      { r: [60, 86, 16, 30, 6], f: '#8796a6', s: B_MI, w: 4 }, { r: [164, 86, 16, 30, 6], f: '#8796a6', s: B_MI, w: 4 },
      { r: [72, 52, 96, 92, 26], f: '#8f9fb0' }, { clip: { r: [72, 52, 96, 92, 26] }, hijos: [{ r: [64, 46, 96, 92, 26], f: '#c3cfdb' }] },
      { r: [72, 52, 96, 92, 26], s: B_MI, w: 4 },
      { r: [84, 78, 72, 42, 16], f: '#23303b', s: B_MI, w: 3.5 },
      { c: [104, 99, 11], f: '#6fe3f0', op: 0.25 }, { c: [136, 99, 11], f: '#6fe3f0', op: 0.25 },
      { r: [98, 91, 12, 16, 6], f: '#6fe3f0' }, { r: [130, 91, 12, 16, 6], f: '#6fe3f0' },
      { p: 'M90 84 Q100 80 110 82', s: '#fff', w: 3, op: 0.35 },
      { r: [102, 126, 36, 11, 5], f: '#46525f', s: B_MI, w: 3 }, { p: 'M111 127 L111 136 M120 127 L120 136 M129 127 L129 136', s: B_MI, w: 2 },
      { e: [88, 128, 6, 4], f: '#ee7f6c', op: 0.45 }, { e: [152, 128, 6, 4], f: '#ee7f6c', op: 0.45 },
    ],
    cabezaEspalda: [
      { p: 'M120 54 L120 30', s: B_MI, w: 5 }, { c: [120, 26, 8], f: '#e8582f', s: B_MI, w: 4 }, { c: [117, 23, 2.5], f: '#fff', op: 0.8 },
      { r: [60, 86, 16, 30, 6], f: '#8796a6', s: B_MI, w: 4 }, { r: [164, 86, 16, 30, 6], f: '#8796a6', s: B_MI, w: 4 },
      { r: [72, 52, 96, 92, 26], f: '#8f9fb0' }, { clip: { r: [72, 52, 96, 92, 26] }, hijos: [{ r: [82, 46, 96, 92, 26], f: '#c3cfdb' }] },
      { r: [72, 52, 96, 92, 26], s: B_MI, w: 4 },
      { r: [94, 84, 52, 38, 10], f: '#8f9fb0', s: B_MI, w: 3.5 }, { p: 'M102 94 L138 94 M102 103 L138 103 M102 112 L138 112', s: B_MI, w: 3 },
      { c: [84, 64, 2.5], f: B_MI }, { c: [156, 64, 2.5], f: B_MI }, { c: [84, 132, 2.5], f: B_MI }, { c: [156, 132, 2.5], f: B_MI },
    ] },
  { id: 'capi', nombre: 'Capi', pierna: '#5e4029', piernaLuz: '#775339', zapato: '#3a2a20', zapatoRaya: '#e9d6b0',
    mangas: ['#4f8f46', '#6cae5f'], manos: ['#b8804f', '#b8804f'], manosEspalda: ['#9a6a3f', '#b8804f'], torso: ['#4f8f46', '#6cae5f', '#447d3c'],
    torsoFrente: [
      { p: 'M100 146 Q120 160 140 146', s: B_MI, w: 4 },
      { p: 'M110 196 Q110 174 132 170 Q134 194 110 196 Z', f: '#fbf1de', s: B_MI, w: 3 }, { p: 'M112 194 L126 178', s: B_MI, w: 2.5 },
    ],
    torsoEspalda: [{ p: 'M100 146 Q120 154 140 146', s: B_MI, w: 4 }, { c: [120, 222, 10], f: '#b8804f', s: B_MI, w: 3.5 }],
    cabezaFrente: [
      { c: [80, 58, 17], f: '#94603a', s: B_MI, w: 4 }, { c: [160, 58, 17], f: '#94603a', s: B_MI, w: 4 },
      { c: [80, 58, 8], f: '#e6bf91' }, { c: [160, 58, 8], f: '#e6bf91' },
      ...cabezaRedonda('#94603a', '#b8804f', -6),
      { p: 'M112 50 Q118 40 122 50 Q126 42 130 52', s: B_MI, w: 3 },
      { e: [120, 124, 24, 18], f: '#e6bf91', s: B_MI, w: 3.5 }, { e: [120, 114, 9, 6.5], f: B_MI }, { e: [117, 112, 3, 1.8], f: '#fff', op: 0.7 },
      { p: 'M120 120 L120 127 M110 128 Q115 134 120 127 Q125 134 130 128', s: B_MI, w: 3 },
      { e: [98, 100, 6.5, 8.5], f: B_MI }, { e: [142, 100, 6.5, 8.5], f: B_MI },
      { c: [100.5, 96.5, 2.6], f: '#fff' }, { c: [144.5, 96.5, 2.6], f: '#fff' },
      { p: 'M90 88 Q97 84 104 88 M136 88 Q143 84 150 88', s: B_MI, w: 3.5 },
      { e: [86, 118, 8, 5], f: '#e0745c', op: 0.55 }, { e: [154, 118, 8, 5], f: '#e0745c', op: 0.55 },
    ],
    cabezaEspalda: [
      { c: [80, 58, 17], f: '#94603a', s: B_MI, w: 4 }, { c: [160, 58, 17], f: '#94603a', s: B_MI, w: 4 },
      ...cabezaRedonda('#94603a', '#b8804f', 8),
      { p: 'M110 50 Q116 40 120 50 Q124 42 128 52', s: B_MI, w: 3 },
      { p: 'M96 130 Q120 140 144 130', s: B_MI, w: 3, op: 0.35 },
    ] },
];

// Brazo o pierna articulado (dos tramos con codo/rodilla redondeados), con contorno.
function extremidadMI(ctx, puntos, ancho, color) {
  const camino = () => { ctx.beginPath(); ctx.moveTo(puntos[0].x, puntos[0].y); puntos.slice(1).forEach((q) => ctx.lineTo(q.x, q.y)); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  camino(); ctx.strokeStyle = B_MI; ctx.lineWidth = ancho + 13; ctx.stroke();
  camino(); ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.stroke();
}
// Franja de luz de la pierna (como en el diseño: un poco a la izquierda).
function franjaMI(ctx, puntos, color) {
  ctx.save(); ctx.beginPath();
  puntos.forEach((q, i) => {
    const a = puntos[Math.max(0, i - 1)], b = puntos[Math.min(puntos.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    const x = q.x - (dy / l) * 9.6, y = q.y + (dx / l) * 9.6;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = color; ctx.lineWidth = 12.8; ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore();
}
// Ángulo para girar una pieza que "cuelga" (0,1) hacia la dirección p→q.
const anguloMI = (p, q) => Math.atan2(-(q.x - p.x), q.y - p.y);
function zapatoMI(ctx, rodilla, pie, pj, m, color) {
  ctx.save(); ctx.translate(pie.x, pie.y); ctx.rotate(anguloMI(rodilla, pie)); ctx.scale(SVG_K, SVG_K); ctx.translate(-96, -280);   // (en el SVG el pie está en 96,280)
  const P = trazoSVG({ p: ZAPATO_D });
  if (color) { ctx.fillStyle = ctx.strokeStyle = color; ctx.lineWidth = 4 + (2 * (m || 0)) / SVG_K; ctx.lineJoin = 'round'; ctx.fill(P); ctx.stroke(P); }
  else {
    ctx.fillStyle = pj.zapato; ctx.fill(P); ctx.strokeStyle = B_MI; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke(P);
    ctx.beginPath(); ctx.moveTo(80, 290); ctx.lineTo(112, 290); ctx.strokeStyle = pj.zapatoRaya; ctx.lineWidth = 4; ctx.lineCap = 'butt'; ctx.stroke();
  }
  ctx.restore();
}
// Lleva el lienzo al espacio del SVG (torso: cadera 120,214 · cabeza: 120,98).
function aTorsoSVG(ctx, E) { ctx.translate(MI.CADERA.x, MI.CADERA.y); ctx.rotate(radMI(E.t)); ctx.scale(SVG_K, SVG_K); ctx.translate(-120, -214); }
function aCabezaSVG(ctx, E) { ctx.translate(E.cabeza.x, E.cabeza.y); ctx.rotate(radMI(E.t)); ctx.scale(SVG_KH, SVG_KH); ctx.translate(-120, -98); }

function dibujarPersonajeMI(ctx, pose, pj, op) {
  op = op || {};
  const E = esqueletoMI(pose), espalda = !!op.espalda;
  // Brillo de la parte señalada (mouse o teclado)
  SEGMENTOS_MURO.forEach((s) => {
    if (op.resaltar !== s.id && op.seleccion !== s.id) return;
    const [p, q] = E.seg[s.id];
    ctx.save(); ctx.globalAlpha = op.resaltar === s.id ? 0.95 : 0.7;
    lineaMI(ctx, p, q, anchoMI(s) + 26, op.resaltar === s.id ? '#FFE066' : '#FFFFFF'); ctx.restore();
  });
  // Piernas con su franja de luz y el zapato
  [['pi', 0], ['pd', 1]].forEach(([k, i]) => {
    const pts = [E.caderas[i], E.seg[k + '1'][1], E.pies[i]];
    extremidadMI(ctx, pts, MI.ANCHO.muslo - 13, pj.pierna);
    franjaMI(ctx, pts, pj.piernaLuz);
    zapatoMI(ctx, E.seg[k + '1'][1], E.pies[i], pj);
  });
  const brazos = () => [['bi', 0], ['bd', 1]].forEach(([k, i]) => {
    extremidadMI(ctx, [E.seg[k + '1'][0], E.seg[k + '1'][1], E.manos[i]], MI.ANCHO.brazo - 13, pj.mangas[i]);
    circuloMI(ctx, E.manos[i].x, E.manos[i].y, 17.6, (espalda ? pj.manosEspalda : pj.manos)[i], B_MI, 6.4);
  });
  if (espalda) brazos();   // de espaldas, los brazos van detrás del torso
  // Torso (forma del diseño, con su luz, su borde inferior y sus detalles)
  ctx.save(); aTorsoSVG(ctx, E);
  pintarSVG(ctx, [
    { p: TORSO_D, f: pj.torso[0] },
    { clip: { p: TORSO_D }, hijos: [
      { p: espalda ? 'M104 140 L170 140 L170 240 L100 240 Q110 190 104 140 Z' : 'M80 140 L136 140 Q130 190 140 240 L70 240 Z', f: pj.torso[1] },
      { p: 'M74 222 Q120 236 166 222 L166 240 L74 240 Z', f: pj.torso[2] },
    ] },
    { p: TORSO_D, s: B_MI, w: 4 },
    ...(espalda ? pj.torsoEspalda : pj.torsoFrente),
  ]);
  ctx.restore();
  if (!espalda) brazos();
  // Cabeza
  ctx.save(); aCabezaSVG(ctx, E); pintarSVG(ctx, espalda ? pj.cabezaEspalda : pj.cabezaFrente); ctx.restore();
  // Números de las partes (cuando se usa el teclado)
  if (op.numeros) {
    SEGMENTOS_MURO.forEach((s, i) => {
      const [p, q] = E.seg[s.id];
      const m = { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 };
      circuloMI(ctx, m.x, m.y, 17, op.seleccion === s.id ? '#FFE066' : '#FFFDF6', B_MI, 4);
      ctx.fillStyle = B_MI; ctx.font = '900 22px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(i + 1), m.x, m.y + 1);
    });
  }
}

/* La silueta de una pose (agujero del muro y vista previa), con las MISMAS
   formas del personaje: piernas y brazos con su contorno, zapatos, manos, el
   torso del diseño y una cabeza con orejas/moño (sirve para los cinco). m: margen extra. */
function siluetaMI(ctx, pose, m, color) {
  const E = esqueletoMI(pose);
  ctx.fillStyle = ctx.strokeStyle = color; ctx.lineJoin = 'round';
  [['pi', 0], ['pd', 1]].forEach(([k, i]) => {
    extremidadSilueta(ctx, [E.caderas[i], E.seg[k + '1'][1], E.pies[i]], MI.ANCHO.muslo + 2 * m, color);
    zapatoMI(ctx, E.seg[k + '1'][1], E.pies[i], null, m, color);
  });
  [['bi', 0], ['bd', 1]].forEach(([k, i]) => {
    extremidadSilueta(ctx, [E.seg[k + '1'][0], E.seg[k + '1'][1], E.manos[i]], MI.ANCHO.brazo + 2 * m, color);
    circuloMI(ctx, E.manos[i].x, E.manos[i].y, 21 + m, color);
  });
  ctx.save(); aTorsoSVG(ctx, E);
  const T = trazoSVG({ p: TORSO_D });
  ctx.lineWidth = 4 + (2 * m) / SVG_K; ctx.fill(T); ctx.stroke(T);
  ctx.restore();
  ctx.save(); aCabezaSVG(ctx, E);
  const r = (2 + m / SVG_KH);
  [[120, 98, 52], [80, 60, 18], [160, 60, 18], [120, 40, 21]].forEach(([x, y, rr]) => circuloMI(ctx, x, y, rr + r, color));
  ctx.restore();
}
function extremidadSilueta(ctx, puntos, ancho, color) {
  ctx.beginPath(); ctx.moveTo(puntos[0].x, puntos[0].y); puntos.slice(1).forEach((q) => ctx.lineTo(q.x, q.y));
  ctx.strokeStyle = color; ctx.lineWidth = ancho; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
}

/* ======================== GENERADOR DE POSES ========================
   Lista fija (todas se pueden hacer con giros de 45°). Valores en el orden de
   SEGMENTOS_MURO: bi1, bi2, bd1, bd2, pi1, pi2, pd1, pd2, t. La dificultad
   sale de cuántas partes cambian respecto a la posición neutra. */
const POSES_BASE_MURO = [
  ['Mano arriba', 0, 0, 180, 0, 0, 0, 0, 0, 0],
  ['Saludo al lado', 90, 0, 0, 0, 0, 0, 0, 0, 0],
  ['Avión', 90, 0, 90, 0, 0, 0, 0, 0, 0],
  ['¡Gol!', 180, 0, 180, 0, 0, 0, 0, 0, 0],
  ['Torre inclinada', 0, 0, 0, 0, 0, 0, 0, 0, 45],
  ['Paso de lado', 0, 0, 0, 0, 0, 0, 45, 0, 0],
  ['Rayo', 135, 0, 45, 0, 0, 0, 0, 0, 0],
  ['Abrazo gigante', 135, 0, 135, 0, 0, 0, 0, 0, 0],
  ['Equilibrio', 0, 0, 90, 0, 45, 0, 0, 0, 0],
  ['Forzudo', 90, 90, 90, 90, 0, 0, 0, 0, 0],
  ['Estrella', 135, 0, 135, 0, 45, 0, 45, 0, 0],
  ['Tetera', 45, -90, 135, 0, 0, 0, 0, 0, 0],
  ['Robot', 90, -90, 90, 90, 0, 0, 0, 0, 0],
  ['Cohete', 45, 0, 180, 0, 0, 0, 0, 0, 45],
  ['Arquero', 90, 0, 90, 135, 0, 0, 45, 0, 0],
  ['Equilibrista', 90, 0, 90, 0, 0, 0, 90, 0, -45],
  ['Karateca', 90, 0, 45, 90, 0, 0, 90, 0, 0],
  ['X gigante', 180, 0, 180, 0, 90, 0, 90, 0, 0],
  ['Patada', 0, 0, 90, 0, 0, 0, 90, 0, -45],
  ['Sumo', 45, 0, 45, 0, 90, -90, 90, -90, 0],
  ['Flamenco', 180, -45, 180, -45, 0, 0, 45, -90, 0],
  ['Molino', 135, 0, 45, 0, 45, 0, 45, 0, -45],
  ['Caminante', 45, 45, 45, -45, 45, -45, 0, 0, 0],
  ['Bailarina', 135, 90, 135, 90, 0, 0, 45, -90, 0],
  ['Espantapájaros', 90, -45, 90, -45, 0, 0, 0, 0, 45],
  ['Ola', 135, -45, 45, 45, 0, 0, 0, 0, -45],
  ['Saltamontes', 135, 45, 135, 45, 90, -90, 0, 0, 0],
  ['Tornado', 180, 0, 90, 90, 45, 0, 0, 0, -45],
  ['Hula hula', 45, 90, 45, 90, 0, 0, 0, 0, 45],
  ['Rana', 90, 90, 90, 90, 90, -90, 90, -90, 0],
  ['Pulpo', 90, -45, 90, 45, 45, 45, 45, -45, 0],
  ['Payaso', 45, 90, 45, 90, 45, 45, 45, 45, 0],
];
const POSES_MURO = POSES_BASE_MURO.map(([nombre, ...v]) => {
  const p = {};
  SEGMENTOS_MURO.forEach((s, i) => { p[s.id] = v[i]; });
  const cambios = v.filter((x) => x !== 0).length;
  return { id: nombre, nombre, p, dif: cambios <= 2 ? 1 : cambios <= 4 ? 2 : cambios <= 6 ? 3 : 4 };
}).filter((x) => SEGMENTOS_MURO.every((s) => s.pasos.includes(x.p[s.id])));   // solo poses alcanzables
const difPorNivelMI = (n) => [1, 1, 2, 2, 3, 3, 4][n - 1] || 4;

// Una pose del nivel que NO se haya usado en la presentación.
function elegirPoseMI(nivel) {
  let usadas = jaguarSesion().muroUsadas || [];
  let libres = POSES_MURO.filter((x) => !usadas.includes(x.id));
  if (!libres.length) { usadas = []; libres = POSES_MURO.slice(); }
  const dif = difPorNivelMI(nivel);
  const de = (d) => libres.filter((x) => x.dif === d);
  let lista = de(dif);
  for (let k = 1; !lista.length && k < 4; k++) lista = de(dif - k).concat(de(dif + k));
  const pose = lista[Math.floor(Math.random() * lista.length)];
  cambiarJaguar(() => ({ muroUsadas: [...usadas, pose.id] }));
  return pose;
}

/* =============================== MURO =============================== */
// El muro a tamaño completo, con el agujero de la pose (se dibuja una vez por muro).
function construirMuroMI(pose) {
  const c = document.createElement('canvas');
  c.width = MI.W; c.height = MI.H;
  const x = c.getContext('2d'), R = MI.MURO;
  // llamitas sobre el borde
  for (let k = 0; k < 18; k++) {
    const fx = R.x + 34 + k * (R.w - 68) / 17, alto = 40 + (k % 3) * 12;
    x.fillStyle = '#FF9F2E';
    x.beginPath(); x.moveTo(fx - 20, R.y + 10); x.quadraticCurveTo(fx - 16, R.y - alto * 0.6, fx, R.y - alto);
    x.quadraticCurveTo(fx + 16, R.y - alto * 0.6, fx + 20, R.y + 10); x.fill();
    x.fillStyle = '#FFE066';
    x.beginPath(); x.moveTo(fx - 9, R.y + 10); x.quadraticCurveTo(fx - 7, R.y - alto * 0.3, fx, R.y - alto * 0.55);
    x.quadraticCurveTo(fx + 7, R.y - alto * 0.3, fx + 9, R.y + 10); x.fill();
  }
  // argamasa encendida y ladrillos
  const gm = x.createLinearGradient(0, R.y, 0, R.y + R.h);
  gm.addColorStop(0, '#FFA94D'); gm.addColorStop(1, '#E8572E');
  rrMI(x, R.x, R.y, R.w, R.h, 18); x.fillStyle = gm; x.fill();
  const fila = 58, lad = 124, colores = ['#8E3B24', '#7A3020', '#9C4628', '#6E2A1C', '#843522'];
  for (let y = R.y + 7, f = 0; y < R.y + R.h - 12; y += fila, f++) {
    for (let xx = R.x + 7 - (f % 2 ? lad / 2 : 0), k = 0; xx < R.x + R.w - 7; xx += lad, k++) {
      const x0 = Math.max(R.x + 7, xx), x1 = Math.min(R.x + R.w - 7, xx + lad - 8);
      const h = Math.min(fila - 8, R.y + R.h - 7 - y);
      if (x1 - x0 < 12 || h < 12) continue;
      rrMI(x, x0, y, x1 - x0, h, 7); x.fillStyle = colores[(f * 3 + k * 2) % colores.length]; x.fill();
      x.fillStyle = 'rgba(255,255,255,.09)'; x.fillRect(x0 + 6, y + 5, x1 - x0 - 12, 6);
    }
  }
  // borde de lava alrededor del agujero, y el agujero
  x.globalCompositeOperation = 'source-atop'; siluetaMI(x, pose, MI.HUECO + 14, '#FFD36B');
  x.globalCompositeOperation = 'destination-out'; siluetaMI(x, pose, MI.HUECO, '#000');
  x.globalCompositeOperation = 'source-over';
  return c;
}
function pintarMuroMI(ctx, img, s, alfa, dx) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alfa) * (0.45 + 0.55 * Math.min(1, s));
  ctx.translate(MI.V.x + (dx || 0), MI.V.y); ctx.scale(s, s); ctx.translate(-MI.V.x, -MI.V.y);
  ctx.drawImage(img, 0, 0, MI.W, MI.H);
  ctx.restore();
}

/* ===================== DETECCIÓN DE COINCIDENCIA ===================== */
// ¿La pose del personaje es la del agujero? tol: 0 (exacta) o 45 (flexible).
function coincideMI(pose, objetivo, tol) {
  return SEGMENTOS_MURO.every((s) => Math.abs((pose[s.id] || 0) - (objetivo[s.id] || 0)) <= (tol || 0));
}
// La parte del cuerpo bajo el puntero (o null). extra: zona de clic más amplia.
function parteEnMI(pose, x, y, extra) {
  const E = esqueletoMI(pose);
  let mejor = null, dist = Infinity;
  SEGMENTOS_MURO.forEach((s) => {
    const [p, q] = E.seg[s.id];
    const vx = q.x - p.x, vy = q.y - p.y, l2 = vx * vx + vy * vy || 1;
    const k = Math.max(0, Math.min(1, ((x - p.x) * vx + (y - p.y) * vy) / l2));
    const d = Math.hypot(x - (p.x + vx * k), y - (p.y + vy * k));
    const limite = anchoMI(s) / 2 + extra + (s.tipo === 'torso' ? 0 : 6);
    // El torso cede ante brazos y piernas que lo cruzan.
    const peso = s.tipo === 'torso' ? d + 12 : d;
    if (d <= limite && peso < dist) { dist = peso; mejor = s.id; }
  });
  return mejor;
}
function girarMI(pose, id, dir) {
  const s = SEGMENTOS_MURO.find((x) => x.id === id);
  if (!s) return pose;
  const i = s.pasos.indexOf(pose[id]);
  const j = ((i < 0 ? s.pasos.indexOf(0) : i) + dir + s.pasos.length) % s.pasos.length;   // al llegar al límite, vuelve al otro extremo
  return { ...pose, [id]: s.pasos[j] };
}

/* =============================== AUDIO =============================== */
// Web Audio compartido por los juegos del Capibara (capibara-comun.jsx); el silencio vale para todos.
const ctxAudioMI = () => audioCapibara.despertar();
const tonoMI = (...x) => audioCapibara.tono(...x);
const ruidoMI = (...x) => audioCapibara.ruido(...x);
const SONIDO_MI = {
  clic: () => tonoMI(700, 0.06, 'square', 0.04),
  exito: () => [523, 659, 784, 1047].forEach((f, i) => tonoMI(f, 0.22, 'triangle', 0.18, i * 0.09)),
  choque: () => { tonoMI(150, 0.4, 'sawtooth', 0.22, 0, 45); ruidoMI(0.3, 0.35, 700); },
  salpicadura: () => { ruidoMI(0.9, 0.4, 2200); tonoMI(420, 0.35, 'sine', 0.08, 0.05, 120); },
  fin: () => [392, 523, 659, 784, 1047].forEach((f, i) => tonoMI(f, 0.3, 'triangle', 0.16, i * 0.12)),
};

/* =============================== ESCENA =============================== */
function fondoMI(ctx, luz, reloj) {
  const cielo = ctx.createLinearGradient(0, 0, 0, MI.V.y);
  cielo.addColorStop(0, luz ? '#FFE9C9' : '#E98A4B'); cielo.addColorStop(0.6, luz ? '#FFF1DC' : '#F5B66E'); cielo.addColorStop(1, luz ? '#FFF8EC' : '#FBDDA4');
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, MI.W, MI.V.y);
  circuloMI(ctx, 1250, 330, 96, 'rgba(255,240,190,.35)'); circuloMI(ctx, 1250, 330, 66, 'rgba(255,244,200,.95)');
  // nubes que pasan lento
  const nx = ((reloj || 0) / 90) % 1900 - 150;
  ctx.fillStyle = 'rgba(255,250,240,.85)';
  [[nx, 140], [nx + 900, 220]].forEach(([x, y]) => {
    const xx = ((x % 1900) + 1900) % 1900 - 150;
    ctx.beginPath(); ctx.ellipse(xx, y, 90, 30, 0, 0, Math.PI * 2); ctx.ellipse(xx + 55, y - 18, 60, 34, 0, 0, Math.PI * 2); ctx.fill();
  });
  // volcancito y colinas lejanas
  ctx.fillStyle = luz ? '#D9B79A' : '#B0705A';
  ctx.beginPath(); ctx.moveTo(-10, 470); ctx.lineTo(-10, 380); ctx.quadraticCurveTo(160, 290, 300, 330); ctx.lineTo(350, 300); ctx.lineTo(400, 300);
  ctx.quadraticCurveTo(470, 380, 600, 470); ctx.closePath(); ctx.fill();
  ctx.fillStyle = luz ? '#E8C9AE' : '#C98A6A';
  ctx.beginPath(); ctx.moveTo(1000, 470); ctx.quadraticCurveTo(1200, 360, 1420, 400); ctx.quadraticCurveTo(1540, 420, 1610, 400); ctx.lineTo(1610, 470); ctx.closePath(); ctx.fill();
  // suelo y pista empedrada en perspectiva
  const suelo = ctx.createLinearGradient(0, MI.V.y, 0, MI.H);
  suelo.addColorStop(0, luz ? '#B9D69A' : '#9BBF74'); suelo.addColorStop(1, luz ? '#86B06E' : '#5E8A4A');
  ctx.fillStyle = suelo; ctx.fillRect(0, MI.V.y, MI.W, MI.H - MI.V.y);
  ctx.fillStyle = luz ? '#E8DCC4' : '#CDB894';
  ctx.beginPath(); ctx.moveTo(770, MI.V.y); ctx.lineTo(830, MI.V.y); ctx.lineTo(1420, MI.H); ctx.lineTo(180, MI.H); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(110,80,50,.28)'; ctx.lineWidth = 2;
  for (let k = 1; k < 8; k++) {
    const y = MI.V.y + (MI.H - MI.V.y) * Math.pow(k / 8, 1.8);
    const a = (y - MI.V.y) / (MI.H - MI.V.y);
    ctx.beginPath(); ctx.moveTo(800 - 30 - 590 * a, y); ctx.lineTo(800 + 30 + 590 * a, y); ctx.stroke();
  }
}
function plataformaMI(ctx) {
  rrMI(ctx, 560, 800, 480, 26, 8); ctx.fillStyle = '#A9743F'; ctx.fill(); ctx.strokeStyle = '#5A3A1C'; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(90,58,28,.45)'; ctx.lineWidth = 3;
  [680, 800, 920].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 803); ctx.lineTo(x, 823); ctx.stroke(); });
  ctx.fillStyle = '#7A5634'; ctx.fillRect(590, 826, 18, 20); ctx.fillRect(992, 826, 18, 20);
}
function piscinaMI(ctx, reloj) {
  const agua = ctx.createLinearGradient(0, 836, 0, MI.H);
  agua.addColorStop(0, '#7CCBE6'); agua.addColorStop(1, '#2E7FAE');
  ctx.fillStyle = agua; ctx.fillRect(0, 838, MI.W, MI.H - 838);
  ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath();
  for (let x = 0; x <= MI.W; x += 20) {
    const y = 842 + Math.sin(x / 60 + (reloj || 0) / 380) * 4;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
// Vista previa de la silueta (esquina superior izquierda).
function previaMI(ctx, objetivo, luz) {
  const x = 34, y = 150, w = 230, h = 270;
  ctx.save();
  rrMI(ctx, x, y, w, h, 22); ctx.fillStyle = luz ? '#FFFFFF' : 'rgba(255,253,246,.94)'; ctx.fill();
  ctx.strokeStyle = '#6B4A2B'; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = '#4A3220'; ctx.font = 'italic 800 26px Fraunces, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.fillText(objetivo.nombre, x + w / 2, y + 40);
  ctx.beginPath(); rrMI(ctx, x + 10, y + 52, w - 20, h - 62, 14); ctx.clip();
  ctx.translate(x + w / 2, y + 52 + (h - 62) / 2); ctx.scale(0.4, 0.4); ctx.translate(-800, -578);
  siluetaMI(ctx, objetivo.p, 0, '#3A2614');
  ctx.restore();
}
function particulasMI(ctx, G, dt) {
  const k = dt / 16.7;
  G.gotas = G.gotas.filter((p) => p.vida > 0);
  G.gotas.forEach((p) => {
    p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.9 * k; p.vida -= dt;
    circuloMI(ctx, p.x, p.y, p.r, 'rgba(160,220,245,.92)', '#2E7FAE', 2);
  });
  G.chispas = G.chispas.filter((p) => p.vida > 0);
  G.chispas.forEach((p) => {
    p.x += p.vx * k; p.y += p.vy * k; p.vy += 0.25 * k; p.vida -= dt;
    ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, p.vida / 600)); ctx.translate(p.x, p.y); ctx.rotate(p.vida / 200);
    ctx.fillStyle = p.c; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const r = i % 2 ? p.r * 0.4 : p.r; ctx.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  });
}
function salpicarMI(G) {
  for (let i = 0; i < 46; i++) G.gotas.push({ x: 800 + (Math.random() - 0.5) * 360, y: 846, vx: (Math.random() - 0.5) * 16, vy: -8 - Math.random() * 18, r: 5 + Math.random() * 9, vida: 1600 });
}
function chispasMI(G) {
  const c = ['#FFE066', '#FFFFFF', '#A7D88E', '#FFB13B'];
  for (let i = 0; i < 34; i++) G.chispas.push({ x: 800 + (Math.random() - 0.5) * 200, y: 420 + (Math.random() - 0.5) * 200, vx: (Math.random() - 0.5) * 14, vy: -6 - Math.random() * 10, r: 8 + Math.random() * 10, c: c[i % c.length], vida: 1500 });
}

/* Dibuja todo el cuadro. */
function dibujarMI(ctx, G, C, dt) {
  const luz = document.documentElement.getAttribute('data-vg-tono') === 'luz';
  const e = G.reloj - G.inicio;
  fondoMI(ctx, luz, G.reloj);
  const conMuro = G.muro && ['turno', 'previa', 'muro', 'juez', 'exito', 'fallo'].includes(G.fase);
  let s = MI.LEJOS, alfa = 1, delante = false, temblor = 0;
  if (G.fase === 'muro') { const p = Math.min(1, e / G.T); s = 1 / (1 + (1 / MI.LEJOS - 1) * (1 - p)); }
  else if (G.fase === 'juez') s = 1;
  else if (G.fase === 'exito') { const p = Math.min(1, e / 900); s = 1 + p * 0.9; alfa = 1 - p; delante = true; }
  else if (G.fase === 'fallo') { s = 1; alfa = 1 - Math.max(0, Math.min(1, (e - 1500) / 900)); temblor = e < 500 ? Math.sin(e / 18) * 14 * (1 - e / 500) : 0; }
  if (conMuro && !delante && alfa > 0) pintarMuroMI(ctx, G.muro, s, alfa, temblor);
  plataformaMI(ctx);
  const conPj = C.juez !== 'docente' && G.fase !== 'menu';
  if (conPj && !(G.fase === 'fallo' && e > 1700)) {
    ctx.save();
    if (G.fase === 'exito') { const j = Math.sin(Math.PI * Math.min(1, e / 700)); ctx.translate(0, -70 * j); }
    if (G.fase === 'fallo') {   // empujado hacia la piscina, dando vueltas
      const p = Math.max(0, Math.min(1, (e - 150) / 1200));
      ctx.translate(MI.CADERA.x, MI.CADERA.y + p * p * 470); ctx.rotate(p * 0.9); ctx.scale(1 + p * 0.35, 1 + p * 0.35);
      ctx.translate(-MI.CADERA.x, -MI.CADERA.y);
    }
    const pj = PERSONAJES_MURO[C.personaje] || PERSONAJES_MURO[0];
    const activo = G.fase === 'previa' || G.fase === 'muro';
    dibujarPersonajeMI(ctx, G.pose, pj, {
      resaltar: activo ? G.hover : null,
      seleccion: activo && G.reloj < G.nums ? SEGMENTOS_MURO[G.seg].id : null,
      numeros: activo && G.reloj < G.nums,
    });
    ctx.restore();
  }
  if (conMuro && delante && alfa > 0) pintarMuroMI(ctx, G.muro, s, alfa, 0);
  piscinaMI(ctx, G.reloj);
  particulasMI(ctx, G, dt);
  if (G.objetivo && (G.fase === 'previa' || G.fase === 'muro' || G.fase === 'turno')) previaMI(ctx, G.objetivo, luz);
}

/* Retrato de un concursante (tarjetas del menú). */
function RetratoMI({ pj }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1, w = 150, h = 190;
    c.width = w * dpr; c.height = h * dpr;
    const ctx = c.getContext('2d'), k = 0.36 * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.translate(-800 + (w * dpr / k) / 2, -312);
    dibujarPersonajeMI(ctx, { ...NEUTRA_MURO, bd1: 135, bd2: 45 }, pj, {});
  }, [pj]);
  return <canvas ref={ref} style={{ width: 150, height: 190 }} aria-hidden="true" />;
}

/* ============================== MODOS ============================== */
let recordSesionMI = 0;   // récord de esta sesión (no se guarda: en Vigía solo se guardan nombres)
const FASES_JUEGO_MI = ['turno', 'previa', 'muro', 'juez', 'exito', 'fallo'];

function nuevoJuegoMI(n) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, pose: { ...NEUTRA_MURO }, objetivo: null, muro: null, T: 10000, listoBono: null,
    seg: 0, hover: null, nums: 0, puntos: 0, vidas: MI.VIDAS, superados: 0, turno: 0, ronda: 1,
    eq: Array.from({ length: n }, () => ({ puntos: 0, vidas: MI.VIDAS, superados: 0 })),
    ultimo: null, gotas: [], chispas: [], salpico: false, pasa: null, colas: {},
  };
}

function MuroInfernal({ a, estudiantes, onContinuar }) {
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const sesion = useJaguarEstado();
  const nEq = Math.max(2, Math.min(PALETA_CAPIBARA.length, jaguarSesion().n || a.equipos || 2));
  const [provisional] = React.useState(() => jaguarSesion().equipos || jaguarRepartir(nombres, nEq));
  const equipos = sesion.equipos || provisional;
  const eqV = equiposCapibara(equipos);
  React.useEffect(() => {
    if (!jaguarSesion().equipos) cambiarJaguar(() => ({ equipos: provisional }));
    jaguarIniciar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modo = a.modoMuro === 'individual' ? 'individual' : 'beam';
  const juez = modo === 'beam' && (a.juezMuro || 'docente') === 'docente' ? 'docente' : 'auto';
  const tol = a.toleranciaMuro ? 45 : 0;
  const rondas = Math.max(1, Math.min(6, a.rondasMuro || 3));
  const [tiempo, setTiempo] = React.useState(() => Math.max(6, Math.min(60, a.tiempoMuro || 15)));
  const [personaje, setPersonaje] = React.useState(0);
  const [equipoInd, setEquipoInd] = React.useState(0);
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [ver, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoMI(eqV.length);
  const cfg = React.useRef({});
  cfg.current = { modo, juez, tol, tiempo, rondas, personaje, equipoInd, pausado, nEq: eqV.length };
  const G = g.current;
  const seguir = React.useRef(onContinuar);
  seguir.current = onContinuar;

  // ---- Lienzo responsivo (mantiene 16:9; sirve en 1024×768): capibara-comun.jsx ----
  const { raiz, lienzo, tam } = useLienzoCp(MI.W, MI.H);
  const barra = React.useRef(null);

  // ---- Reglas del juego ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; setFase(f); };
  const nivelActual = () => (cfg.current.modo === 'individual' ? 1 + Math.floor(g.current.superados / 3) : g.current.ronda);
  const tiempoMuro = () => {
    const C = cfg.current, X = g.current;
    if (C.modo === 'individual') return Math.max(3500, 9000 - (nivelActual() - 1) * 800);
    return Math.max(C.tiempo * 600, C.tiempo * 1000 - (X.ronda - 1) * 2000);
  };
  const prepararMuro = (nuevo) => {
    const X = g.current;
    if (nuevo || !X.objetivo) { X.objetivo = elegirPoseMI(nivelActual()); X.muro = construirMuroMI(X.objetivo.p); }
    X.pose = { ...NEUTRA_MURO }; X.T = tiempoMuro(); X.listoBono = null; X.salpico = false; X.hover = null;
  };
  // Quién pasa al frente: lo decide la plataforma (capibara-comun.jsx, sin repetir en la presentación).
  const quienPasa = (i) => siguienteConcursanteCp(i);
  const empezar = () => {
    const C = cfg.current;
    ctxAudioMI(); SONIDO_MI.clic();
    const X = nuevoJuegoMI(C.nEq);
    X.reloj = g.current.reloj;
    g.current = X;
    if (C.modo === 'individual') { prepararMuro(true); irA('previa'); }
    else { X.turno = 0; X.ronda = 1; X.pasa = quienPasa(0); prepararMuro(true); irA('turno'); }
    refrescar();
  };
  const fin = () => {
    const X = g.current;
    if (cfg.current.modo === 'individual') recordSesionMI = Math.max(recordSesionMI, X.puntos);
    SONIDO_MI.fin(); irA('fin'); refrescar();
  };
  const resolver = (ok) => {
    const X = g.current, C = cfg.current;
    const quien = C.modo === 'individual' ? C.equipoInd : X.turno;
    if (ok) {
      const pts = MI.BASE + (X.listoBono || 0) * MI.BONO_SEG;
      if (C.modo === 'individual') { X.puntos += pts; X.superados += 1; }
      else { X.eq[quien].puntos += pts; X.eq[quien].superados += 1; }
      jaguarPunto(quien, 1);   // un paso más hacia Jomu
      X.ultimo = { ok: true, pts, bono: X.listoBono || 0 };
      chispasMI(X); SONIDO_MI.exito(); irA('exito');
    } else {
      if (C.modo === 'individual') X.vidas -= 1; else X.eq[quien].vidas -= 1;
      X.ultimo = { ok: false };
      SONIDO_MI.choque(); irA('fallo');
    }
    refrescar();
  };
  const llegar = () => {
    const X = g.current, C = cfg.current;
    if (C.juez === 'docente') { irA('juez'); return; }
    resolver(coincideMI(X.pose, X.objetivo.p, C.tol));
  };
  // Siguiente equipo con vidas (en orden); al dar la vuelta, otra ronda.
  const siguienteTurno = () => {
    const X = g.current;
    const t = siguienteTurnoCp(X.turno, X.ronda, X.eq.length, cfg.current.rondas, (i) => X.eq[i].vidas > 0);
    if (!t) return null;
    X.ronda = t.ronda;
    return t.turno;
  };
  const siguiente = () => {
    const X = g.current;
    if (cfg.current.modo === 'individual') {
      if (X.vidas <= 0) { fin(); return; }
      prepararMuro(true); irA('previa'); refrescar(); return;
    }
    const i = siguienteTurno();
    if (i === null) { fin(); return; }
    X.turno = i; X.pasa = quienPasa(i); prepararMuro(true); irA('turno'); refrescar();
  };
  const listo = () => {
    const X = g.current, e = X.reloj - X.inicio;
    if (X.fase === 'turno') { irA('previa'); return; }
    if (X.fase === 'previa') { irA('muro'); return; }
    if (X.fase !== 'muro') return;
    X.listoBono = Math.max(0, Math.floor((X.T - e) / 1000));
    if (cfg.current.juez === 'docente') { irA('juez'); return; }
    X.T = Math.min(X.T, e + MI.LISTO_MS);
  };
  const repetir = () => {
    const X = g.current;
    if (!['previa', 'muro', 'juez'].includes(X.fase)) return;
    prepararMuro(false); irA('previa'); refrescar();
  };
  const saltar = () => {
    const X = g.current;
    if (!FASES_JUEGO_MI.includes(X.fase) || X.fase === 'exito' || X.fase === 'fallo') return;
    if (cfg.current.modo === 'individual') { prepararMuro(true); irA('previa'); refrescar(); }
    else siguiente();
  };
  const juzgar = (ok) => { if (g.current.fase === 'juez') resolver(ok); };
  const alternarPausa = () => {
    if (!FASES_JUEGO_MI.includes(g.current.fase)) return;
    setPausado((p) => { cfg.current.pausado = !p; return !p; });
  };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const girar = (id, dir) => {
    const X = g.current;
    if (cfg.current.juez === 'docente' || cfg.current.pausado || !(X.fase === 'previa' || X.fase === 'muro')) return;
    X.pose = girarMI(X.pose, id, dir);
    X.seg = SEGMENTOS_MURO.findIndex((s) => s.id === id);
    SONIDO_MI.clic(); refrescar();
  };
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  const cambiarTiempo = (d) => setTiempo((t) => Math.max(6, Math.min(60, t + d)));

  // ---- Bucle de animación ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current, C = cfg.current;
      if (!C.pausado) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'previa' && e >= MI.PREVIA_MS) irA('muro');
        else if (X.fase === 'muro' && e >= X.T) llegar();
        else if (X.fase === 'exito' && e >= MI.EXITO_MS) siguiente();
        else if (X.fase === 'fallo') {
          if (!X.salpico && e >= (C.juez === 'docente' ? 350 : 1150)) { X.salpico = true; salpicarMI(X); SONIDO_MI.salpicadura(); }
          if (e >= MI.FALLO_MS) siguiente();
        }
      }
      const c = lienzo.current;
      if (c) {
        const ctx = c.getContext('2d'), k = c.width / MI.W;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        dibujarMI(ctx, X, C, C.pausado ? 0 : dt);
      }
      if (barra.current) {
        const e = X.reloj - X.inicio;
        const resto = X.fase === 'muro' ? Math.max(0, 1 - e / X.T) : X.fase === 'previa' || X.fase === 'turno' ? 1 : 0;
        barra.current.style.transform = 'scaleX(' + resto.toFixed(3) + ')';
        barra.current.classList.toggle('poco', X.fase === 'muro' && resto < 0.3);
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mouse, toque y teclado ----
  const puntoLogico = (ev) => {
    const r = lienzo.current.getBoundingClientRect();
    return { x: (ev.clientX - r.left) * MI.W / r.width, y: (ev.clientY - r.top) * MI.H / r.height };
  };
  const extraClic = modo === 'beam' ? 34 : 12;
  const onMover = (ev) => {
    const X = g.current;
    if (juez === 'docente' || !(X.fase === 'previa' || X.fase === 'muro')) { if (X.hover) X.hover = null; return; }
    const p = puntoLogico(ev);
    X.hover = parteEnMI(X.pose, p.x, p.y, extraClic);
    lienzo.current.style.cursor = X.hover ? 'pointer' : 'default';
  };
  const onTocar = (ev) => {
    const X = g.current;
    if (X.fase === 'turno') { listo(); return; }
    const p = puntoLogico(ev);
    const id = parteEnMI(X.pose, p.x, p.y, extraClic);
    if (id) { ev.preventDefault(); girar(id, ev.button === 2 ? -1 : 1); }
  };
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const X = g.current, k = e.key;
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      if (/^[1-9]$/.test(k)) { tomar(); X.seg = Number(k) - 1; X.nums = X.reloj + 4000; refrescar(); return; }
      if (k === 'ArrowLeft' || k === 'PageUp' || k === 'ArrowRight' || k === 'PageDown') {
        tomar(); X.nums = X.reloj + 4000;
        girar(SEGMENTOS_MURO[X.seg].id, k === 'ArrowLeft' || k === 'PageUp' ? -1 : 1); return;
      }
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        tomar(); X.seg = (X.seg + (k === 'ArrowDown' ? 1 : -1) + SEGMENTOS_MURO.length) % SEGMENTOS_MURO.length;
        X.nums = X.reloj + 4000; refrescar(); return;
      }
      if (k === ' ' || k === 'Enter') {
        if (e.target && /button/i.test(e.target.tagName)) return;
        tomar();
        if (X.fase === 'menu') empezar(); else if (X.fase === 'fin') verMontana(); else if (X.fase === 'montana') seguir.current(); else listo();
        return;
      }
      const l = k.toLowerCase();
      if (l === 'p') { tomar(); alternarPausa(); }
      else if (l === 'r') { tomar(); repetir(); }
      else if (l === 'n') { tomar(); saltar(); }
      else if (l === 'f') { tomar(); pantallaCompleta(); }
      else if (l === 'm') { tomar(); alternarSilencio(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: el celular ve el estado y tiene los mismos botones ----
  React.useEffect(() => {
    fijarEstadoCapibara({
      juego: 'muro', fase, modo, juez, pausado, silencio, tiempo, rondas, ronda: G.ronda, turno: G.turno,
      personaje, personajes: juez === 'docente' ? [] : PERSONAJES_MURO.map((p) => p.nombre), equipoInd,
      seg: G.seg, segmentos: juez === 'docente' ? [] : SEGMENTOS_MURO.map((s) => s.nombre),
      pose: G.objetivo ? G.objetivo.nombre : null, puntos: G.puntos, vidas: G.vidas,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pausado, silencio, tiempo, personaje, equipoInd, ver]);
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'mu-empezar') { if (X.fase === 'menu') empezar(); }
    else if (x === 'mu-personaje') { if (X.fase === 'menu') setPersonaje(Math.max(0, Math.min(PERSONAJES_MURO.length - 1, o.i || 0))); }
    else if (x === 'mu-equipo') { if (X.fase === 'menu') setEquipoInd(Math.max(0, Math.min(eqV.length - 1, o.i || 0))); }
    else if (x === 'mu-tiempo') { if (X.fase === 'menu') cambiarTiempo(o.d || 0); }
    else if (x === 'mu-seg') { const s = SEGMENTOS_MURO[o.k]; if (s) girar(s.id, o.d < 0 ? -1 : 1); }
    else if (x === 'mu-listo') listo();
    else if (x === 'mu-juez') juzgar(!!o.ok);
    else if (x === 'mu-pausa') alternarPausa();
    else if (x === 'mu-repetir') repetir();
    else if (x === 'mu-saltar') saltar();
    else if (x === 'mu-terminar') { if (FASES_JUEGO_MI.includes(X.fase)) { setPausado(false); cfg.current.pausado = false; fin(); } }
    else if (x === 'mu-silencio') alternarSilencio();
    else if (x === 'mu-montana') verMontana();
    else if (x === 'mu-otra') otraVez();
    else if (x === 'mu-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') {
      if (X.fase === 'menu') empezar(); else if (X.fase === 'fin') verMontana(); else if (X.fase === 'montana') onContinuar(); else listo();
    }
  });

  /* ================================ HUD ================================ */
  const enJuego = FASES_JUEGO_MI.includes(fase);
  const eqTurno = eqV[G.turno] || eqV[0];
  const eqInd = eqV[equipoInd] || eqV[0];
  const vidas = (n) => <span className="vg-mi-vidas" aria-label={n + ' vidas'}>{Array.from({ length: MI.VIDAS }, (_, i) => <i key={i} className={i < n ? 'on' : ''}>♥</i>)}</span>;
  const terminarJuego = () => { setPausado(false); cfg.current.pausado = false; fin(); };

  // Resultados (final)
  const tabla = eqV.map((e, i) => ({ ...e, i, ...G.eq[i] })).sort((x, y) => y.puntos - x.puntos || y.superados - x.superados);
  const ganadorI = modo === 'individual' ? (G.superados > 0 ? equipoInd : null) : (tabla[0] && tabla[0].puntos > 0 ? tabla[0].i : null);
  const empate = modo === 'beam' && tabla.length > 1 && tabla[0].puntos > 0 && tabla[0].puntos === tabla[1].puntos;

  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Muro Infernal" />;

  return (
    <div className="vg-cp vg-mi" ref={raiz} role="dialog" aria-label="Muro Infernal">
      <div className="vg-mi-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>
        <canvas ref={lienzo} className="vg-mi-lienzo" onPointerDown={onTocar} onPointerMove={onMover}
          onPointerLeave={() => { g.current.hover = null; }} onContextMenu={(e) => e.preventDefault()} />

        {/* Marcador */}
        {enJuego && (modo === 'individual' ? (
          <div className="vg-mi-hud">
            <span className="emo">{eqInd.emoji}</span>
            <b>⭐ {G.puntos}</b>
            <span>Nivel {1 + Math.floor(G.superados / 3)}</span>
            {vidas(G.vidas)}
          </div>
        ) : (
          <div className="vg-mi-marcador">
            {eqV.map((e, i) => (
              <div key={i} className={'vg-mi-eq' + (i === G.turno ? ' turno' : '') + (G.eq[i].vidas <= 0 ? ' fuera' : '')} style={{ '--c': e.color }}>
                <span className="emo">{e.emoji}</span><b>{G.eq[i].puntos}</b>{vidas(G.eq[i].vidas)}
              </div>
            ))}
            <div className="vg-mi-ronda">Ronda {G.ronda}/{rondas}</div>
          </div>
        ))}
        {enJuego && <div className="vg-mi-tiempo"><i ref={barra}></i></div>}

        {/* Botones (también en el celular) */}
        {enJuego && (
          <div className="vg-mi-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            <button type="button" onClick={alternarPausa} title="Pausa (P)">⏸</button>
            {(fase === 'muro' || fase === 'previa') && <button type="button" className="listo" onClick={listo} title="¡Listo! (Espacio)">✓ ¡Listo!</button>}
          </div>
        )}
        {fase === 'muro' && modo === 'individual' && (
          <div className="vg-mi-ayuda">Clic: girar · Clic derecho: al revés · 1–9 y ← → · Espacio: ¡Listo!</div>
        )}
        {fase === 'previa' && <div className="vg-mi-aviso">¡Prepárate!</div>}

        {/* Turno del equipo (video beam) */}
        {fase === 'turno' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta turno" style={{ '--c': eqTurno.color }}>
              <div className="vg-mi-emo-grande">{eqTurno.emoji}</div>
              <h2>Turno del {eqTurno.nombre}</h2>
              {G.pasa && <p className="pasa">Pasa al frente: <strong>{G.pasa}</strong></p>}
              <p>{juez === 'docente' ? '¡Imita con tu cuerpo la pose del agujero!' : '¡Muevan al personaje hasta la pose del agujero!'}</p>
              <button type="button" className="vg-cp-btn grande" onClick={listo}>▶ ¡Que venga el muro!</button>
            </div>
          </div>
        )}

        {/* El docente decide (pose con el cuerpo) */}
        {fase === 'juez' && (
          <div className="vg-mi-capa abajo">
            <div className="vg-mi-juez">
              <h2>¿Quedó en la pose?</h2>
              <div className="fila">
                <button type="button" className="vg-cp-btn grande si" onClick={() => juzgar(true)}>✓ ¡Sí, pasó!</button>
                <button type="button" className="vg-cp-btn grande no" onClick={() => juzgar(false)}>✗ ¡Al agua!</button>
              </div>
            </div>
          </div>
        )}

        {fase === 'exito' && G.ultimo && (
          <div className="vg-mi-aviso grande exito">¡Lo lograron! <small>+{G.ultimo.pts}{G.ultimo.bono ? ' (bono ' + G.ultimo.bono + ' s)' : ''} · 1 paso hacia Jomu</small></div>
        )}
        {fase === 'fallo' && <div className="vg-mi-aviso grande fallo">¡Al agua! <small>−1 vida</small></div>}

        {pausado && enJuego && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>Pausa</h2>
              <div className="vg-mi-columna">
                <button type="button" className="vg-cp-btn grande" onClick={alternarPausa}>▶ Seguir</button>
                <button type="button" className="vg-cp-btn suave" onClick={() => { alternarPausa(); repetir(); }}>↻ Repetir muro (R)</button>
                <button type="button" className="vg-cp-btn suave" onClick={() => { alternarPausa(); saltar(); }}>⏭ {modo === 'beam' ? 'Saltar turno' : 'Otro muro'} (N)</button>
                <button type="button" className="vg-cp-btn suave" onClick={terminarJuego}>🏁 Terminar juego</button>
              </div>
            </div>
          </div>
        )}

        {/* Menú inicial */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {modo === 'beam' ? 'Video beam · por equipos' : 'Teclado y mouse · individual'}</div>
              <h1 className="vg-mi-titulo">🔥 Muro Infernal 🔥</h1>
              <p className="vg-mi-intro">
                {juez === 'docente'
                  ? 'Un estudiante de cada equipo pasa al frente. Se acerca un muro con un agujero: ¡quédate en esa pose antes de que llegue!'
                  : 'Se acerca un muro con un agujero. Pon al personaje en la misma pose antes de que llegue… ¡o al agua!'}
              </p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              {juez !== 'docente' && (
                <React.Fragment>
                  <div className="vg-mi-sub">Elige tu concursante</div>
                  <SelectorPersonajeCp valor={personaje} onElegir={setPersonaje} />
                </React.Fragment>
              )}
              {modo === 'individual' ? (
                <React.Fragment>
                  <div className="vg-mi-sub">¿De qué equipo es quien juega?</div>
                  <ChipsEquiposCp equipos={eqV} valor={equipoInd} onElegir={setEquipoInd} />
                  {recordSesionMI > 0 && <div className="vg-mi-sub">🏆 Récord de esta sesión: {recordSesionMI}</div>}
                </React.Fragment>
              ) : (
                <div className="vg-mi-ajuste">
                  <span>⏱ Tiempo por muro</span>
                  <button type="button" onClick={() => cambiarTiempo(-1)} disabled={tiempo <= 6} aria-label="Menos tiempo">−</button>
                  <b>{tiempo} s</b>
                  <button type="button" onClick={() => cambiarTiempo(1)} disabled={tiempo >= 60} aria-label="Más tiempo">+</button>
                  <span>· {rondas} {rondas === 1 ? 'ronda' : 'rondas'} · {eqV.length} equipos · 3 vidas</span>
                </div>
              )}
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final: ganador, tabla y activación enlazada */}
        {fase === 'fin' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta fin">
              {modo === 'individual' ? (
                <React.Fragment>
                  <h1 className="vg-mi-titulo">¡Fin del juego!</h1>
                  <p className="vg-mi-resultado">⭐ {G.puntos} puntos · {G.superados} {G.superados === 1 ? 'muro superado' : 'muros superados'}</p>
                  <p className="vg-mi-intro">{eqInd.emoji} El {eqInd.nombre} avanzó {G.superados} {G.superados === 1 ? 'paso' : 'pasos'} hacia Jomu.
                    {recordSesionMI > 0 && ' 🏆 Récord de esta sesión: ' + recordSesionMI + '.'}</p>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h1 className="vg-mi-titulo">{ganadorI === null ? '¡Fin del juego!' : empate ? '¡Empate!' : eqV[ganadorI].emoji + ' ¡Ganó el ' + eqV[ganadorI].nombre + '!'}</h1>
                  <TablaFinalCp filas={tabla.map((e) => ({ ...e, detalle: e.superados + (e.superados === 1 ? ' paso' : ' pasos') + ' hacia Jomu' }))} />
                </React.Fragment>
              )}
              {ganadorI !== null && a.enlace && equipos[ganadorI] && (
                <EnlaceJaguar enlace={a.enlace} equipo={equipos[ganadorI]} i={ganadorI} id={a.id} />
              )}
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={otraVez}>↻ Jugar otra vez</button>
                <button type="button" className="vg-cp-btn grande" onClick={verMontana}>🏔 Ver la montaña</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// El personaje (y su retrato) también lo usan los otros juegos del Capibara.
// siluetaMI, esqueletoMI y MEDIDAS_MURO también los usa Espejo en Vivo (capibara-espejo.jsx).
Object.assign(window, { MuroInfernal, POSES_MURO, SEGMENTOS_MURO, PERSONAJES_MURO, NEUTRA_MURO, dibujarPersonajeMI, RetratoMI, siluetaMI, esqueletoMI, MEDIDAS_MURO: MI });
