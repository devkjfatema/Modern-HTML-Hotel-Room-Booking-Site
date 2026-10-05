/* ==========================================================================
   MAIN.JS - the only script for all 4 pages (no libraries, no build step).

   WHAT IT DOES (each feature only runs on the page that has it):
     1. Footer year
     2. Header: turns solid after scrolling (home) + mobile menu
     3. Home: hero slider (autoplay, crossfade, slow zoom, dots, pause)
     4. Gallery: category filter + lightbox
     5. Contact: booking form -> WhatsApp / email message (no backend)
     6. Home: availability bar -> contact form   7. Scroll reveal animations
     8. Page-hero parallax   9. Home: amenities carousel

   EDIT THE TWO BLOCKS BELOW (SITE and HERO). Everything else can stay as is.
   ========================================================================== */
'use strict';

/* --------------------------------------------------------------------------
   SITE DETAILS  - used to build the WhatsApp and email messages.
   TODO: replace the values below. Tip: the HTML pages contain the SAME
   placeholder text, so use "Find and Replace in all files" in your editor
   (see README.md, section 2) and everything updates in one go.
   -------------------------------------------------------------------------- */
const SITE = {
  name: 'Your Guesthouse',            // TODO: replace
  email: 'hello@yourguesthouse.com',  // TODO: replace
  whatsappNumber: '000000000001'      // TODO: replace - international format, digits only (no + or spaces)
};

/* --------------------------------------------------------------------------
   HERO SLIDER SETTINGS (home page)
   slideMs = how long each photo is shown. 4500 = 4.5 seconds.
             Faster: 3500   |   Slower: 6000
   fadeMs  = crossfade length between photos.
   zoom    = how far the photo zooms in during its time (1.12 = 12%).
             Stronger zoom: 1.2   |   No zoom: 1
   -------------------------------------------------------------------------- */
const HERO = {
  slideMs: 4500,
  fadeMs: 900,
  zoom: 1.12
};

/* ==========================================================================
   Helpers
   ========================================================================== */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* WhatsApp direct-message link with a pre-filled, URL-encoded text */
function whatsappUrl(message) {
  const text = encodeURIComponent(message).replace(/'/g, '%27');
  return 'https://wa.me/' + SITE.whatsappNumber + '?text=' + text;
}

/* mailto: link with encoded subject and body */
function mailtoUrl(subject, body) {
  let url = 'mailto:' + SITE.email + '?subject=' + encodeURIComponent(subject);
  if (body) url += '&body=' + encodeURIComponent(body);
  return url;
}

/* Pass the hero timing to the CSS (zoom length = display time + fade) */
document.documentElement.style.setProperty('--kb-duration', HERO.slideMs + HERO.fadeMs + 'ms');
document.documentElement.style.setProperty('--fade', HERO.fadeMs + 'ms');

/* ==========================================================================
   1. FOOTER YEAR
   ========================================================================== */
$$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

/* ==========================================================================
   2. HEADER - solid after 60px of scroll (home) + mobile menu
   ========================================================================== */
(function initHeader() {
  const header = $('.site-header');
  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  if (!header) return;

  /* Home page: transparent over the hero, white after scrolling */
  if (header.classList.contains('site-header--home')) {
    const onScroll = () => header.classList.toggle('is-solid', window.scrollY > 60 || menu.classList.contains('is-open'));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    header._refresh = onScroll;
  }

  if (!toggle || !menu) return;

  function setMenu(open) {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (header._refresh) header._refresh();
    if (open) { const first = $('a', menu); if (first) first.focus(); }
  }

  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  $$('a', menu).forEach((a) => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  /* If the window grows to desktop width, close the mobile menu */
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
})();

/* ==========================================================================
   3. HOME - HERO SLIDER
   - The new photo fades in ON TOP of the old one, so there is never a blank frame.
   - The zoom (Ken Burns) is pure CSS (see @keyframes kenburns in style.css).
   - Photos 2-5 load just before they are needed (data-src / data-srcset).
   - Pauses when the browser tab is hidden. Respects "reduce motion".
   To change photos or captions, edit the slides in index.html.
   ========================================================================== */
(function initHero() {
  const hero = $('.hero');
  if (!hero) return;

  const slides = $$('.hero__slide', hero);
  const count = slides.length;
  const dotsWrap = $('.hero__dots', hero);
  const caption = $('.hero__caption', hero);
  const live = $('.hero__live', hero);
  const pauseBtn = $('.hero__pause', hero);
  const controls = $('.hero__controls', hero);

  let index = 0;
  let prev = null;
  let paused = reducedMotion;      /* no autoplay if the visitor prefers reduced motion */
  let tabHidden = false;
  let timer = null;
  let fadeTimer = null;

  /* The zoom amount comes from HERO.zoom (overrides the default keyframes in style.css) */
  const styleTag = document.createElement('style');
  styleTag.textContent = '@keyframes kenburns{from{transform:scale(1)}to{transform:scale(' + HERO.zoom + ')}}';
  document.head.appendChild(styleTag);

  /* Load a slide's real image (swaps data-src -> src) */
  function load(i) {
    const img = $('img', slides[(i + count) % count]);
    if (!img || !img.dataset.src) return;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    delete img.dataset.src;
    delete img.dataset.srcset;
  }

  /* Build clickable dots */
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'hero__dot';
    dot.setAttribute('aria-label', 'Show slide ' + (i + 1) + ': ' + slide.dataset.label);
    dot.innerHTML = '<span></span>';
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = $$('.hero__dot', hero);

  function isPlaying() { return !paused && !tabHidden; }

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.classList.toggle('is-prev', i === prev);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true'); else dot.removeAttribute('aria-current');
    });
    caption.textContent = slides[index].dataset.label;
    live.textContent = 'Slide ' + (index + 1) + ' of ' + count + ': ' + slides[index].dataset.label;
    live.setAttribute('aria-live', isPlaying() ? 'off' : 'polite');
    hero.classList.toggle('is-paused', !isPlaying());
    pauseBtn.setAttribute('aria-pressed', String(paused));
    pauseBtn.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
    schedule();
  }

  /* Autoplay timer */
  function schedule() {
    clearTimeout(timer);
    if (isPlaying()) timer = setTimeout(() => goTo(index + 1), HERO.slideMs);
  }

  function goTo(n) {
    const target = (n + count) % count;
    if (target === index) return;
    load(target);
    load(target + 1);                    /* get the next one ready */
    prev = index;
    index = target;
    clearTimeout(fadeTimer);
    /* once the crossfade is done, release the old photo (without restarting the autoplay timer) */
    fadeTimer = setTimeout(() => {
      prev = null;
      slides.forEach((s) => s.classList.remove('is-prev'));
    }, HERO.fadeMs);
    render();
  }

  pauseBtn.addEventListener('click', () => { paused = !paused; render(); });
  controls.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === 'ArrowLeft') goTo(index - 1);
  });
  document.addEventListener('visibilitychange', () => { tabHidden = document.hidden; render(); });

  /* Start: show slide 1, and load slide 2 once slide 1 has painted */
  hero.classList.add('is-ready');
  const first = $('img', slides[0]);
  const loadSecond = () => load(1);
  if (first.complete) loadSecond(); else first.addEventListener('load', loadSecond, { once: true });
  render();
})();

