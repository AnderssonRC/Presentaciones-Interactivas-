/* audio.jsx — Reproductores del Podcast (Modo Vigía).
   Fuentes que se pueden pegar (resolverPodcast las reconoce):
     · YouTube ............ reproductor de YouTube, tapado por la imagen
     · Spotify (episodio) . Embed de Spotify con su iFrame API (sin volumen propio)
     · SoundCloud ......... Widget de SoundCloud con su API
     · Apple Podcasts ..... se busca el MP3 del episodio en la API pública de iTunes
     · iVoox .............. enlace del episodio -> su MP3 directo
     · Internet Archive ... página del ítem -> primer MP3 (API de metadatos)
     · Google Drive / Dropbox compartidos, o cualquier enlace directo .mp3/.m4a/.ogg
   Todas terminan en una de estas fuentes: 'youtube' | 'spotify' | 'soundcloud' | 'audio'.
     · resolverPodcast(url) -> Promise<{ url, fuente, id?, src, portada?, titulo? }>
     · urlImagen(url), imagenPodcast(p), imagenEn(p, t)
     · useAudio / useSpotify / useSoundCloud: misma forma que useYouTube
     · usePodcast(p, vars)  -> el reproductor que corresponda a `p.fuente` */

const DRIVE_ID = /drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:.*&)?id=)([\w-]{10,})/i;

// JSONP (la API de iTunes no deja leerla con fetch desde otra página).
function jsonp(url, ms) {
  return new Promise((resolve, reject) => {
    const nombre = '__vgJsonp' + Math.random().toString(36).slice(2);
    const s = document.createElement('script');
    const fin = () => { delete window[nombre]; s.remove(); clearTimeout(reloj); };
    const reloj = setTimeout(() => { fin(); reject(new Error('tiempo')); }, ms || 12000);
    window[nombre] = (datos) => { fin(); resolve(datos); };
    s.onerror = () => { fin(); reject(new Error('red')); };
    s.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + nombre;
    document.head.appendChild(s);
  });
}

// Portada automática (oEmbed). Si falla, no pasa nada: se usa otra imagen.
function portadaOEmbed(url) {
  return fetch(url).then((r) => (r.ok ? r.json() : {})).then((d) => ({ portada: d.thumbnail_url || '', titulo: d.title || '' })).catch(() => ({}));
}

