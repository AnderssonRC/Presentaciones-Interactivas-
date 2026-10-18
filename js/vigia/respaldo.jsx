/* respaldo.jsx — Respaldo de una activación en un archivo, para guardarlo
   donde se quiera (USB, correo…) y llevarlo a otro computador, sin depender
   de Google Drive.

   "<titulo>.vigia.zip" contiene:
     activacion.json     -> la activación completa (marcas, estudiantes, glosario…)
     documento.pdf|epub  -> el archivo del documento (si la activación es de documento)

   Al importarlo, el documento queda guardado EN ESTE COMPUTADOR (copia local,
   ver leerCopiaLocal en pdf.jsx): la plataforma lo encuentra sola desde ahí.

   Exporta: descargarRespaldo(act), leerRespaldo(archivo), importarRespaldo(archivo, existentes),
            <SubirLocal />, <BotonImportarRespaldo /> */

const nombreSeguro = (s) => (String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)) || 'activacion';

// Bytes del documento para el respaldo: copia de este computador o, si no hay, Drive.
function bytesParaRespaldo(act) {
  const info = act.pdf || {};
  return leerCopiaLocal(act.id, info).then((buf) => {
    if (buf) return buf;
    if (info.driveId && DriveAuth.token()) return descargarDrive(info.driveId);
    throw new Error('El documento no está en este computador. Ábrelo una vez aquí (o conecta Drive) y vuelve a descargar el respaldo.');
  });
}

function descargarRespaldo(act) {
  const esDocumento = act.recurso === 'documento' && VigiaTipos.recursoListo(act);
  return cargarJsZip().then((JSZip) => {
    const zip = new JSZip();
    const datos = {
      app: 'Res Cogitans · Modo Vigía', tipo: 'respaldo', formato: 1, creado: new Date().toISOString(),
      activacion: JSON.parse(JSON.stringify(act)),
    };
    zip.file('activacion.json', JSON.stringify(datos, null, 2));
    const conDocumento = esDocumento
      ? bytesParaRespaldo(act).then((buf) => zip.file('documento.' + (act.pdf.formato === 'epub' ? 'epub' : 'pdf'), buf))
      : Promise.resolve();
    return conDocumento.then(() => zip.generateAsync({ type: 'blob' }));
  }).then((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombreSeguro(act.titulo) + '.vigia.zip';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  });
}

// Lee un .vigia.zip: { act, bytes (ArrayBuffer|null), formato ('pdf'|'epub'|null) }.
function leerRespaldo(archivo) {
  return cargarJsZip()
    .then((JSZip) => JSZip.loadAsync(archivo))
    .then((zip) => {
      const json = zip.file('activacion.json');
      if (!json) throw new Error('Ese archivo no es un respaldo del Modo Vigía (falta activacion.json).');
      const doc = zip.file('documento.pdf') || zip.file('documento.epub');
      return Promise.all([json.async('string'), doc ? doc.async('arraybuffer') : null]).then(([txt, bytes]) => {
        const datos = JSON.parse(txt);
        const act = datos && datos.activacion;
        if (!act || !act.id) throw new Error('El respaldo está incompleto.');
        return { act, bytes, formato: doc ? (/\.epub$/.test(doc.name) ? 'epub' : 'pdf') : null };
      });
    })
    .catch((e) => { throw new Error(e.message && /respaldo|activacion/i.test(e.message) ? e.message : 'No se pudo leer el respaldo (¿es un .vigia.zip?).'); });
}

/* Importa un respaldo. Si la activación ya existe en la cuenta, su documento
   queda en este computador y se pregunta si también se reemplazan sus marcas.
   Si no existe, se crea igual que en el respaldo. Devuelve la activación a guardar. */
function importarRespaldo(archivo, existentes) {
  return leerRespaldo(archivo).then(({ act, bytes, formato }) => {
    const guardar = bytes ? guardarCopiaLocal(act.id, bytes) : Promise.resolve();
    return guardar.then(() => {
      const conLocal = (pdf) => (bytes ? { ...(pdf || {}), local: true, formato } : pdf);
      const actual = (existentes || []).find((a) => a.id === act.id);
      if (!actual) return { ...act, clase: 'vigia', pdf: conLocal(act.pdf) };
      const reemplazar = window.confirm(
        '«' + (act.titulo || 'Activación') + '» ya está en tu cuenta.' + (bytes ? ' Su documento quedó guardado en este computador.' : '') +
        '\n\n¿Reemplazar también sus marcas con las del respaldo?\n(Cancelar = conservar las marcas actuales)');
      return reemplazar
        ? { ...act, clase: 'vigia', pdf: conLocal(act.pdf) }
        : { ...actual, pdf: conLocal(actual.pdf) };
    });
  });
}

