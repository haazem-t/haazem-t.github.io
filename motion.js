/* ═══════════════════════════════════════════════════════════════════
   MOTION — scroll-linked animation for all pages.

   How it works: for every photo on screen, this measures how far it has
   travelled through the viewport (0 = just entering at the bottom,
   1 = just leaving at the top) and writes that number into a CSS
   variable called --p. All the actual movement happens in style.css,
   which reads --p and turns it into a scale and a slide.

   Nothing here hijacks your scroll. The page always scrolls normally;
   the images just respond to where you already are.

   To turn all motion off, delete the <script src="motion.js"> line
   from the HTML files. The site works fine without it.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // Respect the operating system's "reduce motion" accessibility setting.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  /* ── 1. Wrap every photo in a clipping frame ──────────────────────
     A photo can only scale without spilling over its neighbours if it
     sits inside a box that crops it. Rather than making you edit 30
     bits of HTML, we build those boxes here at load time.            */
  var RATIOS = ['4x3', '1x1', '16x9'];

  document.querySelectorAll('img.photo').forEach(function (img) {
    if (img.parentNode.classList.contains('frame')) return;

    var frame = document.createElement('div');
    frame.className = 'frame';

    RATIOS.forEach(function (r) {
      if (img.classList.contains('photo--' + r)) frame.classList.add('frame--' + r);
    });

    img.parentNode.insertBefore(frame, img);
    frame.appendChild(img);
    frame.setAttribute('data-scroll', '');
  });

  /* ── 2. Track only what's on screen ───────────────────────────────
     Measuring every element on every frame would be wasteful. This
     keeps a live set of the ones currently near the viewport and
     ignores the rest.                                                */
  var tracked = document.querySelectorAll('[data-scroll]');
  var active = [];
  var hero = document.querySelector('.hero__content');
  var queued = false;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var i = active.indexOf(entry.target);
      if (entry.isIntersecting && i === -1) active.push(entry.target);
      else if (!entry.isIntersecting && i !== -1) active.splice(i, 1);
    });
    request();
  }, { rootMargin: '150px 0px' });

  tracked.forEach(function (el) { observer.observe(el); });

  /* ── 3. The measuring loop ────────────────────────────────────────
     Runs at most once per animation frame, never on every scroll event. */
  function measure() {
    var vh = window.innerHeight;

    for (var i = 0; i < active.length; i++) {
      var el = active[i];
      var rect = el.getBoundingClientRect();

      // 0 the instant its top touches the bottom of the screen,
      // 1 the instant its bottom leaves the top of the screen.
      var p = (vh - rect.top) / (vh + rect.height);
      if (p < 0) p = 0; else if (p > 1) p = 1;

      el.style.setProperty('--p', p.toFixed(4));
    }

    // The hero is already on screen at load, so it needs its own measure:
    // how far you've scrolled away from the top.
    if (hero) {
      var hp = window.scrollY / (window.innerHeight * 0.8);
      if (hp < 0) hp = 0; else if (hp > 1) hp = 1;
      hero.style.setProperty('--hp', hp.toFixed(4));
    }

    queued = false;
  }

  function request() {
    if (!queued) { queued = true; requestAnimationFrame(measure); }
  }

  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  window.addEventListener('load', request);
  measure();
})();
