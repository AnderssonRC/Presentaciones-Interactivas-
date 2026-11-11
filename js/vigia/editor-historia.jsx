/* editor-historia.jsx — Editor del Modo Historia (Modo Vigía, recurso: Historia).
   El docente crea sus propias diapositivas (texto que aparece palabra por
   palabra, imagen o ambas) para CONTAR una historia, y después de cualquier
   diapositiva agrega PAUSAS (cualquier activación: pregunta, reto, juegos…).
     [diapositivas]  [vista previa + configuración]  [tipo de historia + pausas]

   Historia competitiva («al estilo Capibara, con tu propia historia»): equipos
   (la misma sesión del Modo Capibara), cada pausa suma pasos en la montaña
   hacia la META que el docente define (nombre + imagen en la cima). Una
   diapositiva de «Misión» forma los equipos y muestra la montaña. Al final,
   el equipo con más pasos «resuelve el problema» (desenlace del docente).

   Documento guardado:
     { ..., recurso: 'historia',
       historia: { diapos: [{ id, tipo: 'escena'|'mision', antes?, texto, grito?, imagen?, boton? }],
                   competitiva, meta: { nombre, imagen }, final: { texto, imagen } },
       competencia: { modo: 'capibara', equipos, meta, historia: true } | null,   // solo la competitiva
       activaciones: [{ id, tipo, diapo, texto, ... }] }   // pausa DESPUÉS de esa diapositiva */

const HISTORIA_FINAL_TEXTO = 'Gracias a su inteligencia y su rapidez, {equipo} resolvió el problema.';
const historiaDe = (act) => act.historia || { diapos: [] };
const diapoConContenido = (d) => !!(d && ((d.texto || '').trim() || (d.imagen || '').trim() || (d.antes || '').trim()));
// Texto corto de una diapositiva (miniaturas, mando).
function resumenDiapo(d) {
  const t = ((d && (d.texto || d.antes)) || '').trim().replace(/\s+/g, ' ');
  return t.length > 60 ? t.slice(0, 57) + '…' : t;
}

/* ---------- Estilo de la historia (historia.estilo = { edad, fuente, animacion, paleta, transicion, color }) ----------
   Catálogos separados por edad (primaria, secundaria, bachillerato). Sin estilo guardado,
   la historia se ve como siempre (secundaria: Fraunces, «Suave», «Noche», «Deslizar»). */