/* ==========================================================================
   4. GALLERY - category filter + lightbox
   Photos are listed in gallery.html. Each <li> has data-category.
   ========================================================================== */
(function initGallery() {
  const grid = $('.masonry');
  const box = $('#lightbox');
  if (!grid || !box) return;

  const items = $$('li', grid);
  const status = $('#gallery-status');
  const filterBtns = $$('.filter-btn');
  const img = $('.lightbox__img', box);
  const captionEl = $('#lightbox-caption', box);
  const countEl = $('.lightbox__count', box);
  const closeBtn = $('.lightbox__close', box);
  const stage = $('.lightbox__stage', box);

  let visible = items;     /* photos currently shown (changes with the filter) */
  let current = 0;
  let opener = null;
  let touchX = null;
  let hideTimer = null;

  /* ---- Filter ---- */
  function applyFilter(value) {
    items.forEach((li) => { li.hidden = value !== 'all' && li.dataset.category !== value; });
    visible = items.filter((li) => !li.hidden);
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === value)));
    status.textContent = 'Showing ' + visible.length + ' photos';
  }
  filterBtns.forEach((b) => b.addEventListener('click', () => applyFilter(b.dataset.filter)));

  /* ---- Lightbox ---- */
  function show(i, instant) {
    current = (i + visible.length) % visible.length;
    const btn = $('button', visible[current]);
    const thumb = $('img', btn);
    const swap = () => {
      img.src = thumb.currentSrc || thumb.src;
      img.alt = thumb.alt;
      img.width = thumb.width;
      img.height = thumb.height;
      img.classList.remove('is-changing');
    };
    captionEl.textContent = btn.dataset.caption || thumb.alt;
    countEl.textContent = (current + 1) + ' / ' + visible.length;
    if (instant || reducedMotion) { swap(); } else {
      img.classList.add('is-changing');
      setTimeout(swap, 120);
    }
    /* preload neighbours so next/previous is instant */
    [current - 1, current + 1].forEach((n) => {
      const t = $('img', visible[(n + visible.length) % visible.length]);
      if (t) new Image().src = t.currentSrc || t.src;
    });
  }

  function open(i, trigger) {
    clearTimeout(hideTimer);
    opener = trigger;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = 'hidden';
    document.body.style.paddingRight = scrollbar + 'px';     /* stops the page jumping sideways */
    box.hidden = false;
    show(i, true);
    requestAnimationFrame(() => box.classList.add('is-open'));
    closeBtn.focus();
  }

  function close() {
    box.classList.remove('is-open');
    document.body.style.overflow = '';
    document.body.style.paddingRight = '';
    hideTimer = setTimeout(() => { box.hidden = true; }, reducedMotion ? 0 : 200);
    if (opener) opener.focus();
  }

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    open(visible.indexOf(btn.closest('li')), btn);
  });
  $$('.lightbox__prev', box).forEach((b) => b.addEventListener('click', () => show(current - 1)));
  $$('.lightbox__next', box).forEach((b) => b.addEventListener('click', () => show(current + 1)));
  closeBtn.addEventListener('click', close);

  /* Click the empty space around the photo to close */
  stage.addEventListener('click', (e) => { if (e.target === stage) close(); });

  /* Keyboard: Esc, arrows, and Tab stays inside the dialog (focus trap) */
  document.addEventListener('keydown', (e) => {
    if (box.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') show(current - 1);
    else if (e.key === 'ArrowRight') show(current + 1);
    else if (e.key === 'Tab') {
      const focusable = $$('button', box).filter((b) => b.offsetParent !== null);
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
    }
  });

  /* Swipe left / right on touch screens */
  box.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  box.addEventListener('touchend', (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
    touchX = null;
  });

  applyFilter('all');
})();

