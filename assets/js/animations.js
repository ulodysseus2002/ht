/* ======================= COUCHE PREMIUM : ANIMATIONS & MICRO-INTERACTIONS =======================
   Additif et non-intrusif : ce fichier ne modifie jamais l'état applicatif (S) ni la logique
   métier définie dans app.js. Il se contente d'observer le DOM déjà rendu pour y ajouter des
   transitions élégantes, et respecte prefers-reduced-motion à chaque étape. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hoverCapable = matchMedia('(hover:hover)').matches;

  /* ---------- Barre de progression de navigation ---------- */
  const bar = document.createElement('div');
  bar.className = 'route-progress';
  document.body.appendChild(bar);
  let barTimer;
  function ticProgress(){
    clearTimeout(barTimer);
    bar.style.transition = 'none';
    bar.style.opacity = '1';
    bar.style.width = '0%';
    requestAnimationFrame(() => {
      bar.style.transition = '';
      bar.style.width = '78%';
    });
    barTimer = setTimeout(() => {
      bar.style.width = '100%';
      setTimeout(() => { bar.style.opacity = '0'; }, 200);
    }, 280);
  }
  window.addEventListener('hashchange', ticProgress);
  ticProgress();

  /* ---------- Lueur qui suit le curseur (bureau uniquement) ---------- */
  if (!reduced && hoverCapable) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);
    let raf = null, gx = 0, gy = 0;
    document.addEventListener('pointermove', e => {
      gx = e.clientX; gy = e.clientY;
      glow.classList.add('on');
      if (!raf) raf = requestAnimationFrame(() => { glow.style.transform = `translate(${gx}px, ${gy}px)`; raf = null; });
    }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    document.addEventListener('mousedown', () => glow.classList.remove('on'));
  }

  /* ---------- Effet de vague au clic sur les boutons ---------- */
  document.addEventListener('click', e => {
    if (reduced) return;
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    const size = Math.max(rect.width, rect.height) * 1.6;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  });

  /* ---------- Inclinaison 3D de la carte de démo ---------- */
  const demo = document.querySelector('.demo');
  if (demo && !reduced && hoverCapable) {
    demo.addEventListener('mousemove', e => {
      const r = demo.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - .5;
      const py = (e.clientY - r.top) / r.height - .5;
      demo.style.transform = `perspective(1200px) rotateY(${px * 7}deg) rotateX(${-py * 7}deg)`;
    });
    demo.addEventListener('mouseleave', () => { demo.style.transform = ''; });
  }

  /* ---------- Révélations au défilement (site vitrine) ---------- */
  const revealSelectors = [
    '.hero .pill', '.hero h1', '.hero p.sub', '.hero .actions', '.hero-specs',
    '#solution .eyebrow-num', '#solution h2', '.steps4 > div',
    '#solutions .eyebrow-num', '#solutions h2', '.solutions article',
    '.tech .wrap > div:first-child', '.tech-visual',
    '#realisations .eyebrow-num', '#realisations h2', '.works .work',
    '.cta h2', '.cta .btn'
  ];
  function markReveal(root = document) {
    revealSelectors.forEach(sel => root.querySelectorAll(sel).forEach(el => {
      if (!el.classList.contains('reveal')) el.classList.add('reveal');
    }));
  }
  markReveal();

  const revealIO = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const group = el.parentElement;
      const siblings = group ? [...group.children].filter(c => c.classList.contains('reveal')) : [el];
      const idx = siblings.indexOf(el);
      el.style.transitionDelay = reduced ? '0s' : Math.min(Math.max(idx, 0), 6) * 70 + 'ms';
      el.classList.add('in');
      revealIO.unobserve(el);
    });
  }, { threshold: .15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('.reveal').forEach(el => revealIO.observe(el));

  // Filet de sécurité : si un élément n'a jamais déclenché l'observateur, on le révèle quand même.
  setTimeout(() => document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in')), 4000);

  // Les réalisations peuvent être re-filtrées dynamiquement par app.js : on révèle les nouvelles cartes.
  const worksGrid = document.getElementById('worksGrid');
  if (worksGrid) {
    new MutationObserver(() => {
      worksGrid.querySelectorAll('.work:not(.reveal)').forEach(el => el.classList.add('reveal', 'in'));
    }).observe(worksGrid, { childList: true });
  }

  /* ---------- Compteurs animés ---------- */
  function animateCount(el, duration = 1100) {
    if (reduced) return;
    const finalText = el.textContent;
    const targets = [...finalText.matchAll(/\d+/g)].map(m => parseInt(m[0], 10));
    if (!targets.length) return;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      let i = 0;
      el.textContent = finalText.replace(/\d+/g, () => String(Math.round(targets[i++] * eased)));
      if (p < 1) requestAnimationFrame(frame); else el.textContent = finalText;
    }
    requestAnimationFrame(frame);
  }

  const heroStats = document.querySelectorAll('.hero-specs b');
  if (heroStats.length) {
    const heroIO = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { animateCount(entry.target); heroIO.unobserve(entry.target); }
      });
    }, { threshold: .6 });
    heroStats.forEach(el => heroIO.observe(el));
  }

  // Les tuiles du tableau de bord (#/app/dashboard) sont re-rendues par app.js à chaque visite.
  const appMain = document.getElementById('appMain');
  if (appMain) {
    new MutationObserver(() => {
      appMain.querySelectorAll('.stats4 b').forEach(el => {
        if (el.dataset.counted) return;
        el.dataset.counted = '1';
        animateCount(el);
      });
    }).observe(appMain, { childList: true, subtree: true });
  }
})();