function resolverPodcast(url) {
  const s = String(url || '').trim();
  const falla = (m) => Promise.reject(new Error(m));
  if (!s) return falla('Pega el enlace del podcast.');
  const base = { url: s };

  const yt = idDeYouTube(s);
  if (yt) return Promise.resolve({ ...base, fuente: 'youtube', id: yt, src: s });

  // Spotify: open.spotify.com/episode/ID (también /intl-es/episode/ID).
  if (/spotify\.com/i.test(s)) {
    const m = s.match(/spotify\.com\/(?:intl-[\w-]+\/)?(?:embed\/)?episode\/([A-Za-z0-9]{22})/i) || s.match(/^spotify:episode:([A-Za-z0-9]{22})$/i);
    if (!m) return falla('Ese enlace de Spotify no es de un episodio. En Spotify: ⋯ del episodio → Compartir → Copiar enlace del episodio.');
    const datos = { ...base, fuente: 'spotify', id: m[1], src: 'spotify:episode:' + m[1] };
    return portadaOEmbed('https://open.spotify.com/oembed?url=' + encodeURIComponent('https://open.spotify.com/episode/' + m[1]))
      .then((o) => ({ ...datos, ...o }));
  }

  // SoundCloud: la dirección de la pista (no los enlaces cortos on.soundcloud.com).
  if (/soundcloud\.com/i.test(s)) {
    if (/on\.soundcloud\.com/i.test(s)) return falla('Abre el enlace corto en el navegador y copia la dirección completa (soundcloud.com/usuario/pista).');
    const limpio = s.split('?')[0];
    return portadaOEmbed('https://soundcloud.com/oembed?format=json&url=' + encodeURIComponent(limpio))
      .then((o) => ({ ...base, fuente: 'soundcloud', src: limpio, ...o }));
  }

  // Apple Podcasts: .../id<programa>?i=<episodio>  ->  episodeUrl (MP3) de la API de iTunes.
  if (/podcasts\.apple\.com|itunes\.apple\.com/i.test(s)) {
    const prog = s.match(/\/id(\d+)/), ep = s.match(/[?&]i=(\d+)/);
    if (!prog || !ep) return falla('Ese enlace de Apple Podcasts es del programa, no de un episodio. Abre el episodio y usa Compartir → Copiar enlace.');
    return jsonp('https://itunes.apple.com/lookup?id=' + prog[1] + '&entity=podcastEpisode&limit=200')
      .catch(() => { throw new Error('No se pudo consultar Apple Podcasts. Revisa tu conexión e inténtalo de nuevo.'); })
      .then((r) => {
        const e = (r.results || []).find((x) => String(x.trackId) === ep[1]);
        if (!e || !e.episodeUrl) throw new Error('Apple no entregó ese episodio (solo da los 200 más recientes). Prueba con el enlace del mismo episodio en otra plataforma.');
        return { ...base, fuente: 'audio', src: e.episodeUrl, portada: e.artworkUrl600 || '', titulo: e.trackName || '' };
      });
  }

  // iVoox: ..._rf_<id>_1.html  ->  listen_mn_<id>_1.mp3
  const ivoox = s.match(/ivoox\.com\/.*_(?:rf|mn|md)_(\d+)_1/i);
  if (ivoox) return Promise.resolve({ ...base, fuente: 'audio', src: 'https://www.ivoox.com/listen_mn_' + ivoox[1] + '_1.mp3' });

  // Internet Archive: archive.org/details/<ítem>  ->  primer MP3 del ítem.
  const ia = s.match(/archive\.org\/details\/([^/?#]+)/i);
  if (ia) {
    return fetch('https://archive.org/metadata/' + ia[1]).then((r) => r.json()).then((d) => {
      const f = (d.files || []).find((x) => /\.mp3$/i.test(x.name)) || (d.files || []).find((x) => /\.(m4a|ogg|opus|wav)$/i.test(x.name));
      if (!f) throw new Error('Ese ítem de Internet Archive no tiene audio.');
      return {
        ...base, fuente: 'audio', src: 'https://archive.org/download/' + ia[1] + '/' + f.name.split('/').map(encodeURIComponent).join('/'),
        portada: 'https://archive.org/services/img/' + ia[1], titulo: (d.metadata && d.metadata.title) || '',
      };
    }, () => { throw new Error('No se pudo consultar Internet Archive. Revisa tu conexión.'); });
  }

  if (!/^https?:\/\//i.test(s)) return falla('El enlace debe empezar por https://');
  const drive = s.match(DRIVE_ID);
  if (drive) return Promise.resolve({ ...base, fuente: 'audio', src: 'https://drive.google.com/uc?export=download&id=' + drive[1] });
  if (/dropbox\.com/i.test(s)) {
    const src = /[?&]dl=\d/.test(s) ? s.replace(/([?&])dl=\d/, '$1raw=1') : s + (s.includes('?') ? '&' : '?') + 'raw=1';
    return Promise.resolve({ ...base, fuente: 'audio', src });
  }
  return Promise.resolve({ ...base, fuente: 'audio', src: s });
}

// Nombre de la plataforma (para avisos en el editor).
function plataformaPodcast(url) {
  const s = String(url || '');
  if (idDeYouTube(s)) return 'YouTube';
  const lista = [[/spotify/i, 'Spotify'], [/soundcloud/i, 'SoundCloud'], [/apple\.com/i, 'Apple Podcasts'], [/ivoox/i, 'iVoox'],
    [/archive\.org/i, 'Internet Archive'], [/drive\.google/i, 'Google Drive'], [/dropbox/i, 'Dropbox']];
  const p = lista.find(([re]) => re.test(s));
  return p ? p[1] : (/^https?:\/\//i.test(s) ? 'archivo de audio' : '');
}

// Imagen por URL. Los enlaces compartidos de Google Drive se cambian por su
// miniatura grande (la página de Drive no es una imagen).
function urlImagen(url) {
  const s = String(url || '').trim();
  const drive = s.match(DRIVE_ID);
  if (drive) return 'https://drive.google.com/thumbnail?id=' + drive[1] + '&sz=w1600';
  return s;
}

// Imagen inicial: la del docente, la portada de la plataforma o la miniatura de YouTube.
function imagenPodcast(p) {
  if (!p) return '';
  if (p.imagen) return urlImagen(p.imagen);
  if (p.portada) return p.portada;
  if (p.fuente === 'youtube' && p.id) return 'https://img.youtube.com/vi/' + p.id + '/hqdefault.jpg';
  return '';
}

// Imágenes que cambian durante el podcast: { id, t, url, fin?, tam? }, en
// orden de tiempo. `fin`: segundo en que termina (si no, sigue hasta la
// siguiente). `tam`: tamaño en % del espacio disponible (TAM_IMAGEN por defecto).
const TAM_IMAGEN = 90;
function imagenesDe(p) {
  return ((p && p.imagenes) || []).slice().sort((a, b) => a.t - b.t);
}
// Lo que se ve en el segundo `t`: { clave, imagenes: [{ id, src, tam }] }.
// Las imágenes del ÚLTIMO segundo ya alcanzado (pueden ser varias en el mismo
// segundo: se muestran juntas, lado a lado), sin las que ya terminaron. Si no
// queda ninguna, la imagen inicial (id null).
function imagenEn(p, t) {
  const llegadas = imagenesDe(p).filter((x) => x.url && x.t <= t + 0.3);
  let grupo = [];
  if (llegadas.length) {
    const ultimo = Math.round(llegadas[llegadas.length - 1].t);
    grupo = llegadas.filter((x) => Math.round(x.t) === ultimo && !(typeof x.fin === 'number' && t >= x.fin));
  }
  if (grupo.length) {
    return { clave: grupo.map((x) => x.id).join('|'), imagenes: grupo.map((x) => ({ id: x.id, src: urlImagen(x.url), tam: x.tam || TAM_IMAGEN })) };
  }
  return { clave: 'inicial', imagenes: [{ id: null, src: imagenPodcast(p), tam: (p && p.imagenTam) || TAM_IMAGEN }] };
}
// Cambia el tamaño de las imágenes `ids` (una o varias; null = la inicial).
// Devuelve el podcast nuevo.
function conTamImagen(p, ids, tam) {
  const n = Math.max(20, Math.min(100, Math.round(tam)));
  const lista = Array.isArray(ids) ? ids : [ids];
  const res = { ...p, imagenes: (p.imagenes || []).map((x) => (lista.includes(x.id) ? { ...x, tam: n } : x)) };
  if (lista.includes(null)) res.imagenTam = n;
  return res;
}

/* ---------- Audio HTML (MP3, iVoox, Apple, Drive…) ---------- */
function useAudio(src) {
  const montaje = React.useRef(null);   // sin uso: el audio no se ve
  const audio = React.useRef(null);
  const [listo, setListo] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tiempo, setTiempo] = React.useState(0);
  const [duracion, setDuracion] = React.useState(0);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [volumen, setVolumenEstado] = React.useState(100);
  const [silencio, setSilencio] = React.useState(false);

  React.useEffect(() => {
    setListo(false); setError(null); setTiempo(0); setDuracion(0); setReproduciendo(false);
    if (!src) return;
    const a = new Audio();
    a.preload = 'auto';
    audio.current = a;
    const onMeta = () => { setDuracion(isFinite(a.duration) ? a.duration : 0); setListo(true); };
    const onPlay = () => setReproduciendo(true);
    const onPause = () => setReproduciendo(false);
    const onError = () => setError('No se pudo cargar el audio. Revisa que el enlace sea público y que lleve directo al archivo (.mp3, .m4a, .ogg…).');
    const onDur = () => { if (isFinite(a.duration)) setDuracion(a.duration); };
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('durationchange', onDur);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onPause);
    a.addEventListener('error', onError);
    a.src = src;
    const iv = setInterval(() => {
      setTiempo(a.currentTime || 0);
      setVolumenEstado(Math.round(a.volume * 100)); setSilencio(a.muted);
    }, 250);
    return () => {
      clearInterval(iv);
      a.pause();
      a.removeAttribute('src');
      try { a.load(); } catch (e) { /* ya no existe */ }
      audio.current = null;
    };
  }, [src]);

  const play = React.useCallback(() => {
    const a = audio.current;
    if (a) { const r = a.play(); if (r && r.catch) r.catch(() => {}); }
  }, []);
  const pause = React.useCallback(() => { if (audio.current) audio.current.pause(); }, []);
  const seek = React.useCallback((t) => {
    const a = audio.current;
    if (!a) return;
    const destino = Math.max(0, Math.min(isFinite(a.duration) ? a.duration : t, t));
    a.currentTime = destino;
    setTiempo(destino);
  }, []);
  const setVolumen = React.useCallback((v) => {
    const a = audio.current;
    if (!a) return;
    const n = Math.max(0, Math.min(100, Math.round(v)));
    a.volume = n / 100;
    if (n > 0) a.muted = false;
    setVolumenEstado(n); setSilencio(a.muted);
  }, []);
  const alternarSilencio = React.useCallback(() => {
    const a = audio.current;
    if (!a) return;
    a.muted = !a.muted; setSilencio(a.muted);
  }, []);

  return {
    montaje, listo, error, tiempo, duracion, reproduciendo, play, pause, seek, videoActual: sinVideo,
    volumen, silencio, setVolumen, alternarSilencio, subtitulos: nada, tamanoSubtitulos: nada, conVolumen: true,
  };
}
function nada() {}
function sinVideo() { return null; }

// Carga un script externo una sola vez.
const scriptsCargados = {};
function cargarScript(src, listo) {
  if (!scriptsCargados[src]) {
    scriptsCargados[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => (listo ? null : resolve());
      s.onerror = () => { delete scriptsCargados[src]; reject(new Error('No se pudo cargar ' + src)); };
      if (listo) listo(resolve);
      document.head.appendChild(s);
    });
  }
  return scriptsCargados[src];
}

/* ---------- Spotify (iFrame API del Embed) ----------
   Da posición, duración, reproducir, pausar y saltar (segundos enteros).
   No permite cambiar el volumen: se usa el del computador. */
function cargarApiSpotify() {
  if (window.__vgSpotifyApi) return Promise.resolve(window.__vgSpotifyApi);
  return cargarScript('https://open.spotify.com/embed/iframe-api/v1', (resolve) => {
    const previo = window.onSpotifyIframeApiReady;
    window.onSpotifyIframeApiReady = (api) => { if (previo) previo(api); window.__vgSpotifyApi = api; resolve(api); };
  }).then(() => window.__vgSpotifyApi);
}

function useSpotify(uri) {
  const montaje = React.useRef(null);
  const ctrl = React.useRef(null);
  const iniciado = React.useRef(false);   // play() solo la primera vez; luego resume()
  const pendiente = React.useRef(null);    // salto pedido antes de empezar
  const [listo, setListo] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tiempo, setTiempo] = React.useState(0);
  const [duracion, setDuracion] = React.useState(0);
  const [reproduciendo, setReproduciendo] = React.useState(false);

  React.useEffect(() => {
    setListo(false); setError(null); setTiempo(0); setDuracion(0); setReproduciendo(false);
    iniciado.current = false; pendiente.current = null;
    if (!uri || !montaje.current) return;
    let vivo = true;
    const nodo = document.createElement('div');
    montaje.current.innerHTML = '';
    montaje.current.appendChild(nodo);
    const espera = setTimeout(() => { if (vivo) setError('Spotify no respondió. Revisa tu conexión o que el episodio sea público.'); }, 20000);
    cargarApiSpotify().then((api) => {
      if (!vivo) return;
      api.createController(nodo, { uri, width: '100%', height: '100%' }, (c) => {
        if (!vivo) { try { c.destroy(); } catch (e) { /* */ } return; }
        ctrl.current = c;
        c.addListener('ready', () => { if (vivo) { clearTimeout(espera); setListo(true); } });
        c.addListener('playback_update', (e) => {
          if (!vivo || !e || !e.data) return;
          const d = e.data;
          if (d.duration) setDuracion(d.duration / 1000);
          if (pendiente.current === null) setTiempo((d.position || 0) / 1000);
          setReproduciendo(!d.isPaused);
        });
      });
    }).catch(() => { if (vivo) setError('No se pudo cargar el reproductor de Spotify.'); });
    return () => {
      vivo = false; clearTimeout(espera);
      try { if (ctrl.current) ctrl.current.destroy(); } catch (e) { /* ya no existe */ }
      ctrl.current = null;
    };
  }, [uri]);

  const play = React.useCallback(() => {
    const c = ctrl.current;
    if (!c) return;
    if (!iniciado.current) {
      iniciado.current = true;
      c.play();
      const t = pendiente.current;
      if (t !== null) setTimeout(() => { c.seek(Math.round(t)); pendiente.current = null; }, 900);
    } else c.resume();
  }, []);
  const pause = React.useCallback(() => { if (ctrl.current) ctrl.current.pause(); }, []);
  const seek = React.useCallback((t) => {
    const destino = Math.max(0, Math.round(t));
    setTiempo(destino);
    if (!ctrl.current) return;
    if (!iniciado.current) { pendiente.current = destino; return; }
    ctrl.current.seek(destino);
  }, []);

  return {
    montaje, listo, error, tiempo, duracion, reproduciendo, play, pause, seek, videoActual: sinVideo,
    volumen: 100, silencio: false, setVolumen: nada, alternarSilencio: nada, subtitulos: nada, tamanoSubtitulos: nada, conVolumen: false,
  };
}

/* ---------- SoundCloud (Widget API) ---------- */
function cargarApiSoundCloud() {
  if (window.SC && window.SC.Widget) return Promise.resolve(window.SC);
  return cargarScript('https://w.soundcloud.com/player/api.js').then(() => window.SC);
}

function useSoundCloud(url) {
  const montaje = React.useRef(null);
  const widget = React.useRef(null);
  const volPrevio = React.useRef(100);
  const [listo, setListo] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tiempo, setTiempo] = React.useState(0);
  const [duracion, setDuracion] = React.useState(0);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [volumen, setVolumenEstado] = React.useState(100);

  React.useEffect(() => {
    setListo(false); setError(null); setTiempo(0); setDuracion(0); setReproduciendo(false);
    if (!url || !montaje.current) return;
    let vivo = true;
    const ifr = document.createElement('iframe');
    ifr.allow = 'autoplay';
    ifr.src = 'https://w.soundcloud.com/player/?url=' + encodeURIComponent(url) + '&auto_play=false&visual=true&show_comments=false&show_related=false';
    montaje.current.innerHTML = '';
    montaje.current.appendChild(ifr);
    const espera = setTimeout(() => { if (vivo) setError('SoundCloud no respondió. Revisa que la pista sea pública y que el enlace sea el de la pista.'); }, 20000);
    let iv = null;
    cargarApiSoundCloud().then((SC) => {
      if (!vivo) return;
      const w = SC.Widget(ifr);
      widget.current = w;
      const E = SC.Widget.Events;
      w.bind(E.READY, () => {
        if (!vivo) return;
        clearTimeout(espera); setListo(true);
        w.getDuration((ms) => vivo && setDuracion((ms || 0) / 1000));
        w.getVolume((v) => vivo && setVolumenEstado(Math.round(v)));
        // La posición también se consulta en pausa (después de un salto).
        iv = setInterval(() => w.getPosition((ms) => vivo && setTiempo((ms || 0) / 1000)), 250);
      });
      w.bind(E.PLAY, () => vivo && setReproduciendo(true));
      w.bind(E.PAUSE, () => vivo && setReproduciendo(false));
      w.bind(E.FINISH, () => vivo && setReproduciendo(false));
      w.bind(E.ERROR, () => vivo && setError('SoundCloud no deja reproducir esta pista aquí.'));
    }).catch(() => { if (vivo) setError('No se pudo cargar el reproductor de SoundCloud.'); });
    return () => { vivo = false; clearTimeout(espera); clearInterval(iv); widget.current = null; ifr.remove(); };
  }, [url]);

  const play = React.useCallback(() => { if (widget.current) widget.current.play(); }, []);
  const pause = React.useCallback(() => { if (widget.current) widget.current.pause(); }, []);
  const seek = React.useCallback((t) => {
    const destino = Math.max(0, t);
    setTiempo(destino);
    if (widget.current) widget.current.seekTo(destino * 1000);
  }, []);
  const setVolumen = React.useCallback((v) => {
    const n = Math.max(0, Math.min(100, Math.round(v)));
    if (widget.current) widget.current.setVolume(n);
    if (n > 0) volPrevio.current = n;
    setVolumenEstado(n);
  }, []);
  const alternarSilencio = React.useCallback(() => {
    setVolumenEstado((v) => {
      const n = v > 0 ? 0 : (volPrevio.current || 100);
      if (v > 0) volPrevio.current = v;
      if (widget.current) widget.current.setVolume(n);
      return n;
    });
  }, []);

  return {
    montaje, listo, error, tiempo, duracion, reproduciendo, play, pause, seek, videoActual: sinVideo,
    volumen, silencio: volumen === 0, setVolumen, alternarSilencio, subtitulos: nada, tamanoSubtitulos: nada, conVolumen: true,
  };
}

