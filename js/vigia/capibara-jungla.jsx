/* capibara-jungla.jsx — Modo Capibara · «Movimiento de la Jungla» (cp-jungla).

   Jungla en perspectiva con tres carriles. Desde el fondo llegan obstáculos
   (bloquean 1 o 2 carriles; siempre queda uno libre) y, más adelante,
   animales-instrucción que ocupan los tres carriles y piden una acción
   (ave = saltar, cerdo = agacharse…). Juego continuo: corre hasta que se falla;
   el puntaje = objetos superados; la velocidad sube poco a poco. Cada
   `a.rachaJungla` objetos seguidos se suma una instrucción nueva (pausa breve
   con el animal y la acción en grande).

   Modos (`a.modoJungla`):
     · 'beam': el estudiante se mueve frente a la proyección; el juego NO
       evalúa: el docente presiona FALLÓ (celular, Espacio, Av Pág del
       presentador o el botón rojo). Durante unos segundos se puede deshacer.
       Turnos por equipo (`a.rondasJungla`), concursante = la plataforma.
     · 'individual': personaje en pantalla y el juego evalúa solo (teclado).

   Reutiliza: sesión de equipos del Jaguar (equipos, `jaguarPunto` = pasos
   hacia Jomu), capibara-comun.jsx (audio, lienzo 16:9, concursantes, turnos,
   selector de personaje, chips de equipo, tabla final, montaña final), el
   personaje del Muro Infernal (`dibujarPersonajeMI`, visto de espaldas), los
   estilos `vg-mi-*` y el estado del mando `fijarEstadoCapibara`.
   Pasos: 1 cada `a.objetosPorPaso` objetos de una carrera.

   Secciones: CONFIGURACIÓN · ESCENA Y CARRILES · GENERADOR DE OBJETOS ·
   BANCO DE INSTRUCCIONES · ESCALADA · AUDIO · MODO VIDEO BEAM / MODO TECLADO
   (componente) · HUD. */

/* =========================== CONFIGURACIÓN =========================== */
const JN = {
  W: 1600, H: 900, V: { x: 800, y: 300 }, LLEGADA: 820, LEJOS: 0.08,
  CARRILES: [400, 800, 1200], BORDES: [200, 600, 1000, 1400],
  VENTANA: 0.3,            // último tramo (30 % del recorrido) en que vale la acción
  ANUNCIO_MS: 3200, DESHACER_MS: 5000, CHOQUE_MS: 1400, INICIO_MS: 1500, ACCION_MS: 650,
  // Recorrido de un objeto (ms) según la velocidad inicial; el video beam va más lento.
  DUR: { beam: { lenta: 6200, media: 5000, rapida: 4000 }, individual: { lenta: 4000, media: 3200, rapida: 2600 } },
  GAP_MIN: { beam: 1500, individual: 620 },
};
const escalaJN = (p) => (p <= 1 ? 1 / (1 + (1 / JN.LEJOS - 1) * (1 - p)) : 1 + (p - 1) * 5);
const proyectarJN = (xAbajo, s) => ({ x: JN.V.x + (xAbajo - JN.V.x) * s, y: JN.V.y + (JN.LLEGADA - JN.V.y) * s });
const BJ = '#1F1408';   // contorno (alto contraste)

/* ======================== BANCO DE INSTRUCCIONES ========================
   Se desbloquean en este orden. Todas son acciones seguras para un salón.
   tecla: la del modo teclado (no usa P, R, N, M, F ni L, que son atajos). */
const BANCO_JN = [
  { id: 'ave', animal: 'AVE', art: 'un', accion: 'saltar', verbo: 'SALTA', tecla: '↑', key: 'ArrowUp' },
  { id: 'cerdo', animal: 'CERDO', art: 'un', accion: 'agachar', verbo: 'AGÁCHATE', tecla: '↓', key: 'ArrowDown' },
  { id: 'mono', animal: 'MONO', art: 'un', accion: 'aplaudir', verbo: 'APLAUDE', tecla: 'A', key: 'a' },
  { id: 'serpiente', animal: 'SERPIENTE', art: 'una', accion: 'quieto', verbo: 'QUÉDATE QUIETO', tecla: 'Q', key: 'q' },
  { id: 'loro', animal: 'LORO', art: 'un', accion: 'girar', verbo: 'GIRA', tecla: 'G', key: 'g' },
  { id: 'rana', animal: 'RANA', art: 'una', accion: 'cabeza', verbo: 'MANOS A LA CABEZA', tecla: 'C', key: 'c' },
  { id: 'tucan', animal: 'TUCÁN', art: 'un', accion: 'brazos', verbo: 'BRAZOS ARRIBA', tecla: 'B', key: 'b' },
  { id: 'perezoso', animal: 'PEREZOSO', art: 'un', accion: 'estirar', verbo: 'ESTÍRATE', tecla: 'E', key: 'e' },
  { id: 'tortuga', animal: 'TORTUGA', art: 'una', accion: 'pies', verbo: 'TÓCATE LOS PIES', tecla: 'T', key: 't' },
  { id: 'mariposa', animal: 'MARIPOSA', art: 'una', accion: 'aletear', verbo: 'ALETEA', tecla: 'V', key: 'v' },
];
const instrJN = (id) => BANCO_JN.find((x) => x.id === id);
const fraseJN = (x) => '¡Si ves ' + x.art + ' ' + x.animal + ', ' + x.verbo + '!';