const HISTORIA_EDADES = [
  { id: 'primaria', nombre: 'Primaria', emoji: '🧸', nota: 'Letras redondas, colores alegres y mucho movimiento.' },
  { id: 'secundaria', nombre: 'Secundaria', emoji: '🎒', nota: 'Estilo de cuento y aventura, con movimiento moderado.' },
  { id: 'bachillerato', nombre: 'Bachillerato', emoji: '🎓', nota: 'Sobrio y elegante: letras de libro y movimientos discretos.' },
];
const P = 'primaria', S = 'secundaria', B = 'bachillerato';
// `google`: la familia tal como la pide Google Fonts. `peso`: grosor del texto normal.
const HISTORIA_FUENTES = [
  { id: 'fredoka', nombre: 'Fredoka', edades: [P], familia: "'Fredoka', system-ui, sans-serif", google: 'Fredoka:wght@400..700', peso: 600 },
  { id: 'baloo', nombre: 'Baloo', edades: [P], familia: "'Baloo 2', system-ui, sans-serif", google: 'Baloo+2:wght@400..800', peso: 600 },
  { id: 'patrick', nombre: 'A mano', edades: [P], familia: "'Patrick Hand', cursive", google: 'Patrick+Hand', peso: 400 },
  { id: 'comic', nombre: 'Cómic suave', edades: [P], familia: "'Comic Neue', cursive", google: 'Comic+Neue:wght@400;700', peso: 700 },
  { id: 'fraunces', nombre: 'Cuento', edades: [S], familia: "'Fraunces', Georgia, 'Times New Roman', serif", google: '', peso: 600 },
  { id: 'nunito', nombre: 'Nunito', edades: [S], familia: "'Nunito', system-ui, sans-serif", google: 'Nunito:wght@400..900', peso: 700 },
  { id: 'bangers', nombre: 'Historieta', edades: [S], familia: "'Bangers', Impact, sans-serif", google: 'Bangers', peso: 400 },
  { id: 'poppins', nombre: 'Poppins', edades: [S, B], familia: "'Poppins', system-ui, sans-serif", google: 'Poppins:wght@400;600;800', peso: 600 },
  { id: 'playfair', nombre: 'Elegante', edades: [B], familia: "'Playfair Display', Georgia, serif", google: 'Playfair+Display:wght@400..900', peso: 600 },
  { id: 'lora', nombre: 'Libro', edades: [B], familia: "'Lora', Georgia, serif", google: 'Lora:wght@400..700', peso: 600 },
  { id: 'montserrat', nombre: 'Montserrat', edades: [B], familia: "'Montserrat', system-ui, sans-serif", google: 'Montserrat:wght@400..800', peso: 600 },
  { id: 'elite', nombre: 'Máquina de escribir', edades: [B], familia: "'Special Elite', 'Courier New', monospace", google: 'Special+Elite', peso: 400 },
];
// `paso`: segundos entre una palabra y la siguiente.
const HISTORIA_ANIMACIONES = [
  { id: 'rebote', nombre: 'Rebote', emoji: '🎈', edades: [P], paso: 0.12 },
  { id: 'cae', nombre: 'Lluvia de palabras', emoji: '🌧', edades: [P, S], paso: 0.1 },
  { id: 'gira', nombre: 'Voltereta', emoji: '🌀', edades: [P], paso: 0.12 },
  { id: 'aparece', nombre: 'Suave', emoji: '✨', edades: [S, B], paso: 0.1 },
  { id: 'desliza', nombre: 'Deslizar', emoji: '➡️', edades: [S, B], paso: 0.09 },
  { id: 'maquina', nombre: 'Letra por letra', emoji: '⌨️', edades: [S, B], paso: 0.045 },
  { id: 'foco', nombre: 'Enfoque', emoji: '🔎', edades: [B], paso: 0.13 },
  { id: 'ninguna', nombre: 'Sin animación', emoji: '⏹', edades: [P, S, B], paso: 0 },
];
// `fondo`: diapositivas sin imagen. `caja`: el recuadro del texto sobre una imagen. `clara`: fondo claro.
const HISTORIA_PALETAS = [
  { id: 'cielo', nombre: 'Cielo', edades: [P], clara: true, fondo: 'linear-gradient(180deg, #8FD3FF, #E3F6FF)', texto: '#12324F', acento: '#B8400A', caja: 'rgba(255,255,255,.92)' },
  { id: 'selva', nombre: 'Selva', edades: [P], fondo: 'linear-gradient(160deg, #1F6B3A, #0F3F26)', texto: '#F4FFE8', acento: '#FFD84D', caja: 'rgba(10,45,25,.82)' },
  { id: 'caramelo', nombre: 'Caramelo', edades: [P], clara: true, fondo: 'linear-gradient(135deg, #FFE0EC, #FFF3C4)', texto: '#5A1846', acento: '#B3154F', caja: 'rgba(255,245,250,.93)' },
  { id: 'atardecer', nombre: 'Atardecer', edades: [P, S], fondo: 'linear-gradient(180deg, #C2410C, #7A1F5C)', texto: '#FFF6E5', acento: '#FFE08A', caja: 'rgba(70,20,40,.82)' },
  { id: 'noche', nombre: 'Noche', edades: [S],
    fondo: 'radial-gradient(ellipse at 50% 120%, rgba(255,138,0,.17), transparent 60%), radial-gradient(ellipse at 50% -20%, rgba(77,148,255,.13), transparent 55%), #0B0805',
    texto: '#FBF3E1', acento: '#E8C98E', grito: '#FFE3A3', caja: 'rgba(10,7,4,.74)' },
  { id: 'oceano', nombre: 'Océano', edades: [S], fondo: 'radial-gradient(ellipse at 50% 120%, rgba(56,189,248,.22), transparent 60%), #06182B', texto: '#EAF6FF', acento: '#7DD3FC', caja: 'rgba(4,18,34,.8)' },
  { id: 'neon', nombre: 'Neón', edades: [S], fondo: 'radial-gradient(ellipse at 50% 120%, rgba(217,70,239,.25), transparent 60%), #130822', texto: '#F6ECFF', acento: '#5EF2D6', caja: 'rgba(19,8,34,.82)' },
  { id: 'papel', nombre: 'Papel antiguo', edades: [S, B], clara: true, fondo: 'radial-gradient(ellipse at 50% 50%, #FBF3DF, #EEDDB8)', texto: '#2B1D0E', acento: '#9A3B12', caja: 'rgba(250,242,224,.94)' },
  { id: 'pizarra', nombre: 'Pizarra', edades: [B], fondo: 'linear-gradient(180deg, #232B38, #171C25)', texto: '#EEF1F5', acento: '#9FB4CC', caja: 'rgba(20,25,33,.84)' },
  { id: 'tinta', nombre: 'Tinta', edades: [B], fondo: '#000000', texto: '#FFFFFF', acento: '#BDBDBD', caja: 'rgba(0,0,0,.8)' },
  { id: 'editorial', nombre: 'Editorial', edades: [B], clara: true, fondo: '#FAF8F3', texto: '#1A1A1A', acento: '#8B1E2D', caja: 'rgba(250,248,243,.95)' },
  { id: 'medianoche', nombre: 'Medianoche', edades: [B], fondo: 'linear-gradient(180deg, #0B1437, #070B1F)', texto: '#F3EBD3', acento: '#D4AF37', caja: 'rgba(7,11,31,.84)' },
];
// Cómo entra cada diapositiva al avanzar.
const HISTORIA_TRANSICIONES = [
  { id: 'saltar', nombre: 'Salto', emoji: '🐸', edades: [P] },
  { id: 'girar', nombre: 'Carta lanzada', emoji: '🃏', edades: [P] },
  { id: 'voltear', nombre: 'Pasar la página', emoji: '📖', edades: [P, S] },
  { id: 'deslizar', nombre: 'Deslizar', emoji: '➡️', edades: [S, B] },
  { id: 'zoom', nombre: 'Acercar', emoji: '🔍', edades: [S] },
  { id: 'fundido', nombre: 'Fundido', emoji: '🌫', edades: [S, B] },
  { id: 'cortina', nombre: 'Cortina', emoji: '🎭', edades: [B] },
  { id: 'ninguna', nombre: 'Sin movimiento', emoji: '⏹', edades: [P, S, B] },
];
// Lo recomendado para cada edad (se aplica al elegirla).
const HISTORIA_PRESETS = {
  primaria: { fuente: 'fredoka', animacion: 'rebote', paleta: 'cielo', transicion: 'saltar' },
  secundaria: { fuente: 'fraunces', animacion: 'aparece', paleta: 'noche', transicion: 'deslizar' },
  bachillerato: { fuente: 'playfair', animacion: 'foco', paleta: 'pizarra', transicion: 'fundido' },
};
const HISTORIA_COLORES = ['#FFFFFF', '#FFE08A', '#7DD3FC', '#9BE38F', '#FF9EC4', '#1A1A1A'];

