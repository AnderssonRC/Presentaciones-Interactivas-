/* nucleo.js — Registro y cargador de las actividades interactivas.

   Cada actividad vive en su propia carpeta js/actividades/<id>/ con dos archivos:
     meta.js   -> datos (nombre, color, grupo, config por defecto, guía/ejemplo…).
                  Es JS plano y pequeño: se carga al inicio desde index.html,
                  porque el editor necesita el catálogo completo.
     <id>.jsx  -> el código React (Run = la actividad en Presentar y, si la
                  tiene, Editor = su panel de configuración propio). Se carga
                  BAJO DEMANDA (Actividades.cargar) la primera vez que se usa:
                  así la página no compila de entrada el código de las 36
                  actividades, solo el de las que se van a mostrar.

   El .jsx se compila con Babel (el mismo que ya carga index.html) y corre
   dentro de una función: sus nombres internos no chocan con los de otras
   actividades. Lo que necesite compartir lo toma de comun.jsx (global) y lo
   que entrega lo registra con Actividades.definir(id, { Run, Editor }).

   Ver js/actividades/LEEME.md para agregar o modificar una actividad. */
(function () {
  const BASE = 'js/actividades/';

  // Grupos de Interacciones del editor (columna derecha). Cada actividad
  // indica en su meta.js a qué grupo pertenece (`grupo`) y en qué posición
  // (`orden`, menor = más arriba).
  const GRUPOS = [
    { id: 'cognitivos',  nombre: 'Activadores Cognitivos',  desc: 'Despiertan el pensamiento y el ingenio',            color: '#116CF5', icon: 'bulb' },
    { id: 'evaluadoras', nombre: 'Pausas Evaluadoras',      desc: 'Comprueban y consolidan lo aprendido',              color: '#11F555', icon: 'check' },
    { id: 'equipos',     nombre: 'Competencia por Equipos', desc: 'Solo en Modo Equipos: reparten puntos al marcador', color: '#F5C211', icon: 'trofeo' },
  ];

  const metas = [];          // en orden de registro (orden de los <script> en index.html)
  const porId = {};
  const modulos = {};        // id -> { Run, Editor } ya cargados
  const cargando = {};       // id -> Promise en curso
  const VACIO = Object.freeze({});

  /* Lo llama cada meta.js. Campos:
       id, nombre, desc, color, icon        -> catálogo (lo que antes era AIP.TOOLS)
       grupo, orden                          -> ubicación en el editor
       pronto: true                          -> "Próximamente": visible pero no se puede añadir
       version                               -> versión del <id>.jsx (súbela al editarlo, para la caché)
       sinCodigo: true                       -> no tiene <id>.jsx (usa la ficha genérica)
       config(base)                          -> ajusta la config por defecto al añadirla (muta `base`)
       campos: { label, hint }               -> textarea genérico de "elementos" del editor
       editorPropio: true                    -> el <id>.jsx trae su propio Editor (reemplaza el textarea)
       tiempoSiempre: true                   -> sin `tiempoActivo` guardado, el tiempo va encendido
       timerPropio: true                     -> ya muestra su cronómetro: Presentar no añade el pequeño
       guia: { que, comoVe, formato, ejemplo } -> tarjeta "Cómo funciona" + "Usar este ejemplo" */
  function registrar(meta) {
    if (!meta || !meta.id) { console.error('[actividades] meta sin id', meta); return; }
    if (porId[meta.id]) { console.warn('[actividades] id repetido:', meta.id); return; }
    metas.push(meta);
    porId[meta.id] = meta;
  }

  function meta(id) { return porId[id] || null; }
  function todas() { return metas.slice(); }

  function delGrupo(grupoId) {
    return metas
      .filter((m) => m.grupo === grupoId)
      .sort((a, b) => (a.orden || 0) - (b.orden || 0));
  }

  // ¿Tiene archivo de código para cargar?
  function tieneCodigo(id) {
    const m = porId[id];
    return !!(m && !m.pronto && !m.sinCodigo);
  }

  // Lo llama cada <id>.jsx al terminar de ejecutarse.
  function definir(id, modulo) { modulos[id] = modulo || VACIO; }

  // Módulo ya disponible (sin esperar). Las actividades sin código devuelven
  // un módulo vacío: quien lo use cae a la ficha genérica (FichaRun).
  function modulo(id) {
    if (!tieneCodigo(id)) return VACIO;
    return modulos[id] || null;
  }

  function urlDe(id) {
    const m = porId[id];
    return BASE + id + '/' + id + '.jsx' + (m && m.version ? '?v=' + m.version : '');
  }

  // Descarga, compila (JSX) y ejecuta un archivo dentro de una función
  // aislada. Lo usan las actividades y también el Modo Vigía (js/vigia.jsx).
  function ejecutarJSX(url) {
    return fetch(url)
      .then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status + ' al cargar ' + url); return r.text(); })
      .then((src) => {
        if (!window.Babel) throw new Error('Babel no está disponible para compilar ' + url);
        const code = window.Babel.transform(src, { presets: ['react'], sourceType: 'script', filename: url }).code;
        // sourceURL: en las herramientas del navegador el archivo aparece con su nombre real.
        new Function(code + '\n//# sourceURL=' + url)();
      });
  }

  // Descarga, compila y ejecuta <id>.jsx una sola vez. Devuelve Promise<modulo>.
  function cargar(id) {
    const ya = modulo(id);
    if (ya) return Promise.resolve(ya);
    if (cargando[id]) return cargando[id];
    const url = urlDe(id);
    const p = ejecutarJSX(url)
      .then(() => {
        if (!modulos[id]) throw new Error(url + ' no llamó a Actividades.definir("' + id + '", …)');
        return modulos[id];
      })
      .catch((e) => { delete cargando[id]; console.error('[actividades]', e); throw e; })
      .then((m) => { delete cargando[id]; return m; });
    cargando[id] = p;
    return p;
  }

  // Carga varias en segundo plano, una tras otra (para no trabar la pantalla).
  function precargar(ids) {
    const unicos = Array.from(new Set(ids || [])).filter((id) => tieneCodigo(id) && !modulos[id]);
    return unicos.reduce((cadena, id) => cadena.then(() => cargar(id).catch(() => null)), Promise.resolve());
  }

  window.Actividades = {
    GRUPOS, registrar, meta, todas, delGrupo, tieneCodigo,
    definir, modulo, cargar, precargar, ejecutarJSX,
  };
})();