/* Animales dibujados por código: centro en (0,0), unos 200 de ancho; t = reloj (ms). */
function trazoJN(ctx, relleno, ancho) { ctx.fillStyle = relleno; ctx.fill(); ctx.strokeStyle = BJ; ctx.lineWidth = ancho || 7; ctx.stroke(); }
function elipseJN(ctx, x, y, rx, ry, rot) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); }
function ojoJN(ctx, x, y, r) { elipseJN(ctx, x, y, r, r); trazoJN(ctx, '#FFFFFF', 4); elipseJN(ctx, x + r * 0.2, y, r * 0.5, r * 0.5); ctx.fillStyle = BJ; ctx.fill(); }
const DIBUJOS_JN = {
  ave(ctx, t) {
    elipseJN(ctx, 0, 0, 72, 54); trazoJN(ctx, '#3A8DDE');
    elipseJN(ctx, 10, 16, 40, 28); ctx.fillStyle = '#CFEAFF'; ctx.fill();
    ctx.save(); ctx.translate(-20, -10); ctx.rotate(Math.sin(t / 90) * 0.6); elipseJN(ctx, -20, -20, 50, 24, -0.5); trazoJN(ctx, '#2B6CB0'); ctx.restore();
    ctx.beginPath(); ctx.moveTo(62, -14); ctx.lineTo(110, 0); ctx.lineTo(62, 14); ctx.closePath(); trazoJN(ctx, '#FFB13B', 5);
    ojoJN(ctx, 36, -18, 13);
  },
  cerdo(ctx) {
    [[-50, 70], [50, 70]].forEach(([x, y]) => { ctx.beginPath(); ctx.rect(x - 12, y - 30, 24, 40); trazoJN(ctx, '#F4A3B4', 5); });
    elipseJN(ctx, 0, 20, 92, 62); trazoJN(ctx, '#F4A3B4');
    [[-38, -62], [38, -62]].forEach(([x, y], k) => { ctx.beginPath(); ctx.moveTo(x - 18, y + 14); ctx.lineTo(x + (k ? 14 : -14), y - 24); ctx.lineTo(x + 18, y + 14); ctx.closePath(); trazoJN(ctx, '#EE8FA4', 5); });
    elipseJN(ctx, 0, -20, 58, 50); trazoJN(ctx, '#F7B6C4');
    elipseJN(ctx, 0, -6, 26, 18); trazoJN(ctx, '#E77F96', 5);
    elipseJN(ctx, -9, -6, 4, 6); ctx.fillStyle = BJ; ctx.fill(); elipseJN(ctx, 9, -6, 4, 6); ctx.fill();
    ojoJN(ctx, -24, -36, 9); ojoJN(ctx, 24, -36, 9);
  },
  mono(ctx, t) {
    const b = Math.sin(t / 120) * 0.4;
    [[-1, b], [1, -b]].forEach(([l, r]) => { ctx.save(); ctx.translate(l * 55, 40); ctx.rotate(l * (2.3 + r)); ctx.beginPath(); ctx.rect(-12, 0, 24, 80); trazoJN(ctx, '#8E5E36', 5); ctx.restore(); });
    elipseJN(ctx, 0, 70, 50, 42); trazoJN(ctx, '#8E5E36');
    [-66, 66].forEach((x) => { elipseJN(ctx, x, -6, 26, 26); trazoJN(ctx, '#8E5E36', 5); elipseJN(ctx, x, -6, 14, 14); ctx.fillStyle = '#E8C39E'; ctx.fill(); });
    elipseJN(ctx, 0, 0, 64, 62); trazoJN(ctx, '#8E5E36');
    elipseJN(ctx, 0, 14, 46, 40); ctx.fillStyle = '#E8C39E'; ctx.fill();
    ojoJN(ctx, -20, -2, 11); ojoJN(ctx, 20, -2, 11);
    ctx.strokeStyle = BJ; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 22, 20, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  },
  serpiente(ctx, t) {
    const o = Math.sin(t / 150) * 10;
    const camino = () => { ctx.beginPath(); ctx.moveTo(-110, 70); ctx.bezierCurveTo(-60, 10 + o, -20, 110 - o, 30, 50); ctx.bezierCurveTo(60, 15, 70, -10, 70, -30); };
    ctx.lineCap = 'round'; camino(); ctx.strokeStyle = BJ; ctx.lineWidth = 46; ctx.stroke();
    camino(); ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 32; ctx.stroke();
    camino(); ctx.strokeStyle = '#FFE066'; ctx.lineWidth = 6; ctx.setLineDash([14, 22]); ctx.stroke(); ctx.setLineDash([]);
    elipseJN(ctx, 76, -48, 38, 28, -0.3); trazoJN(ctx, '#4CAF50');
    ctx.strokeStyle = '#E53935'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(110, -60); ctx.lineTo(132, -64); ctx.lineTo(142, -74); ctx.moveTo(132, -64); ctx.lineTo(144, -58); ctx.stroke();
    ojoJN(ctx, 80, -60, 9);
  },
  loro(ctx) {
    ctx.beginPath(); ctx.moveTo(-20, 50); ctx.lineTo(-50, 130); ctx.lineTo(-10, 130); ctx.lineTo(10, 50); ctx.closePath(); trazoJN(ctx, '#2B6CB0', 5);
    ctx.beginPath(); ctx.moveTo(0, 50); ctx.lineTo(10, 130); ctx.lineTo(40, 125); ctx.lineTo(25, 50); ctx.closePath(); trazoJN(ctx, '#FFC233', 5);
    elipseJN(ctx, 0, 10, 52, 70); trazoJN(ctx, '#E53935');
    elipseJN(ctx, -18, 24, 32, 50, 0.3); trazoJN(ctx, '#43A047', 5);
    elipseJN(ctx, 10, -58, 42, 40); trazoJN(ctx, '#E53935');
    ctx.beginPath(); ctx.moveTo(40, -70); ctx.quadraticCurveTo(84, -66, 66, -26); ctx.quadraticCurveTo(54, -44, 40, -44); ctx.closePath(); trazoJN(ctx, '#FFE066', 5);
    elipseJN(ctx, 18, -70, 14, 14); ctx.fillStyle = '#FFFFFF'; ctx.fill(); ojoJN(ctx, 18, -70, 8);
  },
  rana(ctx) {
    elipseJN(ctx, 0, 34, 96, 58); trazoJN(ctx, '#58B947');
    [-46, 46].forEach((x) => { elipseJN(ctx, x, -24, 30, 30); trazoJN(ctx, '#58B947'); ojoJN(ctx, x, -26, 16); });
    ctx.strokeStyle = BJ; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 26, 46, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
    ctx.globalAlpha = 0.5; elipseJN(ctx, -62, 40, 12, 9); ctx.fillStyle = '#FF8A80'; ctx.fill(); elipseJN(ctx, 62, 40, 12, 9); ctx.fill(); ctx.globalAlpha = 1;
  },
  tucan(ctx) {
    elipseJN(ctx, -10, 26, 56, 78); trazoJN(ctx, '#26221E');
    elipseJN(ctx, 4, -6, 30, 34); ctx.fillStyle = '#FFF8E7'; ctx.fill();
    elipseJN(ctx, 76, -26, 68, 26, -0.1); trazoJN(ctx, '#FF9F2E');
    elipseJN(ctx, 126, -20, 16, 14); ctx.fillStyle = BJ; ctx.fill();
    ctx.beginPath(); ctx.moveTo(20, -26); ctx.lineTo(140, -24); ctx.strokeStyle = BJ; ctx.lineWidth = 4; ctx.stroke();
    elipseJN(ctx, 0, -32, 14, 14); trazoJN(ctx, '#5BC0EB', 4); ojoJN(ctx, 0, -32, 7);
  },
  perezoso(ctx, t) {
    ctx.save(); ctx.translate(60, 30); ctx.rotate(-0.4 + Math.sin(t / 400) * 0.15); ctx.beginPath(); ctx.rect(-12, 0, 24, 90); trazoJN(ctx, '#A88A6A', 5);
    ctx.strokeStyle = BJ; ctx.lineWidth = 4; [-8, 0, 8].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, 90); ctx.lineTo(x + 4, 108); ctx.stroke(); }); ctx.restore();
    elipseJN(ctx, 0, 0, 70, 66); trazoJN(ctx, '#A88A6A');
    elipseJN(ctx, 0, 6, 54, 46); ctx.fillStyle = '#E6D3B5'; ctx.fill();
    elipseJN(ctx, -24, -4, 22, 12, 0.5); ctx.fillStyle = '#5B4636'; ctx.fill(); elipseJN(ctx, 24, -4, 22, 12, -0.5); ctx.fill();
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(-24, -4, 7, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.beginPath(); ctx.arc(24, -4, 7, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    elipseJN(ctx, 0, 14, 10, 7); ctx.fillStyle = BJ; ctx.fill();
    ctx.strokeStyle = BJ; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 26, 14, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  },
  tortuga(ctx) {
    [[-60, 60], [60, 60]].forEach(([x, y]) => { elipseJN(ctx, x, y, 20, 16); trazoJN(ctx, '#9CCC65', 5); });
    elipseJN(ctx, 100, 20, 30, 26); trazoJN(ctx, '#9CCC65'); ojoJN(ctx, 110, 12, 8);
    ctx.beginPath(); ctx.moveTo(-100, 50); ctx.quadraticCurveTo(-96, -70, 0, -70); ctx.quadraticCurveTo(96, -70, 100, 50); ctx.closePath(); trazoJN(ctx, '#3E8E41');
    ctx.strokeStyle = '#A5D6A7'; ctx.lineWidth = 5;
    [[-45, -10], [0, -30], [45, -10], [-20, 25], [25, 25]].forEach(([x, y]) => { ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); } ctx.closePath(); ctx.stroke(); });
    ctx.beginPath(); ctx.rect(-104, 44, 208, 14); trazoJN(ctx, '#2E7D32', 5);
  },
  mariposa(ctx, t) {
    ctx.save(); ctx.scale(0.55 + 0.45 * Math.abs(Math.sin(t / 130)), 1);
    [[-1, -1], [1, -1]].forEach(([l]) => { elipseJN(ctx, l * 58, -28, 56, 44, l * 0.4); trazoJN(ctx, '#8E5BD6'); elipseJN(ctx, l * 52, 40, 40, 30, -l * 0.4); trazoJN(ctx, '#FF9F2E'); circuloCp(ctx, l * 60, -30, 12, '#FFE066'); });
    ctx.restore();
    elipseJN(ctx, 0, 6, 12, 58); trazoJN(ctx, BJ, 3);
    ctx.strokeStyle = BJ; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-4, -48); ctx.quadraticCurveTo(-20, -80, -30, -86); ctx.moveTo(4, -48); ctx.quadraticCurveTo(20, -80, 30, -86); ctx.stroke();
  },
};