// El estilo listo para usar (objetos del catálogo; lo que falte, lo de siempre).
function estiloHistoria(crudo) {
  const e = crudo || {};
  const de = (lista, id, def) => lista.find((x) => x.id === id) || lista.find((x) => x.id === def);
  const edad = HISTORIA_EDADES.some((x) => x.id === e.edad) ? e.edad : S;
  const base = HISTORIA_PRESETS[S];
  return {
    edad,
    fuente: de(HISTORIA_FUENTES, e.fuente, base.fuente),
    animacion: de(HISTORIA_ANIMACIONES, e.animacion, base.animacion),
    paleta: de(HISTORIA_PALETAS, e.paleta, base.paleta),
    transicion: de(HISTORIA_TRANSICIONES, e.transicion, base.transicion),
    color: /^#[0-9a-f]{6}$/i.test(e.color || '') ? e.color : '',
  };
}
// Variables CSS y clases del estilo (diapositiva, fin y desenlace).
function varsHistoria(est) {
  const p = est.paleta;
  return {
    '--hs-fuente': est.fuente.familia, '--hs-peso': est.fuente.peso,
    '--hs-fondo': p.fondo, '--hs-texto': est.color || p.texto, '--hs-acento': p.acento, '--hs-grito': p.grito || p.acento, '--hs-caja': p.caja,
  };
}
const clasesHistoria = (est) => ' an-' + est.animacion.id + (est.paleta.clara ? ' hs-clara' : '');
// Carga la letra desde Google Fonts (una sola vez cada una).
function cargarFuenteHistoria(f) {
  if (!f || !f.google || document.getElementById('hs-fuente-' + f.id)) return;
  const l = document.createElement('link');
  l.id = 'hs-fuente-' + f.id; l.rel = 'stylesheet';
  l.href = 'https://fonts.googleapis.com/css2?family=' + f.google + '&display=swap';
  document.head.appendChild(l);
}

/* Una diapositiva tal como se ve al presentar. `animar`: las palabras aparecen
   una a una (en el editor, quieta). `onListos`: el botón de la misión.
   `estilo`: historia.estilo (letra, animación, paleta).
   Mide con unidades del contenedor (cqw/cqh): sirve igual en el editor y en Presentar. */
function DiapoHistoria({ d, animar, onListos, competitiva, estilo }) {
  const est = estiloHistoria(estilo);
  React.useEffect(() => { cargarFuenteHistoria(est.fuente); }, [est.fuente.id]);
  if (!d) return null;
  const img = (d.imagen || '').trim() ? urlImagen(d.imagen) : '';
  const texto = (d.texto || '').trim();
  const antes = (d.antes || '').trim();
  const mision = d.tipo === 'mision' && competitiva;
  const an = est.animacion;
  const palabras = (t, retraso, paso) => {
    if (!animar || an.id === 'ninguna') return t;
    if (an.id === 'maquina') {   // letra por letra (cada palabra entera, para que no se parta al final del renglón)
      let n = 0;
      return String(t).split(' ').map((p, i) => {
        const letras = Array.from(p).map((c, j) => (
          <span key={j} className="vg-hs-letra" style={{ animationDelay: (retraso + (n++) * an.paso).toFixed(2) + 's' }}>{c}</span>));
        n++;
        return <span key={i} className="vg-hs-pal-fija">{letras}{' '}</span>;
      });
    }
    const cada = (paso || 0.1) * (an.paso / 0.1);
    return String(t).split(' ').map((p, i) => (
      <span key={i} className="vg-hs-palabra" style={{ animationDelay: (retraso + i * cada).toFixed(2) + 's' }}>{p}{' '}</span>));
  };
  const retrasoTexto = antes ? (an.id === 'maquina' ? 0.6 + antes.length * an.paso : 1.2) : 0.3;
  const cuerpo = (
    <React.Fragment>
      {antes && <p className="vg-hs-antes">{palabras(antes, 0.2, 0.22)}</p>}
      {texto && (d.grito
        ? <p className="vg-hs-frase"><span className={'vg-hs-grito' + (animar ? ' animar' : '')} style={{ animationDelay: retrasoTexto + 's' }}>{texto}</span></p>
        : <p className="vg-hs-frase">{palabras(texto, retrasoTexto)}</p>)}
      {mision && (
        <button type="button" className="vg-hs-listos" onClick={(e) => { e.stopPropagation(); if (onListos) onListos(); }}>
          🏆 {(d.boton || '').trim() || '¿Listos para la misión?'}
        </button>
      )}
    </React.Fragment>
  );
  return (
    <div className={'vg-hs-diapo' + (img ? ' con-imagen' : ' solo-texto') + (mision ? ' mision' : '') + (d.grito ? ' con-grito' : '') + (animar ? ' animar' : '') + clasesHistoria(est)}
      style={varsHistoria(est)}>
      {img ? (
        <React.Fragment>
          <div className="vg-hs-fondo" style={{ backgroundImage: 'url(' + JSON.stringify(img) + ')' }}></div>
          <img className="vg-hs-img vg-proyectado-doc" src={img} alt="" draggable="false" referrerPolicy="no-referrer" />
          <div className="vg-hs-vineta" aria-hidden="true"></div>
          {(texto || antes || mision) && <div className="vg-hs-caja vg-proyectado-doc">{cuerpo}</div>}
        </React.Fragment>
      ) : (
        <div className="vg-hs-hoja">
          <div className="vg-hs-caja grande">{texto || antes || mision ? cuerpo : <p className="vg-hs-antes">Diapositiva vacía</p>}</div>
        </div>
      )}
    </div>
  );
}

