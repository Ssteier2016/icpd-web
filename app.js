let SERMONS = [];
let MATERIALS = [];
let SONGS = [];
let EB_VIDEOS = [];
let LIBRARY = [];
let FRASES = [];
let PHOTOS = [];
let ACTIVIDADES = [];
let HERO_DATA = null;
let TOTAL_VISITS = 0;

// --- Firebase Initialization ---
const firebaseConfig = {
  apiKey: "AIzaSyBSb5Wk69IaGgYAjqKkhBrX6zMdt4b6Al8",
  authDomain: "icpd-8ad23.firebaseapp.com",
  databaseURL: "https://icpd-8ad23-default-rtdb.firebaseio.com",
  projectId: "icpd-8ad23",
  storageBucket: "icpd-8ad23.firebasestorage.app",
  messagingSenderId: "334950271362",
  appId: "1:334950271362:web:112bc1a2dd840e8f8aa79b"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Función para evitar crashes si Firebase devuelve objetos en lugar de arrays o arrays con nulls
function normalizeArray(data) {
  if (!data) return [];
  if (Array.isArray(data)) return data.filter(item => item !== null && item !== undefined);
  if (typeof data === 'object') return Object.values(data).filter(item => item !== null && item !== undefined);
  return [];
}

// Escuchar cambios en tiempo real desde Firebase
db.ref('icpd_sermons').on('value', snap => { SERMONS = normalizeArray(snap.val()); renderSermons(SERMONS); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_materials').on('value', snap => { MATERIALS = normalizeArray(snap.val()); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_songs').on('value', snap => { SONGS = normalizeArray(snap.val()); renderSongs(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_eb_videos').on('value', snap => { EB_VIDEOS = normalizeArray(snap.val()); renderEbVideos(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_library').on('value', snap => { LIBRARY = normalizeArray(snap.val()); renderLibrary(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_frases').on('value', snap => { FRASES = normalizeArray(snap.val()); renderFraseRotativa(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); if (typeof renderAdminFrasesGrid === 'function') renderAdminFrasesGrid(); });
db.ref('icpd_photos').on('value', snap => { PHOTOS = normalizeArray(snap.val()); renderGallery(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_actividades').on('value', snap => { ACTIVIDADES = normalizeArray(snap.val()); if (typeof renderActividades === 'function') renderActividades(); if (typeof renderAdminEditList === 'function') renderAdminEditList(); });
db.ref('icpd_hero').on('value', snap => { HERO_DATA = snap.val() || null; if (typeof renderHero === 'function') renderHero(); });
db.ref('icpd_visits').on('value', snap => {
  TOTAL_VISITS = snap.val() || 0;
  const counterEl = document.getElementById('admin-visits-counter');
  if (counterEl) counterEl.textContent = `Total de Visitas: ${TOTAL_VISITS}`;
});

// Registrar visita única por sesión
if (!sessionStorage.getItem('icpd_visited')) {
  sessionStorage.setItem('icpd_visited', 'true');
  db.ref('icpd_visits').transaction(current_value => (current_value || 0) + 1);
}

// --- PWA Service Worker Registration & Install Prompt ---
let deferredPrompt;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('Service Worker registrado correctamente.', reg.scope);
        
        // Detectar actualizaciones de la aplicación
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              mostrarBannerActualizacion();
            }
          });
        });
      })
      .catch(err => console.error('Error al registrar Service Worker:', err));
  });
}

function mostrarBannerActualizacion() {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:var(--color-gold); color:#000; padding:12px 20px; border-radius:8px; z-index:9999; box-shadow:0 10px 25px rgba(0,0,0,0.5); font-weight:bold; display:flex; gap:15px; align-items:center; cursor:pointer;';
  banner.innerHTML = `
    <span><i class="fa-solid fa-rotate"></i> ¡Hay una nueva actualización disponible!</span>
    <button style="background:#0f172a; color:#fff; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Actualizar</button>
  `;
  banner.addEventListener('click', () => {
    window.location.reload();
  });
  document.body.appendChild(banner);
}

window.addEventListener('beforeinstallprompt', (e) => {
  // Previene que Chrome muestre el mini-infobar o su propio cartel
  e.preventDefault();
  // Guarda el evento para dispararlo más tarde
  deferredPrompt = e;
  
  // Muestra nuestro cartel modal elegante SOLO si no pidió cerrarlo antes
  if (localStorage.getItem('icpd_pwa_dismissed') !== 'true' && !window.matchMedia('(display-mode: standalone)').matches) {
    const installModal = document.getElementById('pwa-install-modal');
    if (installModal) {
      installModal.classList.add('active');
    }
  }
});

// Eventos de los botones del modal de instalación y Compartir
document.addEventListener('DOMContentLoaded', () => {
  const installBtn = document.getElementById('pwa-install-btn');
  const cancelBtn = document.getElementById('pwa-cancel-btn');
  const installModal = document.getElementById('pwa-install-modal');
  const shareBtn = document.getElementById('btn-share-app');

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'ICPD - Iglesia Cristiana Pueblo de Dios',
        text: 'Te invito a descargar nuestra App y escuchar nuestros sermones y música cristiana.',
        url: window.location.href
      };
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          console.log('Error compartiendo:', err);
        }
      } else {
        // Fallback para navegadores antiguos de escritorio
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles. ¡Pégalo y compártelo!');
      }
    });
  }

  if (installBtn && cancelBtn && installModal) {
    installBtn.addEventListener('click', async () => {
      // Oculta el cartel
      installModal.classList.remove('active');
      localStorage.setItem('icpd_pwa_dismissed', 'true'); // No volver a mostrar
      // Muestra el prompt nativo de Chrome para generar el WebAPK
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      }
    });

    cancelBtn.addEventListener('click', () => {
      // Oculta el modal elegante
      installModal.classList.remove('active');
      // Guarda la preferencia para no molestarlo cada vez
      localStorage.setItem('icpd_pwa_dismissed', 'true');
    });
  }

  const manualBtn = document.getElementById('btn-manual-install');
  if (manualBtn) {
    manualBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        if (installModal) installModal.classList.add('active');
      } else {
        alert("Parece que ya tienes instalada la App, o tu navegador no es compatible con la instalación directa desde aquí. (Intenta buscar la opción 'Agregar a la pantalla principal' en el menú de Chrome/Safari).");
      }
    });
  }
});

// --- DOM Loaded ---
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMap();
  renderFraseRotativa();
  renderSermons(SERMONS);
  renderSongs();
  renderLibrary();
  renderEbVideos();
  if (typeof renderActividades === 'function') renderActividades();
  initFilters();
  initAudioPlayer();
  initModals();
  renderGallery();
  initLightbox();
});

// --- Navigation Scroll Effect & Mobile Menu ---
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const menuToggle = document.getElementById('menu-toggle');
  const navMenu = document.getElementById('nav-menu');
  const navItems = document.querySelectorAll('.nav-item');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    const isExpanded = navMenu.classList.contains('active');
    menuToggle.innerHTML = isExpanded ? '<i class="fa-solid fa-xmark"></i>' : '<i class="fa-solid fa-bars"></i>';
  });

  // Close menu on click of items & update active class
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      navMenu.classList.remove('active');
      menuToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });
}

function renderLibrary() {
  const grid = document.getElementById('library-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  const books = JSON.parse(localStorage.getItem('icpd_library')) || LIBRARY;
  
  if (books.length === 0) {
    grid.innerHTML = '<p style="color:var(--color-text-muted); grid-column: 1/-1;">No hay libros disponibles en la biblioteca en este momento.</p>';
    return;
  }
  
  books.forEach((book, idx) => {
    const card = document.createElement('div');
    card.className = 'library-card';
    
    // Default fallback cover if extraction failed
    const coverUrl = book.cover || 'logo.jpg';
    
    card.innerHTML = `
      <img src="${coverUrl}" class="library-cover" alt="Portada de ${book.title}">
      <div class="library-info">
        <h3 class="library-title">${book.isPhysical ? '📚 ' : ''}${book.title}</h3>
        <span class="library-author">${book.author ? `<i class="fa-solid fa-pen-nib"></i> ${book.author}` : ''}</span>
        
        <div class="btn-download-container" id="lib-btn-cont-${idx}">
          ${book.isPhysical ? '' : `<div class="btn-download-progress" id="lib-btn-prog-${idx}"></div>`}
          <div class="btn-download-text" id="lib-btn-text-${idx}">
            ${book.isPhysical ? '<i class="fa-brands fa-whatsapp"></i> Pedir' : '<i class="fa-solid fa-download"></i> Descargar'}
          </div>
        </div>
      </div>
    `;
    
    grid.appendChild(card);
    
    // Configurar evento de botón
    const btnCont = document.getElementById(`lib-btn-cont-${idx}`);
    
    if (book.isPhysical) {
      btnCont.style.background = '#25D366'; // WhatsApp green
      btnCont.addEventListener('click', () => {
        const message = encodeURIComponent(`Hola, quisiera consultar para pedir prestado el libro físico: "${book.title}".`);
        window.open(`https://wa.me/541125025499?text=${message}`, '_blank');
      });
    } else {
      const btnProg = document.getElementById(`lib-btn-prog-${idx}`);
      const btnText = document.getElementById(`lib-btn-text-${idx}`);
      
      let state = 'download'; // 'download', 'loading', 'open'
      
      btnCont.addEventListener('click', () => {
        if (state === 'download') {
          state = 'loading';
          btnText.innerHTML = 'Descargando...';
          btnProg.style.width = '0%';
          
          // Simular descarga progresiva
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              state = 'open';
              btnText.innerHTML = '<i class="fa-solid fa-book-open"></i> Abrir';
              btnCont.style.background = '#22c55e'; // Verde éxito
              btnProg.style.display = 'none'; // ocultar barra
            }
            btnProg.style.width = progress + '%';
          }, 300);
        } else if (state === 'open') {
          openPdfModal(book.pdfUrl, book.title);
        }
      });
    }
  });
}

function renderFraseRotativa() {
  const container = document.getElementById('hero-frases-container');
  if (!container) return;
  
  const frases = JSON.parse(localStorage.getItem('icpd_frases')) || FRASES;
  if (frases.length === 0) {
    container.innerHTML = '';
    return;
  }
  
  let estado = JSON.parse(localStorage.getItem('icpd_frases_estado')) || { currentIndex: 0, lastRotation: Date.now() };
  
  // Verificar rotación (4 horas)
  const cuatroHoras = 4 * 60 * 60 * 1000;
  if (Date.now() - estado.lastRotation > cuatroHoras) {
    estado.currentIndex = (estado.currentIndex + 1) % frases.length;
    estado.lastRotation = Date.now();
    localStorage.setItem('icpd_frases_estado', JSON.stringify(estado));
  }
  
  if (estado.currentIndex >= frases.length) estado.currentIndex = 0;
  
  const fraseActual = frases[estado.currentIndex];
  
  container.innerHTML = `
    <div class="frase-card animate-fade-in" onclick="openLightbox('${fraseActual.url}', 'Frase')" style="cursor:zoom-in;">
      <img src="${fraseActual.url}" class="frase-img" alt="Frase Rotativa">
    </div>
  `;
}