/* Icono de un animal (panel de instrucciones y anuncio). */
function IconoAnimalJN({ id, tam }) {
  const ref = React.useRef(null);
  tam = tam || 64;
  React.useEffect(() => {
    const c = ref.current;
    if (!c) return undefined;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = tam * dpr; c.height = tam * dpr;
    const ctx = c.getContext('2d');
    let raf = 0, vivo = true;
    const pintar = (t) => {
      if (!vivo) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, c.width, c.height);
      const k = (tam * dpr) / 300;
      ctx.setTransform(k, 0, 0, k, (tam * dpr) / 2, (tam * dpr) / 2);
      (DIBUJOS_JN[id] || DIBUJOS_JN.ave)(ctx, t || 0);
      raf = requestAnimationFrame(pintar);
    };
    raf = requestAnimationFrame(pintar);
    return () => { vivo = false; cancelAnimationFrame(raf); };
  }, [id, tam]);
  return <canvas ref={ref} style={{ width: tam, height: tam }} aria-hidden="true" />;
}

/* ========================= ESCENA Y CARRILES ========================= */
function escenaJN(ctx, luz, mundo, ritmo) {
  const { W, H, V } = JN;
  const cielo = ctx.createLinearGradient(0, 0, 0, V.y + 40);
  cielo.addColorStop(0, luz ? '#E4F5DA' : '#9FD39A'); cielo.addColorStop(1, luz ? '#FFF8E0' : '#F2E7A8');
  ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, V.y + 40);
  // selva lejana (copas en capas)
  [[V.y - 10, luz ? '#9CC98A' : '#5E9B57', 70], [V.y + 14, luz ? '#7DB46C' : '#3E7339', 55]].forEach(([y, c, r]) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, y + 60);
    for (let x = 0; x <= W + r; x += r) ctx.arc(x, y + Math.sin(x * 0.7) * 10, r * 0.8, Math.PI, 0);
    ctx.lineTo(W, y + 60); ctx.closePath(); ctx.fill();
  });
  // suelo de la selva
  ctx.fillStyle = luz ? '#6FAE5E' : '#356B2E'; ctx.fillRect(0, V.y + 30, W, H - V.y - 30);
  // carriles: claramente distintos (centro más claro) y bordes crema gruesos
  const sTop = 0.05, sBajo = (H - V.y) / (JN.LLEGADA - V.y) + 0.02;
  const colores = luz ? ['#E2B97A', '#F3D79A', '#E2B97A'] : ['#C48A4A', '#E0B46A', '#C48A4A'];
  for (let i = 0; i < 3; i++) {
    const a = proyectarJN(JN.BORDES[i], sTop), b = proyectarJN(JN.BORDES[i + 1], sTop);
    const c = proyectarJN(JN.BORDES[i + 1], sBajo), d = proyectarJN(JN.BORDES[i], sBajo);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath();
    ctx.fillStyle = colores[i]; ctx.fill();
  }
  // franjas que se acercan (sensación de avance)
  ctx.fillStyle = 'rgba(80,45,15,.16)';
  for (let k = 0; k < 8; k++) {
    const p = ((k / 8) + mundo / (ritmo || 3000)) % 1;
    const s1 = escalaJN(p), s2 = escalaJN(Math.min(1.04, p + 0.035));
    const a = proyectarJN(JN.BORDES[0], s1), b = proyectarJN(JN.BORDES[3], s1), c = proyectarJN(JN.BORDES[3], s2), d = proyectarJN(JN.BORDES[0], s2);
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.closePath(); ctx.fill();
  }
  // bordes de los carriles (cuña crema con contorno)
  JN.BORDES.forEach((bx) => {
    const p1 = proyectarJN(bx, sTop), p2 = proyectarJN(bx, sBajo);
    const w1 = 2, w2 = 18;
    ctx.beginPath(); ctx.moveTo(p1.x - w1, p1.y); ctx.lineTo(p1.x + w1, p1.y); ctx.lineTo(p2.x + w2, p2.y); ctx.lineTo(p2.x - w2, p2.y); ctx.closePath();
    ctx.fillStyle = '#FFF4D6'; ctx.fill(); ctx.strokeStyle = 'rgba(31,20,8,.55)'; ctx.lineWidth = 3; ctx.stroke();
  });
  // línea de llegada
  const l1 = proyectarJN(JN.BORDES[0], 1), l2 = proyectarJN(JN.BORDES[3], 1);
  ctx.strokeStyle = 'rgba(255,248,231,.55)'; ctx.lineWidth = 6; ctx.setLineDash([26, 18]);
  ctx.beginPath(); ctx.moveTo(l1.x, l1.y); ctx.lineTo(l2.x, l2.y); ctx.stroke(); ctx.setLineDash([]);
  // árboles grandes y lianas a los lados
  [[60, 1.2], [1540, 1.25], [170, 0.8], [1430, 0.85]].forEach(([x, k]) => {
    ctx.fillStyle = '#5A3A1C'; ctx.fillRect(x - 26 * k, 160, 52 * k, H - 160);
    ctx.strokeStyle = BJ; ctx.lineWidth = 4; ctx.strokeRect(x - 26 * k, 160, 52 * k, H - 160);
    [[-60, 120, 110], [50, 90, 100], [0, 40, 120]].forEach(([dx, y, r]) => circuloCp(ctx, x + dx * k, y, r * k, luz ? '#4E9A45' : '#2E6B2A', BJ, 4));
  });
  ctx.strokeStyle = '#3E7339'; ctx.lineWidth = 8;
  [[300, 190], [520, 120], [1100, 150], [1300, 210]].forEach(([x, largo]) => {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.quadraticCurveTo(x + 30, largo / 2, x - 10, largo); ctx.stroke();
    circuloCp(ctx, x - 10, largo, 12, '#58B947', BJ, 3);
  });
  // flechas grandes al pie de cada carril (izquierda · centro · derecha)
  const yF = 868;
  [[400, -1], [800, 0], [1200, 1]].forEach(([x, d]) => {
    ctx.save(); ctx.translate(x, yF);
    ctx.fillStyle = 'rgba(255,248,231,.92)'; ctx.strokeStyle = BJ; ctx.lineWidth = 5;
    ctx.beginPath();
    if (d === 0) ctx.arc(0, 0, 20, 0, Math.PI * 2);
    else { ctx.moveTo(28 * d, 0); ctx.lineTo(-10 * d, -22); ctx.lineTo(-10 * d, 22); ctx.closePath(); }   // punta hacia su lado
    ctx.fill(); ctx.stroke(); ctx.restore();
  });
}

