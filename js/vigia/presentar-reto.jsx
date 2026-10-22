/* presentar-reto.jsx — Escena del "Reto de activación" (tipo físico-grupal).
   Fases:
     'condor' -> irrumpe el CÓNDOR RETADOR (condor-retador.png): relámpagos,
                 destellos y sus ojos azules se encienden (~3 s; clic = adelantar).
     'reto'   -> el reto en una tarjeta de neón naranja y azul: el reto elegido,
                 sus indicaciones y, con la lista de estudiantes, el sorteo de
                 parejas, grupos u orden. A− / Aa / A+ arriba a la derecha.
     'cierre' -> "Reto finalizado… ¡Por ahora!" (~2,4 s) y se vuelve al recurso.
   La usa TarjetaActivacion (presentar.jsx) cuando a.tipo === 'reto', así
   funciona en todos los modos Presentar. Deja libre la franja inferior (la
   barra con las demás activaciones) y queda por debajo del tono de pantalla. */

const RETO_CONDOR = 'condor-retador.png';
const RETO_ESCENA_MS = 3200;
const RETO_CIERRE_MS = 2600;

// Baraja (Fisher–Yates) sin tocar la lista original.
function barajar(lista) {
  const a = lista.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
// Reparte en bloques de `n`; si el último queda muy pequeño, sus integrantes
// se suman a los otros (mejor un grupo de 5 que uno de 1).
function enBloques(lista, n) {
  const bloques = [];
  for (let i = 0; i < lista.length; i += n) bloques.push(lista.slice(i, i + n));
  const ultimo = bloques[bloques.length - 1];
  if (bloques.length > 1 && ultimo.length < Math.ceil(n / 2)) {
    bloques.pop();
    ultimo.forEach((x, k) => bloques[k % bloques.length].push(x));
  }
  return bloques;
}
// Sorteo según el reto: { tipo: 'parejas'|'grupos'|'orden', bloques: [[nombre]] }.
function sortearReto(usa, nombres, tamGrupo) {
  if (!nombres.length) return null;
  const b = barajar(nombres);
  if (usa === 'orden') return { tipo: 'orden', bloques: b.map((x) => [x]) };
  if (usa === 'grupos') return { tipo: 'grupos', bloques: enBloques(b, Math.max(2, tamGrupo || 4)) };
  return { tipo: 'parejas', bloques: enBloques(b, 2) };   // impar: queda un trío
}

function RetoActivacion({ a, estudiantes, orden, onContinuar, textoContinuar }) {
  const r = VigiaTipos.reto(a.reto);
  const nombres = (estudiantes || []).map((s) => (s || '').trim()).filter(Boolean);
  const [fase, setFase] = React.useState('condor');   // 'condor' | 'reto' | 'cierre'
  const [semilla, setSemilla] = React.useState(0);
  const sorteo = React.useMemo(() => sortearReto(r.usa, nombres, a.tamGrupo), [semilla, r.id]);   // eslint-disable-line
  const nombre = (n) => nombreAnuncio(n, orden || 'apellidos');

  // Tamaño de la letra (A− / Aa / A+), como en las demás tarjetas.
  const [escala, setEscala] = React.useState(1);
  const pasos = ESCALAS_TARJETA;
  const cambiarEscala = (dir) => setEscala((e) => {
    if (dir === 0) return 1;
    const i = pasos.indexOf(e);
    return pasos[Math.max(0, Math.min(pasos.length - 1, (i < 0 ? 3 : i) + dir))];
  });

  // Desde el mando: terminar, sortear de nuevo o cambiar la letra.
  useOrdenMando((o) => {
    if (o.accion === 'reto-terminar' || o.accion === 'continuar') { if (fase === 'condor') setFase('reto'); else if (fase === 'reto') setFase('cierre'); else onContinuar(); }
    else if (o.accion === 'reto-sortear') setSemilla((s) => s + 1);
    else if (o.accion === 'letra') cambiarEscala(o.dir || 0);
  });

  // Tiempos de cada fase.
  React.useEffect(() => {
    if (fase === 'condor') { const t = setTimeout(() => setFase('reto'), RETO_ESCENA_MS); return () => clearTimeout(t); }
    if (fase === 'cierre') { const t = setTimeout(onContinuar, RETO_CIERRE_MS); return () => clearTimeout(t); }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);
  const terminar = () => setFase((f) => (f === 'cierre' ? f : 'cierre'));

  // Espacio / Enter: adelanta la escena o termina el reto (con su cierre),
  // antes de que el modo Presentar lo cierre de golpe.
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      if (e.target && /input|textarea/i.test(e.target.tagName)) return;
      e.preventDefault(); e.stopPropagation();
      if (fase === 'condor') setFase('reto');
      else if (fase === 'reto') terminar();
      else onContinuar();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase]);

  if (fase === 'condor') {
    return (
      <div className="vg-reto vg-reto-escena" onClick={() => setFase('reto')} title="Clic para ver el reto">
        <div className="vg-reto-destello"></div>
        {/* Relámpagos (cada uno destella a su tiempo). */}
        <svg className="vg-rayos" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline className="vg-rayo r1" points="8,0 14,14 10,16 19,33 15,35 26,55" />
          <polyline className="vg-rayo r2" points="92,0 85,12 89,15 79,30 84,33 72,52" />
          <polyline className="vg-rayo r3" points="30,0 34,10 31,12 38,24" />
          <polyline className="vg-rayo r4" points="70,0 66,9 69,11 61,22" />
          <polyline className="vg-rayo r5" points="0,62 10,58 8,64 20,60" />
          <polyline className="vg-rayo r6" points="100,66 89,61 91,67 79,63" />
        </svg>
        <div className="vg-reto-condor">
          <img src={RETO_CONDOR} alt="Cóndor retador" draggable="false" />
          <span className="vg-ojo izq"></span>
          <span className="vg-ojo der"></span>
        </div>
        <div className="vg-reto-anuncio">¡Reto de activación!</div>
      </div>
    );
  }

  if (fase === 'cierre') {
    return (
      <div className="vg-reto vg-reto-cierre" onClick={onContinuar} title="Clic para continuar">
        <div className="vg-reto-condor chico">
          <img src={RETO_CONDOR} alt="" draggable="false" />
          <span className="vg-ojo izq"></span>
          <span className="vg-ojo der"></span>
        </div>
        <div className="vg-cierre-texto">
          <span className="uno">Reto finalizado…</span>
          <span className="dos">¡Por ahora!</span>
        </div>
      </div>
    );
  }

  const muchos = sorteo && sorteo.bloques.length > 12;
  return (
    <div className="vg-reto vg-reto-pantalla">
      <div className="vg-reto-tarjeta">
        <div className="vg-tarjeta-letra" role="group" aria-label="Tamaño de la letra">
          <button onClick={() => cambiarEscala(-1)} disabled={escala <= pasos[0]} title="Letra más pequeña">A−</button>
          <button onClick={() => cambiarEscala(0)} className="normal" title={'Tamaño normal (ahora ' + Math.round(escala * 100) + '%)'}>Aa</button>
          <button onClick={() => cambiarEscala(1)} disabled={escala >= pasos[pasos.length - 1]} title="Letra más grande">A+</button>
        </div>
        {/* margin: auto -> centrado vertical cuando cabe; si no, se desplaza. */}
        <div className="vg-reto-contenido" style={{ zoom: escala }}>
          <div className="vg-reto-cabeza">
            <img src={RETO_CONDOR} alt="" />
            <span>Reto de activación</span>
          </div>
          <h1 className="vg-reto-titulo">{r.titulo}</h1>
          <p className="vg-reto-desc">{r.desc}</p>
          {a.texto && a.texto.trim() && <p className="vg-reto-extra">{a.texto}</p>}

          {sorteo && (
            <div className={'vg-reto-sorteo ' + sorteo.tipo + (muchos ? ' muchos' : '')} key={semilla}>
              {sorteo.bloques.map((b, i) => (
                <div key={i} className="vg-reto-bloque" style={{ animationDelay: Math.min(i * 0.06, 1.5) + 's' }}>
                  {sorteo.tipo === 'orden' ? (
                    <React.Fragment><span className="vg-reto-num">{i + 1}</span><span className="vg-reto-nombre">{nombre(b[0])}</span></React.Fragment>
                  ) : sorteo.tipo === 'grupos' ? (
                    <React.Fragment>
                      <span className="vg-reto-grupo">Grupo {i + 1}</span>
                      <span className="vg-reto-nombres">
                        {b.map((n, k) => <span key={k} className="vg-reto-nombre">{nombre(n)}</span>)}
                      </span>
                    </React.Fragment>
                  ) : (
                    b.map((n, k) => (
                      <React.Fragment key={k}>
                        {k > 0 && <span className="vg-reto-une">⇄</span>}
                        <span className="vg-reto-nombre">{nombre(n)}</span>
                      </React.Fragment>
                    ))
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="vg-reto-acciones">
        {sorteo && <button className="vg-btn vg-btn-sec" onClick={() => setSemilla((s) => s + 1)}>↻ Sortear de nuevo</button>}
        <button className="vg-btn" onClick={terminar}>Terminar reto <Icon name="play" size={16} /></button>
      </div>
    </div>
  );
}

Object.assign(window, { RetoActivacion, sortearReto });
