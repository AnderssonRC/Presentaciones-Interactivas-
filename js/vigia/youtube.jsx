/* youtube.jsx — Reproductor de YouTube para el Modo Vigía.
   Usa la API oficial del iframe (https://www.youtube.com/iframe_api), que
   permite saber el segundo exacto, pausar, reproducir y saltar.
     · idDeYouTube(url)          -> id de 11 caracteres o null
     · useYouTube(videoId, vars) -> { montaje, listo, tiempo, duracion, reproduciendo, play, pause, seek }
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

  // Tiempo actual: se consulta 4 veces por segundo mientras está listo.
  React.useEffect(() => {
    if (!listo) return;
    const iv = setInterval(() => {
      const p = player.current;
      if (p && p.getCurrentTime) setTiempo(p.getCurrentTime() || 0);
    }, 250);
    return () => clearInterval(iv);
  }, [listo]);

  const play = React.useCallback(() => { const p = player.current; if (p && p.playVideo) p.playVideo(); }, []);
  const pause = React.useCallback(() => { const p = player.current; if (p && p.pauseVideo) p.pauseVideo(); }, []);
  const seek = React.useCallback((t) => {
    const p = player.current;
    if (p && p.seekTo) { p.seekTo(Math.max(0, t), true); setTiempo(Math.max(0, t)); }
  }, []);

  return { montaje, listo, error, tiempo, duracion, reproduciendo, play, pause, seek };
}

Object.assign(window, { idDeYouTube, cargarApiYouTube, useYouTube });