/* Obstáculos: base (contacto con el suelo) en (0,0). */
const OBSTACULOS_JN = {
  roca(ctx) {
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-160, -120, -60, -165); ctx.quadraticCurveTo(40, -190, 120, -120);
    ctx.quadraticCurveTo(170, -60, 150, 0); ctx.closePath(); trazoJN(ctx, '#8D8D8D', 9);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; elipseJN(ctx, -50, -120, 40, 20, -0.4); ctx.fill();
    ctx.strokeStyle = BJ; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(30, -150); ctx.lineTo(10, -100); ctx.lineTo(40, -60); ctx.stroke();
  },
  espinas(ctx) {
    ctx.fillStyle = '#5A3A1C';
    for (let k = 0; k < 16; k++) {
      const a = Math.PI + (k / 15) * Math.PI, x = Math.cos(a) * 165, y = -90 + Math.sin(a) * 110;
      ctx.beginPath(); ctx.moveTo(x * 0.9 - 8, y * 0.9); ctx.lineTo(x * 1.12, y * 1.08 - 6); ctx.lineTo(x * 0.9 + 8, y * 0.9); ctx.closePath(); ctx.fill();
    }
    [[-80, -70, 72], [80, -70, 72], [0, -115, 88]].forEach(([x, y, r]) => circuloCp(ctx, x, y, r, '#3E8E41', BJ, 8));
    [[-60, -90], [40, -130], [90, -60], [-10, -60]].forEach(([x, y]) => circuloCp(ctx, x, y, 11, '#E53935', BJ, 3));
  },
  tronco(ctx, ancho) {
    const w = ancho || 330;
    rrCp(ctx, -w / 2, -125, w, 115, 50); trazoJN(ctx, '#8B5A2B', 9);
    ctx.strokeStyle = 'rgba(31,20,8,.45)'; ctx.lineWidth = 5;
    for (let x = -w / 2 + 50; x < w / 2 - 60; x += 70) { ctx.beginPath(); ctx.moveTo(x, -100); ctx.lineTo(x + 40, -100); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x + 20, -45); ctx.lineTo(x + 55, -45); ctx.stroke(); }
    elipseJN(ctx, w / 2 - 22, -67, 34, 56); trazoJN(ctx, '#D9A066', 7);
    elipseJN(ctx, w / 2 - 22, -67, 16, 28); ctx.strokeStyle = '#8B5A2B'; ctx.lineWidth = 4; ctx.stroke();
  },
};

/* ======================== GENERADOR DE OBJETOS ========================
   obstáculo: { tipo: 'obs', carriles: [i] o [i, j], formas: { carril: forma }, largo }
   animal:    { tipo: 'animal', id, accion } (ocupa los tres carriles) */
function generarObjetoJN(G, dur) {
  const n = G.instr.length;
  const lejosDelAnimal = G.mundo - G.ultimoAnimal > dur * (JN.VENTANA + 0.08);
  let animal = null;
  if (G.forzar && lejosDelAnimal) { animal = G.forzar; G.forzar = null; }
  else if (n && lejosDelAnimal && Math.random() < Math.min(0.45, 0.24 + n * 0.035)) {
    const opciones = G.instr.filter((id) => id !== G.ultimoId);
    animal = (opciones.length ? opciones : G.instr)[Math.floor(Math.random() * (opciones.length || G.instr.length))];
  }
  if (animal) {
    G.ultimoAnimal = G.mundo; G.ultimoId = animal;
    return { tipo: 'animal', id: animal, accion: instrJN(animal).accion };
  }
  // Obstáculo: 1 o 2 carriles (más seguido a dos con el avance); nunca los tres.
  const dos = Math.random() < Math.min(0.5, 0.12 + G.puntos * 0.012);
  const libre = Math.floor(Math.random() * 3);
  let carriles = dos ? [0, 1, 2].filter((c) => c !== libre) : [[0, 1, 2].filter((c) => c !== G.ultimoLibre)[Math.floor(Math.random() * 2)]];
  carriles = carriles.sort();
  G.ultimoLibre = dos ? libre : -1;
  const formas = {}, lista = ['roca', 'espinas', 'tronco'];
  carriles.forEach((c) => { formas[c] = lista[Math.floor(Math.random() * lista.length)]; });
  const largo = dos && carriles[1] - carriles[0] === 1 && Math.random() < 0.5;   // tronco caído sobre dos carriles
  return { tipo: 'obs', carriles, formas, largo };
}
function dibujarObjetoJN(ctx, o, p, t, resaltado) {
  const s = escalaJN(p);
  ctx.save();
  ctx.globalAlpha = Math.min(1, p * 5) * (p > 1 ? Math.max(0, 1 - (p - 1) * 9) : 1);
  const dibujar = (xAbajo, fn) => {
    const P = proyectarJN(xAbajo, s);
    ctx.save(); ctx.translate(P.x, P.y); ctx.scale(s, s);
    if (resaltado) { ctx.shadowColor = '#FF3B30'; ctx.shadowBlur = 40; }
    fn(); ctx.restore();
  };
  if (o.tipo === 'animal') {
    const d = DIBUJOS_JN[o.id], alto = o.id === 'ave' || o.id === 'loro' || o.id === 'mariposa' || o.id === 'tucan' ? -170 : -105;
    JN.CARRILES.forEach((x) => dibujar(x, () => { ctx.translate(0, alto); ctx.scale(0.95, 0.95); d(ctx, t); }));
  } else if (o.largo) {
    dibujar((JN.CARRILES[o.carriles[0]] + JN.CARRILES[o.carriles[1]]) / 2, () => OBSTACULOS_JN.tronco(ctx, 720));
  } else {
    o.carriles.forEach((c) => dibujar(JN.CARRILES[c], () => OBSTACULOS_JN[o.formas[c]](ctx)));
  }
  ctx.restore();
}

/* Personaje del modo teclado (el del Muro Infernal, visto de espaldas). */
function poseAccionJN(accion, u, reloj) {
  const N = { ...NEUTRA_MURO };
  const corre = Math.sin(reloj / 110);
  const base = { ...N, pi1: Math.max(0, 18 * corre), pd1: Math.max(0, -18 * corre), bi1: 12 + 10 * Math.max(0, -corre), bd1: 12 + 10 * Math.max(0, corre) };
  if (!accion) return { pose: base, dy: Math.abs(corre) * -6, sx: 1, sy: 1 };
  const ola = Math.sin(u * Math.PI);
  switch (accion) {
    case 'saltar': return { pose: { ...N, pi1: 30, pi2: -60, pd1: 30, pd2: -60, bi1: 150, bd1: 150 }, dy: -200 * ola, sx: 1, sy: 1 };
    case 'agachar': return { pose: { ...N, pi1: 60, pi2: -120, pd1: 60, pd2: -120, bi1: 30, bd1: 30 }, dy: 0, sx: 1, sy: 0.72 };
    case 'aplaudir': { const c = 50 + 40 * Math.abs(Math.sin(u * 3 * Math.PI)); return { pose: { ...N, bi1: 60, bi2: c, bd1: 60, bd2: c }, dy: 0, sx: 1, sy: 1 }; }
    case 'girar': return { pose: N, dy: 0, sx: Math.cos(u * 2 * Math.PI), sy: 1 };
    case 'cabeza': return { pose: { ...N, bi1: 150, bi2: 120, bd1: 150, bd2: 120 }, dy: 0, sx: 1, sy: 1 };
    case 'brazos': return { pose: { ...N, bi1: 180, bd1: 180 }, dy: 0, sx: 1, sy: 1 };
    case 'estirar': return { pose: { ...N, bi1: 170, bd1: 170 }, dy: -24 * ola, sx: 1, sy: 1.04 };
    case 'pies': return { pose: { ...N, pi1: 45, pi2: -90, pd1: 45, pd2: -90, bi1: 15, bd1: 15 }, dy: 0, sx: 1, sy: 0.8 };
    case 'aletear': { const a = 90 + 45 * Math.sin(u * 4 * Math.PI); return { pose: { ...N, bi1: a, bd1: a }, dy: -10 * ola, sx: 1, sy: 1 }; }
    default: return { pose: N, dy: 0, sx: 1, sy: 1 };   // quieto
  }
}
function dibujarJugadorJN(ctx, G, pj) {
  const A = G.accionAnim;
  const u = A ? Math.min(1, (G.reloj - A.t0) / JN.ACCION_MS) : 0;
  const { pose, dy, sx, sy } = poseAccionJN(A && u < 1 ? A.accion : null, u, G.reloj);
  ctx.save();
  // sombra
  ctx.fillStyle = 'rgba(31,20,8,.28)'; elipseJN(ctx, G.xPj, 872, 90, 18); ctx.fill();
  ctx.translate(G.xPj, 870 + dy); ctx.scale(0.62 * sx, 0.62 * sy); ctx.translate(-800, -796);
  dibujarPersonajeMI(ctx, pose, pj, { espalda: true });
  ctx.restore();
}