// --- Render Functions ---
function renderSermons(sermonList) {
  const grid = document.getElementById('sermones-grid');
  grid.innerHTML = '';
  
  if (sermonList.length === 0) {
    grid.innerHTML = `<div class="no-results"><p><i class="fa-solid fa-circle-info"></i> No se encontraron sermones con los filtros aplicados.</p></div>`;
    return;
  }

  sermonList.forEach((sermon, idx) => {
    const formattedDate = formatDateString(sermon.date);
    const card = document.createElement('div');
    card.className = 'sermon-card';
    let finalPdfUrl = sermon.pdf;
    if (finalPdfUrl && finalPdfUrl !== '#') {
      if (!finalPdfUrl.startsWith('http') && !finalPdfUrl.startsWith('data:')) {
        finalPdfUrl = './' + encodeURIComponent(finalPdfUrl);
      }
    }
    
    let covers = sermon.cover;
    if (!covers) {
      covers = ['logo.jpg'];
    } else if (!Array.isArray(covers)) {
      covers = [covers];
    }
    const coversJson = encodeURIComponent(JSON.stringify(covers));
    
    let slidesHtml = '';
    covers.forEach((c, idx) => {
      slidesHtml += `<div class="sermon-slide ${idx === 0 ? 'active' : ''}" style="position: absolute; top:0; left:0; width:100%; height:100%; background-image: linear-gradient(to bottom, rgba(11,15,23,0.3), rgba(11,15,23,0.95)), url('${c}'); background-size: cover; background-position: center; transition: opacity 1s ease-in-out; opacity: ${idx === 0 ? '1' : '0'}; z-index: ${idx === 0 ? '2' : '1'};"></div>`;
    });
    
    let actionsHtml = '';
    if (sermon.audio && sermon.audio !== '#') {
      actionsHtml += `
          <button class="action-play" onclick="playAudio('${sermon.audio}', '${sermon.title}', '${sermon.speaker}')">
            <i class="fa-solid fa-play"></i> Audio
          </button>`;
    }
    if (sermon.videoUrl && sermon.videoUrl !== '#') {
      actionsHtml += `
          <button class="action-video" onclick="openVideoModal('${sermon.videoUrl}', ${idx}, 'sermon')">
            <i class="fa-brands fa-youtube"></i> Video
          </button>`;
    }
    if (finalPdfUrl && finalPdfUrl !== '#') {
      actionsHtml += `
          <button class="action-pdf" onclick="openPdfModal('${finalPdfUrl}', '${sermon.title}')">
            <i class="fa-solid fa-file-pdf"></i> PDF
          </button>`;
    }
    
    card.innerHTML = `
      <div class="sermon-header-img has-carousel" data-covers="${coversJson}" onclick="openLightboxFromSermon(this, '${sermon.title}')" style="position: relative; cursor: pointer; overflow: hidden;" title="Haz clic para ver la carátula completa">
        ${slidesHtml}
        <div style="position: absolute; top: 10px; right: 10px; color: rgba(255,255,255,0.8); font-size: 1.1rem; text-shadow: 0 2px 4px rgba(0,0,0,0.8); z-index: 10;"><i class="fa-solid fa-expand"></i></div>
        <span class="sermon-date-tag">${formattedDate}</span>
      </div>
      <div class="sermon-body">
        <h3>${sermon.title}</h3>
        ${sermon.subtitle ? `<h4 style="color: var(--color-gold); font-size: 0.9rem; margin-top: 5px; margin-bottom: 10px; font-weight: normal; font-style: italic;">${sermon.subtitle}</h4>` : ''}
        <span class="sermon-speaker"><i class="fa-solid fa-user-tie"></i> ${sermon.speaker}</span>
        <div class="sermon-actions">
          ${actionsHtml}
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
  
  startSermonCarousels();
}

let carouselInterval = null;
function startSermonCarousels() {
  if (carouselInterval) clearInterval(carouselInterval);
  carouselInterval = setInterval(() => {
    document.querySelectorAll('.sermon-header-img.has-carousel').forEach(container => {
      const slides = container.querySelectorAll('.sermon-slide');
      if (slides.length <= 1) return;
      let activeIdx = Array.from(slides).findIndex(s => s.classList.contains('active'));
      if(activeIdx === -1) activeIdx = 0;
      slides[activeIdx].classList.remove('active');
      slides[activeIdx].style.opacity = '0';
      slides[activeIdx].style.zIndex = '1';
      activeIdx = (activeIdx + 1) % slides.length;
      slides[activeIdx].classList.add('active');
      slides[activeIdx].style.opacity = '1';
      slides[activeIdx].style.zIndex = '2';
    });
  }, 3500);
}

function renderSongs(filterText = '') {
  const grid = document.getElementById('songs-grid');
  grid.innerHTML = '';
  let songs = JSON.parse(localStorage.getItem('icpd_songs')) || SONGS;
  
  if (filterText) {
    const text = filterText.toLowerCase();
    songs = songs.filter(song => 
      song.title.toLowerCase().includes(text) || 
      (song.author && song.author.toLowerCase().includes(text))
    );
  }
  
window.currentFilteredSongs = songs;

  songs.forEach((song, index) => {
    const card = document.createElement('div');
    card.className = 'song-card';
    const safeEmbedUrl = song.embedUrl || '';
    const isLocalFile = safeEmbedUrl.startsWith('data:');
    
    card.innerHTML = `
      <div class="song-thumb">
        ${isLocalFile 
          ? `<video src="${safeEmbedUrl}" style="width:100%;height:100%;object-fit:cover;"></video>
             <div class="play-overlay" onclick="playSongFromPlaylist(${index})">`
          : `<img src="https://img.youtube.com/vi/${getYouTubeId(safeEmbedUrl)}/0.jpg" alt="${song.title}">
             <div class="play-overlay" onclick="playSongFromPlaylist(${index})">`
        }
          <i class="fa-solid fa-circle-play"></i>
        </div>
      </div>
      <div class="song-info">
        <h3>${song.title}</h3>
        <p>${song.author}</p>
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderEbVideos() {
  const grid = document.getElementById('eb-videos-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const ebVideos = JSON.parse(localStorage.getItem('icpd_eb_videos')) || EB_VIDEOS;
  ebVideos.forEach((vid, idx) => {
    const card = document.createElement('div');
    card.className = 'song-card eb-video-card';
    
    const safeEmbedUrl = vid.embedUrl || '';
    const isAudio = vid.type === 'audio' || (safeEmbedUrl && (safeEmbedUrl.startsWith('data:audio') || safeEmbedUrl.endsWith('.mp3')));
    const isLocalFile = safeEmbedUrl.startsWith('data:');
    
    let thumbHtml = '';
    if (isAudio) {
      if (vid.cover) {
        thumbHtml = `
          <img src="${vid.cover}" alt="Portada de ${vid.title}" style="width:100%;height:100%;object-fit:cover;">
          <div class="play-overlay" onclick="playCustomAudio('${vid.embedUrl}', '${vid.title}')">
            <i class="fa-solid fa-circle-play"></i>
          </div>
        `;
      } else {
        thumbHtml = `
          <div style="width:100%; height:100%; background: linear-gradient(135deg, #1e293b, #0f172a); display:flex; justify-content:center; align-items:center;">
            <i class="fa-solid fa-headphones" style="font-size: 3rem; color: var(--color-gold); opacity: 0.8;"></i>
          </div>
          <div class="play-overlay" onclick="playCustomAudio('${vid.embedUrl}', '${vid.title}')">
            <i class="fa-solid fa-circle-play"></i>
          </div>
        `;
      }
    } else {
      if (isLocalFile) {
        thumbHtml = `
          <video src="${vid.embedUrl}" style="width:100%;height:100%;object-fit:cover;"></video>
          <div class="play-overlay" onclick="openLocalVideoModal('${vid.embedUrl}', ${idx}, 'eb')">
            <i class="fa-solid fa-circle-play"></i>
          </div>
        `;
      } else {
        const ytId = getYouTubeId(vid.embedUrl);
        const thumbSrc = vid.coverUrl 
                         ? vid.coverUrl 
                         : (ytId ? `https://img.youtube.com/vi/${ytId}/0.jpg` : 'https://placehold.co/600x400/222222/FFF?text=Video');
                         
        thumbHtml = `
          <img src="${thumbSrc}" alt="${vid.title}">
          <div class="play-overlay" onclick="openVideoModal('${vid.embedUrl}', ${idx}, 'eb')">
            <i class="fa-solid fa-circle-play"></i>
          </div>
        `;
      }
    }
    
    card.innerHTML = `
      <div class="song-thumb">
        ${thumbHtml}
      </div>
      <div class="song-info">
        <h3>${vid.title}</h3>
        ${vid.author ? `<p style="font-size: 0.8rem; color: var(--color-text-muted);"><i class="fa-solid fa-user"></i> ${vid.author}</p>` : ''}
      </div>
    `;
    grid.appendChild(card);
  });
}

function renderActividades() {
  const container = document.getElementById('agenda-container');
  if (!container) return;
  container.innerHTML = '';
  
  const actividades = JSON.parse(localStorage.getItem('icpd_actividades')) || ACTIVIDADES;
  if (actividades.length === 0) {
    container.innerHTML = '<p style="color:var(--color-text-muted); text-align:center;">No hay actividades programadas.</p>';
    return;
  }
  
  const domingos = actividades.filter(a => a.dia === 'Domingos');
  const semana = actividades.filter(a => a.dia === 'Semana');
  
  if (domingos.length > 0) {
    let itemsHtml = '';
    domingos.forEach((act, idx) => {
      itemsHtml += `
        <div class="agenda-item ${idx > 0 ? 'border-top' : ''}">
          <span class="time"><i class="fa-regular fa-clock"></i> ${act.horario}</span>
          <span class="activity-title">${act.titulo}</span>
          <span class="desc">${act.desc}</span>
        </div>
      `;
    });
    container.innerHTML += `
      <div class="agenda-card shadow">
        <div class="agenda-day">
          <span class="day-name">Domingos</span>
        </div>
        <div class="agenda-details">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
  
  if (semana.length > 0) {
    let itemsHtml = '';
    semana.forEach((act, idx) => {
      itemsHtml += `
        <div class="agenda-item ${idx > 0 ? 'border-top' : ''}">
          <span class="time"><i class="fa-regular fa-clock"></i> ${act.horario}</span>
          <span class="activity-title">${act.titulo}</span>
          <span class="desc">${act.desc}</span>
        </div>
      `;
    });
    container.innerHTML += `
      <div class="agenda-card shadow margin-top-md">
        <div class="agenda-day special">
          <span class="day-name">Semana</span>
        </div>
        <div class="agenda-details">
          ${itemsHtml}
        </div>
      </div>
    `;
  }
}

window.openLocalVideoModal = function(base64Url) {
  const modal = document.getElementById('video-modal');
  const container = modal.querySelector('.video-container');
  container.innerHTML = `<video id="modal-video-player" src="${base64Url}" controls autoplay style="width:100%; height:100%; background:#000; border-radius:8px;"></video>`;
  modal.classList.add('active');
  
  // Conectar Web Audio API para amplificación del video local
  let videoAudioCtx = null;
  let videoSource = null;
  let videoGainNode = null;
  
  const videoBooster = document.getElementById('video-volume-booster');
  const videoBoosterVal = document.getElementById('video-booster-val');
  const videoElement = document.getElementById('modal-video-player');

  function initVideoAmplifier() {
    if (!videoAudioCtx && videoElement) {
      videoAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
      videoSource = videoAudioCtx.createMediaElementSource(videoElement);
      videoGainNode = videoAudioCtx.createGain();
      videoSource.connect(videoGainNode);
      videoGainNode.connect(videoAudioCtx.destination);
    }
  }

  const applyBooster = () => {
    initVideoAmplifier();
    if (videoAudioCtx && videoAudioCtx.state === 'suspended') {
      videoAudioCtx.resume();
    }
    const val = parseFloat(videoBooster.value);
    videoBoosterVal.textContent = `${val}x`;
    if (videoGainNode) {
      videoGainNode.gain.value = val;
    }
  };

  videoBooster.addEventListener('input', applyBooster);
  videoElement.addEventListener('play', () => {
    initVideoAmplifier();
    if (videoAudioCtx && videoAudioCtx.state === 'suspended') {
      videoAudioCtx.resume();
    }
  });

  // Modificar cierre del modal para restaurar iframe original si se cierra
  const closeBtn = document.getElementById('modal-close');
  const restoreOriginal = () => {
    container.innerHTML = `<iframe id="modal-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    modal.classList.remove('active');
    
    // Desconectar y limpiar contextos de audio de video
    videoBooster.value = 1;
    videoBoosterVal.textContent = "1x";
    videoBooster.removeEventListener('input', applyBooster);
    if (videoAudioCtx) {
      videoAudioCtx.close();
    }
    closeBtn.removeEventListener('click', restoreOriginal);
  };
  closeBtn.addEventListener('click', restoreOriginal);
};

window.playCustomAudio = function(src, title) {
  const audioBar = document.getElementById('audio-player-bar');
  const audio = document.getElementById('main-audio');
  const playerTitle = document.getElementById('player-title');
  const playerSubtitle = document.getElementById('player-subtitle');
  const playBtn = document.getElementById('player-play-btn');

  playerTitle.textContent = title;
  playerSubtitle.textContent = "Audio Cargado";
  
  const directUrl = (typeof convertDriveLinkToDirect === 'function') ? convertDriveLinkToDirect(src) : src;
  audio.src = directUrl;
  
  audio.play().catch(e => {
    console.error("Error reproduciendo audio custom:", e);
    alert("Hubo un error al intentar reproducir este audio. Asegúrate de que el enlace de Google Drive tenga el permiso 'Cualquier persona con el enlace'.");
  });
  
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
  audioBar.classList.add('active');
};

// --- Filters & Searching ---
function initFilters() {
  const searchInput = document.getElementById('sermon-search');
  const dateInput = document.getElementById('sermon-date');
  const clearDateBtn = document.getElementById('clear-date-btn');

  const filterAction = () => {
    const searchVal = searchInput.value.toLowerCase();
    const dateVal = dateInput.value;

    const filtered = SERMONS.filter(sermon => {
      const matchesSearch = sermon.title.toLowerCase().includes(searchVal) ||
                            sermon.speaker.toLowerCase().includes(searchVal);
      const matchesDate = !dateVal || sermon.date === dateVal;
      return matchesSearch && matchesDate;
    });

    renderSermons(filtered);
  };

  searchInput.addEventListener('input', filterAction);
  dateInput.addEventListener('change', filterAction);
  clearDateBtn.addEventListener('click', () => {
    dateInput.value = '';
    filterAction();
  });

  // Filtro de Canciones
  const songsSearchInput = document.getElementById('songs-search-input');
  if (songsSearchInput) {
    songsSearchInput.addEventListener('input', (e) => {
      renderSongs(e.target.value);
    });
  }
}

// --- Leaflet Interactive Map ---
function initMap() {
  // Coordenadas aproximadas de Av. Brigadier General Juan Manuel de Rosas 2914, San Justo
  const lat = -34.6791;
  const lng = -58.5583;

  const map = L.map('map').setView([lat, lng], 16);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  const churchIcon = L.icon({
    iconUrl: 'logo.jpg',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
  });

  L.marker([lat, lng], { icon: churchIcon }).addTo(map)
    .bindPopup('<b>Iglesia Cristiana Pueblo de Dios (ICPD)</b><br>Av. Juan Manuel de Rosas 2914, San Justo.')
    .openPopup();
}

// --- Personalized Audio Player ---
let currentAudio = null;
function initAudioPlayer() {
  const bar = document.getElementById('audio-player-bar');
  const audio = document.getElementById('main-audio');
  const playBtn = document.getElementById('player-play-btn');
  const progressBar = document.getElementById('player-progress-bar');
  const progressContainer = document.getElementById('player-progress-container');
  const timeDisplay = document.getElementById('player-time');
  const closeBtn = document.getElementById('player-close-btn');

  // Web Audio API para Amplificación Turbo
  let audioContext = null;
  let source = null;
  let gainNode = null;
  const boosterSlider = document.getElementById('volume-booster');
  const boosterVal = document.getElementById('booster-val');

  function initAudioAmplifier() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      source = audioContext.createMediaElementSource(audio);
      gainNode = audioContext.createGain();
      source.connect(gainNode);
      gainNode.connect(audioContext.destination);
    }
  }

  boosterSlider.addEventListener('input', () => {
    initAudioAmplifier();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    const multiplier = parseFloat(boosterSlider.value);
    boosterVal.textContent = `${multiplier}x`;
    if (gainNode) {
      gainNode.gain.value = multiplier; // Multiplica la señal de audio original por hasta 10 veces
    }
  });

  playBtn.addEventListener('click', () => {
    initAudioAmplifier();
    if (audioContext && audioContext.state === 'suspended') {
      audioContext.resume();
    }
    if (audio.paused) {
      audio.play();
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
    } else {
      audio.pause();
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
    }
  });

  audio.addEventListener('timeupdate', () => {
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.style.width = `${pct}%`;
    timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration || 0)}`;
  });

  progressContainer.addEventListener('click', (e) => {
    const rect = progressContainer.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audio.currentTime = pos * audio.duration;
  });

  closeBtn.addEventListener('click', () => {
    audio.pause();
    bar.classList.remove('active');
    // Restaurar ganancia al cerrar
    boosterSlider.value = 1;
    boosterVal.textContent = "1x";
    if (gainNode) gainNode.gain.value = 1;
  });
}

function convertDriveLinkToDirect(url) {
  if (!url) return url;
  
  // Soporte Dropbox
  if (url.includes('dropbox.com')) {
    return url.replace('dl=0', 'raw=1').replace('?dl=0', '?raw=1');
  }

  // Soporte Google Drive
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) {
    return `https://drive.google.com/uc?export=download&id=${match1[1]}`;
  }
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && match2 && match2[1]) {
    return `https://drive.google.com/uc?export=download&id=${match2[1]}`;
  }
  return url;
}