function VigiaEditorHistoria({ act, onChange, onBack, onPresent }) {
  const { TIPOS, tipo, nuevaActivacion } = VigiaTipos;
  const h = historiaDe(act);
  const diapos = h.diapos || [];
  const competitiva = !!(h.competitiva && act.competencia);
  const lista = act.activaciones || [];
  const estudiantes = (act.estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);

  const [diapoId, setDiapoId] = React.useState(diapos[0] ? diapos[0].id : null);
  const [selId, setSelId] = React.useState(null);   // pausa seleccionada
  const [panel, setPanel] = React.useState(null);   // 'final' (la meta y el desenlace) | 'estilo' (letra, colores, movimiento)
  const verFinal = panel === 'final', verEstilo = panel === 'estilo';
  const setVerFinal = (v) => setPanel(v ? 'final' : null);
  const est = estiloHistoria(h.estilo);
  const [estOpen, setEstOpen] = React.useState(false);

  const diapo = diapos.find((d) => d.id === diapoId) || diapos[0] || null;
  const pausas = lista.filter((a) => diapo && a.diapo === diapo.id);
  const sel = lista.find((a) => a.id === selId) || null;

  const update = (patch) => onChange({ ...act, ...patch });
  const setHistoria = (patch) => update({ historia: { ...h, ...patch } });
  const setDiapos = (arr) => setHistoria({ diapos: arr });
  const cambiarDiapo = (d) => setDiapos(diapos.map((x) => (x.id === d.id ? d : x)));
  const cambiar = (a) => update({ activaciones: lista.map((x) => (x.id === a.id ? a : x)) });

  // --- Diapositivas ---
  const agregarDiapo = (tipoD) => {
    const d = tipoD === 'mision'
      ? { id: AIP.uid(), tipo: 'mision', texto: 'Tu misión: resolver el problema con tu inteligencia y rapidez.', imagen: '', boton: '¿Listos para la misión?' }
      : { id: AIP.uid(), tipo: 'escena', antes: '', texto: '', imagen: '' };
    // Se agrega después de la diapositiva elegida.
    const k = diapo ? diapos.findIndex((x) => x.id === diapo.id) + 1 : diapos.length;
    const arr = diapos.slice(); arr.splice(k, 0, d);
    setDiapos(arr);
    setDiapoId(d.id); setSelId(null); setVerFinal(false);
  };
  const moverDiapo = (id, dir) => {
    const i = diapos.findIndex((x) => x.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= diapos.length) return;
    const arr = diapos.slice(); [arr[i], arr[j]] = [arr[j], arr[i]];
    setDiapos(arr);
  };
  const borrarDiapo = async (id) => {
    const n = lista.filter((a) => a.diapo === id).length;
    if (!await vigiaConfirmar('¿Quitar esta diapositiva' + (n ? ' y sus ' + n + (n === 1 ? ' pausa' : ' pausas') : '') + '?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    onChange({ ...act, historia: { ...h, diapos: diapos.filter((x) => x.id !== id) }, activaciones: lista.filter((a) => a.diapo !== id) });
    if (diapoId === id) { const resto = diapos.filter((x) => x.id !== id); setDiapoId(resto[0] ? resto[0].id : null); }
    setSelId(null);
  };

  // --- Pausas (activaciones después de la diapositiva) ---
  const agregar = (tipoId) => {
    if (!diapo) return;
    const a = nuevaActivacion(tipoId, { diapo: diapo.id });
    // En la competitiva, los juegos con equipos usan el número de la competencia.
    if (competitiva && typeof a.equipos === 'number') a.equipos = act.competencia.equipos || 3;
    if (competitiva && typeof a.metaCapibara === 'number') a.metaCapibara = act.competencia.meta || VigiaTipos.META_CAPIBARA;
    update({ activaciones: [...lista, a] });
    setSelId(a.id); setVerFinal(false);
  };
  const borrar = async (id) => {
    if (!await vigiaConfirmar('¿Eliminar esta pausa?', { aceptar: 'Sí, eliminar', peligro: true })) return;
    update({ activaciones: lista.filter((x) => x.id !== id) });
    if (selId === id) setSelId(null);
  };
  const moverPausa = (id, dir) => {
    const mias = pausas.map((a) => a.id);
    const i = mias.indexOf(id), j = i + dir;
    if (i < 0 || j < 0 || j >= mias.length) return;
    const ia = lista.findIndex((a) => a.id === mias[i]), ja = lista.findIndex((a) => a.id === mias[j]);
    const arr = lista.slice(); [arr[ia], arr[ja]] = [arr[ja], arr[ia]];
    update({ activaciones: arr });
  };

  // --- Historia competitiva (misma sesión de equipos del Modo Capibara) ---
  const primero = VigiaTipos.primerJaguar(lista);
  const equipos = Math.max(2, Math.min(VigiaTipos.MAX_EQUIPOS_JAGUAR, (primero && primero.equipos) || (act.competencia && act.competencia.equipos) || 3));
  const meta = Math.max(3, Math.min(30, (act.competencia && act.competencia.meta) || VigiaTipos.META_CAPIBARA));
  const fijarCompetitiva = async (on) => {
    if (on === competitiva) return;
    if (on) {
      const jaguar = lista.filter((x) => /^jg-/.test(x.tipo || '')).length;
      if (jaguar && !await vigiaConfirmar('Esta historia tiene ' + jaguar + (jaguar === 1 ? ' desafío' : ' desafíos') + ' del Modo Jaguar. Se conservan, pero la competencia usa los pasos en la montaña.',
        { titulo: 'Historia competitiva', aceptar: 'Sí, hacerla competitiva' })) return;
      const conMision = diapos.some((d) => d.tipo === 'mision');
      const mision = { id: AIP.uid(), tipo: 'mision', texto: 'Tu misión: resolver el problema con tu inteligencia y rapidez.', imagen: '', boton: '¿Listos para la misión?' };
      update({
        historia: { ...h, competitiva: true, diapos: conMision ? diapos : [...diapos, mision], meta: h.meta || { nombre: '', imagen: '' }, final: h.final || { texto: HISTORIA_FINAL_TEXTO, imagen: '' } },
        competencia: { modo: 'capibara', equipos, meta, historia: true },
      });
      if (!conMision) { setDiapoId(mision.id); setSelId(null); setVerFinal(false); }
    } else {
      if (!await vigiaConfirmar('Las pausas ya no sumarán pasos y no habrá equipos ni montaña (lo que escribiste de la meta y el desenlace se conserva).',
        { titulo: '¿Volver a historia normal?', aceptar: 'Sí, historia normal' })) return;
      update({ historia: { ...h, competitiva: false }, competencia: null });
      setVerFinal(false);
    }
  };
  const fijarEquipos = (n) => {
    const v = Math.max(2, Math.min(VigiaTipos.MAX_EQUIPOS_JAGUAR, n));
    update({
      competencia: { ...act.competencia, equipos: v },
      activaciones: lista.map((x) => (typeof x.equipos === 'number' && /^(jg|cp)-/.test(x.tipo || '') ? { ...x, equipos: v } : x)),
    });
  };
  const fijarMeta = (m) => {
    const v = Math.max(3, Math.min(30, m));
    update({
      competencia: { ...act.competencia, meta: v },
      activaciones: lista.map((x) => (typeof x.metaCapibara === 'number' ? { ...x, metaCapibara: v } : x)),
    });
  };

  // Tipos: en la competitiva no aparecen el Modo Jaguar ni la historia de Jomu (la historia es la tuya).
  const tipos = TIPOS.filter((t) => !competitiva || (t.grupo !== 'jaguar' && t.id !== 'cp-historia'));
  const cuenta = (id) => lista.filter((a) => a.diapo === id).length;
  const idx = diapo ? diapos.indexOf(diapo) : -1;

  return (
    <div className="editor-shell vigia vg-editor vg-editor-historia" data-screen-label="Modo Vigía · Editor de historia">
      <div className="editor-topbar">
        <button className="icon-btn" onClick={onBack} title="Volver al Modo Vigía"><Icon name="atras" size={17} /></button>
        <img src={VIGIA_LOGO} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <input value={act.titulo || ''} onChange={(e) => update({ titulo: e.target.value })} placeholder="Nombre de la historia"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, width: '100%', color: 'var(--ink)' }} />
          <input value={act.objetivo || ''} onChange={(e) => update({ objetivo: e.target.value })} placeholder="¿Qué quieres que el grupo aprenda con esta historia?"
            style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: 13, color: 'var(--muted)', width: '100%' }} />
        </div>
        <EstudiantesPopover act={act} update={update} abierto={estOpen} setAbierto={setEstOpen} />
        <button className="btn vigia-btn-crear" onClick={onPresent} disabled={!VigiaTipos.recursoListo(act)}
          title={VigiaTipos.recursoListo(act) ? 'Contar la historia con sus pausas' : 'Primero escribe una diapositiva'}>
          <Icon name="play" size={15} /> Presentar
        </button>
      </div>

      <div className="editor-body">
        {/* ---- columna 1: diapositivas ---- */}
        <div className="editor-list">
          <button className={'slide-thumb vg-thumb vg-hs-thumb vg-hs-thumb-estilo' + (verEstilo ? ' active' : '')}
            onClick={() => { setPanel('estilo'); setSelId(null); }} title="Tipo de letra, animación, colores y movimiento de las diapositivas">
            <span className="vg-hs-thumb-texto" style={{ ...varsHistoria(est), fontFamily: est.fuente.familia, background: est.paleta.fondo, color: est.color || est.paleta.texto }}>🎨 Estilo de la historia</span>
            <span className="vg-diapo-pie"><span>{HISTORIA_EDADES.find((x) => x.id === est.edad).nombre} · {est.fuente.nombre} · {est.paleta.nombre}</span></span>
          </button>
          <div className="kicker" style={{ padding: '2px 4px' }}>Diapositivas · {diapos.length}</div>
          {diapos.map((d, i) => {
            const img = (d.imagen || '').trim() ? urlImagen(d.imagen) : '';
            const esMision = d.tipo === 'mision';
            return (
              <button key={d.id} className={'slide-thumb vg-thumb vg-diapo-thumb vg-hs-thumb' + (diapo && d.id === diapo.id && !panel ? ' active' : '') + (esMision ? ' mision' : '')}
                onClick={() => { setDiapoId(d.id); setSelId(null); setVerFinal(false); }}>
                <span className="vg-diapo-num">{i + 1}</span>
                {img ? <MiniImagen src={img} vacia="Sin imagen" />
                  : <span className="vg-hs-thumb-texto">{resumenDiapo(d) || 'Sin texto'}</span>}
                <span className="vg-diapo-pie">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                    {esMision ? (competitiva ? '🏆 Misión' : 'Misión (solo en la competitiva)') : resumenDiapo(d) || 'Diapositiva ' + (i + 1)}
                  </span>
                  <span className="vg-diapo-cuenta" title="Pausas después de esta diapositiva">⏸ {cuenta(d.id)}</span>
                </span>
                <span className="thumb-actions">
                  {i > 0 && <span className="thumb-action" role="button" title="Subir" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, -1); }}>▲</span>}
                  {i < diapos.length - 1 && <span className="thumb-action" role="button" title="Bajar" onClick={(e) => { e.stopPropagation(); moverDiapo(d.id, 1); }}>▼</span>}
                  <span className="thumb-action" role="button" title="Quitar" onClick={(e) => { e.stopPropagation(); borrarDiapo(d.id); }}>✕</span>
                </span>
              </button>
            );
          })}
          {competitiva && (
            <button className={'slide-thumb vg-thumb vg-hs-thumb vg-hs-thumb-final' + (verFinal ? ' active' : '')}
              onClick={() => { setVerFinal(true); setSelId(null); }}>
              <span className="vg-hs-thumb-texto">🏁 La meta y el desenlace</span>
              <span className="vg-diapo-pie"><span>Quién resuelve el problema</span></span>
            </button>
          )}
          <div className="vg-hs-agregar">
            <button className="btn btn-sm vigia-btn-crear" onClick={() => agregarDiapo('escena')}>+ Diapositiva</button>
            {competitiva && <button className="btn btn-sm" onClick={() => agregarDiapo('mision')} title="Aquí se forman los equipos y se ve la montaña">+ Misión</button>}
          </div>
        </div>

        {/* ---- columna 2: vista previa + configuración ---- */}
        <div className="editor-canvas-col">
          {verEstilo ? (
            <ConfigEstiloHistoria h={h} setHistoria={setHistoria} diapo={diapo} onCerrar={() => setPanel(null)} />
          ) : verFinal && competitiva ? (
            <ConfigFinalHistoria h={h} setHistoria={setHistoria} />
          ) : !diapo ? (
            <div className="vg-lienzo-marco vg-lienzo-vacio">
              <img src={VIGIA_LOGO} alt="" style={{ width: 64, height: 64, borderRadius: 14 }} />
              <strong>Empieza tu historia</strong>
              <span>Crea tu primera diapositiva con «+ Diapositiva»: escribe lo que quieres contar y, si quieres, agrega una imagen. Luego pon pausas con los tipos de la derecha.</span>
              <button className="btn vigia-btn-crear" onClick={() => agregarDiapo('escena')}>+ Primera diapositiva</button>
            </div>
          ) : (
            <React.Fragment>
              <div className="vg-hs-marco">
                <DiapoHistoria d={diapo} competitiva={competitiva || diapo.tipo === 'mision'} estilo={h.estilo} />
              </div>
              <PausasDiapo pausas={pausas} selId={selId} onElegir={(id) => setSelId(id === selId ? null : id)} onMover={moverPausa} />
              {sel ? (
                <div className="config-card vg-config" style={{ borderColor: tipo(sel.tipo).color + '66' }}>
                  <button type="button" className="vg-btn-texto" onClick={() => setSelId(null)} style={{ alignSelf: 'flex-start' }}>← Volver a la diapositiva {idx + 1}</button>
                  <ConfigActivacion key={sel.id} a={sel} onCambiar={cambiar} onBorrar={() => borrar(sel.id)} conTiempo={false} compacto sinFragmento
                    hayEstudiantes={estudiantes.length > 0} onAbrirEstudiantes={() => setEstOpen(true)} />
                </div>
              ) : (
                <ConfigDiapoHistoria d={diapo} n={idx + 1} competitiva={competitiva} onCambiar={cambiarDiapo} onBorrar={() => borrarDiapo(diapo.id)} />
              )}
            </React.Fragment>
          )}
        </div>

        {/* ---- columna 3: tipo de historia + pausas ---- */}
        <div className="editor-tools">
          <div className={'vg-hs-modo' + (competitiva ? ' on' : '')}>
            <div className="vg-segmento vg-hs-segmento" role="radiogroup" aria-label="Tipo de historia">
              <button role="radio" aria-checked={!competitiva} className={!competitiva ? 'on' : ''} onClick={() => fijarCompetitiva(false)}>📖 Historia</button>
              <button role="radio" aria-checked={competitiva} className={competitiva ? 'on' : ''} onClick={() => fijarCompetitiva(true)}>🏆 Competitiva</button>
            </div>
            {!competitiva ? (
              <p className="vg-competencia-nota">Cuenta tu historia y detenla con pausas. ¿Quieres equipos? Elige «Competitiva»: los equipos suben una montaña hacia tu meta y el que gane resuelve el problema.</p>
            ) : (
              <React.Fragment>
                <div className="vg-competencia-fila">
                  <span>Equipos</span>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarEquipos(equipos - 1)} disabled={equipos <= 2} aria-label="Menos equipos">−</button>
                  <b>{equipos}</b>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarEquipos(equipos + 1)} disabled={equipos >= VigiaTipos.MAX_EQUIPOS_JAGUAR} aria-label="Más equipos">+</button>
                </div>
                <div className="vg-competencia-fila">
                  <span>Pasos hasta la meta</span>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarMeta(meta - 1)} disabled={meta <= 3} aria-label="Menos pasos">−</button>
                  <b>{meta}</b>
                  <button type="button" className="vg-mini-accion" onClick={() => fijarMeta(meta + 1)} disabled={meta >= 30} aria-label="Más pasos">+</button>
                </div>
                <p className="vg-competencia-nota">
                  En la diapositiva de <b>Misión</b> se forman los equipos y se ve la montaña. Cada pausa suma 1 paso al equipo que gane
                  (los juegos del Modo Capibara suman los suyos). Al final, el equipo con más pasos resuelve el problema.
                </p>
                <button type="button" className="vg-mini-accion" onClick={() => { setVerFinal(true); setSelId(null); }}>🏁 Meta y desenlace</button>
              </React.Fragment>
            )}
          </div>
          <div>
            <div className="kicker">Agregar una</div>
            <h3 style={{ fontSize: 16.5, fontWeight: 800, marginTop: 2 }}>Pausa</h3>
            <p style={{ margin: '6px 0 10px', fontSize: 12.5, color: 'var(--muted)' }}>
              {diapo ? <React.Fragment>Aparece al terminar la <strong style={{ color: 'var(--ink)' }}>diapositiva {idx + 1}</strong>.</React.Fragment> : 'Primero crea una diapositiva.'}
            </p>
          </div>
          <TiposAgrupados lista={tipos} render={(t) => {
            const habilitado = !!diapo;
            return (
              <button key={t.id} className={'tool-card vg-tipo' + (habilitado ? '' : ' tool-soon')} disabled={!habilitado}
                onClick={() => habilitado && agregar(t.id)}
                title={!diapo ? 'Primero crea una diapositiva' : 'Pausa después de la diapositiva ' + (idx + 1) + ': ' + t.nombre}>
                <span className="tool-ico" style={{ background: t.color }}><Icon name={t.icon} size={19} /></span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: 'block', fontWeight: 700, fontSize: 13.5 }}>{t.nombre}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted)', lineHeight: 1.35 }}>{t.proposito}</span>
                </span>
                <span className="tool-add">+</span>
              </button>
            );
          }} />
        </div>
      </div>
    </div>
  );
}