/* =============================== AUDIO =============================== */
const SONIDO_JN = {
  avance: () => audioCapibara.tono(880, 0.07, 'triangle', 0.05),
  accion: () => audioCapibara.tono(520, 0.06, 'square', 0.035),
  nuevo: () => [523, 659, 784, 988, 1175].forEach((f, i) => audioCapibara.tono(f, 0.22, 'triangle', 0.16, i * 0.08)),
  choque: () => { audioCapibara.tono(160, 0.45, 'sawtooth', 0.25, 0, 40); audioCapibara.ruido(0.45, 0.42, 800); },
  fin: () => [392, 523, 659, 784, 1047].forEach((f, i) => audioCapibara.tono(f, 0.3, 'triangle', 0.16, i * 0.12)),
};

/* ============================ ESCALADA ============================
   Cada `racha` objetos superados seguidos se desbloquea el siguiente animal
   del banco: pausa breve con el anuncio y el primer objeto que llega después
   es ese animal (para practicarlo). Las demás se siguen mezclando. */
function escalarJN(G, racha) {
  if (G.racha < racha || G.instr.length >= BANCO_JN.length) return null;
  const nuevo = BANCO_JN[G.instr.length];
  G.instr = [...G.instr, nuevo.id]; G.racha = 0; G.forzar = nuevo.id;
  return nuevo;
}

/* ================ MODO VIDEO BEAM / MODO TECLADO (componente) ================ */
let recordSesionJN = 0;   // récord de esta sesión (en Vigía no se guardan puntos)
const FASES_JUEGO_JN = ['turno', 'corre', 'anuncio', 'fallo', 'resultado'];

function nuevoJuegoJN(n) {
  return {
    fase: 'menu', reloj: 0, inicio: 0, mundo: 0, objs: [], proximo: 0, puntos: 0, racha: 0, instr: [], forzar: null,
    ultimoAnimal: -1e9, ultimoId: null, ultimoLibre: -1, carril: 1, xPj: 800, eventos: [], accionAnim: null,
    chocado: null, nuevo: null, turno: 0, ronda: 1, pasa: null, ultimo: null, mejor: 0, totalPasos: 0, carreras: 0,
    eq: Array.from({ length: n }, () => ({ puntos: 0, pasos: 0, turnos: 0 })),
  };
}