function convertDriveLinkToEmbed(url) {
  if (!url) return url;
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1 && match1[1]) {
    return `https://drive.google.com/file/d/${match1[1]}/preview`;
  }
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && match2 && match2[1]) {
    return `https://drive.google.com/file/d/${match2[1]}/preview`;
  }
  return url;
}

window.playAudio = function(url, title, speaker) {
  const bar = document.getElementById('audio-player-bar');
  const audio = document.getElementById('main-audio');
  const playBtn = document.getElementById('player-play-btn');
  const titleEl = document.getElementById('player-title');
  const subtitleEl = document.getElementById('player-subtitle');

  titleEl.textContent = title;
  subtitleEl.textContent = speaker;
  
  const directUrl = convertDriveLinkToDirect(url);
  audio.src = directUrl;
  
  bar.classList.add('active');
  audio.play().catch(e => {
    console.error("Error reproduciendo audio:", e);
    alert("Hubo un error al intentar reproducir este audio. Verifica que el enlace sea correcto y público.");
  });
  playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
};

// --- YouTube Video Modals ---
function initModals() {
  const modal = document.getElementById('video-modal');
  const closeBtn = document.getElementById('modal-close');
  const minBtn = document.getElementById('modal-minimize');
  const iframe = document.getElementById('modal-iframe');

  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    modal.classList.remove('minimized');
    if (minBtn) minBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
    
    // Si estamos usando YouTube API, hay que destruirlo
    if (window.ytPlayer) {
      window.ytPlayer.destroy();
      window.ytPlayer = null;
    }
    
    const container = modal.querySelector('.video-container');
    container.innerHTML = `<iframe id="modal-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
  });

  if (minBtn) {
    minBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // evitar que se cierre si clickeamos
      modal.classList.toggle('minimized');
      if (modal.classList.contains('minimized')) {
        minBtn.innerHTML = '<i class="fa-solid fa-expand"></i>';
        minBtn.title = "Restaurar (Modo Pantalla Completa)";
      } else {
        minBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
        minBtn.title = "Minimizar (Modo flotante)";
      }
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      modal.classList.remove('minimized');
      if (minBtn) minBtn.innerHTML = '<i class="fa-solid fa-compress"></i>';
      
      if (window.ytPlayer) {
        window.ytPlayer.destroy();
        window.ytPlayer = null;
      }
      
      const container = modal.querySelector('.video-container');
      container.innerHTML = `<iframe id="modal-iframe" src="" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    }
  });

  // PDF Modal logic
  const pdfModal = document.getElementById('pdf-modal');
  const pdfCloseBtn = document.getElementById('pdf-modal-close');
  const pdfIframe = document.getElementById('pdf-modal-iframe');

  if (pdfModal && pdfCloseBtn) {
    pdfCloseBtn.addEventListener('click', () => {
      pdfModal.classList.remove('active');
      pdfIframe.src = '';
    });
    pdfModal.addEventListener('click', (e) => {
      if (e.target === pdfModal) {
        pdfModal.classList.remove('active');
        pdfIframe.src = '';
      }
    });
  }

  // Admin Modal logic
  const adminModal = document.getElementById('admin-modal');
  const adminCloseBtn = document.getElementById('admin-modal-close');
  // --- Admin Modal logic with Tabs, Local Files (Base64) & Web URLs ---
  const authSec = document.getElementById('admin-auth-sec');
  const formSec = document.getElementById('admin-form-sec');
  const authSubmit = document.getElementById('btn-auth-submit');
  const adminPassInput = document.getElementById('admin-pass');
  const authErr = document.getElementById('auth-err');
  
  // Tab Elements
  const tabs = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.admin-tab-content');

  // Photo preview
  const photoFileInput = document.getElementById('form-photo-file');
  const photoUrlInput = document.getElementById('form-photo-url');
  const photoPreviewContainer = document.getElementById('photo-preview-container');
  const photoPreview = document.getElementById('photo-preview');

  // Success message helper
  const successMsg = document.getElementById('admin-success');
  function showSuccess() {
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);
  }

  // Handle Tabs click
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(tc => tc.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  if (adminCloseBtn) {
    adminCloseBtn.addEventListener('click', () => {
      adminModal.classList.remove('active');
      adminPassInput.value = '';
      authErr.style.display = 'none';
    });
  }

  authSubmit.addEventListener('click', () => {
    if (adminPassInput.value === "0803") {
      authSec.style.display = 'none';
      formSec.style.display = 'block';
      authErr.style.display = 'none';
    } else {
      authErr.style.display = 'block';
    }
  });

  // Admin Forms logic

  // TAB 1: SERMONS FORM
  const sermonForm = document.getElementById('sermon-upload-form');
  sermonForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('form-sermon-id').value);
    const title = document.getElementById('form-sermon-title').value;
    const subtitle = document.getElementById('form-sermon-subtitle').value || '';
    const speaker = document.getElementById('form-sermon-speaker').value;
    const date = document.getElementById('form-sermon-date').value;
    const audioUrlText = document.getElementById('form-sermon-audio-url').value;
    const audioFile = document.getElementById('form-sermon-audio-file').files[0];
    const ytUrl = document.getElementById('form-sermon-video').value;
    const videoFile = document.getElementById('form-sermon-video-file').files[0];
    const pdfText = document.getElementById('form-sermon-pdf').value;
    const pdfFile = document.getElementById('form-sermon-pdf-file').files[0];

    const coverFiles = document.getElementById('form-sermon-cover-file').files;
    const coverUrl = document.getElementById('form-sermon-cover-url').value;

    let audio = audioUrlText || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
    if (audioFile) {
      audio = await fileToBase64(audioFile);
    }

    let videoUrl = '';
    if (ytUrl) {
      const ytId = getYouTubeId(ytUrl);
      videoUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : ytUrl;
    } else if (videoFile) {
      videoUrl = await fileToBase64(videoFile);
    } else {
      videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ"; // Fallback
    }

    let cover = coverUrl || '';
    if (coverFiles.length > 0) {
      let coversArr = [];
      for (let i = 0; i < coverFiles.length; i++) {
        coversArr.push(await fileToBase64(coverFiles[i]));
      }
      cover = coversArr.length === 1 ? coversArr[0] : coversArr;
    }

    let pdf = pdfText || '#';
    if (pdfFile) {
      pdf = await fileToBase64(pdfFile);
    }

    const newSermon = { id, title, subtitle, speaker, date, audio, videoUrl, pdf, cover };
    SERMONS.unshift(newSermon);
    SERMONS.sort((a,b) => b.id - a.id);
    db.ref('icpd_sermons').set(SERMONS);
    sermonForm.reset();
    showSuccess();
  });

  // TAB 2: PHOTO FORM
  photoFileInput.addEventListener('change', async () => {
    if (photoFileInput.files[0]) {
      const base64 = await fileToBase64(photoFileInput.files[0]);
      photoPreview.src = base64;
      photoPreviewContainer.style.display = 'block';
      photoUrlInput.value = '';
    }
  });

  photoUrlInput.addEventListener('input', () => {
    if (photoUrlInput.value) {
      photoPreview.src = photoUrlInput.value;
      photoPreviewContainer.style.display = 'block';
      photoFileInput.value = '';
    } else {
      photoPreviewContainer.style.display = 'none';
    }
  });

  const photoForm = document.getElementById('photo-upload-form');
  photoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const caption = document.getElementById('form-photo-caption').value || "Foto de la Iglesia";
    const urlInput = document.getElementById('form-photo-url').value;
    const files = photoFileInput.files;

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const src = await fileToBase64(files[i]);
        PHOTOS.push({ src, caption });
      }
    } else if (urlInput) {
      PHOTOS.push({ src: urlInput, caption });
    } else {
      return alert("Por favor selecciona al menos un archivo o ingresa una URL de foto.");
    }

    db.ref('icpd_photos').set(PHOTOS);
    photoForm.reset();
    photoPreviewContainer.style.display = 'none';
    showSuccess();
  });

  // TAB 3: CLASES FORM (Audio/Video)
  const clasesForm = document.getElementById('clases-upload-form');
  clasesForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('form-clases-title').value;
    const author = document.getElementById('form-clases-author').value || 'ICPD';
    
    const maxMb = 7; // Limite por la base de datos de Firebase (10MB en base64)

    // Audio Option
    const audioUrlText = document.getElementById('form-clases-audio-url').value;
    const audioFile = document.getElementById('form-clases-audio-file').files[0];
    
    // Video Option
    const ytUrl = document.getElementById('form-clases-yt-url').value;
    const videoFile = document.getElementById('form-clases-video-file').files[0];
    
    // Cover Option
    const coverUrlText = document.getElementById('form-clases-cover-url').value;
    const coverFile = document.getElementById('form-clases-cover-file').files[0];
    
    const section = document.getElementById('form-clases-section').value;

    let embedUrl = '';
    let type = 'video';
    
    if (audioUrlText) {
      embedUrl = audioUrlText;
      type = 'audio';
    } else if (audioFile) {
      if (audioFile.size > maxMb * 1024 * 1024) {
        return alert(`El archivo de audio es muy grande (${(audioFile.size/1024/1024).toFixed(1)}MB). El máximo es ${maxMb}MB debido a los límites de la base de datos.\nPor favor, sube el audio a Google Drive, Dropbox o Archive.org y pega el enlace aquí.`);
      }
      embedUrl = await fileToBase64(audioFile);
      type = 'audio';
    } else if (ytUrl) {
      const ytId = getYouTubeId(ytUrl);
      embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : ytUrl;
      type = 'video';
    } else if (videoFile) {
      if (videoFile.size > maxMb * 1024 * 1024) {
        return alert(`El archivo de video es muy grande (${(videoFile.size/1024/1024).toFixed(1)}MB). El máximo es ${maxMb}MB.\nPor favor, sube el video a YouTube o Google Drive y pega el enlace aquí.`);
      }
      embedUrl = await fileToBase64(videoFile);
      type = 'video';
    }

    if (!embedUrl) return alert("Por favor ingresa un archivo o URL de audio/video.");

    let coverUrl = '';
    if (coverUrlText) {
      coverUrl = coverUrlText;
    } else if (coverFile) {
      coverUrl = await fileToBase64(coverFile);
    }

    if (section === 'songs') {
      SONGS.push({ id: Date.now(), title, author, embedUrl, type, cover: coverUrl });
      db.ref('icpd_songs').set(SONGS);
    } else {
      EB_VIDEOS.push({ id: Date.now(), title, author, embedUrl, type, cover: coverUrl });
      db.ref('icpd_eb_videos').set(EB_VIDEOS);
    }

    clasesForm.reset();
    showSuccess();
  });

  // Función para extraer la primera hoja del PDF
  async function getPdfFirstPage(pdfBase64) {
    try {
      let pdfData = pdfBase64;
      if (pdfData.startsWith('data:application/pdf;base64,')) {
        const base64 = pdfData.split(',')[1];
        const binaryString = window.atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        pdfData = bytes;
      }
      
      const loadingTask = pdfjsLib.getDocument(pdfData);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      return canvas.toDataURL('image/jpeg', 0.8);
    } catch (err) {
      console.error("Error al extraer portada del PDF", err);
      return '';
    }
  }

  // TAB 5: LIBRARY FORM
  const libraryForm = document.getElementById('library-upload-form');
  libraryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('form-lib-title').value;
    const author = document.getElementById('form-lib-author').value;
    const pdfFile = document.getElementById('form-lib-pdf-file').files[0];
    const pdfUrl = document.getElementById('form-lib-pdf-url').value;
    const coverFile = document.getElementById('form-lib-cover-file').files[0];
    const coverUrlText = document.getElementById('form-lib-cover-url').value;

    const isPhysical = document.getElementById('form-lib-is-physical').checked;

    if (!isPhysical && !pdfFile && !pdfUrl) return alert("Por favor selecciona un archivo PDF o ingresa una URL.");

    let pdfBase64 = '';
    if (!isPhysical) {
      if (pdfFile) {
        pdfBase64 = await fileToBase64(pdfFile);
      } else {
        pdfBase64 = pdfUrl;
      }
    }
    
    let coverUrl = '';

    if (coverUrlText) {
      coverUrl = coverUrlText;
    } else if (coverFile) {
      coverUrl = await fileToBase64(coverFile);
    } else {
      // Extraer carátula automáticamente si hay archivo
      if (pdfFile && !isPhysical) {
        coverUrl = await getPdfFirstPage(pdfBase64);
      }
    }

    LIBRARY.push({
      id: Date.now(),
      title,
      author,
      cover: coverUrl,
      pdfUrl: pdfBase64,
      isPhysical: isPhysical
    });
    db.ref('icpd_library').set(LIBRARY);

    libraryForm.reset();
    showSuccess();
  });

  // TAB FRASES FORM
  const fraseForm = document.getElementById('frase-upload-form');
  fraseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const urlInput = document.getElementById('form-frase-url').value;
    const fileInput = document.getElementById('form-frase-file').files[0];
    const isPriority = document.getElementById('form-frase-priority').checked;

    let finalUrl = urlInput;
    if (fileInput) {
      finalUrl = await fileToBase64(fileInput);
    }
    if (!finalUrl) return alert("Por favor sube un archivo o ingresa una URL");

    // Si es prioridad, lo ponemos al principio
    if (isPriority) {
      FRASES.unshift({ id: Date.now(), url: finalUrl });
      // Resetear estado para mostrar la frase 0 inmediatamente
      localStorage.setItem('icpd_frases_estado', JSON.stringify({ currentIndex: 0, lastRotation: Date.now() }));
    } else {
      FRASES.push({ id: Date.now(), url: finalUrl });
    }
    
    db.ref('icpd_frases').set(FRASES);

    fraseForm.reset();
    showSuccess();
  });

  // TAB ACTIVIDADES FORM
  const actividadesForm = document.getElementById('actividades-upload-form');
  actividadesForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const dia = document.getElementById('form-actividad-dia').value;
    const horario = document.getElementById('form-actividad-horario').value;
    const titulo = document.getElementById('form-actividad-titulo').value;
    const desc = document.getElementById('form-actividad-desc').value;

    ACTIVIDADES.push({
      id: Date.now(),
      dia,
      horario,
      titulo,
      desc
    });
    
    db.ref('icpd_actividades').set(ACTIVIDADES);

    actividadesForm.reset();
    showSuccess();
  });

  let adminFraseTimerInterval = null;

  window.renderAdminFrasesGrid = function() {
    const grid = document.getElementById('admin-frases-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    if (adminFraseTimerInterval) clearInterval(adminFraseTimerInterval);

    if (FRASES.length === 0) {
      grid.innerHTML = '<p style="color:var(--color-text-muted); grid-column: 1/-1;">No hay frases subidas.</p>';
      return;
    }
    
    let estado = JSON.parse(localStorage.getItem('icpd_frases_estado')) || { currentIndex: 0, lastRotation: Date.now() };
    if (estado.currentIndex >= FRASES.length) estado.currentIndex = 0;

    FRASES.forEach((frase, idx) => {
      const isActual = (idx === estado.currentIndex);
      const item = document.createElement('div');
      item.style.cssText = 'position: relative; border-radius: 6px; overflow: hidden; aspect-ratio: 1; border: 1px solid rgba(255,255,255,0.1);';
      
      let badgeHtml = isActual 
        ? '<div style="position:absolute; top:2px; left:2px; background:var(--color-gold); color:#000; font-size:0.6rem; padding:2px 4px; border-radius:3px; font-weight:bold; z-index:2;">' + (idx+1) + 'º (Actual)</div>' 
        : '<div style="position:absolute; top:2px; left:2px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.6rem; padding:2px 4px; border-radius:3px; font-weight:bold; z-index:2;">' + (idx+1) + 'º</div>';

      let timerHtml = `<div class="admin-frase-timer" data-idx="${idx}" style="position:absolute; bottom:0; left:0; background:rgba(0,0,0,0.85); color:var(--color-gold); font-size:0.65rem; padding:4px 0; font-weight:bold; width:100%; text-align:center; z-index:2; border-top:1px solid rgba(204,163,82,0.3);">Calculando...</div>`;

      item.innerHTML = `
        <img src="${frase.url}" style="width: 100%; height: 100%; object-fit: cover; z-index:1; position:relative;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); display: flex; flex-direction: column; justify-content: center; align-items: center; opacity: 0; transition: opacity 0.2s; z-index:3;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'">
          <button class="btn btn-sm" style="background: var(--color-gold); color: #000; padding: 5px 10px; margin-bottom: 8px; font-size: 0.75rem; min-width:30px;" title="Hacer Prioridad" onclick="priorizarFrase(${idx})"><i class="fa-solid fa-star"></i></button>
          <button class="btn btn-sm" style="background: #ef4444; color: #fff; padding: 5px 10px; font-size: 0.75rem; min-width:30px;" title="Eliminar" onclick="eliminarFrase(${idx})"><i class="fa-solid fa-trash"></i></button>
        </div>
        ${badgeHtml}
        ${timerHtml}
      `;
      grid.appendChild(item);
    });

    if (FRASES.length > 0) {
      adminFraseTimerInterval = setInterval(() => {
        let est = JSON.parse(localStorage.getItem('icpd_frases_estado'));
        if (!est) {
          est = { currentIndex: 0, lastRotation: Date.now() };
          localStorage.setItem('icpd_frases_estado', JSON.stringify(est));
        }
        
        const cuatroHoras = 4 * 60 * 60 * 1000;
        let timeLeftCurrent = cuatroHoras - (Date.now() - est.lastRotation);
        
        if (timeLeftCurrent <= 0 && FRASES.length > 1) {
           renderFraseRotativa(); 
           renderAdminFrasesGrid();
           return;
        }

        const timers = document.querySelectorAll('.admin-frase-timer');
        timers.forEach(timerEl => {
          const idx = parseInt(timerEl.getAttribute('data-idx'));
          let waitTime = 0;
          
          if (idx === est.currentIndex) {
             waitTime = timeLeftCurrent;
          } else {
             let steps = idx - est.currentIndex;
             if (steps < 0) steps += FRASES.length;
             waitTime = timeLeftCurrent + (steps - 1) * cuatroHoras;
          }
          
          const hrs = Math.floor(waitTime / (1000 * 60 * 60));
          const mins = Math.floor((waitTime % (1000 * 60 * 60)) / (1000 * 60));
          const secs = Math.floor((waitTime % (1000 * 60)) / 1000);
          
          if (idx === est.currentIndex) {
            timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> Termina en: ${hrs}h ${mins}m ${secs}s`;
          } else {
            timerEl.innerHTML = `<i class="fa-regular fa-clock"></i> En: ${hrs}h ${mins}m ${secs}s`;
          }
        });
      }, 1000);
    }
  };

  window.priorizarFrase = function(idx) {
    if (idx === 0) return;
    const item = FRASES.splice(idx, 1)[0];
    FRASES.unshift(item);
    localStorage.setItem('icpd_frases_estado', JSON.stringify({ currentIndex: 0, lastRotation: Date.now() }));
    db.ref('icpd_frases').set(FRASES);
  };

  window.eliminarFrase = function(idx) {
    if (confirm("¿Eliminar esta frase?")) {
      FRASES.splice(idx, 1);
      
      const estado = JSON.parse(localStorage.getItem('icpd_frases_estado'));
      if (estado && estado.currentIndex >= idx) {
        estado.currentIndex = 0;
        estado.lastRotation = Date.now();
        localStorage.setItem('icpd_frases_estado', JSON.stringify(estado));
      }

      db.ref('icpd_frases').set(FRASES);
    }
  };

  // Render inicial al cargar el admin (si ya cargaron)
  renderAdminFrasesGrid();

  // TAB 6: EDIT LIST LOGIC
  const editTabBtn = document.getElementById('btn-tab-edit-list');
  const editResourceType = document.getElementById('edit-resource-type');
  const editItemsContainer = document.getElementById('admin-edit-items-container');

  function renderAdminEditList() {
    editItemsContainer.innerHTML = '';
    const type = editResourceType.value;
    
    let items = [];
    if (type === 'sermons') {
      items = SERMONS;
    } else if (type === 'actividades') {
      items = ACTIVIDADES;
    } else if (type === 'frases') {
      items = FRASES;
    } else if (type === 'library') {
      items = LIBRARY;
    } else if (type === 'photos') {
      items = PHOTOS;
    } else if (type === 'songs') {
      items = SONGS;
    } else if (type === 'eb') {
      items = EB_VIDEOS;
    } else if (type === 'materials') {
      items = MATERIALS;
    }

    if (items.length === 0) {
      editItemsContainer.innerHTML = '<p style="font-size:0.85rem; color:var(--color-text-muted); text-align:center;">No hay elementos para editar.</p>';
      return;
    }

    items.forEach((item, idx) => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px; border:1px solid rgba(255,255,255,0.05);';
      
      const titleText = item.title || item.titulo || item.caption || `Recurso #${idx + 1}`;
      
      row.innerHTML = `
        <span style="font-size:0.85rem; text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:70%; color:#fff;">${titleText}</span>
        <div style="display:flex; gap:8px;">
          <button class="btn btn-sm btn-icon edit-btn" style="background:#3b82f6;" data-idx="${idx}"><i class="fa-solid fa-pen"></i></button>
          <button class="btn btn-sm btn-icon delete-btn" style="background:#ef4444;" data-idx="${idx}"><i class="fa-solid fa-trash"></i></button>
        </div>
      `;

      // Evento Eliminar
      row.querySelector('.delete-btn').addEventListener('click', () => {
        if (confirm(`¿Estás seguro de que deseas eliminar: "${titleText}"?`)) {
          if (type === 'sermons') {
            SERMONS.splice(idx, 1);
            db.ref('icpd_sermons').set(SERMONS);
          } else if (type === 'actividades') {
            ACTIVIDADES.splice(idx, 1);
            db.ref('icpd_actividades').set(ACTIVIDADES);
          } else if (type === 'photos') {
            PHOTOS.splice(idx, 1);
            db.ref('icpd_photos').set(PHOTOS);
          } else if (type === 'songs') {
            SONGS.splice(idx, 1);
            db.ref('icpd_songs').set(SONGS);
          } else if (type === 'eb') {
            EB_VIDEOS.splice(idx, 1);
            db.ref('icpd_eb_videos').set(EB_VIDEOS);
          } else if (type === 'library') {
            LIBRARY.splice(idx, 1);
            db.ref('icpd_library').set(LIBRARY);
          } else if (type === 'frases') {
            FRASES.splice(idx, 1);
            db.ref('icpd_frases').set(FRASES);
            // Si eliminamos la frase actual, resetear estado
            const estado = JSON.parse(localStorage.getItem('icpd_frases_estado'));
            if (estado && estado.currentIndex >= idx) {
              estado.currentIndex = 0;
              estado.lastRotation = Date.now();
              localStorage.setItem('icpd_frases_estado', JSON.stringify(estado));
            }
          } else if (type === 'materials') {
            MATERIALS.splice(idx, 1);
            db.ref('icpd_materials').set(MATERIALS);
          }
          renderAdminEditList();
          showSuccess();
        }
      });

      // Evento Editar
      row.querySelector('.edit-btn').addEventListener('click', () => {
        if (type === 'sermons') {
          // Desplegar el formulario de edición de sermón detallado
          const editFormContainer = document.getElementById('sermon-detail-edit-form-container');
          const sermon = SERMONS[idx];
          
          document.getElementById('edit-sermon-idx').value = idx;
          document.getElementById('edit-sermon-title').value = sermon.title;
          document.getElementById('edit-sermon-subtitle').value = sermon.subtitle || '';
          document.getElementById('edit-sermon-speaker').value = sermon.speaker;
          document.getElementById('edit-sermon-date').value = sermon.date;
          document.getElementById('edit-sermon-audio-url').value = sermon.audio && sermon.audio.startsWith('data:') ? '' : (sermon.audio || '');
          document.getElementById('edit-sermon-video-url').value = sermon.videoUrl || '';
          
          let coverToDisplay = sermon.cover;
          if (Array.isArray(sermon.cover) && sermon.cover.length > 0) {
            coverToDisplay = sermon.cover[0];
          }
          document.getElementById('edit-sermon-cover-url').value = (typeof coverToDisplay === 'string' && !coverToDisplay.startsWith('data:')) ? coverToDisplay : '';
          
          document.getElementById('edit-sermon-pdf').value = sermon.pdf && sermon.pdf.startsWith('data:') ? '' : (sermon.pdf === '#' ? '' : (sermon.pdf || ''));
          
          document.getElementById('edit-sermon-remove-audio').checked = false;
          document.getElementById('edit-sermon-remove-video').checked = false;
          document.getElementById('edit-sermon-remove-pdf').checked = false;

          editFormContainer.style.display = 'block';
          editItemsContainer.style.display = 'none'; // ocultar lista temporalmente
        } else if (type === 'library') {
          const editLibFormContainer = document.getElementById('library-detail-edit-form-container');
          const book = LIBRARY[idx];
          
          document.getElementById('edit-lib-idx').value = idx;
          document.getElementById('edit-lib-title').value = book.title;
          document.getElementById('edit-lib-author').value = book.author;
          document.getElementById('edit-lib-pdf-file').value = '';
          document.getElementById('edit-lib-pdf-url').value = book.pdfUrl.startsWith('data:') ? '' : book.pdfUrl;
          document.getElementById('edit-lib-cover-file').value = '';
          document.getElementById('edit-lib-cover-url').value = (book.cover && !book.cover.startsWith('data:')) ? book.cover : '';
          
          editLibFormContainer.style.display = 'block';
          editItemsContainer.style.display = 'none';
        } else if (type === 'actividades') {
          const editActFormContainer = document.getElementById('actividad-detail-edit-form-container');
          const act = ACTIVIDADES[idx];
          
          document.getElementById('edit-actividad-idx').value = idx;
          document.getElementById('edit-actividad-dia').value = act.dia;
          document.getElementById('edit-actividad-horario').value = act.horario;
          document.getElementById('edit-actividad-titulo').value = act.titulo;
          document.getElementById('edit-actividad-desc').value = act.desc;
          
          editActFormContainer.style.display = 'block';
          editItemsContainer.style.display = 'none';
        } else if (type === 'eb') {
          const editClasesFormContainer = document.getElementById('clases-detail-edit-form-container');
          const clase = EB_VIDEOS[idx];
          
          document.getElementById('edit-clases-idx').value = idx;
          document.getElementById('edit-clases-title').value = clase.title;
          document.getElementById('edit-clases-author').value = clase.author || '';
          document.getElementById('edit-clases-type').value = clase.type || 'video';
          document.getElementById('edit-clases-file').value = '';
          document.getElementById('edit-clases-url').value = (clase.embedUrl && clase.embedUrl.startsWith('data:')) ? '' : clase.embedUrl;
          document.getElementById('edit-clases-cover-file').value = '';
          document.getElementById('edit-clases-cover-url').value = (clase.cover && !clase.cover.startsWith('data:')) ? clase.cover : '';
          
          editClasesFormContainer.style.display = 'block';
          editItemsContainer.style.display = 'none';
        } else {
          // Edición simple en popup para los otros tipos de recursos
          const newTitle = prompt("Ingresa el nuevo título:", titleText);
          if (newTitle !== null && newTitle.trim() !== "") {
            if (type === 'photos') {
              PHOTOS[idx].caption = newTitle;
              db.ref('icpd_photos').set(PHOTOS);
            } else if (type === 'songs') {
              SONGS[idx].title = newTitle;
              db.ref('icpd_songs').set(SONGS);
            } else if (type === 'eb') {
              EB_VIDEOS[idx].title = newTitle;
              db.ref('icpd_eb_videos').set(EB_VIDEOS);
            } else if (type === 'materials') {
              MATERIALS[idx].title = newTitle;
              db.ref('icpd_materials').set(MATERIALS);
            }
            renderAdminEditList();
            showSuccess();
          }
        }
      });

      editItemsContainer.appendChild(row);
    });
  }

  // Lógica del Formulario de Edición Detallada
  const detailEditForm = document.getElementById('sermon-detail-edit-form');
  const editCancelBtn = document.getElementById('edit-sermon-cancel');
  const editFormContainer = document.getElementById('sermon-detail-edit-form-container');

  editCancelBtn.addEventListener('click', () => {
    editFormContainer.style.display = 'none';
    editItemsContainer.style.display = 'flex';
    detailEditForm.reset();
  });

  detailEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idx = parseInt(document.getElementById('edit-sermon-idx').value);
    const title = document.getElementById('edit-sermon-title').value;
    const subtitle = document.getElementById('edit-sermon-subtitle').value || '';
    const speaker = document.getElementById('edit-sermon-speaker').value;
    const date = document.getElementById('edit-sermon-date').value;
    const audioUrlText = document.getElementById('edit-sermon-audio-url').value;
    const audioFile = document.getElementById('edit-sermon-audio-file').files[0];
    const ytUrl = document.getElementById('edit-sermon-video-url').value;
    const videoFile = document.getElementById('edit-sermon-video-file').files[0];
    const coverFiles = document.getElementById('edit-sermon-cover-file').files;
    const coverUrl = document.getElementById('edit-sermon-cover-url').value;
    const pdfText = document.getElementById('edit-sermon-pdf').value;
    const pdfFile = document.getElementById('edit-sermon-pdf-file').files[0];

    // Checkboxes para eliminar
    const removeAudio = document.getElementById('edit-sermon-remove-audio').checked;
    const removeVideo = document.getElementById('edit-sermon-remove-video').checked;
    const removePdf = document.getElementById('edit-sermon-remove-pdf').checked;

    // Mantener audio existente si no se sube uno nuevo ni se ingresa URL
    let audio = SERMONS[idx].audio;
    if (removeAudio) {
      audio = '#';
    } else if (audioUrlText) {
      audio = audioUrlText;
    } else if (audioFile) {
      audio = await fileToBase64(audioFile);
    }

    // Mantener video existente o procesar nuevo
    let videoUrl = SERMONS[idx].videoUrl;
    if (removeVideo) {
      videoUrl = '#';
    } else if (ytUrl) {
      const ytId = getYouTubeId(ytUrl);
      videoUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : ytUrl;
    } else if (videoFile) {
      videoUrl = await fileToBase64(videoFile);
    }

    // Mantener portada existente o procesar nueva
    let cover = SERMONS[idx].cover || '';
    if (coverUrl) {
      cover = coverUrl;
    } else if (coverFiles.length > 0) {
      let coversArr = [];
      for (let i = 0; i < coverFiles.length; i++) {
        coversArr.push(await fileToBase64(coverFiles[i]));
      }
      cover = coversArr.length === 1 ? coversArr[0] : coversArr;
    }

    let pdf = SERMONS[idx].pdf || '#';
    if (removePdf) {
      pdf = '#';
    } else if (pdfText) {
      pdf = pdfText;
    } else if (pdfFile) {
      pdf = await fileToBase64(pdfFile);
    }

    SERMONS[idx] = {
      ...SERMONS[idx],
      title,
      subtitle,
      speaker,
      date,
      audio,
      videoUrl,
      pdf,
      cover
    };

    db.ref('icpd_sermons').set(SERMONS);
    
    // Resetear vistas
    editFormContainer.style.display = 'none';
    editItemsContainer.style.display = 'flex';
    detailEditForm.reset();
    renderAdminEditList();
    showSuccess();
  });

  // Lógica del Formulario de Edición de Biblioteca
  const libEditForm = document.getElementById('library-detail-edit-form');
  const libEditCancelBtn = document.getElementById('edit-lib-cancel');
  const libEditFormContainer = document.getElementById('library-detail-edit-form-container');

  libEditCancelBtn.addEventListener('click', () => {
    libEditFormContainer.style.display = 'none';
    editItemsContainer.style.display = 'flex';
    libEditForm.reset();
  });

  libEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idx = parseInt(document.getElementById('edit-lib-idx').value);
    const title = document.getElementById('edit-lib-title').value;
    const author = document.getElementById('edit-lib-author').value;
    const pdfFile = document.getElementById('edit-lib-pdf-file').files[0];
    const pdfUrl = document.getElementById('edit-lib-pdf-url').value;
    const coverFile = document.getElementById('edit-lib-cover-file').files[0];
    const coverUrlText = document.getElementById('edit-lib-cover-url').value;

    let pdfBase64 = LIBRARY[idx].pdfUrl;
    let coverUrl = LIBRARY[idx].cover;

    if (pdfFile) {
      pdfBase64 = await fileToBase64(pdfFile);
      if (!coverFile && !coverUrlText) {
        coverUrl = await getPdfFirstPage(pdfBase64);
      }
    } else if (pdfUrl) {
      pdfBase64 = pdfUrl;
    }

    if (coverUrlText) {
      coverUrl = coverUrlText;
    } else if (coverFile) {
      coverUrl = await fileToBase64(coverFile);
    }

    LIBRARY[idx] = {
      ...LIBRARY[idx],
      title,
      author,
      cover: coverUrl,
      pdfUrl: pdfBase64
    };

    db.ref('icpd_library').set(LIBRARY);

    libEditFormContainer.style.display = 'none';
    editItemsContainer.style.display = 'flex';
    libEditForm.reset();
    renderAdminEditList();
    showSuccess();
  });

  // Lógica del Formulario de Edición de Actividades
  const actividadEditForm = document.getElementById('actividad-detail-edit-form');
  const actividadEditCancelBtn = document.getElementById('edit-actividad-cancel');
  const actividadEditFormContainer = document.getElementById('actividad-detail-edit-form-container');

  if (actividadEditCancelBtn) {
    actividadEditCancelBtn.addEventListener('click', () => {
      actividadEditFormContainer.style.display = 'none';
      editItemsContainer.style.display = 'flex';
      actividadEditForm.reset();
    });
  }

  if (actividadEditForm) {
    actividadEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idx = parseInt(document.getElementById('edit-actividad-idx').value);
      
      ACTIVIDADES[idx] = {
        ...ACTIVIDADES[idx],
        dia: document.getElementById('edit-actividad-dia').value,
        horario: document.getElementById('edit-actividad-horario').value,
        titulo: document.getElementById('edit-actividad-titulo').value,
        desc: document.getElementById('edit-actividad-desc').value
      };

      db.ref('icpd_actividades').set(ACTIVIDADES);
      
      actividadEditFormContainer.style.display = 'none';
      editItemsContainer.style.display = 'flex';
      actividadEditForm.reset();
      renderAdminEditList();
      showSuccess();
    });
  }

  // Lógica del Formulario de Edición de Clases EB
  const clasesEditForm = document.getElementById('clases-detail-edit-form');
  const clasesEditCancelBtn = document.getElementById('edit-clases-cancel');
  const clasesEditFormContainer = document.getElementById('clases-detail-edit-form-container');

  if (clasesEditCancelBtn) {
    clasesEditCancelBtn.addEventListener('click', () => {
      clasesEditFormContainer.style.display = 'none';
      editItemsContainer.style.display = 'flex';
      clasesEditForm.reset();
    });
  }

  if (clasesEditForm) {
    clasesEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const idx = parseInt(document.getElementById('edit-clases-idx').value);
      const title = document.getElementById('edit-clases-title').value;
      const author = document.getElementById('edit-clases-author').value;
      const type = document.getElementById('edit-clases-type').value;
      
      const file = document.getElementById('edit-clases-file').files[0];
      const urlText = document.getElementById('edit-clases-url').value;
      
      const coverFile = document.getElementById('edit-clases-cover-file').files[0];
      const coverUrlText = document.getElementById('edit-clases-cover-url').value;

      const maxMb = 7;

      let embedUrl = EB_VIDEOS[idx].embedUrl;

      if (urlText) {
        const ytId = getYouTubeId(urlText);
        if (ytId) {
          embedUrl = `https://www.youtube.com/embed/${ytId}`;
        } else {
          embedUrl = urlText;
        }
      } else if (file) {
        if (file.size > maxMb * 1024 * 1024) {
          return alert(`El archivo es muy grande (${(file.size/1024/1024).toFixed(1)}MB). El máximo es ${maxMb}MB.\nPor favor, sube el archivo a un servicio externo (Google Drive, YouTube) y pega el enlace.`);
        }
        embedUrl = await fileToBase64(file);
        type = file.type.startsWith('audio') ? 'audio' : 'video';
      }
      
      let coverUrl = EB_VIDEOS[idx].cover || '';
      if (coverUrlText) {
        coverUrl = coverUrlText;
      } else if (coverFile) {
        coverUrl = await fileToBase64(coverFile);
      }

      EB_VIDEOS[idx] = {
        ...EB_VIDEOS[idx],
        title,
        author,
        embedUrl,
        type,
        cover: coverUrl
      };

      db.ref('icpd_eb_videos').set(EB_VIDEOS);
      
      clasesEditFormContainer.style.display = 'none';
      editItemsContainer.style.display = 'flex';
      clasesEditForm.reset();
      renderAdminEditList();
      showSuccess();
    });
  }

  editTabBtn.addEventListener('click', renderAdminEditList);
  editResourceType.addEventListener('change', renderAdminEditList);

  // Secret activation: 7 clicks on navbar logo link or logo image
  const logoLink = document.querySelector('.logo-link');
  let clickCount = 0;
  let clickTimer = null;

  if (logoLink) {
    logoLink.addEventListener('click', (e) => {
      e.preventDefault();
      clickCount++;
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        clickCount = 0;
      }, 3500);

      if (clickCount === 7) {
        clickCount = 0;
        adminModal.classList.add('active');
      }
    });
  }
}