/* Pausas de la diapositiva (en orden; se ven una tras otra al terminarla). */
function PausasDiapo({ pausas, selId, onElegir, onMover }) {
  if (!pausas.length) {
    return <div className="vg-hs-pausas vacia">Sin pausas: al avanzar, pasa directo a la siguiente diapositiva. Agrega una con los tipos de la derecha.</div>;
  }
  return (
    <div className="vg-hs-pausas">
      <span className="vg-hs-pausas-titulo">⏸ Pausas al terminar esta diapositiva</span>
      {pausas.map((a, i) => {
        const ti = VigiaTipos.tipo(a.tipo);
        const txt = vistazoDe(a);
        return (
          <span key={a.id} className={'vg-hs-pausa' + (a.id === selId ? ' sel' : '')} style={{ '--tipo': ti.color }}>
            <button type="button" className="vg-hs-pausa-btn" onClick={() => onElegir(a.id)} title={'Editar: ' + ti.nombre}>
              <span className="vg-hs-pausa-ico" style={{ background: ti.color }}><Icon name={ti.icon} size={13} /></span>
              <b>{i + 1}.</b> {ti.nombre}{txt ? <small>{txt}</small> : null}
            </button>
            {pausas.length > 1 && (
              <span className="vg-hs-pausa-mover">
                <button type="button" onClick={() => onMover(a.id, -1)} disabled={i === 0} aria-label="Antes">‹</button>
                <button type="button" onClick={() => onMover(a.id, 1)} disabled={i === pausas.length - 1} aria-label="Después">›</button>
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

/* Datos de una diapositiva: texto previo, texto, grito, imagen y (misión) el botón. */
function ConfigDiapoHistoria({ d, n, competitiva, onCambiar, onBorrar }) {
  const set = (patch) => onCambiar({ ...d, ...patch });
  const mision = d.tipo === 'mision';
  return (
    <div className="config-card vg-hs-config">
      <div className="vg-img-cabeza">
        <strong>{mision ? '🏆 Misión' : 'Diapositiva ' + n}</strong>
        <span className="vg-img-nota">{mision ? (competitiva ? 'aquí se forman los equipos y se ve la montaña' : 'solo se usa en la historia competitiva') : 'el texto aparece palabra por palabra'}</span>
        <span style={{ flex: 1 }}></span>
        <button type="button" className="vg-mini-accion" onClick={onBorrar}>Quitar</button>
      </div>
      {!mision && (
        <div className="field">
          <label>Texto previo (opcional, más pequeño)</label>
          <input type="text" value={d.antes || ''} maxLength={120} placeholder="Ej.: Horas después…" onChange={(e) => set({ antes: e.target.value })} />
        </div>
      )}
      <div className="field">
        <label>{mision ? 'La misión (el problema que deben resolver)' : 'Lo que cuentas'}</label>
        <textarea rows={3} value={d.texto || ''} maxLength={400}
          placeholder={mision ? 'Tu misión: encontrar el tesoro antes de que llegue la tormenta.' : 'Había una vez, en un pueblo junto al río…'}
          onChange={(e) => set({ texto: e.target.value })} />
      </div>
      {mision ? (
        <div className="field">
          <label>Texto del botón</label>
          <input type="text" value={d.boton || ''} maxLength={60} placeholder="¿Listos para la misión?" onChange={(e) => set({ boton: e.target.value })} />
        </div>
      ) : (
        <label className="vg-hs-check">
          <input type="checkbox" checked={!!d.grito} onChange={(e) => set({ grito: e.target.checked })} />
          <span><b>¡Grito!</b> El texto aparece de golpe, grande y temblando (para frases cortas: «¡Corre!»).</span>
        </label>
      )}
      <div className="field">
        <label>Imagen (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
        <CampoUrlImagen valor={d.imagen || ''} onCambiar={(url) => set({ imagen: url })} placeholder="Pega la URL de una imagen" />
        {d.imagen && <button type="button" className="vg-btn-texto" onClick={() => set({ imagen: '' })}>Quitar la imagen</button>}
      </div>
    </div>
  );
}

/* La meta (lo que hay en la cima de la montaña) y el desenlace (el equipo ganador resuelve el problema). */
function ConfigFinalHistoria({ h, setHistoria }) {
  const m = h.meta || { nombre: '', imagen: '' };
  const f = h.final || { texto: HISTORIA_FINAL_TEXTO, imagen: '' };
  const setM = (patch) => setHistoria({ meta: { ...m, ...patch } });
  const setF = (patch) => setHistoria({ final: { ...f, ...patch } });
  const ejemplo = { id: 'final', tipo: 'escena', antes: '🏆 ¡Problema resuelto!', texto: (f.texto || HISTORIA_FINAL_TEXTO).replace(/\{equipo\}/g, 'el Equipo Verde'), imagen: f.imagen || m.imagen || '' };
  return (
    <React.Fragment>
      <div className="vg-hs-marco"><DiapoHistoria d={ejemplo} estilo={h.estilo} /></div>
      <div className="config-card vg-hs-config">
        <div className="vg-img-cabeza"><strong>🏔 La meta</strong><span className="vg-img-nota">lo que hay en la cima de la montaña</span></div>
        <div className="field">
          <label>¿Hacia dónde van los equipos?</label>
          <input type="text" value={m.nombre || ''} maxLength={40} placeholder="el tesoro perdido" onChange={(e) => setM({ nombre: e.target.value })} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>Se lee «El camino hacia <b>{(m.nombre || '').trim() || 'la meta'}</b>».</div>
        </div>
        <div className="field">
          <label>Imagen de la meta (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
          <CampoUrlImagen valor={m.imagen || ''} onCambiar={(url) => setM({ imagen: url })} placeholder="URL de la imagen en la cima" />
        </div>
      </div>
      <div className="config-card vg-hs-config">
        <div className="vg-img-cabeza"><strong>🏁 El desenlace</strong><span className="vg-img-nota">el equipo ganador resuelve el problema</span></div>
        <div className="field">
          <label>¿Cómo termina la historia?</label>
          <textarea rows={3} value={f.texto || ''} maxLength={400} placeholder={HISTORIA_FINAL_TEXTO} onChange={(e) => setF({ texto: e.target.value })} />
          <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 5 }}>Escribe <b>{'{equipo}'}</b> donde va el nombre del equipo ganador.</div>
        </div>
        <div className="field">
          <label>Imagen del final (opcional) <span className="vg-ayuda" title={AYUDA_IMAGEN}>?</span></label>
          <CampoUrlImagen valor={f.imagen || ''} onCambiar={(url) => setF({ imagen: url })} placeholder="URL de la imagen del final" />
        </div>
      </div>
    </React.Fragment>
  );
}

/* El estilo de toda la historia: edad → tipo de letra, animación de las palabras,
   paleta de fondo, color de las letras y movimiento de las diapositivas.
   Cada cambio vuelve a animar la vista previa. */
function ConfigEstiloHistoria({ h, setHistoria, diapo, onCerrar }) {
  const est = estiloHistoria(h.estilo);
  const [vez, setVez] = React.useState(0);
  const [todas, setTodas] = React.useState(false);
  const guardado = { edad: est.edad, fuente: est.fuente.id, animacion: est.animacion.id, paleta: est.paleta.id, transicion: est.transicion.id, color: est.color };
  const set = (patch) => { setHistoria({ estilo: { ...guardado, ...patch } }); setVez((v) => v + 1); };
  const visibles = (lista, selId) => lista.filter((x) => todas || x.edades.includes(est.edad) || x.id === selId);
  const fuentes = visibles(HISTORIA_FUENTES, est.fuente.id);
  React.useEffect(() => { fuentes.forEach(cargarFuenteHistoria); });
  const edad = HISTORIA_EDADES.find((x) => x.id === est.edad);
  const ejemplo = diapo && diapo.tipo !== 'mision' && ((diapo.texto || '').trim() || (diapo.antes || '').trim())
    ? diapo : { id: 'ejemplo', tipo: 'escena', antes: 'Había una vez…', texto: 'Una historia contada a tu manera, palabra por palabra.', imagen: (diapo && diapo.imagen) || '' };
  const chips = (lista, selId, campo) => (
    <div className="vg-hs-opciones">
      {visibles(lista, selId).map((x) => (
        <button key={x.id} type="button" className={'vg-hs-op' + (x.id === selId ? ' on' : '')} aria-pressed={x.id === selId} onClick={() => set({ [campo]: x.id })}>
          <span aria-hidden="true">{x.emoji}</span> {x.nombre}
        </button>
      ))}
    </div>
  );
  return (
    <React.Fragment>
      <div className="vg-hs-marco">
        <div key={vez} className={'vg-hs-escenario vg-diapo desde-derecha tr-' + est.transicion.id}>
          <DiapoHistoria d={ejemplo} animar estilo={h.estilo} />
        </div>
      </div>
      <div className="config-card vg-hs-config vg-hs-estilo">
        <div className="vg-img-cabeza">
          <strong>🎨 Estilo de la historia</strong>
          <span className="vg-img-nota">se aplica a todas las diapositivas</span>
          <span style={{ flex: 1 }}></span>
          <button type="button" className="vg-mini-accion" onClick={() => setVez((v) => v + 1)}>▶ Ver de nuevo</button>
          <button type="button" className="vg-mini-accion" onClick={onCerrar}>Listo</button>
        </div>

        <div className="field">
          <label>¿Para qué edad es la historia?</label>
          <div className="vg-segmento vg-hs-segmento" role="radiogroup" aria-label="Edad">
            {HISTORIA_EDADES.map((x) => (
              <button key={x.id} type="button" role="radio" aria-checked={x.id === est.edad} className={x.id === est.edad ? 'on' : ''}
                onClick={() => set({ edad: x.id, ...HISTORIA_PRESETS[x.id], color: '' })}>{x.emoji} {x.nombre}</button>
            ))}
          </div>
          <div className="vg-hs-estilo-nota">{edad.nota} Al elegir una edad se pone su estilo recomendado; después puedes cambiar cada opción.</div>
        </div>

        <div className="field">
          <label>Tipo de letra</label>
          <div className="vg-hs-opciones">
            {fuentes.map((f) => (
              <button key={f.id} type="button" className={'vg-hs-op fuente' + (f.id === est.fuente.id ? ' on' : '')} aria-pressed={f.id === est.fuente.id}
                style={{ fontFamily: f.familia, fontWeight: f.peso }} onClick={() => set({ fuente: f.id })}>
                <b aria-hidden="true">Aa</b> {f.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Animación de las palabras</label>
          {chips(HISTORIA_ANIMACIONES, est.animacion.id, 'animacion')}
        </div>

        <div className="field">
          <label>Paleta de fondo</label>
          <div className="vg-hs-opciones">
            {visibles(HISTORIA_PALETAS, est.paleta.id).map((p) => (
              <button key={p.id} type="button" className={'vg-hs-op paleta' + (p.id === est.paleta.id ? ' on' : '')} aria-pressed={p.id === est.paleta.id}
                style={{ background: p.fondo, color: p.texto }} onClick={() => set({ paleta: p.id })}>
                <b aria-hidden="true" style={{ color: p.grito || p.acento }}>Aa</b> {p.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Color de las letras</label>
          <div className="vg-hs-opciones">
            <button type="button" className={'vg-hs-op' + (!est.color ? ' on' : '')} aria-pressed={!est.color} onClick={() => set({ color: '' })}>El de la paleta</button>
            {HISTORIA_COLORES.map((c) => (
              <button key={c} type="button" className={'vg-hs-color' + (est.color.toUpperCase() === c ? ' on' : '')} aria-pressed={est.color.toUpperCase() === c}
                style={{ background: c }} title={c} aria-label={'Color ' + c} onClick={() => set({ color: c })}></button>
            ))}
            <label className="vg-hs-color-otro" title="Elegir otro color">
              <input type="color" value={est.color || est.paleta.texto} onChange={(e) => set({ color: e.target.value })} /> Otro…
            </label>
          </div>
          <div className="vg-hs-estilo-nota">Mira la vista previa: las letras deben leerse bien sobre el fondo. Con «Exceso de luz» siempre se usan letras oscuras sobre papel claro.</div>
        </div>

        <div className="field">
          <label>Movimiento de las diapositivas (cómo entra cada una)</label>
          {chips(HISTORIA_TRANSICIONES, est.transicion.id, 'transicion')}
        </div>

        <label className="vg-hs-check">
          <input type="checkbox" checked={todas} onChange={(e) => setTodas(e.target.checked)} />
          <span><b>Ver las opciones de todas las edades</b> (no solo las de {edad.nombre.toLowerCase()}).</span>
        </label>
      </div>
    </React.Fragment>
  );
}

Object.assign(window, {
  ConfigEstiloHistoria, estiloHistoria, varsHistoria, clasesHistoria, cargarFuenteHistoria,
  HISTORIA_EDADES, HISTORIA_FUENTES, HISTORIA_ANIMACIONES, HISTORIA_PALETAS, HISTORIA_TRANSICIONES, HISTORIA_PRESETS,
  VigiaEditorHistoria, DiapoHistoria, PausasDiapo, ConfigDiapoHistoria, ConfigFinalHistoria,
  diapoConContenido, resumenDiapo, historiaDe, HISTORIA_FINAL_TEXTO,
});
