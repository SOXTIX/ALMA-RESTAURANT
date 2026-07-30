/* ALMA — Cocina y Café — interactions & GSAP motion */
(function () {
  document.documentElement.classList.remove('no-js');

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) document.documentElement.classList.add('reduced-motion');

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Hide the floating WhatsApp button while scrolling ----------
     It's fixed in the bottom-right corner, so whatever heading or
     button happens to scroll under it gets visually covered — fading
     it out mid-scroll and back in ~350ms after scrolling stops means
     it only ever sits over content the user has stopped to look at. */
  var floatWa = document.querySelector('.float-whatsapp');
  if (floatWa) {
    var waHideTimer;
    window.addEventListener('scroll', function () {
      floatWa.classList.add('is-hidden');
      clearTimeout(waHideTimer);
      waHideTimer = setTimeout(function () {
        floatWa.classList.remove('is-hidden');
      }, 350);
    }, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var closeBtn = document.querySelector('.mobile-menu-close');
  var menu = document.querySelector('.mobile-menu');
  function openMenu() {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenu);
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', closeMenu);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- Mark active nav link ---------- */
  var here = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-link, .mobile-menu-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === here || (here === '' && href === 'index.html')) {
      a.classList.add('is-active');
    }
  });

  /* ---------- Menu category filter (menu.html) ---------- */
  var tabs = document.querySelectorAll('.menu-tab');
  if (tabs.length) {
    var cats = document.querySelectorAll('.menu-category');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('is-active'); });
        tab.classList.add('is-active');
        var target = tab.getAttribute('data-target');
        if (target === 'all') {
          cats.forEach(function (c) { c.style.display = ''; });
        } else {
          cats.forEach(function (c) {
            c.style.display = (c.getAttribute('data-cat') === target) ? '' : 'none';
          });
        }
      });
    });
  }

  /* ---------- Word-split rise: wraps each word of a heading in a
     masked line so it can rise into place, instead of the whole
     block fading up as one flat unit. Runs before the GSAP branch
     so the markup exists either way; only reduced-motion/no-JS
     leave it as plain static text via CSS. ---------- */
  function splitWords(el) {
    var words = el.textContent.trim().split(/\s+/);
    el.textContent = '';
    words.forEach(function (word, i) {
      var line = document.createElement('span');
      line.className = 'split-line';
      var inner = document.createElement('span');
      inner.className = 'split-word';
      inner.textContent = word;
      line.appendChild(inner);
      el.appendChild(line);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.split-word');
  }

  var splitTargets = [];
  if (window.gsap && !prefersReduced) {
    document.querySelectorAll('.hero-title, .page-hero h1').forEach(function (el) {
      splitTargets.push({ el: el, words: splitWords(el) });
    });
  }

  /* ---------- GSAP elegant motion ---------- */
  if (window.gsap && !prefersReduced) {
    gsap.registerPlugin(ScrollTrigger);
    var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';

    /* Real mobile browsers resize the viewport when the address bar
       shows/hides on scroll. Without this, ScrollTrigger treats that
       as a genuine resize and can recalculate a section's trigger
       point mid-scroll to a position the user has already passed —
       so it never fires, and the section is left stuck at its
       pre-reveal state (blurred/faded/clipped, i.e. looking "cut
       off"). This is the standard GSAP fix for that class of bug. */
    ScrollTrigger.config({ ignoreMobileResize: true });

    /* Web fonts (Bodoni Moda) swapping in after first paint, and
       images finishing their lazy load, both change section heights
       after ScrollTrigger has already measured them. Refresh once
       both have settled so every trigger position is measured
       against final layout, not a transient one. */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }

    /* Hero entrance */
    var heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .fromTo('.site-header', { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.6 }, 0)
      .fromTo('.hero-eyebrow', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7 }, 0.15);

    var heroSplit = splitTargets.find(function (s) { return s.el.classList.contains('hero-title'); });
    if (heroSplit) {
      heroTl.to(heroSplit.words, {
        y: '0%', duration: 1, ease: EASE, stagger: 0.05
      }, 0.3);
    }

    heroTl
      .fromTo('.hero-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, 0.55)
      .fromTo('.hero-actions', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, 0.7)
      .fromTo('.hero-scroll-cue', { opacity: 0 }, { opacity: 1, duration: 0.6 }, 1.0);

    /* Page-hero (Menú/Contacto) heading rise, no full hero timeline there */
    var pageSplit = splitTargets.find(function (s) { return s.el.closest('.page-hero'); });
    if (pageSplit) {
      gsap.to(pageSplit.words, { y: '0%', duration: 0.9, ease: EASE, stagger: 0.05, delay: 0.1 });
    }

    /* Subtle hero image parallax */
    gsap.to('.hero-media img', {
      yPercent: 12,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });

    /* Blur-to-focus scroll reveals — a considered edit, not a fade-up */
    document.querySelectorAll('[data-reveal-group]').forEach(function (group) {
      var items = group.querySelectorAll('.reveal');
      gsap.to(items, {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 1, ease: EASE, stagger: 0.1,
        scrollTrigger: { trigger: group, start: 'top 82%' }
      });
    });
    document.querySelectorAll('.reveal:not([data-reveal-group] .reveal)').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 1, ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 85%' }
      });
    });

    /* Gallery: curtain wipe instead of a fade */
    document.querySelectorAll('.gallery-grid').forEach(function (grid) {
      var items = grid.querySelectorAll('.reveal-clip');
      gsap.to(items, {
        clipPath: 'inset(0% 0 0% 0)',
        duration: 1.1, ease: EASE, stagger: 0.08,
        scrollTrigger: { trigger: grid, start: 'top 80%' }
      });
    });

    /* Section titles: same blur-focus treatment */
    gsap.utils.toArray('.section-title').forEach(function (title) {
      if (title.closest('[data-reveal-group], .reveal')) return;
      gsap.fromTo(title, { opacity: 0, y: 18, filter: 'blur(6px)' }, {
        opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.9, ease: EASE,
        scrollTrigger: { trigger: title, start: 'top 88%' }
      });
    });

    /* CTA band gentle scale-in */
    gsap.utils.toArray('.cta-band').forEach(function (band) {
      gsap.fromTo(band, { opacity: 0, scale: 0.97 }, {
        opacity: 1, scale: 1, duration: 0.9, ease: EASE,
        scrollTrigger: { trigger: band, start: 'top 85%' }
      });
    });

    /* Count-up on the "+8 años" badge — plays once, on arrival */
    document.querySelectorAll('.intro-badge strong').forEach(function (el) {
      var target = parseInt(el.textContent.replace(/\D/g, ''), 10);
      if (!target) return;
      var counter = { val: 0 };
      gsap.to(counter, {
        val: target, duration: 1.3, ease: 'power1.out',
        onUpdate: function () { el.textContent = '+' + Math.round(counter.val); },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });

    /* Magnetic buttons and tilt cards are pointer-hover interactions —
       on a touch device there's no hover, only a tap, which would
       otherwise leave a button nudged sideways or a card tilted until
       the next unrelated tap "resets" it. Skip both entirely there. */
    var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    /* Magnetic buttons — nudges toward the cursor, settles with an
       elastic ease. Kept to primary CTAs only so it stays a detail. */
    if (canHover) document.querySelectorAll('.btn-primary, .btn-whatsapp, .nav-cta, .float-whatsapp').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - (r.left + r.width / 2);
        var y = e.clientY - (r.top + r.height / 2);
        gsap.to(btn, { x: x * 0.25, y: y * 0.35, duration: 0.5, ease: 'power2.out' });
      });
      btn.addEventListener('mouseleave', function () {
        gsap.to(btn, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });

    /* Tilt on feature cards and gallery tiles — a few degrees only.
       Feature cards keep their CSS hover-lift by re-declaring it here,
       since a JS-set inline transform would otherwise silently
       override the stylesheet's :hover translateY. */
    if (canHover) document.querySelectorAll('.feature-card, .gallery-item').forEach(function (card) {
      var lift = card.classList.contains('feature-card') ? -6 : 0;
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(card, {
          rotateY: px * 8, rotateX: py * -8, y: lift,
          duration: 0.5, ease: 'power2.out', transformPerspective: 700
        });
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: 0.6, ease: EASE });
      });
    });

    /* Safety net: if a ScrollTrigger's own element is already on
       screen but its animation never actually played (a stale
       trigger position from the issue above, or anything else), snap
       it to its finished state instead of leaving it permanently
       blurred/faded/clipped. Checked once, shortly after load. */
    window.addEventListener('load', function () {
      setTimeout(function () {
        ScrollTrigger.getAll().forEach(function (st) {
          if (!st.trigger || !st.animation) return;
          var r = st.trigger.getBoundingClientRect();
          var alreadyOnScreen = r.top < window.innerHeight && r.bottom > 0;
          if (alreadyOnScreen && st.animation.progress() === 0) {
            st.animation.progress(1);
          }
        });
      }, 800);
    });

  } else {
    /* No GSAP or reduced motion: make sure content is visible */
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.style.opacity = 1;
      el.style.transform = 'none';
      el.style.filter = 'none';
    });
    document.querySelectorAll('.reveal-clip').forEach(function (el) {
      el.style.clipPath = 'none';
    });
  }
})();