/* Todos los reproductores se crean siempre (las reglas de React no dejan
   llamar hooks según una condición); los que no se usan reciben null y no
   hacen nada. `fuente` dice cuál está activo; `montaje` es el del activo
   (el <div> donde se ve su reproductor, tapado por la imagen). */
const NOMBRE_FUENTE = { youtube: 'YouTube', spotify: 'Spotify', soundcloud: 'SoundCloud', audio: '' };
function usePodcast(p, playerVars) {
  const f = p && (p.fuente === 'youtube' ? (p.id && 'youtube') : (p.src && p.fuente));
  const yt = useYouTube(f === 'youtube' ? p.id : null, playerVars);
  const sp = useSpotify(f === 'spotify' ? p.src : null);
  const sc = useSoundCloud(f === 'soundcloud' ? p.src : null);
  const au = useAudio(f === 'audio' ? p.src : null);
  const activo = f === 'youtube' ? Object.assign({}, yt, { conVolumen: true }) : f === 'spotify' ? sp : f === 'soundcloud' ? sc : Object.assign({}, au, { montaje: yt.montaje });
  return Object.assign(activo, {
    fuente: f || 'audio', esYouTube: f === 'youtube',
    // Nombre del reproductor que se puede destapar ("Ver YouTube", "Ver Spotify"…).
    reproductorVisible: NOMBRE_FUENTE[f] || '',
  });
}

Object.assign(window, { resolverPodcast, plataformaPodcast, urlImagen, imagenPodcast, TAM_IMAGEN, imagenesDe, imagenEn, conTamImagen, useAudio, useSpotify, useSoundCloud, usePodcast });