// --- Dynamic Photo Gallery rendering & Lightbox Logic ---
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  PHOTOS.forEach((photo, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    item.innerHTML = `
      <img src="${photo.src}" alt="${photo.caption}">
      <div class="gallery-caption">${photo.caption}</div>
    `;
    item.addEventListener('click', () => {
      openGalleryLightbox(idx);
    });
    grid.appendChild(item);
  });
}

let currentLightboxImages = [];
let currentLightboxIndex = 0;

window.openLightboxFromSermon = function(el, caption) {
  const coversJson = el.getAttribute('data-covers');
  if (coversJson) {
    const covers = JSON.parse(decodeURIComponent(coversJson));
    openLightbox(covers, caption);
  }
};

window.openGalleryLightbox = function(startIndex) {
  const lightbox = document.getElementById('gallery-lightbox');
  const img = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  
  currentLightboxImages = PHOTOS.map(p => p.src);
  window.currentLightboxCaptions = PHOTOS.map(p => p.caption);
  currentLightboxIndex = startIndex;
  
  if (currentLightboxImages.length > 1) {
    if(prevBtn) prevBtn.style.display = 'block';
    if(nextBtn) nextBtn.style.display = 'block';
  } else {
    if(prevBtn) prevBtn.style.display = 'none';
    if(nextBtn) nextBtn.style.display = 'none';
  }
  
  img.src = currentLightboxImages[currentLightboxIndex];
  captionEl.textContent = window.currentLightboxCaptions[currentLightboxIndex];
  lightbox.classList.add('active');
};

