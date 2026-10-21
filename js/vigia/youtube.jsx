/* youtube.jsx — Reproductor de YouTube para el Modo Vigía.
   Usa la API oficial del iframe (https://www.youtube.com/iframe_api), que
   permite saber el segundo exacto, pausar, reproducir y saltar.
     · idDeYouTube(url)          -> id de 11 caracteres o null
     · useYouTube(videoId, vars) -> { montaje, listo, tiempo, duracion, reproduciendo, play, pause, seek, videoActual,
                                      volumen, silencio, setVolumen, alternarSilencio, subtitulos, tamanoSubtitulos }
   `montaje` es un ref para el <div> donde se monta el iframe. */

// Acepta: youtube.com/watch?v=ID, youtu.be/ID, /embed/ID, /shorts/ID, /live/ID o el ID solo.
function idDeYouTube(url) {
  const s = String(url || '').trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{11})/i);
  return m ? m[1] : null;
}

// Carga la API del iframe una sola vez.
let promesaYT = null;
function cargarApiYouTube() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (!promesaYT) {
    promesaYT = new Promise((resolve, reject) => {
      const previo = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { if (previo) previo(); resolve(window.YT); };
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.onerror = () => { promesaYT = null; reject(new Error('No se pudo cargar YouTube')); };
      document.head.appendChild(s);
    });
  }
  return promesaYT;
}

function useYouTube(videoId, playerVars) {
  const montaje = React.useRef(null);
  const player = React.useRef(null);
  const [listo, setListo] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [tiempo, setTiempo] = React.useState(0);
  const [duracion, setDuracion] = React.useState(0);
  const [reproduciendo, setReproduciendo] = React.useState(false);
  const [volumen, setVolumenEstado] = React.useState(100);   // 0–100
  const [silencio, setSilencio] = React.useState(false);

  React.useEffect(() => {
    if (!videoId || !montaje.current) return;
    let vivo = true;
    setListo(false); setError(null); setTiempo(0); setDuracion(0); setReproduciendo(false);
    // El iframe reemplaza al nodo donde se monta: se usa un hijo creado a mano
    // para que React no pierda el control de `montaje`.
    const nodo = document.createElement('div');
    montaje.current.innerHTML = '';
    montaje.current.appendChild(nodo);
    cargarApiYouTube().then((YT) => {
      if (!vivo) return;
      player.current = new YT.Player(nodo, {
        videoId, width: '100%', height: '100%',
        playerVars: Object.assign({ rel: 0, modestbranding: 1, playsinline: 1 }, playerVars || {}),
        events: {
          onReady: (e) => { if (!vivo) return; setListo(true); setDuracion(e.target.getDuration() || 0); },
          onStateChange: (e) => {
            if (!vivo) return;
            setReproduciendo(e.data === YT.PlayerState.PLAYING);
            const d = e.target.getDuration && e.target.getDuration();
            if (d) setDuracion(d);
          },
          onError: () => { if (vivo) setError('YouTube no permite reproducir este video aquí (puede estar privado o con la inserción desactivada).'); },
        },
      });
    }).catch((e) => { if (vivo) setError(e.message); });
    return () => {
      vivo = false;
      try { if (player.current && player.current.destroy) player.current.destroy(); } catch (e) { /* ya no existe */ }
      player.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // Salto pedido que YouTube aún no ha aplicado: { t, hasta, reintento }.
  // Justo después de seekTo, getCurrentTime() puede seguir dando el tiempo
  // ANTERIOR (o YouTube puede ignorar el salto): mientras tanto se muestra el
  // tiempo pedido y, si no llega, se repite la orden una vez.
  const saltoPendiente = React.useRef(null);

  // Tiempo actual: se consulta 4 veces por segundo mientras está listo.
  // También el volumen (por si se cambia con los controles de YouTube).
  React.useEffect(() => {
    if (!listo) return;
    const iv = setInterval(() => {
      const p = player.current;
      if (p && p.getCurrentTime) {
        let actual = p.getCurrentTime() || 0;
        const s = saltoPendiente.current;
        if (s) {
          if (Math.abs(actual - s.t) <= 1.5) saltoPendiente.current = null;          // ya llegó
          else if (Date.now() < s.hasta) {
            if (!s.reintento && Date.now() > s.hasta - 1400) { s.reintento = true; try { p.seekTo(s.t, true); } catch (e) { /* */ } }
            actual = s.t;                                                            // se muestra el pedido
          } else saltoPendiente.current = null;                                      // se rinde: tiempo real
        }
        setTiempo(actual);
      }
      if (p && p.getVolume) { setVolumenEstado(p.getVolume()); setSilencio(p.isMuted()); }
    }, 250);
    return () => clearInterval(iv);
  }, [listo]);

  // --- Volumen (0–100) y silencio ---
  const setVolumen = React.useCallback((v) => {
    const p = player.current;
    if (!p || !p.setVolume) return;
    const n = Math.max(0, Math.min(100, Math.round(v)));
    p.setVolume(n);
    if (n > 0 && p.isMuted()) p.unMute();
    setVolumenEstado(n); setSilencio(n === 0 ? p.isMuted() : false);
  }, []);
  const alternarSilencio = React.useCallback(() => {
    const p = player.current;
    if (!p || !p.isMuted) return;
    if (p.isMuted()) { p.unMute(); setSilencio(false); } else { p.mute(); setSilencio(true); }
  }, []);

  /* --- Subtítulos ---
     La API del iframe no los documenta, pero el reproductor acepta el módulo
     "captions": cargarlo los muestra, descargarlo los oculta, y fontSize va de
     -1 (pequeño) a 3 (muy grande). Su POSICIÓN y su COLOR no se pueden fijar
     desde fuera: la posición, arrastrándolos dentro del reproductor (si YouTube
     lo permite); el color, en ⚙ Configuración → Subtítulos → Opciones del
     propio reproductor (YouTube lo guarda en ese navegador). */
  const subtitulos = React.useCallback((encender) => {
    const p = player.current;
    if (!p || !p.loadModule) return;
    try { if (encender) p.loadModule('captions'); else p.unloadModule('captions'); } catch (e) { /* sin subtítulos */ }
  }, []);
  const tamanoSubtitulos = React.useCallback((n) => {
    const p = player.current;
    if (!p || !p.setOption) return;
    try { p.setOption('captions', 'fontSize', Math.max(-1, Math.min(3, n))); } catch (e) { /* sin subtítulos */ }
  }, []);

  const play = React.useCallback(() => { const p = player.current; if (p && p.playVideo) p.playVideo(); }, []);
  const pause = React.useCallback(() => { const p = player.current; if (p && p.pauseVideo) p.pauseVideo(); }, []);
  const seek = React.useCallback((t) => {
    const p = player.current;
    if (!p || !p.seekTo) return;
    const destino = Math.max(0, t);
    p.seekTo(destino, true);
    setTiempo(destino);
    saltoPendiente.current = { t: destino, hasta: Date.now() + 2200, reintento: false };
  }, []);

  // Id del video que está sonando ahora (durante un anuncio puede ser otro).
  const videoActual = React.useCallback(() => {
    const p = player.current;
    try { return p && p.getVideoData ? (p.getVideoData() || {}).video_id || null : null; } catch (e) { return null; }
  }, []);

  return {
    montaje, listo, error, tiempo, duracion, reproduciendo, play, pause, seek, videoActual,
    volumen, silencio, setVolumen, alternarSilencio, subtitulos, tamanoSubtitulos,
  };
}

Object.assign(window, { idDeYouTube, cargarApiYouTube, useYouTube });
