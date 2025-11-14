// script.js
// Handles: intersection observer, PDF export, non-breaking-space helper, and gallery modal logic

// ------------------ Intersection observer (fade-in) ------------------
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, observerOptions);
document.querySelectorAll('section').forEach(section => observer.observe(section));

// Inject fade CSS for sections
(function injectFadeCSS(){
  const style = document.createElement('style');
  style.innerHTML = `
    section { opacity: 0; transform: translateY(15px); transition: opacity 0.6s ease, transform 0.6s ease; }
    section.visible { opacity: 1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
})();

// ------------------ PDF generation (compact for one A4 page) ------------------
document.getElementById("download-btn")?.addEventListener("click", () => {
  const content = document.getElementById("profile-content").cloneNode(true);

  // Limit to 3 items per section (compact)
  content.querySelectorAll("section").forEach(section => {
    const entries = section.querySelectorAll("div:not(:has(h2)), ul li");
    entries.forEach((el, i) => i >= 3 && el.remove());
  });

  // Prepare temporary container for rendering
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "absolute";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = "800px";
  tempContainer.style.padding = "20px";
  tempContainer.style.background = "white";
  tempContainer.appendChild(content);
  document.body.appendChild(tempContainer);

  // Auto-scale content to fit one A4 page (≈1122px tall @ 96dpi)
  const a4HeightPx = 1122;
  const contentHeight = tempContainer.scrollHeight;
  const scale = Math.min(1, a4HeightPx / contentHeight);

  // Apply compact styling for print
  content.style.transform = `scale(${scale})`;
  content.style.transformOrigin = "top left";
  content.style.width = `${100 / scale}%`;
  content.style.fontSize = "12px";
  content.style.lineHeight = "1.3";
  content.style.margin = "0 auto";

  // Adjust heading and section spacing for PDF
  content.querySelectorAll("h2").forEach(h => {
    h.style.fontSize = "0.9rem";
    h.style.marginBottom = "0.4rem";
  });
  content.querySelectorAll("section").forEach(s => {
    s.style.marginBottom = "0.9rem";
    s.style.paddingBottom = "0.9rem";
  });

  const opt = {
    margin: 0.25,
    filename: "Daniela-Picao-Resume.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ['avoid-all'] }
  };

  html2pdf().set(opt).from(tempContainer).save().then(() => tempContainer.remove());
});

// ------------------ non-breaking space helper (only between last two words) ------------------
document.addEventListener("DOMContentLoaded", () => {
  const selector = "p, h1, h2, h3, li";
  document.querySelectorAll(selector).forEach(el => {
    // skip if contains links or buttons (you requested not to modify links)
    if (el.querySelector("a, button")) return;
    const text = el.innerHTML.trim();
    // Replace only the final regular space between the last two words with &nbsp;
    el.innerHTML = text.replace(/ (\S+)([.,;!?"]*)\s*$/, "&nbsp;$1$2");
  });
});

// ------------------ Gallery / Modal logic ------------------

(function setupGalleries(){
  // Select all gallery strips
  const strips = Array.from(document.querySelectorAll('.gallery-strip'));

  // Build gallery data map from DOM
  const galleries = {};
  strips.forEach(strip => {
    const id = strip.dataset.gallery;
    const thumbs = Array.from(strip.querySelectorAll('.thumb'));
    galleries[id] = thumbs.map(t => ({
      src: t.dataset.src || (t.querySelector('img')?.getAttribute('src')),
      alt: t.querySelector('img')?.alt || '',
      thumbEl: t
    }));
  });

  // Modal elements
  const modal = document.getElementById('gallery-modal');
  const modalImg = document.getElementById('gallery-modal-img');
  const btnClose = document.getElementById('modal-close');
  const btnPrev = document.getElementById('modal-prev');
  const btnNext = document.getElementById('modal-next');

  let activeGalleryId = null;
  let activeIndex = 0;

  // Open modal for given gallery id and index
  function openModal(galleryId, index) {
    const gallery = galleries[galleryId];
    if (!gallery || !gallery.length) return;
    activeGalleryId = galleryId;
    activeIndex = index || 0;
    updateModalImage();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // focus close for accessibility
    btnClose.focus();
  }

  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    activeGalleryId = null;
    activeIndex = 0;
    document.body.style.overflow = '';
  }

  function updateModalImage() {
    const gallery = galleries[activeGalleryId];
    if (!gallery || !gallery.length) return;
    const item = gallery[activeIndex];
    modalImg.src = item.src;
    modalImg.alt = item.alt || '';
    // if you want to pre-load neighbours:
    preload(gallery[(activeIndex + 1) % gallery.length]?.src);
    preload(gallery[(activeIndex - 1 + gallery.length) % gallery.length]?.src);
  }

  function preload(src){
    if (!src) return;
    const i = new Image();
    i.src = src;
  }

  function showNext() {
    const gallery = galleries[activeGalleryId];
    activeIndex = (activeIndex + 1) % gallery.length;
    updateModalImage();
  }
  function showPrev() {
    const gallery = galleries[activeGalleryId];
    activeIndex = (activeIndex - 1 + gallery.length) % gallery.length;
    updateModalImage();
  }

  // Attach click handlers to thumbnails
  Object.keys(galleries).forEach(gid => {
    galleries[gid].forEach((item, idx) => {
      const el = item.thumbEl;
      if (!el) return;
      el.addEventListener('click', () => openModal(gid, idx));
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          openModal(gid, idx);
        }
      });
    });
  });

  // Modal controls
  btnClose.addEventListener('click', closeModal);
  btnPrev.addEventListener('click', showPrev);
  btnNext.addEventListener('click', showNext);

  // click outside image to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!activeGalleryId) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft') showPrev();
  });

  // touch / swipe support for modal image
  (function addSwipeSupport(){
    let startX = 0;
    let startY = 0;
    let tracking = false;
    const threshold = 40; // px
    modalImg.addEventListener('touchstart', (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
    }, {passive: true});

    modalImg.addEventListener('touchmove', (e) => {
      if (!tracking || !e.touches || e.touches.length === 0) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      // if vertical scroll is more prominent, ignore
      if (Math.abs(dy) > Math.abs(dx)) { tracking = false; return; }
    }, {passive: true});

    modalImg.addEventListener('touchend', (e) => {
      if (!tracking) return;
      const endX = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX : 0;
      const deltaX = endX - startX;
      if (Math.abs(deltaX) > threshold) {
        if (deltaX < 0) showNext();
        else showPrev();
      }
      tracking = false;
    });
  })();

  // prevent image drag ghost
  modalImg.addEventListener('dragstart', e => e.preventDefault());
})();