function openLightbox(srcOrArray, caption) {
  const lightbox = document.getElementById('gallery-lightbox');
  const img = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  
  currentLightboxImages = Array.isArray(srcOrArray) ? srcOrArray : [srcOrArray];
  window.currentLightboxCaptions = []; // Para no mezclar
  currentLightboxIndex = 0;
  
  if (currentLightboxImages.length > 1) {
    if(prevBtn) prevBtn.style.display = 'block';
    if(nextBtn) nextBtn.style.display = 'block';
  } else {
    if(prevBtn) prevBtn.style.display = 'none';
    if(nextBtn) nextBtn.style.display = 'none';
  }
  
  img.src = currentLightboxImages[currentLightboxIndex];
  captionEl.textContent = caption;
  lightbox.classList.add('active');
}

function updateLightboxImage() {
  const img = document.getElementById('lightbox-img');
  const captionEl = document.getElementById('lightbox-caption');
  img.src = currentLightboxImages[currentLightboxIndex];
  if (window.currentLightboxCaptions && window.currentLightboxCaptions.length > 0) {
    captionEl.textContent = window.currentLightboxCaptions[currentLightboxIndex];
  }
}

function initLightbox() {
  const lightbox = document.getElementById('gallery-lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');
  if (!lightbox || !closeBtn) return;
  
  closeBtn.addEventListener('click', () => {
    lightbox.classList.remove('active');
  });
  
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      lightbox.classList.remove('active');
    }
  });

  if (prevBtn && nextBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
      updateLightboxImage();
    });
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
      updateLightboxImage();
    });
  }
}

