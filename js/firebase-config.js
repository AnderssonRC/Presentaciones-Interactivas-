/* firebase-config.js
   Inicializa Firebase usando los bundles "compat" cargados por CDN en el HTML. */

(function () {
  var firebaseConfig = {
    apiKey: "AIzaSyDWdBghsqOwcfozjKy_j54YIQ0-q4Dw-s4",
    authDomain: "actividades-interactivas-7c492.firebaseapp.com",
    projectId: "actividades-interactivas-7c492",
    storageBucket: "actividades-interactivas-7c492.firebasestorage.app",
    messagingSenderId: "1011471685927",
    appId: "1:1011471685927:web:4755c3a2bd9c4e6d257102",
    measurementId: "G-WH1HK0XBH0"
  };

  if (typeof firebase === 'undefined') {
    console.error('[Firebase] No se cargó el SDK. Revisa los <script> de firebase-*-compat en el HTML.');
    return;
  }

  firebase.initializeApp(firebaseConfig);

  window.fbAuth = firebase.auth();
  window.fbDB = firebase.firestore();
})();