/* ==========================================================================
   5. CONTACT - booking form (no backend)
   Checks the fields, then shows two buttons: "Send via WhatsApp" and
   "Send via Email", each pre-filled with the guest's details.
   ========================================================================== */
(function initBooking() {
  const form = $('#booking-form');
  if (!form) return;

  const result = $('#booking-result');
  const waLink = $('#booking-wa');
  const mailLink = $('#booking-mail');
  const f = {
    name: $('#booking-name'),
    checkIn: $('#booking-checkIn'),
    checkOut: $('#booking-checkOut'),
    guests: $('#booking-guests'),
    room: $('#booking-room'),
    message: $('#booking-message')
  };

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
  f.checkIn.min = today;
  f.checkOut.min = today;

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const parse = (iso) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = (iso) => {
    if (!iso) return '';
    const d = parse(iso);
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  };
  const nightsBetween = (a, b) => Math.round((Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))) / 86400000);
  function ymd(iso) { const [y, m, d] = iso.split('-').map(Number); return [y, m - 1, d]; }

  function setError(field, text) {
    const el = $('#booking-' + field + '-error');
    el.textContent = text || '';
    if (text) f[field].setAttribute('aria-invalid', 'true'); else f[field].removeAttribute('aria-invalid');
  }

  function validate() {
    const errors = {};
    if (f.name.value.trim().length < 2) errors.name = 'Please enter your name.';
    if (!f.checkIn.value) errors.checkIn = 'Please choose a check-in date.';
    else if (f.checkIn.value < today) errors.checkIn = 'Check-in can’t be in the past.';
    if (!f.checkOut.value) errors.checkOut = 'Please choose a check-out date.';
    else if (f.checkIn.value && f.checkOut.value <= f.checkIn.value) errors.checkOut = 'Check-out must be after check-in.';
    if (!Number(f.guests.value)) errors.guests = 'Please choose the number of guests.';
    return errors;
  }

  function buildMessage() {
    const nights = f.checkIn.value && f.checkOut.value ? nightsBetween(f.checkIn.value, f.checkOut.value) : 0;
    const lines = [
      'Hello ' + SITE.name + ',',
      '',
      'I’d like to check availability:',
      f.name.value.trim() ? 'Name: ' + f.name.value.trim() : null,
      'Check-in: ' + fmt(f.checkIn.value),
      'Check-out: ' + fmt(f.checkOut.value) + (nights > 0 ? ' (' + nights + ' night' + (nights === 1 ? '' : 's') + ')' : ''),
      'Guests: ' + f.guests.value,
      'Room: ' + f.room.value
    ];
    if (f.message.value.trim()) lines.push('', f.message.value.trim());
    return lines.filter((line) => line !== null).join('\n');
  }

  /* Any change hides the "ready" box and clears that field's error */
  Object.keys(f).forEach((key) => {
    f[key].addEventListener('input', () => {
      result.hidden = true;
      setError(key, '');
      if (key === 'checkIn') f.checkOut.min = f.checkIn.value || today;
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errors = validate();
    Object.keys(f).forEach((key) => setError(key, errors[key]));
    const firstInvalid = Object.keys(errors)[0];
    if (firstInvalid) { result.hidden = true; f[firstInvalid].focus(); return; }

    const text = buildMessage();
    waLink.href = whatsappUrl(text);
    mailLink.href = mailtoUrl('Availability request: ' + fmt(f.checkIn.value) + ' – ' + fmt(f.checkOut.value), text);
    result.hidden = false;
  });

  /* Arrived from the home-page availability bar (?checkin=...&checkout=...&guests=N):
     fill the form and show the send buttons straight away. */
  const params = new URLSearchParams(window.location.search);
  const pIn = params.get('checkin');
  const pOut = params.get('checkout');
  const pGuests = params.get('guests');
  const isoOk = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || '');
  if (isoOk(pIn) && isoOk(pOut) && pIn >= today && pOut > pIn) {
    f.checkIn.value = pIn;
    f.checkOut.min = pIn;
    f.checkOut.value = pOut;
    if (pGuests && Number(pGuests) > 0) {
      const opt = Array.from(f.guests.options).find((o) => o.value === pGuests);
      if (opt) f.guests.value = pGuests;
    }
    const text = buildMessage();
    waLink.href = whatsappUrl(text);
    mailLink.href = mailtoUrl('Availability request: ' + fmt(pIn) + ' – ' + fmt(pOut), text);
    result.hidden = false;
    const note = $('#booking-prefill');
    if (note) {
      note.textContent = 'We filled in your dates: ' + fmt(pIn) + ' – ' + fmt(pOut) + '. Add your name and room below, or send now.';
      note.hidden = false;
    }
  }
})();