function getDefaultPhotos() {
  return [
    {
      src: "logo.jpg",
      caption: "Reunión de Adoración Dominical"
    },
    {
      src: "logo.jpg",
      caption: "Identidad Visual Oficial ICPD"
    },
    {
      src: "logo.jpg",
      caption: "Comunidad de Fe en San Justo"
    }
  ];
}

// Helper to convert Local File to Base64 String for browser storage
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Optimización para imágenes: redimensionar y comprimir usando Canvas para no exceder cuota
    if (file.type.startsWith('image/')) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir a JPEG calidad 70%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(objectUrl);
        resolve(dataUrl);
      };
      img.onerror = (e) => {
        URL.revokeObjectURL(objectUrl);
        reject(e);
      };
      img.src = objectUrl;
      return;
    }

    // Para audio, video u otros archivos
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      let res = reader.result;
      // Parche: Los audios MPEG/WhatsApp de Windows suelen detectarse como video/mpeg
      if (file.name.toLowerCase().endsWith('.mpeg')) {
        res = res.replace(/^data:(video\/mpeg|application\/octet-stream);base64,/, 'data:audio/mpeg;base64,');
      }
      resolve(res);
    };
    reader.onerror = error => reject(error);
  });
}

window.openVideoModal = function(url, idx = null, type = null) {
  const modal = document.getElementById('video-modal');
  const container = modal.querySelector('.video-container');
  
  const aiPanel = document.getElementById('ai-panel-container');
  if (aiPanel) {
    if (idx !== null && type !== null) {
      aiPanel.style.display = 'block';
      if (typeof setupGroqPanel === 'function') setupGroqPanel(idx, type);
    } else {
      aiPanel.style.display = 'none';
    }
  }

  const ytId = getYouTubeId(url);
  if (ytId) {
    container.innerHTML = `<div id="modal-yt-player" style="width:100%; height:100%;"></div>`;
    modal.classList.add('active');
    
    if (isYtApiReady) {
      ytPlayer = new YT.Player('modal-yt-player', {
        videoId: ytId,
        playerVars: { 'autoplay': 1, 'playsinline': 1 }
      });
    } else {
      container.innerHTML = `<iframe id="modal-iframe" src="https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add('active');
    }
  } else {
    const embedUrl = (typeof convertDriveLinkToEmbed === 'function') ? convertDriveLinkToEmbed(url) : url;
    container.innerHTML = `<iframe id="modal-iframe" src="${embedUrl}" frameborder="0" allowfullscreen></iframe>`;
    modal.classList.add('active');
  }
};

// --- YouTube IFrame API para Autoplay de Canciones ---
let isYtApiReady = false;
window.onYouTubeIframeAPIReady = function() {
  isYtApiReady = true;
};

const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
if(firstScriptTag) {
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
} else {
  document.head.appendChild(tag);
}

let ytPlayer = null;
window.currentSongIndex = -1;
window.currentFilteredSongs = [];

window.playSongFromPlaylist = function(index) {
  if (index < 0 || index >= window.currentFilteredSongs.length) return;
  window.currentSongIndex = index;
  const song = window.currentFilteredSongs[index];
  
  const safeEmbedUrl = song.embedUrl || '';
  const isLocalFile = safeEmbedUrl.startsWith('data:');
  const modal = document.getElementById('video-modal');
  const container = modal.querySelector('.video-container');

  if (isLocalFile) {
    openLocalVideoModal(song.embedUrl);
    // Agregar event listener para autoplay en videos locales
    setTimeout(() => {
      const localVideo = document.getElementById('modal-video-player');
      if (localVideo) {
        localVideo.onended = () => { playSongFromPlaylist(window.currentSongIndex + 1); };
      }
    }, 100);
  } else {
    const ytId = getYouTubeId(song.embedUrl);
    if (!ytId) {
      // Fallback para Google Drive, no puede hacer autoplay al terminar
      container.innerHTML = `<iframe id="modal-iframe" src="${convertDriveLinkToEmbed(song.embedUrl)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add('active');
      return;
    }

    // Usar YouTube API
    container.innerHTML = `<div id="modal-yt-player" style="width:100%; height:100%;"></div>`;
    modal.classList.add('active');

    if (isYtApiReady) {
      if (ytPlayer) {
        // Asegurar limpiar instancias viejas si es posible, o recrear
      }
      ytPlayer = new YT.Player('modal-yt-player', {
        videoId: ytId,
        playerVars: { 'autoplay': 1, 'playsinline': 1 },
        events: {
          'onStateChange': function(event) {
            if (event.data === YT.PlayerState.ENDED) {
              playSongFromPlaylist(window.currentSongIndex + 1);
            }
          }
        }
      });
    } else {
      // API no lista, usar iframe normal
      container.innerHTML = `<iframe id="modal-iframe" src="https://www.youtube.com/embed/${ytId}?autoplay=1" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
      modal.classList.add('active');
    }
  }
};

window.openPdfModal = function(url, title) {
  if (!url || url === '#') return;
  const modal = document.getElementById('pdf-modal');
  const iframe = document.getElementById('pdf-modal-iframe');
  const titleEl = document.getElementById('pdf-modal-title');
  const downloadBtn = document.getElementById('pdf-modal-download');
  const shareBtn = document.getElementById('pdf-modal-share');

  iframe.src = url;
  titleEl.textContent = title;
  downloadBtn.href = url;
  downloadBtn.download = title + '.pdf';
  
  shareBtn.onclick = () => {
    // Si la URL es Base64 muy larga, compartir el texto o intentar enviar el archivo.
    // Como es complejo compartir un Base64 como archivo nativo, si es base64 mejor avisar.
    let shareUrl = url;
    if (url.startsWith('data:')) {
      shareUrl = window.location.href; // Fallback a la web si es archivo incrustado
    } else if (!url.startsWith('http')) {
      // Si es un archivo local relativo, convertirlo a absoluto
      shareUrl = window.location.origin + window.location.pathname + url.replace('./', '');
    }

    if (navigator.share) {
      navigator.share({
        title: title,
        text: 'Mira este sermón de ICPD: ' + title,
        url: shareUrl
      }).catch(err => console.log('Error compartiendo', err));
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert("¡Enlace copiado al portapapeles para compartir!");
      }).catch(err => {
        alert("No se pudo compartir en tu dispositivo.");
      });
    }
  };

  modal.classList.add('active');
};

// --- Utilities ---
function formatDateString(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  const options = { day: 'numeric', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('es-ES', options);
}

function formatTime(secs) {
  const min = Math.floor(secs / 60);
  const sec = Math.floor(secs % 60);
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// --- Lógica del Hero Editable ---
window.renderHero = function() {
  const data = window.HERO_DATA || {};
  const logoImg = document.getElementById('hero-logo-img');
  const navLogoImg = document.getElementById('nav-logo-img');
  const footerLogoImg = document.getElementById('footer-logo-img');
  const title = document.getElementById('hero-title');
  const subtitle = document.getElementById('hero-subtitle');
  const buttonsContainer = document.getElementById('hero-buttons-container');

  const defaultLogo = "logo.jpg";
  const displayLogo = data.logo || defaultLogo;

  if (logoImg) logoImg.src = displayLogo;
  if (navLogoImg) navLogoImg.src = displayLogo;
  if (footerLogoImg) footerLogoImg.src = displayLogo;
  if (title && data.title) title.textContent = data.title;
  if (subtitle && data.subtitle) subtitle.textContent = data.subtitle;

  if (buttonsContainer && data.buttons && Array.isArray(data.buttons)) {
    buttonsContainer.innerHTML = '';
    data.buttons.forEach(btn => {
      const a = document.createElement('a');
      a.href = btn.url || '#';
      a.className = `btn ${btn.style || 'btn-primary'}`;
      a.innerHTML = `<i class="${btn.icon || 'fa-solid fa-play'}"></i> ${btn.text}`;
      buttonsContainer.appendChild(a);
    });
  }
};

// Panel de Administración: Hero
document.addEventListener('DOMContentLoaded', () => {
  const heroForm = document.getElementById('hero-settings-form');
  const addBtn = document.getElementById('btn-add-hero-btn');
  const btnsEditor = document.getElementById('hero-buttons-editor');

  function renderHeroEditorBtns(buttons) {
    btnsEditor.innerHTML = '';
    if (!buttons) buttons = [];
    buttons.forEach((btn, idx) => {
      const btnGroup = document.createElement('div');
      btnGroup.className = 'admin-field';
      btnGroup.style.cssText = 'background: rgba(255,255,255,0.05); padding: 15px; border-radius: 8px; margin-bottom: 15px; border: 1px solid rgba(255,255,255,0.1); position: relative;';
      
      btnGroup.innerHTML = `
        <button type="button" class="btn btn-sm" style="position: absolute; top: 10px; right: 10px; background: #ef4444;" onclick="this.parentElement.remove()"><i class="fa-solid fa-trash"></i></button>
        <label>Botón #${idx + 1}</label>
        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
          <input type="text" class="hero-btn-text" placeholder="Texto (ej. Ver Actividades)" value="${btn.text || ''}" style="flex:1;" required>
          <input type="text" class="hero-btn-url" placeholder="URL o ancla (ej. #actividades)" value="${btn.url || ''}" style="flex:1;" required>
        </div>
        <div style="display: flex; gap: 10px;">
          <input type="text" class="hero-btn-icon" placeholder="Ícono (ej. fa-solid fa-calendar)" value="${btn.icon || ''}" style="flex:1;">
          <select class="hero-btn-style" style="flex:1; padding: 8px; background: var(--color-bg-card-alt); color: #fff; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px;">
            <option value="btn-primary" ${btn.style === 'btn-primary' ? 'selected' : ''}>Dorado (Primario)</option>
            <option value="btn-secondary" ${btn.style === 'btn-secondary' ? 'selected' : ''}>Transparente (Secundario)</option>
          </select>
        </div>
      `;
      btnsEditor.appendChild(btnGroup);
    });
  }

  // Cargar datos actuales cuando se abre el tab del hero
  const tabHeroBtn = document.querySelector('[data-tab="tab-hero"]');
  if (tabHeroBtn) {
    tabHeroBtn.addEventListener('click', () => {
      const data = window.HERO_DATA || {};
      document.getElementById('form-hero-title').value = data.title || 'Iglesia Cristiana Pueblo de Dios';
      document.getElementById('form-hero-subtitle').value = data.subtitle || 'Un lugar de encuentro con Dios y comunidad en San Justo';
      document.getElementById('form-hero-logo-url').value = data.logo && !data.logo.startsWith('data:') ? data.logo : '';
      renderHeroEditorBtns(data.buttons || [
        { text: "Últimos Sermones", url: "#sermones", icon: "fa-solid fa-circle-play", style: "btn-primary" },
        { text: "Ver Actividades", url: "#actividades", icon: "fa-solid fa-calendar", style: "btn-secondary" }
      ]);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const currentBtns = [];
      const groups = btnsEditor.querySelectorAll('.admin-field');
      groups.forEach(g => {
        currentBtns.push({
          text: g.querySelector('.hero-btn-text').value,
          url: g.querySelector('.hero-btn-url').value,
          icon: g.querySelector('.hero-btn-icon').value,
          style: g.querySelector('.hero-btn-style').value
        });
      });
      currentBtns.push({ text: "Nuevo Botón", url: "#", icon: "fa-solid fa-link", style: "btn-primary" });
      renderHeroEditorBtns(currentBtns);
    });
  }

  if (heroForm) {
    heroForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('form-hero-title').value;
      const subtitle = document.getElementById('form-hero-subtitle').value;
      const logoFile = document.getElementById('form-hero-logo-file').files[0];
      const logoUrl = document.getElementById('form-hero-logo-url').value;
      
      let finalLogo = window.HERO_DATA?.logo || '';
      
      if (logoFile) {
        if (logoFile.size > 2 * 1024 * 1024) return alert("La imagen del logo es muy grande. Máx 2MB.");
        finalLogo = await fileToBase64(logoFile);
      } else if (logoUrl && logoUrl.trim() !== "") {
        finalLogo = logoUrl;
      }

      const buttons = [];
      const groups = btnsEditor.querySelectorAll('.admin-field');
      groups.forEach(g => {
        buttons.push({
          text: g.querySelector('.hero-btn-text').value,
          url: g.querySelector('.hero-btn-url').value,
          icon: g.querySelector('.hero-btn-icon').value,
          style: g.querySelector('.hero-btn-style').value
        });
      });

      const newData = {
        title,
        subtitle,
        logo: finalLogo,
        buttons
      };

      try {
        await firebase.database().ref('icpd_hero').set(newData);
        alert("¡Configuración de Inicio guardada correctamente!");
      } catch (error) {
        alert("Error al guardar: " + error.message);
      }
    });
  }
});

// --- Groq AI Integration ---
const getGroqApiKey = () => {
  return localStorage.getItem('icpd_groq_api_key') || '';
};

window.switchAITab = function(tab) {
  const tabs = document.querySelectorAll('.ai-tab-btn');
  tabs.forEach(t => { t.classList.remove('active'); t.style.color = '#fff'; t.style.borderBottom = 'none'; });
  
  const activeTabBtn = document.querySelector(`.ai-tab-btn[onclick="switchAITab('${tab}')"]`);
  if (activeTabBtn) {
    activeTabBtn.classList.add('active');
    activeTabBtn.style.color = 'var(--color-gold)';
    activeTabBtn.style.borderBottom = '2px solid var(--color-gold)';
  }
  
  document.getElementById('ai-qna-content').style.display = tab === 'qna' ? 'block' : 'none';
  document.getElementById('ai-subs-content').style.display = tab === 'subs' ? 'block' : 'none';
};

window.seekToTime = function(seconds) {
  if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
    ytPlayer.seekTo(seconds, true);
    ytPlayer.playVideo();
  } else {
    // If iframe was used without API wrapper
    const iframe = document.getElementById('modal-iframe') || document.getElementById('modal-yt-player');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [seconds, true]
      }), '*');
      iframe.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'playVideo',
        args: []
      }), '*');
    }
  }
};

window.setupGroqPanel = function(idx, type) {
  const btn = document.getElementById('btn-groq-analyze');
  const status = document.getElementById('ai-status');
  const tabs = document.getElementById('ai-content-tabs');
  const qnaContent = document.getElementById('ai-qna-content');
  const subsContent = document.getElementById('ai-subs-content');
  
  if (!btn || !status || !tabs || !qnaContent || !subsContent) return;
  
  btn.style.display = 'block';
  status.style.display = 'none';
  tabs.style.display = 'none';
  qnaContent.style.display = 'none';
  subsContent.style.display = 'none';
  
  btn.onclick = async () => {
    let audioUrl = '';
    if (type === 'sermon' && SERMONS[idx]) {
      audioUrl = SERMONS[idx].audio;
    } else if (type === 'eb' && CLASES_EB[idx]) {
      audioUrl = CLASES_EB[idx].embedUrl; // Para clases que sólo subieron audio
    }
    
    if (!audioUrl || audioUrl === '#' || audioUrl.includes('SoundHelix')) {
       alert("No hay un archivo de audio válido adjunto a este video para analizar. Asegúrate de haber subido el MP3/M4A en el administrador.");
       return;
    }
    
    if (!audioUrl.startsWith('data:audio') && !audioUrl.startsWith('data:video') && !audioUrl.startsWith('http')) {
       alert("Formato de audio no compatible para extraer.");
       return;
    }
    
    btn.style.display = 'none';
    status.style.display = 'block';
    status.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Obteniendo el audio y transcribiendo con Whisper... esto puede tardar unos minutos según el tamaño.';
    
    try {
      // 1. Fetch audio and convert to blob
      let audioBlob;
      try {
        const res = await fetch(audioUrl);
        audioBlob = await res.blob();
      } catch (e) {
        throw new Error('No se pudo descargar el archivo de audio. Verifica que no haya restricciones de seguridad (CORS). Sube los audios directamente (Archivo) para mayor seguridad.');
      }
      
      // limit check (Groq Whisper limit is 25MB)
      if (audioBlob.size > 24 * 1024 * 1024) {
         status.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i> El audio es demasiado grande para la IA (>25MB). Sube una versión de menor calidad (mp3 a 64kbps).';
         return;
      }
      
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.mp3');
      formData.append('model', 'whisper-large-v3');
      formData.append('response_format', 'verbose_json');
      
      const whisperRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
         method: 'POST',
         headers: {
            'Authorization': `Bearer ${getGroqApiKey()}`
         },
         body: formData
      });
      
      if (!whisperRes.ok) {
         throw new Error('Error al transcribir (Groq): ' + (await whisperRes.text()));
      }
      
      const whisperData = await whisperRes.json();
      const transcriptText = whisperData.text || '';
      
      if (!transcriptText || transcriptText.trim() === '') {
         throw new Error('La transcripción devolvió texto vacío.');
      }
      
      // render subtitles
      let subsHtml = '';
      if (whisperData.segments) {
         whisperData.segments.forEach(seg => {
            const m = Math.floor(seg.start / 60);
            const s = Math.floor(seg.start % 60);
            const timeStr = `${m}:${s < 10 ? '0'+s : s}`;
            subsHtml += `<p><a href="#" onclick="seekToTime(${seg.start}); return false;" style="color:var(--color-gold); text-decoration:none; margin-right:8px; font-weight:bold;">[${timeStr}]</a> ${seg.text}</p>`;
         });
      } else {
         subsHtml = `<p>${transcriptText}</p>`;
      }
      subsContent.innerHTML = subsHtml;
      
      // 2. Chat API for questionnaire
      status.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Generando el cuestionario de estudio con LLaMA 3...';
      
      const chatRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
         method: 'POST',
         headers: {
            'Authorization': `Bearer ${getGroqApiKey()}`,
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            model: 'llama3-8b-8192',
            messages: [
               { role: 'system', content: 'Eres un asistente de estudios bíblicos. Dada una transcripción, genera 3 a 5 preguntas de comprensión importantes. Devuelve SOLO un JSON con este formato exacto: {"preguntas": [{"pregunta": "texto", "respuesta": "texto", "timestamp_hint": 120}]}. Usa timestamp_hint en segundos numéricos basados en el contexto donde se responde la pregunta, o 0 si no sabes.' },
               { role: 'user', content: `Transcripción: ${transcriptText.substring(0, 50000)}` }
            ],
            response_format: { type: 'json_object' }
         })
      });
      
      if (!chatRes.ok) {
         throw new Error('Error al generar cuestionario: ' + (await chatRes.text()));
      }
      
      const chatData = await chatRes.json();
      const qnaResult = JSON.parse(chatData.choices[0].message.content);
      
      let qnaHtml = '<ul style="list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:15px;">';
      if (qnaResult && qnaResult.preguntas) {
        qnaResult.preguntas.forEach((q, i) => {
           const m = Math.floor(q.timestamp_hint / 60);
           const s = Math.floor(q.timestamp_hint % 60);
           const timeStr = `${m}:${s < 10 ? '0'+s : s}`;
           qnaHtml += `
              <li style="background:rgba(255,255,255,0.05); padding:15px; border-radius:6px; border-left:3px solid var(--color-gold);">
                 <strong style="color:var(--color-gold); display:block; margin-bottom:8px; font-size:1rem;">${i+1}. ${q.pregunta}</strong>
                 <p style="margin:0 0 10px 0; color:#ddd; font-style:italic;">Respuesta: ${q.respuesta}</p>
                 <button onclick="seekToTime(${q.timestamp_hint})" class="btn btn-sm" style="background:transparent; border:1px solid var(--color-gold); color:var(--color-gold); padding:4px 10px; font-size:0.75rem;"><i class="fa-solid fa-play"></i> Saltar al video (${timeStr})</button>
              </li>
           `;
        });
      }
      qnaHtml += '</ul>';
      
      qnaContent.innerHTML = qnaHtml;
      
      status.style.display = 'none';
      tabs.style.display = 'flex';
      switchAITab('qna');
      
    } catch (e) {
      status.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;"></i> Ocurrió un error: ${e.message}`;
    }
  };
};