/* Guardar el documento solo en este computador (sin Drive). Acepta PDF,
   EPUB o un respaldo .vigia.zip (de él toma solo el documento).
   `conservar`: mantiene los datos de Drive que ya tenía (p. ej. cuando Drive
   falla y se usa una copia local de reemplazo). */
function SubirLocal({ act, onListo, texto, conservar }) {
  const input = React.useRef(null);
  const [ocupado, setOcupado] = React.useState(false);
  const [error, setError] = React.useState('');
  const elegir = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setError('');
    const base = conservar ? (act.pdf || {}) : {};
    let tarea;
    if (/\.zip$/i.test(f.name)) {
      tarea = leerRespaldo(f).then(({ act: r, bytes, formato }) => {
        if (!bytes) throw new Error('Ese respaldo no trae documento.');
        return guardarCopiaLocal(act.id, bytes).then(() => ({
          ...base, local: true, formato, nombre: (r.pdf && r.pdf.nombre) || f.name.replace(/\.vigia\.zip$/i, '') + '.' + formato,
        }));
      });
    } else if (/\.(pdf|epub)$/i.test(f.name) || /(pdf|epub)/i.test(f.type)) {
      tarea = f.arrayBuffer().then((buf) => guardarCopiaLocal(act.id, buf)).then(() => ({
        ...base, local: true, nombre: f.name, formato: formatoDeArchivo(f.name, f.type),
      }));
    } else { setError('Elige un PDF, un EPUB o un respaldo .vigia.zip.'); return; }
    setOcupado(true);
    tarea.then((pdf) => onListo(pdf))
      .catch((er) => setError(er.message || 'No se pudo guardar en este computador (¿modo incógnito o sin espacio?).'))
      .finally(() => setOcupado(false));
  };
  return (
    <div>
      <input ref={input} type="file" accept=".pdf,.epub,.zip,application/pdf,application/epub+zip,application/zip" style={{ display: 'none' }} onChange={elegir} />
      <button className="btn" onClick={() => input.current && input.current.click()} disabled={ocupado}>
        <Icon name="tv" size={15} /> {ocupado ? 'Guardando…' : (texto || 'Guardar solo en este computador')}
      </button>
      {error && <div style={{ color: 'var(--naranja-ink)', fontSize: 13.5, marginTop: 8 }}>{error}</div>}
    </div>
  );
}

/* Botón "Importar respaldo" (dashboard del Modo Vigía). */
function BotonImportarRespaldo({ existentes, onImportado, onAviso }) {
  const input = React.useRef(null);
  const [ocupado, setOcupado] = React.useState(false);
  const elegir = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    setOcupado(true);
    importarRespaldo(f, existentes)
      .then((act) => { onImportado(act); if (onAviso) onAviso('Respaldo importado: «' + (act.titulo || 'Activación') + '». Su documento quedó en este computador.'); })
      .catch((er) => { if (onAviso) onAviso(er.message); else window.alert(er.message); })
      .finally(() => setOcupado(false));
  };
  return (
    <React.Fragment>
      <input ref={input} type="file" accept=".zip,application/zip" style={{ display: 'none' }} onChange={elegir} />
      <button className="btn" onClick={() => input.current && input.current.click()} disabled={ocupado}
        title="Traer una activación desde un archivo .vigia.zip (de otro computador)">
        <Icon name="mas" size={15} /> {ocupado ? 'Importando…' : 'Importar respaldo'}
      </button>
    </React.Fragment>
  );
}

/* Enlace "Descargar respaldo" con su propio estado y aviso de error. */
function BotonRespaldo({ act, compacto }) {
  const [ocupado, setOcupado] = React.useState(false);
  const bajar = () => {
    setOcupado(true);
    descargarRespaldo(act).catch((e) => window.alert(e.message || 'No se pudo crear el respaldo.')).finally(() => setOcupado(false));
  };
  return compacto ? (
    <button className="btn btn-sm" onClick={bajar} disabled={ocupado} title="Descargar respaldo (.vigia.zip): documento + marcas, para llevar a otro computador">
      {ocupado ? '…' : '⤓'}
    </button>
  ) : (
    <button className="vg-btn-texto" onClick={bajar} disabled={ocupado}
      title="Documento + marcas en un archivo .vigia.zip, para guardarlo o llevarlo a otro computador">
      {ocupado ? 'Preparando respaldo…' : 'Descargar respaldo'}
    </button>
  );
}

Object.assign(window, { descargarRespaldo, leerRespaldo, importarRespaldo, SubirLocal, BotonImportarRespaldo, BotonRespaldo });