/* ==========================================================================
   6. HOME - availability bar (no backend: sends the dates to the contact form)
   ========================================================================== */
(function initAvailability() {
  const form = $('#availability-form');
  if (!form) return;
  const inEl = $('#avail-checkin');
  const outEl = $('#avail-checkout');
  const guests = $('#avail-guests');
  const err = $('#avail-error');

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const addDays = (d, n) => { const c = new Date(d); c.setDate(c.getDate() + n); return c; };
  const now = new Date();
  const today = iso(now);

  inEl.min = today;
  outEl.min = iso(addDays(now, 1));
  inEl.value = today;
  outEl.value = iso(addDays(now, 1));

  inEl.addEventListener('change', () => {
    err.textContent = '';
    if (!inEl.value) return;
    const [y, m, d] = inEl.value.split('-').map(Number);
    const next = iso(addDays(new Date(y, m - 1, d), 1));
    outEl.min = next;
    if (!outEl.value || outEl.value <= inEl.value) outEl.value = next;
  });
  outEl.addEventListener('change', () => { err.textContent = ''; });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let msg = '';
    if (!inEl.value || !outEl.value) msg = 'Please choose both dates.';
    else if (inEl.value < today) msg = 'Check-in can’t be in the past.';
    else if (outEl.value <= inEl.value) msg = 'Check-out must be after check-in.';
    err.textContent = msg;
    if (msg) { (inEl.value ? outEl : inEl).focus(); return; }
    window.location.href = 'contact.html?checkin=' + encodeURIComponent(inEl.value) +
      '&checkout=' + encodeURIComponent(outEl.value) +
      '&guests=' + encodeURIComponent(guests.value) + '#booking';
  });
})();

/* ==========================================================================
   7. SCROLL REVEAL - fades elements with [data-reveal] in as they scroll into view
   ========================================================================== */
(function initReveal() {
  const els = $$('[data-reveal]');
  const root = document.documentElement;
  if (!els.length) return;
  if (reducedMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-visible'));
    root.classList.add('reveal-ready');
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      /* cards inside a sideways carousel are revealed together with their track */
      if (en.target.classList.contains('carousel__track')) $$('[data-reveal]', en.target).forEach((c) => c.classList.add('is-visible'));
      else en.target.classList.add('is-visible');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  els.forEach((el) => io.observe(el.closest('.carousel__track') || el));
  root.classList.add('reveal-ready');
})();

/* ==========================================================================
   8. PAGE HERO - gentle parallax on Rooms / Gallery / Contact
   ========================================================================== */
(function initParallax() {
  const media = $('.page-hero__media');
  if (!media || reducedMotion) return;
  let ticking = false;
  const update = () => {
    media.style.setProperty('--py', Math.min(window.scrollY, 800) * 0.3 + 'px');
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
})();

/* ==========================================================================
   9. HOME - amenities carousel (arrows scroll the cards; swipe works natively)
   ========================================================================== */
(function initCarousel() {
  $$('[data-carousel]').forEach((root) => {
    const track = $('.carousel__track', root);
    const prev = $('[data-carousel-prev]', root);
    const next = $('[data-carousel-next]', root);
    if (!track || !prev || !next) return;
    const step = () => {
      const card = track.firstElementChild;
      return card ? card.getBoundingClientRect().width + 24 : track.clientWidth * 0.8;
    };
    const update = () => {
      prev.disabled = track.scrollLeft <= 2;
      next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 2;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: reducedMotion ? 'auto' : 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  });
})();