function JunglaCapibara({ a, estudiantes, onContinuar }) {
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

  const modo = a.modoJungla === 'individual' ? 'individual' : 'beam';
  const racha = Math.max(3, Math.min(30, a.rachaJungla || 8));
  const rondas = Math.max(1, Math.min(6, a.rondasJungla || 2));
  const porPaso = Math.max(3, Math.min(50, a.objetosPorPaso || 10));
  const [velocidad, setVelocidad] = React.useState(() => (['lenta', 'media', 'rapida'].includes(a.velocidadJungla) ? a.velocidadJungla : 'lenta'));
  const [personaje, setPersonaje] = React.useState(0);
  const [equipoInd, setEquipoInd] = React.useState(0);
  const [fase, setFase] = React.useState('menu');
  const [pausado, setPausado] = React.useState(false);
  const [silencio, setSilencio] = React.useState(() => audioCapibara.silencio());
  const [ver, setVer] = React.useState(0);
  const refrescar = () => setVer((v) => v + 1);
  const g = React.useRef(null);
  if (!g.current) g.current = nuevoJuegoJN(eqV.length);
  const cfg = React.useRef({});
  cfg.current = { modo, racha, rondas, porPaso, velocidad, personaje, equipoInd, pausado, nEq: eqV.length };
  const G = g.current;
  const seguir = React.useRef(onContinuar);
  seguir.current = onContinuar;
  const { raiz, lienzo, tam } = useLienzoCp(JN.W, JN.H);

  // ---- Reglas ----
  const irA = (f) => { const X = g.current; X.fase = f; X.inicio = X.reloj; setFase(f); };
  const durActual = () => {
    const C = cfg.current, base = JN.DUR[C.modo][C.velocidad] || JN.DUR[C.modo].media;
    return Math.max(base * 0.5, base / (1 + g.current.puntos * 0.015));
  };
  const nuevaCarrera = () => {
    const X = g.current;
    Object.assign(X, { objs: [], puntos: 0, racha: 0, instr: [], forzar: null, ultimoAnimal: -1e9, ultimoId: null, ultimoLibre: -1,
      carril: 1, xPj: 800, eventos: [], accionAnim: null, chocado: null, nuevo: null, proximo: X.mundo + JN.INICIO_MS });
  };
  const empezar = () => {
    const C = cfg.current;
    audioCapibara.despertar(); SONIDO_JN.accion();
    const X = nuevoJuegoJN(C.nEq);
    X.reloj = g.current.reloj;
    g.current = X;
    nuevaCarrera();
    if (C.modo === 'individual') irA('corre');
    else { X.turno = 0; X.ronda = 1; X.pasa = siguienteConcursanteCp(0); irA('turno'); }
    refrescar();
  };
  // Registrar la carrera para el equipo (sistema existente: pasos hacia Jomu).
  const registrar = () => {
    const X = g.current, C = cfg.current;
    const quien = C.modo === 'individual' ? C.equipoInd : X.turno;
    const pasos = Math.floor(X.puntos / C.porPaso);
    for (let k = 0; k < pasos; k++) jaguarPunto(quien, 1);
    if (C.modo === 'individual') {
      X.mejor = Math.max(X.mejor, X.puntos); X.totalPasos += pasos; X.carreras += 1;
      recordSesionJN = Math.max(recordSesionJN, X.puntos);
    } else {
      X.eq[quien].puntos += X.puntos; X.eq[quien].pasos += pasos; X.eq[quien].turnos += 1;
    }
    X.ultimo = { nombre: X.pasa, puntos: X.puntos, pasos, quien };
  };
  const chocar = (o) => {
    const X = g.current;
    X.chocado = o || null; SONIDO_JN.choque(); irA('fallo'); refrescar();
  };
  // FALLÓ (video beam): congela sobre el objeto más cercano a la llegada.
  const fallo = () => {
    const X = g.current;
    if (cfg.current.modo !== 'beam' || !(X.fase === 'corre' || X.fase === 'anuncio')) return;
    let cerca = null, mejor = -1;
    X.objs.forEach((o) => { const p = (X.mundo - o.t0) / o.dur; if (p <= 1.1 && p > mejor) { mejor = p; cerca = o; } });
    chocar(cerca);
  };
  const deshacer = () => {
    const X = g.current;
    if (cfg.current.modo !== 'beam' || X.fase !== 'fallo' || X.reloj - X.inicio > JN.DESHACER_MS) return;
    X.chocado = null; irA('corre'); refrescar();
  };
  const cerrarFallo = () => { const X = g.current; if (X.fase !== 'fallo') return; registrar(); irA('resultado'); refrescar(); };
  const fin = () => { SONIDO_JN.fin(); irA('fin'); refrescar(); };
  const siguiente = () => {
    const X = g.current, C = cfg.current;
    if (C.modo === 'individual') { nuevaCarrera(); irA('corre'); refrescar(); return; }
    const t = siguienteTurnoCp(X.turno, X.ronda, X.eq.length, C.rondas);
    if (!t) { fin(); return; }
    X.turno = t.turno; X.ronda = t.ronda; X.pasa = siguienteConcursanteCp(t.turno);
    nuevaCarrera(); irA('turno'); refrescar();
  };
  const listo = () => { const X = g.current; if (X.fase === 'turno') { nuevaCarrera(); irA('corre'); } };
  const reiniciar = () => {
    const X = g.current;
    if (!FASES_JUEGO_JN.includes(X.fase) || X.fase === 'resultado') return;
    nuevaCarrera(); irA(cfg.current.modo === 'beam' ? 'turno' : 'corre'); refrescar();
  };
  const saltar = () => {
    const X = g.current;
    if (cfg.current.modo !== 'beam' || !['turno', 'corre', 'anuncio', 'fallo'].includes(X.fase)) return;
    siguiente();
  };
  const terminar = () => {
    if (!FASES_JUEGO_JN.includes(g.current.fase)) return;
    setPausado(false); cfg.current.pausado = false; fin();
  };
  const alternarPausa = () => {
    if (!['corre', 'anuncio', 'turno'].includes(g.current.fase)) return;
    setPausado((p) => { cfg.current.pausado = !p; return !p; });
  };
  const alternarSilencio = () => setSilencio(audioCapibara.setSilencio(!audioCapibara.silencio()));
  const verMontana = () => { if (g.current.fase === 'fin') irA('montana'); };
  const otraVez = () => { if (g.current.fase === 'fin') { irA('menu'); refrescar(); } };
  const pantallaCompleta = () => {
    try { if (!document.fullscreenElement && document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); } catch (e) { /* */ }
  };
  // Acciones del modo teclado (carril o acción): se anotan con el tiempo del mundo.
  const accionar = (accion) => {
    const X = g.current;
    if (cfg.current.modo !== 'individual' || X.fase !== 'corre' || cfg.current.pausado) return;
    if (accion === 'izq' || accion === 'der') {
      X.carril = Math.max(0, Math.min(2, X.carril + (accion === 'izq' ? -1 : 1)));
      X.eventos.push({ t: X.mundo, accion: 'mover' });
      return;
    }
    X.eventos.push({ t: X.mundo, accion });
    if (accion !== 'quieto') X.accionAnim = { accion, t0: X.reloj };
    SONIDO_JN.accion();
  };
  // ¿Superó el objeto? (solo en modo teclado; en video beam decide el docente)
  const evaluar = (o) => {
    const X = g.current;
    if (o.tipo === 'obs') return !o.carriles.includes(X.carril);
    const ini = o.t0 + o.dur * (1 - JN.VENTANA), finT = o.t0 + o.dur;
    const ev = X.eventos.filter((e) => e.t >= ini && e.t <= finT && !e.usado);
    if (o.accion === 'quieto') return ev.every((e) => e.accion === 'quieto');
    const buenas = ev.filter((e) => e.accion === o.accion);
    const malas = ev.filter((e) => e.accion !== o.accion && e.accion !== 'mover');
    if (buenas.length && !malas.length) { buenas.forEach((e) => { e.usado = true; }); return true; }
    return false;
  };

  // ---- Bucle ----
  React.useEffect(() => {
    let raf = 0, vivo = true, antes = performance.now();
    const cuadro = (ahora) => {
      if (!vivo) return;
      const dt = Math.min(60, ahora - antes); antes = ahora;
      const X = g.current, C = cfg.current;
      if (!C.pausado) {
        X.reloj += dt;
        const e = X.reloj - X.inicio;
        if (X.fase === 'corre') {
          X.mundo += dt;
          // aparecen objetos
          if (X.mundo >= X.proximo) {
            const dur = durActual();
            const o = generarObjetoJN(X, dur);
            o.t0 = X.mundo; o.dur = dur; X.objs.push(o);
            const gapBase = dur * (C.modo === 'beam' ? 0.55 : 0.42) / (1 + X.puntos * 0.012 + X.instr.length * 0.06);
            X.proximo = X.mundo + Math.max(JN.GAP_MIN[C.modo], gapBase);
          }
          // llegan
          for (const o of X.objs) {
            if (o.listo || (X.mundo - o.t0) / o.dur < 1) continue;
            o.listo = true;
            if (C.modo === 'individual' && !evaluar(o)) { chocar(o); break; }
            X.puntos += 1; X.racha += 1; SONIDO_JN.avance();
            const nuevo = escalarJN(X, C.racha);
            if (nuevo) { X.nuevo = nuevo; SONIDO_JN.nuevo(); irA('anuncio'); }
            refrescar();
          }
          X.objs = X.objs.filter((o) => (X.mundo - o.t0) / o.dur < 1.12);
          X.eventos = X.eventos.filter((ev) => X.mundo - ev.t < 6000);
        } else if (X.fase === 'anuncio' && e >= JN.ANUNCIO_MS) irA('corre');
        else if (X.fase === 'fallo') {
          if (C.modo === 'individual' && e >= JN.CHOQUE_MS) cerrarFallo();
          else if (C.modo === 'beam' && e >= JN.DESHACER_MS) cerrarFallo();
        }
      }
      // carril del personaje (suave)
      X.xPj += (JN.CARRILES[X.carril] - X.xPj) * Math.min(1, dt / 70);
      const c = lienzo.current;
      if (c) {
        const ctx = c.getContext('2d'), k = c.width / JN.W;
        ctx.setTransform(k, 0, 0, k, 0, 0);
        const luz = document.documentElement.getAttribute('data-vg-tono') === 'luz';
        const e = X.reloj - X.inicio;
        if (X.fase === 'fallo' && e < 450) ctx.translate(Math.sin(e / 20) * 16 * (1 - e / 450), 0);   // temblor
        escenaJN(ctx, luz, X.mundo, durActual() / 1.3);
        const enCarrera = ['corre', 'anuncio', 'fallo', 'resultado'].includes(X.fase);
        const lista = enCarrera ? X.objs.map((o) => ({ o, p: (X.mundo - o.t0) / o.dur })).sort((u, v) => u.p - v.p) : [];
        const conPj = C.modo === 'individual' && X.fase !== 'menu';
        lista.filter((x) => x.p < 1).forEach((x) => dibujarObjetoJN(ctx, x.o, x.p, X.reloj, X.chocado === x.o));
        if (conPj) dibujarJugadorJN(ctx, X, PERSONAJES_MURO[C.personaje] || PERSONAJES_MURO[0]);
        lista.filter((x) => x.p >= 1).forEach((x) => dibujarObjetoJN(ctx, x.o, x.p, X.reloj, X.chocado === x.o));
        if (X.fase === 'fallo') { ctx.fillStyle = 'rgba(229,57,53,' + Math.max(0, 0.38 - e / 1600).toFixed(3) + ')'; ctx.fillRect(-40, 0, JN.W + 80, JN.H); }
      }
      raf = requestAnimationFrame(cuadro);
    };
    raf = requestAnimationFrame(cuadro);
    return () => { vivo = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Teclado (mismos atajos que el Muro Infernal: Espacio = acción principal, P, R, N, M, F) ----
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target && /input|textarea|select/i.test(e.target.tagName)) return;
      const X = g.current, C = cfg.current, k = e.key, l = k.length === 1 ? k.toLowerCase() : k;
      const tomar = () => { e.preventDefault(); e.stopPropagation(); };
      // Modo teclado: carriles y acciones
      if (C.modo === 'individual' && X.fase === 'corre') {
        if (k === 'ArrowLeft') { tomar(); accionar('izq'); return; }
        if (k === 'ArrowRight') { tomar(); accionar('der'); return; }
        const ins = BANCO_JN.find((x) => x.key === k || x.key === l);
        if (ins) { tomar(); accionar(ins.accion); return; }
      }
      const principal = k === ' ' || k === 'Enter' || k === 'PageDown';
      if (principal) {
        if (e.target && /button/i.test(e.target.tagName) && k !== 'PageDown') return;
        tomar();
        if (X.fase === 'menu') empezar();
        else if (X.fase === 'turno') listo();
        else if (X.fase === 'corre' || X.fase === 'anuncio') { if (C.modo === 'beam') fallo(); }
        else if (X.fase === 'resultado') siguiente();
        else if (X.fase === 'fin') verMontana();
        else if (X.fase === 'montana') seguir.current();
        return;
      }
      if (k === 'PageUp' || k === 'Backspace' || l === 'd') { if (X.fase === 'fallo') { tomar(); deshacer(); } return; }
      if (l === 'p') { tomar(); alternarPausa(); }
      else if (l === 'r') { tomar(); reiniciar(); }
      else if (l === 'n') { tomar(); saltar(); }
      else if (l === 'm') { tomar(); alternarSilencio(); }
      else if (l === 'f') { tomar(); pantallaCompleta(); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Mando: estado y órdenes ----
  const restoDeshacer = fase === 'fallo' && modo === 'beam' ? Math.max(0, Math.ceil((JN.DESHACER_MS - (G.reloj - G.inicio)) / 1000)) : 0;
  const [, setTic] = React.useState(0);
  React.useEffect(() => {   // cuenta regresiva de «Deshacer» (pantalla y celular)
    if (fase !== 'fallo' || modo !== 'beam') return undefined;
    const t = setInterval(() => setTic((x) => x + 1), 250);
    return () => clearInterval(t);
  }, [fase, modo]);
  React.useEffect(() => {
    fijarEstadoCapibara({
      juego: 'jungla', fase, modo, pausado, silencio, velocidad, rondas, ronda: G.ronda, turno: G.turno, pasa: G.pasa,
      puntos: G.puntos, deshacer: restoDeshacer, personaje, equipoInd,
      personajes: modo === 'individual' ? PERSONAJES_MURO.map((p) => p.nombre) : [],
      instrucciones: G.instr.map((id) => { const x = instrJN(id); return x.animal + ' → ' + x.verbo; }),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, pausado, silencio, velocidad, personaje, equipoInd, ver, restoDeshacer]);
  React.useEffect(() => () => fijarEstadoCapibara(null), []);
  useOrdenMando((o) => {
    const X = g.current, x = o.accion;
    if (x === 'jn-empezar') { if (X.fase === 'menu') empezar(); }
    else if (x === 'jn-personaje') { if (X.fase === 'menu') setPersonaje(Math.max(0, Math.min(PERSONAJES_MURO.length - 1, o.i || 0))); }
    else if (x === 'jn-equipo') { if (X.fase === 'menu') setEquipoInd(Math.max(0, Math.min(eqV.length - 1, o.i || 0))); }
    else if (x === 'jn-velocidad') { if (X.fase === 'menu' && ['lenta', 'media', 'rapida'].includes(o.v)) setVelocidad(o.v); }
    else if (x === 'jn-listo') listo();
    else if (x === 'jn-fallo') fallo();
    else if (x === 'jn-deshacer') deshacer();
    else if (x === 'jn-siguiente') { if (X.fase === 'fallo') cerrarFallo(); else if (X.fase === 'resultado') siguiente(); }
    else if (x === 'jn-pausa') alternarPausa();
    else if (x === 'jn-reiniciar') reiniciar();
    else if (x === 'jn-saltar') saltar();
    else if (x === 'jn-terminar') terminar();
    else if (x === 'jn-silencio') alternarSilencio();
    else if (x === 'jn-montana') verMontana();
    else if (x === 'jn-otra') otraVez();
    else if (x === 'jn-continuar') { if (X.fase === 'montana') onContinuar(); }
    else if (x === 'continuar' || x === 'reto-terminar') {
      if (X.fase === 'menu') empezar(); else if (X.fase === 'turno') listo(); else if (X.fase === 'resultado') siguiente();
      else if (X.fase === 'fin') verMontana(); else if (X.fase === 'montana') onContinuar();
    }
  });

  /* ================================ HUD ================================ */
  if (fase === 'montana') return <MontanaFinalCp equipos={sesion.equipos || equipos} meta={sesion.meta} onContinuar={onContinuar} titulo="Movimiento de la Jungla" />;
  const enCarrera = fase === 'corre' || fase === 'anuncio';
  const eqTurno = eqV[G.turno] || eqV[0];
  const eqInd = eqV[equipoInd] || eqV[0];
  const eqDe = modo === 'beam' ? eqTurno : eqInd;
  const tabla = eqV.map((e, i) => ({ ...e, i, ...G.eq[i] })).sort((x, y) => y.puntos - x.puntos);
  const ganadorI = modo === 'individual' ? (G.totalPasos > 0 || G.mejor > 0 ? equipoInd : null) : (tabla[0] && tabla[0].puntos > 0 ? tabla[0].i : null);
  const empate = modo === 'beam' && tabla.length > 1 && tabla[0].puntos > 0 && tabla[0].puntos === tabla[1].puntos;
  const pasosTxt = (n) => n + (n === 1 ? ' paso' : ' pasos');

  return (
    <div className="vg-cp vg-mi vg-jn" ref={raiz} role="dialog" aria-label="Movimiento de la Jungla">
      <div className="vg-mi-escenario" style={{ width: tam.w, height: tam.h, '--u': tam.u }}>
        <canvas ref={lienzo} className="vg-mi-lienzo" />

        {/* Marcador: equipos (video beam) o carrera (teclado) */}
        {FASES_JUEGO_JN.includes(fase) && (modo === 'beam' ? (
          <div className="vg-mi-marcador">
            {eqV.map((e, i) => (
              <div key={i} className={'vg-mi-eq' + (i === G.turno ? ' turno' : '')} style={{ '--c': e.color }}>
                <span className="emo">{e.emoji}</span><b>{G.eq[i].puntos}</b>
              </div>
            ))}
            <div className="vg-mi-ronda">Ronda {G.ronda}/{rondas}</div>
          </div>
        ) : (
          <div className="vg-mi-hud">
            <span className="emo">{eqInd.emoji}</span>
            <b>⭐ {G.puntos}</b>
            <span>🏆 {Math.max(recordSesionJN, G.puntos)}</span>
          </div>
        ))}
        {/* Objetos superados en esta carrera: grande */}
        {(enCarrera || fase === 'fallo') && <div className="vg-jn-cuenta" style={{ '--c': eqDe.color }}><span>{eqDe.emoji}</span>{G.puntos}</div>}

        {/* Instrucciones activas (panel lateral discreto) */}
        {(enCarrera || fase === 'fallo') && G.instr.length > 0 && (
          <div className="vg-jn-panel" aria-label="Instrucciones activas">
            {G.instr.map((id) => { const x = instrJN(id); return (
              <div key={id} className="vg-jn-instr">
                <IconoAnimalJN id={id} tam={Math.round(46 * tam.u + 14)} />
                <span>{x.verbo}{modo === 'individual' ? <kbd>{x.tecla}</kbd> : null}</span>
              </div>
            ); })}
          </div>
        )}

        {/* Botones (también en el celular) */}
        {FASES_JUEGO_JN.includes(fase) && fase !== 'resultado' && (
          <div className="vg-mi-botones">
            <button type="button" onClick={alternarSilencio} title="Silenciar (M)">{silencio ? '🔇' : '🔊'}</button>
            {fase !== 'fallo' && <button type="button" onClick={alternarPausa} title="Pausa (P)">⏸</button>}
            {modo === 'beam' && enCarrera && <button type="button" className="falla" onClick={fallo} title="Falló (Espacio o Av Pág)">💥 FALLÓ</button>}
            {modo === 'beam' && fase === 'fallo' && restoDeshacer > 0 && (
              <button type="button" className="listo" onClick={deshacer} title="Deshacer (Re Pág o D)">↩ Deshacer ({restoDeshacer})</button>
            )}
          </div>
        )}
        {fase === 'corre' && modo === 'individual' && (
          <div className="vg-mi-ayuda">← → carril · ↑ saltar · ↓ agacharse{G.instr.length > 2 ? ' · letras del panel' : ''}</div>
        )}

        {/* Nueva instrucción */}
        {fase === 'anuncio' && G.nuevo && (
          <div className="vg-mi-capa">
            <div className="vg-jn-anuncio">
              <IconoAnimalJN id={G.nuevo.id} tam={Math.round(260 * tam.u)} />
              <h2>¡Si ves {G.nuevo.art} <b>{G.nuevo.animal}</b>,<br /><b>{G.nuevo.verbo}</b>!</h2>
              {modo === 'individual' && <p>Tecla <kbd>{G.nuevo.tecla}</kbd></p>}
            </div>
          </div>
        )}

        {/* Choque */}
        {fase === 'fallo' && (
          <div className="vg-mi-aviso grande fallo vg-jn-pum">¡PUM! <small>{pasosTxt(Math.floor(G.puntos / porPaso))} · {G.puntos} objetos</small></div>
        )}

        {/* Turno (video beam) */}
        {fase === 'turno' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta turno" style={{ '--c': eqTurno.color }}>
              <div className="vg-mi-emo-grande">{eqTurno.emoji}</div>
              <h2>Turno del {eqTurno.nombre}</h2>
              {G.pasa && <p className="pasa">Pasa al frente: <strong>{G.pasa}</strong></p>}
              <p>Muévete a la izquierda, al centro o a la derecha… ¡y haz lo que pida cada animal!</p>
              <button type="button" className="vg-cp-btn grande" onClick={listo}>▶ ¡A correr!</button>
            </div>
          </div>
        )}

        {/* Resultado de la carrera */}
        {fase === 'resultado' && G.ultimo && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta turno" style={{ '--c': (eqV[G.ultimo.quien] || eqDe).color }}>
              {modo === 'beam' && G.ultimo.nombre && <h2>{G.ultimo.nombre}</h2>}
              <div className="vg-jn-total">{G.ultimo.puntos}<small>objetos superados</small></div>
              <p>{(eqV[G.ultimo.quien] || eqDe).emoji} {(eqV[G.ultimo.quien] || eqDe).nombre}: +{pasosTxt(G.ultimo.pasos)} hacia Jomu</p>
              {modo === 'individual' && <p>🏆 Récord de esta sesión: {recordSesionJN}</p>}
              <div className="vg-mi-fila">
                {modo === 'individual' ? (
                  <React.Fragment>
                    <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar</button>
                    <button type="button" className="vg-cp-btn grande" onClick={siguiente}>↻ Reintentar</button>
                  </React.Fragment>
                ) : (
                  <button type="button" className="vg-cp-btn grande" onClick={siguiente}>▶ Siguiente concursante</button>
                )}
              </div>
            </div>
          </div>
        )}

        {pausado && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta">
              <h2>Pausa</h2>
              <div className="vg-mi-columna">
                <button type="button" className="vg-cp-btn grande" onClick={alternarPausa}>▶ Seguir</button>
                <button type="button" className="vg-cp-btn suave" onClick={() => { alternarPausa(); reiniciar(); }}>↻ Reiniciar turno (R)</button>
                {modo === 'beam' && <button type="button" className="vg-cp-btn suave" onClick={() => { alternarPausa(); saltar(); }}>⏭ Saltar turno (N)</button>}
                <button type="button" className="vg-cp-btn suave" onClick={terminar}>🏁 Terminar juego</button>
              </div>
            </div>
          </div>
        )}

        {/* Menú */}
        {fase === 'menu' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta menu">
              <div className="vg-cp-kicker">🌿 Modo Capibara · {modo === 'beam' ? 'Video beam · por equipos' : 'Teclado · individual'}</div>
              <h1 className="vg-mi-titulo vg-jn-titulo">🌴 Movimiento de la Jungla 🌴</h1>
              <p className="vg-mi-intro">
                {modo === 'beam'
                  ? 'Por tres caminos llegan troncos, rocas y espinas: ¡muévete al camino libre! Luego aparecen animales que piden una acción.'
                  : 'Esquiva con ← → y haz la acción de cada animal con su tecla. ¿Hasta dónde llegas?'}
              </p>
              {a.texto && a.texto.trim() && <p className="vg-mi-intro extra">{a.texto}</p>}
              {modo === 'individual' ? (
                <React.Fragment>
                  <div className="vg-mi-sub">Elige tu concursante</div>
                  <SelectorPersonajeCp valor={personaje} onElegir={setPersonaje} />
                  <div className="vg-mi-sub">¿De qué equipo es quien juega?</div>
                  <ChipsEquiposCp equipos={eqV} valor={equipoInd} onElegir={setEquipoInd} />
                  {recordSesionJN > 0 && <div className="vg-mi-sub">🏆 Récord de esta sesión: {recordSesionJN}</div>}
                </React.Fragment>
              ) : (
                <div className="vg-mi-ajuste">
                  <span>🐢 Velocidad</span>
                  {[['lenta', 'Lenta'], ['media', 'Media'], ['rapida', 'Rápida']].map(([v, txt]) => (
                    <button key={v} type="button" className={'vg-jn-vel' + (velocidad === v ? ' on' : '')} onClick={() => setVelocidad(v)}>{txt}</button>
                  ))}
                  <span>· {rondas} {rondas === 1 ? 'ronda' : 'rondas'} · {eqV.length} equipos</span>
                </div>
              )}
              <p className="vg-mi-intro">Cada {racha} objetos seguidos llega un animal nuevo · 1 paso hacia Jomu cada {porPaso} objetos</p>
              <div className="vg-mi-fila">
                <button type="button" className="vg-cp-btn suave" onClick={alternarSilencio}>{silencio ? '🔇 Sin sonido' : '🔊 Con sonido'}</button>
                <button type="button" className="vg-cp-btn grande" onClick={empezar}>▶ ¡Empezar!</button>
              </div>
            </div>
          </div>
        )}

        {/* Final */}
        {fase === 'fin' && (
          <div className="vg-mi-capa">
            <div className="vg-mi-tarjeta fin">
              {modo === 'individual' ? (
                <React.Fragment>
                  <h1 className="vg-mi-titulo">¡Fin del juego!</h1>
                  <p className="vg-mi-resultado">⭐ Mejor carrera: {G.mejor} objetos</p>
                  <p className="vg-mi-intro">{eqInd.emoji} El {eqInd.nombre} avanzó {pasosTxt(G.totalPasos)} hacia Jomu en {G.carreras} {G.carreras === 1 ? 'carrera' : 'carreras'}.</p>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <h1 className="vg-mi-titulo">{ganadorI === null ? '¡Fin del juego!' : empate ? '¡Empate!' : eqV[ganadorI].emoji + ' ¡Ganó el ' + eqV[ganadorI].nombre + '!'}</h1>
                  <TablaFinalCp filas={tabla.map((e) => ({ ...e, detalle: pasosTxt(e.pasos) + ' hacia Jomu' }))} />
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

Object.assign(window, { JunglaCapibara, BANCO_JN });
